# PLAN — <game>

> Per-game plan. Claude keeps it current; any agent or a fresh context window must
> be able to resume from this file alone. Clock times are local (window 14:00–18:00).

**Design locked:** _not yet — no UI code until the owner picks a direction (AGENTS.md design gate)_

**Status:** not started · **Live URL:** https://infinity-games-interview.malvinchitswamatombo.workers.dev (placeholder) · **Last good deploy:** placeholder, version b833ca7a

## Outcome

_One sentence: the inspiration game, the core loop proven, why it looks and feels great._

## The game choice

| Candidate | Core loop | Provable in ~2 h? | Fit with the studio | Pick |
| --- | --- | --- | --- | --- |
| | | | | |

## Architecture contract (lock by 14:15; change only with a note below)

- **Stage:** centred on a desktop screen (checked at 1440×900); portrait, phone-shaped
  for a mobile-inspired game, landscape only if the brief or the game needs it; mouse
  first; Space/Enter start or restart, Esc pause.
- **Engine (`public/src/engine.js`):** `createGame(config, seed) → state`,
  `step(state, action) → { state, events }`, `tick(state, dtMs) → { state, events }`.
  Pure: no DOM, no `Math.random` (seeded RNG), no timers.
- **Actions:** …
- **Events** the view and audio react to: …
- **Save data (`public/src/storage.js`):** schema from `context/brief.md`.
- **Debug hook:** `window.__GAME__ = { state, screens, goTo, smoke }`.
- **Design tokens:** `design/tokens.css` (from the chosen Figma frames).

## Milestones

| Time | Milestone | Done when | Status |
| --- | --- | --- | --- |
| 14:15 | Brief decompiled, game picked, contract locked | Choice logged above | |
| 14:40 | Scaffold + engine tests; 3 directions in Figma | `npm test` green; owner sees directions | |
| 14:55 | Direction chosen and refined; tokens + specs locked | `design/specs/` filled | |
| 15:50 | Every screen built to its frame; loop playable | Owner plays start → end → restart | |
| 16:00 | **Complete prototype live** | `npm run verify` + deploy + private-window check | |
| 17:00 | **Freeze** after polish rounds; verdict settled | Last deploy verified | |
| 17:30 | Email sent | Sent | |

## Screens (in flow order)

| Screen | Figma frame | Built | Matches frame | Notes |
| --- | --- | --- | --- | --- |
| Start | | | | |
| Play | | | | |
| End | | | | |

## Decision log

| Time | Decision | Why | By hand? |
| --- | --- | --- | --- |
| | | | |

## Polish backlog (ranked; visual gaps first)

1.
