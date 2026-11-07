---
name: owner-runs-playtests
description: The owner does all playtesting; Claude does not drive the browser to play or screenshot the game
metadata:
  node_type: memory
  type: feedback
  originSessionId: 12134122-17d8-4b26-be4b-20956febe554
  modified: 2026-11-07T16:03:13.911Z
---

The owner runs the playtests. Claude doesn't open the game in the browser pane to play it, take screenshots, or poke state through the debug hook to "see how it looks". Verification is `npm test` + `npm run smoke` (headless), then the owner plays and reports.

**Why:** On 2026-11-07 the owner said: "its not you who runs the playtests, its me. otherwise you waste credits". Browser screenshots and play sessions burned tokens on work the owner does anyway.

**How to apply:** After a visual change, run the tests and smoke test, deploy if green, and tell the owner exactly what to look at. Use the browser only when the owner asks, or to debug a specific error the smoke test reports. Related: [[engine-work-goes-to-antigravity]].
