// Pure rules for the colour-chain runner. No DOM, no timers, no Math.random, no Date.
//   createGame(config, seed) → state
//   step(state, action)      → { state, events }   action: { type: 'left' | 'right' | 'jump' }
//   tick(state, dtMs)        → { state, events }   advance the world by dtMs
// State is treated as immutable by callers: every call returns a fresh copy.
import { rngCursor } from './rng.js';

const clone = (s) => structuredClone(s);

export function createGame(config, seed = 1, options = {}) {
  const isTutorial = Boolean(options?.tutorial);
  const state = {
    config,
    seed: seed >>> 0,
    timeMs: 0,
    distance: 0,          // metres run
    lane: 1,              // 0 = left, 1 = centre, 2 = right
    jumpMs: null,         // ms since the jump started, null when grounded
    jumpY: 0,             // height in metres above road
    jumpV: 0,             // vertical velocity in m/s
    drop: false,          // fast fall active
    lastBarrierZ: -Infinity,
    lastBarrierByLane: Array(config.lanes).fill(-Infinity),
    stumbleMs: 0,         // ms of slowdown left
    chaserStep: 0,        // 0 to CONFIG.chaser.steps (mistakes advance, 6-combo recovers)
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
    tutorial: isTutorial ? {
      step: 'lanes',
      targetLane: 0,
      done: false,
      laneChanges: 0,
      gemsCollected: 0,
      chainLanes: null,
      chainIndex: 0,
      stepTimerMs: 0,
      totalMs: 0,
      lastItemZ: 0,
      timerMs: 0,
      emittedLanes: false,
    } : null,
  };
  if (state.tutorial) {
    setupTutorialLanes(state, true);
  } else {
    spawnAhead(state);
  }
  return state;
}

function setupTutorialLanes(state, isNewStep = true) {
  state.items = state.items.filter((it) => it.z <= state.distance);
  state.tutorial.step = 'lanes';
  state.tutorial.targetLane = 0;
  if (isNewStep) {
    state.tutorial.stepTimerMs = 0;
    state.tutorial.laneChanges = 0;
    state.tutorial.gemsCollected = 0;
  }
  const z0 = state.distance + 20;
  state.tutorial.lastItemZ = z0 + 16;
  state.items.push({ id: state.nextId++, kind: 'gem', lane: 0, z: z0, color: 'ember' });
  state.items.push({ id: state.nextId++, kind: 'gem', lane: 1, z: z0 + 16, color: 'ember' });
}

function setupTutorialChain(state, isNewStep = true) {
  state.items = state.items.filter((it) => it.z <= state.distance);
  state.tutorial.step = 'chain';
  if (isNewStep) {
    state.tutorial.stepTimerMs = 0;
  }
  state.chain = { color: null, count: 0 };
  const lanesList = state.lane === 0 ? [1, 2, 1] : (state.lane === 2 ? [1, 0, 1] : [0, 1, 2]);
  state.tutorial.chainLanes = lanesList;
  state.tutorial.chainIndex = 0;
  state.tutorial.targetLane = lanesList[0];
  const z0 = state.distance + 18;
  const col = 'tide';
  state.tutorial.lastItemZ = z0 + 24;
  state.items.push({ id: state.nextId++, kind: 'gem', lane: lanesList[0], z: z0, color: col });
  state.items.push({ id: state.nextId++, kind: 'gem', lane: lanesList[1], z: z0 + 12, color: col });
  state.items.push({ id: state.nextId++, kind: 'gem', lane: lanesList[2], z: z0 + 24, color: col });
}

