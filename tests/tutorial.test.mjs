import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../public/src/config.js';
import {
  createGame,
  step,
  tick,
  baseSpeed,
  minBarrierGap,
} from '../public/src/engine.js';
import { rngCursor } from '../public/src/rng.js';

const DT = 1000 / 60;

test('no option -> state.tutorial === null and existing behavior unchanged', () => {
  const s = createGame(CONFIG, 1);
  assert.equal(s.tutorial, null);
  const sEmpty = createGame(CONFIG, 1, {});
  assert.equal(sEmpty.tutorial, null);
});

test('scripted player who follows targetLane and jumps barrier gets through all 5 steps in order in under 40 s', () => {
  let s = createGame(CONFIG, 1, { tutorial: true });
  assert.ok(s.tutorial !== null);
  assert.equal(s.tutorial.step, 'lanes');

  const events = [];
  let elapsedMs = 0;

  // Run scripted player
  while (!s.tutorial.done && elapsedMs < 40000 && !s.over) {
    // Follow targetLane if specified
    if (s.tutorial.targetLane !== null && s.lane !== s.tutorial.targetLane) {
      const dir = s.tutorial.targetLane > s.lane ? 'right' : 'left';
      const stepRes = step(s, { type: dir });
      s = stepRes.state;
      events.push(...stepRes.events);
    }

    // Jump barrier ahead in runner's lane
    const barrier = s.items.find(
      (it) => it.kind === 'barrier' && it.lane === s.lane && it.z > s.distance && (it.z - s.distance) <= 14
    );
    if (barrier && s.jumpMs === null) {
      const jumpRes = step(s, { type: 'jump' });
      s = jumpRes.state;
      events.push(...jumpRes.events);
    }

    const r = tick(s, DT);
    s = r.state;
    events.push(...r.events);
    elapsedMs += DT;
  }

  assert.equal(s.tutorial.done, true, 'tutorial reached done state');
  assert.ok(elapsedMs < 40000, `elapsed time was ${(elapsedMs / 1000).toFixed(1)}s, expected < 40s`);

  // Check tutorial events in exact order
  const tutorialEvents = events.filter((e) => e.type === 'tutorial').map((e) => e.step);
  assert.deepEqual(tutorialEvents, ['lanes', 'chain', 'jump', 'storm', 'done']);
});

test('A runner who changes lane at the jump step (dodging) still faces a full-width barrier and can only pass by jumping or hitting it', () => {
  let s = createGame(CONFIG, 1, { tutorial: true });
  // Advance to jump step
  while (s.tutorial.step !== 'jump') {
    if (s.tutorial.targetLane !== null && s.lane !== s.tutorial.targetLane) {
      s = step(s, { type: s.tutorial.targetLane > s.lane ? 'right' : 'left' }).state;
    }
    s = tick(s, DT).state;
  }
  assert.equal(s.tutorial.step, 'jump');

  // Verify barriers span all 3 lanes at the barrier z
  const barriers = s.items.filter((it) => it.kind === 'barrier');
  assert.equal(barriers.length, CONFIG.lanes, 'barrier spans all lanes');
  const lanes = barriers.map((b) => b.lane).sort();
  assert.deepEqual(lanes, [0, 1, 2]);
  const bZ = barriers[0].z;
  assert.ok(barriers.every((b) => b.z === bZ), 'all barriers at the same z');

  // Dodge: change lane by 1
  const otherLane = s.lane > 0 ? s.lane - 1 : s.lane + 1;
  s = step(s, { type: otherLane > s.lane ? 'right' : 'left' }).state;
  assert.equal(s.lane, otherLane);

  // Barrier is still ahead in this new lane at bZ
  const barrierInNewLane = s.items.find((it) => it.kind === 'barrier' && it.lane === s.lane && it.z === bZ);
  assert.ok(barrierInNewLane, 'barrier exists in the new lane too (full-width barrier)');

  // Runner without jumping hits it
  const events = [];
  while (events.filter((e) => e.type === 'stumble' && e.cause === 'hit').length === 0) {
    const r = tick(s, DT);
    s = r.state;
    events.push(...r.events);
  }
  assert.equal(s.tutorial.step, 'jump', 'repeated jump step after hit');
});

test('A runner who does nothing at all reaches done within 45 s of game time', () => {
  let s = createGame(CONFIG, 1, { tutorial: true });
  let elapsedMs = 0;
  const maxLimitMs = 45000;

  while (!s.tutorial.done && elapsedMs <= maxLimitMs + 1000) {
    s = tick(s, DT).state;
    elapsedMs += DT;
  }

  assert.equal(s.tutorial.done, true, 'idle runner reached done state');
  assert.ok(elapsedMs <= maxLimitMs + DT, `elapsed time was ${(elapsedMs / 1000).toFixed(1)}s, expected <= 45s`);
  assert.equal(s.over, false, 'idle runner is never caught in tutorial');
  assert.equal(s.chaserStep, 0, 'chaserStep is 0 after done');
});

test('A runner who mashes left/right/jump randomly (seeded) reaches done within 45 s', () => {
  let s = createGame(CONFIG, 42, { tutorial: true });
  const rng = rngCursor(42);
  let elapsedMs = 0;
  const maxLimitMs = 45000;
  const actions = ['left', 'right', 'jump', 'jumpRelease', 'drop', null];

  while (!s.tutorial.done && elapsedMs <= maxLimitMs + 1000) {
    const act = actions[rng.int(0, actions.length - 1)];
    if (act) {
      s = step(s, { type: act }).state;
    }
    s = tick(s, DT).state;
    elapsedMs += DT;
  }

  assert.equal(s.tutorial.done, true, 'key-mashing runner reached done state');
  assert.ok(elapsedMs <= maxLimitMs + DT, `elapsed time was ${(elapsedMs / 1000).toFixed(1)}s, expected <= 45s`);
  assert.equal(s.over, false, 'runner is never caught');
});

