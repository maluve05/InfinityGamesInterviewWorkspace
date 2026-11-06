// Shared by tools/design-gate.mjs (Claude Code hook) and tools/check-template.mjs.
// The design is locked when PLAN.md has a filled-in "**Design locked:**" line AND
// design/tokens.css exists AND design/frames/ holds at least one reference PNG.
import { readFile, readdir, access } from 'node:fs/promises';
import path from 'node:path';

// Logic files allowed before the lock: engine, config, RNG, storage, audio, level data.
const LOGIC = /^public\/src\/(engine|config|rng|storage|audio|levels?|data)[\w-]*\.(m?js|json)$/;

export async function designLocked(root) {
  const plan = await readFile(path.join(root, 'PLAN.md'), 'utf8').catch(() => '');
  const line = plan.match(/^\*\*Design locked:\*\*\s*(.*)$/m)?.[1]?.trim() ?? '';
  const signed = Boolean(line) && !/^(_|no\b|not\b|—|-|tbd)/i.test(line);
  const tokens = await access(path.join(root, 'design', 'tokens.css')).then(() => true, () => false);
  const frames = (await readdir(path.join(root, 'design', 'frames')).catch(() => [])).some((f) => f.endsWith('.png'));
  return { locked: signed && tokens && frames, signed, tokens, frames };
}

export function isUiPath(rel) {
  const p = rel.replaceAll('\\', '/');
  return p.startsWith('public/') && !LOGIC.test(p) && !p.startsWith('public/assets/');
}

export const missing = (s) => [!s.signed && 'PLAN.md has no filled-in "**Design locked:**" line (owner\'s pick)',
  !s.tokens && 'design/tokens.css is missing', !s.frames && 'design/frames/ has no reference PNG'].filter(Boolean).join('; ');
