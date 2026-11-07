// Every tuning number for the runner lives here. No logic.
export const CONFIG = Object.freeze({
  lanes: 3,
  // Speed (metres per second): starts at 22.5 m/s (1.5x original base), ramps up to 2.5x base (56.25 m/s).
  // Keeps getting faster for about 3.5 minutes, so long runs stay tense.
  speed: Object.freeze({ base: 22.5, max: 56.25, accelPerSec: 0.16 }),
  // Jump (owner review 16:39): the peak is chosen by how long the key is held in the first
  // holdWindowMs (tap → peakMinM, held → peakMaxM). Airtime shrinks as speed rises so one jump
  // never spans more than about a row. Presses up to bufferMs before landing are kept.
  jump: Object.freeze({
    peakMinM: 1.05,            // a tap still clears the 0.9 m barrier
    peakMaxM: 1.62,
    holdWindowMs: 140,         // time the player has to choose the height
    airtimeBaseS: 0.45,        // full-jump airtime at base speed (arc ~10.1 m)
    airtimeMinS: 0.25,         // airtime at top speed (arc ~14.06 m <= 15 m row spacing)
    airtimeSpeedExp: 0.65,     // airtime = base × (baseSpeed / speed) ^ exp
    dropGravityFactor: 3,      // gravity multiplier when fast falling (drop)
    bufferMs: 100,             // a press this close before landing jumps on landing
    clearHeight: 0.9,          // backward-compat / clear threshold (m)
  }),
  barrier: Object.freeze({ heightM: 0.9, lengthM: 1.2 }),
  barrierGap: Object.freeze({ coefficient: 1.6, landingBufferM: 4 }),
  gem: Object.freeze({ floatM: 0.9, skipHeightM: 0.5 }),   // a gem is skipped only if the runner is ≥ 0.5 m up when passing it
  // Gem chain (the match-3 twist). Points by chain length when it is cashed in.
  chain: Object.freeze({
    max: 6,          // a 6-chain bursts automatically
    minScore: 3,     // 1–2 gems score nothing and make you stumble
    pointsPerStep: 300, // ×3 (owner 16:19; was 100, briefly 1,000): 3 → 300, 4 → 600, 5 → 900, 6 → 1,200
  }),
  // Colours in unlock order. The run starts with the first 3; more unlock by score.
  colors: Object.freeze(['ember', 'tide', 'sun', 'leaf', 'plum']),
  colorUnlocks: Object.freeze([
    Object.freeze({ score: 0, count: 3 }),
    Object.freeze({ score: 1000, count: 4 }),
    Object.freeze({ score: 3000, count: 5 }),
  ]),
  // The chaser: sits at step 0–3. Each mistake moves it 1 step closer; step 3 is caught.
  chaser: Object.freeze({ steps: 3 }),
  // A stumble: the runner slows for a moment, so the chaser gains.
  stumble: Object.freeze({ breakMs: 300, hitMs: 1100, slowFactor: 0.75 }),
  // Track generation, in metres ahead of the runner.
  spawn: Object.freeze({
    threadBarrierChance: 0.4,  // share of barriers placed across the scoring thread (needs a jump)
    rowSpacingM: 15,
    lookAheadM: 160,
    gemChance: 0.65,     // chance a lane off the thread has a gem on a row
    // The "thread": one colour that weaves through nearby lanes for a few rows, so a
    // chain is always possible. Every other gem in the row is a random unlocked colour.
    threadMin: 3,
    threadMax: 6,
    threadDrift: 0.45,   // chance per row that the thread steps to a neighbouring lane
    barriersFromM: 320,  // no barriers in the first stretch: colour choice only
    barrierChance: 0.18, // per row, after barriersFromM (never on every lane)
    cullBehindM: 6,
  }),
  // The scenery changes every this many metres (the view decides the looks).
  setting: Object.freeze({ lengthM: 900, count: 4 }),
  // Tutorial tuning: row spacing, pause length.
  tutorial: Object.freeze({
    rowSpacingM: 18,
    stormDurationMs: 2500,  // storm reveal duration (ms)
    stepMaxMs: 12000,       // hard limit per step (ms)
    maxMs: 45000,           // hard global limit for entire tutorial (ms)
  }),
});
