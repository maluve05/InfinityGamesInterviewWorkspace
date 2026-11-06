# Game design principles for calm, minimal prototypes

General design knowledge for choosing, building and judging a prototype. No code.
Distilled from the owner's own study of why top-chart puzzle games hold players,
using public sources: King's GDC talks and engineering posts on difficulty and
player modelling, a public Candy Crush level-attempt dataset (≈93k attempts), and
Yu-kai Chou's Octalysis framework. Written for studios whose promise is relaxation:
anything that only works by adding stress or pressure to pay is listed as an
anti-pattern, not a technique.

Each principle: **mechanism → how to build it → how to know it worked → how it fails.**

---

## 1. Skill floor at zero

**Mechanism.** The first thirty seconds teach by demonstration, need no reading, and
cannot be failed. **Build:** one verb, one input; show the input itself (a ghost
cursor or hand performing the real move), derive what it demonstrates from the
actual rules, never a hard-coded position; make the first success guaranteed by
construction. **Measure:** share of first-time players who complete the first
interaction unaided (target > 95%). **Fails when:** the demonstration is fragile (it
shows a move that doesn't work for another seed) or the ceiling arrives in minute two.

## 2. Shape a sawtooth, not a ramp

**Mechanism.** In the public dataset, win rate per level oscillates (a hard level is
followed by a recovery level) instead of steadily falling. **Build:** author in
blocks — comfortable, comfortable, stretch, hard, recovery — and keep hard moments
short. **Measure:** plot success per level in order; you want a bounded oscillation.
**Fails when:** a wall follows a wall, or recovery reads as filler.

## 3. A visible budget makes play meaningful

**Mechanism.** Something the player spends (moves, time, pieces, space) creates
tension and lets play be graded. **Build:** in a calm game, a soft budget that
grades instead of fails: par shown after the solve, never a game over for using
more. **Measure:** do runs of the same content produce different grades?
**Fails when:** the budget becomes a punishment in a game that promised no stress.

## 4. Earn the finale: liquidate what's left

**Mechanism.** At the moment of victory, unspent resource (moves left, combo, time)
turns into a short burst of the game's own core action, so efficient play is
rewarded visibly. **Build:** identify what the player accumulates but can't fully
spend; at the win, convert it into units of the core verb and resolve them fast
(4–8× normal speed), raising score or grade. **Measure:** two runs of the same level
should produce visibly different finales; the finale should be able to change the
grade, or it's decoration. **Fails when:** the player can't read what's happening.

## 5. Separate rules from ceremony

**Mechanism.** Game rules are pure state; the celebration is a sequence that reads
state snapshots. **Build:** engine emits events and final numbers; the presenter
plays a scripted sequence from them (with its own timings and sounds). **Measure:**
can the finale's length, motion and sound change without touching rules?
**Fails when:** the animation shows a number the rules never reached.

## 6. Bound the spectacle

**Mechanism.** Abundance is stage-managed: chains are capped, celebrations are
skippable. **Build:** choose the stopping condition (event count or duration) before
tuning the animation; any click or key skips from the first playthrough. End on a
completed beat, never mid-chain. **Measure:** celebration p95 under ~10–15 s.
**Fails when:** the cut is visible, or the player waits on something they've stopped enjoying.

## 7. Grade the attempt, not just the outcome

**Mechanism.** The same win renders differently depending on how it was achieved.
**Build:** one or two legible axes (efficiency, speed, elegance) and one visible tier;
the player must be able to say *why* they got that grade. In public data the jump
from 1 to 2 stars is far bigger than 2 to 3, so most wins leave a visible next goal.
**Measure:** do players replay cleared content? **Fails when:** the grade is opaque.

## 8. Make failure the board's, not the player's

**Mechanism.** A setback reads as "the board did this", not "you are bad".
**Build:** describe the state ("two pieces left", "no space"), show the near-miss,
offer the retry instantly (Space/Enter) as a continuation. In a calm game, prefer
no failure at all: a softer grade instead. **Measure:** retries vs exits after a
setback. **Fails when:** it tips into denying agency.

## 9. Difficulty that re-centres, openly

**Mechanism.** King describe estimating skill from attempts and outcomes so felt
challenge stays similar across players. **Build:** a trailing skill estimate from
attempts and results; before an attempt, pick one of a few pre-tuned variants.
Never adjust mid-attempt. Make it visible and switchable. **Measure:** players of
different skill land near similar success rates. **Fails when:** players sense the
board secretly softening and stop trusting their wins.

## 10. Instrument the boundaries

**Mechanism.** The most valuable events are attempt start and attempt end.
**Build:** two richly typed events — `attempt_start` and `attempt_end` with
`attempt_no`, `duration_ms`, `result`, `grade`, `resource_left`, `cause` — and
mid-attempt events only for a specific question. Keep debug shortcuts out of the
data (tag or block them). **Measure:** can you answer "what's failing, for whom, at
what cost" from those two events? **Fails when:** you log everything and answer nothing.

## 11. Content as data

**Mechanism.** A level is a data file; code is the interpreter. **Build:** one schema,
validated on load; a headless mode that can play a level without rendering, so a
bot can check every level is solvable and measure its difficulty. **Measure:** time
from idea to playable level. **Fails when:** a new level needs a code change, or a
generator can produce a level it can't grade.

## 12. Change the game; don't pile onto it

**Mechanism.** A new mechanic that changes the core verb needs the existing content
rebalanced, not just added to. **Build:** in a prototype, test one twist at a time
against the unchanged base. **Measure:** did the twist change the feel of the base
loop? **Fails when:** features arrive faster than they can be tuned.

## 13. Never leave the player without a move

**Mechanism.** Top-chart match-3 games guarantee that a legal move always exists
(the board reshuffles when none does), and after a few seconds of inactivity they
softly highlight *one* valid move. Fast players never see it; stuck players are
always rescued. Being stuck is worse than failing: a failure has a cause and a
retry, while being stuck feels like wasted time, and in a calm game it's the most
likely reason people quit.

**The nuances (apply all of them):**

1. **Guarantee before you hint.** First make "no possible action" impossible: detect
   dead ends in the engine and resolve them (reshuffle, add a piece, gently reset).
   A hint is only honest if a move is guaranteed to exist.
2. **Show *a* move, not the best one.** Pick a valid, ordinary move, preferably
   simple and near the player's last action. Never pick the optimal or
   highest-scoring move: that turns the hint into autopilot and empties out the
   reward of finding good moves, which is the actual skill. In a puzzle with one
   solution, show a *direction* (one piece's target outline, one correct
   connection), never the whole answer.
3. **Wait, then escalate.** Start the hint after ~5 s with no meaningful action
   (click, key, drag — hovering and mouse movement do not count; the player may
   be thinking). Step 1: a subtle pulse or glow on the piece(s). Step 2, if still
   idle after another ~5 s: a ghost cursor/hand performing the gesture. Lengthen
   the delay as the player shows competence (e.g. after several unaided moves);
   shorten it on the first level.
4. **Disappear instantly.** Any meaningful action clears the hint and restarts the
   timer. Never block input, cover the board or play a sound louder than a whisper.
5. **Derive it from the rules, never hard-code it.** The engine provides a pure
   `findHint(state)` that returns a legal move (or `null` only when the guarantee
   in nuance 1 says no move exists — which should be impossible while playing). A
   test proves that applying the hinted move is legal (and makes progress where
   progress is measurable) for several seeds and levels.
6. **Separate from the tutorial.** The first-run demonstration teaches the gesture
   once; the idle hint is a quiet safety net afterwards. Both can share the ghost
   cursor, but the hint must not replay the tutorial.
7. **Don't punish it.** In a calm game, using a hint never lowers the grade or
   blocks progress. Record it (`hint_shown` with the delay that triggered it) so it
   can be measured, but keep it out of scoring. An option to turn hints off is a
   nice extra, not a requirement.
8. **Only ever point at play.** A hint must never point at a purchase, a booster or
   an ad. That is the extractive version and has no place in a relaxing catalogue.

**When not to use it (or use less of it).** If *finding* the move is the whole
game (deduction puzzles, a single-solution "aha"), delay the hint much longer and
show the smallest possible nudge, so the aha survives. In real-time games where
idle means danger, there's no idle hint; make the next action obvious through
layout and contrast instead.

**Measure.** `hint_rate` (attempts that saw a hint): roughly 10–25% is healthy —
lower means it's too hidden to help, higher means the puzzle is unfair or unclear.
`stuck_rate` (attempts with > ~8 s without progress), and time to the first action
after a hint appears. **Fails when:** it appears too soon (patronising), shows the
best move (teaches nothing), lies (a hard-coded or stale move), or is the only way
the player ever finds a move (the board itself isn't legible — fix that first).

## 14. Introduce each mechanic as the answer to a problem the player just felt

**Mechanism.** A new mechanic lands when the player has first *felt* the limit it
removes: the problem, then the solution. Shown all at once, mechanics are noise; shown
as answers, each one is a small relief. (From the owner's playtest of an idle game that
opened with three upgrade trees at once.)

**Build:** progressive disclosure. Start with the one verb. Let the player hit its limit
(too slow, too far, too many) for a moment, then reveal the tool that fixes it — one at
a time, unlocked when it's needed and affordable. Never open with a menu of options.
**Measure:** do players use each new mechanic within a minute of it appearing?
**Fails when:** the problem drags on too long (frustration), or the solution arrives
before the problem (the player doesn't know why it's there).

---

## Motivation (Octalysis, in brief)

Yu-kai Chou's eight core drives: **meaning** (part of something bigger),
**accomplishment** (progress, mastery), **creativity** (choices, expression),
**ownership** (collecting, improving something of yours), **social influence**,
**scarcity**, **unpredictability** (curiosity) and **avoidance** (fear of loss).
The first four are "white hat": players feel good and in control. The last three
are "black hat": they create urgency and compulsion, and work at the cost of how
players feel. Left-brain drives (accomplishment, ownership, scarcity) are extrinsic;
right-brain drives (creativity, social, curiosity) are intrinsic and last longer.

**For a relaxing catalogue:** lead with creativity, accomplishment and gentle
curiosity, with ownership in small doses. Use scarcity and avoidance sparingly or
not at all.

## Anti-patterns for a calm game

| Pattern | Why not |
| --- | --- |
| Lives / energy gates | Turns a reset into an appointment |
| Failing move limits | Changes the genre from calm to tense |
| Deliberate difficulty walls to sell retries | The public data shows walls where most attempts fail and players drop out: extraction, not fun |
| Hidden difficulty adjustment | Success that feels granted is worse than failure that feels earned |
| Score or cascade inflation | Noise drowns the player's own decisions |
| Jackpot reward variance | A calm promise can't survive a slot machine |

Keep the structural parts (visible budget, earned finale, variance the player can
influence, adaptation that re-centres openly); leave the extractive ones.

## Using this in a scale-or-kill call

Name which principles the prototype already demonstrates, which it lacks, and the
metric from §10 you would collect to decide. Be clear that a one-person playtest
is a signal, not evidence; say what you'd measure at scale and the threshold that
would change your mind.
