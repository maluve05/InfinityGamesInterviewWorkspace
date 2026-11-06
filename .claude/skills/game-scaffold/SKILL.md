---
name: game-scaffold
description: Recreate, from scratch and in one or two prompts, the plumbing for a zero-build desktop browser game prototype — pure engine with headless tests, view/controller, screen flow, save data, audio unlock, debug hooks for the smoke test, and deploy readiness. Use right after the brief and contract are locked, before building screens. Contains no game code — only the recipe.
---

# Game scaffold (recipe, not code)

The workspace deliberately ships with **no game code**: everything game-related is
written inside the window. This skill lets you rebuild the proven structure fast.
Write it fresh for the chosen game; do not paste code from earlier prototypes.

## Inputs

`context/brief.md` (core loop, save-data schema), the contract in `PLAN.md`
(engine API, event names, screens) and the five-line prototype brief from
`scale-or-kill` (question, core action, keep if, kill if, gate). If the contract
isn't locked, lock it first.

## Files to create (in this order)

| File | Responsibility | Must not |
| --- | --- | --- |
| `public/src/config.js` | Frozen `CONFIG`: every tuning number (sizes, speeds, timings, scoring, colours that are gameplay-relevant) | contain logic |
| `public/src/rng.js` | Seeded PRNG (e.g. mulberry32): `next(seed) → { value, seed }` | use `Math.random` |
| `public/src/engine.js` | Pure rules. `createGame(config, seed, opts) → state`; `step(state, action) → { state, events }`; `tick(state, dtMs) → { state, events }` (only if time matters). Events are plain objects (`{ type: 'clear', lines: 2 }`) | touch DOM, timers, storage, `Math.random`, `Date` |
| `public/src/storage.js` | Versioned save data in localStorage: `load/save/update/reset`, `export const STORAGE_KEY`, never throws (in-memory fallback), migrates unknown versions | throw on blocked storage |
| `public/src/audio.js` | `unlock()` on first click/key; `load(map)` for samples; `play(name, { pitch, volume })` with slight random pitch on repeats; procedural fallback via ZzFX (soft settings) for any missing sample; respects a mute setting | autoplay before a gesture |
| `public/src/screens.js` | `show(name)` toggles `section[data-screen]`; current screen stored on `<body data-current>` | put `data-screen` on `<body>` (it would hide the whole page) |
| `public/src/view.js` | Renders state (DOM or canvas), reacts to events with animation; reads design tokens | change engine state |
| `public/src/main.js` | Controller: input → `step` → events → view/audio/storage; rAF loop with clamped `dt`; time-based games step the engine at a fixed simulation step through an accumulator (render rate never changes the outcome); keyboard (Space/Enter start or restart, Esc pause, arrows/WASD if the game needs them); exposes `window.__GAME__` | contain rules |
| `public/index.html` | One `section[data-screen]` per screen, `<link rel="icon" href="data:,">`, one `<script type="importmap">` pinning exact versions from jsDelivr, module script | load anything from localhost; use `@latest` or unpinned versions |
| `public/src/debug.js` | Only when the URL has `?debug`: a lil-gui panel bound to the `CONFIG` numbers (feel presets, speeds, timings) for live tuning; copy good values back into `config.js` | load or show anything without `?debug` |
| `tests/engine.test.mjs` | `node:test` + `node:assert/strict`: rules, win/lose, scoring, determinism (same seed → same game), 2–3 "golden seeds" whose outcome is pinned; for races, a scripted safe line reaches the finish | need a browser |

Libraries (exact versions and URLs: `knowledge/production-toolkit.md` §2): lil-gui
for `debug.js`, ZzFX for the audio fallback, three.js only for real 3D. Tweens are
CSS transitions plus a few easing functions by default; add GSAP only when there is
a sequence to choreograph (menus, finale).

## Rules that keep the engine honest (board and puzzle games)

- Resolve until stable: after a move, re-apply the rules (matches, falls, fills)
  until nothing changes, emitting one event per step so the view can animate each.
