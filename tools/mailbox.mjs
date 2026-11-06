// Mailbox between Claude (admin) and worker agents: "claude antigravity and others/".
// Game-independent.
//   npm run mailbox                 list every task: status, worker, report yes/no
//   npm run mailbox -- wait T3 T4   block until each task is `review`/`blocked`/`failed`
//                                   with a report, then print the reports (run it in the
//                                   background: it ends — and wakes Claude — when the worker is done)
//   npm run mailbox -- wait         same, for every task that is `todo` or `doing` now
// Env: MAILBOX_TIMEOUT_MIN (default 30) — after that, `wait` exits 1 with what is still open.
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const MAILBOX = 'claude antigravity and others';
const box = path.join(root, MAILBOX);
const read = (p) => readFile(p, 'utf8').catch(() => null);

async function tasks() {
  const files = (await readdir(path.join(box, 'tasks')).catch(() => [])).filter((f) => /^T\d+\.md$/i.test(f));
  const out = [];
  for (const f of files) {
    const id = f.replace(/\.md$/i, '');
    const text = (await read(path.join(box, 'tasks', f))) ?? '';
    const field = (n) => text.match(new RegExp(`^- ${n}:\\s*(.+)$`, 'mi'))?.[1].trim() ?? '';
    const title = text.match(/^#\s*T\d+\s*[—-]\s*(.+)$/m)?.[1].trim() ?? '';
    const report = await read(path.join(box, 'reports', f));
    out.push({ id, title, status: field('status') || '?', for: field('for') || 'any', report: report !== null, reportText: report });
  }
  return out.sort((a, b) => Number(a.id.slice(1)) - Number(b.id.slice(1)));
}

const args = process.argv.slice(2);
if (args[0] !== 'wait') {
  const list = await tasks();
  if (!list.length) { console.log(`Mailbox empty (${MAILBOX}/tasks/).`); process.exit(0); }
  console.table(list.map(({ reportText, ...t }) => t));
  process.exit(0);
}

const finished = (t) => ['review', 'blocked', 'failed', 'done'].includes(t.status.toLowerCase()) && t.report;
let ids = args.slice(1).map((s) => s.toUpperCase());
if (!ids.length) ids = (await tasks()).filter((t) => ['todo', 'doing'].includes(t.status.toLowerCase())).map((t) => t.id);
if (!ids.length) { console.log('Nothing to wait for: no task is todo or doing.'); process.exit(0); }

const limit = Date.now() + Number(process.env.MAILBOX_TIMEOUT_MIN || 30) * 60_000;
console.log(`Waiting for ${ids.join(', ')} (owner: tell the worker "claude has work for you").`);
for (;;) {
  const list = (await tasks()).filter((t) => ids.includes(t.id));
  const missing = ids.filter((id) => !list.some((t) => t.id === id));
  if (missing.length) { console.error(`No task file for ${missing.join(', ')} in ${MAILBOX}/tasks/.`); process.exit(2); }
  if (list.every(finished)) {
    for (const t of list) console.log(`\n===== ${t.id} — ${t.title} · status ${t.status} =====\n${t.reportText.trim()}`);
    console.log('\nReview each report and the git diff, re-run the done-when check, then set status: done.');
    process.exit(list.some((t) => t.status.toLowerCase() !== 'review') ? 1 : 0);
  }
  if (Date.now() > limit) {
    console.error(`Timed out. Still open: ${list.filter((t) => !finished(t)).map((t) => `${t.id} (${t.status}${t.report ? ', report written' : ''})`).join(', ')}`);
    process.exit(1);
  }
  await new Promise((r) => setTimeout(r, 5000));
}
