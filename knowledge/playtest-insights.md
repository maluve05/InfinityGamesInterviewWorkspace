# Playtest insights (analysis of the owner's raw notes, 2026-11-06)

Source: the owner's unedited notes in
`authors-raw-notes/2026-11-06-playtest-infinity-loop-and-energy.md` (never edit that
file), plus the store descriptions of three chart games (Google Play, 2026-11-06).
This file is Claude's analysis; quotes are from the owner.

## What the owner found

| Observation | Game | Design lesson |
| --- | --- | --- |
| Launches in about a second; menu with a symbol, no text in the logo | Infinity Loop | Time-to-play is part of the feel; the logo can be pure symbol |
| "the target state of the game isnt obvious as levels get more complex" | Infinity Loop | An invisible goal is the #1 source of frustration (same as the rehearsal audit). Make the solved state legible |
| The first hint costs a 30 s ad before the player knows what a hint is worth | Infinity Loop | Give the first hints free so their value is understood; a hypothesis worth testing with data ("collect data to test this hypothesis") |
| A hint "jumps states" with no animation, and is really the game playing for you | Infinity Loop | Hints should *show* the move (a ghost demonstration), and be a nudge, not autoplay — principle 13 |
| A satisfying animation when a level completes | Infinity Loop | The solved-state reward works; keep it |
| Complexity grows by adding moves, not by needing better strategy | Both | More pieces ≠ more depth. Escalate with new ideas, not just size |
| Glowing boxes around each piece make it "user friendly" | Energy | Clear affordances: show what can be touched |
| Tiny, barely legible helper text | Energy | If text is needed it must be readable; better, show it graphically |
| Shows up front that finishing a collection of levels earns a reward (a style change) | Energy | A visible next goal and a cosmetic, non-gating reward keep players going without dark patterns |
| Two-move tutorial | Energy | Skill floor at zero (principle 1) |
| Ideas: skippable levels with a collection reward kept; collections themed by symbol sets (Greek, Egyptian…) | Infinity Loop | Collections as theme and goal, not as a paywall |

**The owner's conclusions:** Energy is "objectively the better game" than the chart
games; what separates Infinity's games from the top free chart is "simply a bigger ad
budget", and from Candy Crush-style grossing games "simply the lack of dark patterns".

## What the chart games' store pages add

- **Amaze GO!** calls itself "a clean arrow puzzle game built to calm a busy mind", with
  "zero visual noise" and "satisfying release moments like ASMR" — Infinity's own
  promise. But "a wrong tap costs a heart"; it has long-press "Guidance" to highlight
  directions and hints. Contains ads.
- **Meowdoku** promises a "Zen-like flow state" with "non-intrusive ads", but gives
  3 hearts and a daily puzzle. Contains ads and in-app purchases.
- **Magic Sort!** leans on spectacle ("magical", "vivid splashes"), with undo, shuffle
  and boosts. Contains ads and in-app purchases.

So the top free chart is full of games selling *calm* — with a light fail state (hearts)
and big user-acquisition spend. That supports the owner's view: Infinity's games compete
on the same promise, so the difference is distribution and a little pressure.

## How to use this on the day

- **Twist rule for any prototype:** keep the calm promise, remove the hearts, and make the
  goal legible. That makes it obviously "an Infinity version" of a charting game.
- **Build in:** a visible solved state or goal preview, an animated hint that nudges
  (not autoplay), clear touchable affordances, a visible collection reward.
- **Scale-or-kill angle:** "the market already pays for calm; the question this prototype
  answers is whether the calm version without hearts still holds attention" — and the
  owner's ad-budget point is an honest note about what scaling would also need.

---

## Idle Dot Shooter (owner's playtest + store research, 2026-11-06)

Source: `authors-raw-notes/2026-11-06-playtest-idle-dot-shooter.md` (never edit) and the
Google Play / App Store listings (`com.infinitygames.dotcollect`; 4.1★, 1M+ downloads,
contains ads and in-app purchases; App Store id 6759000921).

