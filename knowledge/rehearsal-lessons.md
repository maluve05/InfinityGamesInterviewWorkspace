# Lessons from the timed rehearsal (Quiet Harmony, 2026-11-05)

A full rehearsal of the assessment, run as if real, then audited afterwards
(57 findings: 11 that break play or trust, 27 that break feel or data, 19 that
are debt). Process lessons only; nothing here is code.

## What went wrong, by theme

1. **The goal was invisible.** The win condition existed in the rules but was never
   shown, previewed or described, so solving felt like a guess that stopped.
   → Make the goal legible on screen in the first five seconds.
2. **Nothing was spent, so nothing was earned.** No budget, par or score: no
   tension, no mastery signal, nothing for the finale to convert.
   → Give every loop something to spend and grade it (see principles §3–4, §7).
3. **The finale was identical every time.** A great run and a struggle got the same
   celebration. → The reward should change with how the player played.
4. **The tutorial demonstrated a hard-coded move.** It worked by luck for one seed.
   → Derive any demonstration from the real rules or solution.
5. **Audio fired every frame during a fast drag.** Dozens of overlapping sounds per
   second: clipping and harshness. → Coalesce continuous-input sounds (one per
   ~120 ms, the strongest wins).
6. **A generator could crash the page.** An uncaught failure blanked everything on
   load. → Generation and setup must fail soft, and a smoke test must run the real
   page.
7. **"Difficulty" was measured wrongly.** A count that looked like difficulty didn't
   predict it; the level that looked hardest took one move. → Measure difficulty by
   playing (or simulating) the level, not by counting its parts.
8. **Keyboard couldn't play.** Only the start screen responded to keys.
   → Desktop-first means the whole loop is playable with mouse, and core actions
   have keys.
9. **Debug shortcuts shipped and polluted the data.** Instant solves were recorded as
   real ~0 ms wins. → Tag or strip debug paths; never mix them with player data.
10. **A privacy claim contradicted the code.** → Never state what you don't verify.
11. **Tested progression differed from shipped progression.** → Test the code path
    players actually take.

## Sequencing rules that held up

- **Fix trust before feel.** A crash, a lying tutorial or polluted data makes every
  later measurement worthless.
- **Make the invisible visible before making it harder.** Legibility is the difficulty
  knob with the best effect for the least risk.
- **Earn the finale.** Convert leftover resource into reward; grade, never fail.
- **Adapt presentation first, structure last.** A hint is reversible; a changed
  level is not.
- **Keep the pure engine pure.** New state in the engine, new rules in `step`/`tick`,
  new rendering in the view.

## Process lessons

- An audit by reading code found 57 issues that headless tests didn't. Play it in a
  real browser early and often; tests prove rules, not experience.
- Pausing mid-window needs a written resume note (`PLAN.md` "Resume here").
- Keep the scope to one question the prototype answers; everything else is backlog.