function setupTutorialJump(state, isNewStep = true) {
  state.items = state.items.filter((it) => it.z <= state.distance);
  state.tutorial.step = 'jump';
  state.tutorial.targetLane = null;
  if (isNewStep) {
    state.tutorial.stepTimerMs = 0;
  }
  const bZ = state.distance + 24;
  const minGap = minBarrierGap(state.config, state.config.speed.base);
  state.tutorial.lastItemZ = bZ + minGap + 8;
  for (let l = 0; l < state.config.lanes; l += 1) {
    state.items.push({ id: state.nextId++, kind: 'barrier', lane: l, z: bZ });
  }
  state.items.push({ id: state.nextId++, kind: 'gem', lane: state.lane, z: bZ + minGap, color: 'leaf' });
  state.items.push({ id: state.nextId++, kind: 'gem', lane: state.lane, z: bZ + minGap + 8, color: 'leaf' });
}

function setupTutorialStorm(state) {
  state.items = state.items.filter((it) => it.z <= state.distance);
  state.tutorial.step = 'storm';
  state.tutorial.targetLane = null;
  state.tutorial.stepTimerMs = 0;
  state.tutorial.timerMs = 0;
  state.chaserStep = 1;
}

function finishTutorial(state, events) {
  state.tutorial.step = 'done';
  state.tutorial.targetLane = null;
  state.tutorial.done = true;
  state.chaserStep = 0;
  events.push({ type: 'tutorial', step: 'done' });
  state.timeMs = 0;
  state.nextRowZ = state.distance + 30;
  state.items = state.items.filter((it) => it.z <= state.distance);
  spawnAhead(state);
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

/** Height of the runner above the road (metres). */
export function jumpHeight(state) {
  return state.jumpY || 0;
}

/** Full-jump airtime in seconds at a given speed (shorter when faster). */
export function fullJumpAirtime(config, speed = config.speed.base) {
  const j = config.jump;
  return Math.max(j.airtimeMinS, j.airtimeBaseS * Math.pow(config.speed.base / Math.max(speed, 1e-6), j.airtimeSpeedExp));
}

/** Take-off velocity and gravity for a full jump of peakMaxM lasting the airtime at this speed. */
export function jumpPhysics(config, speed) {
  const T = fullJumpAirtime(config, speed), H = config.jump.peakMaxM;
  return { v: (4 * H) / T, g: (8 * H) / (T * T) };
}

function startJump(state, events) {
  const c = state.config;
  const speed = state.tutorial && !state.tutorial.done ? c.speed.base : baseSpeed(c, state.timeMs);
  const { v, g } = jumpPhysics(c, speed);
  state.jumpMs = 0; state.jumpY = 0; state.jumpV = v; state.jumpG = g; state.drop = false; state.jumpBufferMs = 0;
  events.push({ type: 'jump' });
}

/** Minimum distance (metres) between consecutive barriers at a given speed. */
export function minBarrierGap(config, speed) {
  const airtime = fullJumpAirtime(config, speed);
  const coeff = config.barrierGap?.coefficient ?? 1.6;
  const buffer = config.barrierGap?.landingBufferM ?? 4;
  return speed * airtime * coeff + buffer;
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
    if (state.tutorial && !state.tutorial.done && state.tutorial.step === 'lanes') {
      state.tutorial.laneChanges += 1;
      if (state.lane === 0) state.tutorial.targetLane = 1;
      if (state.tutorial.laneChanges >= 2 && state.tutorial.gemsCollected >= 1) {
        events.push({ type: 'tutorial', step: 'chain' });
        setupTutorialChain(state);
      }
    }
  } else if (action.type === 'right' && state.lane < last) {
    state.lane += 1; events.push({ type: 'lane', lane: state.lane, dir: 1 });
    if (state.tutorial && !state.tutorial.done && state.tutorial.step === 'lanes') {
      state.tutorial.laneChanges += 1;
      if (state.lane === 0) state.tutorial.targetLane = 1;
      if (state.tutorial.laneChanges >= 2 && state.tutorial.gemsCollected >= 1) {
        events.push({ type: 'tutorial', step: 'chain' });
        setupTutorialChain(state);
      }
    }
  } else if ((action.type === 'left' || action.type === 'right')) {
    events.push({ type: 'edge', dir: action.type === 'left' ? -1 : 1 });
  } else if (action.type === 'jump' && state.jumpMs === null) {
    startJump(state, events);
  } else if (action.type === 'jump') {
    // Airborne: remember the press; it fires on landing if it came within bufferMs of it.
    state.jumpBufferMs = state.config.jump.bufferMs;
  } else if (action.type === 'jumpRelease') {
    // Released inside the hold window while rising: clamp the peak between min and max by hold time.
    const j = state.config.jump;
    if (state.jumpMs !== null && state.jumpMs < j.holdWindowMs && state.jumpV > 0) {
      const target = j.peakMinM + (j.peakMaxM - j.peakMinM) * (state.jumpMs / j.holdWindowMs);
      const vMax = Math.sqrt(Math.max(0, 2 * state.jumpG * (target - state.jumpY)));
      if (vMax < state.jumpV) state.jumpV = vMax;
    }
    state.jumpBufferMs = 0;
  } else if (action.type === 'drop') {
    if (state.jumpMs !== null && !state.drop) {
      state.drop = true;
      events.push({ type: 'drop' });
    }
  }
  return { state, events };
}