**What it is.** An idle incremental shooter: a turret fires automatically at drifting
dots; you spend the cash on Defence, Drone and Economy upgrades, trigger three abilities
(Frenzy, Dot Rain, Black Hole), travel to new galaxies and climb a global leaderboard.
Its own pitch: "Tap in, upgrade, tap out, come back richer."

**The owner's observations, confirmed by its own store page.**
- *Overload at the start:* the listing itself presents three upgrade trees, three
  abilities, galaxies, a leaderboard and a stats centre as the offer. Well-made idle
  games do the opposite — progressive disclosure: one upgrade first, each new system
  unlocked when the player can afford it and needs it.
- *"Present a problem first, then a solution":* the right way to introduce each system
  here would be to let the player *feel* the limit (dots slipping past, cash piling up
  uncollected) and then reveal the upgrade that fixes it. (Captured as principle 14 in
  `knowledge/game-design-principles.md`.)
- *No visible end goal or immediate reward:* in idle games the goal is the next
  milestone and the satisfying curve of numbers going up. If the next milestone isn't
  on screen, the loop reads as aimless. It's built for short, repeated check-ins rather
  than background play — "tap in, tap out, come back richer".
- *Success:* 1M+ downloads with a 4.1★ rating — far broader reach than the newest
  puzzle releases, but rated lower than the flagship puzzles (Infinity Loop 4.9, Energy
  4.7). Broad appeal, less love.

**How it fits Infinity's identity — the likely logic (Claude's inference, not stated by
the studio).**
- *Visually it's still Infinity:* minimalist dots and clean shapes, the same visual
  language, applied to a different genre.
- *It's part of a deliberate line, not a one-off:* Infinity's developer page now carries
  a run of idle/tycoon titles — Golf Inc. Tycoon (500K+), Idle Truck Fleet, Idle Flight
  Manager, Broke to Boss (100K+ each), Ranch Legacy, Freightbound, Voltara — next to the
  puzzles, building on earlier management games (Package Inc, Traffix, Railways).
- *Why a studio does this:* puzzles burn authored content — every level must be designed,
  and players finish them. Idle games run on numbers and upgrade curves: cheap content,
  daily return visits, and natural places for rewarded ads (boosts, offline earnings). It
  stays "low stress" in a different sense — there's nothing to fail, progress happens
  while you're away — even if it isn't an IQ game.

**What this means for Saturday.**
- Infinity's identity is broader than logic puzzles: *minimal visuals + low-stress play*,
  applied to whatever genre is trending. A prototype doesn't have to be a logic puzzle to
  fit — but it must look and feel like them.
- For a scale-or-kill argument: idle meta (upgrades, milestones, offline progress) is the
  studio's proven way to extend retention, so "what scaling would add" can name it.
- The onboarding lesson applies to any prototype: introduce one thing at a time, each as
  the answer to a problem the player has just felt.

---

## Linea (owner's playtest + store research, 2026-11-06)

Source: `authors-raw-notes/2026-11-06-playtest-linea.md` (never edit) and the Google Play
listing (`com.infinitygames.linea`, "Linea: Anti-Stress Lights"; 4.5★, 1M+ downloads,
contains ads and in-app purchases). The owner's **second favourite** Infinity game after
Energy, and the kind of game they would have wanted to make for the studio.

**What it is.** One continuous line of light drawn with a finger to solve gentle
puzzles, wrapped in bite-sized stories ("friendship, hope, love, loss") told through
minimalist art and narration. No timers, no pressure; ambient soundscapes that adapt as
you play; hidden fireflies that unlock keepsakes and deeper lore; adaptive difficulty;
headphones recommended for 3D audio.

**Why it works — the owner's observations, explained.**
- *"the game has goals and you can see the objectives"* — the goal is always visible,
  the opposite of Infinity Loop's main weakness. Legibility is what makes calm
  challenge feel fair.
