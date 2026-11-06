---
trigger: always_on
---

# Workspace rules

Read and follow `AGENTS.md` in the repository root. It is the single source of
rules for every agent in this workspace.

In this workspace Antigravity is the **worker**: take tasks from `TASKS.md`,
touch only the files a task lists, write your result to
`inbox/reports/<task-id>.md`, and never change visual/UI files unless the task
names them.
