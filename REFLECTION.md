# Written answers

> The worker keeps running notes during the build (decisions, tools, problems as
> they happen). Claude drafts the answers at the freeze. Replace the placeholders
> with the email's exact questions. Be specific and honest.

## Prepared before the window (disclose)

A blank repository wired to Cloudflare, general AI rules and skill files (in the
prompt log under `logs/rules/`), and game-independent tooling: a local server, a
browser smoke test, log export, a mailbox folder and script for handing tasks to a
second AI agent, a
telemetry metrics script and a Poly Pizza model search/download script. A
`knowledge/` folder of research done with AI before the day: the studio and the
charts, design principles, playtest notes, a production toolkit (game-feel values,
libraries, asset licences, how studios decide to scale or kill) and racing/arcade
principles. My own unedited notes are in `authors-raw-notes/`.
No code related to the game, mechanic or prototype existed before the window.

## Q1 — Which AI tools did you use, and how did you split the work between them?

We used Claude Code as the admin and lead for high-level architecture, design specifications, and visual Canvas 2D rendering, and Antigravity IDE (Gemini 3.8 Flash High) as the engine worker for physics, algorithmic track generation, test suites, and final delivery. For assets, ElevenLabs generated concept art backdrops, pre-rendered runner sprite sheets, and retro audio/SFX, while Figma MCP translated initial visual directions into tokens. Work was coordinated through an asynchronous committed mailbox (`claude antigravity and others/`) where tasks had explicit allow-lists, acceptance criteria, and verified reports.

## Q2 — What did the AI get wrong that you had to fix yourself?

The AI repeatedly struggled with nuanced game feel and systemic interaction: it generated jumps where airborne runners still collected gems due to flawed threshold formulas and inverted entry signs, built an infinite-loop stall in the tutorial by failing to block all lanes on jump steps, and made the board a passive conveyor belt by banning barriers from the scoring thread. The human owner had to diagnose these flaws in playtesting, demanding swept collision detection, active barriers across the scoring thread, responsive input buffering, and snappier jump arcs.

## Q3 — Who is the target player for this game, and where can they be found?

The target player is a casual-to-midcore mobile gamer who enjoys the rapid twitch reflexes of endless runners (*Subway Surfers*, Google Play top free #23) but craves the satisfying pattern-matching and combo cascades of puzzle games (*Royal Match*, *Candy Crush*). They can be found on TikTok, Instagram Reels, and YouTube Shorts engaging with satisfying mobile gaming clips, as well as browsing trending arcade and puzzle categories on the App Store and Google Play during commutes and breaks.

## Q4 — What's the one metric you'd watch in week one to decide if it's worth continuing?

The single metric to watch in week one is **Day 1 (D1) Retention, targeting $\ge 38\%$ (alongside average runs per daily active user $\ge 4.0$)**. If the core hybrid mechanic of dodging while building color chains is truly addictive, players will instinctively restart immediately upon being caught; if D1 retention falls below 30%, it indicates that matching colors at speed causes cognitive fatigue rather than flow.

## Q5 — How would you get users to play this game?

We would drive initial acquisition through short-form viral gameplay creatives (TikTok and Reels) highlighting the high-stakes tension of leaping barriers to protect a 5-chain combo right before the storm strikes, paired with playable HTML5 instant ads that let users play the 20-second tutorial directly in the feed. Once validated on web portals like CrazyGames and Poki for zero-cost organic retention data, we would scale paid acquisition on Meta Ads and Google App Campaigns (UAC) targeting runner and puzzle lookalikes.

## Scale or kill

**VERDICT: SCALE (PROCEED TO NEXT STAGE MILESTONE)**

- **Fun & Mechanics:** The core loop succeeds at turning traditional mindless runner dodging into a deliberate, satisfying tactical decision: risking a high-speed jump over a log to protect a 5-streak vs. bailing into an off-color safe lane creates real micro-thrills.
- **Studio Fit:** Fits Infinity Games' aesthetic of polished, visually elegant, highly readable arcade-puzzle hybrids with immediate pick-up-and-play appeal.
- **Market & UA Potential:** Combines the mass-market accessibility of endless runners with the high-retention monetization triggers of match-3 chains, offering massive creative flexibility for playable and video ads.
- **Next 3 Steps:** (1) Run a 500-player mobile cohort test measuring D1/D7 retention on touch devices; (2) Implement meta-progression (cosmetic character skins and unlockable color trails); (3) Introduce power-ups (wildcard rainbow gems and storm-freeze magnets).

## Running notes (worker appends; newest last)

- 16:51: Addressed the passive "conveyor belt" loop by spawning barriers directly on the scoring thread (`threadBarrierChance: 0.40`), tuning `barrierChance: 0.18`, and creating maneuvering gaps with `gemChance: 0.65`.
- 17:06: Implemented owner's speed and dynamic scoring request: boosted base speed 1.5× (22.5 m/s) with a ramp up to 2.5× (56.25 m/s). Scaled scoring multipliers dynamically with speed (1.0× to 2.5× in 0.1 increments), rewarding fast tactical play with up to 3,000 points per 6-burst. Dynamic airtime scaling (`airtimeMinS: 0.25`) keeps high-speed jump arcs strictly within row spacing. Deployed as version `8f893df4`. All 63 tests passing.
- 17:18: Wired Cloudflare D1 database `infinitytelemetry` to remote Worker API (`worker/index.js` handling `POST`/`GET` `/api/telemetry`). Added cookie consent banner to main menu (`public/index.html`, `public/src/style.css`, `public/src/main.js`). All game sessions, runs, and tutorial funnels stream to D1 for constant demo user `demo_user`. Built `tools/export-telemetry.mjs` allowing `npm run metrics` to ingest live D1 telemetry. Deployed as version `d216e365`. All 63 tests and live smoke passing.
