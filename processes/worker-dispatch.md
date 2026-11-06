# Dispatching the worker

Claude (admin) hands bounded, non-visual tasks to Gemini 3.8 Flash High. Default:
the **Antigravity IDE** through the mailbox `claude antigravity and others/` — your
only job is to say "claude has work for you". Backup: the Antigravity CLI headless.

## Flow (default: mailbox + Antigravity IDE)

1. Claude writes `claude antigravity and others/tasks/T<n>.md` (template in that
   folder's README): `may write`, `may run`, `must not touch`, `done when`,
   `context`. It adds a row to `TASKS.md`.
2. Claude starts `npm run mailbox -- wait T<n>` in the background and asks you to
   tell Antigravity "claude has work for you". Claude keeps working meanwhile.
3. Antigravity (rule: `.agent/rules/workspace.md`) takes each `todo` task one at a
   time, writes `reports/T<n>.md`, sets `status: review` or `blocked`, and says
   which tasks are done. You approve its terminal commands as it asks.
4. The wait ends and wakes Claude, which reads the report, checks `git diff`
   (anything outside `may write` is reverted) and re-runs the "done when" check
   itself. Only then is the task `done`.

**IDE setup:** open the IDE on this folder only; set agent terminal commands to ask
before running (not auto-run). The IDE has no allow-list like the CLI's
`--settings`, so the fence is the rule file, your approval of each command, and
Claude's diff review. An earlier IDE session wrote stray scripts into `tools/` and
started a public web server; `npm run check:pre-window` now fails on unknown tools,
and the README's fence forbids servers, installs and helper scripts.

## Backup: Antigravity CLI headless

`npm run worker -- T<n>` (Claude runs it in the background) reads the same task
file, turns `may write` / `may run` into scoped permission rules
(`write_file(<path>)`, `command(regex:^<cmd>( .*)?$)`), runs `agy -p … --model
gemini-3.8-flash-high --output-format stream-json`, saves the prompt and
transcript to `logs/worker/`, and fails loudly on denied actions or a missing
report. A single unlisted command ends a headless run (see the probes below) —
list every command a task needs, or use the IDE.

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
  `logs/worker/`; delete probe reports afterwards (they used `inbox/reports/`, which
  the mailbox has since replaced).

## First real run (2026-11-05)

T1 "tests for storage.js": 86 s, no denied actions, wrote only its allowed file,
report accurate (16/16 tests). Review still found one thing the worker couldn't
know: the tests hard-coded a value another script later renames. Review is not optional.

## Good worker tasks

Engine tests, level/data files, asset conversion (ffmpeg), library research
summaries, prompt-log export, REFLECTION running notes, README updates. Claude
does deploys itself.

## Not worker tasks

Anything visual (layout, CSS, animation, screens), design decisions, changing the
contract, anything the owner must decide.

## Fallback

If the IDE breaks: Claude runs the task headless (`npm run worker -- T<n>`). If
both fail: Freebuff opened on this folder, told "claude has work for you — follow
`claude antigravity and others/README.md`". Same mailbox, same reports.
