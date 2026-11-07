# Audio spec — Chroma Rush (Coral Coast)

One timbre family for the whole game: **sunny marimba, tuned glass bells, steel drum,
soft surf**. Everything is in **C major** so the collect pitch ladder (C D E G A C…),
the match arpeggios and the music never clash. Friendly, never harsh: mistakes are
soft and comic, not punishing.

Generated 2026-11-07 ~15:48 in ElevenLabs (flow "Chroma Rush — audio"), two takes per
event. Models: Music v2.5 (instrumental, 96 s), Sound Effects v2 (prompt influence 0.6).

| File (`public/assets/sfx/`) | Engine event → when | Length | Prompt idea |
| --- | --- | --- | --- |
| `music-run.mp3` | `startRun` → loops during the run, ducks on pause, fades out when caught | 96 s loop | 120 BPM C-major marimba, steel drum, ukulele, shakers, no intro/outro |
| `surf-loop.mp3` | quietly under the music from the first gesture (start screen too) | 10 s seamless | waves on sand, breeze, distant gulls |
| `collect.mp3` | `collect` (pitch climbs the C-major pentatonic with the chain count) | ≤0.5 s | glass marimba pluck on C5 |
| `match.mp3` | `match` (3–5); pitch +2 semitones per extra gem | ≤1 s | rising C-major arpeggio + shimmer |
| `burst.mp3` | `match` with `max` (6-chain) | ≤1.8 s | glass/glockenspiel cascade + wind + steel-drum hit |
| `break.mp3` | `break` (1–2 chain lost) | ≤0.7 s | two soft descending muted marimba notes |
| `hit.mp3` | `stumble {cause:'hit'}` | ≤0.6 s | hollow driftwood thunk + shell clatter |
| `jump.mp3` | `jump` | ≤0.5 s | airy whoosh + coat flutter + tiny boing |
| `land.mp3` | `land` | ≤0.5 s | sneakers on sandy boardwalk |
| `lane.mp3` | `lane` | ≤0.25 s used | quick soft swish |
| `vault.mp3` | `vault` | ≤0.7 s | whoosh over + two-note glass chime |
| `unlock.mp3` | `colors` (new colour unlocked) | ≤1.6 s | rising sparkle → glass bell chord |
| `storm-step.mp3` | `chaser {dir:1}` (storm one step closer) | ≤1.5 s | rolling thunder swell + gust |
| `caught.mp3` | `caught` | ≤2.2 s | thunderclap + storm whoosh + comic marimba wah-wah |
| `start.mp3` | run start | ≤1 s | steel drum + marimba flourish up |
| `best.mp3` | end screen with a new best | ≤2 s | short steel-drum fanfare |
| `ui.mp3` | buttons (play, again, resume) | ≤0.3 s used | wooden pop + glass tick |

## Processing (ffmpeg)
Leading silence trimmed to < 10 ms (latency kills feel); mono 44.1 kHz MP3; SFX
loudness-normalised to about −16 LUFS, music −20 LUFS and surf −28 LUFS so effects sit on top.
±3 % random pitch per play so repeats don't machine-gun.

## Take choice
Claude can't listen. Takes were chosen on measured onset delay, true peak and
loudness spread (see `design/specs/audio-takes.md`). **The owner's ears are the real check:**
swap a take by copying the other one from `design/assets-src/audio/`.
