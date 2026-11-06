# Infinity Games Interview Workspace

The workspace for a timed, AI-assisted browser game prototype (Infinity Games
"Vibe Coder" assessment). It starts **blank on purpose**: no code related to the
game, mechanic or prototype exists before the window opens. What's here is the
deploy pipeline, general AI rules, skills, and game-independent tooling — all of
which goes into the prompt log.

**Claude Code** leads (brief, design, all UI, decisions, review). **Antigravity's
Gemini** takes bounded non-visual tasks through `npm run worker`.

## The day

| Time | What happens |
| --- | --- |
| 14:00–14:15 | Brief → `context/brief.md`; pick the game the brief calls for; lock the contract |
| 14:15–14:55 | Scaffold + tests (worker) · three directions in Figma (Claude) · you pick and refine |
| 14:55–16:00 | Build every screen to its frame → **complete prototype live** |
| 16:00–17:00 | Ranked polish rounds → deploy each |
| 17:00 | **Freeze** → verdict, video, prompt log, written answers |
| 17:30–18:00 | Buffer; send when ready |

Full runbook: [processes/assessment-day.md](processes/assessment-day.md).

## Commands

| Command | What it does |
| --- | --- |
| `npm run serve` | Serve `public/` at http://localhost:5173 |
| `npm test` | Headless tests in `tests/` (written inside the window) |
| `npm run smoke` / `npm run shots` | Real desktop browser check (1440×900); `shots` saves screenshots to `design/compare/` |
| `npm run verify` | At least one `*.test.mjs` exists, then `test` + `smoke` — required before every deploy |
| `npm run deploy` | Verify, then deploy `public/` to Cloudflare |
| `npm run worker -- T3` | Send task T3 from `TASKS.md` to the Gemini worker |
| `npm run logs` | Whole prompt log at the freeze: Claude sessions active from 7 Nov 13:30 (`.env` values redacted), worker transcripts, rules files |
| `npm run logs:claude` / `logs:worker` / `logs:rules` | The three parts of `logs` on their own |
| `npm run metrics` | Attempt metrics from the game's telemetry export, for the scale-or-kill call |
| `npm run models -- search "car" --cc0` | Search Poly Pizza low-poly models; `download <id>` saves a GLB + credit (inside the window only; key in `.env`) |
| `npm run skills:sync` | Copy `.agents/skills` → `.claude/skills` (real files) |
| `npm run check` / `check:pre-window` | Workspace integrity; pre-window also proves there's no game code |

## Skills (`.agents/skills/`, synced to `.claude/skills/`)

`game-brainstorm` (ideas under pressure) · `game-scaffold` (rebuild the plumbing from a recipe) · `design-first` ·
`game-prototyper` · `game-feel` · `game-audio` · `scale-or-kill` ·
`browser-visual-review` · `submission` · `plan` · `feature-handoff` ·
`grill-me` + `grilling` · `find-skills` · three.js: `threejs-fundamentals`, `threejs-interaction`, `threejs-animation`, `threejs-postprocessing`, `threejs-performance` (cloudai-x/threejs-skills, MIT)

## Knowledge

`knowledge/game-design-principles.md` (14 principles for calm prototypes, motivation
drives, anti-patterns) · `knowledge/rehearsal-lessons.md` (what the timed rehearsal
got wrong) · `knowledge/market-and-studio.md` (studio style guide, charts, shortlist) · `knowledge/playtest-insights.md` (analysis of the owner's playtests)
· `knowledge/fast-3d.md` (pseudo-3D, sprites or three.js; the signature moment; free assets) · `knowledge/fast-racing-principles.md` (racing/runner/arcade design rules) · `knowledge/production-toolkit.md` (game-feel values, pinned CDN libraries, asset licences, how studios scale or kill) · `knowledge/calm-harvest-lessons.md` · `knowledge/tool-quirks.md`

## Credits

`grill-me` and `grilling`: [mattpocock/skills](https://github.com/mattpocock/skills)
(MIT). `plan`, `feature-handoff` and `browser-visual-review` adapted from
[Mr. Mak Workspace](https://github.com/witnesstodark/mr-mak-workspace) (MIT).

## Author's raw notes

`authors-raw-notes/` holds the owner's unedited thoughts (typos included). Never edited; analysis goes in separate files. Included in the submission.
