@AGENTS.md

## Claude Code notes

- You are the admin described in AGENTS.md. Dispatch worker tasks with
  `npm run worker -- <task-id>` (see `processes/worker-dispatch.md`), then review
  the report and the diff before accepting anything.
- Figma is connected through the Figma MCP on the owner's Education account.
  Writing designs into Figma is not rate-limited; reads are capped per day, so
  read the chosen frames once and save what you need into `design/specs/`.
- Skills are synced copies of `.agents/skills/`. Edit the source, then run
  `npm run skills:sync`.
