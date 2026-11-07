# Audio Events and ElevenLabs Prompts — Chain Runner

Audio event specifications for the colour-chain runner. Sounds conform to the Infinity Games style guide: bright, musical, tuned glass, soft synth, quiet acoustics, confirming progress without jarring or alarming the player.

## Sound Event Matrix

| Event | When it fires | Feel | Duration (s) | ElevenLabs Prompt |
| --- | --- | --- | --- | --- |
| `lane` | Player shifts left or right (`step` action) | Smooth, swift aerodynamic air whoosh with subtle glassy chime | 0.25 | Soft airy whoosh of speed with delicate glass resonance, smooth aerodynamic swipe, gentle neon glide, quiet high-end chime, clean transient. |
| `edge` | Player attempts to shift beyond the outer lane boundary | Muted, soft rubbery friction or cushioned bumper tap, no harsh buzz | 0.20 | Gentle cushioned thud with a soft rubber rebound, subtle low-frequency dampening, smooth tactile bumper bump, non-punitive and muffled. |
| `jump` | Player initiates a jump over the road (`step` jump) | Weightless upward lift, airy synth chime ascending | 0.35 | Soft upward synth sweep with an airy glass flutter, light aerodynamic launch, weightless ascending tone, delicate melodic swoosh. |
| `land` | Player touches down back onto road surface (`land` event) | Cushioned impact, soft pneumatic contact on smooth glass | 0.25 | Subtle cushioned tap on smooth polished acrylic, soft low-mid thud, quiet air release, gentle clean touchdown with zero harshness. |
| `vault` | Mid-air leap cleanly clears a road barrier (`vault` event) | Rewarding airy harmonic shimmer, sleek acoustic satisfaction | 0.45 | Breezy resonant chime with a soft harmonic tail, smooth high-frequency crystalline whoosh, satisfying effortless leap, warm ambient glow. |
| `collect` | Runner collects a crystal gem (`collect` event; pitch shifts up 1→6) | Pure tuned crystal bell pluck, bright luminous chime | 0.35 | Pure crystalline bell ping, tuned glass mallet strike, warm resonant marimba ping, delicate luminous acoustic chime, bright clean decay. |
| `match` | Cashing in a chain of 3, 4, or 5 matching gems (`match` event) | Ascending lush glass triad chord, musical bloom, positive confirmation | 0.65 | Bright ascending major chord played on tuned glass bells, lush synth chime bloom, sparkling warm harmonics, gentle rewarding musical swell. |
| `match (max: true)` | Reaching full 6-gem chain; auto-burst that pushes shadow back 8m | Grand euphoric glass cascade, sparkling prismatic burst, signature celebratory warmth | 1.20 | Grand resonant crystal chime cascade, euphoric harmonic burst, shimmering glass glockenspiel arpeggio, warm luminous synth pulse, breathtaking sparkling finish. |
| `break` | Incomplete chain of 1–2 gems interrupted or reset by different color | Soft glass ping dissipating into warm reverb, gentle fade without harsh buzz | 0.40 | Soft muted glass tone fading into warm misty reverb, quiet dissolved chime, gentle melancholic whisper, subtle non-punitive release. |
| `stumble (break)` | Slowdown from breaking an incomplete chain (cause: `'break'`) | Soft muffled felt tap with subtle dragging friction, gentle deceleration whoosh | 0.35 | Soft muffled felt tap with subtle dragging friction, gentle deceleration whoosh, quiet dampening of sound, completely non-jarring. |
| `stumble (hit)` | Slowdown from grazing a barrier without vaulting (cause: `'hit'`) | Damped velvet-wrapped mallet tap, subtle low wobble, non-intrusive deceleration | 0.45 | Damped wooden block tap wrapped in soft velvet, quiet air friction, subtle low wobble, non-intrusive muffled bump, gentle deceleration. |
| `setting` | Crossing 900m boundary into a new landscape/palette (`setting` event) | Deep soothing atmospheric wash, resonant singing bowl chime | 1.50 | Deep warm ambient synth pad swell, gentle singing bowl resonance, serene harmonic breeze, spacious peaceful transition tone, soft luminous shimmer. |
| `caught` | Shadow storm reaches runner; run ends (`caught` event) | Low velvety gong decrescendo, quiet dissolving whisper, calm closure | 1.60 | Soft velvet gong decrescendo into deep warm reverb, peaceful closing chime, gentle wind dissipating into darkness, calm contemplative finish. |
| `ambient` (looping bed) | Continuous background audio during active run (optional looping bed) | Hypnotic, calming synth pulse and soft neon wind at speed | 4.00 | Warm rhythmic analog synth pulse with soft airy wind rushing, smooth hypnotic bass drone, subtle ethereal chimes, meditative futuristic runner ambience. |
| `caught_sting` (sting) | Instantaneous impact/fade when run ends | Delicate muffled chime submerged in warm water, gentle stillness | 0.80 | Single delicate crystal chime submerged in warm ambient water, soft muffled tone, calm acoustic bloom fading into absolute quiet. |

## Implementation Notes

1. **`collect` Pitch-Shifting:**
   Claude generates a single base sound from the prompt (tuned glass ping at ~523 Hz / C5). During gameplay, pitch-shift in semitone increments from count 1 through 6 (+0, +2, +4, +5, +7, +9 semitones) to create an organic ascending musical scale.

2. **`match` Layering:**
   One base chord sample. When cashing in chains:
   - 3-chain: standard base volume.
   - 4-chain: playback at +1.5 dB with subtle chorus/reverb extension.
   - 5-chain: playback at +3.0 dB with dual octave sparkle.

3. **`match (max: true)` Burst:**
   The crowning audio moment of the run. Full stereo width, rich sparkle, accompanied by the visible push-back of the shadow storm.

4. **`stumble` (hit vs break):**
   Both keep deceleration non-punitive. `stumble (break)` leans toward a dissolved airy release; `stumble (hit)` provides a slightly deeper, cushioned low-end thud without harsh distortion.

