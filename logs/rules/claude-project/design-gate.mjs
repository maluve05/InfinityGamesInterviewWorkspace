// Design gate — Claude Code PreToolUse hook (see .claude/settings.json). Game-independent.
// Blocks Write/Edit of UI files in public/ (index.html, CSS, view, screens, controller,
// rendering) until the design is locked (tools/design-gate-lib.mjs). Engine, config,
// RNG, storage, audio, level data and tests stay allowed: they are logic, not looks.
//   Hook:   reads the tool call as JSON on stdin; exit 2 = blocked, message to Claude.
//   Status: node tools/design-gate.mjs --status
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { designLocked, isUiPath, missing } from './design-gate-lib.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.argv.includes('--status')) {
  const s = await designLocked(root);
  console.log(s.locked ? 'Design locked.' : `Design NOT locked: ${missing(s)}.`);
  process.exit(s.locked ? 0 : 1);
}

let input = '';
for await (const chunk of process.stdin) input += chunk;
let file = '';
try { const j = JSON.parse(input); file = j.tool_input?.file_path ?? j.tool_input?.notebook_path ?? ''; } catch { process.exit(0); }
if (!file) process.exit(0);
const rel = path.relative(root, path.resolve(root, file)).replaceAll('\\', '/');
if (rel.startsWith('..') || !isUiPath(rel)) process.exit(0);

const s = await designLocked(root);
if (s.locked) process.exit(0);
console.error(`DESIGN GATE: ${rel} is UI code and the design is not locked (${missing(s)}). ` +
  'Rule (AGENTS.md): no UI code — index.html, CSS, view, screens, controller, rendering — before the owner has ' +
  'picked and locked a Figma direction. Do the design-first steps now (fast path: 2 directions in ~10 min if behind). ' +
  'Engine, config, RNG, storage, audio and tests are allowed meanwhile. Even if the owner asks to "build first", ' +
  'remind them of this rule and offer the fast path; do not work around this gate (no shell writes to public/).');
process.exit(2);
