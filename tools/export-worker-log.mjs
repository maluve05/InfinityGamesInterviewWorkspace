// Complete the Gemini worker's prompt log: for every task dispatched with
// `npm run worker`, copy Antigravity's own raw conversation record next to the
// readable transcript already in logs/worker/.
//   npm run logs:worker
// logs/worker/<task>-<time>.md       readable transcript (written at dispatch)
// logs/worker/<task>-<time>.ndjson   full event stream (written at dispatch)
// logs/worker/raw/<conversation>/    Antigravity's database + brain folder (copied here)
import { readdir, readFile, cp, mkdir, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'logs', 'worker');
const agy = path.join(os.homedir(), '.gemini', 'antigravity-cli');

const files = (await readdir(dir).catch(() => [])).filter((f) => f.endsWith('.ndjson'));
if (!files.length) {
  console.log('No worker runs in logs/worker/ yet (npm run worker writes them).');
  process.exit(0);
}

const ids = new Map(); // conversation id → task file
for (const f of files) {
  const text = await readFile(path.join(dir, f), 'utf8');
  const id = text.match(/"conversation_id":"([0-9a-f-]{36})"/)?.[1];
  if (id) ids.set(id, f);
}

let copied = 0;
const missing = [];
for (const [id, file] of ids) {
  const dest = path.join(dir, 'raw', id);
  await mkdir(dest, { recursive: true });
  let found = false;
  for (const [from, name] of [[path.join(agy, 'conversations', `${id}.db`), `${id}.db`], [path.join(agy, 'brain', id), 'brain']]) {
    if (await stat(from).catch(() => null)) {
      await cp(from, path.join(dest, name), { recursive: true });
      found = true;
    }
  }
  if (found) copied++; else missing.push(`${id} (${file})`);
}

await writeFile(path.join(dir, 'README.md'), [
  '# Gemini worker logs (Antigravity CLI)', '',
  'Each task Claude dispatched has: `<task>-<time>.prompt.md` (exact prompt + allow-list),',
  '`<task>-<time>.md` (readable transcript: every tool call, output and reply),',
  '`<task>-<time>.ndjson` (the full event stream) and `raw/<conversation>/` (Antigravity\'s own record).', '',
  ...[...ids].map(([id, f]) => `- \`${f}\` → conversation \`${id}\``), '',
].join('\n'));

console.log(`Worker logs: ${files.length} run(s), ${copied} raw conversation record(s) copied to logs/worker/raw/.`);
if (missing.length) console.warn(`Not found in ${agy}:\n  ${missing.join('\n  ')}`);
