# Submission email

Everything in **one** email, as soon as it's ready (target 17:30, hard stop 18:00).
Links, not heavy attachments; every link opens without an account. Use the
subject line and reply instructions from the assignment email if it gives them.

## Pre-send checklist

- [ ] Live prototype opens in a private desktop window (not localhost, no challenge page).
- [ ] Video link plays in a private window; it names the inspiration game and gives
      a scale-or-kill verdict.
- [ ] **Make the repo public** (it's private until submission):
      `gh repo edit maluve05/InfinityGamesInterviewWorkspace --visibility public --accept-visibility-change-consequences`
- [ ] Prompt log: the GitHub link opens `logs/` in a private window without signing
      in; rules files, Claude sessions and worker logs are all there; first prompt present.
- [ ] Author's raw notes: every raw note from the day is in `authors-raw-notes/`,
      unedited, and the folder link opens.
- [ ] Written answers use the email's exact questions.
- [ ] No keys, tokens or `.env` content in the repo or logs.

## Template

> **Subject:** <subject from the assignment email>
>
> Hi <name>,
>
> Here is my submission.
>
> - **Playable prototype:** <URL>
> - **Walkthrough video (~3 min):** <link>
> - **Prompt log:** <GitHub link to logs/> — Claude Code (lead), Antigravity CLI /
>   Gemini (worker tasks), <any other tool>. Complete and unedited, including the
>   AI rules and skill files the agents used.
>
> - **Author's raw notes:** <GitHub link to authors-raw-notes/> — my unedited thoughts
>   from preparation and the day, in case you want a glimpse into how I was thinking.
>
> **Inspired by:** <game> — **verdict:** <scale/kill>, because <one line>.
>
> **Written answers** are below.
>
> <one honest sentence about anything that went wrong>
>
> Thanks,
> Malvin
