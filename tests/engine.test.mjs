import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../public/src/config.js';
import { createGame, step, tick, chainPoints, baseSpeed, jumpHeight, summary, fullJumpAirtime } from '../public/src/engine.js';

const DT = 1000 / 60;
const run = (state, ms) => {
  const events = [];
  for (let t = 0; t < ms && !state.over; t += DT) { const r = tick(state, DT); state = r.state; events.push(...r.events); }
  return { state, events };
};
// Put a single gem right in front of the runner in its lane.
const withGem = (state, color, ahead = 0.5) => {
  const s = structuredClone(state);
  s.items = s.items.filter((it) => !(it.lane === s.lane && it.z <= s.distance + 3));
  s.items.push({ id: 9000 + s.nextId++, kind: 'gem', lane: s.lane, z: s.distance + ahead, color });
  return s;
};
const collect = (state, color) => run(withGem(state, color), 120);
const quiet = (seed = 1) => { const s = createGame(CONFIG, seed); s.items = []; s.nextRowZ = 1e9; return s; };

test('scoring table: 1–2 nothing, 3→100, 4→200, 5→300, 6→400', () => {
  assert.deepEqual([1, 2, 3, 4, 5, 6].map((n) => chainPoints(CONFIG, n)), [0, 0, 1, 2, 3, 4].map((k) => k * CONFIG.chain.pointsPerStep));
});

test('same-colour gems build one chain', () => {
  let s = quiet();
  for (let i = 0; i < 4; i += 1) s = collect(s, 'ember').state;
  assert.deepEqual(s.chain, { color: 'ember', count: 4 });
  assert.equal(s.score, 0);
});

test('a different colour cashes in a 3+ chain with points and no stumble', () => {
  let s = quiet();
  for (let i = 0; i < 4; i += 1) s = collect(s, 'ember').state;
  const r = collect(s, 'tide');
  assert.equal(r.state.score, 2 * CONFIG.chain.pointsPerStep);
  assert.equal(r.state.stumbles, 0);
  assert.deepEqual(r.state.chain, { color: 'tide', count: 1 });
  const m = r.events.find((e) => e.type === 'match');
  assert.equal(m.multiplier, 2);
});

test('scoring scales with speed as the runner gets faster (up to 2.5x)', () => {
  let s = quiet();
  s = collect(s, 'ember').state;
  s = collect(s, 'ember').state;
  s = collect(s, 'ember').state;
  const baseRes = collect(s, 'tide');
  assert.equal(baseRes.state.score, 1 * CONFIG.chain.pointsPerStep);

  // At top speed (max speed = 2.5x base):
  let sFast = quiet();
  sFast.timeMs = 1e9;
  sFast = collect(sFast, 'ember').state;
  sFast = collect(sFast, 'ember').state;
  sFast = collect(sFast, 'ember').state;
  const fastRes = collect(sFast, 'tide');
  assert.equal(fastRes.state.score, Math.round(1 * CONFIG.chain.pointsPerStep * 2.5));
});

test('breaking a 1–2 chain scores nothing and makes the runner stumble', () => {
  let s = quiet();
  s = collect(s, 'ember').state;
  s = collect(s, 'ember').state;
  const r = collect(s, 'leaf');
  assert.equal(r.state.score, 0);
  assert.equal(r.state.stumbles, 1);
  assert.ok(r.events.some((e) => e.type === 'break' && e.count === 2));
  assert.ok(r.state.stumbleMs > 0);
});

test('a 6-chain bursts on its own, scores 400 and pushes the chaser back', () => {
  let s = quiet();
  s.chaserStep = 2;
  for (let i = 0; i < 6; i += 1) s = collect(s, 'sun').state;
  assert.equal(s.score, 4 * CONFIG.chain.pointsPerStep);
  assert.equal(s.maxChains, 1);
  assert.deepEqual(s.chain, { color: null, count: 0 });
  assert.equal(s.chaserStep, 1);
});

