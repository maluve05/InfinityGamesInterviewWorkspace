---
name: game-feel
description: Make a desktop browser game feel tactile and alive without clutter — hover and press feedback, easing, squash and stretch, juice presets (shake, hit-stop, particles, flash) scaled to event importance, earned celebrations, sound, reduced motion, and a no-fluff audit. Use during the build and the polish hour.
---

# Game feel (with no fluff)

Feel is the difference between "a demo" and "a game I want to keep playing".
Every effect must communicate something. If it doesn't, cut it. Juice multiplies
fun; it can't create it — the core action must already work with plain shapes.
Values, sources and libraries: `knowledge/production-toolkit.md` §1–2.

## Always

- **Hover and press:** interactive things react to hover (cursor, slight lift or
  highlight) and compress on press (e.g. `scale(0.95)`), springing back on release
  (`cubic-bezier(0.34, 1.56, 0.64, 1)`, ~180 ms). Dragged objects follow the
  cursor with a tiny lag and a shadow, and settle with a small bounce.
- **Immediate feedback:** visual + sound on the same frame as every meaningful
  input. No wind-up delay on the player's own actions. Invalid moves get a gentle
  shake and a soft sound, never a harsh buzz.
- **Easing, not linear:** ease-out for arriving and feedback (0.15–0.3 s), ease-in
  for leaving, ease-out-back (overshoot constant 1.70158, ~10% past) for a "pop".
  Durations 120–480 ms.
- **Squash and stretch on events:** scale ~1.2–1.3 on one axis and ~0.75–0.8 on the
  other, settle to 1 in 0.1–0.2 s with ease-out-back; pivot at the contact point.
- **Anticipation and follow-through** on state changes. Nothing just appears or
  vanishes.
- **Frame-rate independent smoothing:** follow with `t = 1 - exp(-rate * dt)`
  (rate ~5 floaty … 12 snappy) or a critically damped spring, never a fixed lerp
  per frame. Reset smoothing on teleports and restarts.
- **Juice never blocks input:** effects are short; inputs during an effect are
  queued or applied, never dropped.
- **Readable at a glance:** one focal point; motion pulls the eye to what matters.
- **Keyboard feels first-class:** Space/Enter restart instantly from the end screen.

## Juice presets — scale to the event's importance

Define three presets once (numbers in `CONFIG`, tunable live with the `?debug`
panel) and assign every event to one. Starting values:

| Preset | Shake (trauma added) | Hit-stop | Particles | Extra | Typical events |
| --- | --- | --- | --- | --- | --- |
| small | 0–0.15 | none | 0–4 | soft tick, pop | place, pick up, UI |
| medium | 0.3–0.5 | 40–60 ms | 6–12 | brief flash | clear, combo step, landing |
| large | 0.7–1.0 | 100–150 ms | 20–40 | flash + zoom + number | win, best score, signature moment |

- **Shake = trauma model:** trauma 0–1, events add to it, decays ~1 per second,
  displacement = max × trauma² × smooth noise (summed sines or simplex), max ~8–12
  px and ~2–3° roll. Never fresh random per frame. Shake the camera or a visual
  wrapper, never the simulated object.
- **Hit-stop:** freeze or slow to ~5% for a real impact only; restore on a
  real-time timer; the newest hit-stop decides when time resumes.
- **Signature moment:** slow motion 0.2–0.3× for 0.5–1 s, drop in instantly, ease
  back over ~0.2 s, muffle the sound (`knowledge/fast-3d.md` §5).
- **Particles:** fast burst, heavy drag, life 0.2–0.5 s, pooled.
- **Flash:** 1–3 frames on the element; a full-screen flash ≤ 30–40% opacity, only
  for the large preset.
- Juice always returns to rest. A calm game uses mostly *small*; *large* is rare.

## Reduced motion (no settings screen)

- Honour `prefers-reduced-motion: reduce`: no shake, no slow motion, flashes become
  a static tint, pops shrink to a fade.
- Shake output at ~70% by default.
- Never more than three large flashes in any one second (WCAG 2.3.1).

## The idle hint is feel, too

A hint is a whisper, not an interruption: a slow pulse or soft glow (no flashing,
no shake, at most a barely audible cue), escalating to a ghost cursor only if the
player stays idle; it vanishes the instant they act. It suggests *a* move, never
the best one. Full nuances: principle 13 in `knowledge/game-design-principles.md`.

## Earned celebration

Only on real events: a clear, a combo, a win, a best score. Escalate with the
size of the achievement (small pop + chime → bigger moment for a best score).
Keep it under 2 s and never block the next action.

## Sound

Warm and soft by default; one short transient plus a body sound for key events;
vary pitch ±3–5% on repeats; rising pitch for streaks; leave headroom so stacked
sounds don't clip. Respect mute. See `game-audio`.

## The no-fluff audit (polish hour)

Remove: decorative particles that respond to nothing, glow on everything,
purple-blue gradients by default, long text, toasts, modal walls, placeholder
copy, default browser styling, scrollbars, focus rings on mouse clicks (keep
`:focus-visible`), shake or hit-stop on routine actions. Then play it for two
minutes and fix the first thing that feels off.
