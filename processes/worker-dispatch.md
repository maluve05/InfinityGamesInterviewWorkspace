# Dispatching the Gemini worker

Claude (admin) hands bounded, non-visual tasks to Gemini 3.8 Flash High through
the Antigravity CLI, headless, from its own terminal. You don't copy anything.

## Flow

1. Claude writes the task in `TASKS.md` (format at the top of that file):
   `may write`, `may run`, `must not touch`, `done when`, `context`.
2. Claude runs `npm run worker -- T3` as a background shell command, so it keeps
   working on UI while the worker runs. Tasks with disjoint `may write` lists can
   run at the same time.
3. `tools/dispatch-worker.mjs`:
   - reads the task, builds the prompt (task + AGENTS.md worker rules + report format),
   - turns `may write` / `may run` into scoped permission rules
     (`write_file(<path>)`, `command(regex:^<cmd>( .*)?$)`),
   - runs `agy -p … --model gemini-3.8-flash-high --output-format stream-json`,
   - saves the prompt and the JSON result to `logs/worker/`,
   - **fails loudly if `denied_actions` is not empty** or the report is missing.
4. Claude reads `inbox/reports/T3.md`, checks the diff (`git diff`) and re-runs
   the task's "done when" check itself. Only then is the task marked `done`.

## Rules learned in testing (2026-11-05)

- `--mode auto` is not available on this account. In default mode any command not
  allow-listed is silently denied and the run still exits 0 — so always check
  `denied_actions`.
- `command(node)` only matches bare `node`. Use the regex form
  `command(regex:^node( .*)?$)`, which the script generates for you.
- Never use `--dangerously-skip-permissions`; the allow-list is the worker's fence.
- Typical run time: 10–70 s. Default timeout in the script: 10 minutes.

## Fence probes on agy 1.5.2 (2026-11-06)

Five headless probes with the allow-list `write_file(inbox/reports/)` +
`command(regex:^node( .*)?$)`:

| Attempt | Result |
| --- | --- |
| write `inbox/reports/…`, `node --version` | allowed |
| write `tools/PROBE-fence.txt` | **denied**, nothing written |
| `npm --version`, `git log --oneline -1` | **denied** |
| `git status` | allowed although not listed — agy has built-in read-only commands |

What this means for writing tasks:
- **One denial ends the whole run** after that step (status still `SUCCESS`, exit 0),
  usually before the report exists. The script reports it as a failure. So list
  every command the task needs in `may run`, including read-only ones such as
  `git diff` or `git log` — don't count on them being free.
- Don't rely on the allow-list to hide information: some read-only commands run
  anyway. It does stop writes and side effects.
- Exit code `3` means `--print-timeout` cut the turn (`finished_reason` is set);
  check whether the report was written before re-running.
- Workers summarise a little loosely (the probe listed 18 of 19 skill folders,
  missing `grill-me`). Review stays mandatory.
- Probe runs go straight to `agy`, not `npm run worker`, so they leave nothing in
  `logs/worker/`; delete probe reports from `inbox/reports/` afterwards.

## First real run (2026-11-05)

T1 "tests for storage.js": 86 s, no denied actions, wrote only its allowed file,
report accurate (16/16 tests). Review still found one thing the worker couldn't
know: the tests hard-coded a value another script later renames. Review is not optional.

## Good worker tasks

Engine tests, level/data files, deploys, asset conversion (ffmpeg), library
research summaries, prompt-log export, REFLECTION running notes, README updates.

## Not worker tasks

Anything visual (layout, CSS, animation, screens), design decisions, changing the
contract, anything the owner must decide.

## Fallback

If `agy` breaks: open the Antigravity IDE in this folder and type
"Do task T3 in TASKS.md and follow AGENTS.md". Same report location.
