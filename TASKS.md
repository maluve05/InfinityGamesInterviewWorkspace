# TASKS — worker queue

Claude writes tasks here; the Gemini worker executes them through
`npm run worker -- <id>` (see `processes/worker-dispatch.md`). One task = one
bounded, non-visual job. Claude reviews the report and diff before marking it done.

## Format

```
### T<n> — <short title>
- status: todo | running | review | done | failed
- goal: <what must be true afterwards>
- may write: <files or folders, comma-separated>
- may run: <commands, comma-separated: node, npm test, npx wrangler deploy>
- must not touch: design/, stylesheets, public/index.html, rendering code
- done when: <the check that proves it, e.g. `npm test` passes>
- context: <files the worker should read first>
```

## Queue

_Empty until the window opens._
