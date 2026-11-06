# Assessment day runbook (14:00–18:00)

**Rule:** complete, live prototype by 16:00 · polish 16:00–17:00 · **freeze at
17:00** · package · send well before 18:00. Deliverables are drafted during the
build so the last hour stays free for anything that goes wrong.

## Before 14:00

- [ ] `npm run check:pre-window` passes (no game code exists yet).
- [ ] The blank placeholder is live at the public link; it opens in a private
      desktop window with no Cloudflare challenge.
- [ ] `npx wrangler whoami` shows your account.
- [ ] Antigravity IDE open on **this folder** (never a parent folder), agent
      terminal commands set to ask before running. Say "claude has work for you":
      it must answer "No tasks for me." without touching anything.
- [ ] Backup worker: `agy --version` is 1.5.2 (if it changed, Claude runs one
      small fence probe — `processes/worker-dispatch.md`).
- [ ] Figma open on the student account. Loom (or recorder) ready, mic tested.
- [ ] Email draft open with headings: link, video, prompt log, written answers.
- [ ] Open a **fresh** Claude Code session in this folder (not a preparation
      session — `npm run logs` exports whole sessions). Note the exact start time
      in `PLAN.md`.

**Who runs during the window:** only Claude Code (lead, in this folder) and the
Antigravity IDE as the worker, through the mailbox `claude antigravity and others/`.
Your only job with the worker: when Claude asks, say **"claude has work for you"**.
Fallbacks, in order, only if the IDE fails: the Antigravity CLI headless
(`npm run worker -- T<n>`, Claude runs it), then Freebuff pointed at the same
mailbox (worst case). Export the IDE chat (and any fallback chat) into `logs/`
at the freeze (`processes/prompt-log.md` §4). No agent is opened in a parent
folder — it treats this repo as scratch space.

## 14:00–14:15 · Brief and pick (Claude + you)

1. Paste the email into `inbox/brief-email.md`.
2. Claude fills `context/brief.md`: one-sentence ask, **every** deliverable,
   constraints, open questions.
3. If the brief leaves the game to you, pick it (`game-brainstorm`, then `scale-or-kill`): core loop, the one
   question the prototype answers, the twist that fits the studio. Log the choice
   and runners-up in `PLAN.md`.
4. Claude locks the contract in `PLAN.md`, ranks the optional list (seen by the
   assessor first, each with a time gate) and writes worker tasks into
   `claude antigravity and others/tasks/`. You tell Antigravity "claude has work for you".

## 14:15–14:40 · Scaffold + directions (in parallel)

- **Claude:** three visual directions → Figma (`design-first` steps 1–3).
- **Worker** (via the mailbox): `game-scaffold` plumbing and engine tests from the contract (logic only).
- **You:** look at the directions as they land.

## 14:40–14:55 · Pick and refine (you) → lock (Claude)

You pick a direction and refine it — by hand in Figma or by prompting Claude.
Claude reads the frames once and writes tokens, specs and reference PNGs, then
fills `**Design locked:**` in `PLAN.md` with the time and your pick.

**Design gate:** nothing visual is built before this point — not a "quick playable",
not a temporary HTML page. Behind schedule? Use the fast path (two directions,
~10 minutes), never skip it. The hook and `npm run verify` enforce it.

## 14:55–15:50 · Build backwards (Claude)

Play screen first at final visual quality, then start and end screens. After each
screen: `npm run shots`, compare with its frame, fix the biggest gap.
**Worker** (via the mailbox): more tests, sound generation (`game-audio`),
running notes in `REFLECTION.md`. Claude deploys after each milestone. **You:** play every deploy in a desktop browser.

## 15:50–16:00 · Verify v1

`npm run verify`, compare every screen, deploy, play start → end → restart in a
private desktop window. **Done when: a complete prototype is live.** Record the URL
and commit in `PLAN.md`.

## 16:00–17:00 · Polish and improve

Each round (~15 min): Claude proposes the next items from the ranked, gated
optional list in `PLAN.md` (visual gaps first, then feel and sound, then
mechanics) → you pick → build → `npm run verify` → deploy → you play it. An item
whose gate has passed is dropped, not squeezed in. Keep the last good deploy working.

## 17:00 · Freeze

No new features. Settle the scale-or-kill verdict (`scale-or-kill`).

## 17:00–17:30 · Package

- **You:** record the ~3-minute walkthrough (`processes/recording.md`).
- **Worker or you:** `npm run logs` (Claude + worker + rules files); commit `logs/`.
- **Claude:** finish `REFLECTION.md` from the running notes and the verdict.

## 17:30–18:00 · Buffer → send

Send as soon as everything is ready (`processes/submission.md`). If something
broke: send what works and say honestly what went wrong.