- *"it has a story"* — story gives meaning (Octalysis' white-hat drive) and a reason to
  continue that isn't scarcity or pressure. Each chapter is a small emotional arc.
- *"everything is connected to everything"* — the drawn line, the animation, the sound
  and the story are one system: the puzzle *is* the storytelling device. Nothing is
  decoration.
- *Collectibles that reward slow play* (fireflies → keepsakes, lore) — curiosity and
  ownership without urgency.
- *The design* — clean lines, pastel palettes, one-hand controls: Infinity's visual
  language at its warmest.

**Lessons for a prototype.**
1. **Make the mechanic carry the meaning.** The best twist links the core verb to a
   theme or tiny story, so play and presentation reinforce each other.
2. **Show the objective, always.** A visible goal or next step on every screen.
3. **Connect every layer.** Each animation and sound should come from the same action
   the player performed — one gesture, many consequences.
4. **Reward slow, curious play** with optional finds (a hidden collectible), never with
   timers.
5. **Story can be tiny.** One wordless micro-story (a beginning, a turn, a resolution)
   across 3–5 levels is enough to show the idea in a 2-hour prototype.

Energy (clarity, affordances, visible collections) and Linea (meaning, connection,
visible goals) are the owner's two reference games — the quality bar for any prototype.

---

## Hover Rush (store research, 2026-11-06)

Source: Google Play listing `com.infinitygames.hoverrush`, "Hover Rush: Hoverboard
Racing" (4.8★, 50+ downloads — a very early release; updated 2026-10-25; contains ads
and in-app purchases). The owner's current favourite and the kind of game they'd most
like to show they can build.

**What it is.** One-thumb 3D hoverboard racing. "Hold anywhere to start: no menus, no
countdown." Drag to steer, swipe up to hop; hit a gold ramp at full speed and tap
**RUSH** for a slow-motion stunt (backflips, 360s, corkscrews) and a speed burst. Each
level is a ~1-minute sprint against 8 named rivals; finish on the podium to clear it.
Then upgrade parts you can see change shape, and race again. 2,000 levels; every tenth
is a boss race; five modes (Race, Boss, Time Trial vs your ghost, Coin Rush, Elimination);
14 rides; 12 landscapes with weather and time of day. "Cosmetics never change
performance." "Every level can be beaten without paying."

**Why it's strong (Claude's analysis).**
- **Zero friction:** hold anywhere and you're racing — principle 1 taken to the limit.
- **One signature moment:** the RUSH slow-motion stunt is the hook — a clear, earned,
  repeatable peak (principles 4 and 6: an earned, bounded spectacle).
- **Problem, then solution, for 2,000 levels:** new mechanics open as you climb (boost
  pads, slipstream, air rings, wall kicks, split routes, loops) — principle 14 as a
  content strategy.
- **Visible progress:** upgrades change the ride's shape; rivals have names; the podium
  is a legible goal every minute.
- **Mostly white-hat monetisation:** cosmetics don't affect performance and levels are
  beatable free — though timed supply drops are a light scarcity hook.
- **For the studio:** a move into 3D hybrid-casual racing, keeping Infinity's
  "one input, instant, no friction" DNA in a new genre (like Idle Dot Shooter did for idle).

**As a 2-hour browser prototype (desktop).**
- *Feasible core:* one short track, the player's board, 3–4 rivals, one gold ramp → RUSH
  slow-mo stunt → speed burst, a podium finish, restart. Controls: mouse drag or
  arrow keys to steer, Space to hop, a key/click for RUSH.
- *How:* three.js from a CDN (still zero-build), low-poly shapes and fog for style, a
  simple lane/spline track instead of physics, rivals on scripted speed curves with
  rubber-banding.
- *Risk:* the highest of any candidate — 3D, camera feel, and rivals in 90 minutes; a
  Figma direction helps less for a 3D scene (design the HUD, palette and the RUSH moment
  instead). Mitigation: lock the camera, build the RUSH moment first, cut rivals to
  ghosts if time runs out.
- *Payoff:* if it lands, it shows game feel, 3D, pacing and an understanding of where
  the studio is heading — the strongest possible demonstration of skill.
