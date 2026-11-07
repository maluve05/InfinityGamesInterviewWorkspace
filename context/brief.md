# Brief

> Decompiled at 14:07 from the assignment email (`inbox/brief-email.md`, received
> 14:00; screenshot in `context/charts/brief-email.png`).

## The ask, in one sentence

Pick a mobile game currently in the top charts (any store, any country), build a
simplified playable web version of its core mechanic with AI tools, and say whether
you'd scale it or kill it, and why.

## Deliverables (everything the email asks for)

| # | Deliverable | Format / where | Owner | Status |
| --- | --- | --- | --- | --- |
| 1 | A working link. Deployed and clickable. No localhost. | https://infinity.chitswa.com (fallback workers.dev) | Claude + worker | |
| 2 | A 3-minute screen recording: (1) the game running, (2) which top-chart game inspired it and why you picked it, (3) "If this were your prototype, would you scale it or kill it? Why?" | Loom (or any recorder) link | You | |
| 3 | Full prompt log: every prompt to every AI tool plus the responses. Public share link, exported file, screenshot bundle or Notion page. Complete and unedited; logs from all tools. | `logs/` — shared as a readable link or attached export | Claude exports, you check | |
| 4a | Short answer (2–3 sentences): Which AI tools did you use, and how did you split the work between them? | `REFLECTION.md` → email | Worker drafts, Claude edits | |
| 4b | What did the AI get wrong that you had to fix yourself? | same | | |
| 4c | Who is the target player for this game, and where can they be found? | same | | |
| 4d | What's the one metric you'd watch in week one to decide if it's worth continuing? | same | | |
| 4e | How would you get users to play this game? | same | | |
| 5 | Everything in **one** email (or one Notion/Word page/doc), sent to hr@infinitygames.io **as a reply to the email**, within 4 hours. Late is accepted but noted. | Email reply | You | |

## Constraints

- Topic / what to build: a **simplified playable web version of the core mechanic** of a
  game that is in a top chart **now** (any store, any country). Our evidence: Google
  Play top free and top grossing screenshots from the owner's phone, 14:06
  (`context/charts/`).
- Must include: the inspiration game named, and a clear scale-or-kill verdict with reasons.
- Out of scope: anything beyond the core mechanic; games not currently charting
  (so Infinity's own Hover Rush, 50+ downloads, can't be the inspiration).
- Deadline: 18:00 (4 hours from 14:00). The email expects ~2 h of work:
  15 min pick + sketch · 75 min build + deploy · 15 min video · 15 min answers + prompt
  log · rest for breaks, fixes, uploading.
- Repository stays private; the prompt log is shared as its own link/export.

## The game

_Pending the owner's pick — candidates in `PLAN.md` → The game choice._

- Inspiration (top-chart game, store, country, rank):
- Its core loop in one sentence:
- Why people keep playing:
- The one question this prototype answers:
- The twist that fits the studio:
- Smallest version that is still fun:

## Save-data schema (only if the loop needs it)

```js
{ version: 1, best: 0, settings: { sound: true } }
```

## Skill / library per deliverable

| Deliverable | Skill | Library / integration |
| --- | --- | --- |
| Prototype | `game-scaffold`, `game-prototyper`, `design-first`, `game-feel` | Zero-build HTML5 (canvas/SVG); Figma MCP for directions |
| Sound | `game-audio` | ElevenLabs (connected) or procedural Web Audio |
| Deploy | — | Cloudflare Worker `infinity-games-interview` → infinity.chitswa.com |
| Video | `scale-or-kill`, `processes/recording.md` | Loom |
| Prompt log | `processes/prompt-log.md` | `npm run logs` + Claude's own cloud-session export + Antigravity export |
| Answers + email | `submission` | `REFLECTION.md` |

## Open questions for the owner

- Which game (see the round in chat)?
- Deliver as one email (default) or one Notion/Word page?
