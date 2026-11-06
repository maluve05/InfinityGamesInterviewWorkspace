# Fast 3D (and fake 3D) for a two-hour browser prototype

General techniques, no game code. Choose the cheapest technique that sells the feeling;
players judge speed, impact and clarity, not polygon counts. Design rules for racing,
runner and arcade games (camera, boost, collisions, rivals, divergence):
`fast-racing-principles.md`.

## 1. Pick the technique

| Technique | Looks like | Cost in 2 h | Use when |
| --- | --- | --- | --- |
| **Pseudo-3D road** (Canvas 2D) | Classic arcade racers: a road rushing toward you, curves, hills, scaled sprites | Low — a few hundred lines, no library | Racing, runners, anything moving forward fast |
| **Pre-rendered sprites + parallax** (Canvas 2D) | Rich "3D" characters on a 2D stage (how Chicken Invaders looks so full) | Low | Shooters, arcade, anything with a fixed camera |
| **Real 3D, low-poly** (three.js) | Modern 3D with fog, glow and camera motion | Medium–high — camera feel is the risk | When depth or rotation is the point, or the brief asks for 3D |

Default for a racer under time pressure: **pseudo-3D**. Default for "it must be real 3D":
three.js with a locked camera and simple shapes.

## 2. Pseudo-3D road, in principle

- The road is a list of segments ahead of the camera. Each segment has a curve value
  and a height.
- Each frame, project every segment from far to near: screen scale is
  *camera depth ÷ distance*, so far segments are thin and high on screen, near ones wide
  and low. Draw each as a trapezoid (road, rumble strips, grass) in alternating shades —
  the alternation is what reads as speed.
- **Curves:** accumulate each segment's curve as a sideways offset, so the road bends.
  Push the player sideways on curves (centrifugal pull) to make steering matter.
- **Hills:** segment heights shift the projected y; the horizon line moves with them.
- **Sprites** (rivals, ramps, scenery) sit on segments and scale with the same factor;
  draw them far to near so near ones cover far ones.
- **Speed feel:** field of view widens slightly with speed, segment stripes blur past,
  the camera shakes faintly at top speed.
- Styled minimal (flat colours, fog-gradient sky, glowing road edges) it reads as a
  deliberate look, not retro.

## 3. Pre-rendered sprites and parallax

- 3D models rendered into images once (or simple vector shapes) and drawn as flat
  sprites; fixed camera; several background layers moving at different speeds.
- Collisions as circles; many cheap particles; reuse objects from a pool instead of
  creating new ones every frame.

## 4. Real 3D with three.js (when you must)

- Load three.js from a CDN through an import map (no build step); see the
  `threejs-fundamentals` skill.
- **Low-poly + fog + one light** carries a style fast; bloom from the post-processing
  skill gives cheap glow. Flat colours beat textures in two hours.
- **Lock the camera** behind and above the player; smooth its follow (lerp), never let
  it collide with scenery. Camera feel makes or breaks it — build it first.
- **No physics engine** for a racer prototype: move along a spline or lanes with scripted
  speed curves; rivals follow the same track with gentle rubber-banding.
- Instancing for repeated scenery (`threejs-performance`); keep draw calls low.

## 5. The signature moment (RUSH, combo, finale) — in any engine

The moment players remember is a short sequence, not a feature:
1. **Anticipation** — a readable cue (gold ramp, glow) tells the player it's coming.
2. **Trigger** — one input at the right time.
3. **Slow motion** — time scale drops to about 0.2–0.3 for 0.5–1 s; the camera pulls
   out or orbits slightly; sound filters to muffled.
4. **Release** — snap back to full speed with a burst: camera kick, speed lines,
   field-of-view punch, a bright sound.
5. **Reward** — a visible gain (overtakes, score, a cosmetic) immediately after.
Keep it skippable and bounded (principles §4–6). Build this moment first; it is the
prototype's hook.

## 6. Free assets (download inside the window, never before)

- **Kenney.nl** — CC0 low-poly and 2D kits (vehicles, racing, space, UI).
- **Quaternius** — CC0 low-poly models.
- **Poly Pizza** — CC0 / CC-BY low-poly models (check each licence). Search and
  download with `npm run models -- search "<thing>" --cc0` and
  `npm run models -- download <id>` (key in `.env`; details in
  `production-toolkit.md` §4).
- Sound: ElevenLabs (`game-audio` skill).
Credit sources in the README even when not required.

## 7. Physics, only if needed

Rapier or cannon-es. For arcade feel, hand-tuned motion is faster to build and feels
better than simulated physics.
