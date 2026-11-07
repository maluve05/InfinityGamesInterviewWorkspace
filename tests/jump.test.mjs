import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../public/src/config.js';
import {
  createGame,
  step,
  tick,
  jumpHeight,
  baseSpeed,
  fullJumpAirtime,
  jumpPhysics,
  minBarrierGap,
  summary,
} from '../public/src/engine.js';

const DT = 1000 / 60;

function quiet(seed = 1) {
  const s = createGame(CONFIG, seed);
  s.items = [];
  s.nextRowZ = 1e9;
  return s;
}

test('a held jump peaks at least 1.3× higher than a tap (jump then jumpRelease 1 tick later) — T8 snappier jump', () => {
  // Held jump: full hold
  let sHeld = quiet();
  sHeld = step(sHeld, { type: 'jump' }).state;
  let peakHeld = 0;
  while (sHeld.jumpMs !== null) {
    sHeld = tick(sHeld, DT).state;
    peakHeld = Math.max(peakHeld, jumpHeight(sHeld));
  }

  // Tap jump: jump then jumpRelease 1 tick later
  let sTap = quiet();
  sTap = step(sTap, { type: 'jump' }).state;
  sTap = tick(sTap, DT).state;
  sTap = step(sTap, { type: 'jumpRelease' }).state;
  let peakTap = 0;
  while (sTap.jumpMs !== null) {
    sTap = tick(sTap, DT).state;
    peakTap = Math.max(peakTap, jumpHeight(sTap));
  }

  assert.ok(
    peakHeld >= 1.3 * peakTap,
    `held peak (${peakHeld.toFixed(3)}m) must be >= 1.3× tap peak (${peakTap.toFixed(3)}m), ratio was ${(peakHeld / peakTap).toFixed(2)}`
  );
});

test('a tap still clears a barrier of heightM (swept: entry and exit both above it). A grounded runner hits it', () => {
  const barrierZ = 2.6;   // a tap peaks ~1.1 m about 3 m out: the barrier sits across the top of the arc

  // Tap jump timed so peak passes over the barrier
  let sTap = createGame(CONFIG, 1);
  sTap.items = [{ id: 100, kind: 'barrier', lane: sTap.lane, z: sTap.distance + barrierZ }];
  sTap.nextRowZ = 1e9;
  sTap = step(sTap, { type: 'jump' }).state;
  sTap = tick(sTap, DT).state;
  sTap = step(sTap, { type: 'jumpRelease' }).state;
  const eventsTap = [];
  while (sTap.distance < barrierZ + 2 && !sTap.over) {
    const r = tick(sTap, DT);
    sTap = r.state;
    eventsTap.push(...r.events);
  }
  assert.equal(sTap.stumbles, 0, 'tap jump should clear the barrier without stumbles');
  assert.ok(eventsTap.some((e) => e.type === 'vault'), 'tap jump emits vault event');

  // Grounded runner with no jump
  let sGrounded = createGame(CONFIG, 1);
  sGrounded.items = [{ id: 101, kind: 'barrier', lane: sGrounded.lane, z: sGrounded.distance + barrierZ }];
  sGrounded.nextRowZ = 1e9;
  const eventsGrounded = [];
  while (sGrounded.distance < barrierZ + 2 && !sGrounded.over) {
    const r = tick(sGrounded, DT);
    sGrounded = r.state;
    eventsGrounded.push(...r.events);
  }
  assert.equal(sGrounded.stumbles, 1, 'grounded runner hits barrier and stumbles');
  assert.ok(eventsGrounded.some((e) => e.type === 'stumble' && e.cause === 'hit'), 'emitted stumble hit event');
});

test('drop mid-air lands sooner than no drop', () => {
  // Jump without drop
  let sNormal = quiet();
  sNormal = step(sNormal, { type: 'jump' }).state;
  let ticksNormal = 0;
  while (sNormal.jumpMs !== null) {
    sNormal = tick(sNormal, DT).state;
    ticksNormal += 1;
  }

  // Jump with drop activated 100ms in
  let sDrop = quiet();
  sDrop = step(sDrop, { type: 'jump' }).state;
  for (let i = 0; i < 6; i += 1) sDrop = tick(sDrop, DT).state;
  const dropRes = step(sDrop, { type: 'drop' });
  sDrop = dropRes.state;
  assert.ok(dropRes.events.some((e) => e.type === 'drop'), 'emitted drop event');
  let ticksDrop = 6;
  while (sDrop.jumpMs !== null) {
    sDrop = tick(sDrop, DT).state;
    ticksDrop += 1;
  }

  assert.ok(ticksDrop < ticksNormal, `drop took ${ticksDrop} ticks vs normal ${ticksNormal} ticks`);
});

