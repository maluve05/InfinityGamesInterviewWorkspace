---
name: design-first
description: Decide what a game should look and feel like before building it. Produce three distinct visual directions as HTML screens, push them into Figma where the owner can pick and edit (by hand or by prompting), lock tokens and screen specs from the chosen frames, then build each screen backwards to match. Use for any new game, screen or visual overhaul.
---

# Design first, build backwards

The owner's rule: a prototype that looks great with thin mechanics beats a
complete one that looks bad. The design is the spec; code catches up to it.
Process with timings: `processes/design-first.md`.

## 1. Constraints from the brief

Theme, mood, the inspiration game and its core gesture, the screens the core loop
needs, and the studio's taste (Infinity Games: relaxing, minimal, polished).
Screens are optional defaults — include only what the loop needs:

- **Start** — title or logo (not both), one clear "play" affordance; the first
  click/key also unlocks audio.
- **Play** — the hero screen. HUD minimal and graphic (score, best, a ring or pips).
  Design its **idle-hint state** too: how a suggested move glows or pulses, and the
  ghost cursor that demonstrates it — subtle enough to ignore, clear enough to
  find (principle 13 in `knowledge/game-design-principles.md`).
- **End** — result, best score, an obvious restart (button + Space/Enter).
- Optional: a short first-run hint (a ghost cursor/hand showing the gesture, no
  wall of text), a pause overlay (Esc), a reward moment if the loop has one.

## 2. Three genuinely different directions

Vary palette, shape language, type, texture and mood — not three tints of one
idea. Name them. For each, build the key screens as standalone HTML in
`design/directions/<a|b|c>/` at a **desktop canvas of 1440×900** showing the game
stage as it will appear (a centred portrait stage for a mobile-game inspiration,
with a calm surround). Use real game content (actual pieces, numbers, icons),
never placeholder text or grey boxes. This is design, not game code: static
mockups only.

Quality bar for every direction:
- One focal point per screen; generous spacing; a type scale with real contrast.
- A deliberate palette of 3–5 colours plus neutrals; check text contrast.
- A distinctive display face (Google Fonts) paired with a clean body face. Never
  default system styling, default buttons, or emoji as final icons.
- Depth and material that serve the theme. Avoid generic "AI" looks: purple-blue
  gradients on everything, default glassmorphism, floating sparkles, centred-card
  sameness.
- Note motion intent (what moves, how fast, which easing).

## 3. Push into Figma

One file "<game> — directions": rows A/B/C, columns = screens. Use the Figma MCP
`generate_figma_design` (write calls are not rate-limited). Share the link.

## 4. Owner picks and edits

The owner picks a direction and refines it — by hand in Figma, or by telling
Claude what to change (Claude then edits through the Figma MCP). Both are fine;
record which in `PLAN.md`. Never restyle the owner's edits without asking.

## 5. Lock

Read the chosen frames **once** (reads are rate-limited) and save:
`design/tokens.css` (copy into `public/` when building), `design/specs/<screen>.md`
(layout, elements, states, motion, cursor/hover states), `design/frames/<screen>.png`.
If the read fails, ask the owner to export PNGs into `inbox/design/`.
Then write `**Design locked:** <time> — owner picked <direction>` in `PLAN.md`.
This opens the design gate: before it, no UI code exists (a hook blocks it).

**Fast path when behind:** two directions instead of three, Play screen only plus
the start/end states as variants on one frame, ~10 minutes. Never skip the pick.

## 6. Build backwards

Play screen first, at final quality, then the rest in flow order. After each
screen run `npm run shots` and compare `design/compare/<screen>.png` with
`design/frames/<screen>.png`. Fix the largest visible gap first. Done = matches
at 1440×900, or the difference is deliberate and logged in `PLAN.md`.