export function tick(prev, dtMs) {
  const state = clone(prev);
  const events = [];
  if (state.over || dtMs <= 0) return { state, events };
  const c = state.config;
  const dt = dtMs / 1000;
  const inTutorial = state.tutorial && !state.tutorial.done;

  if (inTutorial && !state.tutorial.emittedLanes) {
    state.tutorial.emittedLanes = true;
    events.push({ type: 'tutorial', step: 'lanes' });
  }

  // Speed: normal pace, cut while stumbling. In tutorial, speed stays at speed.base.
  const normal = inTutorial ? c.speed.base : baseSpeed(c, state.timeMs);
  const slowed = state.stumbleMs > 0;
  const speed = slowed ? normal * c.stumble.slowFactor : normal;
  state.stumbleMs = Math.max(0, state.stumbleMs - dtMs);

  // Move.
  const from = state.distance;
  state.distance += speed * dt;
  if (!inTutorial) state.timeMs += dtMs;

  const wasJumping = state.jumpMs !== null;

  // Jump physics: velocity and gravity
  if (state.jumpMs !== null) {
    state.jumpMs += dtMs;
    const g = jumpGravity(state);
    state.jumpY += state.jumpV * dt - 0.5 * g * dt * dt;
    state.jumpV -= g * dt;
    if (state.jumpY <= 0) {
      state.jumpY = 0;
      state.jumpV = 0;
      state.jumpMs = null;
      state.drop = false;
      events.push({ type: 'land' });
      if (state.jumpBufferMs > 0) startJump(state, events);   // buffered press near the landing
    }
  }
  if (state.jumpBufferMs > 0) state.jumpBufferMs = Math.max(0, state.jumpBufferMs - dtMs);

  // Collisions with anything the runner passed this tick, nearest first.
  const passed = state.items
    .filter((it) => it.z > from && it.z <= state.distance && it.lane === state.lane)
    .sort((a, b) => a.z - b.z);
  for (const it of passed) {
    if (it.kind === 'gem') {
      state.items = state.items.filter((x) => x.id !== it.id);
      if (canSkipGem(state, it, speed, wasJumping)) {
        events.push({ type: 'skip', color: it.color, lane: it.lane, id: it.id });
      } else {
        collectGem(state, it, events);
        if (state.over) return { state, events };
      }
    } else if (it.kind === 'barrier') {
      if (canClearBarrier(state, it, speed, wasJumping)) {
        events.push({ type: 'vault', id: it.id });
        if (inTutorial && state.tutorial.step === 'jump') {
          events.push({ type: 'tutorial', step: 'storm' });
          setupTutorialStorm(state);
        }
      } else {
        state.items = state.items.filter((x) => x.id !== it.id);
        if (inTutorial && state.tutorial.step === 'jump') {
          events.push({ type: 'stumble', cause: 'hit', ms: c.stumble.hitMs });
          setupTutorialJump(state, false);
        } else {
          stumble(state, c.stumble.hitMs, 'hit', events);
          advanceChaser(state, events);
          if (state.over) return { state, events };
        }
      }
    }
  }

  // The chaser & tutorial progress
  if (inTutorial) {
    state.tutorial.totalMs = (state.tutorial.totalMs || 0) + dtMs;
    state.tutorial.stepTimerMs = (state.tutorial.stepTimerMs || 0) + dtMs;

    const maxMs = c.tutorial?.maxMs ?? 45000;
    const stepMaxMs = c.tutorial?.stepMaxMs ?? 12000;
    const stormMs = c.tutorial?.stormDurationMs ?? 2500;

    if (state.tutorial.step === 'storm') {
      state.chaserStep = 1;
    } else {
      state.chaserStep = 0;
    }

    if (state.tutorial.totalMs >= maxMs) {
      finishTutorial(state, events);
    } else if (state.tutorial.step === 'lanes') {
      if (state.tutorial.stepTimerMs >= stepMaxMs) {
        events.push({ type: 'tutorial', step: 'chain' });
        setupTutorialChain(state, true);
      } else if (state.distance > state.tutorial.lastItemZ + 6) {
        setupTutorialLanes(state, false);
      }
    } else if (state.tutorial.step === 'chain') {
      if (state.tutorial.stepTimerMs >= stepMaxMs) {
        state.chain = { color: null, count: 0 };
        events.push({ type: 'tutorial', step: 'jump' });
        setupTutorialJump(state, true);
      } else if (state.distance > state.tutorial.lastItemZ + 6) {
        setupTutorialChain(state, false);
      }
    } else if (state.tutorial.step === 'jump') {
      if (state.tutorial.stepTimerMs >= stepMaxMs) {
        events.push({ type: 'tutorial', step: 'storm' });
        setupTutorialStorm(state);
      } else if (state.distance > state.tutorial.lastItemZ + 6) {
        setupTutorialJump(state, false);
      }
    } else if (state.tutorial.step === 'storm') {
      if (state.tutorial.stepTimerMs >= stormMs) {
        finishTutorial(state, events);
      }
    }
  }

  // Scenery.
  const setting = Math.floor(state.distance / c.setting.lengthM) % c.setting.count;
  if (setting !== state.setting) { state.setting = setting; events.push({ type: 'setting', index: setting }); }

  // World upkeep.
  state.items = state.items.filter((it) => it.z > state.distance - c.spawn.cullBehindM);
  if (!inTutorial) spawnAhead(state);
  return { state, events };
}

