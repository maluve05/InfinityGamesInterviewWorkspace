# PLAN — Chain Runner (working title)

> Per-game plan. Claude keeps it current; any agent or a fresh context window must
> be able to resume from this file alone. Clock times are local (window 14:00–18:00).

**Design locked:** 14:43 — owner picked both: one layout, Paper Daylight as the early stage of a run and Neon Dusk as the later stage (palette blends with distance). Frames: `design/frames/play-day.png`, `play-dusk.png` (+ start/end); tokens `design/tokens.css`; spec `design/specs/play.md`. Figma edits: none by hand yet.

**Status:** not started · **Live URL:** https://infinity.chitswa.com (placeholder; fallback https://infinity-games-interview.malvinchitswamatombo.workers.dev) · **Last good deploy:** gems 30%, runner smoothing, storm art, skip, tutorial fix, version f6f77029 (16:43, jump rework); before that f577e2eb (16:37); before that ab8ee11a (16:32, darker sky); before that 162e46d8 (16:30, light rain); before that 271d7f8c (16:24, jump-at-gem, slipstream, lightning); before that 67ea7ade (16:19, scoring ×3); before that 5d359fe9 (16:18, scoring ×10); before that 34559450 (16:16, T8 jump/spacing); before that 9309e2c1 (16:13, jump animation); before that aad73c19 (16:08); before that 8391482e (15:52); before that playtest-1 fixes, version f3d5f8c1 (smoke passed on workers.dev, 15:01)

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
| 1 | Bigger runner, dino proportions (runner ≈ ¼ stage height, barrier ≈ ½ runner) — Claude, view | Yes, every second | always | todo |
| 2 | Dino-style jump + fair barrier gaps — T3, Antigravity | Yes | always | doing |
| 3 | Tutorial run: engine T4 (Antigravity) + hint graphics (Claude) | Yes, first 20 s | T3 accepted by 16:15 | todo |
| 4 | Concept art: 10 ElevenLabs frames → owner picks runner + look | Indirectly (sets the bar) | started 15:20; pick by 15:45 | doing |
| 5 | Build the picked look: runner, painted backdrops per world, themed barriers | Yes | pick made by 15:45; land by 16:45 | todo |
| 6 | Four worlds (Desert Dawn → Coral Coast → Neon City Dusk → Aurora Tundra) | Yes, after ~1 min | #5 done by 16:30 | todo |
| 7 | Moments: new-colour unlock, 6-burst, caught — restyled to concepts | Yes | #5 done by 16:40 | todo |

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
| 15:15 | Engine/algorithm work now goes to Antigravity; Claude codes only how the game looks (also in AGENTS.md) | Owner instruction | — |
| 15:15 | T3 dino jump (hold = higher, ↓ = fast fall, speed-scaled barrier gap) and T4 tutorial run written for Antigravity | Owner playtest 2: runner tiny vs barriers, not enough space between jumps; "dont forget the tutorial" | — |
| 15:20 | Concept pass: 10 portrait frames in ElevenLabs (gpt-image-2), one runner design per frame (A–J); Figma frames are only the base, final look should go beyond them; runner picked from the 10 | Owner answers (`authors-raw-notes/2026-11-07-design-answers-1.md`); Q1/2/5/6/7 recommendations accepted by silence | — |
| 15:40 | T3 accepted (dino jump: full 1.73 m, tap 1.0 m; speed-scaled barrier gap) | Claude reran tests 34/34; diff inside the fence | — |
| 15:45 | Target look = concept 04 (Coral Coast jump), Canvas 2D fake 3D only; plan in `design/specs/frame4-render-plan.md` (segment road + billboards + DKC-style pre-rendered sprites from ElevenLabs + cut-out runner rig + parallax) | Owner direction (`authors-raw-notes/2026-11-07-direction-frame4-canvas.md`); research 15:40 | — |
| 15:45 | Chaser becomes discrete steps (3 mistakes = caught, 6-combo earns a step back, max 3) — T5 for Antigravity after the grilling answers | Owner rule | — |
| 15:50 | No shield banking: a 6-combo at step 0 does nothing (T5 updated) | Owner: "dont add any banking of shields or it becomes too easy" | — |
| 15:55 | T4 accepted (tutorial engine); smoke test skips the tutorial for its idle run (debug only) | 39/39 tests, smoke green | — |
| ~15:30 | Runner = pre-rendered frames (8-frame back-view run cycle + jump/land/stumble/idle) instead of a cut-out rig: the generated parts were 3/4 view with joint pegs | DKC approach; consistent within one sheet | — |
| ~15:35 | Frame-4 look in Canvas 2D: painted backdrop, OutRun raster road with texture, projected props (palm, coral, lamp, hut, buoy), sprite gems/barrier, white scarf tinted to the chain colour, squash/stretch, tutorial hints (arrow + keycaps) | Owner direction 15:35 | No |
| ~15:40 | Deploy refused by the local smoke (NaN in storm gradient) because T5 changed config mid-deploy; live stays on the previous version. View now reads `chaserStep` or the old gap | Honest record | — |
| 15:45 | Times on the three rows above were Claude's guesses written without checking the clock (logged as 16:10–16:30); corrected to ~15:30–15:40 after `date` showed 15:45 | Honest record | — |
| 15:45 | Next: soundtrack + SFX (Claude, `game-audio`), storm restyle, T5 review + deploy; other worlds only if no major sacrifice (gate 16:45) | Owner | — |
| 15:50 | Audio: 96 s instrumental C-major run music + surf loop + 15 SFX from ElevenLabs (2 takes each), chosen by measured onset/loudness (`design/specs/audio-takes.md`), trimmed + normalised by `tools/audio-prep.py`, music crossfaded into a seamless loop; wired in audio.js/main.js with procedural fallback | Owner asked for soundtrack + SFX. Claude can't listen: owner's ears are the real check | No |
| 15:52 | T5 accepted (45/45 tests); deployed 8391482e: frame-4 look, tutorial hints, chaser steps, audio. Smoke green local + live | — | — |
| 15:55 | Other worlds dropped (owner: "forget about the other worlds"); renderer kept data-driven with the coast only. Painted storm bank replaces vector clouds | Owner | — |
| 15:56 | T6 for Antigravity: a high jump carries you over a gem (skip, no collect, no penalty) + room to land after barriers. View/audio feedback for `skip` ready | Owner playtest: jump still collected the gem below; Claude's T3 spec missed it | — |
| 16:00 | T6 accepted (50/50). Gems shrunk to 30% of the runner's height, floating at the engine's 0.9 m. Runner smoothing in the view only: in-between run frames blended by phase, 90 ms pose crossfades, lane-switch ghost trail, chain-colour glow, footfall dust (2–4 extra draws/frame, no input or sim latency) | Owner: "gems … 30% the size of the main character", "smoother … without sacrificing on game latency" | No |
| 16:00 | T7 for Antigravity: tutorial can never stall (full-width jump barrier, respawn when passed, 12 s per step / 45 s total limits) | Owner: failing the tutorial ran forever. Root cause: one-lane barrier, dodgeable by a lane change | — |
| 16:07 | T7 accepted (53/53). Deploy 5849c16b failed the live smoke (road texture read before it loaded on the real network: null naturalWidth) — a 6-minute bad live version; fixed with a flat-colour fallback and redeployed aad73c19, smoke green local + live | Honest record: Claude's bug, live-only timing | — |
| 16:05 | Owner runs all playtests; Claude stops driving the browser (tests + smoke only) | Owner: "its not you who runs the playtests, its me. otherwise you waste credits" | — |
| 16:13 | Jump animation uses the lane-change technique: run sprite frozen on its take-off stride, smooth lift, lean by vertical speed, vertical ghost trail; jump/land/stumble pose frames removed; squash/stretch ~80 ms. Deployed 9309e2c1, smoke green local + live | Owner: "i dont think you using three different frames is a good idea … use those exact same techniques on jumping" | No |
| 16:13 | T8 for Antigravity: airborne = no pickup (skip height 0.25 m), rows 15 m apart, jump airtime −30% at the same peak | Owner: jump still collects, gems too close. T6's 1.25 m skip height only covered ~5 m of a jump | — |
| 16:14 | Owner stopped Antigravity ("takes too long … do it yourself"); Claude did T8 directly in engine.js/config.js/tests | Owner instruction | — |
| 16:16 | T8 done: any jump skips gems, rows 15 m apart (tutorial 18 m), jump 1.62 m peak in 0.48 s, tap 1.0–1.2 m. Tests 54/54 (jump ratio test retuned 1.6× → 1.3×; tap-doesn't-skip test replaced per owner rule). Deployed 34559450, smoke green local + live | Owner playtest 16:09 | No |
| 16:18 | Scoring ×10 for playtests (pointsPerStep 100 → 1,000); colour unlocks stay at 1,000 / 3,000, so the 4th and 5th colours come after a chain or two. Tests read points from CONFIG; the starting-palette test pins unlocks out of reach. Deployed 5d359fe9, smoke green local + live. **Decide before the video whether to keep it** | Owner: "increase the scoring by 10x so that i can achieve more within a short period in my playtests" | No |
| 16:19 | Scoring changed to ×3 (pointsPerStep 300: 3 → 300, 4 → 600, 5 → 900, 6 → 1,200); unlocks still at 1,000 / 3,000. Deployed 67ea7ade, smoke green local + live (54/54 tests) | Owner: "actually make it 3x not 10x. then deploy" | No |
| 16:24 | Jump-at-gem fix (Claude, engine): pressing jump marks the nearest gem ahead in the lane within reach (airtime × speed + 8 m) as jumped, skipped even after landing; mid-air lane change retargets. Cause: perspective makes a gem 7–15 m ahead look right in front, but a 0.48 s jump lands after ~7 m. 56/56 tests (2 new) | Owner: "why does jumping still collect the gem you are trying to jump over" | No |
| 16:24 | Slipstream (air streaks from the vanishing point; count/speed/length grow with distance, full by 2.5 km) and storm lightning (bolts beside the road with flash + thunder; rare far strikes at step 0, closer and more often at steps 1–2; none in the tutorial). Deployed 271d7f8c, smoke green local + live | Owner: "the game looks bland, add a lightning animation. and a slipstream … faster the further you get" | No |
| 16:30 | Light rain: thin slanted streaks (18 drops, +14 per storm step, ~20% opacity) and small splash rings on the road; drawn over the scene, under the storm and HUD. Deployed 162e46d8, smoke green local + live | Owner: "add rain storm animations (keep it light)" | No |
| 16:32 | Darker stormy sky: slate-blue multiply over the sky and sea only (top 50%, horizon 25%, +8%/+6% per storm step); road, runner, gems untouched. Deployed ab8ee11a, smoke green local + live | Owner: "make the sky darker too" | No |
| 16:36 | Antigravity kept working after being stopped: at 16:34–16:35 it edited config.js (skipHeightM 0 → 0.25), engine.js (`wasJumping`: a gem passed on the landing tick still counts as skipped) and skip.test.mjs (+1 test), and wrote reports/T8.md. Claude reviewed: compatible with the 16:24 jump-target fix; 57/57 tests; kept and redeployed | Honest record of a worker acting after the stop | — |
| 16:43 | Jump rework from the owner's Antigravity review (Claude, engine): peak chosen by hold time in a 140 ms window (tap 1.05 m → held 1.62 m); airtime shrinks with speed (0.5 s at base → 0.3 s min), arc ≤ one row at top speed; swept barrier check (above 0.9 m at entry AND exit, entry sign fixed); gem skipped only if ≥ 0.5 m above it; jump-target marking removed; 100 ms input buffer; swipe flick = full jump; 30% of barriers sit across the scoring thread. Coyote time not added: no ledges to run off. 62/62 tests (6 new, 5 updated to the new rules). Deployed, smoke green local + live | Owner: "based off of the conversation i had with antigravity" (`authors-raw-notes/2026-11-07-jump-review-from-antigravity-chat.md`) | No |
| 16:51 | Break the conveyor belt: barriers placed across the scoring thread (`threadBarrierChance: 0.40`), `barrierChance: 0.18`, and `gemChance: 0.65` (was 0.82) with guaranteed gem-per-row fallback. Sitting passively on the thread now leads into barriers, requiring jumps to keep streaks alive while opening tactical maneuvering space on off-thread lanes. Deployed 2fedff7b, smoke green local + live | Owner review: "best play is to sit on the thread and never jump ... board feel like a conveyor belt" (`authors-raw-notes/2026-11-07-gem-generator-conveyor-belt.md`) | No |
| 17:06 | Speed & speed-scaled scoring: base speed increased 1.5× (15 → 22.5 m/s), top speed increased to 2.5× base (56.25 m/s, accel 0.16 m/s²). Scoring scales proportionally with speed (`speedMultiplier` quantized in 0.1 increments from 1.0× to 2.5×, cashing in 3-chains yields 300–750 pts, 6-burst yields 1,200–3,000 pts). Jump airtime dynamically scaled (`airtimeMinS: 0.25`, `airtimeBaseS: 0.45`) ensuring jump arc ≤ 14.06 m within the 15 m row spacing at max speed. 63/63 tests passing. Deployed 8f893df4, smoke green local + live | Owner: "increase the starting speed of the game by 1.5 times and let it get faster to a limit of 2.5 times the starting speed. increase the scoring accordingly as the game gets faster too" (`authors-raw-notes/2026-11-07-speed-and-scaling-scores.md`) | No |
| 17:18 | Cloudflare D1 Telemetry & Cookie Consent: Activated D1 database `infinitytelemetry` (bound as `env.DB`) via Worker API (`worker/index.js` handling `POST`/`GET` `/api/telemetry`). Added cookie consent card to main menu with Accept and Essential options (stores in localStorage `infinity-cookie-consent`). All gameplay events (`session_start`, `attempt_start`, `attempt_end`, `ftue`) stream to D1 using constant demo user `demo_user`. Created `tools/export-telemetry.mjs` and wired `npm run metrics` directly to remote D1 exports. Deployed d216e365, smoke green local + live | Owner: "setup the telemetry using our the d1db you setup for this demo, it assumes its always the same user accessing the site. and you may setup the cookie consent on the main menu." (`authors-raw-notes/2026-11-07-telemetry-d1-cookie-consent.md`) | No |

## Polish backlog (ranked; visual gaps first)

1.