test('a barrier stumbles a grounded runner but is cleared mid-jump', () => {
  const put = (s) => { s = structuredClone(s); s.items.push({ id: 1, kind: 'barrier', lane: s.lane, z: s.distance + 3 }); return s; };
  const grounded = run(put(quiet()), 400);
  assert.equal(grounded.state.stumbles, 1);
  let air = quiet();
  air = step(air, { type: 'jump' }).state;
  air = run(air, 120).state;           // rising
  assert.ok(jumpHeight(air) > CONFIG.jump.clearHeight);
  const vault = run(put(air), 200);
  assert.equal(vault.state.stumbles, 0);
  assert.ok(vault.events.some((e) => e.type === 'vault'));
});

test('lanes stay within the road and the jump lands', () => {
  let s = quiet();
  s = step(s, { type: 'left' }).state; s = step(s, { type: 'left' }).state;
  assert.equal(s.lane, 0);
  assert.equal(step(s, { type: 'left' }).events[0].type, 'edge');
  s = step(s, { type: 'right' }).state; s = step(s, { type: 'right' }).state; s = step(s, { type: 'right' }).state;
  assert.equal(s.lane, 2);
  s = step(s, { type: 'jump' }).state;
  const airtimeMs = fullJumpAirtime(CONFIG) * 1000;
  const r = run(s, airtimeMs + 50);
  assert.equal(r.state.jumpMs, null);
  assert.ok(r.events.some((e) => e.type === 'land'));
});

test('speed ramps up and is capped', () => {
  assert.equal(baseSpeed(CONFIG, 0), CONFIG.speed.base);
  assert.ok(baseSpeed(CONFIG, 60000) > CONFIG.speed.base);
  assert.equal(baseSpeed(CONFIG, 1e9), CONFIG.speed.max);
});

test('a runner who keeps stumbling gets caught', () => {
  let s = quiet();
  const events = [];
  for (let i = 0; i < 3 && !s.over; i += 1) {
    s = structuredClone(s);
    s.items.push({ id: 100 + i, kind: 'barrier', lane: s.lane, z: s.distance + 2 });
    const r = run(s, 200);
    s = r.state;
    events.push(...r.events);
  }
  assert.equal(s.over, true);
  assert.equal(s.cause, 'caught');
  assert.ok(events.some((e) => e.type === 'caught'));
  assert.deepEqual(tick(s, DT).events, []);
});

test('an idle runner who never stumbles is not caught in the first minute', () => {
  const r = run(quiet(), 60000);
  assert.equal(r.state.over, false);
  assert.equal(r.state.chaserStep, 0);
});

test('the track always has gems ahead, inside the lanes, never a fully blocked row', () => {
  for (const seed of [1, 2, 3, 42, 777]) {
    let s = createGame(CONFIG, seed);
    for (let k = 0; k < 20; k += 1) {
      s = run(s, 3000).state;
      if (s.over) break;
      const ahead = s.items.filter((it) => it.z > s.distance);
      assert.ok(ahead.some((it) => it.kind === 'gem'), `seed ${seed}: no gems ahead`);
      for (const it of s.items) assert.ok(it.lane >= 0 && it.lane < CONFIG.lanes);
      const rows = new Map();
      for (const it of ahead) rows.set(it.z, [...(rows.get(it.z) ?? []), it]);
      for (const row of rows.values()) {
        assert.ok(row.filter((it) => it.kind === 'barrier').length < CONFIG.lanes);
        assert.ok(row.some((it) => it.kind === 'gem'), `seed ${seed}: empty row`);
      }
    }
  }
});

test('no barriers in the opening stretch', () => {
  const s = createGame(CONFIG, 5);
  assert.ok(s.items.filter((it) => it.kind === 'barrier').every((it) => it.z >= CONFIG.spawn.barriersFromM));
});

test('same seed, same inputs → same run (determinism)', () => {
  const play = (seed) => {
    let s = createGame(CONFIG, seed);
    for (let i = 0; i < 3600 && !s.over; i += 1) {
      if (i % 50 === 0) s = step(s, { type: i % 100 === 0 ? 'left' : 'right' }).state;
      if (i % 70 === 0) s = step(s, { type: 'jump' }).state;
      s = tick(s, DT).state;
    }
    return summary(s);
  };
  assert.deepEqual(play(11), play(11));
  assert.notDeepEqual(play(11).distance + play(11).score, -1);
});

