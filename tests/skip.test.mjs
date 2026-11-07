import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../public/src/config.js';
import {
  createGame,
  step,
  tick,
  minBarrierGap,
  jumpHeight,
} from '../public/src/engine.js';

const DT = 1000 / 60;

function quiet(seed = 1) {
  const s = createGame(CONFIG, seed);
  s.items = [];
  s.nextRowZ = 1e9;
  return s;
}

const run = (state, ms) => {
  const events = [];
  for (let t = 0; t < ms && !state.over; t += DT) {
    const r = tick(state, DT);
    state = r.state;
    events.push(...r.events);
  }
  return { state, events };
};

test('A grounded runner collects a gem in its lane (as now)', () => {
  let s = quiet();
  s.items = [{ id: 1, kind: 'gem', lane: s.lane, z: s.distance + 2, color: 'ember' }];
  const r = run(s, 200);
  assert.equal(r.state.gems, 1);
  assert.deepEqual(r.state.chain, { color: 'ember', count: 1 });
  assert.ok(r.events.some((e) => e.type === 'collect' && e.color === 'ember'));
  assert.ok(!r.events.some((e) => e.type === 'skip'));
});

test('A runner at full-jump height passing a gem: no collect, a skip event, chain unchanged, no stumble, chaserStep unchanged', () => {
  let s = quiet();
  s.chain = { color: 'ember', count: 1 };
  s.chaserStep = 1;
  const initialGems = s.gems;

  // Peak of full jump occurs at t = 10.2 / 30 = 0.34s.
  // At speed 15 m/s, peak is at 15 * 0.34 = 5.1m.
  const gemZ = 5.1;
  s.items = [{ id: 42, kind: 'gem', lane: s.lane, z: gemZ, color: 'tide' }];

  s = step(s, { type: 'jump' }).state;
  const r = run(s, 750); // run until jump finishes and runner lands

  assert.equal(r.state.gems, initialGems, 'gems count unchanged');
  assert.deepEqual(r.state.chain, { color: 'ember', count: 1 }, 'chain unchanged');
  assert.equal(r.state.stumbles, 0, 'no stumble');
  assert.equal(r.state.chaserStep, 1, 'chaserStep unchanged');
  assert.ok(!r.events.some((e) => e.type === 'collect'), 'no collect event');
  const skipEvent = r.events.find((e) => e.type === 'skip');
  assert.ok(skipEvent, 'emitted skip event');
  assert.deepEqual(skipEvent, { type: 'skip', color: 'tide', lane: 1, id: 42 });
  assert.equal(r.state.items.length, 0, 'gem removed from items');
});

test('T8: airborne means no pickup — a tap skips too, and so do jumps started 1 m or 4 m before a gem', () => {
  for (const [lead, tap] of [[3.8, true], [1, false], [4, false]]) {
    let s = quiet();
    const gemZ = s.distance + lead;
    s.items = [{ id: 43, kind: 'gem', lane: s.lane, z: gemZ, color: 'leaf' }];
    s = step(s, { type: 'jump' }).state;
    s = tick(s, DT).state;
    if (tap) s = step(s, { type: 'jumpRelease' }).state;
    const events = [];
    while (s.distance < gemZ + 2 && !s.over) { const r = tick(s, DT); s = r.state; events.push(...r.events); }
    assert.equal(s.gems, 0, `lead ${lead} m: gem was not collected`);
    assert.ok(events.some((e) => e.type === 'skip' && e.color === 'leaf'), `lead ${lead} m: skip event`);
    assert.deepEqual(s.chain, { color: null, count: 0 });
  }
});

test('T8: rows are at least 15 m apart and a full jump lasts at most 0.5 s with peak 1.6-1.75 m', () => {
  const s = createGame(CONFIG, 3);
  const zs = [...new Set(s.items.map((it) => it.z))].sort((a, b) => a - b);
  for (let i = 1; i < zs.length; i += 1) assert.ok(zs[i] - zs[i - 1] >= 15 - 1e-9, `rows ${zs[i - 1]} → ${zs[i]}`);
  let j = step(quiet(), { type: 'jump' }).state, ms = 0, peak = 0;
  while (j.jumpMs !== null && ms < 2000) {
    j = tick(j, DT).state;
    ms += DT;
    peak = Math.max(peak, jumpHeight(j));
  }
  assert.ok(ms <= 500 + 1e-6, `airtime ${ms} ms`);
  assert.ok(peak >= 1.6 && peak <= 1.75, `peak ${peak} m not in [1.6, 1.75]`);
});

test('T8: chain-following bot reaches 1,000 points in under 60 s on 3 seeds', () => {
  const times = [];
  for (const seed of [1, 2, 42]) {
    let s = createGame(CONFIG, seed);
    let timeS = 0;
    while (s.score < 1000 && !s.over && timeS < 60) {
      const nextGems = s.items
        .filter((it) => it.kind === 'gem' && it.z > s.distance)
        .sort((a, b) => a.z - b.z);
      if (nextGems.length > 0) {
        const nextZ = nextGems[0].z;
        const rowGems = nextGems.filter((it) => Math.abs(it.z - nextZ) < 0.1);
        let target = null;
        if (s.chain.count > 0) {
          target = rowGems.find((g) => g.color === s.chain.color);
        }
        if (!target) {
          target = rowGems.find((g) => g.color === s.thread.color) || rowGems[0];
        }
        if (target) {
          if (target.lane < s.lane) s = step(s, { type: 'left' }).state;
          else if (target.lane > s.lane) s = step(s, { type: 'right' }).state;
        }
      }
      s = tick(s, DT).state;
      timeS += DT / 1000;
    }
    assert.ok(s.score >= 1000, `seed ${seed} score ${s.score}`);
    assert.ok(timeS < 60, `seed ${seed} took ${timeS}s`);
    times.push({ seed, timeS: timeS.toFixed(2), score: s.score });
  }
  assert.equal(times.length, 3);
});

