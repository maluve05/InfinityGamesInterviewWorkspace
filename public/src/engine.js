// Pure rules for the colour-chain runner. No DOM, no timers, no Math.random, no Date.
//   createGame(config, seed) → state
//   step(state, action)      → { state, events }   action: { type: 'left' | 'right' | 'jump' }
//   tick(state, dtMs)        → { state, events }   advance the world by dtMs
// State is treated as immutable by callers: every call returns a fresh copy.
import { rngCursor } from './rng.js';

const clone = (s) => structuredClone(s);

export function createGame(config, seed = 1) {
  const state = {
    config,
    seed: seed >>> 0,
    timeMs: 0,
    distance: 0,          // metres run
    lane: 1,              // 0 = left, 1 = centre, 2 = right
    jumpMs: null,         // ms since the jump started, null when grounded
    stumbleMs: 0,         // ms of slowdown left
    gap: config.chaser.startGapM,
    chain: { color: null, count: 0 },
    score: 0,
    matches: 0,           // chains of 3+ cashed in
    maxChains: 0,         // 6-chains
    gems: 0,
    stumbles: 0,
    setting: 0,
    over: false,
    cause: null,
    items: [],            // { id, kind: 'gem' | 'barrier', lane, z, color? }
    nextId: 1,
    nextRowZ: 30,         // first row a short way ahead
    colorCount: colorCountFor(config, 0),
    thread: { color: null, lane: 1, left: 0 },
  };
  spawnAhead(state);
  return state;
}

/** How many colours are in play at a given score. */
export function colorCountFor(config, score) {
  let count = config.colorUnlocks[0].count;
  for (const u of config.colorUnlocks) if (score >= u.score) count = u.count;
  return Math.min(count, config.colors.length);
}

/** Normal running speed (m/s) at a given time, before stumbles. */
export function baseSpeed(config, timeMs) {
  const { base, max, accelPerSec } = config.speed;
  return Math.min(max, base + accelPerSec * (timeMs / 1000));
}

/** The chaser's pace as a share of the runner's normal speed. */
export function chaserPace(config, timeMs) {
  const { paceStart, pacePerSec, paceMax } = config.chaser;
  return Math.min(paceMax, paceStart + pacePerSec * (timeMs / 1000));
}

/** Height of the runner above the road (metres). */
export function jumpHeight(state) {
  if (state.jumpMs === null) return 0;
  const { durationMs, height } = state.config.jump;
  const p = Math.min(1, state.jumpMs / durationMs);
  return 4 * height * p * (1 - p);
}

/** Points for cashing in a chain of n gems (0 below the minimum). */
export function chainPoints(config, n) {
  const { minScore, pointsPerStep } = config.chain;
  return n < minScore ? 0 : pointsPerStep * (n - minScore + 1);
}

export function step(prev, action) {
  const state = clone(prev);
  const events = [];
  if (state.over) return { state, events };
  const last = state.config.lanes - 1;
  if (action.type === 'left' && state.lane > 0) {
    state.lane -= 1; events.push({ type: 'lane', lane: state.lane, dir: -1 });
  } else if (action.type === 'right' && state.lane < last) {
    state.lane += 1; events.push({ type: 'lane', lane: state.lane, dir: 1 });
  } else if ((action.type === 'left' || action.type === 'right')) {
    events.push({ type: 'edge', dir: action.type === 'left' ? -1 : 1 });
  } else if (action.type === 'jump' && state.jumpMs === null) {
    state.jumpMs = 0; events.push({ type: 'jump' });
  }
  return { state, events };
}

export function tick(prev, dtMs) {
  const state = clone(prev);
  const events = [];
  if (state.over || dtMs <= 0) return { state, events };
  const c = state.config;
  const dt = dtMs / 1000;

  // Speed: normal pace, cut while stumbling.
  const normal = baseSpeed(c, state.timeMs);
  const slowed = state.stumbleMs > 0;
  const speed = slowed ? normal * c.stumble.slowFactor : normal;
  state.stumbleMs = Math.max(0, state.stumbleMs - dtMs);

  // Move.
  const from = state.distance;
  state.distance += speed * dt;
  state.timeMs += dtMs;

  // Jump arc.
  if (state.jumpMs !== null) {
    state.jumpMs += dtMs;
    if (state.jumpMs >= c.jump.durationMs) { state.jumpMs = null; events.push({ type: 'land' }); }
  }

  // Collisions with anything the runner passed this tick, nearest first.
  const passed = state.items
    .filter((it) => it.z > from && it.z <= state.distance && it.lane === state.lane)
    .sort((a, b) => a.z - b.z);
  for (const it of passed) {
    if (it.kind === 'gem') {
      state.items = state.items.filter((x) => x.id !== it.id);
      collectGem(state, it, events);
    } else if (it.kind === 'barrier') {
      if (jumpHeight(state) >= c.jump.clearHeight) {
        events.push({ type: 'vault', id: it.id });
      } else {
        state.items = state.items.filter((x) => x.id !== it.id);
        stumble(state, c.stumble.hitMs, 'hit', events);
      }
    }
  }

  // The chaser: the gap changes with the speed difference.
  const chaserSpeed = normal * chaserPace(c, state.timeMs);
  state.gap = Math.min(c.chaser.maxGapM, state.gap + (speed - chaserSpeed) * dt);
  if (state.gap <= 0) {
    state.gap = 0; state.over = true; state.cause = 'caught';
    events.push({ type: 'caught', score: state.score, distance: state.distance });
    return { state, events };
  }

  // Scenery.
  const setting = Math.floor(state.distance / c.setting.lengthM) % c.setting.count;
  if (setting !== state.setting) { state.setting = setting; events.push({ type: 'setting', index: setting }); }

  // World upkeep.
  state.items = state.items.filter((it) => it.z > state.distance - c.spawn.cullBehindM);
  spawnAhead(state);
  return { state, events };
}

