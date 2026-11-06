// Real-browser smoke test (headless Edge/Chrome via playwright-core, desktop viewport).
// Game-independent: fails on console errors, page errors, failed requests or HTTP errors.
// If the page exposes window.__GAME__ it goes further:
//   __GAME__.screens  → ['start', 'play', ...]   names screenshotted by --shots
//   __GAME__.goTo(n)  → switch to screen n (async ok)
//   __GAME__.smoke()  → async; returns an array of problem strings (empty = pass)
//
//   npm run smoke            → serves public/ locally and checks it
//   npm run smoke -- <url>   → checks a deployed URL
//   npm run shots            → also saves screenshots to design/compare/
import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer } from './serve.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const shots = args.includes('--shots');
const external = args.find((a) => /^https?:\/\//.test(a));
const shotDir = path.join(root, 'design', 'compare');
const viewport = { width: 1440, height: 900 };

let server;
let url = external;
if (!url) {
  const port = 5199;
  server = await startServer(port);
  url = `http://127.0.0.1:${port}/`;
}

async function launch() {
  for (const channel of ['msedge', 'chrome']) {
    try { return await chromium.launch({ channel, headless: true }); } catch { /* try next */ }
  }
  throw new Error('No Edge or Chrome found for the smoke test. Install one, or run: npx playwright install chromium');
}

const problems = [];
const browser = await launch();
const page = await browser.newPage({ viewport });
page.on('console', (m) => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });
page.on('pageerror', (e) => problems.push(`page error: ${e.message}`));
page.on('requestfailed', (r) => problems.push(`request failed: ${r.url()} (${r.failure()?.errorText})`));
page.on('response', (r) => { if (r.status() >= 400) problems.push(`HTTP ${r.status()}: ${r.url()}`); });

async function shot(name) {
  if (!shots) return;
  await mkdir(shotDir, { recursive: true });
  await page.waitForTimeout(400); // let entrance animations settle
  await page.screenshot({ path: path.join(shotDir, `${name}.png`) });
}

let checked = 'page loads';
try {
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => { try { localStorage.clear(); } catch { /* ignore */ } });
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(300);
  await shot('00-landing');

  const hooks = await page.evaluate(() => ({
    game: Boolean(window.__GAME__),
    screens: Array.isArray(window.__GAME__?.screens) ? window.__GAME__.screens : [],
    smoke: typeof window.__GAME__?.smoke === 'function',
  }));

  if (hooks.game && shots) {
    for (const [i, name] of hooks.screens.entries()) {
      await page.evaluate((n) => window.__GAME__.goTo?.(n), name);
      await shot(`${String(i + 1).padStart(2, '0')}-${name}`);
    }
    checked += `, ${hooks.screens.length} screens captured`;
  }
  if (hooks.smoke) {
    await page.reload({ waitUntil: 'load' });
    const gameProblems = await page.evaluate(() => window.__GAME__.smoke());
    problems.push(...(gameProblems ?? []).map((p) => `game: ${p}`));
    checked += ', game smoke flow';
  }
} catch (e) {
  problems.push(`aborted: ${e.message}`);
} finally {
  await browser.close();
  server?.close();
}

if (problems.length) {
  console.error(`SMOKE FAILED (${problems.length}) at ${url}\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
console.log(`Smoke passed at ${url} (${viewport.width}×${viewport.height}): ${checked}; no console or network errors.${shots ? ' Screenshots: design/compare/' : ''}`);
