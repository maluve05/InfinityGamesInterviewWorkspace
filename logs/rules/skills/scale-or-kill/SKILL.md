---
name: scale-or-kill
description: Frame a game prototype as a pitch to a studio's prototype team — which game inspired it and why, what the prototype tested, what was learned, and a clear verdict to scale it or kill it with reasons. Use when choosing which game to prototype, to write the keep/kill criteria before building, and for the walkthrough video script and the written answers.
---

# Scale or kill

A prototype team exists to decide which ideas deserve the studio's full
resources. The verdict is the deliverable; the prototype is the evidence.

## When choosing the game (start of the window)

If the brief leaves the choice of game to you, note for each candidate: its core loop in one sentence, why
people keep playing, how fast the loop can be proven in a browser prototype, and
how it could fit the studio's style (for Infinity Games: relaxing, minimal,
polished, stress-free). Pick the one with the best mix of *provable in two hours*
and *interesting twist for this studio*. Record the choice and runners-up in
`PLAN.md`.

## What to test

Name the one question the prototype answers (e.g. "does the block-placement loop
still feel satisfying without timers or fail pressure?"). Build only what
answers it. Note what you deliberately skipped.

Before any build, write the **prototype brief** in `PLAN.md` — five lines, decided
before you're attached to the code:

```text
QUESTION:  the one thing this must prove
CORE ACTION: the single action the player repeats
KEEP IF:   e.g. a new player does the core action on purpose within ~30 s,
           unprompted, and plays "one more time" without being asked
KILL IF:   e.g. it only feels good after you explain it; making it fun needs
           systems far beyond scope; you catch yourself adding art to avoid
           admitting the action is flat
GATE:      which studio gate this tests (almost always first-session fun)
DIVERGENCE: one sentence a stranger could use to describe it without naming
           another game; it changes the verb, the course/board grammar, the
           scoring or the presentation — not just the setting
```

The prototype is *inspired by* a game, never a recreation of it (its names, art,
levels, layout or tuning). If the divergence line only changes the setting, change
the design, not the wording. Racing/arcade specifics: `knowledge/fast-racing-principles.md`.

## How studios decide (cite honestly)

- **Supercell** (Jonathan Dower, GDC 2016, *Quality is worth killing for*): of its
  last ten games, seven were killed as prototypes, two in soft launch, one (Clash
  Royale) launched globally. The team makes the call; a kill is a lesson, not a
  failure.
- **Voodoo**: a numbers funnel; tests run a few days and end in kill, iterate or
  launch. Publicly reported bars have moved over the years (CPI around $0.20, D1
  around 35–55%, D7 around 13–22%, plus playtime and win rate); in 2023 its head of
  publishing said "hypercasual is dead" — hits now need deeper loops.
- The common funnel, each step a kill point: **marketability** (does an ad get
  cheap installs?) → **first-session fun** (D1, level 1→2 completion) → **habit**
  (D7, daily playtime) → soft launch. Quote thresholds as "around"; they vary by
  genre and year. Details: `knowledge/production-toolkit.md` §5.

## The verdict

Give a clear **scale** or **kill** — not "maybe". Support it with:

| Lens | Question |
| --- | --- |
| Fun | Did the core loop feel good in play, after a few minutes, not just the first? |
| Fit | Does it belong in the studio's catalogue? What would make it theirs? |
| Market | Is the inspiration still trending? Is the space crowded? |
| Cost | What would the next step cost (content, levels, art, systems)? |
| Risk | What could make it fail, and how cheaply can that be tested next? |

Judge it against the KEEP IF / KILL IF lines written before the build, and say
which held. If **scale**: name the next cheapest test and the threshold that would
change the verdict — e.g. a 15-second clip of the signature moment as an ad
creative (marketability), or ~20 new players with level 1→2 completion above
85–90% and voluntary replay (first-session fun) — then the next 1–3 things to
build. If **kill**: say what you learned and what you'd try instead. Killing a
weak idea quickly is a success for a prototype team.

Useful talking point when it applies: whether the prototype ever leaves a player
stuck (principle 13), and the `hint_rate` / `stuck_rate` you would track at scale.

## Evidence, honestly

Your own playtests are a **signal, not evidence**. Use `npm run metrics` to report
what you saw (attempts, completion, time to finish, grades), say how many players
that was, and frame the real test as "the metric I'd collect at scale and the
threshold that would change my mind" (e.g. first-session completion > 90%,
second-session return > 25%). Ground the reasoning in
`knowledge/game-design-principles.md`: which principles the prototype already
shows, which it lacks, and which extractive patterns you would refuse for this
studio.

## Use it in

- the walkthrough video (`processes/recording.md`) — last 40–60 seconds;
- the written answers (`REFLECTION.md`);
- the submission email's one-line summary.
