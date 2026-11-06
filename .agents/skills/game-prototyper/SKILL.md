---
name: game-prototyper
description: Build and extend a zero-build HTML5 browser game prototype for a desktop browser in this workspace — the core loop of a chosen game, with a pure tested engine, a thin view, save data, sound, smoke test and Cloudflare deploy. Use whenever writing or changing game code inside the window.
---

# Game prototyper

There is no starter: create the structure with `game-scaffold`, the look with
`design-first`, the sound with `game-audio`, the feel with `game-feel`. Read the
contract in `PLAN.md` before changing code.

## Prototype sense

- Build what the brief asks for. If it is based on an existing game, build its **core
  loop** (the part that makes people keep playing), not a full copy. Start → play → end/fail → restart must work.
- Name the one question the prototype answers (`scale-or-kill`) and cut anything
  that doesn't help answer it: menus, accounts, ads, IAP, online leaderboards,
  backends, cross-device work.
- First playable fast (target: about an hour in), deployed; then polish.
- **Riskiest part first:** build the thing you're least sure about (the signature
  moment, the camera, the one mechanic) with placeholders around it — not the parts
  you already know work. A prototype proves roughly the first ten minutes of appeal,
  not long-term retention; say so in the verdict.

## Working with the agent

- **Ask for checkable changes:** a number or an observable result ("air time
  ~0.6 s", "the ring settles in under 200 ms"), never "make it better". Report
  problems as what you saw plus the direction of the fix ("the fall is too slow").
- **The agent measures, the owner judges:** the agent plays the build through
  `window.__GAME__` / the smoke test and reports values and screenshots; whether it
  is fun is the owner's call after playing it.
- **Unsure between two approaches?** Build both behind a `CONFIG` switch or `?variant=`
  and play them side by side for two minutes; decide from that, not from discussion.

## Desktop rules

- Opened in a desktop browser: mouse first, keyboard shortcuts (Space/Enter
  start or restart, Esc pause, arrows/WASD only if the game needs them).
- Pointer events, so touch works for free; never hover-only information.
- Centred stage that reads well at 1280–1920 px wide; nothing important near the
  window edges; no scrollbars.

## Architecture

Pure engine (`createGame`, `step`, `tick` → `{ state, events }`), `CONFIG` for
every tuning number, seeded RNG, view reacts to events, versioned save data, a
`window.__GAME__` hook for the smoke test. Details: `game-scaffold`.

## Rules

- New rules or mechanics come with an engine test in `tests/`.
- Every input gets feedback within one frame: visual response + sound.
- Celebration only on real events (clear, win, best score).
- Before deploy: `npm run verify` (tests + real-browser smoke). Never bypass it.
- Keep text in the game UI minimal; prefer icons, rings, pips and motion.
- Assets small: SVG/CSS where possible, compressed images, short mono sounds.
