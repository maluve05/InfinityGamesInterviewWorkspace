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
4. **Mandatory vs optional.** Separate what makes the game complete from
   polish and extensions. When time is short, cut mechanics before visuals.
5. **Worker tasks.** Move every bounded, non-visual job into `TASKS.md` using its
   format (may write / may run / must not touch / done when / context). Tasks
   that touch disjoint files can run in parallel — label them `[parallel]`.

## Ask only what changes the work

Ask the owner only for decisions that change the outcome; give a recommended
answer for each (use `grill-me` for anything larger). Look facts up yourself.
Continue preparing independent work while an answer is pending.

## Keep it true

Update `PLAN.md` when evidence changes the approach (log it in the decision
table with the time). Never mark a milestone done without its check. Keep the
file resumable: a fresh context window must be able to continue from it alone.
For handing work to another agent, use `feature-handoff`.
