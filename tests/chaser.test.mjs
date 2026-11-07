import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../public/src/config.js';
import { createGame, step, tick, summary } from '../public/src/engine.js';

const DT = 1000 / 60;

const run = (state, ms) => {
  const events = [];
  for (let t = 0; t < ms && !state.over; t += DT) {
    const r = tick(state, DT);
    state = r.state;
    events.push(...r.events);
  }
  return { state, events };
};

const quiet = (seed = 1) => {
  const s = createGame(CONFIG, seed);
  s.items = [];
  s.nextRowZ = 1e9;
  return s;
};

const withGem = (state, color, ahead = 0.5) => {
  const s = structuredClone(state);
  s.items = s.items.filter((it) => !(it.lane === s.lane && it.z <= s.distance + 3));
  s.items.push({ id: 9000 + s.nextId++, kind: 'gem', lane: s.lane, z: s.distance + ahead, color });
  return s;
};

const withBarrier = (state, ahead = 0.5) => {
  const s = structuredClone(state);
  s.items = s.items.filter((it) => !(it.lane === s.lane && it.z <= s.distance + 3));
  s.items.push({ id: 9000 + s.nextId++, kind: 'barrier', lane: s.lane, z: s.distance + ahead });
  return s;
};

const collect = (state, color) => run(withGem(state, color), 120);
const hitBarrier = (state) => run(withBarrier(state), 120);

test('Starts at 0. Three mistakes in any mix (break, hit) → caught on the third, with chaser events step 1, 2 before caught', () => {
  // Test mix: break, hit, break
  let s = quiet();
  assert.equal(s.chaserStep, 0);

  // Mistake 1: break a 1-chain
  s = collect(s, 'ember').state;
  const r1 = collect(s, 'tide');
  s = r1.state;
  assert.equal(s.chaserStep, 1);
  assert.equal(s.over, false);
  const chaser1 = r1.events.find((e) => e.type === 'chaser');
  assert.deepEqual(chaser1, { type: 'chaser', step: 1, dir: 1 });

  // Mistake 2: hit a barrier
  const r2 = hitBarrier(s);
  s = r2.state;
  assert.equal(s.chaserStep, 2);
  assert.equal(s.over, false);
  const chaser2 = r2.events.find((e) => e.type === 'chaser');
  assert.deepEqual(chaser2, { type: 'chaser', step: 2, dir: 1 });

  // Mistake 3: hit another barrier
  const r3 = hitBarrier(s);
  s = r3.state;
  assert.equal(s.chaserStep, 3);
  assert.equal(s.over, true);
  assert.equal(s.cause, 'caught');

  const allEvents = [...r1.events, ...r2.events, ...r3.events];
  const chaserSteps = allEvents.filter((e) => e.type === 'chaser').map((e) => e.step);
  assert.deepEqual(chaserSteps, [1, 2, 3]);

  const caughtIdx = allEvents.findIndex((e) => e.type === 'caught');
  const chaser3Idx = allEvents.findIndex((e) => e.type === 'chaser' && e.step === 3);
  assert.ok(caughtIdx > -1, 'caught event emitted');
  assert.ok(chaser3Idx < caughtIdx, 'chaser step 3 emitted before caught');

  // Also test 3 barrier hits
  let sHits = quiet();
  const rH1 = hitBarrier(sHits);
  assert.equal(rH1.state.chaserStep, 1);
  const rH2 = hitBarrier(rH1.state);
  assert.equal(rH2.state.chaserStep, 2);
  const rH3 = hitBarrier(rH2.state);
  assert.equal(rH3.state.chaserStep, 3);
  assert.equal(rH3.state.over, true);
  assert.equal(rH3.state.cause, 'caught');
});

test('A cashed 3–5 chain does not change chaserStep', () => {
  let s = quiet();
  // Incur 1 barrier hit mistake so chaserStep is 1
  s = hitBarrier(s).state;
  assert.equal(s.chaserStep, 1);

  // Cash in a 3-chain
  for (let i = 0; i < 3; i += 1) s = collect(s, 'sun').state;
  const r3 = collect(s, 'ember'); // switch color to cash 3 suns
  s = r3.state;
  assert.equal(s.chaserStep, 1, 'cashed 3-chain leaves chaserStep unchanged');
  assert.ok(!r3.events.some((e) => e.type === 'chaser'));
  assert.ok(r3.events.some((e) => e.type === 'match' && e.count === 3));

  // Cash in a 4-chain (we already have 1 ember from the previous switch)
  for (let i = 0; i < 3; i += 1) s = collect(s, 'ember').state;
  const r4 = collect(s, 'leaf'); // switch color to cash 4 embers
  s = r4.state;
  assert.equal(s.chaserStep, 1, 'cashed 4-chain leaves chaserStep unchanged');
  assert.ok(!r4.events.some((e) => e.type === 'chaser'));
  assert.ok(r4.events.some((e) => e.type === 'match' && e.count === 4));

  // Cash in a 5-chain (we already have 1 leaf from previous switch)
  for (let i = 0; i < 4; i += 1) s = collect(s, 'leaf').state;
  const r5 = collect(s, 'sun'); // switch color to cash 5 leaves
  s = r5.state;
  assert.equal(s.chaserStep, 1, 'cashed 5-chain leaves chaserStep unchanged');
  assert.ok(!r5.events.some((e) => e.type === 'chaser'));
  assert.ok(r5.events.some((e) => e.type === 'match' && e.count === 5));
});

