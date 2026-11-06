// Dispatch one TASKS.md task to the Gemini worker through the Antigravity CLI (headless).
//   npm run worker -- T3
// Builds scoped permissions from the task's "may write" / "may run" fields, saves the
// prompt and result to logs/worker/, and fails loudly on denied actions or a missing report.
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const id = process.argv[2];
const model = process.env.WORKER_MODEL || 'gemini-3.8-flash-high';
const timeout = process.env.WORKER_TIMEOUT || '600s';
if (!/^T\d+$/i.test(id ?? '')) {
  console.error('Usage: npm run worker -- T<n>   (task id from TASKS.md)');
  process.exit(2);
}

const tasksFile = path.join(root, 'TASKS.md');
const tasks = await readFile(tasksFile, 'utf8');
const section = tasks.match(new RegExp(`^### ${id}\\b[^\\n]*\\n([\\s\\S]*?)(?=^### |(?![\\s\\S]))`, 'm'));
if (!section) { console.error(`Task ${id} not found in TASKS.md`); process.exit(2); }
const field = (name) => section[1].match(new RegExp(`^- ${name}:\\s*(.+)$`, 'm'))?.[1].trim() ?? '';
const list = (name) => field(name).split(',').map((s) => s.trim().replace(/^`|`$/g, '')).filter(Boolean);

const report = `inbox/reports/${id}.md`;
const writes = [...new Set([...list('may write'), 'inbox/reports/'])];
const runs = list('may run');
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const allow = [
  ...writes.map((p) => `write_file(${p})`),
  ...runs.map((cmd) => `command(regex:^${escape(cmd)}( .*)?$)`),
];

const prompt = `You are the WORKER agent in this repository. Claude Code is the admin and will review your work.
Read AGENTS.md first, then the files listed under "context".

Do exactly this task and nothing else:

${section[0].trim()}

Rules:
- Only create or modify files listed under "may write". Never touch "must not touch" files.
- Only run commands listed under "may run". If you need anything else, stop and say so in the report.
- Do not change visual or UI files unless the task names them.
- When finished, write ${report} with these sections:
  ## Result (one line: done / partial / blocked)
  ## Files changed (paths)
  ## Commands run (each command and its exact output, trimmed to the relevant part)
  ## Done-when check (the check from the task and whether it passed, with evidence)
  ## Notes for the admin (anything surprising, blocked or left undone)
Be accurate: report only what you actually did and saw.`;

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const logDir = path.join(root, 'logs', 'worker');
await mkdir(logDir, { recursive: true });
await writeFile(path.join(logDir, `${id}-${stamp}.prompt.md`), `${prompt}\n\n<!-- allow: ${JSON.stringify(allow)} -->\n`);
await setStatus('running');

const agy = process.platform === 'win32' && process.env.LOCALAPPDATA
  ? path.join(process.env.LOCALAPPDATA, 'agy', 'bin', 'agy.exe')
  : 'agy';
// stream-json records every step (tool calls, outputs, replies) for the prompt log.
const args = ['-p', prompt, '--model', model, '--settings', JSON.stringify({ permissions: { allow } }),
  '--output-format', 'stream-json', '--print-timeout', timeout];

console.log(`→ ${id} to ${model} (writes: ${writes.join(', ')} | runs: ${runs.join(', ') || 'none'})`);
const started = Date.now();
const { code, stdout, stderr } = await run(await exists(agy) ? agy : 'agy', args);
const base = path.join(logDir, `${id}-${stamp}`);
await writeFile(`${base}.ndjson`, stdout);
if (stderr.trim()) await writeFile(`${base}.stderr.txt`, stderr);

const events = stdout.split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
const result = events.findLast((e) => e.event === 'result')?.result ?? {};
await writeFile(`${base}.md`, renderTranscript(id, model, prompt, allow, events, result));
const problems = [];
// agy 1.5: exit 3 = --print-timeout cut the turn short; finished_reason is set only when a turn ends early.
if (code !== 0) problems.push(`agy exited ${code}${code === 3 ? ' (print timeout: raise WORKER_TIMEOUT or split the task)' : ''}`);
if (result.status !== 'SUCCESS') problems.push(`status ${result.status ?? 'unknown'}${result.error ? `: ${result.error}` : ''}`);
if (result.finished_reason) problems.push(`turn ended early: ${result.finished_reason}`);
// A single denial ends the whole run (status still SUCCESS, exit 0), usually before the report is written.
if (result.denied_actions?.length) problems.push(`denied actions: ${JSON.stringify(result.denied_actions)} — the run stopped there; see the attempted call in ${path.relative(root, base)}.ndjson and add it to "may run"/"may write" if legitimate`);
if (!(await exists(path.join(root, report)))) problems.push(`no report at ${report}`);

const secs = ((Date.now() - started) / 1000).toFixed(0);
if (problems.length) {
  await setStatus('failed');
  console.error(`✗ ${id} failed after ${secs}s (conversation ${result.conversation_id ?? '?'}):\n  ${problems.join('\n  ')}\n  stderr: ${stderr.trim().split('\n').slice(-3).join(' | ')}`);
  process.exit(1);
}
await setStatus('review');
console.log(`✓ ${id} finished in ${secs}s (conversation ${result.conversation_id}). Review ${report} and the diff, then mark it done.`);

// ---------- helpers ----------
function renderTranscript(taskId, modelName, sentPrompt, rules, evts, res) {
  const out = [`# Worker transcript — ${taskId}`, '',
    `- Model: ${modelName} (Antigravity CLI, headless)`,
    `- Conversation: ${res.conversation_id ?? evts.find((e) => e.conversation_id)?.conversation_id ?? '?'}`,
    `- Status: ${res.status ?? 'unknown'} · Duration: ${res.duration_seconds ?? '?'} s`,
    `- Permission allow-list: \`${JSON.stringify(rules)}\``,
    `- Denied actions: ${res.denied_actions?.length ? JSON.stringify(res.denied_actions) : 'none'}`,
    '', '## Prompt sent by the admin (Claude)', '', '```text', sentPrompt, '```', ''];
  let text = '';
  const flush = () => { if (text.trim()) out.push('## Worker', '', text.trim(), ''); text = ''; };
  for (const e of evts) {
    const s = e.step_update;
    if (!s) continue;
    if (s.text_delta) text += s.text_delta;
    if (s.step_type === 'tool' && s.state === 'DONE' && s.tool_info) {
      flush();
      const { name, parameters, output } = s.tool_info;
      out.push(`**Tool · ${name}**`, '', '```json', JSON.stringify(parameters ?? {}, null, 2), '```', '');
      if (output) out.push('<details><summary>Output</summary>', '', '```', String(output).slice(0, 8000), '```', '', '</details>', '');
    }
  }
  flush();
  if (res.response?.trim()) out.push('## Final response', '', res.response.trim(), '');
  return out.join('\n');
}
async function setStatus(status) {
  const current = await readFile(tasksFile, 'utf8');
  const updated = current.replace(new RegExp(`(^### ${id}\\b[^\\n]*\\n(?:(?!^### )[\\s\\S])*?^- status:)[^\\n]*`, 'm'), `$1 ${status}`);
  await writeFile(tasksFile, updated);
}
function exists(p) { return access(p).then(() => true, () => false); }
function run(cmd, argv) {
  return new Promise((resolve) => {
    const child = spawn(cmd, argv, { cwd: root, windowsHide: true });
    let stdout = '', stderr = '';
    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', (d) => { stderr += d; });
    child.on('error', (e) => resolve({ code: 127, stdout, stderr: `${stderr}\n${e.message}` }));
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}