function collectGem(state, gem, events) {
  const c = state.config;
  state.gems += 1;
  const chain = state.chain;
  if (chain.count > 0 && gem.color !== chain.color) {
    cashIn(state, events, false);
  }
  if (state.chain.count === 0) state.chain = { color: gem.color, count: 0 };
  state.chain.count += 1;
  events.push({ type: 'collect', color: gem.color, count: state.chain.count, lane: gem.lane });
  if (state.chain.count >= c.chain.max) cashIn(state, events, true);
}

/** Ends the current chain: scores 3+, or makes the runner stumble for 1–2. */
function cashIn(state, events, isMax) {
  const c = state.config;
  const { color, count } = state.chain;
  const points = chainPoints(c, count);
  state.chain = { color: null, count: 0 };
  if (points > 0) {
    state.score += points;
    state.matches += 1;
    const event = { type: 'match', color, count, points, multiplier: count - c.chain.minScore + 1, max: isMax };
    if (isMax) {
      state.maxChains += 1;
      state.gap = Math.min(c.chaser.maxGapM, state.gap + c.chain.maxStepBackM);
      event.stepBack = c.chain.maxStepBackM;
    } else {
      event.stepBack = c.chain.stepBackPerStepM * event.multiplier;
      state.gap = Math.min(c.chaser.maxGapM, state.gap + event.stepBack);
    }
    events.push(event);
    const colors = colorCountFor(c, state.score);
    if (colors > state.colorCount) {
      state.colorCount = colors;
      events.push({ type: 'colors', count: colors, color: c.colors[colors - 1] });
    }
  } else {
    events.push({ type: 'break', color, count });
    stumble(state, c.stumble.breakMs, 'break', events);
  }
}

function stumble(state, ms, cause, events) {
  state.stumbleMs = Math.max(state.stumbleMs, ms);
  state.stumbles += 1;
  events.push({ type: 'stumble', cause, ms });
}

/** Fills the track ahead with rows. One thread colour weaves through nearby lanes for a
 *  few rows (so a chain is always on offer); the other lanes get random unlocked colours. */
function spawnAhead(state) {
  const c = state.config;
  const s = c.spawn;
  const rng = rngCursor(state.seed);
  const palette = c.colors.slice(0, state.colorCount);
  const pick = () => palette[rng.int(0, palette.length - 1)];
  while (state.nextRowZ < state.distance + s.lookAheadM) {
    const z = state.nextRowZ;
    const th = state.thread;
    if (th.left <= 0) {
      const options = palette.filter((col) => col !== th.color);
      th.color = options[rng.int(0, options.length - 1)];
      th.left = rng.int(s.threadMin, s.threadMax);
    } else if (rng.float() < s.threadDrift) {
      th.lane = Math.max(0, Math.min(c.lanes - 1, th.lane + (rng.float() < 0.5 ? -1 : 1)));
    }
    th.left -= 1;
    let barrierLane = -1;
    if (z >= s.barriersFromM && rng.float() < s.barrierChance) {
      barrierLane = rng.int(0, c.lanes - 2);
      if (barrierLane >= th.lane) barrierLane += 1; // never on the thread
    }
    for (let lane = 0; lane < c.lanes; lane += 1) {
      if (lane === th.lane) {
        state.items.push({ id: state.nextId++, kind: 'gem', lane, z, color: th.color });
      } else if (lane === barrierLane) {
        state.items.push({ id: state.nextId++, kind: 'barrier', lane, z });
      } else if (rng.float() < s.gemChance) {
        state.items.push({ id: state.nextId++, kind: 'gem', lane, z, color: pick() });
      }
    }
    state.nextRowZ += s.rowSpacingM;
  }
  state.seed = rng.seed;
}

/** A compact summary for telemetry and the end screen. */
export function summary(state) {
  return {
    score: state.score, distance: Math.round(state.distance), timeMs: Math.round(state.timeMs),
    matches: state.matches, maxChains: state.maxChains, gems: state.gems, stumbles: state.stumbles,
    cause: state.cause,
  };
}