test('Mistake, mistake, 6-combo → step 1. A 6-combo at step 0 stays at 0 (no banking), and a later mistake → step 1', () => {
  // Scenario 1: mistake (break), mistake (hit), 6-combo -> step 1
  let s1 = quiet();
  s1 = collect(s1, 'ember').state;
  s1 = collect(s1, 'tide').state; // mistake 1 (break) -> step 1 (chain is now tide count 1)
  assert.equal(s1.chaserStep, 1);

  s1 = hitBarrier(s1).state; // mistake 2 (hit) -> step 2 (chain is still tide count 1)
  assert.equal(s1.chaserStep, 2);

  let r6;
  for (let i = 0; i < 5; i += 1) {
    r6 = collect(s1, 'tide'); // complete the 6-chain of tide
    s1 = r6.state;
  }
  assert.equal(s1.chaserStep, 1, '6-combo recovers 1 step');
  assert.ok(r6.events.some((e) => e.type === 'chaser' && e.step === 1 && e.dir === -1));

  // Scenario 2: 6-combo at step 0 stays at 0 (no banking), later mistake -> step 1
  let s0 = quiet();
  assert.equal(s0.chaserStep, 0);

  let r6_0;
  for (let i = 0; i < 6; i += 1) {
    r6_0 = collect(s0, 'sun');
    s0 = r6_0.state;
  }
  assert.equal(s0.chaserStep, 0, 'step 0 remains 0 on 6-combo');
  assert.ok(!r6_0.events.some((e) => e.type === 'chaser'), 'no chaser event emitted at step 0');

  // Later mistake:
  s0 = collect(s0, 'ember').state;
  const rMistake = collect(s0, 'tide');
  s0 = rMistake.state;
  assert.equal(s0.chaserStep, 1, 'later mistake advances to step 1 (no banking)');
  assert.ok(rMistake.events.some((e) => e.type === 'chaser' && e.step === 1 && e.dir === 1));
});

test('An idle runner who never makes a mistake is not caught in 60 s (on a quiet track with no items)', () => {
  const r = run(quiet(), 60000);
  assert.equal(r.state.over, false);
  assert.equal(r.state.chaserStep, 0);
});

test('Tutorial: mistakes during the tutorial do not move the chaser; after done, chaserStep is 0', () => {
  let s = createGame(CONFIG, 1, { tutorial: true });
  assert.equal(s.chaserStep, 0);

  // Advance through lanes and chain steps
  while (s.tutorial.step !== 'jump') {
    if (s.tutorial.targetLane !== null && s.lane !== s.tutorial.targetLane) {
      s = step(s, { type: s.tutorial.targetLane > s.lane ? 'right' : 'left' }).state;
    }
    s = tick(s, DT).state;
  }
  assert.equal(s.tutorial.step, 'jump');

  // Hit the barrier intentionally during jump step
  const barrier = s.items.find((it) => it.kind === 'barrier');
  while (s.items.includes(barrier)) {
    s = tick(s, DT).state;
  }
  assert.equal(s.chaserStep, 0, 'barrier hit during tutorial did not advance chaserStep');
  assert.equal(s.over, false);

  // Now jump the repeated barrier
  const newBarrier = s.items.find((it) => it.kind === 'barrier' && it.z > s.distance);
  while (s.tutorial.step === 'jump') {
    if (newBarrier.z - s.distance <= 14 && s.jumpMs === null) {
      s = step(s, { type: 'jump' }).state;
    }
    s = tick(s, DT).state;
  }
  assert.equal(s.tutorial.step, 'storm', 'vaulting barrier entered storm step');
  assert.equal(s.chaserStep, 1, 'during storm step, chaserStep is 1');

  // Advance through storm step until done
  while (!s.tutorial.done) {
    s = tick(s, DT).state;
  }
  assert.equal(s.tutorial.done, true);
  assert.equal(s.chaserStep, 0, 'after tutorial done, chaserStep resets to 0');
});

test('Determinism test still passes', () => {
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
  assert.deepEqual(play(11), play(11));
  assert.deepEqual(play(42), play(42));
});
