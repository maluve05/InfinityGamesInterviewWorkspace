# Production toolkit (research, checked 2026-11-06)

What experienced game developers use that raises quality a lot for little time.
Only items that pass all four tests made it in: **big quality gain, small time cost,
no major trade-off, fits a two-hour desktop-browser prototype.** No game code — values,
sources and links only. Facts were checked against primary sources (repos, npm, the
CDN, source code, official pages); the check log lives outside this repo.

## 1. Game feel — techniques and starting values

Treat numbers as **starting points to tune by eye**, not laws. Only the items marked ✔
come from a primary source; the rest are common practitioner ranges.

| Technique | What it does | Start with | Cost |
| --- | --- | --- | --- |
| **Easing** | Replace linear motion | ease-out for arrivals/feedback (0.15–0.3 s), ease-in for exits, ease-out-back for "pop" (overshoot constant 1.70158 ✔, ~10% overshoot) | minutes |
| **Tween "pop" / squash & stretch** | Life and weight on events | scale to ~1.2–1.3 on one axis and ~0.75–0.8 on the other (keep area ≈ constant), settle back in 0.1–0.2 s with ease-out-back; pivot at the contact point | minutes |
| **Feedback within one frame** | Input feels connected | visual + sound on the same frame as the input; no anticipation delay on the player's own actions (0–3 frames at most) | minutes |
| **Screen shake (trauma model ✔)** | Impact, speed | keep `trauma` in 0–1, add per event (small 0.15, medium 0.4, big 0.8), shake = trauma² ✔, decay ~1 per second, smooth noise or summed sines — never fresh random per frame ✔; max offset ~8–12 px, max roll ~2–3°. **Move the camera/visual layer, never the simulated body.** | ~15 min |
| **Hit-stop** | "That connected" | freeze or slow to ~5% for 50–120 ms on a real impact only; restore on a real-time timer; a newer hit-stop overrides an older one | ~10 min |
| **Slow motion for the signature moment** | Makes the big moment memorable | time scale 0.2–0.3 for 0.5–1 s, drop in instantly, ease back out over ~0.2 s; muffle/low-pass the sound to match (see `fast-3d.md` §5) | ~15 min |
| **Flash** | Readable hit or success | sprite/element to white for 1–3 frames (16–50 ms); full-screen flash ≤ 30–40% opacity, fading over ~0.1 s, only for the biggest moment | minutes |
| **Particles** | Physical presence of an event | small event 4–8, big event 20–40; life 0.2–0.5 s; fast burst then heavy drag; pooled, never created per frame | ~20 min |
| **Trails** | Speed and path | life 0.1–0.3 s, width and alpha taper to zero; clear the trail on teleport/respawn | ~15 min |
| **Camera follow (critically damped spring)** | Smooth, no overshoot | smooth time ~0.1–0.2 s (snappy), 0.2–0.35 s (standard), 0.4–0.8 s (heavy vehicle); frame-rate independent (spring or `1 - exp(-k·dt)` lerp), never a raw per-frame lerp | ~15 min |
| **Coyote time** (platformers/jumps) | Forgives late jumps | 0.1 s ✔ (Celeste's `JumpGraceTime`) | 5 min |
| **Input buffering** | Forgives early presses | ~0.1 s; above ~0.2 s causes ghost actions | 5 min |
| **Sound layering + variation** | Punch without fatigue | one short transient + one body sound per key event; random pitch ±3–5% on repeats; rising pitch for streaks; keep headroom so layers don't clip | ~20 min |

**Rules that keep it calm (this studio):** scale juice to the event's importance
(define small / medium / large presets once and reuse them); juice is transient and
always returns to rest; shake, hit-stop and slow motion are for real impacts and the
signature moment only, never routine actions; offer a "reduce motion" switch if
shake or flashes are used (respect `prefers-reduced-motion`).

Primary sources: Jonasson & Purho, *Juice it or lose it* (youtube.com/watch?v=Fy0aCDmgnxg);
Nijman, *The art of screenshake* (youtube.com/watch?v=AJdEqssNZ-U); Eiserloh, *Juicing
your cameras with math*, GDC 2016 (youtube.com/watch?v=tu-Qe66AvtY); Sakurai, *Stop for
big moments!* and *Eight hit stop techniques*; Thorson, *Celeste & Forgiveness*
(maddymakesgames.com); Celeste `Player.cs` (github.com/NoelFB/Celeste); easings.net.

## 2. Libraries (zero build, CDN ES modules)

All URLs return 200 from jsDelivr (2026-11-06). **Pin exact versions**; load through
an import map. Add a library only when it replaces more code than it costs to learn.

| Need | Pick | Licence | Import URL | Size (min) | Verdict |
| --- | --- | --- | --- | --- | --- |
| Live tuning panel (dev only) | **lil-gui** 0.21.0 | MIT | `https://cdn.jsdelivr.net/npm/lil-gui@0.21.0/+esm` | 31 kB | **Adopt**: bind `CONFIG` numbers, tune feel live, then copy values back. Hide behind `?debug`. |
| Richer tuning panel | Tweakpane 4.0.5 | MIT | `https://cdn.jsdelivr.net/npm/tweakpane@4.0.5/dist/tweakpane.min.js` | 152 kB | Only if lil-gui is too limited. |
| Tweens / timelines | **GSAP** 3.15.1 | GSAP Standard no-charge licence (free, incl. commercial) | `https://cdn.jsdelivr.net/npm/gsap@3.15.1/+esm` | 71 kB | **Adopt** when there's choreography (menus, finale sequences); also tweens canvas/three.js objects. Plain CSS transitions remain fine for simple DOM hover/press. |
| Tiny tween alternative | @tweenjs/tween.js 25.0.0 | MIT | `https://cdn.jsdelivr.net/npm/@tweenjs/tween.js@25.0.0/dist/tween.esm.js` | 43 kB (unminified) | If GSAP feels heavy; you drive `update()` from your own loop. |
| Procedural sound effects | **ZzFX** 1.4.0 | MIT | `https://cdn.jsdelivr.net/npm/zzfx@1.4.0/ZzFX.js` (exports `zzfx`) | 10 kB | **Adopt** as the procedural fallback in `audio.js`: one array of numbers per sound, designed in the ZzFX web designer. Tune toward soft timbres (no harsh square waves). |
| Retro sound generator | jsfxr 1.4.1 | Unlicense | `https://cdn.jsdelivr.net/npm/jsfxr@1.4.1/+esm` | 23 kB | Skip unless ZzFX can't make the sound. |
| Music / synth | Tone.js 15.1.22 | MIT | `https://cdn.jsdelivr.net/npm/tone@15.1.22/+esm` | 233 kB | Only for a generative/musical mechanic (e.g. notes per move). Use `latest` 15.1.22, not the 15.5.x pre-release. |
| Sample playback | Howler 2.2.4 | MIT | `https://cdn.jsdelivr.net/npm/howler@2.2.4/+esm` | 37 kB | Not needed: the scaffold's Web Audio `audio.js` does this. |
| Noise | simplex-noise 4.0.3 | MIT | `https://cdn.jsdelivr.net/npm/simplex-noise@4.0.3/+esm` | 4 kB | For smooth shake, terrain, organic motion. Pass it the seeded RNG. |
| Seeded RNG | (write mulberry32) | — | — | — | Keep the scaffold's own `rng.js`; seedrandom (last release 2019) adds nothing. |

Skipped: anime.js 4.5.0 and Motion 14.10.1 (both fine, MIT, but overlap GSAP); Howler.

## 3. Engine choice

| Situation | Choice | Why |
| --- | --- | --- |
| 2D puzzle / board / UI-heavy (most Infinity-style games) | **Plain DOM/SVG or Canvas 2D + the scaffold** | Zero download, full control of look, matches `game-scaffold`'s pure-engine split; AI writes it reliably. |
| Real 3D or fast pseudo-3D (Hover Rush) | **three.js 0.187.0** (MIT), `https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.js` + `examples/jsm/` addons; or Canvas 2D pseudo-3D | Best-known 3D library to AI models; skills installed. See `fast-3d.md`. |
| 2D action needing physics/sprites fast | KAPLAY 3001.0.19 (MIT, `dist/kaplay.mjs`, 189 kB) | Shortest boilerplate; but it owns the loop and the canvas, which fights the pure-engine/test split. Use only if the brief is arcade-physics heavy. |
| Large 2D sprite games | Phaser 4.2.1 (MIT, 1.4 MB) | Phaser 4 is now `latest`; models mix Phaser 3 and 4 APIs — pin and say "Phaser 4" in prompts. Heavy for a 2-hour prototype. |
| — | Babylon.js, PlayCanvas, Godot web export, GDevelop | Too heavy or need an editor export. Out. |

Physics engines: don't. Hand-tuned motion feels better and is faster to write (cannon-es
or Rapier only if the brief is physics).

