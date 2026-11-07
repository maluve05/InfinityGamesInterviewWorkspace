# Prompt log (required deliverable)

The log must be **complete and unedited**, from **every** AI tool used, and it must
include the general AI rules and system-prompt files the agents worked with.
Messy is fine; missing is not. Everything goes into `logs/` and is committed, so
one GitHub link opens it all.

**One command at the freeze: `npm run logs`** (= `logs:claude` + `logs:worker` +
`logs:rules`). The sections below explain each part.

## 1. Rules and system-prompt files

`npm run logs:rules` copies into `logs/rules/`: `AGENTS.md`, `CLAUDE.md`, the
Antigravity rule file, every skill, the MCP configs, Claude's user settings and
auto-memory for this folder, and Antigravity CLI settings (values that look like
keys are redacted). Run it at the end, so it captures the final state.

## 2. Claude Code

`npm run logs:claude` exports every Claude Code session that ran in this folder
to `logs/claude/` as readable Markdown plus the raw `.jsonl` (the complete record,
including tool calls and results). The npm script exports only sessions with
activity from **2026-11-07 13:27** on. Owner's decision (13:44): the assessment-day
session started at 13:27 with the final setup check and continues through the
window — it is logged whole, setup included; no fresh session.

**The 13:27 session runs in the cloud** (Claude app, linked to this PC), so its
transcript is not under `~/.claude/projects` here and `npm run logs:claude` cannot
see it. Claude exports it itself with the same script and redaction into
`logs/claude/2026-11-07-13-27_<session>.md` + `.jsonl`, and refreshes it at the
freeze — ask Claude: "export your session log". Every value in `.env` is replaced with `[redacted NAME]` in both
files, and the export fails if one survives. Sub-agent work appears inside the session transcript.

## 3. Gemini worker (Antigravity CLI)

`npm run worker` saves, for every task: the exact prompt and allow-list, the full
event stream (`.ndjson`) and a readable transcript (`.md`) with every tool call,
output and reply. `npm run logs:worker` then copies Antigravity's own raw record
(conversation database and brain folder) into `logs/worker/raw/`.
Fallback exporter: the community `antigravity-history` tool.

## 4. Anything else

Antigravity IDE chats (the default worker): its Export button for each chat, saved
to `logs/worker/ide/`, or `antigravity-history`, or screenshots as a last resort.
The mailbox `claude antigravity and others/` (every task and report) is committed
too — it is the readable record of each hand-off. Figma MCP calls appear in the Claude log. ElevenLabs
generations: list prompts in `design/specs/audio.md`.

## Check before sending

- Open one exported file per tool and confirm the first prompt of the day is there.
- Search `logs/` for anything that looks like a key or token; redact if found.
- In the email, list each tool and where its log is.
