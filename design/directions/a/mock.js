// Static design mockup generator (not game code): draws Start / Play / End stages for one direction.
const W = 405, H = 720;
const T = window.THEME;

const svg = (tag, attrs, inner = '') =>
  `<${tag} ${Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ')}>${inner}</${tag}>`;

function gemShape(color, cx, cy, r, opts = {}) {
  const c = T.gems[color];
  const glow = opts.glow === false ? '' : `filter="url(#glow)"`;
  const stroke = `stroke="${c.edge}" stroke-width="${Math.max(1, r * 0.12)}"`;
  const fill = opts.empty ? `fill="none"` : `fill="url(#g-${color})"`;
  let shape;
  if (color === 'ember') shape = `<polygon points="${cx},${cy - r} ${cx + r * 0.8},${cy} ${cx},${cy + r} ${cx - r * 0.8},${cy}" ${fill} ${stroke}/>`;
  if (color === 'tide') shape = `<circle cx="${cx}" cy="${cy}" r="${r * 0.82}" ${fill} ${stroke}/>`;
  if (color === 'leaf') shape = `<polygon points="${cx},${cy - r} ${cx + r * 0.9},${cy + r * 0.7} ${cx - r * 0.9},${cy + r * 0.7}" ${fill} ${stroke}/>`;
  if (color === 'sun') {
    const p = [...Array(6)].map((_, i) => { const a = Math.PI / 6 + i * Math.PI / 3; return `${cx + Math.cos(a) * r * 0.9},${cy + Math.sin(a) * r * 0.9}`; }).join(' ');
    shape = `<polygon points="${p}" ${fill} ${stroke}/>`;
  }
  const shine = opts.empty ? '' : `<ellipse cx="${cx - r * 0.25}" cy="${cy - r * 0.3}" rx="${r * 0.22}" ry="${r * 0.12}" fill="#fff" opacity=".55"/>`;
  return `<g ${glow}>${shape}${shine}</g>`;
}

function defs() {
  const g = Object.entries(T.gems).map(([k, c]) => svg('radialGradient', { id: `g-${k}`, cx: '35%', cy: '30%', r: '75%' },
    `<stop offset="0" stop-color="${c.light}"/><stop offset=".55" stop-color="${c.base}"/><stop offset="1" stop-color="${c.deep}"/>`)).join('');
  return `<defs>${g}
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">${T.sky.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>
    <linearGradient id="storm" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${T.storm.core}"/><stop offset=".55" stop-color="${T.storm.core}" stop-opacity=".85"/><stop offset="1" stop-color="${T.storm.core}" stop-opacity="0"/></linearGradient>
    <filter id="glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="${T.glow}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="soft"><feGaussianBlur stdDeviation="6"/></filter>
  </defs>`;
}

const HOR = H * 0.37, NEAR = H * 1.02, HALF = W * 0.72;
const proj = (z) => { const s = 1 / z; return { y: HOR + (NEAR - HOR) * s, s }; };

function world(opts = {}) {
  let out = `<rect width="${W}" height="${H}" fill="url(#sky)"/>`;
  out += T.scenery(W, HOR);
  // Road bands, far to near.
  const zs = []; for (let z = 40; z >= 1; z -= 0.5) zs.push(z);
  for (let i = 0; i < zs.length - 1; i++) {
    const a = proj(zs[i]), b = proj(zs[i + 1]);
    const band = Math.floor(zs[i] * 2 + (opts.phase || 0)) % 2 === 0;
    const ha = HALF * a.s, hb = HALF * b.s, ea = ha * 1.18, eb = hb * 1.18;
    out += `<polygon points="${W / 2 - ea},${a.y} ${W / 2 + ea},${a.y} ${W / 2 + eb},${b.y} ${W / 2 - eb},${b.y}" fill="${band ? T.ground[0] : T.ground[1]}"/>`;
    out += `<polygon points="${W / 2 - ha},${a.y} ${W / 2 + ha},${a.y} ${W / 2 + hb},${b.y} ${W / 2 - hb},${b.y}" fill="${band ? T.road[0] : T.road[1]}"/>`;
  }
  // Lane lines and glowing edges.
  const far = proj(40), near = proj(1);
  for (const f of [-1, -1 / 3, 1 / 3, 1]) {
    const edge = Math.abs(f) === 1;
    out += `<line x1="${W / 2 + HALF * far.s * f}" y1="${far.y}" x2="${W / 2 + HALF * near.s * f}" y2="${near.y}" stroke="${edge ? T.edge : T.laneLine}" stroke-width="${edge ? 3 : 1.5}" ${edge ? 'filter="url(#glow)"' : `stroke-dasharray="14 18"`} opacity="${edge ? 1 : .55}"/>`;
  }
  out += `<rect x="0" y="${HOR - 40}" width="${W}" height="70" fill="${T.fog}" opacity=".55" filter="url(#soft)"/>`;
  return out;
}

const laneX = (lane, s) => W / 2 + (lane - 1) * (HALF * 2 / 3) * s;

