---
name: plan
description: Turn a brief or broad request into a short, time-boxed PLAN.md with deliverables, an architecture contract, milestones with acceptance checks, and worker tasks in TASKS.md. Use at the start of a game or when the approach changes.
---

# Plan

Read `AGENTS.md`, `context/brief.md`, the current `PLAN.md`, `TASKS.md` and the
relevant `processes/` file first. State the outcome in one sentence.

## Write the plan around deliverables, not tool calls

1. **Deliverables.** List every deliverable the brief asks for, including
   non-code ones (recording, logs, written answers, email). Nothing the brief
   asks for may be missing.
2. **Contract.** Lock the shared interfaces before parallel work: engine
   functions, event names, the save-data schema, file ownership. Two agents must
   never edit the same file; say who owns each.
3. **Milestones with a time and a check.** Each milestone names its output and the
   observation that proves it (a passing command, a screen matching its frame, a
   URL loading on the phone). Use the assessment-day times when they apply.
4. **Mandatory vs optional, ranked and gated.** Separate what makes the game
   complete from polish and extensions. Rank every optional item by one test:
   **will the assessor see it in the video or the first two minutes of play?**
   Seen items (look, feel, sound, tutorial) come first; unseen ones (server
   telemetry, backends, accounts, leaderboards, consent banners) come last and
   usually become a Q6 answer instead. Give each item a **time gate** written now
   ("only if the freeze checklist is green by 16:45"), so nobody decides mid-flow.
   Fill the "Optional" table in `PLAN.md`. When time is short, cut mechanics
   before visuals.
5. **Worker tasks.** Write every bounded, non-visual job as a task file in
   `claude antigravity and others/tasks/` (format in that folder's README) and
   add a row to `TASKS.md`. Tasks that touch disjoint files can run in parallel —
   label them `[parallel]`.

## Ask only what changes the work

Ask the owner only for decisions that change the outcome; give a recommended
answer for each (use `grill-me` for anything larger). Look facts up yourself.
Continue preparing independent work while an answer is pending.

## Keep it true

Update `PLAN.md` when evidence changes the approach (log it in the decision
table with the time). Never mark a milestone done without its check. Keep the
file resumable: a fresh context window must be able to continue from it alone.
For handing work to another agent, use `feature-handoff`.