test('at top speed, 5 seeds × 3 minutes: barrier gaps >= minGapM and jumping bot never stumbles', () => {
  const topSpeedConfig = {
    ...CONFIG,
    speed: { base: CONFIG.speed.max, max: CONFIG.speed.max, accelPerSec: 0 },
    chaser: { steps: 1e9 },
    stumble: { ...CONFIG.stumble, breakMs: 0 },
  };
  const minGapRequired = minBarrierGap(topSpeedConfig, CONFIG.speed.max);
  const airtime = fullJumpAirtime(topSpeedConfig, CONFIG.speed.max);
  const { v: v0, g } = jumpPhysics(topSpeedConfig, CONFIG.speed.max);
  const hTarget = topSpeedConfig.barrier.heightM;
  const len = topSpeedConfig.barrier.lengthM;
  const speed = CONFIG.speed.max;
  const dt = DT / 1000;

  function canClearFrom(dist) {
    if (dist < 0) return false;
    const t0 = dist / speed;
    const t1 = (dist + len) / speed;
    if (t0 >= airtime) return false; // lands before reaching barrier
    const tStart = Math.max(0, t0);
    const tEnd = Math.min(airtime, t1);
    if (tStart >= tEnd) return false;

    if (t1 >= airtime) return false; // lands on the barrier
    const h0 = v0 * t0 - 0.5 * g * t0 * t0;
    const h1 = v0 * t1 - 0.5 * g * t1 * t1;
    return h0 >= hTarget && h1 >= hTarget; // swept: above it at entry and exit
  }

  for (const seed of [1, 2, 3, 42, 777]) {
    let s = createGame(topSpeedConfig, seed);
    const seenBarriers = [];

    // Helper: test if this is the last frame where a full jump still clears it
    function shouldJumpThisFrame(state) {
      if (state.jumpMs !== null) return false;
      const b = state.items.find(
        (it) => it.kind === 'barrier' && it.lane === state.lane && it.z > state.distance
      );
      if (!b) return false;
      const dist = b.z - state.distance;
      const distNext = dist - speed * dt;

      return canClearFrom(dist) && (!canClearFrom(distNext) || distNext <= 0);
    }

    let hitStumbles = 0;
    let vaults = 0;
    const totalTicks = 180 * 60; // 3 minutes at 60 Hz
    for (let tickIdx = 0; tickIdx < totalTicks && !s.over; tickIdx += 1) {
      // Record any newly spawned barriers
      for (const it of s.items) {
        if (it.kind === 'barrier' && !seenBarriers.some((b) => b.id === it.id)) {
          seenBarriers.push({ id: it.id, z: it.z, lane: it.lane });
        }
      }

      // Bot decides if this is the last frame to jump
      if (shouldJumpThisFrame(s)) {
        s = step(s, { type: 'jump' }).state;
      }

      const r = tick(s, DT);
      s = r.state;
      for (const e of r.events) {
        if (e.type === 'stumble' && e.cause === 'hit') hitStumbles += 1;
        if (e.type === 'vault') vaults += 1;
      }
    }

    // Verify all consecutive barrier gaps along the track
    seenBarriers.sort((a, b) => a.z - b.z);
    for (let i = 0; i < seenBarriers.length - 1; i += 1) {
      const gap = seenBarriers[i + 1].z - seenBarriers[i].z;
      assert.ok(
        gap >= minGapRequired - 1e-4,
        `seed ${seed}: barrier gap ${gap}m at z=${seenBarriers[i].z}m was less than minGapM (${minGapRequired}m)`
      );
    }

    // Bot never stumbles on barriers and vaulted them all
    assert.equal(hitStumbles, 0, `seed ${seed}: bot incurred ${hitStumbles} barrier hit stumbles`);
    assert.ok(vaults > 0, `seed ${seed}: bot vaulted ${vaults} barriers`);
  }
});

test('determinism: same seed and same inputs give the same summary', () => {
  const play = (seed) => {
    let s = createGame(CONFIG, seed);
    for (let i = 0; i < 3600 && !s.over; i += 1) {
      if (i % 50 === 0) s = step(s, { type: i % 100 === 0 ? 'left' : 'right' }).state;
      if (i % 70 === 0) s = step(s, { type: 'jump' }).state;
      if (i % 72 === 0) s = step(s, { type: 'jumpRelease' }).state;
      if (i % 130 === 0) s = step(s, { type: 'drop' }).state;
      s = tick(s, DT).state;
    }
    return summary(s);
  };
  assert.deepEqual(play(42), play(42));
});