function collectGem(state, gem, events) {
  const c = state.config;
  state.gems += 1;
  const chain = state.chain;
  if (chain.count > 0 && gem.color !== chain.color) {
    cashIn(state, events, false);
    if (state.over) return;
  }
  if (state.chain.count === 0) state.chain = { color: gem.color, count: 0 };
  state.chain.count += 1;
  events.push({ type: 'collect', color: gem.color, count: state.chain.count, lane: gem.lane });

  if (state.tutorial && !state.tutorial.done) {
    if (state.tutorial.step === 'lanes') {
      state.tutorial.gemsCollected += 1;
      if (state.lane === 0) state.tutorial.targetLane = 1;
      if (state.tutorial.laneChanges >= 2 && state.tutorial.gemsCollected >= 1) {
        events.push({ type: 'tutorial', step: 'chain' });
        setupTutorialChain(state);
      }
    } else if (state.tutorial.step === 'chain') {
      state.tutorial.chainIndex += 1;
      if (state.tutorial.chainLanes && state.tutorial.chainIndex < state.tutorial.chainLanes.length) {
        state.tutorial.targetLane = state.tutorial.chainLanes[state.tutorial.chainIndex];
      }
      if (state.chain.count >= 3) {
        cashIn(state, events, false);
        events.push({ type: 'tutorial', step: 'jump' });
        setupTutorialJump(state);
      }
    }
  } else if (state.chain.count >= c.chain.max) {
    cashIn(state, events, true);
  }
}

