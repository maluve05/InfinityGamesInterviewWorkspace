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
| T3 | Dino-style jump + barrier gap rule | antigravity | todo | Owner playtest 2: not enough space between jumps |
| T4 | Tutorial run (engine + save flag) | antigravity | todo | After T3 (same files); Claude draws the hints |