- Undo restores **everything**, including the RNG seed, score and move count —
  otherwise undo becomes a free re-roll.
- The controller queues (or ignores) input while the board is resolving or
  animating; one move at a time.
- Generated or shuffled boards are verified solvable (generate-and-check, or build
  backwards from a solution); hand-authored levels get a test that solves them.
- Each of these gets a headless test where it applies.

## Never-stuck guarantee and idle hint

Unless the brief or the genre rules it out, build principle 13 of
`knowledge/game-design-principles.md` from the start — read its nuances first:
- In the engine: detect "no legal action" and resolve it (reshuffle, add a piece,
  gentle reset) so it can't happen while playing; and a pure `findHint(state)` that
  returns *a* valid, ordinary move — never the optimal one, never hard-coded
  (single-solution puzzles: a direction, not the answer).
- In the controller: an idle timer (~5 s) reset by clicks, keys and drags only, not
  hover; pulse first, then a ghost-cursor demonstration; any action clears it
  instantly; emit a `hint_shown` telemetry event; never touch the grade.
- In tests: for several seeds/levels, applying `findHint`'s move is legal (and makes
  progress where that's measurable); a fresh or reshuffled board always has a hint.

## Debug hooks (the smoke test uses them)

`window.__GAME__` exposes: `state`, `screens` (names in flow order), `goTo(name)`
(switch screen for screenshots, setting up plausible state), and
`async smoke()` that drives the real flow (start → a few real moves → end →
restart) and returns an array of problem strings. Keep hooks tiny and honest:
they must use the same code paths as a player.

## Desktop stage

A centred stage on a desktop screen. For a mobile-game inspiration, portrait
(e.g. height `min(100dvh, 900px)`, aspect 9:16) with a calm background around it.
Below ~600 px wide, let the stage fill the screen (`100dvh`, no frame) — a few
lines of CSS, no other mobile work. Pointer events for input (touch then works for
free); `cursor` states for hoverable things; no hover-only information.

## Telemetry (boundary events only)

Record two events per attempt into an in-memory list (persisted to localStorage,
capped at ~500): `attempt_start` and `attempt_end` with `level`, `attempt_no`,
`result` (`win`/`lose`/`quit`), `duration_ms`, `grade`, `resource_left`, `cause`,
`ts`. Mark anything triggered by debug hooks with `debug: true`. Expose
`__GAME__.exportTelemetry()` returning JSON Lines; save it to
`logs/telemetry/<name>.jsonl` and run `npm run metrics`. Telemetry stays on the
device: no server, no personal data. See `knowledge/game-design-principles.md` §10.

## Pitfalls already paid for

- `data-screen` on `<body>` matched by the screen selector hid the entire page;
  headless tests passed while the browser showed white. Run `npm run smoke` early.
- An element with an infinite pulse animation never counts as "stable" for an
  automated click — the smoke test must `click({ force: true })` it.
- A missing favicon is a 404 that fails the smoke test; inline `data:,`.
- Tests that hard-code values another tool renames break later; export constants
  (like `STORAGE_KEY`) and import them in tests.
- More from the timed rehearsal (invisible goal, identical finale, hard-coded
  tutorial move, per-frame audio storm, debug data in telemetry):
  `knowledge/rehearsal-lessons.md`.

## Done when

`npm test` passes with real rule tests, `npm run smoke` passes (no console errors,
`__GAME__.smoke()` returns `[]`), and the first playable is deployed.

**Core-action checkpoint (~10 min) before the polish pass:** the core action works
with plain shapes, and someone who hasn't seen it does it on purpose within ~30 s
without being told how. If not, fix the action before adding juice — looks still
come first after that, but juice can't rescue a flat action.

**Credits:** `README.md` has a credits table for every third-party or generated
asset — asset, source or tool (with plan, e.g. "ElevenLabs Creator, student"),
licence, required credit, prompt or edits — filled in as assets arrive, not at the
end. "Free" or "AI-generated" is not a licence; check the terms at the source.

Then move on to screens with `design-first` and feel with `game-feel`.