/** Ends the current chain: scores 3+, or makes the runner stumble for 1–2. */
function cashIn(state, events, isMax) {
  const c = state.config;
  const { color, count } = state.chain;
  const currentSpeed = state.tutorial && !state.tutorial.done ? c.speed.base : baseSpeed(c, state.timeMs);
  const speedRatio = Math.max(1, currentSpeed / c.speed.base);
  const speedMultiplier = Math.round(speedRatio * 10) / 10;
  const basePoints = chainPoints(c, count);
  const points = Math.round(basePoints * speedMultiplier);
  state.chain = { color: null, count: 0 };
  if (points > 0) {
    state.score += points;
    state.matches += 1;
    const event = { type: 'match', color, count, points, multiplier: count - c.chain.minScore + 1, speedMultiplier, max: isMax };
    events.push(event);
    if (isMax) {
      state.maxChains += 1;
      if (state.chaserStep > 0) {
        state.chaserStep -= 1;
        events.push({ type: 'chaser', step: state.chaserStep, dir: -1 });
      }
    }
    const colors = colorCountFor(c, state.score);
    if (colors > state.colorCount) {
      state.colorCount = colors;
      events.push({ type: 'colors', count: colors, color: c.colors[colors - 1] });
    }
  } else {
    events.push({ type: 'break', color, count });
    if (!state.tutorial || state.tutorial.done) {
      stumble(state, c.stumble.breakMs, 'break', events);
      advanceChaser(state, events);
    }
  }
}

function advanceChaser(state, events) {
  const c = state.config;
  const maxSteps = c.chaser?.steps ?? 3;
  state.chaserStep = Math.min(maxSteps, state.chaserStep + 1);
  events.push({ type: 'chaser', step: state.chaserStep, dir: 1 });
  if (state.chaserStep >= maxSteps) {
    state.over = true;
    state.cause = 'caught';
    events.push({ type: 'caught', score: state.score, distance: state.distance });
  }
}

function stumble(state, ms, cause, events) {
  state.stumbleMs = Math.max(state.stumbleMs, ms);
  state.stumbles += 1;
  events.push({ type: 'stumble', cause, ms });
}

function jumpGravity(state) {
  const c = state.config;
  const g = state.jumpG ?? jumpPhysics(c, c.speed.base).g;
  return g * (state.drop ? c.jump.dropGravityFactor : 1);
}

/** Runner height when the front was at `z` (passed earlier this tick): y(t−d) = y − v·d − ½·g·d². */
function heightAt(state, z, speed) {
  if (state.jumpMs === null && !(state.jumpY > 0)) return 0;
  const d = Math.max(0, (state.distance - z) / speed), g = jumpGravity(state);
  return state.jumpY - state.jumpV * d - 0.5 * g * d * d;
}

/** Height when the runner will reach `z` ahead: y + v·d − ½·g·d² (negative = landed before). */
function heightAhead(state, z, speed) {
  if (state.jumpMs === null) return 0;
  const d = Math.max(0, (z - state.distance) / speed), g = jumpGravity(state);
  return state.jumpY + state.jumpV * d - 0.5 * g * d * d;
}

/** A gem is skipped only if the runner was at least skipHeightM up when passing over it. */
function canSkipGem(state, it, speed, wasJumping = false) {
  if (state.jumpMs === null && !wasJumping) return false;
  const skipH = state.config.gem?.skipHeightM ?? 0.5;
  return Math.max(heightAt(state, it.z, speed), state.jumpY) >= skipH && heightAt(state, it.z, speed) >= skipH;
}

