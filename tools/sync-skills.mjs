// Copy the maintained skills in .agents/skills (read by Antigravity and Codex)
// into .claude/skills as real files — no symlinks, so the folder survives copying.
// --check: exit 1 if any Claude copy is missing or differs (no writes).
// Never deletes skills that exist only in .claude/skills.
import { readdir, readFile, mkdir, copyFile, lstat, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, '.agents', 'skills');
const target = path.join(root, '.claude', 'skills');
const check = process.argv.includes('--check');
const problems = [];
let files = 0;

async function visit(rel = '') {
  for (const entry of await readdir(path.join(source, rel), { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const name = path.join(rel, entry.name);
    if (entry.isDirectory()) {
      const dest = path.join(target, name);
      const info = await lstat(dest).catch(() => null);
      if (info?.isSymbolicLink()) {
        if (check) problems.push(`${name} is a symlink (run npm run skills:sync)`);
        else await rm(dest, { recursive: true, force: true });
      }
      await visit(name);
      continue;
    }
    const from = path.join(source, name);
    const to = path.join(target, name);
    const a = await readFile(from);
    const b = await readFile(to).catch(() => null);
    if (!b || !a.equals(b)) {
      if (check) problems.push(`${name} ${b ? 'differs' : 'missing'}`);
      else {
        await mkdir(path.dirname(to), { recursive: true });
        await copyFile(from, to);
      }
    }
    files++;
  }
}

await mkdir(target, { recursive: true });
await visit();
if (problems.length) {
  console.error(`Claude skills out of sync (${problems.length}):\n  ${problems.join('\n  ')}\nEdit .agents/skills, then run: npm run skills:sync`);
  process.exitCode = 1;
} else {
  console.log(`${files} skill files ${check ? 'verified identical' : 'synced'} (.agents/skills → .claude/skills).`);
}
