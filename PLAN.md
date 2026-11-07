# PLAN — Chain Runner (working title)

> Per-game plan. Claude keeps it current; any agent or a fresh context window must
> be able to resume from this file alone. Clock times are local (window 14:00–18:00).

**Design locked:** 14:43 — owner picked both: one layout, Paper Daylight as the early stage of a run and Neon Dusk as the later stage (palette blends with distance). Frames: `design/frames/play-day.png`, `play-dusk.png` (+ start/end); tokens `design/tokens.css`; spec `design/specs/play.md`. Figma edits: none by hand yet.

**Status:** not started · **Live URL:** https://infinity.chitswa.com (placeholder; fallback https://infinity-games-interview.malvinchitswamatombo.workers.dev) · **Last good deploy:** playtest-1 fixes, version f3d5f8c1 (smoke passed on workers.dev, 15:01)

## Outcome

A Subway Surfers-style three-lane runner where your route is a colour chain: collect
same-colour gems (match-3 from Candy Crush / Royal Match) to cash in combos while a
shadow storm chases you — proving Infinity can ship arcade feel with a puzzle decision at its heart.

## Prototype brief (scale-or-kill, written 14:35 before the build)

```text
QUESTION:   Does choosing lanes by colour turn a runner's dodging into a satisfying puzzle decision at speed?
CORE ACTION: switch lane to keep a colour chain going (and jump the odd barrier)
KEEP IF:    a new player builds a 3+ chain on purpose within ~30 s, unprompted, and restarts without being asked
KILL IF:    players ignore colour and just dodge; it only works once explained; the chain bar is unreadable at speed
GATE:       first-session fun
DIVERGENCE: a runner where you score by building colour chains, not by collecting coins — the chain bar is the score, the chaser is the life bar
```

## The game choice

