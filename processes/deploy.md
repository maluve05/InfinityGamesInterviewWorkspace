# Deploy (Cloudflare, static assets)

`public/` deploys as a static-assets Worker — Cloudflare's current way to host a
static site (the successor to Pages for new projects). No build step.

## Current setup (done 2026-11-06)

- Worker `infinity-games-interview` on the **MalvinCF** account, live at
  https://infinity-games-interview.malvinchitswamatombo.workers.dev (placeholder page,
  verified: HTTP 200, browser smoke passes, no challenge page).
- Two Cloudflare accounts are signed in; deploys are pinned to MalvinCF through
  `CLOUDFLARE_ACCOUNT_ID` in the git-ignored `.env` (wrangler reads it automatically).
- **Custom domain `infinity.chitswa.com`** attached via `routes` in `wrangler.jsonc`
  (moved from the old Calm Harvest worker). `workers_dev: true` is set explicitly:
  adding a route otherwise switches the workers.dev URL off.
- **Known issue:** the `chitswa.com` zone has bot protection on. Scripts (curl, the
  headless smoke test) get a "Just a moment…" challenge (HTTP 403) on the custom
  domain; a real browser passes it, but a first-time visitor may see the interstitial
  briefly. Fix before submitting: Cloudflare dashboard → chitswa.com → Security →
  Bots (turn off Bot Fight Mode) or add a WAF skip rule for `infinity.chitswa.com`.
  Until then, run `npm run smoke -- <workers.dev URL>` for live checks.

## One-time (before the window)

1. `npx wrangler login`, then `npx wrangler whoami`.
2. `npm run deploy` with the placeholder page. Note the workers.dev URL.
3. Custom domain (optional): in the Cloudflare dashboard → Workers → the Worker →
   Domains & Routes → add e.g. `play.<your-domain>`.
4. **Test the custom domain in a private desktop window**, ideally on another
   network (phone hotspot). If a "Just a moment…" challenge appears, turn off Bot
   Fight Mode / the challenge rule for that hostname, or send the workers.dev URL.
5. Write the final URL into `PLAN.md`.

## During the window

`npm run deploy` runs `npm test` and `npm run smoke` first and deploys only if
both pass. If verify fails, fix it; never bypass it. The previous deploy stays
live until a new one succeeds. Check the live URL after every deploy:
`npm run smoke -- <url>`.

## Rolling back

`npx wrangler deployments list`, then `npx wrangler rollback <version-id>`.

## Fallback if Cloudflare is down

Any static host works (GitHub Pages: push `public/` to a `gh-pages` branch).
