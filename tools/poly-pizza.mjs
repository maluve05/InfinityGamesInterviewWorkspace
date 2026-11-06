// Poly Pizza (low-poly 3D models, CC0 / CC-BY) from the command line. Game-independent.
//   npm run models -- search "police car" [--cc0] [--category 3] [--animated] [--limit 10]
//   npm run models -- get <id>                       (metadata only)
//   npm run models -- download <id> [name]           (inside the window only)
// Key: POLY_PIZZA_API_KEY in .env (x-auth-token header, also needed on static.poly.pizza).
// Downloads go to public/assets/models/<name>.glb and the attribution is appended to
// public/assets/models/CREDITS.md, so the browser never sees the key.
// API spec: https://poly.pizza/apispec/v1.1.yaml (base https://api.poly.pizza/v1.1,
// 100 requests per second). Categories: 0 Food & Drink, 1 Clutter, 2 Weapons,
// 3 Transport, 4 Furniture & Decor, 5 Objects, 6 Nature, 7 Animals, 8 Buildings,
// 9 People & Characters, 10 Scenes & Levels, 11 Other.
import { readFile, writeFile, appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const API = 'https://api.poly.pizza/v1.1';
const [cmd, ...rest] = process.argv.slice(2);
const flag = (name) => rest.includes(`--${name}`);
const opt = (name) => { const i = rest.indexOf(`--${name}`); return i >= 0 ? rest[i + 1] : undefined; };
const args = rest.filter((a, i) => !a.startsWith('--') && !(i > 0 && ['--category', '--limit'].includes(rest[i - 1])));

const key = process.env.POLY_PIZZA_API_KEY || (await readFile(path.join(root, '.env'), 'utf8').catch(() => ''))
  .match(/^POLY_PIZZA_API_KEY=(.+)$/m)?.[1]?.trim();
if (!key) fail('POLY_PIZZA_API_KEY is missing: add it to .env (poly.pizza/settings/api).');
const headers = { 'x-auth-token': key };

async function api(p) {
  const res = await fetch(`${API}${p}`, { headers });
  if (!res.ok) fail(`${res.status} ${res.statusText} for ${p}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}
function fail(msg) { console.error(`✗ ${msg}`); process.exit(1); }
const line = (m) => `${m.ID}  ${m.Title}  ·  ${m.Licence}  ·  ${m['Tri Count']} tris${m.Animated ? '  ·  animated' : ''}  ·  ${m.Creator?.Username}`;

if (cmd === 'search') {
  const q = new URLSearchParams({ Limit: opt('limit') ?? '10' });
  if (flag('cc0')) q.set('License', '1');
  if (opt('category')) q.set('Category', opt('category'));
  if (flag('animated')) q.set('Animated', '1');
  const term = args.join(' ');
  if (!term && q.size < 2) fail('search needs a keyword or a filter (--cc0, --category n, --animated).');
  const { total, results } = await api(`/search${term ? `/${encodeURIComponent(term)}` : ''}?${q}`);
  console.log(`${total} found; showing ${results.length}:`);
  for (const m of results) console.log(`  ${line(m)}`);
} else if (cmd === 'get') {
  if (!args[0]) fail('get needs a model id.');
  const m = await api(`/model/${args[0]}`);
  console.log(line(m));
  console.log(`  ${m.Attribution}`);
  console.log(`  thumbnail: ${m.Thumbnail}`);
} else if (cmd === 'download') {
  if (!args[0]) fail('download needs a model id.');
  const m = await api(`/model/${args[0]}`);
  const name = (args[1] || m.Title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const res = await fetch(m.Download, { headers });
  const body = Buffer.from(await res.arrayBuffer());
  if (!res.ok || body.subarray(0, 4).toString() !== 'glTF') fail(`download failed (${res.status}); not a GLB (Cloudflare may block datacenter IPs).`);
  const dir = path.join(root, 'public', 'assets', 'models');
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, `${name}.glb`), body);
  await appendFile(path.join(dir, 'CREDITS.md'), `- \`${name}.glb\` — ${m.Attribution}\n`);
  console.log(`✓ public/assets/models/${name}.glb (${(body.length / 1024).toFixed(0)} kB, ${m.Licence}). Credit appended to CREDITS.md; copy it into the README credits table.`);
} else {
  console.log('Usage: npm run models -- search <keyword> [--cc0] [--category n] [--animated] [--limit n] | get <id> | download <id> [name]');
}
