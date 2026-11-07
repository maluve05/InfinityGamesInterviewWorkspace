---
name: browser-visual-review
description: Verify a visual or interaction change in a real desktop browser — smoke test, desktop screenshots compared against the Figma frames, a private-window check of the public link, and an honest evidence note. Use before calling a screen done and before every deploy.
---

# Browser visual review

Adapted from Mr Mak's `gameplay-visual-review` for desktop browser prototypes.

## Run

1. `npm run verify` — engine tests + headless desktop smoke test (loads with no
   console or network errors; `__GAME__.smoke()` drives start → play → end → restart).
2. `npm run shots` — 1440×900 screenshots of each screen into `design/compare/`.
3. Put each screenshot next to `design/frames/<screen>.png`. List differences in
   order of visibility: layout, scale, colour, type, spacing, missing states.
4. Fix the most visible one; repeat until it matches or the difference is a
   deliberate, logged choice.
5. Play it yourself at normal speed in a real desktop browser: mouse feel, hover
   states, keyboard shortcuts, sound after the first click, a full round.
6. After deploying: open the public link in a **private window** (and ideally on
   another network). A Cloudflare challenge page or a 404 here is a failed deploy.

## Judge appearance and behaviour separately

Tests prove rules and wiring, not looks. Screenshots prove looks, not timing or
feel. Say which kind of evidence each claim rests on.

## Leave evidence

In `PLAN.md` → Screens table: built ✓, matches frame ✓/✗ with the remaining gap,
what was played by hand. Agent verification is not owner acceptance.
