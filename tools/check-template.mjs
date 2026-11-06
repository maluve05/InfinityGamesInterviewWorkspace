// Workspace integrity checks: `npm run check`.
// Before the window: also proves that public/ contains no game code.
import assert from 'node:assert/strict';
import { readFile, readdir, lstat, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFile(path.join(root, p), 'utf8');
const exists = (p) => access(path.join(root, p)).then(() => true, () => false);
const preWindow = process.argv.includes('--pre-window');
const failures = [];
const check = async (name, fn) => {
  try { await fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
};

await check('rules', async () => {
  assert.match(await read('CLAUDE.md'), /^@AGENTS\.md/m, 'CLAUDE.md must import AGENTS.md');
  assert.match(await read('.agent/rules/workspace.md'), /AGENTS\.md/, 'Antigravity rule must point to AGENTS.md');
  assert.match(await read('AGENTS.md'), /Design gate \(absolute\)/, 'AGENTS.md must keep the design gate rule');
  assert.match(await read('.claude/settings.json'), /design-gate\.mjs/, '.claude/settings.json must run the design-gate hook');
  assert.match(await read('.agent/rules/workspace.md'), /claude has work for you/, 'Antigravity rule must handle "claude has work for you"');
  assert.match(await read('claude antigravity and others/README.md'), /If you are the worker/, 'mailbox README must keep the worker protocol');
});

await check('skills', async () => {
  const names = (await readdir(path.join(root, '.agents/skills'), { withFileTypes: true }))
    .filter((d) => d.isDirectory()).map((d) => d.name);
  for (const required of ['grill-me', 'grilling', 'plan', 'design-first', 'game-scaffold', 'game-prototyper',
    'game-feel', 'game-audio', 'scale-or-kill', 'feature-handoff', 'browser-visual-review', 'submission', 'game-brainstorm']) {
    assert.ok(names.includes(required), `missing skill ${required}`);
  }
  for (const name of names) {
    const skill = await read(`.agents/skills/${name}/SKILL.md`);
    assert.match(skill, /^---\r?\nname: /, `${name}: SKILL.md needs front matter`);
    const copy = await lstat(path.join(root, '.claude/skills', name)).catch(() => null);
    assert.ok(copy && !copy.isSymbolicLink(), `${name}: .claude copy missing or a symlink (npm run skills:sync)`);
    assert.doesNotMatch(skill, /[A-Z]:[\\/]Users[\\/]/i, `${name}: contains a local user path`);
  }
});

await check('secrets', async () => {
  assert.doesNotMatch(await read('.env.example'), /^\w+=\S+/m, '.env.example must have empty values');
  assert.doesNotMatch(await read('wrangler.jsonc'), /"account_id"\s*:/, 'no account_id in wrangler.jsonc');
  assert.match(await read('.gitignore'), /^\.env$/m, '.env must be git-ignored');
});

await check('docs', async () => {
  for (const f of ['processes/assessment-day.md', 'processes/design-first.md', 'processes/deploy.md',
    'processes/prompt-log.md', 'processes/recording.md', 'processes/submission.md',
    'processes/worker-dispatch.md', 'context/brief.md', 'PLAN.md', 'TASKS.md', 'REFLECTION.md',
    'knowledge/game-design-principles.md', 'knowledge/rehearsal-lessons.md',
    'knowledge/playtest-insights.md', 'authors-raw-notes/README.md']) {
    assert.ok(await exists(f), `missing ${f}`);
  }
});

if (preWindow) {
  await check('no game code before the window', async () => {
    const files = await readdir(path.join(root, 'public'), { recursive: true });
    const code = files.filter((f) => /\.(m?js|css|png|jpe?g|webp|mp3|ogg|wav)$/i.test(f));
    assert.deepEqual(code, [], `public/ must hold only the placeholder page, found: ${code.join(', ')}`);
    const tests = (await readdir(path.join(root, 'tests'))).filter((f) => f !== '.gitkeep');
    assert.deepEqual(tests, [], `tests/ must be empty before the window, found: ${tests.join(', ')}`);
    for (const sub of ['tasks', 'reports']) {
      const mail = (await readdir(path.join(root, 'claude antigravity and others', sub)).catch(() => [])).filter((f) => f !== '.gitkeep');
      assert.deepEqual(mail, [], `the mailbox ${sub}/ must be empty before the window, found: ${mail.join(', ')}`);
    }
  });
  // Only the game-independent tools below may exist before the window. Anything else
  // (e.g. a script another agent wrote to test some game) fails the check. Adding a
  // new game-independent tool before the window means adding it to this list.
  await check('tools/ holds only known game-independent tools', async () => {
    const known = ['check-template.mjs', 'dispatch-worker.mjs', 'export-claude-log.mjs', 'export-rules.mjs',
      'export-worker-log.mjs', 'mailbox.mjs', 'metrics.mjs', 'poly-pizza.mjs', 'design-gate.mjs', 'design-gate-lib.mjs', 'serve.mjs', 'smoke.mjs', 'sync-skills.mjs'];
    const unknown = (await readdir(path.join(root, 'tools'), { recursive: true }))
      .map((f) => f.replaceAll('\\', '/')).filter((f) => !known.includes(f));
    assert.deepEqual(unknown, [], `unknown files in tools/ (move them out, or add a game-independent tool to the list in check-template.mjs): ${unknown.join(', ')}`);
  });
}

// During the window `npm run verify` passes --has-tests: deploys need real engine tests.
if (process.argv.includes('--has-tests')) {
  await check('engine tests exist', async () => {
    const tests = (await readdir(path.join(root, 'tests'), { recursive: true })).filter((f) => f.endsWith('.test.mjs'));
    assert.ok(tests.length > 0, 'tests/ has no *.test.mjs — write at least one engine test before deploying');
  });
  await check('design locked before deploy', async () => {
    const { designLocked } = await import('./design-gate-lib.mjs');
    const s = await designLocked(root);
    assert.ok(s.locked, 'the design is not locked (PLAN.md "Design locked:", design/tokens.css, design/frames/*.png) — no deploy before the owner picks a design');
  });
}

if (failures.length) {
  console.error(`Workspace check failed (${failures.length}):\n  ${failures.join('\n  ')}`);
  process.exit(1);
}
console.log(`Workspace check passed: rules (design gate, worker mailbox), skills (no symlinks, no local paths), no secrets, docs present${preWindow ? ', no game code in public/ or tests/, and only known tools in tools/' : ''}.`);
