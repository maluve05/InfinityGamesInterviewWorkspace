// Export every Claude Code session that ran in this folder to readable Markdown,
// plus the raw .jsonl (the complete, unedited record) — for the prompt-log deliverable.
//   npm run logs:claude                 → all sessions for this folder
//   npm run logs:claude -- --since 2026-11-07T14:00
// Output: logs/claude/<date>_<session>.md and .jsonl
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projects = path.join(os.homedir(), '.claude', 'projects');
const out = path.join(root, 'logs', 'claude');
const sinceArg = process.argv.indexOf('--since');
const since = sinceArg > 0 ? new Date(process.argv[sinceArg + 1]) : null;
const MAX_TOOL_CHARS = 6000; // the .jsonl keeps everything; Markdown stays readable

const secrets = (await readFile(path.join(root, '.env'), 'utf8').catch(() => ''))
  .split(/\r?\n/).map((l) => l.match(/^\s*([A-Z0-9_]+)\s*=\s*["']?([^"'\s#]{8,})/)).filter(Boolean).map((m) => [m[1], m[2]]);
const norm = (p) => path.resolve(p).toLowerCase();
const inThisFolder = (cwd) => cwd && (norm(cwd) === norm(root) || norm(cwd).startsWith(norm(root) + path.sep));

const files = [];
for (const dir of await readdir(projects, { withFileTypes: true }).catch(() => [])) {
  if (!dir.isDirectory()) continue;
  for (const f of await readdir(path.join(projects, dir.name)).catch(() => [])) {
    if (f.endsWith('.jsonl')) files.push(path.join(projects, dir.name, f));
  }
}

await mkdir(out, { recursive: true });
let exported = 0;

for (const file of files) {
  const lines = (await readFile(file, 'utf8')).split('\n').filter(Boolean);
  const entries = lines.map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  if (!entries.some((e) => inThisFolder(e.cwd))) continue;
  const turns = entries.filter((e) => (e.type === 'user' || e.type === 'assistant') && e.message && !e.isSidechain);
  if (since && !turns.some((e) => new Date(e.timestamp) >= since)) continue;
  if (!turns.length) continue;

  const session = path.basename(file, '.jsonl');
  const first = turns[0].timestamp?.slice(0, 16).replace(/[:T]/g, '-') ?? 'unknown';
  const md = [`# Claude Code session ${session}`, '',
    `- Folder: \`${turns.find((e) => e.cwd)?.cwd ?? ''}\``,
    `- Started: ${turns[0].timestamp ?? '?'} · Ended: ${turns.at(-1).timestamp ?? '?'}`,
    `- Raw, unedited record: \`${session}.jsonl\` (same folder)`, ''];

  for (const e of turns) {
    const time = e.timestamp ? e.timestamp.slice(11, 19) : '';
    const content = typeof e.message.content === 'string' ? [{ type: 'text', text: e.message.content }] : e.message.content ?? [];
    for (const block of content) {
      if (block.type === 'text' && block.text?.trim()) {
        md.push(`## ${e.type === 'user' ? 'User' : 'Claude'} · ${time}`, '', block.text.trim(), '');
      } else if (block.type === 'image') {
        md.push(`## User · ${time}`, '', '_[image attached]_', '');
      } else if (block.type === 'thinking' && block.thinking?.trim()) {
        md.push('<details><summary>Claude thinking</summary>', '', block.thinking.trim(), '', '</details>', '');
      } else if (block.type === 'tool_use') {
        md.push(`**Tool call · ${block.name}** (${time})`, '', '```json', clip(JSON.stringify(block.input, null, 2)), '```', '');
      } else if (block.type === 'tool_result') {
        const text = Array.isArray(block.content)
          ? block.content.map((c) => (c.type === 'text' ? c.text : `[${c.type}]`)).join('\n')
          : String(block.content ?? '');
        md.push('<details><summary>Tool result</summary>', '', '```', clip(text), '```', '', '</details>', '');
      }
    }
  }

  await writeFile(path.join(out, `${first}_${session}.md`), scrub(md.join('\n')));
  // The raw record is copied byte for byte except for secrets (see scrub below).
  await writeFile(path.join(out, `${first}_${session}.jsonl`), scrub(lines.join('\n') + '\n'));
  exported++;
}

// Final guard: no .env value may survive anywhere in logs/claude/.
for (const f of await readdir(out)) {
  const text = await readFile(path.join(out, f), 'utf8');
  const leak = secrets.find(([, v]) => text.includes(v));
  if (leak) { console.error(`✗ ${leak[0]} still present in logs/claude/${f} — do not commit.`); process.exit(1); }
}

console.log(exported
  ? `Exported ${exported} Claude Code session(s) to logs/claude/ (Markdown + raw .jsonl).`
  : `No Claude Code sessions found for ${root}${since ? ` since ${since.toISOString()}` : ''}.`);

// Secrets: every value in the git-ignored .env is replaced literally (a key pasted
// into chat is otherwise in the transcript), plus anything shaped like key=value.
function scrub(text) {
  for (const [name, value] of secrets) text = text.split(value).join(`[redacted ${name}]`);
  return text.replace(/((?:api[_-]?key|auth[_-]?token|secret|password|authorization)[\\"'\s:=]+)[A-Za-z0-9_\-.]{16,}/gi, '$1[redacted]');
}

function clip(s) {
  return s.length > MAX_TOOL_CHARS ? `${s.slice(0, MAX_TOOL_CHARS)}\n… [${s.length - MAX_TOOL_CHARS} more characters in the raw .jsonl]` : s;
}
