---
trigger: always_on
---

# Workspace rules

Read and follow `AGENTS.md` in the repository root. It is the single source of
rules for every agent in this workspace.

In this workspace Antigravity is the **worker**; Claude Code is the admin.

**When the owner says "claude has work for you"** (or anything like it): open
`claude antigravity and others/README.md` and follow "If you are the worker"
exactly — take each `todo` task in `claude antigravity and others/tasks/`, one at
a time, write its report to `claude antigravity and others/reports/`, set its
status, then tell the owner which tasks are done and stop.

Never act outside a task: touch only the files the task lists, run only the
commands it lists, never start servers, install, commit, push or deploy unless
the task lists that exact command, never create helper scripts, and never change
visual/UI files unless the task names them.