Charts: Google Play (owner's phone), 2026-11-07 14:06 — `context/charts/`.

| Candidate | Core loop | Provable in ~2 h? | Fit with the studio | Pick |
| --- | --- | --- | --- | --- |
| **Amaze GO!** (#5 top free, 100M+) | Tap a piece; it slides out along its arrow unless something blocks it; clear the board | Yes: grid + slide + levels generated backwards (always solvable) | Highest: same "calm, zero noise" promise; twist removes the hearts, each exit plays a note | Recommended |
| **Paper.io 2** (#16 top free) | Steer out of your land, loop back, the enclosed area becomes yours | Yes, medium: grid flood-fill; no online rivals | Strong if reframed: a line of light (Linea) painting a picture, no death | Bold option |
| **Block Blast!** (#9 top free, 4.8★) | Drag shapes onto an 8×8 grid; full rows/columns clear | Yes: simple rules, proven | Good: no timer already; twist needed to not be a clone | |
| **Subway Surfers** (#23 top free) | Three-lane runner: swipe to dodge, jump, collect | Risky: pseudo-3D, feel-heavy | Closest to the Hover Rush wish; calm only if stumbles slow you instead of ending the run | Wildcard |
| Magic Sort! (#2 top free) | Pour colour layers between tubes | Very safe | Calm already; twist mostly cosmetic | Reserve |

## Architecture contract (lock by 14:15; change only with a note below)

- **Stage:** centred on a desktop screen (checked at 1440×900); portrait, phone-shaped
  for a mobile-inspired game, landscape only if the brief or the game needs it; mouse
  first; Space/Enter start or restart, Esc pause.
- **Engine (`public/src/engine.js`):** `createGame(config, seed) → state`,
  `step(state, action) → { state, events }`, `tick(state, dtMs) → { state, events }`.
  Pure: no DOM, no `Math.random` (seeded RNG), no timers.
- **Engine (as built, 14:40):** `createGame(CONFIG, seed)`, `step(state, {type})`, `tick(state, dtMs)`; helpers
  `baseSpeed`, `chaserPace`, `jumpHeight(state)`, `chainPoints(config, n)`, `summary(state)`.
  Fake 3D (pseudo-3D canvas road); the engine works in metres (`distance`, item `z`), lanes 0–2.
- **Actions:** `left`, `right`, `jump` (no slide).
- **Events** the view and audio react to: `lane`, `edge`, `jump`, `land`, `vault`, `collect {color,count}`,
  `match {color,count,points,multiplier,max,stepBack?}`, `break {color,count}`, `stumble {cause:'break'|'hit'}`,
  `setting {index}`, `caught {score,distance}`.
- **Rules:** chain of 1–2 broken → 0 points + stumble; cashed 3/4/5 → 100/200/300; 6 bursts by itself → 400 and
  the chaser falls back 8 m. Chaser gap (m) is the life bar; caught at 0. Speed 16→34 m/s. Colours:
  ember, tide, leaf, sun (each with its own shape). Barriers from 320 m. Setting changes every 900 m (4 settings).
- **Save data (`public/src/storage.js`):** `{ version: 1, best, runs, settings: { sound } }`, key exported as `STORAGE_KEY`.
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

## Optional (ranked; seen items first, each with a gate)

| # | Item | Seen by the assessor? (video / first 2 min) | Only if … by | Status |
| --- | --- | --- | --- | --- |
| 1 | | | | |

Unseen work (server telemetry, backend, accounts, leaderboards, consent) is not
built in the window; it becomes the Q6 answer. Local telemetry is mandatory and
small (`game-scaffold` → Telemetry).

## Screens (in flow order)

| Screen | Figma frame | Built | Matches frame | Notes |
| --- | --- | --- | --- | --- |
| Start | | | | |
| Play | | | | |
| End | | | | |

## Decision log

| Time | Decision | Why | By hand? |
| --- | --- | --- | --- |
| 13:29 | D1 `infinitytelemetry` (WEUR) and R2 `infinity-assets` created; bound as `DB` / `BUCKET` in `wrangler.jsonc` | Owner asked for telemetry storage and a bucket "just in case" | No |
| 13:29 | Launch URL is https://infinity.chitswa.com; GitHub repo `infinity` (private, assessors added as collaborators) | Owner can't yet guarantee no key leaks or run security tests | Repo created by owner |
| 13:44 | Bot protection on chitswa.com left as is; live smoke checks use the workers.dev URL | Owner: don't weaken domain security for a playtest | — |
| 13:44 | One Claude session (from 13:27) for the whole day, logged whole | Owner's AI data was cleared before 13:27 | — |
| 14:16 | Arcade over calm puzzle: a Subway Surfers runner (top free #23) with a match-3 colour chain as the twist (Candy Crush #5 / Royal Match #7 top grossing) | Owner: shows both puzzle and arcade skill; Infinity's newer releases are arcade | Owner's idea |
| 14:24 | Fake 3D (pseudo-3D canvas road) now; three.js upgrade only if time allows | Owner's call; cheapest technique that sells depth | — |
| 14:24 | Controls: lanes ←/→ (A/D, click halves), Space jump, no slide (swipe-down could refresh the page) | Owner | — |
| 14:24 | Endless run, speeds up, score + best; background setting changes slowly over the run | Owner | — |
| 14:24 | Failure = visible chaser distance (life bar), caught = run over | Accepted Q3 | — |
| 14:29 | Scoring 3/4/5/6 → ×1/×2/×3/×4 (100 each step), 6 = auto-burst + chaser back; 1–2 = stumble; chaser = shadow storm; neon road through changing settings; 4 colours with shapes; design gate kept via fast path (2 directions) | Owner: "proceed" to Q2b, Q7–Q9 | — |
| 14:40 | Engine balance check: an idle bot survives 22–80 s, a lane-choosing bot 75–150 s | Skill matters; runs fit a 3-min video | — |
| 14:41 | Use both directions: Daylight → Dusk as the run goes on (the setting change) | Owner: "think of one design as the design at a later stage" | — |
| 14:41 | Figma: directions pushed as editable vectors via the Figma MCP (image upload is blocked from Claude's sandbox) | Owner asked for Figma | — |
| 15:10 | Playtest 1 (`authors-raw-notes/2026-11-07-playtest-chroma-rush-1.md`): lanes no longer hold one colour for 3–7 rows; each row is mixed, with one "thread" colour weaving through neighbouring lanes for 3–6 rows so a chain is always possible | Owner: "why am i seeing an entire line of the same colour" | No |
| 15:10 | Colours unlock by score: 3 (ember, tide, sun) → 4 at 1,000 (leaf) → 5 at 3,000 (new plum ★); unlock shows the new gem + "NEW" and plays the burst sound | Owner's rule | No |
| 15:10 | Storm starts at full gap, off-screen, and always creeps in (pace 1.006× rising); every cashed 3/4/5 chain pushes it back 1.5/3/4.5 m (6 still 8 m); break stumble softened (300 ms, 0.75×) | Owner: "it should start without one, as it slowly catches up". Without push-back, runs ended at the same time regardless of skill. Bots: idle 40–51 s, chain bot 83–160 s | No |
| 15:10 | Speed now ramps 15 → 40 m/s over ~3.5 min (was 16 → 34 over ~2 min) | Owner: "the game gets faster the longer you play" | No |

## Polish backlog (ranked; visual gaps first)

1.
