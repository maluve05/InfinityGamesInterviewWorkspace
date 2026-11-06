---
name: game-audio
description: Give a browser game prototype a small, coherent set of sounds that fit its look — an event-to-sound list, generation with ElevenLabs (sound effects, optional ambient loop), trimming and loudness checks, and a procedural Web Audio fallback. Use once the core loop works, before the polish hour.
---

# Game audio

Sound is half of "feel". A few well-chosen sounds beat many generic ones.

## 1. Event list first (Claude, 3 min)

From the engine's events, list only what needs sound: e.g. pick up, place,
invalid, clear/score, combo, win, lose, UI click, best score. For each: meaning,
length (most SFX 0.1–0.6 s), and mood words that match the visual direction
(e.g. "soft wooden click, warm, close-mic"). One family of timbres for the whole
game. Write it into `design/specs/audio.md`.

## 2. Generate (ElevenLabs)

Use whichever ElevenLabs access the current agent has, and check its live
capabilities first:
- Claude Code: the creative/ElevenLabs connector (sound effects or music through
  its flow tools); or
- Antigravity: the `elevenlabs` MCP in `.agents/mcp_config.json`; or
- the REST API with `ELEVENLABS_API_KEY` from `.env` (sound-generation endpoint,
  text prompt + duration).

Generating costs credits: get the owner's OK for the batch size. Ask for 2–3
takes per key event, keep prompts in `design/specs/audio.md`, save files to
`public/assets/sfx/<event>.mp3`. Optional: one quiet ambient loop (30–60 s) that
loops cleanly, faded in after the first interaction.

## 3. Check and trim

Listen to each take. Trim silence at the start (latency kills feel), check for
clipping and uneven loudness across the set, keep files small (mono, short).
`ffmpeg` can trim and normalise if available. Choose one take per event; note
rejected takes and why.

## 4. Wire it

`audio.js` from `game-scaffold`: `unlock()` on first click/key, `load()` the
chosen files, `play(event, { pitch })` with ±3% random pitch so repeats don't
machine-gun, rising pitch for combos/streaks. Mute toggle remembered in save data.
Procedural fallback tones (soft sine/triangle, short envelopes) for any missing
file so the game is never silent and never errors.

## Never

Harsh square/saw beeps, sounds louder than the UI deserves, music that starts
before a gesture, or a sound for every mouse move.