## 4. Assets — sources and licences (download only inside the window)

| Source | What | Licence | Credit |
| --- | --- | --- | --- |
| **Kenney** (kenney.nl) | 2D, 3D, UI, audio kits | CC0 | optional (don't use the Kenney logo) |
| Quaternius | low-poly 3D | CC0 | optional |
| **Poly Pizza** (`npm run models`) | low-poly 3D (GLB), 10k+ models incl. Kenney and Quaternius | per model: CC0 or CC-BY; the API returns a ready attribution line | required for CC-BY; add `--cc0` to search CC0 only |
| **Lucide** (lucide.dev) | UI icons (SVG) | ISC | keep licence notice in source |
| Phosphor | UI icons | MIT | keep licence notice in source |
| game-icons.net | game icons | CC BY 3.0 (a few CC0) | **credit each author** |
| Google Fonts | fonts | mostly SIL OFL 1.1 | none in UI |
| Pixabay (music, SFX) | audio | Pixabay Content License | not required; no standalone resale |
| Freesound | SFX | per sound: CC0 / CC-BY / CC-BY-NC | filter to CC0/CC-BY |
| **ElevenLabs** (`game-audio`) | generated SFX, ambient loop | **free plan: no commercial licence**; paid plans: commercial. The owner is on the paid Creator plan (student). | record "ElevenLabs Creator (student)" in the README credits |
| Meshy | AI 3D models | free plan: CC BY 4.0 (credit "Model created with Meshy – CC BY 4.0"); paid: private | required on free plan |

**Poly Pizza API** (checked 2026-11-06 with the owner's key, Free plan: 3,000 requests
a month, 100 per second): base `https://api.poly.pizza/v1.1`, header `x-auth-token`
(also required on `static.poly.pizza` downloads), spec at
`poly.pizza/apispec/v1.1.yaml` (the `/docs` page is currently broken). Endpoints:
`/search/{keyword}` and `/search` (filters only), `/model/{id}`, `/list/{id}`,
`/user/{name}`; filters `Category` 0–11, `License` 0 = CC-BY / 1 = CC0, `Animated=1`,
`Limit` ≤ 32, `Page`. Filter names are case-sensitive (lowercase is silently
ignored). Fields: `Title`, `Licence`, `Attribution`, `Download` (GLB), `Thumbnail`,
`Tri Count`, `Creator`, `Category`, `Animated`. The key must stay off the browser:
`tools/poly-pizza.mjs` downloads the GLB into `public/assets/models/` and appends the
attribution to `CREDITS.md` there. Prefer models under ~3k tris; one creator per game
(e.g. all Quaternius or all Kenney) keeps the style coherent.

**3D model backups if Poly Pizza is down or over its limit** (checked 2026-11-06):

| Backup | What | Licence | Access | Use |
| --- | --- | --- | --- | --- |
| **Kenney** (kenney.nl/assets) | low-poly kits as zips (car, racing, space, city, nature…) | CC0 | browser download, no account; the site refuses scripted downloads (403), so use the browser | first backup; same style as his Poly Pizza models |
| **Quaternius** (quaternius.com) | low-poly packs, many animated | CC0 | zip downloads, no account | first backup; many Poly Pizza favourites come from here |
| Sketchfab | huge, mixed quality | per model; filter to CC0/CC-BY | search needs no key; download needs an account | last resort, one specific object; watch the triangle count |
| Poly Haven (polyhaven.com) | 521 models, textures, sky images (HDRIs) | CC0 | free API, no key | realistic style: skies and ground textures, not props |
| OpenGameArt | mixed 2D/3D | per asset | browser | check each licence; avoid CC-BY-SA |

Fallback order: shapes in code → Kenney / Quaternius → Poly Pizza for one specific
object → Sketchfab. Copy GLB/glTF files into `public/assets/models/` by hand and add a
credit row even for CC0.

**AI video (Google Flow) — decision 2026-11-06: not part of the spec.** A generated
"gameplay" clip shows cinematic camera work, art and physics a 2-hour prototype can't
match, so it sets a false spec (Figma frames stay the spec); each clip takes minutes
and several tries; the owner's Flow credits (1,050) only reset at 19:12 on the day,
after the window; and studios distrust ads that show something the game isn't. Allowed
only if well ahead of schedule: one short clip for the end of the video, labelled
"AI concept of the scaled version". A Flow *still image* as a mood board before Figma
is the cheaper use.

Default for this prototype: shapes and colours drawn in code first; Kenney or Lucide
only where a drawn shape can't carry it; ElevenLabs for sound with ZzFX as fallback.
Write every third-party asset and its licence into the README credits.

## 5. How studios decide: scale or kill

Confirmed patterns (use these, cite them honestly):

- **Supercell** (Jonathan Dower, GDC 2016, *Quality is worth killing for*): of its last
  ten games, seven were killed in prototype, two in soft launch, one (Clash Royale)
  launched globally. The team itself makes the kill call, and kills are treated as
  learning, not failure.
- **Voodoo** — a numbers funnel. Publicly reported prototype bars have shifted over
  time: CPI ≤ ~$0.20 with D1 > 35% (2020 prototype contest); later a rule of thumb of
  D1 55% / D7 22%, then lowered to roughly D1 45% / D7 13% / CPI $0.20 alongside
  playtime, win rate and game length. Tests run over a few days and end in kill,
  iterate or launch. In 2023 Voodoo's head of publishing said "hypercasual is dead":
  newer hits needed deeper, hybrid-casual loops.
- The common funnel: **marketability** (does an ad for it get cheap installs? CPI,
  click-through) → **first-session fun** (D1 retention, level-1→2 drop-off) → **habit**
  (D7, playtime per day) → soft launch and monetisation. Each gate is a kill point.
  Exact thresholds vary by genre and year; quote them as "around", not as targets.

For our verdict (a 2-hour prototype has none of this data):

1. State the **hypothesis** in one line and which gate it addresses (almost always
   "first-session fun").
2. Give the **evidence we have**: own playtests and `npm run metrics` (attempts,
   completion, time), clearly labelled as a signal from N players.
3. Name the **next cheapest test** and the **threshold that would change the
   verdict**: e.g. a 15-second capture of the signature moment as an ad creative
   (marketability); a 20-player first session with level-1→2 completion > 85–90%
   and voluntary replay (first-session fun); D1 ≈ 40%+ in a small soft launch.
4. **Kill well**: if killing, say what was learned and what you'd try instead — the
   Supercell framing makes a clean kill a good outcome for a prototype team.

## 6. Agent skills and MCP servers

Already installed: three.js skills (5), game skills of this workspace, grilling.
Candidates checked on GitHub (stars, licence, 2026-11-06):

| Candidate | Stars / licence | Fit |
| --- | --- | --- |
| gamedev-skills/awesome-gamedev-agent-skills (`game-feel`, `prototype-fast`, `audio-design`, web-engine skills) | 7.2k / Apache-2.0 | Good content, but engine examples are Godot/Unity; our `game-feel` skill now carries the browser values from §1. |
| greensock/gsap-skills (8 skills) | 18.0k / MIT | Useful only if GSAP is adopted. |
| elevenlabs/skills (`sound-effects`, `music`) | 536 / MIT | Overlaps `game-audio` + the existing connector/MCP. |
| phaserjs/phaser `skills/`, pixijs/pixijs-skills | 40.7k, 363 / MIT | Only if that engine is chosen. |
| Blender, Godot, ComfyUI, Aseprite MCPs | various | Need local apps/GPU; too slow for 2 hours. Out. |
| light-vp/pixelart-mcp | 7 / **no licence** | Out. |
| patch-gg/pixelfx (Claude Code plugin: 244 pixel-art effects + a draft→render→look→refine skill; no hooks or install scripts) | 5.6k / MIT, created 2026-10-30 | Only if the chosen look is pixel art; it clashes with a flat, minimal or 3D style. Install: `/plugin marketplace add patch-gg/pixelfx`, `/plugin install pixelfx@pixelfx`. |

**Decision (owner, 2026-11-06): install none.** The useful content is distilled into
our own `game-feel`, `game-scaffold` and `scale-or-kill` skills instead (§7). If GSAP
is adopted inside the window, `npx skills add greensock/gsap-skills` is the one to
add (then `npm run skills:sync`).

## 7. Lessons taken from awesome-gamedev-agent-skills

The community collection (7.2k stars, Apache-2.0, 77 skills; read 2026-11-06:
`game-feel`, `prototype-fast`, `game-jam`, `genres/puzzle`, `camera-systems`,
`input-systems`, `audio-design`, `level-design`, `game-ui-ux`, `create-game-assets`).
Its examples are Godot/Unity; the transferable rules:

- **Juice presets by importance** (small / medium / large: trauma 0.1–0.2 / 0.3–0.5 /
  0.7–1.0; hit-stop none / 40–60 ms / 100–150 ms; particles 0–4 / 6–12 / 20–40).
  Juice multiplies fun; it can't create it.
- **Frame-rate independent smoothing:** `t = 1 - exp(-rate·dt)`, rate ~5 (floaty) to
  12 (snappy); camera deadzone 32–64 px, look-ahead 40–120 px eased over 0.2–0.4 s.
  Reset smoothing on teleports.
- **Overlapping hit-stops:** the newest one owns the restore. Effects must never block
  input; let input buffer through.
- **Accessibility:** shake scaled to ~60–80% by default; no more than three large
  flashes per second (WCAG 2.3.1); a reduce-motion path.
- **Input windows in seconds, not frames;** consume the buffer when it fires.
- **Puzzle engines:** resolve until stable; undo restores all state including the RNG;
  lock or queue input while resolving; generated boards must be verified solvable;
  detect deadlocks.
- **Prototype brief before code:** question, core verb, keep-if, kill-if; keep = a fresh
  player does the core verb on purpose within ~30 s and replays unasked; kill = only
  fun after explanation, needs far more systems, or art is hiding a flat verb.
- **Jam scoping:** a 30-second start→play→end→restart loop early; reserve the last ~20%
  of the clock for shipping; feature triage — does the loop work without it? would a
  player notice? is it under 30 min? Default under pressure is cut.
- **Teaching:** introduce → develop → twist → test, one mechanic at a time; difficulty
  as a sawtooth with a rest before the climax (matches principles §2 and §14).
- **Audio:** buses (music / SFX / UI) rather than per-clip volume; work in dB; leave
  headroom; vary pitch and volume on repeats.
- **UI:** HUD updated from events, not polled every frame; screens as a stack.
- **Assets:** describe the art direction as properties (shape, value, palette roles,
  edges, motion), approve one hero asset at game scale before a set, and record
  provenance per asset (source, licence, tool/plan, prompt, edits). "Free" or
  "AI-generated" is not a licence.
