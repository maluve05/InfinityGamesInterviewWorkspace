# Design first, build backwards

The intended look is decided before screens are built, and every screen is built
to match it. Skill: `.agents/skills/design-first/`.

## 1. Brief → design constraints (Claude, 2 min)

From `context/brief.md`: the inspiration game, its core gesture, the screens the
loop needs (start, play, end; others only if needed), mood, and the studio's taste
(relaxing, minimal, polished).

## 2. Three real directions (Claude, ~10 min)

Three **genuinely different** directions — palette, shape language, type, mood.
Static HTML mockups of each key screen: the game stage (portrait, phone-shaped for a
mobile-inspired game) centred on a 1440×900 desktop canvas, in
`design/directions/<a|b|c>/`, with real game content.

## 3. Push into Figma (Claude, ~2 min)

One Figma file "<game> — directions", rows A/B/C × columns = screens, via the
Figma MCP `generate_figma_design`. Send the owner the link.

## 4. Pick and refine (owner, ~10–15 min)

Pick a direction. Refine it by hand in Figma, or by telling Claude what to change.
Name final frames `01 Start`, `02 Play`, `03 End` (+ any extras). Tell Claude
"done" with the frame link. Note in `PLAN.md` which edits were by hand.

## 5. Lock specs (Claude, ~5 min)

Read the chosen frames once (reads are rate-limited):
- `design/tokens.css` — colours, type scale, radii, spacing, shadows, motion.
- `design/specs/<screen>.md` — layout, every element, states (hover, pressed,
  disabled), what animates.
- `design/frames/<screen>.png` — the reference image for comparisons.
If the Figma read fails, export the frames as PNG into `inbox/design/`.

## 6. Build backwards (Claude)

Play screen first, then the rest in flow order. After each screen
`npm run shots` and compare with its frame. Fix the largest visible difference
first. Done only when it matches at 1440×900, or the difference is deliberate
and logged in `PLAN.md`.

## Never

- Never let the worker (or any agent) invent UI that no frame shows.
- Never restyle what the owner edited without asking.
- Never ship default browser fonts, buttons, scrollbars or focus rings.
