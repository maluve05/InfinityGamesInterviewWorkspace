# Submission Email Draft

> **Important:** Send this as a reply to the original assignment email from `hr@infinitygames.io`.
> Before sending, complete the pre-send checklist below.

---

### Pre-Send Checklist
- [ ] Confirm https://infinity.chitswa.com opens in an Incognito / Private window.
- [ ] Record the 3-minute video using `VIDEO_SCRIPT.md` and paste the Loom/Drive link below.
- [ ] Make the GitHub repo public (or invite the reviewers):
  ```bash
  gh repo edit maluve05/InfinityGamesInterviewWorkspace --visibility public --accept-visibility-change-consequences
  ```
- [ ] Verify GitHub links to `logs/` and `authors-raw-notes/` open in a private window without logging in.
- [ ] Ensure no secret keys or `.env` files are tracked in Git.

---

### Email Text (Ready to Copy)

**To:** hr@infinitygames.io  
**Subject:** Re: Infinity Games Assessment — Vibe Coder / AI-Assisted Game Prototype  

Hi Infinity Games Team,

Here is my submission for the prototype assessment.

- **Playable Prototype:** https://infinity.chitswa.com  
  *(Fallback mirror: https://infinity-games-interview.malvinchitswamatombo.workers.dev)*
- **Walkthrough Video (~3 min):** [INSERT LOOM / DRIVE VIDEO LINK HERE]
- **Prompt Log:** https://github.com/maluve05/InfinityGamesInterviewWorkspace/tree/main/logs  
  *(Complete and unedited transcripts from Claude Code as lead/design architect, Antigravity IDE powered by Gemini 3.8 Flash High as engine worker/integration lead, and ElevenLabs asset prompts, including all agent rules and skills)*
- **Author's Raw Notes:** https://github.com/maluve05/InfinityGamesInterviewWorkspace/tree/main/authors-raw-notes  
  *(Every unedited thought, live playtest reaction, and feedback note written during the 4-hour window)*

**Inspired by:** *Subway Surfers* (Google Play Top Free #23)  
**Verdict:** **SCALE**, because the hybrid loop of high-speed lane switching combined with match-3 color chains turns mindless obstacle dodging into an active, high-retention tactical risk/reward decision.

---

### Written Answers

**Q1 — Which AI tools did you use, and how did you split the work between them?**  
We used Claude Code as the admin and lead for high-level architecture, design specifications, and visual Canvas 2D rendering, and Antigravity IDE (Gemini 3.8 Flash High) as the engine worker for physics, algorithmic track generation, test suites, and final delivery. For assets, ElevenLabs generated concept art backdrops, pre-rendered runner sprite sheets, and retro audio/SFX, while Figma MCP translated initial visual directions into tokens. Work was coordinated through an asynchronous committed mailbox (`claude antigravity and others/`) where tasks had explicit allow-lists, acceptance criteria, and verified reports.

**Q2 — What did the AI get wrong that you had to fix yourself?**  
The AI repeatedly struggled with nuanced game feel and systemic interaction: it generated jumps where airborne runners still collected gems due to flawed threshold formulas and inverted entry signs, built an infinite-loop stall in the tutorial by failing to block all lanes on jump steps, and made the board a passive conveyor belt by banning barriers from the scoring thread. The human owner had to diagnose these flaws in playtesting, demanding swept collision detection, active barriers across the scoring thread, responsive input buffering, and snappier jump arcs.

**Q3 — Who is the target player for this game, and where can they be found?**  
The target player is a casual-to-midcore mobile gamer who enjoys the rapid twitch reflexes of endless runners (*Subway Surfers*, Google Play top free #23) but craves the satisfying pattern-matching and combo cascades of puzzle games (*Royal Match*, *Candy Crush*). They can be found on TikTok, Instagram Reels, and YouTube Shorts engaging with satisfying mobile gaming clips, as well as browsing trending arcade and puzzle categories on the App Store and Google Play during commutes and breaks.

**Q4 — What's the one metric you'd watch in week one to decide if it's worth continuing?**  
The single metric to watch in week one is **Day 1 (D1) Retention, targeting $\ge 38\%$ (alongside average runs per daily active user $\ge 4.0$)**. If the core hybrid mechanic of dodging while building color chains is truly addictive, players will instinctively restart immediately upon being caught; if D1 retention falls below 30%, it indicates that matching colors at speed causes cognitive fatigue rather than flow.

**Q5 — How would you get users to play this game?**  
We would drive initial acquisition through short-form viral gameplay creatives (TikTok and Reels) highlighting the high-stakes tension of leaping barriers to protect a 5-chain combo right before the storm strikes, paired with playable HTML5 instant ads that let users play the 20-second tutorial directly in the feed. Once validated on web portals like CrazyGames and Poki for zero-cost organic retention data, we would scale paid acquisition on Meta Ads and Google App Campaigns (UAC) targeting runner and puzzle lookalikes.

---

An honest note on what went wrong: Our early track generator banned barriers from the color thread to guarantee mathematical fairness in automated tests, inadvertently creating an unbroken "conveyor belt" where the optimal play was to never jump. Catching this during human playtesting and re-introducing barriers across the scoring line was what ultimately brought the true arcade thrill to life.

Thanks,  
Malvin

