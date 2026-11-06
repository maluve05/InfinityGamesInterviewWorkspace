---
name: game-brainstorm
description: Generate strong, studio-fitting game concepts fast when time pressure is killing creativity — diverge with proven idea generators, filter hard against the brief, the studio's style and a two-hour build, then present a ranked handful the owner can pick from in minutes. Use when choosing what to build, when looking for the twist on an existing game, or whenever the owner says they're stuck.
---

# Game brainstorm

Pressure makes people (and models) grab the first idea. This skill forces a wide,
structured search first and a ruthless filter second, so the owner only has to *choose*.
The owner decides; Claude generates, filters and recommends.

## Inputs (read first, 1 minute)

`context/brief.md` (what's asked), `knowledge/market-and-studio.md` (style guide,
shortlist), `knowledge/playtest-insights.md` (what the owner loved and hated),
`knowledge/game-design-principles.md`. If the brief names a game or theme, it constrains
everything below.

## The quality bar

The owner's two reference games set the bar:
- **Energy** — instant clarity: glowing affordances, a two-move tutorial, a visible
  collection reward.
- **Linea** — meaning and connection: a visible goal, a tiny story carried by the
  mechanic itself, every animation and sound coming from the player's one gesture.
A concept that couldn't sit beside these two is not done yet.

## 1. Diverge (10 minutes, at least 12 raw ideas)

Write ideas as one line each: **verb + world + feeling**. Use every generator at least
once; quantity first, no judging yet.

| Generator | Prompt to yourself |
| --- | --- |
| **Remove the stress** | Take the inspiration's core loop; delete its timer, hearts or fail state. What becomes interesting instead? |
| **Swap the verb** | Same goal, different input: tap → drag → trace → hold → rotate → flick. (Puzzle & Dragons is match-3 with a drag.) |
| **Make it sound** | What if every action plays a note and a solved board is a finished phrase of music? |
| **Make it light** | What if the pieces were light, glass, water, thread, ink or sand — and solving made it beautiful? |
| **Give it a story** | What tiny wordless story could the mechanic tell over 3–5 levels? (Linea) |
| **Connect it** | What if one action causes a visible chain of consequences across the screen? |
| **Flip the goal** | Instead of clearing, build; instead of escaping, gathering; instead of winning, settling. |
| **Shrink it** | The smallest version of a big game: one turret, one ring, one tube, one line. |
| **Collect it** | What would a calm collection look like — themed sets (constellations, glyphs, seasons)? |
| **Problem, then solution** | Which limit does the player feel first, and which single tool relieves it? (principle 14) |
| **Real-world calm** | Folding, sorting, pruning, weaving, tuning, tidying — which satisfying chore could be the loop? |
| **Cross two charts** | Combine the verb of one charting game with the goal of another. |

## 2. Filter (5 minutes) — every surviving idea must pass all five

1. **Brief:** does it do what the email asks?
2. **One input:** can you play it with one gesture plus clicks, on desktop?
3. **Two-hour core:** can the core loop be playable and fun in about 90 minutes?
4. **Studio fit:** minimal visuals, low stress, a beautiful solved state, sound as reward?
5. **The 10-second test:** would a viewer understand what to do and feel the twist
   within 10 seconds of the video?

Drop anything that fails. If fewer than three survive, run the generators again with the
failures as input ("why did it fail? what's the nearest idea that wouldn't?").

## 3. Shape the top 3–5 (5 minutes)

For each survivor, a card:

```
Name (working title):
One line: <verb> <what> to <goal>, <feeling>.
Inspiration: <chart game> — what we keep, what we remove.
The twist: <the one thing that makes it an Infinity game>.
First 30 seconds: what the player sees, does and hears.
The goal on screen: how the objective stays visible.
Problem → solution: the first limit felt and the tool that answers it.
The reward moment: what happens on solve (animation + sound).
Two-hour scope: must-have vs. nice-to-have.
Risk: the one thing most likely to make it flat.
Question it answers (for scale-or-kill):
```

## 4. Recommend

Rank them with the shortlist lenses (provable in ~2 h, fit, trend, twist, risk), mark a
recommendation, and give the owner one sentence per card. The owner picks — or combines
two cards. Log the choice and the runners-up in `PLAN.md`.

## Never

- Never present only one idea, or ideas that differ only in theme or colour.
- Never generic "AI" concepts: neon-gradient everything, sparkles without meaning,
  "relaxing" as a label instead of a mechanic.
- Never ideas that need content you can't make in two hours (big level sets, 3D, online).
- Never pressure mechanics as the hook (timers, lives, scarcity) for this studio.
- Never write game code here — this skill ends at a chosen concept.
