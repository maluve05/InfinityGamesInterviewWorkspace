// Canvas renderer: pseudo-3D road, gems, runner, storm, HUD and effects.
// Reads engine state; never changes it. Randomness here is visual only.
import { jumpHeight } from './engine.js';
import { loadSprites, tintScarf } from './sprites.js';

const W = 405, H = 720;
const HOR = H * 0.37, NEAR = H * 1.02, HALF = W * 0.72;
const M_PER_UNIT = 6;          // metres of track per projection unit
const RUNNER_MZ = 1.45;        // where the runner stands in projection units
const BAND_M = 3;              // road stripe length in metres

const GEMS = {
  ember: ['#ffd0c2', '#ff4d5e', '#a3142f', '#ffb3a8'],
  tide: ['#d4f6ff', '#2fb6ff', '#0c4e9c', '#a8e6ff'],
  leaf: ['#e2ffd0', '#5be36a', '#167a3a', '#b9f7a8'],
  sun: ['#fff6c9', '#ffc531', '#b86a00', '#ffe58a'],
  plum: ['#f3e1ff', '#b25cff', '#5a1a9c', '#ddb8ff'],
};
const DAY = {
  sky0: '#bfe3e6', sky1: '#f6e7c8', sky2: '#ffd6a3', ground0: '#e9c48f', ground1: '#e2b97f', road0: '#d0694a', road1: '#c45f42',
  edge: '#fff4e0', lane: '#ffe5c9', fog: '#fff3dc', scenery: '#f2cf95', ink: '#2b2a3a', muted: '#7b6f66', panel: '#fffaf0',
  slot: '#2b2a3a', storm: '#2a3566', cloud: '#3d4a7a', bolt: '#bfe3e6', barrier: '#3d4a7a', moon: '#fff4d6', runner: '#2b2a3a', accent: '#f0553f',
};
const DUSK = {
  sky0: '#120f2b', sky1: '#3b1d4a', sky2: '#ff7a59', ground0: '#16132a', ground1: '#1b1733', road0: '#1d1a36', road1: '#25213f',
  edge: '#33f0d0', lane: '#8c86c9', fog: '#ff8e6b', scenery: '#1a1236', ink: '#f6f2ea', muted: '#a49fc4', panel: '#0e0c1e',
  slot: '#ffffff', storm: '#120a24', cloud: '#2c1748', bolt: '#c9a6ff', barrier: '#2a2350', moon: '#ffd9a6', runner: '#f6f2ea', accent: '#33f0d0',
};

