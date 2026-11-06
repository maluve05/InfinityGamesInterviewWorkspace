// Copy every file that shaped the AI agents' behaviour into logs/rules/, so the
// submitted prompt log includes the general rules and system-prompt files too.
//   npm run logs:rules
// Includes: AGENTS.md, CLAUDE.md, .agent/rules, .agents/skills, MCP configs, Claude
// user settings and auto-memory for this folder, Antigravity CLI settings.
// Secrets: never copies .env; scrubs values that look like keys or tokens.
import { cp, mkdir, readFile, writeFile, readdir, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'logs', 'rules');
const home = os.homedir();
const slug = root.replace(/[^a-zA-Z0-9]/g, '-');
const copied = [];

const sources = [
  ['AGENTS.md', path.join(root, 'AGENTS.md')],
  ['CLAUDE.md', path.join(root, 'CLAUDE.md')],
  ['antigravity-rules', path.join(root, '.agent', 'rules')],
  ['skills', path.join(root, '.agents', 'skills')],
  ['mcp/claude-project.mcp.json', path.join(root, '.mcp.json')],
  ['mcp/antigravity-mcp_config.json', path.join(root, '.agents', 'mcp_config.json')],
  ['claude-user/settings.json', path.join(home, '.claude', 'settings.json')],
  ['claude-user/CLAUDE.md', path.join(home, '.claude', 'CLAUDE.md')],
  ['claude-memory', path.join(home, '.claude', 'projects', slug, 'memory')],
  ['antigravity-cli/settings.json', path.join(home, '.gemini', 'antigravity-cli', 'settings.json')],
  ['antigravity-user/GEMINI.md', path.join(home, '.gemini', 'GEMINI.md')],
];

await mkdir(out, { recursive: true });
for (const [name, from] of sources) {
  const info = await stat(from).catch(() => null);
  if (!info) continue;
  const to = path.join(out, name);
  await mkdir(path.dirname(to), { recursive: true });
  await cp(from, to, { recursive: true, filter: (p) => !path.basename(p).startsWith('.env') });
  copied.push(name + (info.isDirectory() ? '/' : ''));
}

// Scrub anything that looks like a credential in the copies.
const SECRET = /((?:api[_-]?key|token|secret|password|authorization)["'\s:=]+)["']?[A-Za-z0-9_\-.]{16,}["']?/gi;
async function scrub(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) { await scrub(p); continue; }
    if (!/\.(md|json|jsonc|ya?ml|txt|toml)$/i.test(entry.name)) continue;
    const text = await readFile(p, 'utf8');
    const clean = text.replace(SECRET, '$1"[redacted]"');
    if (clean !== text) await writeFile(p, clean);
  }
}
await scrub(out);

await writeFile(path.join(out, 'README.md'), [
  '# AI rules and system-prompt files',
  '',
  'Every file below was available to the AI agents during the session, copied as-is',
  '(credential-looking values redacted). Chat logs are in `logs/claude/` and `logs/worker/`.',
  '',
  ...copied.map((c) => `- \`${c}\``),
  '',
].join('\n'));
console.log(`Copied ${copied.length} rule/config sources to logs/rules/:\n  ${copied.join('\n  ')}`);