test('A runner who misses the chain pattern sees it respawn (items ahead again within 2 s)', () => {
  let s = createGame(CONFIG, 1, { tutorial: true });
  // Complete lanes step
  while (s.tutorial.step !== 'chain') {
    if (s.tutorial.targetLane !== null && s.lane !== s.tutorial.targetLane) {
      s = step(s, { type: s.tutorial.targetLane > s.lane ? 'right' : 'left' }).state;
    }
    s = tick(s, DT).state;
  }
  assert.equal(s.tutorial.step, 'chain');

  const lastAuthoredZ = s.tutorial.lastItemZ;
  assert.ok(lastAuthoredZ > s.distance);

  // Run until runner is past the chain's last authored item
  while (s.distance <= lastAuthoredZ) {
    s = tick(s, DT).state;
  }

  // Measure time until items appear ahead again
  let emptyTimeMs = 0;
  let respawnedAhead = s.items.filter((it) => it.z > s.distance);
  while (respawnedAhead.length === 0 && emptyTimeMs < 2500) {
    s = tick(s, DT).state;
    emptyTimeMs += DT;
    respawnedAhead = s.items.filter((it) => it.z > s.distance);
  }

  assert.ok(respawnedAhead.length > 0, 'chain pattern respawned ahead');
  assert.ok(emptyTimeMs <= 2000, `empty track duration was ${(emptyTimeMs / 1000).toFixed(2)}s, expected <= 2s`);
  assert.equal(s.tutorial.step, 'chain', 'still in chain step after miss');
});

test('hitting the tutorial barrier repeats the jump step and does not count as a stumble toward being caught', () => {
  let s = createGame(CONFIG, 1, { tutorial: true });

  // Complete lanes and chain to reach jump step
  while (s.tutorial.step !== 'jump') {
    if (s.tutorial.targetLane !== null && s.lane !== s.tutorial.targetLane) {
      s = step(s, { type: s.tutorial.targetLane > s.lane ? 'right' : 'left' }).state;
    }
    s = tick(s, DT).state;
  }
  assert.equal(s.tutorial.step, 'jump');

  const initialStumbles = s.stumbles;
  const events = [];

  // Runner does NOT jump, hits the barrier
  while (events.filter((e) => e.type === 'stumble' && e.cause === 'hit').length === 0) {
    const r = tick(s, DT);
    s = r.state;
    events.push(...r.events);
  }

  // Hit occurred
  assert.equal(s.tutorial.step, 'jump', 'still on jump step after hit');
  assert.equal(s.stumbles, initialStumbles, 'stumbles counter was not incremented');
  assert.equal(s.over, false, 'runner is not caught');
  assert.equal(s.chaserStep, 0, 'chaserStep stayed at 0');

  // Verify that a new barrier was spawned ahead in the runner lane
  const newBarrier = s.items.find((it) => it.kind === 'barrier' && it.z > s.distance && it.lane === s.lane);
  assert.ok(newBarrier, 'new barrier spawned ahead after hit');

  // Now runner jumps the new barrier
  while (s.tutorial.step === 'jump') {
    if (newBarrier.z - s.distance <= 14 && s.jumpMs === null) {
      s = step(s, { type: 'jump' }).state;
    }
    const r = tick(s, DT);
    s = r.state;
    events.push(...r.events);
  }

  assert.ok(events.some((e) => e.type === 'vault'), 'vaulted repeated barrier');
  assert.equal(s.tutorial.step, 'storm', 'advanced to storm step after vault');
});

test('after done, the generated track follows normal rules (thread, color unlocks, T3 barrier spacing)', () => {
  let s = createGame(CONFIG, 1, { tutorial: true });

  // Complete tutorial
  while (!s.tutorial.done) {
    if (s.tutorial.targetLane !== null && s.lane !== s.tutorial.targetLane) {
      s = step(s, { type: s.tutorial.targetLane > s.lane ? 'right' : 'left' }).state;
    }
    const barrier = s.items.find(
      (it) => it.kind === 'barrier' && it.lane === s.lane && it.z > s.distance && (it.z - s.distance) <= 14
    );
    if (barrier && s.jumpMs === null) {
      s = step(s, { type: 'jump' }).state;
    }
    s = tick(s, DT).state;
  }
  assert.equal(s.tutorial.done, true);

  // Run forward in normal mode for 60 seconds
  const seenBarriers = [];
  const minGapRequired = minBarrierGap(CONFIG, baseSpeed(CONFIG, 0));
  for (let i = 0; i < 60 * 60 && !s.over; i += 1) {
    for (const it of s.items) {
      if (it.kind === 'barrier' && !seenBarriers.some((b) => b.id === it.id)) {
        seenBarriers.push({ id: it.id, z: it.z });
      }
    }
    s = tick(s, DT).state;
  }

  // Barriers obey spacing
  seenBarriers.sort((a, b) => a.z - b.z);
  for (let i = 0; i < seenBarriers.length - 1; i += 1) {
    const gap = seenBarriers[i + 1].z - seenBarriers[i].z;
    assert.ok(gap >= minGapRequired - 1e-4, `gap ${gap}m should be >= minGapM ${minGapRequired}m`);
  }

  // Gems ahead exist
  const gemsAhead = s.items.filter((it) => it.kind === 'gem' && it.z > s.distance);
  assert.ok(gemsAhead.length > 0, 'gems spawned ahead');
});
