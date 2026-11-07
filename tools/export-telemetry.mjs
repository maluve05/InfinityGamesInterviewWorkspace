// Exports remote D1 telemetry into logs/telemetry/d1-telemetry.jsonl
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const url = process.argv[2] || 'https://infinity-games-interview.malvinchitswamatombo.workers.dev/api/telemetry?format=jsonl&limit=1000';

try {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  const jsonl = await res.text();
  const dir = path.join(root, 'logs', 'telemetry');
  await mkdir(dir, { recursive: true });
  const target = path.join(dir, 'd1-telemetry.jsonl');
  await writeFile(target, jsonl, 'utf8');
  console.log(`Saved remote D1 telemetry to ${path.relative(root, target)} (${jsonl.trim().split('\n').filter(Boolean).length} events).`);
} catch (err) {
  console.error(`Failed to export D1 telemetry: ${err.message}`);
  process.exit(1);
}

