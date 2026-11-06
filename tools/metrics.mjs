// Attempt metrics from a game's telemetry (JSON Lines), for the scale-or-kill call.
// Game-independent: reads boundary events, one JSON object per line:
//   { "type": "attempt_start", "level": 1, "attempt_no": 1, "ts": ... }
//   { "type": "attempt_end", "level": 1, "attempt_no": 1, "result": "win"|"lose"|"quit",
//     "duration_ms": 41000, "grade": 2, "resource_left": 3, "cause": "...", "ts": ... }
//   { "type": "session_start", "ts": ... }
//   { "type": "ftue", "step": 2, "name": "first_core_action", "ts": ... }   (first-session funnel)
// Optional on any event: "player", "debug": true (debug events are excluded).
//   npm run metrics -- path/to/telemetry.jsonl   (default: every logs/telemetry/*.jsonl)
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let inputs = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!inputs.length) {
  const dir = path.join(root, 'logs', 'telemetry');
  inputs = (await readdir(dir).catch(() => [])).filter((f) => f.endsWith('.jsonl')).map((f) => path.join(dir, f));
}
if (!inputs.length) {
  console.log('No telemetry yet. Save the game\'s export (window.__GAME__.exportTelemetry()) to logs/telemetry/<name>.jsonl.');
  process.exit(0);
}

const events = [];
for (const file of inputs) {
  for (const line of (await readFile(file, 'utf8')).split('\n')) {
    if (!line.trim()) continue;
    try { const e = JSON.parse(line); if (!e.debug) events.push(e); } catch { /* skip bad line */ }
  }
}

const starts = events.filter((e) => e.type === 'attempt_start');
const ends = events.filter((e) => e.type === 'attempt_end');
const players = new Set(events.map((e) => e.player ?? 'local'));
const levels = [...new Set([...starts, ...ends].map((e) => e.level))].sort((a, b) => (a > b) - (a < b));

const pct = (n, d) => (d ? `${((100 * n) / d).toFixed(0)}%` : '—');
const quantile = (xs, q) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(q * s.length))];
};
const secs = (ms) => (ms == null ? '—' : `${(ms / 1000).toFixed(0)} s`);

const rows = levels.map((level) => {
  const st = starts.filter((e) => e.level === level).length;
  const en = ends.filter((e) => e.level === level);
  const wins = en.filter((e) => e.result === 'win');
  const durations = wins.map((e) => e.duration_ms).filter(Number.isFinite);
  const grades = wins.map((e) => e.grade).filter((g) => g != null);
  return {
    level,
    attempts: Math.max(st, en.length),
    win: pct(wins.length, Math.max(st, en.length)),
    abandon: pct(Math.max(0, st - en.length) + en.filter((e) => e.result === 'quit').length, Math.max(st, en.length)),
    p50: secs(quantile(durations, 0.5)),
    p90: secs(quantile(durations, 0.9)),
    grades: grades.length ? [...new Set(grades)].sort().map((g) => `${g}:${grades.filter((x) => x === g).length}`).join(' ') : '—',
  };
});

console.log(`Telemetry: ${events.length} events · ${starts.length} attempts · ${players.size} player(s) · ${inputs.length} file(s)\n`);
console.table(rows);
const losses = ends.filter((e) => e.result !== 'win');
if (losses.length) {
  const causes = {};
  for (const e of losses) causes[e.cause ?? 'unknown'] = (causes[e.cause ?? 'unknown'] ?? 0) + 1;
  console.log('\nWhat ended the attempts that were not won:');
  console.table(Object.entries(causes).sort((a, b) => b[1] - a[1]).map(([cause, n]) => ({ cause, attempts: n, share: pct(n, losses.length) })));
}

const sessions = events.filter((e) => e.type === 'session_start').length;
const ftue = events.filter((e) => e.type === 'ftue');
if (ftue.length) {
  const base = sessions || Math.max(1, players.size);
  const steps = [...new Map(ftue.map((e) => [e.step, e.name])).entries()].sort((a, b) => a[0] - b[0]);
  console.log(`\nFirst-session funnel (share of ${sessions ? `${sessions} session(s)` : `${base} player(s)`}):`);
  console.table(steps.map(([step, name]) => {
    const reached = ftue.filter((e) => e.step === step).length; // each step fires once per first session
    return { step, name, reached, share: pct(Math.min(reached, base), base) };
  }));
}

const allWins = ends.filter((e) => e.result === 'win').length;
console.log(`\nOverall win rate ${pct(allWins, Math.max(starts.length, ends.length))}.`);
console.log(players.size < 5
  ? `Caveat: ${players.size} player(s) — this is a playtest signal, not evidence. In the verdict, name the metric and the threshold you would use at scale instead of quoting these as results.`
  : 'Check sample size per level before drawing conclusions.');