const P = (name, h, off, noFlip = false) => ({ name, h, off, noFlip });
const WORLD_DEFS = [
  { key: 'coast', foam: true, ground: [[214, 196, 156], [242, 220, 166]], edge: '#ffffff', glow: 'rgba(80,190,255,.9)', groove: 'rgba(150,110,60,.35)', haze: '225,245,255', grade: null,
    props: [P('palm', 330, [1.95, 2.6]), P('coral', 95, [1.75, 2.3]), P('lamp', 210, [1.7, 1.8]), P('palm', 300, [2.2, 3.0]), P('hut', 210, [2.4, 2.9], true), P('buoy', 85, [2.6, 3.4]), P('coral', 80, [2.0, 2.8])] },
];

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => { const x = hex(a), y = hex(b); return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(',')})`; };
const ease = (t) => t * t * (3 - 2 * t);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
/** How far away the storm is, 1 = out of sight, 0 = caught. Works with the step rule (T5) and the old gap rule. */
const stormShare = (state) => {
  const c = state.config.chaser;
  if (Number.isFinite(state.chaserStep)) return clamp(1 - state.chaserStep / (c.steps || 3), 0, 1);
  if (Number.isFinite(state.gap) && c.maxGapM) return clamp(state.gap / c.maxGapM, 0, 1);
  return 1;
};

/** Day → dusk → day over 3,600 m; dusk is reached at 1,800 m. */
export function duskAmount(distance) {
  return (1 - Math.cos((2 * Math.PI * distance) / 3600)) / 2;
}

export function createView(canvas) {
  const ctx = canvas.getContext('2d');
  let dpr = 1;
  let onStrike = null;
  const fx = { strikes: [], nextStrike: 2500, dust: [], pose: 'run', prevPose: null, poseT: 0, lastDrawn: null, lastFoot: -1, runPhase: 0, landT: 0, takeT: 0, wasAir: false, particles: [], floats: [], flash: 0, shake: 0, laneX: 1, slotPop: [0, 0, 0, 0, 0, 0], drain: null, surge: 0, bolt: 0 };
  let palette = DAY, dusk = 0;
  const art = loadSprites();
  const coast = () => art.img('coast-backdrop') !== null;
  // Roadside props: placed every PROP_M metres on alternating sides, chosen by hash.
  const PROP_M = 7;
  // Worlds, in run order (engine `setting` index). Each road row, prop and barrier takes the world of
  // its own z, so the next world arrives along the road; the sky crossfades over CROSS_M.
  const CROSS_M = 80;
  const WORLDS = WORLD_DEFS;
  const worldIndex = (state, z) => { const c = state.config.setting; return ((Math.floor(z / c.lengthM) % c.count) + c.count) % c.count; };
  const worldAt = (state, z) => WORLDS[worldIndex(state, z) % WORLDS.length];
  const hash = (n) => { let x = (n * 2654435761) >>> 0; x ^= x >>> 15; x = Math.imul(x, 2246822519) >>> 0; return (x ^ (x >>> 13)) >>> 0; };

  function resize() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
  }

  const proj = (mz) => { const s = 1 / mz; return { y: HOR + (NEAR - HOR) * s, s }; };
  const laneX = (lane, s) => W / 2 + (lane - 1) * (HALF * 2 / 3) * s;
  const mzOf = (state, z) => RUNNER_MZ + (z - state.distance) / M_PER_UNIT;

  function setPalette(distance) {
    dusk = coast() ? 0 : ease(duskAmount(distance));
    const p = {};
    for (const k of Object.keys(DAY)) p[k] = mix(DAY[k], DUSK[k], dusk);
    palette = p;
    return dusk;
  }

  function backdrop(name, alpha) {
    const bd = art.img(name) || art.img('coast-backdrop'); if (!bd || alpha <= 0) return;
    // Painted backdrop (multiplane): horizon of the painting (55.6% down) sits on HOR; slow parallax with the lane.
    const k = HOR / (bd.naturalHeight * 0.556), w = bd.naturalWidth * k, h = bd.naturalHeight * k;
    ctx.globalAlpha = alpha; ctx.drawImage(bd, W / 2 - w / 2 - (fx.laneX - 1) * 10, 0, w, h); ctx.globalAlpha = 1;
  }
  function crossfade(state) {
    const L = state.config.setting.lengthM, into = ((state.distance % L) + L) % L;
    const cur = worldAt(state, state.distance), prev = worldAt(state, state.distance - into - 1);
    const t = state.distance < L ? 1 : clamp(into / CROSS_M, 0, 1);
    return { cur, prev, t };
  }
  // Storm-darkened sky: a slate-blue multiply over the sky and sea only (the road, runner and gems stay
  // bright and readable). Darker at the top, and a little darker with each storm step.
  function stormSky(state) {
    const step = Number.isFinite(state.chaserStep) ? state.chaserStep : 0;
    const bottom = HOR + 30;
    ctx.save(); ctx.globalCompositeOperation = 'multiply';
    const g = ctx.createLinearGradient(0, 0, 0, bottom);
    const top = 0.5 + step * 0.08, low = 0.25 + step * 0.06;
    g.addColorStop(0, `rgba(70,82,120,${top})`); g.addColorStop(1, `rgba(120,135,165,${low})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, bottom);
    ctx.restore();
  }
  function sky(state) {
    if (coast()) {
      const { cur, prev, t } = crossfade(state);
      if (t < 1) backdrop(prev.key + '-backdrop', 1);
      backdrop(cur.key + '-backdrop', t < 1 ? ease(t) : 1);
      stormSky(state);
      return;
    }
    const g = ctx.createLinearGradient(0, 0, 0, HOR + 20);
    g.addColorStop(0, palette.sky0); g.addColorStop(0.6, palette.sky1); g.addColorStop(1, palette.sky2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, HOR + 20);
    // Sun / moon.
    ctx.fillStyle = palette.moon; ctx.globalAlpha = 0.9;
    ctx.beginPath(); ctx.arc(W * (0.12 + 0.76 * dusk), HOR - 92, 20, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }

  function scenery(t) {
    if (coast()) return;
    // Dunes by day.
    if (dusk < 0.98) {
      ctx.globalAlpha = 1 - dusk;
      const off = (t * 0.002) % 1;
      ctx.fillStyle = '#f2cf95';
      ctx.beginPath(); ctx.moveTo(0, HOR);
      for (let x = 0; x <= W; x += 15) ctx.lineTo(x, HOR - 18 - 16 * Math.sin((x / W + off) * Math.PI * 3));
      ctx.lineTo(W, HOR); ctx.fill();
      ctx.fillStyle = '#e8bb7c';
      ctx.beginPath(); ctx.moveTo(0, HOR);
      for (let x = 0; x <= W; x += 15) ctx.lineTo(x, HOR - 8 - 10 * Math.sin((x / W - off * 1.5) * Math.PI * 4 + 1));
      ctx.lineTo(W, HOR); ctx.fill();
    }
    // City by dusk.
    if (dusk > 0.02) {
      ctx.globalAlpha = dusk;
      const xs = [0, 30, 52, 90, 120, 150, 190, 235, 262, 300, 330, 360, 385];
      xs.forEach((x, i) => {
        const h = 40 + ((i * 37) % 70), w = 22 + (i % 3) * 8;
        ctx.fillStyle = '#1a1236'; ctx.fillRect(x, HOR - h, w, h);
        for (let k = 0; k < 4; k += 1) {
          ctx.fillStyle = (i + k) % 3 ? 'rgba(255,179,107,.2)' : 'rgba(255,179,107,.85)';
          ctx.fillRect(x + 5 + (k % 2) * 9, HOR - h + 8 + k * 10, 3, 4);
        }
      });
    }
    ctx.globalAlpha = 1;
  }

  function road(state) {
    if (coast()) { rasterRoad(state); return; }
    // Ground + road bands aligned to world metres so they rush past.
    const farMz = 32;
    const startZ = Math.floor((state.distance + (farMz - RUNNER_MZ) * M_PER_UNIT) / BAND_M) * BAND_M;
    for (let z = startZ; ; z -= BAND_M) {
      let a = mzOf(state, z), b = mzOf(state, z - BAND_M);
      if (a <= 0.95) break;
      b = Math.max(b, 0.95);
      const pa = proj(a), pb = proj(b);
      const band = Math.floor(z / BAND_M) % 2 === 0;
      const ha = HALF * pa.s, hb = HALF * pb.s;
      ctx.fillStyle = band ? palette.ground0 : palette.ground1;
      quad(W / 2 - ha * 1.2, W / 2 + ha * 1.2, pa.y, W / 2 + hb * 1.2, W / 2 - hb * 1.2, pb.y);
      ctx.fillStyle = band ? palette.road0 : palette.road1;
      quad(W / 2 - ha, W / 2 + ha, pa.y, W / 2 + hb, W / 2 - hb, pb.y);
    }
    // Lane lines and glowing edges.
    const f = proj(farMz), n = proj(0.95);
    ctx.save();
    for (const k of [-1, -1 / 3, 1 / 3, 1]) {
      const edge = Math.abs(k) === 1;
      ctx.strokeStyle = edge ? palette.edge : palette.lane;
      ctx.lineWidth = edge ? 3 : 1.5;
      ctx.globalAlpha = edge ? 1 : 0.5;
      ctx.shadowColor = edge ? palette.edge : 'transparent'; ctx.shadowBlur = edge ? 10 * dusk + 2 : 0;
      ctx.setLineDash(edge ? [] : [14, 18]);
      ctx.lineDashOffset = edge ? 0 : -(state.distance * 9) % 32;
      ctx.beginPath(); ctx.moveTo(W / 2 + HALF * f.s * k, f.y); ctx.lineTo(W / 2 + HALF * n.s * k, n.y); ctx.stroke();
    }
    ctx.restore();
    // Horizon fog.
    const g = ctx.createLinearGradient(0, HOR - 40, 0, HOR + 36);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, palette.fog); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = 0.55; ctx.fillStyle = g; ctx.fillRect(0, HOR - 40, W, 76); ctx.globalAlpha = 1;
  }

  // OutRun-style raster road: one textured scanline per screen row, depth from a 1/z table.
  function rasterRoad(state) {
    const here = worldAt(state, state.distance);
    const beachY = HOR + 26;                  // the painting's sea / bay / snowfield shows down to here
    for (let y = Math.floor(HOR) + 1; y < H; y += 1) {
      const sc = (y - HOR) / (NEAR - HOR), mz = 1 / sc;
      const z = state.distance + (mz - RUNNER_MZ) * M_PER_UNIT;
      const hw = HALF * sc;
      const wd = worldAt(state, z);
      const tex = art.img(wd.key + '-road') || art.img('coast-road');
      if (y > beachY) {
        // Ground beside the road: far colour near the horizon, near colour toward the camera; soft bands only up close.
        const near = clamp((y - beachY) / 160, 0, 1), [a, b] = wd.ground;
        const band = sc > 0.25 && Math.floor(z / 5) % 2 === 0 ? 6 : 0;
        ctx.fillStyle = `rgb(${Math.round(a[0] + (b[0] - a[0]) * near - band)},${Math.round(a[1] + (b[1] - a[1]) * near - band)},${Math.round(a[2] + (b[2] - a[2]) * near - band)})`;
        ctx.fillRect(0, y, W, 1.6);
      }
      if (!tex) { ctx.fillStyle = Math.floor(z / 3) % 2 ? '#e8cf9f' : '#e2c794'; ctx.fillRect(W / 2 - hw * 1.04, y, hw * 2.08, 1.6); continue; }
      const tw = tex.naturalWidth, th = tex.naturalHeight, v = (((z * th / 18) % th) + th) % th;
      ctx.drawImage(tex, 0, Math.floor(v), tw, 1, W / 2 - hw * 1.04, y, hw * 2.08, 1.6);
    }
    // Foam line (coast only), then a haze over the far road (atmospheric perspective).
    ctx.save();
    if (here.foam) { ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillRect(0, beachY, W, 2); }
    const g = ctx.createLinearGradient(0, HOR, 0, HOR + 70);
    g.addColorStop(0, `rgba(${here.haze},.7)`); g.addColorStop(1, `rgba(${here.haze},0)`);
    ctx.fillStyle = g; ctx.fillRect(0, HOR, W, 70);
    // Side shading of the road surface, darker toward the curbs (fake ambient occlusion).
    ctx.restore();
    // Curbs and lane grooves.
    const f = proj(40), n = proj(0.95);
    ctx.save();
    for (const k of [-1.04, -1 / 3, 1 / 3, 1.04]) {
      const edge = Math.abs(k) > 1;
      ctx.strokeStyle = edge ? here.edge : here.groove;
      ctx.lineWidth = edge ? 4 : 2;
      ctx.shadowColor = edge ? here.glow : 'transparent'; ctx.shadowBlur = edge ? 8 : 0;
      ctx.beginPath(); ctx.moveTo(W / 2 + HALF * f.s * k, f.y); ctx.lineTo(W / 2 + HALF * n.s * k, n.y); ctx.stroke();
    }
    ctx.restore();
  }

  function prop(state, p, mz, wd, def, side, k) {
    const im = art.img(wd.key + '-' + def.name); if (!im) return;
    const span = def.off[1] - def.off[0];
    const off = (def.off[0] + span * ((hash(k + 7) % 100) / 100)) * side;
    const x = W / 2 + off * (HALF * 2 / 3) * p.s;
    const h = def.h * p.s * (0.85 + (hash(k + 3) % 30) / 100), w = h * im.naturalWidth / im.naturalHeight;
    const fade = clamp((40 - mz) / 8, 0, 1);
    ctx.save(); ctx.globalAlpha = fade;
    if (side < 0 && !def.noFlip) { ctx.translate(x, 0); ctx.scale(-1, 1); ctx.translate(-x, 0); }
    ctx.fillStyle = 'rgba(60,40,10,.22)';
    ctx.beginPath(); ctx.ellipse(x, p.y, w * 0.38, w * 0.08, 0, 0, Math.PI * 2); ctx.fill();
    ctx.drawImage(im, x - w / 2, p.y - h * 0.97, w, h);
    ctx.restore();
  }

  function quad(x1, x2, y1, x3, x4, y2) {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y1); ctx.lineTo(x3, y2); ctx.lineTo(x4, y2); ctx.closePath(); ctx.fill();
  }

  function gemPath(color, cx, cy, r) {
    ctx.beginPath();
    if (color === 'ember') { ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r * 0.8, cy); ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r * 0.8, cy); }
    else if (color === 'tide') ctx.arc(cx, cy, r * 0.82, 0, Math.PI * 2);
    else if (color === 'leaf') { ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r * 0.9, cy + r * 0.7); ctx.lineTo(cx - r * 0.9, cy + r * 0.7); }
    else if (color === 'plum') { for (let i = 0; i < 10; i += 1) { const a = -Math.PI / 2 + i * Math.PI / 5, k = i % 2 ? r * 0.45 : r; ctx[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * k, cy + Math.sin(a) * k); } }
    else { for (let i = 0; i < 6; i += 1) { const a = Math.PI / 6 + i * Math.PI / 3; ctx[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * r * 0.9, cy + Math.sin(a) * r * 0.9); } }
    ctx.closePath();
  }

  function gem(color, cx, cy, r, alpha = 1, glow = true) {
    const im = art.img('gem-' + color);
    if (im) {
      const d = r * 2.05, w = d * im.naturalWidth / Math.max(im.naturalWidth, im.naturalHeight), h = d * im.naturalHeight / Math.max(im.naturalWidth, im.naturalHeight);
      ctx.save(); ctx.globalAlpha = alpha;
      if (glow) { ctx.shadowColor = GEMS[color][1]; ctx.shadowBlur = r * 0.6; }
      ctx.drawImage(im, cx - w / 2, cy - h / 2, w, h);
      ctx.restore();
      return;
    }
    const [light, base, deep, edge] = GEMS[color];
    ctx.save(); ctx.globalAlpha = alpha;
    const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.05, cx, cy, r * 1.1);
    g.addColorStop(0, light); g.addColorStop(0.55, base); g.addColorStop(1, deep);
    if (glow) { ctx.shadowColor = base; ctx.shadowBlur = r * (0.5 + dusk * 0.8); }
    gemPath(color, cx, cy, r); ctx.fillStyle = g; ctx.fill();
    ctx.shadowBlur = 0; ctx.lineWidth = Math.max(1, r * 0.1); ctx.strokeStyle = dusk > 0.5 ? edge : deep; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    ctx.beginPath(); ctx.ellipse(cx - r * 0.25, cy - r * 0.3, r * 0.22, r * 0.12, -0.4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function items(state, t) {
    const list = state.items.map((it) => ({ it, mz: mzOf(state, it.z) })).filter((o) => o.mz > 1.0 && o.mz < 32);
    if (coast()) {
      const k0 = Math.floor((state.distance - 2) / PROP_M), k1 = Math.ceil((state.distance + 39 * M_PER_UNIT) / PROP_M);
      for (let k = k0; k <= k1; k += 1) {
        const mz = mzOf(state, k * PROP_M);
        if (mz > 0.6 && mz < 40) list.push({ it: { kind: 'prop', k }, mz });
      }
    }
    list.sort((a, b) => b.mz - a.mz);
    const runnerDrawn = { done: false };
    for (const { it, mz } of list) {
      if (!runnerDrawn.done && mz < RUNNER_MZ) { runner(state, t); runnerDrawn.done = true; }
      const p = proj(mz), x = laneX(it.lane, p.s);
      const fade = clamp((32 - mz) / 6, 0, 1);
      if (it.kind === 'prop') { const wd = worldAt(state, it.k * PROP_M); prop(state, p, mz, wd, wd.props[hash(it.k) % wd.props.length], it.k % 2 ? 1 : -1, it.k); continue; }
      const bar = it.kind === 'barrier' && (art.img(worldAt(state, it.z).key + '-barrier') || art.img('coast-barrier'));
      if (bar) {
        const w = (HALF * 2 / 3) * p.s * 1.1, h = w * bar.naturalHeight / bar.naturalWidth;
        ctx.save(); ctx.globalAlpha = fade;
        ctx.fillStyle = 'rgba(60,40,10,.3)'; ctx.beginPath(); ctx.ellipse(x, p.y, w * 0.48, w * 0.09, 0, 0, Math.PI * 2); ctx.fill();
        ctx.drawImage(bar, x - w / 2, p.y - h * 0.92, w, h); ctx.restore();
      } else if (it.kind === 'barrier') {
        const w = HALF * 0.55 * p.s, h = 100 * p.s;
        ctx.globalAlpha = fade; ctx.fillStyle = palette.barrier;
        roundRect(x - w, p.y - h, w * 2, h, 18 * p.s); ctx.fill();
        ctx.strokeStyle = palette.edge; ctx.lineWidth = 6 * p.s; ctx.stroke();
        // Hazard chevrons.
        ctx.strokeStyle = palette.edge; ctx.globalAlpha = fade * 0.7; ctx.lineWidth = 5 * p.s;
        for (let k = -1; k <= 1; k += 1) { ctx.beginPath(); ctx.moveTo(x + k * w * 0.5 - 12 * p.s, p.y - h * 0.7); ctx.lineTo(x + k * w * 0.5, p.y - h * 0.35); ctx.lineTo(x + k * w * 0.5 + 12 * p.s, p.y - h * 0.7); ctx.stroke(); }
        ctx.globalAlpha = 1;
      } else {
        // Diameter = 30% of the runner's on-screen height at the same depth; centre at the engine's float height.
        const r = 40 * p.s, floatPx = (state.config.gem?.floatM ?? 0.9) * 105 * 1.45 * p.s;
        const bob = Math.sin(t / 300 + it.id) * r * 0.12;
        ctx.globalAlpha = 0.22 * fade; ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.ellipse(x, p.y, r * 0.7, r * 0.2, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
        gem(it.color, x, p.y - floatPx + bob, r, fade, mz < 14);
      }
    }
    if (!runnerDrawn.done) runner(state, t);
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  const tintCache = new Map();
  function runnerFrame(name, color) {
    const im = art.img(name); if (!im) return null;
    const key = name + ':' + (color || '');
    if (!tintCache.has(key)) tintCache.set(key, tintScarf(im, color ? GEMS[color][1] : null));
    return tintCache.get(key);
  }

  function runner(state, t) {
    if (!art.img('run-0')) { vectorRunner(state, t); return; }
    const p = proj(RUNNER_MZ);
    const x = W / 2 + (fx.laneX - 1) * (HALF * 2 / 3) * p.s;
    const air = state.jumpMs !== null;
    const liftM = jumpHeight(state), lift = liftM * 105;
    const idle = state.timeMs === 0 && state.distance === 0;
    const ph = fx.runPhase * 8, fi = Math.floor(ph) % 8, frac = ph - Math.floor(ph);
    // One sprite family for every move, like the lane change: in the air the stride freezes on the
    // frame she left the ground with, and only position, lean and squash/stretch change.
    if (!air) fx.airFrame = fi;
    const name = idle ? 'idle' : `run-${air ? fx.airFrame : fi}`;
    const scale = idle ? 0.62 : 0.78;               // the idle pose was drawn larger on its sheet
    const tint = state.chain.count > 0 ? state.chain.color : null;
    const fr = runnerFrame(name, tint) || art.img(name);
    if (!fr) return;
    // Pose changes (run ↔ jump ↔ land ↔ stumble) crossfade over 90 ms instead of popping.
    const pose = name.startsWith('run-') ? 'run' : name;
    if (pose !== fx.pose) { fx.prevPose = fx.lastDrawn; fx.poseT = 1; fx.pose = pose; }
    fx.lastDrawn = { name, scale };
    // Squash and stretch: stretch on take-off, squash on landing.
    let sx = 1, sy = 1;
    if (fx.takeT > 0) { sy = 1 + fx.takeT * 0.12; sx = 1 - fx.takeT * 0.08; }
    if (fx.landT > 0) { sy = 1 - fx.landT * 0.14; sx = 1 + fx.landT * 0.1; }
    // Rising: a slight lean back; falling: lean forward. Stumble: a quick wobble on the run frame.
    const bob = air || idle ? 0 : Math.abs(Math.sin(fx.runPhase * Math.PI * 2)) * -4;
    const vy = air ? liftM - (fx.prevLift ?? liftM) : 0; fx.prevLift = liftM;
    const lean = (fx.laneX - Math.round(fx.laneX)) * -0.35 + (state.stumbleMs > 0 ? Math.sin(t / 45) * 0.12 : 0) + clamp(-vy * 2.2, -0.12, 0.12);
    // Contact shadow: shrinks and fades with height.
    const sh = clamp(1 - liftM / 2.2, 0.35, 1);
    ctx.fillStyle = `rgba(70,45,15,${0.32 * sh})`;
    ctx.beginPath(); ctx.ellipse(x, p.y + 2, 44 * sh, 11 * sh, 0, 0, Math.PI * 2); ctx.fill();
    const w = fr.width * scale, h = fr.height * scale;
    const footY = p.y - lift + bob;
    // Chain glow: a soft light of the chain colour behind her (only while a chain is live).
    if (tint) {
      const gl = ctx.createRadialGradient(x, footY - h * 0.55, 4, x, footY - h * 0.55, h * 0.6);
      gl.addColorStop(0, GEMS[tint][3] + '66'); gl.addColorStop(1, GEMS[tint][3] + '00');
      ctx.fillStyle = gl; ctx.fillRect(x - h * 0.6, footY - h * 1.15, h * 1.2, h * 1.2);
    }
    // Lane-switch motion trail: two fading ghosts back toward where she came from.
    const slide = state.lane - fx.laneX;
    const liftStep = air ? vy * 105 * 6 : 0;        // where she was a few frames ago, vertically
    if (Math.abs(slide) > 0.04 || Math.abs(liftStep) > 2) {
      const step = slide * (HALF * 2 / 3) * p.s;
      for (const [k, a] of [[0.55, 0.22], [1.1, 0.1]]) {
        ctx.save(); ctx.globalAlpha = a; ctx.translate(x - step * k, footY + liftStep * k); ctx.rotate(lean); ctx.scale(sx, sy);
        ctx.drawImage(fr, -w / 2, -h, w, h); ctx.restore();
      }
    }
    ctx.save();
    ctx.translate(x, footY); ctx.rotate(lean); ctx.scale(sx, sy);
    // Outgoing pose fades out underneath the new one.
    if (fx.poseT > 0 && fx.prevPose) {
      const pf = runnerFrame(fx.prevPose.name, tint) || art.img(fx.prevPose.name);
      if (pf) { ctx.globalAlpha = fx.poseT; ctx.drawImage(pf, -pf.width * fx.prevPose.scale / 2, -pf.height * fx.prevPose.scale, pf.width * fx.prevPose.scale, pf.height * fx.prevPose.scale); }
    }
    ctx.globalAlpha = fx.poseT > 0 ? 1 - fx.poseT * 0.5 : 1;
    ctx.drawImage(fr, -w / 2, -h, w, h);
    // In-between frame: blend the next run frame in by the phase fraction (8 drawn frames read as ~16).
    if (name.startsWith('run-') && frac > 0.15) {
      const nf = runnerFrame(`run-${(fi + 1) % 8}`, tint);
      if (nf) { ctx.globalAlpha = frac * 0.55; ctx.drawImage(nf, -nf.width * scale / 2, -nf.height * scale, nf.width * scale, nf.height * scale); }
    }
    ctx.restore();
    // Footfall dust: a small sand puff each time a foot lands (frames 0 and 4 of the cycle).
    if (name.startsWith('run-') && fi % 4 === 0 && fx.lastFoot !== fi && state.stumbleMs === 0) {
      fx.lastFoot = fi;
      for (let i = 0; i < 3; i += 1) fx.dust.push({ x: x + (i - 1) * 8 + (fi === 0 ? -8 : 8), y: p.y, vx: (i - 1) * 20, vy: -18 - i * 6, life: 0.35 });
    }
    if (!name.startsWith('run-')) fx.lastFoot = -1;
  }

  function drawDust(dt) {
    for (const d of fx.dust) {
      d.x += d.vx * dt; d.y += d.vy * dt; d.life -= dt;
      const k = clamp(d.life / 0.35, 0, 1);
      ctx.fillStyle = `rgba(236,214,170,${0.55 * k})`;
      ctx.beginPath(); ctx.arc(d.x, d.y, 7 + (1 - k) * 8, 0, Math.PI * 2); ctx.fill();
    }
    fx.dust = fx.dust.filter((d) => d.life > 0);
  }

  function vectorRunner(state, t) {
    const p = proj(RUNNER_MZ);
    const x = W / 2 + (fx.laneX - 1) * (HALF * 2 / 3) * p.s;
    const lift = jumpHeight(state) * 46;
    const stride = state.over ? 0 : Math.sin(state.distance * 1.6);
    const y = p.y - lift + (state.jumpMs === null ? Math.abs(stride) * -3 : 0);
    const tilt = (fx.laneX - Math.round(fx.laneX)) * -0.5 + (state.stumbleMs > 0 ? Math.sin(t / 40) * 0.12 : 0);
    // Shadow stays on the road.
    ctx.fillStyle = 'rgba(0,0,0,.33)';
    ctx.beginPath(); ctx.ellipse(x, p.y + 4, 26 - lift * 0.1, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.translate(x, y); ctx.rotate(tilt);
    if (dusk > 0.4) { ctx.shadowColor = palette.accent; ctx.shadowBlur = 12 * dusk; }
    ctx.lineCap = 'round';
    // Legs.
    ctx.strokeStyle = palette.runner; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(-6, -8); ctx.lineTo(-7 + stride * 4, 2 - Math.max(0, stride) * 6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(6, -8); ctx.lineTo(7 - stride * 4, 2 - Math.max(0, -stride) * 6); ctx.stroke();
    // Shoes.
    ctx.fillStyle = palette.accent;
    ctx.fillRect(-11 + stride * 4, -2 - Math.max(0, stride) * 6, 8, 6); ctx.fillRect(3 - stride * 4, -2 - Math.max(0, -stride) * 6, 8, 6);
    // Body.
    ctx.fillStyle = palette.runner;
    ctx.beginPath(); ctx.moveTo(-14, -8); ctx.lineTo(-8, -46); ctx.lineTo(8, -46); ctx.lineTo(14, -8); ctx.closePath(); ctx.fill();
    // Arms swing.
    ctx.strokeStyle = palette.runner; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(-8, -42); ctx.lineTo(-22, -30 + stride * 10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(8, -42); ctx.lineTo(22, -30 - stride * 10); ctx.stroke();
    // Head + headband.
    ctx.beginPath(); ctx.arc(0, -58, 12, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = palette.accent; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(-12, -61); ctx.lineTo(12, -61); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(11, -61); ctx.quadraticCurveTo(22, -60 - stride * 3, 30, -52); ctx.stroke();
    ctx.restore();
  }

  function storm(state, t) {
    const share = stormShare(state);
    // Off-screen at full gap; rises into view as the storm closes in.
    const near = clamp((1 - share) / 0.85, 0, 1);
    const h = -100 + ease(near) * 245 + fx.surge * 30 * near;
    if (h <= -90) return;
    const top = H - h;
    const cloud = art.img('storm');
    if (cloud) {
      // Painted storm bank: two copies drifting against each other for a churning edge; a flash brightens it on lightning.
      const w = W * 1.5, ch = w * cloud.naturalHeight / cloud.naturalWidth;
      const y0 = top - ch * 0.32;
      ctx.drawImage(cloud, -W * 0.25 + Math.sin(t / 900) * 18, y0 + 14, w, ch);
      ctx.save(); ctx.scale(-1, 1);
      ctx.drawImage(cloud, -W * 1.25 + Math.sin(t / 700 + 1) * 22, y0, w, ch);
      ctx.restore();
      if (y0 + ch < H) { ctx.fillStyle = '#1c1f4a'; ctx.fillRect(0, y0 + ch - 2, W, H - (y0 + ch) + 2); }
      if (fx.bolt > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (fx.bolt / 120) * 0.35; ctx.drawImage(cloud, -W * 0.25, y0 + 14, w, ch); ctx.restore(); }
      if (fx.bolt <= 0 && Math.random() < 0.004 + (1 - share) * 0.03) fx.bolt = 120;
      return;
    }
    const g = ctx.createLinearGradient(0, top - 70, 0, H);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.45, palette.storm); g.addColorStop(1, palette.storm);
    ctx.globalAlpha = 0.92; ctx.fillStyle = g; ctx.fillRect(0, top - 70, W, h + 70); ctx.globalAlpha = 1;
    for (let i = 0; i < 9; i += 1) {
      const cx = (i / 8) * W + Math.sin(t / 700 + i) * 10, cy = top + 14 + (i % 3) * 12 + Math.sin(t / 500 + i * 2) * 6, r = 38 + (i % 4) * 9;
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      cg.addColorStop(0, palette.cloud); cg.addColorStop(0.7, palette.cloud); cg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    }
    // Lightning, more often when close.
    if (fx.bolt <= 0 && Math.random() < 0.004 + (1 - share) * 0.03) fx.bolt = 120;
    if (fx.bolt > 0) {
      ctx.save(); ctx.strokeStyle = palette.bolt; ctx.lineWidth = 3; ctx.shadowColor = palette.bolt; ctx.shadowBlur = 12; ctx.globalAlpha = fx.bolt / 120;
      const bx = W * (0.2 + ((Math.floor(t / 900) * 0.37) % 0.6));
      ctx.beginPath(); ctx.moveTo(bx, top + 10); ctx.lineTo(bx + 14, top + 36); ctx.lineTo(bx + 4, top + 40); ctx.lineTo(bx + 22, top + 72); ctx.stroke();
      ctx.restore();
    }
  }

  function hud(state, best, t) {
    const c = state.config;
    // Score / best.
    ctx.fillStyle = palette.ink; ctx.font = '700 30px Unbounded, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(state.score.toLocaleString('en'), 22, 46);
    ctx.fillStyle = palette.muted; ctx.textAlign = 'right';
    ctx.font = '700 12px "Space Grotesk", sans-serif'; ctx.fillText('BEST', W - 22, 34);
    ctx.font = '700 16px Unbounded, sans-serif'; ctx.fillText(Math.max(best, state.score).toLocaleString('en'), W - 22, 54);
    // Chain bar.
    const sw = 34, gap = 8, total = sw * 6 + gap * 5, x0 = W / 2 - total / 2, y = 76;
    ctx.globalAlpha = 0.8 - dusk * 0.08; ctx.fillStyle = palette.panel;
    roundRect(x0 - 12, y - 12, total + 24, sw + 24, (sw + 24) / 2); ctx.fill(); ctx.globalAlpha = 1;
    const { color, count } = state.chain;
    const drain = fx.drain;
    for (let i = 0; i < 6; i += 1) {
      const cx = x0 + i * (sw + gap) + sw / 2, cy = y + sw / 2;
      const filled = i < count;
      if (filled) {
        const pop = fx.slotPop[i];
        gem(color, cx, cy, sw * 0.45 * (1 + pop * 0.35), 1, true);
      } else if (drain && i < drain.count) {
        const k = drain.t / 400;
        gem(drain.color, cx + Math.sin(t / 25 + i) * 4 * k, cy + (1 - k) * 18, sw * 0.42, k, false);
      } else {
        ctx.globalAlpha = 0.16; ctx.fillStyle = palette.slot; ctx.beginPath(); ctx.arc(cx, cy, sw * 0.2, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
      }
      if (i >= c.chain.minScore - 1) {
        ctx.globalAlpha = filled ? 1 : 0.5; ctx.fillStyle = filled ? GEMS[color][1] : palette.muted;
        ctx.beginPath(); ctx.arc(cx, y + sw + 20, 2.5, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
      }
    }
    if (count >= c.chain.minScore) {
      ctx.save(); ctx.font = '700 22px Unbounded, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = GEMS[color][1];
      ctx.shadowColor = GEMS[color][1]; ctx.shadowBlur = 10;
      ctx.fillText(`×${count - c.chain.minScore + 1}`, W / 2, y + sw + 52); ctx.restore();
    }
    // Storm steps: three cloud pips at the bottom; each mistake darkens one (3 = caught).
    const steps = c.chaser.steps || 3;
    const taken = Number.isFinite(state.chaserStep) ? state.chaserStep : Math.round((1 - stormShare(state)) * steps);
    for (let i = 0; i < steps; i += 1) {
      const cx = W / 2 + (i - (steps - 1) / 2) * 46, cy = H - 34, on = i < taken;
      const pop = on && i === taken - 1 ? fx.surge * 0.3 : 0;
      ctx.save(); ctx.translate(cx, cy); ctx.scale(1 + pop, 1 + pop);
      ctx.globalAlpha = on ? 1 : 0.35;
      ctx.fillStyle = on ? '#2a3566' : '#ffffff';
      ctx.beginPath(); ctx.arc(-8, 2, 9, 0, Math.PI * 2); ctx.arc(2, -4, 11, 0, Math.PI * 2); ctx.arc(11, 3, 8, 0, Math.PI * 2); ctx.fill();
      if (on) { ctx.strokeStyle = '#bfe3e6'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(2, 0); ctx.lineTo(-2, 8); ctx.lineTo(3, 8); ctx.lineTo(-1, 16); ctx.stroke(); }
      ctx.restore();
    }
  }

  function effects(dt) {
    for (const p of fx.particles) {
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 600 * dt; p.life -= dt; p.rot += p.vr * dt;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      gem(p.color, 0, 0, p.r, clamp(p.life / p.max, 0, 1), false); ctx.restore();
    }
    fx.particles = fx.particles.filter((p) => p.life > 0);
    for (const f of fx.floats) {
      f.y -= 40 * dt; f.life -= dt;
      ctx.save(); ctx.globalAlpha = clamp(f.life / 0.4, 0, 1); ctx.font = `700 ${f.size}px Unbounded, sans-serif`; ctx.textAlign = 'center';
      ctx.fillStyle = f.color; ctx.shadowColor = f.color; ctx.shadowBlur = 12; ctx.fillText(f.text, f.x, f.y); ctx.restore();
    }
    fx.floats = fx.floats.filter((f) => f.life > 0);
    for (const r of fx.rings || []) {
      r.t -= dt; const k = 1 - r.t / 0.35;
      ctx.save(); ctx.globalAlpha = clamp(r.t / 0.35, 0, 1); ctx.strokeStyle = r.color; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.ellipse(r.x, r.y, 20 + k * 50, 6 + k * 14, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    }
    fx.rings = (fx.rings || []).filter((r) => r.t > 0);
    if (fx.newColor) {
      const n = fx.newColor; n.t -= dt;
      const k = clamp(n.t / 0.4, 0, 1), pop = 1 + Math.max(0, n.t - 1.3) * 1.5;
      gem(n.color, W / 2, 260, 30 * pop, k, true);
      ctx.save(); ctx.globalAlpha = k; ctx.font = '700 16px Unbounded, sans-serif'; ctx.textAlign = 'center';
      ctx.fillStyle = GEMS[n.color][1]; ctx.fillText('NEW', W / 2, 315); ctx.restore();
      if (n.t <= 0) fx.newColor = null;
    }
    if (fx.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${fx.flash})`; ctx.fillRect(0, 0, W, H); fx.flash = Math.max(0, fx.flash - dt * 2.5); }
  }

  // Tutorial hints: graphics first — a bouncing arrow over the lane to take, a keycap for the key to press.
  function keycap(x, y, label, wide = false) {
    const w = wide ? 92 : 40, h = 36;
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.shadowColor = 'rgba(40,60,90,.35)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
    roundRect(x - w / 2, y - h / 2, w, h, 9); ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.strokeStyle = '#c9d3de'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#2b2a3a'; ctx.font = `700 ${wide ? 14 : 18}px "Space Grotesk", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y + 1); ctx.restore();
  }
  function hints(state, t) {
    const tu = state.tutorial;
    if (!tu || tu.done) return;
    const pulse = 0.5 + 0.5 * Math.sin(t / 180);
    if ((tu.step === 'lanes' || tu.step === 'chain') && tu.targetLane !== null && tu.targetLane !== undefined) {
      const p = proj(3.2), x = laneX(tu.targetLane, p.s), y = p.y - 95 - pulse * 12;
      ctx.save(); ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#2fb6ff'; ctx.lineWidth = 4; ctx.shadowColor = 'rgba(47,182,255,.8)'; ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.moveTo(x, y + 26); ctx.lineTo(x - 22, y); ctx.lineTo(x - 9, y); ctx.lineTo(x - 9, y - 24); ctx.lineTo(x + 9, y - 24); ctx.lineTo(x + 9, y); ctx.lineTo(x + 22, y); ctx.closePath();
      ctx.fill(); ctx.stroke(); ctx.restore();
      const dir = tu.targetLane < state.lane ? '←' : tu.targetLane > state.lane ? '→' : null;
      if (dir) keycap(W / 2 + (dir === '←' ? -60 : 60), H - 120, dir);
      if (tu.step === 'chain') pill(W / 2, 168, 'MATCH 3');
    } else if (tu.step === 'jump') {
      keycap(W / 2, H - 120 - pulse * 6, 'SPACE', true);
      pill(W / 2, 168, 'JUMP');
    } else if (tu.step === 'storm') {
      pill(W / 2, 168, "DON'T GET CAUGHT");
    }
  }
  function pill(x, y, text) {
    ctx.save(); ctx.font = '700 14px "Space Grotesk", sans-serif'; const w = ctx.measureText(text).width + 32;
    ctx.fillStyle = 'rgba(255,250,240,.92)'; roundRect(x - w / 2, y - 15, w, 30, 15); ctx.fill();
    ctx.fillStyle = '#2b2a3a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y + 1); ctx.restore();
  }

  // Time-of-day grade: a multiply wash per world so noon-lit sprites sit in dusk and night scenes.
  function grade(state) {
    if (!coast()) return;
    const { cur, prev, t } = crossfade(state);
    for (const [wd, a] of [[prev, 1 - t], [cur, t]]) {
      if (!wd.grade || a <= 0) continue;
      ctx.save(); ctx.globalAlpha = a; ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = wd.grade; ctx.fillRect(0, 0, W, H); ctx.restore();
    }
  }

  // Slipstream: air streaks rushing out of the vanishing point past the runner. Speed, length and
  // density grow with distance, so the run visibly accelerates. Deterministic per streak (no allocation).
  function slipstream(state, t) {
    if (state.timeMs === 0 && state.distance === 0) return;
    const k = clamp(state.distance / 2500, 0, 1);          // 0 at the start → 1 by 2.5 km
    const n = Math.round(10 + 30 * k), rate = 0.55 + 2.4 * k;
    const cx = W / 2, cy = HOR + 6;
    ctx.save(); ctx.lineCap = 'round';
    for (let i = 0; i < n; i += 1) {
      const h1 = hash(i * 7 + 1), h2 = hash(i * 13 + 5);
      // Fan of angles across the lower half and the sides (not straight up into the sky).
      const a = -0.25 + ((h1 % 1000) / 1000) * (Math.PI + 0.5);
      const phase = ((t / 1000) * rate * (0.7 + (h2 % 100) / 160) + (h2 % 1000) / 1000) % 1;
      const p2 = phase * phase;
      const r1 = 30 + p2 * 560, len = (18 + 140 * phase) * (0.45 + 0.75 * k);
      const ca = Math.cos(a), sa = Math.sin(a) * 0.82;
      const x1 = cx + ca * r1, y1 = cy + sa * r1, x2 = cx + ca * (r1 + len), y2 = cy + sa * (r1 + len);
      ctx.globalAlpha = phase * (0.22 + 0.45 * k);
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 0.8 + 2.6 * phase;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
    ctx.restore();
  }

  // Light rain: thin slanted streaks plus small splash rings on the road. A drizzle from the start,
  // a little heavier with each storm step. Deterministic per drop, no allocation.
  function rain(state, t) {
    if (state.timeMs === 0 && state.distance === 0) return;
    const step = Number.isFinite(state.chaserStep) ? state.chaserStep : 0;
    const n = 18 + step * 14, fall = 900 + step * 150;       // drops, px per second
    ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = '#eaf6ff';
    for (let i = 0; i < n; i += 1) {
      const h1 = hash(i * 31 + 3), h2 = hash(i * 17 + 11);
      const x0 = (h1 % 1000) / 1000 * (W + 120) - 60;
      const y = (((t / 1000) * fall * (0.8 + (h2 % 40) / 100) + (h2 % 1000)) % (H + 80)) - 40;
      const x = x0 - y * 0.22;                                 // wind slant
      ctx.globalAlpha = 0.18 + 0.06 * step; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 5, y + 22); ctx.stroke();
    }
    // Splashes: short-lived rings on the road surface.
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1;
    for (let i = 0; i < 6 + step * 4; i += 1) {
      const h = hash(i * 53 + 7), cycle = 0.6 + (h % 30) / 100;
      const ph = ((t / 1000) / cycle + (h % 100) / 100) % 1;
      const round = Math.floor((t / 1000) / cycle + (h % 100) / 100);
      const hr = hash(h + round * 977);
      const sc = 0.2 + ((hr % 1000) / 1000) * 0.75, y = HOR + sc * (NEAR - HOR);
      const x = W / 2 + ((((hr >> 10) % 1000) / 1000) * 2 - 1) * HALF * sc;
      ctx.globalAlpha = (1 - ph) * 0.5;
      ctx.beginPath(); ctx.ellipse(x, y, 2 + ph * 9 * sc * 2, 1 + ph * 3 * sc * 2, 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }

  // Lightning: the storm throws bolts. Rare and far away (on the horizon) while it is out of sight,
  // more often and closer to the road as it closes in. Bolt shapes are made once per strike.
  function lightning(state, t, dt) {
    const step = Number.isFinite(state.chaserStep) ? state.chaserStep : 0;
    const live = !(state.timeMs === 0 && state.distance === 0) && !state.over && !(state.tutorial && !state.tutorial.done);
    if (live) {
      fx.nextStrike = (fx.nextStrike ?? 2500) - dt * 1000;
      if (fx.nextStrike <= 0) {
        const lo = [4200, 2200, 1100][Math.min(step, 2)], span = [3800, 2200, 1100][Math.min(step, 2)];
        fx.nextStrike = lo + Math.random() * span;
        const side = Math.random() < 0.5 ? -1 : 1;
        const near = step === 0 ? 0.05 + Math.random() * 0.15 : 0.25 + step * 0.22 + Math.random() * 0.15;
        const ty = HOR + 8 + near * (NEAR - HOR) * 0.55;
        const tx = W / 2 + side * (0.62 + Math.random() * 0.5) * (HALF * ((ty - HOR) / (NEAR - HOR)) + 70);
        const pts = []; let x = tx + side * -40 + (Math.random() - 0.5) * 80, y = -10;
        const segs = 9;
        for (let i = 0; i <= segs; i += 1) {
          const f = i / segs;
          pts.push([x + (tx - x) * f * f + (i && i < segs ? (Math.random() - 0.5) * 34 : 0), y + (ty - y) * f]);
        }
        const branches = [3, 5].map((bi) => {
          const [bx, by] = pts[bi], dir = Math.random() < 0.5 ? -1 : 1, b = [[bx, by]];
          for (let j = 1; j <= 3; j += 1) b.push([bx + dir * j * 14 + (Math.random() - 0.5) * 10, by + j * 22]);
          return b;
        });
        fx.strikes.push({ pts, branches, life: 0.28, max: 0.28, near });
        fx.flash = Math.max(fx.flash, 0.12 + near * 0.25);
        fx.bolt = 120;                                         // the storm bank flashes too
        if (onStrike) onStrike(near);
      }
    }
    for (const st of fx.strikes) {
      st.life -= dt;
      const k = clamp(st.life / st.max, 0, 1), flick = k > 0.6 || (k > 0.25 && k < 0.45) ? 1 : 0.35;
      const path = (pts) => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); };
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.globalAlpha = k * flick;
      ctx.strokeStyle = 'rgba(150,215,255,.9)'; ctx.lineWidth = 7 + st.near * 6; ctx.shadowColor = '#9fdcff'; ctx.shadowBlur = 22;
      path(st.pts); st.branches.forEach(path);
      ctx.shadowBlur = 0; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2 + st.near * 2;
      path(st.pts); ctx.lineWidth = 1.2; st.branches.forEach(path);
      // Impact glow on the ground.
      const [ix, iy] = st.pts[st.pts.length - 1];
      const g = ctx.createRadialGradient(ix, iy, 0, ix, iy, 40 + st.near * 50);
      g.addColorStop(0, 'rgba(200,235,255,.9)'); g.addColorStop(1, 'rgba(200,235,255,0)');
      ctx.fillStyle = g; ctx.fillRect(ix - 100, iy - 100, 200, 200);
      ctx.restore();
    }
    fx.strikes = fx.strikes.filter((st) => st.life > 0);
  }

  return {
    /** Called with 0..1 (how close) on each lightning strike, for thunder. */
    set onStrike(fn) { onStrike = fn; },
    resize,
    setPalette,
    /** React to engine events with effects. */
    onEvents(state, events) {
      for (const e of events) {
        if (e.type === 'collect') {
          fx.slotPop[e.count - 1] = 1;
          fx.drain = null;
        } else if (e.type === 'match') {
          const n = e.count;
          const x0 = W / 2 - (34 * 6 + 40) / 2;
          for (let i = 0; i < n * (e.max ? 4 : 2); i += 1) {
            const sx = x0 + (i % n) * 42 + 17;
            fx.particles.push({ x: sx, y: 93, vx: (Math.random() - 0.5) * (e.max ? 520 : 260), vy: -Math.random() * (e.max ? 420 : 220), r: 7 + Math.random() * 6, color: e.color, life: 0.9, max: 0.9, rot: 0, vr: (Math.random() - 0.5) * 8 });
          }
          fx.floats.push({ text: `+${e.points}${e.multiplier > 1 ? ` ×${e.multiplier}` : ''}`, x: W / 2, y: 190, size: e.max ? 30 : 22, color: GEMS[e.color][1], life: 1.1 });
          if (e.max) { fx.flash = 0.7; fx.floats.push({ text: 'BURST!', x: W / 2, y: 240, size: 36, color: palette.ink, life: 1.2 }); }
        } else if (e.type === 'break') {
          fx.drain = { color: e.color, count: e.count, t: 400 };
          fx.surge = 1;
        } else if (e.type === 'stumble') {
          fx.shake = e.cause === 'hit' ? 14 : 6; fx.surge = 1;
        } else if (e.type === 'skip') {
          // Hopped over a gem: a quick ring under the runner and a few sparks of its colour, low and short.
          const p = proj(RUNNER_MZ), x = W / 2 + (fx.laneX - 1) * (HALF * 2 / 3) * p.s;
          fx.rings = (fx.rings || []).concat([{ x, y: p.y - 30, color: GEMS[e.color][1], t: 0.35 }]);
          for (let i = 0; i < 5; i += 1) fx.particles.push({ x, y: p.y - 30, vx: (i - 2) * 70, vy: -60 - Math.random() * 60, r: 5, color: e.color, life: 0.4, max: 0.4, rot: 0, vr: 6 });
        } else if (e.type === 'colors') {
          for (let i = 0; i < 18; i += 1) {
            const a = (i / 18) * Math.PI * 2;
            fx.particles.push({ x: W / 2, y: 260, vx: Math.cos(a) * 240, vy: Math.sin(a) * 240 - 120, r: 8, color: e.color, life: 1.1, max: 1.1, rot: 0, vr: 4 });
          }
          fx.newColor = { color: e.color, t: 1.6 };
        } else if (e.type === 'caught') {
          fx.shake = 18; fx.flash = 0.35;
        }
      }
    },
    draw(state, best, t, dt, showHud = true) {
      const w = canvas.width, h = canvas.height;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, w, h);
      // Fit the 405×720 design into the canvas, cover-style.
      const scale = Math.max(w / W, h / H);
      ctx.setTransform(scale, 0, 0, scale, (w - W * scale) / 2, (h - H * scale) / 2);
      // Animate lane and decays.
      fx.laneX += (state.lane - fx.laneX) * Math.min(1, dt * 16);
      // Run cycle: cadence rises with speed (~1.5 → 2.6 strides per second).
      const sp = state.config.speed, speedNow = Math.min(sp.max, sp.base + sp.accelPerSec * state.timeMs / 1000);
      if (state.stumbleMs === 0) fx.runPhase += dt * (1.1 + speedNow / 26);
      const airNow = state.jumpMs !== null;
      if (airNow && !fx.wasAir) fx.takeT = 1;
      if (!airNow && fx.wasAir) fx.landT = 1;
      fx.wasAir = airNow;
      fx.takeT = Math.max(0, fx.takeT - dt * 12); fx.landT = Math.max(0, fx.landT - dt * 12);
      fx.poseT = Math.max(0, fx.poseT - dt / 0.09);
      fx.slotPop = fx.slotPop.map((v) => Math.max(0, v - dt * 5));
      if (fx.drain) { fx.drain.t -= dt * 1000; if (fx.drain.t <= 0) fx.drain = null; }
      fx.surge = Math.max(0, fx.surge - dt * 1.5);
      fx.bolt = Math.max(0, fx.bolt - dt * 1000);
      if (fx.shake > 0) { ctx.translate((Math.random() - 0.5) * fx.shake, (Math.random() - 0.5) * fx.shake); fx.shake = Math.max(0, fx.shake - dt * 40); }
      sky(state); scenery(state.distance); road(state); lightning(state, t, dt); drawDust(dt); items(state, t); slipstream(state, t); rain(state, t); storm(state, t); grade(state); if (showHud) { hud(state, best, t); hints(state, t); } effects(dt);
    },
  };
}