/** Swept barrier check: the runner must be above the barrier at both its front (entry) and back (exit). */
function canClearBarrier(state, it, speed, wasJumping = false) {
  if (state.jumpMs === null && !wasJumping) return false;
  const c = state.config;
  const h = c.barrier ? c.barrier.heightM : c.jump.clearHeight;
  const len = c.barrier ? c.barrier.lengthM : 1.2;
  const entry = heightAt(state, it.z, speed);
  const exit = state.jumpMs === null ? 0 : heightAhead(state, it.z + len, speed);
  return entry >= h && exit >= h;
}

/** Fills the track ahead with rows. One thread colour weaves through nearby lanes for a
 *  few rows (so a chain is always on offer); the other lanes get random unlocked colours. */
function spawnAhead(state) {
  const c = state.config;
  const s = c.spawn;
  const rng = rngCursor(state.seed);
  const palette = c.colors.slice(0, state.colorCount);
  const pick = () => palette[rng.int(0, palette.length - 1)];
  const currentSpeed = baseSpeed(c, state.timeMs);
  if (!state.lastBarrierByLane) {
    state.lastBarrierByLane = Array(c.lanes).fill(-Infinity);
  }

  while (state.nextRowZ < state.distance + s.lookAheadM) {
    const z = state.nextRowZ;
    const th = state.thread;

    // Dino gap rule: estimate speed at z and enforce minGapM
    const distToZ = Math.max(0, z - state.distance);
    const estTimeMs = state.timeMs + (distToZ / currentSpeed) * 1000;
    const speedAtZ = baseSpeed(c, estTimeMs);
    const minGap = minBarrierGap(c, speedAtZ);

    if (th.left <= 0) {
      const options = palette.filter((col) => col !== th.color);
      th.color = options[rng.int(0, options.length - 1)];
      th.left = rng.int(s.threadMin, s.threadMax);
    } else if (rng.float() < s.threadDrift) {
      const nextLane = Math.max(0, Math.min(c.lanes - 1, th.lane + (rng.float() < 0.5 ? -1 : 1)));
      if ((z - state.lastBarrierByLane[nextLane]) >= minGap) {
        th.lane = nextLane;
      }
    }
    th.left -= 1;

    let barrierLane = -1;
    if (z >= s.barriersFromM && (z - state.lastBarrierZ) >= minGap && rng.float() < s.barrierChance) {
      if (rng.float() < (s.threadBarrierChance ?? 0)) barrierLane = th.lane;   // the scoring line needs a jump
      else { barrierLane = rng.int(0, c.lanes - 2); if (barrierLane >= th.lane) barrierLane += 1; }
      state.lastBarrierZ = z;
      state.lastBarrierByLane[barrierLane] = z;
    }
    // After a barrier in the thread's lane, the next thread gem keeps the same room-to-land gap as any lane.
    const threadClear = (z - state.lastBarrierByLane[th.lane]) >= minGap;
    for (let lane = 0; lane < c.lanes; lane += 1) {
      if (lane === barrierLane) {
        state.items.push({ id: state.nextId++, kind: 'barrier', lane, z });
      } else if (lane === th.lane) {
        if (threadClear) state.items.push({ id: state.nextId++, kind: 'gem', lane, z, color: th.color });
      } else if (rng.float() < s.gemChance) {
        const color = pick();
        if ((z - state.lastBarrierByLane[lane]) >= minGap) {
          state.items.push({ id: state.nextId++, kind: 'gem', lane, z, color });
        }
      }
    }
    // Every row must have at least one gem ahead (never a row with only barriers or nothing)
    if (!state.items.some((it) => it.z === z && it.kind === 'gem')) {
      const openLanes = [];
      for (let l = 0; l < c.lanes; l += 1) {
        if (l !== barrierLane && (z - state.lastBarrierByLane[l]) >= minGap) {
          openLanes.push(l);
        }
      }
      if (openLanes.length > 0) {
        const lane = openLanes[rng.int(0, openLanes.length - 1)];
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
    chaserStep: state.chaserStep,
    cause: state.cause,
  };
}
