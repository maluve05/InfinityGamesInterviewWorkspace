# Play screen spec (locked 14:43)

Frames: `design/frames/play-day.png` (start of a run) and `design/frames/play-dusk.png`
(later in the run). Figma: "Infinity — design directions", frames A (2:2) and B (2:119).
Owner's call: one design; Daylight is the early stage, Neon Dusk the later stage. The
palette blends from day → dusk → day as distance grows (one full cycle ≈ 3,600 m).

## Layout (stage 405×720, centred on a 1440×900 desktop page)
- **Sky** gradient top → horizon at 37% height; scenery silhouettes on the horizon
  (dunes by day, city blocks with lit windows by dusk); sun/moon top-right.
- **Road**: three lanes in pseudo-3D, alternating bands that rush toward the camera,
  glowing edge lines, dashed lane lines, a soft fog band at the horizon.
- **Gems** float above the road with a shadow; 3 colours at the start, 4 from 1,000, 5 from 3,000; each its own shape
  (ember ◆, tide ●, sun ⬢, then leaf ▲, plum ★), radial highlight, gentle glow. Barriers: low rounded slabs.
- **Runner**: seen from behind at 80% height, centred in its lane; slides between lanes (140 ms).
- **Storm** (the chaser) fills the bottom; off-screen at full gap, rises as the gap shrinks (to ~145 px when caught), with lightning.
- **HUD**: score top-left (display face, 30 px); BEST top-right (12 px label, 16 px number);
  the chain bar centred under it — a pill with 6 slots, filled slots show the chain's gem,
  dots under slots 3–6 mark the scoring thresholds; the combo (×1…×4) under the bar in the chain's colour.
- **Gap meter** at the bottom: storm icon on the left, runner dot on the bar, fill = gap share.

## States and motion
- Collect: the slot pops in (back-out, 180 ms) with a rising note.
- Match (3–5): bar flashes the colour, gems fly to the score, "+200 ×2" floats up.
- 6-chain: white flash + 0.4 s slow-motion, storm pushed back, burst of gem shapes.
- Break (1–2): slots shake and drain grey, the runner stumbles, the storm surges.
- Hit a barrier: camera shake, stumble.
- Start/End: overlays on the live road (see `start-*.png`, `end-*.png`).
