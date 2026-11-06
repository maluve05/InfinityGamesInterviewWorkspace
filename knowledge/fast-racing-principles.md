# Fast racing and arcade games — principles for a 2-hour prototype

Distilled from an AI-generated genre report (2026-11-06), cut down to what changes
decisions inside a two-hour browser build. No game code and
no tuning copied from any game. Techniques for drawing it: `fast-3d.md`; feel values:
`production-toolkit.md` §1.

## 1. Share the promise, not the expression (divergence)

The prototype may be *inspired by* a game; it must not *recreate* it. Before building,
write one **divergence statement**: a sentence a stranger could use to describe the game
without naming another game. Changing the setting is not enough (that's a reskin);
change at least one of the things the player touches — the **signature verb**, the
**course grammar**, the **scoring emphasis** or the **presentation language**.
Check: would a new player notice the difference in the first 30 seconds?

## 2. The loop every archetype shares

**Read → commit → resolve → reward → escalate.** Every system must make one of these
beats clearer or stronger; anything else is scope. Speed is a *relationship* (geometry
passing the camera, craft size on screen, look-ahead, hazard proximity, cost of a
mistake), not a number: a narrow, dense course at modest speed feels faster than a wide
empty one.

Pick **one** archetype and build its smallest version:

| Archetype | Promise | Verbs | The hard problem |
| --- | --- | --- | --- |
| Point-to-point racer | short race vs a small field; boosts, clean lines, near-misses | steer, drift, hop, boost, land | the course must read early; the craft's handling must be felt |
| Endless runner | a run that densifies until one mistake; instant comparison to the last | lane change, jump, slide | fair sequences: always a safe path and a fair reaction window |
| Circuit racer | learn the corner, shave time | accelerate, brake, turn, drift | handling between "rails" and "ice" — riskiest in 2 hours |

For a calm studio, the runner and the point-to-point race fit best; a circuit needs
handling tuning time we don't have.

## 3. Feel rules specific to fast games

- **The camera serves the read:** the next decision is visible before the player must
  commit. Anti-patterns: *tunnel* (FOV hides the sides), *boat* (too much lag, swims),
  *tripod* (no look-ahead), *cockpit* (can't see the craft against hazards). Keep the
  horizon stable; widen FOV slightly with speed.
- **Steering is intention:** response starts on the press; turning in slightly faster
  than recovering makes the craft feel planted. Don't over-smooth input.
- **The craft's relationship to the surface is authored:** lean into turns, settle
  after bumps, show how it meets the ground — that relationship is the craft's identity.
- **Boost is an event, not a number:** speed, FOV, camera pull-back, audio layer and
  particles change *together*. A good boost trades safety for speed; if it's always
  correct, it isn't a decision.
- **Collisions preserve the race:** lose speed, get pushed away, a short grace period
  (no collision chains), the combo breaks, and the player can see what they hit. Falling
  off = back to the last safe point with a time cost, never a hidden teleport forward.
- **Edge-triggered actions fire on press** (hop, boost); a short buffer keeps intent.
- **Readability before detail:** no particle curtain over the line; the HUD shows only
  what changes the next action (position/progress, boost, combo); never colour alone.
- **Audio is half of speed:** vehicle layer (speed, surface), world layer (hazards,
  rivals), UI layer (confirm, warn); music never buries a hazard cue.

## 4. The course

- **Course coordinate:** describe everything as *distance along the centreline*,
  *lateral offset* and *height above the surface*; derive world/screen position from it.
  Collision, camera, scoring, rivals and generation then share one language, and the
  engine stays pure and testable. (This is also how the pseudo-3D road in `fast-3d.md`
  works: segments along a centreline.)
- **Beats before pieces:** pace as breathe → weave → commit → recover → finale; one
  demanding factor raised at a time, a breather after each peak (principle 2's sawtooth).
- **Every hazard has a readable safe line;** no blind drop after a crest, no pixel-wide
  gap. Difficulty from execution, never surprise.
- **Generated = guilty until proven playable:** seeded, validated (continuity, safe path,
  sightline), with a hand-made fallback course. In two hours, prefer one hand-authored
  course plus a test that drives the safe line to the finish.

## 5. The race

- **One progress function** (distance along the course, plus laps where laps exist) used
  by positions, finish and rivals. Never sort by raw distance on a lapped track; finish
  triggers on progress, not world distance.
- **Rivals are performances, not physics:** a few readable policies (attacks, defends,
  makes a mistake), same course and roughly the same rules as the player.
- **Catch-up is bounded and invisible:** more help for rivals behind than ahead, none
  for a recovering rival, **none in the final stretch** — the line decides the finish.
- **A loss is explainable in one sentence;** the result screen shows the primary result
  first (position), then one line per secondary source (time, clean sections,
  near-misses), then the total.
- **Combos** need a clear start, visible growth, readable break and a **cap**.
- **Retry is faster than the failure;** keep the seed so the course can be learned.
- No economy, shop or upgrades in the prototype: if it needs an economy to be
  interesting, the loop isn't done.

## 6. Build order and cut ladder (2-hour version)

1. Grey-box course, craft, camera, one verb — prove the read.
2. Collision, recovery, boost, feedback — prove the feel (the signature moment here).
3. One hand-made course with a rhythm of demand and recovery.
4. 2–4 simple rivals and the progress function — prove the drama.
5. Result screen, retry — prove the loop. Then presentation.

Cut in this order: modes/meta → extra crafts, rivals, audio layers → extra course pieces
and effects → abstractions and tooling. **Never cut** readability, control response,
fair failure, the core loop or the deploy.

**Determinism:** fixed simulation step (accumulator), seeded, no wall-clock time in the
simulation, long frames clamped; keep 2–3 "golden seeds" as tests.

**Done when:** a new player finishes the first race without instructions, can say why
they lost, wants another run for a skill reason, the frame is stable, there is one
coherent look and sound, the deployed build is the one shown, and the divergence
statement still describes the game.
