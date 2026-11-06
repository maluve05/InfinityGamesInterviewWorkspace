# Tool quirks (checked 2026-11-05)

## Antigravity CLI (`agy` 1.5.0; re-checked on 1.5.2, 2026-11-06)

- 1.5.2 (auto-updated): fence still holds — writes outside the allow-list and
  unlisted commands are denied, and **a denial ends the run**; `git status` runs
  without a rule (built-in read-only list). Full probe results:
  `processes/worker-dispatch.md`. Exit code 3 = `--print-timeout` expired.
- agy updates itself. If `agy --version` on the day isn't 1.5.2, run one small
  probe task before relying on the worker.

- Installed at `%LOCALAPPDATA%\agy\bin\agy.exe`. Install:
  `irm https://antigravity.google/cli/install.ps1 | iex` (verifies SHA-512).
- Headless: `agy -p "<prompt>" --output-format json` works from scripts with
  redirected output (the older hang issue #318 did not reproduce).
- `--mode auto` is **not available** on the owner's account → default mode
  soft-denies non-allow-listed commands; exit code stays 0; JSON lists
  `denied_actions`.
- Allow rules: `command(regex:^node( .*)?$)` works; `command(node)` matches only
  bare `node`. `write_file(<dir>/)` scopes writes. Use `--settings '<json>'` per run.
- `--output-format stream-json` shows every tool call — use it to debug denials.
- Models: `agy models` (gemini-3.8-flash-high is the worker).
- Transcripts: `~/.gemini/antigravity-cli/conversations/` and `brain/`.
- Antigravity reads skills from `.agents/skills/` (default) and `.agent/skills/`
  (legacy); rules from `.agent/rules/`.

## Figma MCP

- Owner's account: Education plan (student), admin. Education plans get the
  Professional Full-seat limits: 200 read calls/day, 10/minute.
  `whoami` still shows seat "View" — believed cosmetic; **confirm with one real
  read in the rehearsal**.
- Write tools (`generate_figma_design`, `create_new_file`, `whoami`) are exempt
  from rate limits.
- Read once, save to `design/specs/` and `design/frames/`; don't re-read for
  small questions.

## Claude Code

- Skills installed mid-session don't appear in the `/` menu until a new session.
- The skills CLI (`npx skills add …`) symlinks Claude's copy with an absolute
  path; that breaks when a folder is copied. This template uses real copies
  (`npm run skills:sync`).
- `grill-me` only says "call grilling" — both skills must be installed.

## Cloudflare

- `wrangler` is a dev dependency; `npx wrangler login` once per machine.
- npm 11 skips install scripts for `esbuild`/`workerd` unless approved; static
  asset deploys don't need them. If `wrangler dev` complains, run
  `npm install-scripts approve esbuild workerd` then `npm rebuild`.

## Gemini worker as a researcher (tested 2026-11-06)

- Headless `agy` has `search_web`, `read_url_content` and browser tools; web research
  needs no permission rule. Tell it explicitly never to use `run_command` — it otherwise
  writes Python scripts to fetch pages, which are denied and stop the run.
- Accuracy: facts were mostly right, but **links were often invented or misattributed**
  (18 of 48 store links in one report did not exist; a cited interview returned 404 for a
  claim that was true). Ratings came from third-party trackers instead of the store.
- So: always spot-check worker research against primary sources (fetch the store page,
  open the cited article) before using a number. Google Play pages can be fetched with
  curl and show the title, "Rated X stars" and the downloads tier.
- Long runs can end with `status: ERROR` ("stream was interrupted") after the report is
  already written — check the file before re-running.