function items(list) {
  return list.sort((a, b) => b.z - a.z).map((it) => {
    const p = proj(it.z), x = laneX(it.lane, p.s);
    if (it.kind === 'barrier') {
      const w = HALF * 0.55 * p.s, h = 34 * p.s * 3;
      return `<rect x="${x - w}" y="${p.y - h}" width="${w * 2}" height="${h}" rx="${6 * p.s * 3}" fill="${T.barrier}" stroke="${T.edge}" stroke-width="${2 * p.s * 3}" opacity=".95"/>`;
    }
    const r = 30 * p.s * 2.4; const lift = r * 1.4;
    return `<ellipse cx="${x}" cy="${p.y}" rx="${r * .8}" ry="${r * .22}" fill="#000" opacity=".25"/>` + gemShape(it.color, x, p.y - lift, r);
  }).join('');
}

function runner(lane = 1, jumpY = 0) {
  const x = laneX(lane, proj(1.45).s), y = proj(1.45).y - jumpY;
  return `<g transform="translate(${x},${y})">${T.runner()}</g>`;
}

function storm(gapShare) {
  const h = 70 + (1 - gapShare) * 110;
  let s = `<rect x="0" y="${H - h - 60}" width="${W}" height="${h + 60}" fill="url(#storm)"/>`;
  for (let i = 0; i < 9; i++) s += `<circle cx="${(i / 8) * W}" cy="${H - h + 10 + (i % 3) * 12}" r="${38 + (i % 4) * 9}" fill="${T.storm.cloud}" opacity=".9" filter="url(#soft)"/>`;
  s += `<path d="M${W * .3},${H - h + 20} l14,26 -10,4 18,32" stroke="${T.storm.bolt}" stroke-width="3" fill="none" filter="url(#glow)" opacity=".9"/>`;
  s += `<path d="M${W * .74},${H - h + 30} l-12,22 9,3 -14,28" stroke="${T.storm.bolt}" stroke-width="2.5" fill="none" filter="url(#glow)" opacity=".8"/>`;
  return s;
}

function hud(chain, color, score, best, gapShare, combo) {
  let s = '';
  // Score (left) and best (right).
  s += `<text x="22" y="46" class="num" font-size="30" fill="${T.text}">${score.toLocaleString('en')}</text>`;
  s += `<text x="${W - 22}" y="40" class="lbl" font-size="12" text-anchor="end" fill="${T.muted}">BEST</text><text x="${W - 22}" y="58" class="num" font-size="16" text-anchor="end" fill="${T.muted}">${best.toLocaleString('en')}</text>`;
  // Chain bar: six slots.
  const sw = 34, gap = 8, total = sw * 6 + gap * 5, x0 = W / 2 - total / 2, y = 82;
  s += `<rect x="${x0 - 12}" y="${y - 12}" width="${total + 24}" height="${sw + 24}" rx="${(sw + 24) / 2}" fill="${T.panel}" stroke="${T.panelEdge}"/>`;
  for (let i = 0; i < 6; i++) {
    const cx = x0 + i * (sw + gap) + sw / 2, cy = y + sw / 2;
    const tick = i >= 2 ? `<circle cx="${cx}" cy="${y + sw + 20}" r="2.5" fill="${i < chain ? T.gems[color].base : T.muted}" opacity="${i < chain ? 1 : .5}"/>` : '';
    s += i < chain ? gemShape(color, cx, cy, sw * 0.45) : `<circle cx="${cx}" cy="${cy}" r="${sw * 0.2}" fill="${T.slot}"/>`;
    s += tick;
  }
  if (combo) s += `<text x="${W / 2}" y="${y + sw + 52}" class="num" font-size="22" text-anchor="middle" fill="${T.gems[color].base}" filter="url(#glow)">${combo}</text>`;
  // Chaser gap meter (bottom).
  const mx = 40, mw = W - 80, my = H - 34;
  s += `<rect x="${mx}" y="${my}" width="${mw}" height="8" rx="4" fill="${T.slot}"/>`;
  s += `<rect x="${mx}" y="${my}" width="${mw * gapShare}" height="8" rx="4" fill="${T.edge}" filter="url(#glow)"/>`;
  s += `<circle cx="${mx}" cy="${my + 4}" r="9" fill="${T.storm.cloud}" stroke="${T.storm.bolt}" stroke-width="2"/>`;
  s += `<circle cx="${mx + mw * gapShare}" cy="${my + 4}" r="7" fill="${T.text}"/>`;
  return s;
}

function stagePlay() {
  const list = [
    { kind: 'gem', lane: 1, z: 2.6, color: 'ember' }, { kind: 'gem', lane: 0, z: 2.6, color: 'tide' },
    { kind: 'gem', lane: 1, z: 4.2, color: 'ember' }, { kind: 'gem', lane: 2, z: 4.2, color: 'leaf' },
    { kind: 'gem', lane: 1, z: 6.4, color: 'sun' }, { kind: 'gem', lane: 0, z: 6.4, color: 'ember' },
    { kind: 'barrier', lane: 2, z: 7.5 },
    { kind: 'gem', lane: 0, z: 10, color: 'ember' }, { kind: 'gem', lane: 2, z: 10, color: 'tide' },
    { kind: 'gem', lane: 0, z: 15, color: 'ember' }, { kind: 'gem', lane: 1, z: 15, color: 'leaf' },
    { kind: 'gem', lane: 2, z: 22, color: 'sun' }, { kind: 'gem', lane: 1, z: 22, color: 'tide' },
  ];
  return world() + items(list) + `<g opacity=".9">${speedLines()}</g>` + runner(1) + storm(0.62) + hud(4, 'ember', 12400, 18900, 0.62, '×2');
}