test('Chain survives a skip: collect ember ×2, skip a tide gem by jumping, collect ember → chain is ember ×3', () => {
  let s = quiet();

  // 1. Collect ember x 2
  s.items = [
    { id: 1, kind: 'gem', lane: s.lane, z: 2, color: 'ember' },
    { id: 2, kind: 'gem', lane: s.lane, z: 5, color: 'ember' },
  ];
  let r = run(s, 400);
  s = r.state;
  assert.deepEqual(s.chain, { color: 'ember', count: 2 });

  // 2. Place a tide gem at jump peak ahead, jump over it
  const jumpStartZ = s.distance;
  const tideZ = jumpStartZ + 5.1;
  s.items = [{ id: 3, kind: 'gem', lane: s.lane, z: tideZ, color: 'tide' }];
  s = step(s, { type: 'jump' }).state;

  // Run until landed
  while (s.jumpMs !== null) {
    const tickRes = tick(s, DT);
    s = tickRes.state;
    r.events.push(...tickRes.events);
  }
  assert.ok(r.events.some((e) => e.type === 'skip' && e.color === 'tide'), 'skipped tide gem');
  assert.deepEqual(s.chain, { color: 'ember', count: 2 }, 'chain still ember x2 after skip');
  assert.equal(s.stumbles, 0);
  assert.equal(s.chaserStep, 0);

  // 3. Collect ember gem 3 on ground
  s.items = [{ id: 4, kind: 'gem', lane: s.lane, z: s.distance + 2, color: 'ember' }];
  s = run(s, 200).state;
  assert.deepEqual(s.chain, { color: 'ember', count: 3 }, 'chain grew to ember x3');
  assert.equal(s.stumbles, 0);
  assert.equal(s.chaserStep, 0);
});

test('Over 5 seeds × 3 minutes of generated track at top speed: no gem in a barrier\'s lane sits closer than minGapM after that barrier, and every row still has a ground-collectable thread gem', () => {
  const topSpeedConfig = {
    ...CONFIG,
    speed: { base: CONFIG.speed.max, max: CONFIG.speed.max, accelPerSec: 0 },
    chaser: { steps: 1e9 },
    stumble: { ...CONFIG.stumble, breakMs: 0 },
  };
  const minGapRequired = minBarrierGap(topSpeedConfig, CONFIG.speed.max);

  for (const seed of [1, 2, 3, 42, 777]) {
    let s = createGame(topSpeedConfig, seed);
    const seenItems = [];
    const seenItemIds = new Set();

    const totalTicks = 180 * 60; // 3 minutes at 60 Hz
    for (let i = 0; i < totalTicks && !s.over; i += 1) {
      for (const it of s.items) {
        if (!seenItemIds.has(it.id)) {
          seenItemIds.add(it.id);
          seenItems.push({ ...it });
        }
      }
      s = tick(s, DT).state;
    }

    const barriers = seenItems.filter((it) => it.kind === 'barrier');
    const gems = seenItems.filter((it) => it.kind === 'gem');

    // 1. For every barrier, no gem in the same lane sits closer than minGapRequired after that barrier
    for (const b of barriers) {
      const gemsInLaneAfterBarrier = gems.filter((g) => g.lane === b.lane && g.z > b.z);
      for (const g of gemsInLaneAfterBarrier) {
        const gap = g.z - b.z;
        assert.ok(
          gap >= minGapRequired - 1e-4,
          `seed ${seed}: gem at z=${g.z} in lane ${g.lane} was only ${gap.toFixed(2)}m after barrier at z=${b.z} (minGap: ${minGapRequired.toFixed(2)}m)`
        );
      }
    }

    // 2. Every row still has a ground-collectable thread gem
    const rows = new Map();
    for (const it of seenItems) {
      if (!rows.has(it.z)) rows.set(it.z, []);
      rows.get(it.z).push(it);
    }

    for (const [z, itemsInRow] of rows.entries()) {
      // Rows where the scoring thread crosses a barrier (owner review 16:39) ask for a jump instead.
      if (itemsInRow.some((it) => it.kind === 'barrier')) continue;
      const gemsInRow = itemsInRow.filter((it) => it.kind === 'gem');
      if (gemsInRow.length === 0) continue; // the thread gem waits for the landing after a thread barrier

      const groundCollectable = gemsInRow.some((gem) => {
        const barrierAtSameZ = itemsInRow.some((it) => it.kind === 'barrier' && it.lane === gem.lane);
        if (barrierAtSameZ) return false;
        const priorBarrierInLane = barriers.filter(
          (b) => b.lane === gem.lane && b.z < z && (z - b.z) < minGapRequired - 1e-4
        );
        return priorBarrierInLane.length === 0;
      });

      assert.ok(
        groundCollectable,
        `seed ${seed}: row at z=${z} has no ground-collectable thread gem`
      );
    }
  }
});


test('a jump skips only gems it is high over: the next gem after landing is collected on the ground', () => {
  let s = quiet();
  s.items = [
    { id: 1, kind: 'gem', lane: s.lane, z: s.distance + 6, color: 'tide' },
    { id: 2, kind: 'gem', lane: s.lane, z: s.distance + 30, color: 'ember' },
  ];
  s = step(s, { type: 'jump' }).state;
  while (s.distance < 33 && !s.over) s = tick(s, DT).state;
  assert.equal(s.gems, 1);
  assert.deepEqual(s.chain, { color: 'ember', count: 1 });
});
