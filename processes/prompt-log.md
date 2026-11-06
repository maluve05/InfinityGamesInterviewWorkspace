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
activity from **2026-11-07 13:30** on (owner's decision: setup work is not part of
the log). So **start a fresh Claude
Code session in this folder on the day** — a reused preparation session would be
exported whole. Every value in `.env` is replaced with `[redacted NAME]` in both
files, and the export fails if one survives. Sub-agent work appears inside the session transcript.

## 3. Gemini worker (Antigravity CLI)

`npm run worker` saves, for every task: the exact prompt and allow-list, the full
event stream (`.ndjson`) and a readable transcript (`.md`) with every tool call,
output and reply. `npm run logs:worker` then copies Antigravity's own raw record
(conversation database and brain folder) into `logs/worker/raw/`.
Fallback exporter: the community `antigravity-history` tool.

## 4. Anything else

Antigravity IDE chats (if used): its Export button, or `antigravity-history`, or
screenshots as a last resort. Figma MCP calls appear in the Claude log. ElevenLabs
generations: list prompts in `design/specs/audio.md`.

## Check before sending

- Open one exported file per tool and confirm the first prompt of the day is there.
- Search `logs/` for anything that looks like a key or token; redact if found.
- In the email, list each tool and where its log is.
