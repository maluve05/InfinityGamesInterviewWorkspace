// Every tuning number for the runner lives here. No logic.
export const CONFIG = Object.freeze({
  lanes: 3,
  // Speed (metres per second): starts calm, ramps up over the run.
  // Keeps getting faster for about 3.5 minutes, so long runs stay tense.
  speed: Object.freeze({ base: 15, max: 40, accelPerSec: 0.12 }),
  // Jump: an arc over low barriers. Lane changes still work in the air.
  jump: Object.freeze({ durationMs: 650, height: 2.2, clearHeight: 0.6 }),
  // Gem chain (the match-3 twist). Points by chain length when it is cashed in.
  chain: Object.freeze({
    max: 6,          // a 6-chain bursts automatically
    minScore: 3,     // 1–2 gems score nothing and make you stumble
    pointsPerStep: 100, // 3 → 100 (×1), 4 → 200 (×2), 5 → 300 (×3), 6 → 400 (×4)
    stepBackPerStepM: 1.5, // a cashed 3/4/5 chain pushes the chaser back 1.5/3/4.5 m
    maxStepBackM: 8, // a 6-chain pushes the chaser back this many metres
  }),
  // Colours in unlock order. The run starts with the first 3; more unlock by score.
  colors: Object.freeze(['ember', 'tide', 'sun', 'leaf', 'plum']),
  colorUnlocks: Object.freeze([
    Object.freeze({ score: 0, count: 3 }),
    Object.freeze({ score: 1000, count: 4 }),
    Object.freeze({ score: 3000, count: 5 }),
  ]),
  // The chaser: the gap in metres is the life bar. Caught at 0.
  chaser: Object.freeze({
    startGapM: 40,   // starts at full gap: the storm is off-screen and creeps in
    maxGapM: 40,
    // Chaser speed as a share of the player's normal speed; creeps up over the run.
    // Starts just faster than the runner, so it always creeps in.
    paceStart: 1.006,
    pacePerSec: 0.00025,
    paceMax: 1.06,
  }),
  // A stumble: the runner slows for a moment, so the chaser gains.
  stumble: Object.freeze({ breakMs: 300, hitMs: 1100, slowFactor: 0.75 }),
  // Track generation, in metres ahead of the runner.
  spawn: Object.freeze({
    rowSpacingM: 9,
    lookAheadM: 160,
    gemChance: 0.82,     // chance a lane off the thread has a gem on a row
    // The "thread": one colour that weaves through nearby lanes for a few rows, so a
    // chain is always possible. Every other gem in the row is a random unlocked colour.
    threadMin: 3,
    threadMax: 6,
    threadDrift: 0.45,   // chance per row that the thread steps to a neighbouring lane
    barriersFromM: 320,  // no barriers in the first stretch: colour choice only
    barrierChance: 0.14, // per row, after barriersFromM (never on every lane)
    cullBehindM: 6,
  }),
  // The scenery changes every this many metres (the view decides the looks).
  setting: Object.freeze({ lengthM: 900, count: 4 }),
});
