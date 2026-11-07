---
name: engine-work-goes-to-antigravity
description: "Claude only writes visual code; engine, generation, balance and other algorithmic game changes are dispatched to the Antigravity worker"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 989b41b7-793e-42df-862c-7c9e4897ceec
  modified: 2026-11-07T15:02:22.352Z
---

Claude writes code only for how the game looks (view, CSS, HUD, effects, screens). Engine rules, track generation, tuning/balance, and other algorithmic changes go to Antigravity as a worker task (`claude antigravity and others/tasks/T<n>.md`); Claude writes the task with the acceptance tests and reviews the report and diff.

**Why:** After playtest 1 (2026-11-07), Claude rewrote engine.js generation, chaser pacing and config itself. The owner said: "next time, leave these algorithmic and game engine changes to antigravity, your code work should be only about how the game looks".

**How to apply:** When playtest feedback mixes logic and looks, split it. Write a T<n> task for the engine part, with exact rules, the files it may touch (engine.js, config.js, tests) and the checks it must pass. Do the view part yourself. Run the bot/balance checks when reviewing, not as the author.

Exception (2026-11-07 16:14): the owner can override this per task. They stopped Antigravity on T8 ("takes too long … do it yourself"), and Claude did the engine change directly. When time is short, ask whether to dispatch or do it here.
