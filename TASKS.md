# TASKS — board

One row per worker task. The task itself lives in
`claude antigravity and others/tasks/T<n>.md` and the worker's report in
`claude antigravity and others/reports/T<n>.md` (protocol and templates: that
folder's `README.md`). Claude writes the task and the row, the owner tells the
worker "claude has work for you", Claude reviews the report and the diff and
only then marks the task `done`.

Status: `todo` → `doing` → `review` (worker finished) → `done` (Claude checked) ·
or `blocked` / `failed` with the reason.

| Task | Title | For | Status | Notes |
| --- | --- | --- | --- | --- |
| T1 | Sound list (ElevenLabs prompts per event) | antigravity | done | Claude reviewed 14:55: all events covered; prompts usable |
| T2 | Storage tests | antigravity | done | Claude re-ran: 22/22 pass; only tests/storage.test.mjs written |
| T3 | Dino-style jump + barrier gap rule | antigravity | done | Claude reviewed 15:40: in-fence diff, 34/34 tests on rerun; full jump peaks 1.73 m, tap 1.0 m |
| T4 | Tutorial run (engine + save flag) | antigravity | done | Claude reviewed 15:55: 39/39 tests; smoke needed a debug-only tutorial skip (Claude, main.js smoke hook) |
| T5 | Chaser as three steps (no creep, no shields) | antigravity | done | Claude reviewed 15:52: 45/45 tests, no gap/pace left in engine; view reads chaserStep |
| T6 | Jumping carries you over gems (skip) + room to land | antigravity | done | Claude reviewed 16:00: 50/50 tests; skip event matches the view contract |
| T7 | Tutorial can never get stuck (full-width barrier, respawn, time limits) | antigravity | done | Claude reviewed: 53/53 tests; 12 s step and 45 s total limits in config |
| T8 | Airborne = no pickup; rows 15 m apart; snappier jump | claude (owner stopped antigravity) | done | 16:16: 54/54 tests; jump 1.62 m / 0.48 s; bot with jump-dodging: 1,000 pts at 42–45 s on 2 of 3 seeds |
| T9 | Handoff: Antigravity leads the final stretch (submission + owner-requested fixes) | antigravity | todo | Claude out of credits 16:45 |