test('the setting changes as the runner goes further', () => {
  let s = quiet();
  s.distance = CONFIG.setting.lengthM - 1;
  const r = run(s, 300);
  assert.equal(r.state.setting, 1);
  assert.ok(r.events.some((e) => e.type === 'setting' && e.index === 1));
});

// ---- Playtest 1 (14:51): colour unlocks by score, mixed rows, storm starts far away ----
import { colorCountFor } from '../public/src/engine.js';

test('colours unlock by score: 3 at the start, 4 from 1,000, 5 from 3,000', () => {
  assert.deepEqual([0, 999, 1000, 2999, 3000, 9999].map((n) => colorCountFor(CONFIG, n)), [3, 3, 4, 4, 5, 5]);
});

test('a run starts with only the first 3 colours on the track', () => {
  // Unlocks pushed out of reach: this checks the starting palette, not the score pace.
  const noUnlock = { ...CONFIG, colorUnlocks: [{ score: 0, count: 3 }, { score: 1e12, count: 4 }, { score: 2e12, count: 5 }] };
  for (const seed of [1, 2, 3]) {
    let s = createGame(noUnlock, seed);
    s = run(s, 20000).state;
    const used = new Set(s.items.filter((it) => it.kind === 'gem').map((it) => it.color));
    for (const col of used) assert.ok(CONFIG.colors.slice(0, 3).includes(col), `seed ${seed}: ${col}`);
  }
});

test('crossing 1,000 points unlocks a 4th colour (event + it reaches the track)', () => {
  let s = quiet();
  s.score = 900;
  for (let i = 0; i < 4; i += 1) s = collect(s, 'ember').state;
  const r = collect(s, 'tide');                   // cashes 4 → +200 = 1,100
  assert.equal(r.state.colorCount, 4);
  assert.ok(r.events.some((e) => e.type === 'colors' && e.count === 4 && e.color === CONFIG.colors[3]));
  let t = r.state; t.nextRowZ = t.distance + 10;
  t = run(t, 15000).state;
  assert.ok(t.items.some((it) => it.color === CONFIG.colors[3]), 'new colour never spawned');
});

test('lanes are not single-colour columns, and every row offers the thread colour', () => {
  let s = createGame(CONFIG, 7);
  s = run(s, 30000).state;
  const rows = new Map();
  for (const it of s.items) rows.set(it.z, [...(rows.get(it.z) ?? []), it]);
  // Over the visible stretch, each lane shows more than one colour.
  for (let lane = 0; lane < CONFIG.lanes; lane += 1) {
    const cols = new Set(s.items.filter((it) => it.kind === 'gem' && it.lane === lane).map((it) => it.color));
    assert.ok(cols.size > 1, `lane ${lane} is one colour`);
  }
  for (const row of rows.values()) assert.ok(row.some((it) => it.kind === 'gem'));
});

test('a runner who follows the thread can always build a 3+ chain', () => {
  // Rebuild the generator's thread by walking rows: each thread colour lasts ≥ threadMin rows
  // and moves at most one lane per row.
  const s = createGame(CONFIG, 3);
  const zs = [...new Set(s.items.map((it) => it.z))].sort((a, b) => a - b);
  let longest = 0, len = 0, prev = null;
  for (const z of zs) {
    const gems = s.items.filter((it) => it.z === z && it.kind === 'gem');
    const cont = prev && gems.find((g) => g.color === prev.color && Math.abs(g.lane - prev.lane) <= 1);
    if (cont) { len += 1; prev = cont; } else { len = 1; prev = gems[0]; }
    longest = Math.max(longest, len);
  }
  assert.ok(longest >= CONFIG.chain.minScore, `longest reachable chain ${longest}`);
});

test('the storm starts at step 0 and stays at 0 when running quietly', () => {
  const s = createGame(CONFIG, 1);
  assert.equal(s.chaserStep, 0);
  const later = run(quiet(), 20000).state;
  assert.equal(later.chaserStep, 0);
  assert.equal(later.over, false);
});
