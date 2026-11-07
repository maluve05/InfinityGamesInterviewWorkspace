// Owner's jump review (16:39): hold window, speed-scaled airtime, swept barrier check,
// 0.5 m gem skip, input buffer, and the scoring thread crossing barriers.
import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../public/src/config.js';
import { createGame, step, tick, jumpHeight, fullJumpAirtime } from '../public/src/engine.js';

const DT = 1000 / 60;
const quiet = () => { const s = createGame(CONFIG, 1); s.items = []; s.nextRowZ = 1e9; return s; };
function peakFor(releaseMs) {
  let s = step(quiet(), { type: 'jump' }).state, pk = 0, ms = 0, released = releaseMs === null;
  while (s.jumpMs !== null || ms === 0) {
    if (!released && ms >= releaseMs) { s = step(s, { type: 'jumpRelease' }).state; released = true; }
    s = tick(s, DT).state; ms += DT; pk = Math.max(pk, jumpHeight(s));
    if (ms > 3000) break;
  }
  return pk;
}

test('the hold window chooses the height: tap ≈ min, half-window ≈ middle, 140 ms+ ≈ max', () => {
  const j = CONFIG.jump;
  const tap = peakFor(0), mid = peakFor(j.holdWindowMs / 2), full = peakFor(j.holdWindowMs + 20), held = peakFor(null);
  assert.ok(Math.abs(tap - j.peakMinM) < 0.12, `tap ${tap.toFixed(2)}`);
  assert.ok(mid > tap + 0.15 && mid < full - 0.1, `mid ${mid.toFixed(2)} between ${tap.toFixed(2)} and ${full.toFixed(2)}`);
  assert.ok(Math.abs(full - j.peakMaxM) < 0.05 && Math.abs(held - j.peakMaxM) < 0.05, `full ${full.toFixed(2)} held ${held.toFixed(2)}`);
});

test('airtime shrinks as speed rises, so the arc stays near one row', () => {
  const base = fullJumpAirtime(CONFIG, CONFIG.speed.base), top = fullJumpAirtime(CONFIG, CONFIG.speed.max);
  assert.ok(top < base, `${top} < ${base}`);
  assert.ok(CONFIG.speed.max * top <= 1.0 * CONFIG.spawn.rowSpacingM, `arc at top speed ${(CONFIG.speed.max * top).toFixed(1)} m`);
});

test('swept barrier: clipping the front of the barrier is a hit, being over it at entry and exit is a vault', () => {
  const run = (barrierAhead, releaseMs = null) => {
    let s = quiet();
    s.items = [{ id: 5, kind: 'barrier', lane: s.lane, z: s.distance + barrierAhead }];
    s = step(s, { type: 'jump' }).state;
    const ev = [];
    for (let ms = 0; ms < 1200 && !s.over; ms += DT) {
      if (releaseMs !== null && Math.abs(ms - releaseMs) < DT / 2) s = step(s, { type: 'jumpRelease' }).state;
      const r = tick(s, DT); s = r.state; ev.push(...r.events);
    }
    return { vault: ev.some((e) => e.type === 'vault'), hit: s.stumbles > 0 };
  };
  assert.deepEqual(run(0.3), { vault: false, hit: true }, 'jumped too late: still low at the front');
  assert.deepEqual(run(3.2), { vault: true, hit: false }, 'full jump timed over it');
});

test('a gem is skipped only when the runner is at least 0.5 m above it', () => {
  let s = quiet();
  s.items = [{ id: 9, kind: 'gem', lane: s.lane, z: s.distance + 0.3, color: 'tide' }];   // passes almost at take-off
  s = step(s, { type: 'jump' }).state;
  for (let i = 0; i < 20; i += 1) s = tick(s, DT).state;
  assert.equal(s.gems, 1, 'a gem right at take-off is still collected');
  let t = quiet();
  t.items = [{ id: 10, kind: 'gem', lane: t.lane, z: t.distance + 3, color: 'tide' }];
  t = step(t, { type: 'jump' }).state;
  for (let i = 0; i < 30; i += 1) t = tick(t, DT).state;
  assert.equal(t.gems, 0, 'a gem passed near the top of the arc is skipped');
});

test('input buffer: a press up to 100 ms before landing jumps again on landing', () => {
  let s = step(quiet(), { type: 'jump' }).state;
  while (s.jumpMs !== null && s.jumpMs < fullJumpAirtime(CONFIG) * 1000 - 60) s = tick(s, DT).state;
  s = step(s, { type: 'jump' }).state;                         // ~60 ms early
  let jumps = 0;
  for (let i = 0; i < 12; i += 1) { const r = tick(s, DT); s = r.state; jumps += r.events.filter((e) => e.type === 'jump').length; }
  assert.equal(jumps, 1, 'the buffered press fired on landing');
});

test('the scoring thread sometimes crosses a barrier (a jump is part of the line)', () => {
  let crossings = 0;
  for (const seed of [1, 2, 3]) {
    let s = createGame(CONFIG, seed);
    const seen = new Map();
    for (let i = 0; i < 60 * 120 && !s.over; i += 1) {
      for (const it of s.items) seen.set(it.id, it);
      s.chaserStep = 0;                                         // keep the run alive to sample the track
      s = tick(s, DT).state;
    }
    const items = [...seen.values()];
    const rows = new Map();
    for (const it of items) rows.set(it.z, [...(rows.get(it.z) ?? []), it]);
    for (const row of rows.values()) if (row.some((it) => it.kind === 'barrier') && row.filter((it) => it.kind === 'gem').length < 2) crossings += 1;
  }
  assert.ok(crossings > 0, 'no barrier ever sat on the thread');
});
