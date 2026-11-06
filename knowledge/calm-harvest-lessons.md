# Lessons from Calm Harvest (practice build, 2026-11-04)

Repo: `maluve05/InfinityGamesAssessment`. Built mostly with Antigravity.

## Worked

- **Engine/view split + headless tests.** 87 assertions in ~6 ms caught logic
  regressions instantly. Keep it.
- **Procedural Web Audio** for UI sounds: zero load time, no files to manage.
- **Workers static assets deploy** with no build step; deploys in seconds.
- **ElevenLabs** for one ambient loop and a handful of premade SFX
  (now in `public/assets/sfx/`).

## Went wrong / lessons

- **The UI looked generic.** Antigravity improvised it with no design. → Design
  first in Figma; Claude owns UI. (This is the main reason for this template.)
- **Headless tests passed while the page was broken** (catalog failed to
  initialise in the browser, commit `f655553`). → Always run a real-browser smoke
  test before deploy (`npm run smoke`).
- **Rules contradicted each other** ("no sparkle fluff" vs a mandatory petal
  vortex). → One rule set in AGENTS.md; effects only on real events.
- **Docs drifted from the code** (README said 52 tests while there were 87).
  → Update counts from the actual test output; never from memory.
- **CRLF warnings on every commit** on Windows. → `.gitattributes` with `eol=lf`.
- **Custom domain showed a Cloudflare bot challenge to scripts** ("Just a
  moment…"). Real browsers usually pass, but give assessors the workers.dev URL.
- **Mobile audio** is blocked until the first tap: create/resume the
  `AudioContext` and call `navigator.vibrate` only inside a `pointerdown` handler.
  iOS Safari ignores `vibrate` entirely — design haptics as a bonus, never as the
  only feedback.
- **Tap delay / zoom** on mobile: `touch-action: manipulation`,
  `-webkit-tap-highlight-color: transparent`, `user-select: none`, pointer events.
- **Hard-coded Cloudflare account ID** in scripts. → Let `wrangler login` supply it.
