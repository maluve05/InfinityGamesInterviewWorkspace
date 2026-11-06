# The studio and the market (research, 2026-11-06)

Preparation notes for choosing and judging a prototype. Facts were gathered by the
Gemini worker and checked by Claude against primary sources (store pages, cited
interviews); unverified numbers were left out.

## Infinity Games, in brief

- Portuguese mobile studio in Odivelas, Lisbon; founder & CEO Muhammad Satar; roughly
  40 people. Positioning: relaxing, minimal games that reduce stress.
- 250M+ downloads claimed in an October 2024 interview (PocketGamer.biz, marketing lead André
  Miraldo); LinkedIn states 130M+ (older).
- Confirmed on Google Play (developer "Infinity Games, Lda"): Infinity Loop, Loop Hex,
  Loop Energy, Shapes, Linea, Harmony, Pipes, Chill, Connection, One Line, Laser Quest,
  Fireballz, Square Paint, Eureka, Furzies, Solitaire Plus, Spider Solitaire, Railways,
  Traffix, Package Inc, Wood Blocks 3D, Inspector Meow, Enigmic, plus a
  growing line of idle/tycoon games (Idle Dot Shooter, Broke to Boss, Ranch Legacy, Idle Truck Fleet,
  Flight Manager, Freightbound, Golf Inc Tycoon, Hometown Express, Voltara, Glint Core,
  Ricochet TD, Mayday Hero).

## Style guide — what the flagship puzzles share

Drawn from the core puzzle line (Infinity Loop, Hex, Energy, Shapes, Pipes, Linea,
Harmony, Connection):

- **One input.** Mostly single taps (rotate a piece, toggle a state) or one smooth drag.
- **No failure.** No timers, no lives, no move penalties; you explore until the board
  settles. Their simulation games add pressure, but retries are instant and local.
- **Quiet visuals.** Dark or soft single-colour canvases, thin luminous lines or soft
  pastel shapes, no clutter; the solved state is visibly beautiful.
- **Music as reward.** Gentle tones and chords on progress and completion, ASMR-like
  clicks; sound confirms rather than alarms.
- **Monetisation is light-touch.** Ads between levels, rewarded hints, a "remove ads"
  purchase; nothing that gates play.

A prototype "fits" when it keeps one input, removes failure or softens it, shows a
beautiful solved state, and makes sound part of the reward.

The owner's playtest of Infinity Loop and Energy adds: make the goal legible, show what
can be touched, animate hints as nudges (never autoplay), and give a visible, cosmetic
collection reward. Details: `knowledge/playtest-insights.md`.

## The charts (Google Play Portugal, 2026-11-06)

Top free puzzle titles and their verified store facts:

| # | Game | Core loop | Rating · downloads |
| --- | --- | --- | --- |
| 1 | Meowdoku | Place one cat per row, column and region, none touching (Queens-style deduction) | 4.8 · 10M+ |
| 2 | Magic Sort! | Pour coloured layers between tubes until each holds one colour | 4.5 · 10M+ |
| 3 | Rotate Rings | Rotate interlocking rings until they come apart / align | 4.7 · 10M+ |
| 4 | Amaze GO! | Tap pieces so each slides out along its arrow without colliding | 4.8 · 100M+ |
| 9 | Word Tiles | Clear letter tiles by forming words | 4.9 · 1M+ |

The top free chart games sell the same calm promise as Infinity, but add hearts (a
light fail state) and heavy marketing (see `knowledge/playtest-insights.md`).

Top grossing is dominated by match-3 + meta (Candy Crush Saga, Royal Match,
Gardenscapes, Gossip Harbor's merge-2) and by scarcity-driven designs (Coin Master,
MONOPOLY GO) — the latter are counter-examples for a calm catalogue.

## Shortlist for a calm prototype (if the brief leaves the choice open)

Scored on provable in ~2 hours, fit with the style guide, current trend, twist
potential and risk. #1 is the owner's choice (2026-11-06) despite carrying the most risk:

1. **Hover Rush** (Infinity's own new release; one-thumb 3D hoverboard racing) — the
   strongest showcase: game feel, pacing and the studio's newest direction. Core to
   prove: hold to race, steer, gold ramp → **RUSH** slow-motion stunt → speed burst →
   podium in about a minute. Build approach: pseudo-3D road first (`knowledge/fast-3d.md`),
   three.js only if real 3D is essential; build the RUSH moment first; desktop controls
   (arrows/mouse to steer, Space to hop, a key/click for RUSH). Calm, Infinity-style
   framing: no crashes that end a run, minimal visuals, the stunt as the earned reward.
   **Risk:** highest of the list — camera feel, speed and rivals in ~90 minutes; fall
   back to ghost rivals and one track if time runs short. See
   `knowledge/playtest-insights.md` → Hover Rush.
2. **Amaze GO!** — one input, pure geometry, charting now. Calm twist: no lives;
   collisions bounce back softly; each piece that leaves plays a note, so a clean solve
   becomes a phrase of music.
3. **Magic Sort!** — universally understood and calm already. Twist: layers of light
   that ring like tuned glass when a tube completes; unlimited undo.
4. **Meowdoku** — deduction with a clean visual grammar. Twist: monochrome regions,
   gentle conflict glows, a reveal on completion. Hand-author a few unique-solution
   grids; keep hints minimal (finding the move is the game).
5. **Rotate Rings** — closest to Infinity Loop, so the twist must justify another
   rotation game (e.g. rings as sound loops that phase into rhythm when aligned).

In reserve: **Match-3** (Candy Crush; Puzzle & Dragons' free orb-drag as the variant) —
the most familiar genre and a large scope; twist: no move limit, orb-drag, an earned
finale (principles §4–6).

Whatever is chosen, it is built fresh inside the window.
