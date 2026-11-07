# Frame-4 render plan: making Chroma Rush look like concept 04 in Canvas 2D

Target: `design/concepts/04-coral-jump-runnerD.png`. Bright coral-coast noon, painted
sea and lighthouse, a sandstone boardwalk road, big glossy gems, and a large runner
mid-leap over a driftwood-and-coral barrier with a glowing scarf.
Constraint (owner, 15:35): **Canvas 2D fake 3D only, no WebGL or three.js.** Every
frame must be drawable this way.

## Where the techniques come from (research, 15:40)

| Technique | Historical source | What we take |
| --- | --- | --- |
| Raster/segment road: a z-table per scanline, the road built from projected segments, curves faked by shifting the camera x per segment | Pole Position / OutRun; documented on [Lou's Pseudo 3D Page](https://extentofthejam.com/pseudo/); rebuilt in canvas by [Jake Gordon's JavaScript racer](https://codeincomplete.com/articles/javascript-racer) | Our road already projects bands. Add a **textured** road (repeating plank or sandstone texture strips drawn per segment), gentle curves and hills, and edge glow. |
| Scaled sprites ("billboards") projected onto the road | Same games: trees, signs and cars are sprites scaled by 1/z | Gems, barriers, palms, coral, lamp posts and the lighthouse as images scaled by depth and sorted far→near. Snap edges to whole pixels so neighbouring segments don't leave gaps (from the PICO-8 notes on the same technique). |
| Pre-rendered 3D-looking art played back as 2D | [Donkey Kong Country](https://www.cheatcc.com/articles/how-donkey-kong-country-faked-3d-on-snes-without-extra-hardware/) (Rare, SGI renders → sprites, 1994) | Our "SGI" is ElevenLabs image generation. Generate the runner, the barriers, props and gems in the frame-4 style, cut them out (bg removal), and draw them as sprites. |
| Multi-plane parallax | Disney multiplane camera → every 2D runner since | 3–4 painted backdrop layers per world (sky, far sea or skyline, mid props), each scrolling and swaying at its own rate with the lane and speed. |
| Atmospheric perspective | Painting technique; fog bands in racers | Distance haze: sprites fade toward the sky colour with z, plus a soft horizon fog band. |
| Contact shadows, squash and stretch, secondary motion | Classic animation principles (Disney's 12) | Ground shadow ellipses that shrink with jump height. The runner squashes on landing and stretches on take-off. A scarf simulated as a verlet rope, coloured by the chain. |
| Cut-out ("paper-doll") rigging | Flash-era and Rayman-style cut-out animation, Spine | The runner is generated once as separate parts (head, torso, arms, legs, scarf root) and animated procedurally: run cycle, jump tuck, stumble, lane lean. That avoids frame-to-frame drift in AI-made sprite sheets. |
| Additive light | Arcade glow, bloom fakes | `globalCompositeOperation = 'lighter'` for gem glints, the burst flash and lightning. Cheap and readable. |

Temple Run (2011) itself used real-time 3D (a custom iOS engine; Unity from Temple Run 2), so it's an inspiration for the camera framing and pacing, not for the technique.

## Layer stack (drawn back → front, every frame)

1. Sky gradient + sun/moon (code) and painted sky layer (image, slow parallax).
2. Far layer: sea, lighthouse, islands (image per world, parallax with lane x × 0.05).
3. Mid layer: palm and coral silhouettes on both sides (sprites placed along the track, projected).
4. Road: projected segments with a texture strip, edge glow lines, lane dashes, gentle curve and hill.
5. Track objects, depth-sorted: gems (pre-rendered glossy images per colour, plus a code glint), barriers (themed image), shadows.
6. Runner: cut-out rig + verlet scarf + contact shadow + squash and stretch.
7. Storm: layered cloud sprites + additive lightning, rising with the chaser steps.
8. Effects: particles (gem-shaped), floats, flash, hit-stop.
9. HUD: score, best, chain pill, chaser-step pips. Canvas-drawn, matching the frame-4 pill style.

## Assets to generate (ElevenLabs, transparent PNG via bg removal)

| Asset | Count | Notes |
| --- | --- | --- |
| Runner parts (chosen runner, back view + 3/4) | 1 sheet → ~8 parts | Head, torso, upper and lower arm, upper and lower leg, shoe, satchel. Same lighting as frame 4. |
| Gems | 5 | Ruby ◆, ocean ●, sun ⬢, leaf ▲, plum ★, glossy candy style, same light direction. |
| Barriers | 4 (one per world) | Driftwood+coral (coast), sandstone block (desert), neon barrier (city), ice shards (tundra). Same silhouette height. |
| Roadside props | 3–5 per world | Palm, coral clump, lamp, lighthouse (far), buoy. |
| Backdrops | 4 worlds × 2 layers | Sky + far layer, painted, 1024 px wide, tileable horizontally where possible. |
| Road texture strip | 4 | Boardwalk planks, sandstone, neon asphalt, ice. |

## Code plan (Claude, view only; engine stays Antigravity's)

- `public/src/view.js` gets split into `render/` modules: `road.js` (segment projection), `sprites.js` (loader, depth sort, billboard draw), `runner.js` (rig + scarf), `backdrop.js` (parallax), `fx.js`, `hud.js`. view.js keeps its public API (`createView`, `onEvents`, `draw`, `setPalette`).
- Image loading: a small preloader with a fallback to today's vector drawing if an image fails, so the game never shows holes.
- Performance budget: 60 fps at 1440×900 on a laptop; ≤ 150 drawImage calls per frame; pre-scale sprites into 4 mip sizes at load.

## Order of work (gated)

| # | Step | Gate |
| --- | --- | --- |
| 1 | Coral Coast backdrop layers + textured road + projected props | first, by 16:15 |
| 2 | Runner rig + scarf (largest visible gain) | by 16:35 |
| 3 | Gem and barrier images, shadows, haze | by 16:45 |
| 4 | Storm restyle + chaser-step pips (needs T5) | if T5 accepted by 16:30 |
| 5 | Other 3 worlds | only if 1–3 deployed by 16:45; otherwise the coast is the whole run (the setting change becomes time of day only) |

Every step ends with a deploy and a screenshot compared against frame 04.
