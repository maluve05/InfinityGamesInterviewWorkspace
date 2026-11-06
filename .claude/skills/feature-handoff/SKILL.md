---
name: feature-handoff
description: Prepare a precise handoff for another agent or a fresh context window — a worker task, a continuation after context loss, or a review of finished work. Use before dispatching work or when a session is getting long.
---

# Feature handoff

Adapted from Mr Mak's workspace skill.

Read the current files and the latest test/deploy output before writing a
handoff. Use evidence on disk, not an earlier progress message.

Include: intended behaviour, affected files, files that must not be touched,
useful starting points, exact skill paths, constraints and the acceptance check.
For a continuation, add what is implemented, what remains, current test results
and any running process that must not be interrupted. Keep secrets out.

Make ownership explicit when several agents work at once: who owns each file,
the expected base (commit or last deploy). Re-read shared files before applying
a handoff; reconcile changes instead of overwriting another agent's work.

Separate five states and never blur them: source baseline, selected proposal
(e.g. a Figma frame), implemented behaviour, agent verification, owner
acceptance. A chosen mockup is not a shipped screen; a passing test is not a
reviewed feel.

For worker tasks, write the handoff as a `TASKS.md` entry (see its format). For
a fresh Claude context, update `PLAN.md` so it is resumable on its own and add a
"Resume here" note at the top.