function speedLines() {
  let s = '';
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2, r1 = 230 + (i % 3) * 30, r2 = r1 + 60;
    const cx = W / 2, cy = HOR;
    const x1 = cx + Math.cos(a) * r1, y1 = cy + Math.sin(a) * r1 * .9, x2 = cx + Math.cos(a) * r2, y2 = cy + Math.sin(a) * r2 * .9;
    if (y1 < HOR + 30) continue;
    s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${T.text}" stroke-width="1.5" opacity=".18"/>`;
  }
  return s;
}

function stageStart() {
  const list = [{ kind: 'gem', lane: 0, z: 5, color: 'tide' }, { kind: 'gem', lane: 1, z: 5, color: 'ember' }, { kind: 'gem', lane: 2, z: 5, color: 'leaf' }, { kind: 'gem', lane: 1, z: 9, color: 'sun' }];
  let s = world({ phase: 1 }) + items(list) + runner(1) + storm(0.9);
  s += `<rect width="${W}" height="${H}" fill="${T.veil}"/>`;
  s += T.title(W);
  // Play button.
  s += `<g filter="url(#glow)"><circle cx="${W / 2}" cy="${H * .62}" r="46" fill="${T.cta}"/><polygon points="${W / 2 - 13},${H * .62 - 19} ${W / 2 + 21},${H * .62} ${W / 2 - 13},${H * .62 + 19}" fill="${T.ctaInk}"/></g>`;
  // Keys.
  const k = (x, label, w = 34) => `<rect x="${x - w / 2}" y="${H * .78}" width="${w}" height="30" rx="7" fill="${T.panel}" stroke="${T.panelEdge}"/><text x="${x}" y="${H * .78 + 20}" text-anchor="middle" class="lbl" font-size="13" fill="${T.text}">${label}</text>`;
  s += k(W / 2 - 70, '←') + k(W / 2 - 30, '→') + k(W / 2 + 50, 'SPACE', 76);
  s += `<text x="${W / 2 - 50}" y="${H * .78 + 52}" text-anchor="middle" class="lbl" font-size="10" fill="${T.muted}">LANE</text><text x="${W / 2 + 50}" y="${H * .78 + 52}" text-anchor="middle" class="lbl" font-size="10" fill="${T.muted}">JUMP</text>`;
  // The rule, as graphics: 3 same = score, 6 = burst.
  return s;
}

function stageEnd() {
  let s = world({ phase: 0 }) + storm(0.02);
  s += `<rect width="${W}" height="${H}" fill="${T.veil}"/>`;
  s += `<text x="${W / 2}" y="${H * .2}" text-anchor="middle" class="lbl" font-size="14" letter-spacing="4" fill="${T.muted}">CAUGHT AT 2,184 M</text>`;
  s += `<text x="${W / 2}" y="${H * .32}" text-anchor="middle" class="display" font-size="64" fill="${T.text}">14,700</text>`;
  s += `<g transform="translate(${W / 2 - 52},${H * .36})"><rect width="104" height="26" rx="13" fill="${T.cta}"/><text x="52" y="18" text-anchor="middle" class="lbl" font-size="12" fill="${T.ctaInk}">NEW BEST</text></g>`;
  // Stats as icons.
  const stat = (x, icon, n, l) => `${icon}<text x="${x}" y="${H * .55}" text-anchor="middle" class="num" font-size="24" fill="${T.text}">${n}</text><text x="${x}" y="${H * .55 + 20}" text-anchor="middle" class="lbl" font-size="10" fill="${T.muted}">${l}</text>`;
  s += stat(W * .25, gemShape('sun', W * .25, H * .47, 16), '7', '6-CHAINS');
  s += stat(W * .5, gemShape('ember', W * .5, H * .47, 16), '31', 'MATCHES');
  s += stat(W * .75, gemShape('tide', W * .75, H * .47, 16), '×4', 'TOP COMBO');
  s += `<g filter="url(#glow)"><rect x="${W / 2 - 110}" y="${H * .68}" width="220" height="58" rx="29" fill="${T.cta}"/></g><text x="${W / 2}" y="${H * .68 + 37}" text-anchor="middle" class="display" font-size="20" fill="${T.ctaInk}">RUN AGAIN</text>`;
  s += `<text x="${W / 2}" y="${H * .68 + 86}" text-anchor="middle" class="lbl" font-size="11" fill="${T.muted}">or press SPACE</text>`;
  return s;
}

const stage = (inner) => `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${defs()}${inner}</svg>`;
document.getElementById('start').innerHTML = stage(stageStart());
document.getElementById('play').innerHTML = stage(stagePlay());
document.getElementById('end').innerHTML = stage(stageEnd());
