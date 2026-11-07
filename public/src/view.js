// Canvas renderer: pseudo-3D road, gems, runner, storm, HUD and effects.
// Reads engine state; never changes it. Randomness here is visual only.
import { jumpHeight } from './engine.js';

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

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => { const x = hex(a), y = hex(b); return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(',')})`; };
const ease = (t) => t * t * (3 - 2 * t);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/** Day → dusk → day over 3,600 m; dusk is reached at 1,800 m. */
export function duskAmount(distance) {
  return (1 - Math.cos((2 * Math.PI * distance) / 3600)) / 2;
}

export function createView(canvas) {
  const ctx = canvas.getContext('2d');
  let dpr = 1;
  const fx = { particles: [], floats: [], flash: 0, shake: 0, laneX: 1, slotPop: [0, 0, 0, 0, 0, 0], drain: null, surge: 0, bolt: 0 };
  let palette = DAY, dusk = 0;

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
    dusk = ease(duskAmount(distance));
    const p = {};
    for (const k of Object.keys(DAY)) p[k] = mix(DAY[k], DUSK[k], dusk);
    palette = p;
    return dusk;
  }

  function sky() {
    const g = ctx.createLinearGradient(0, 0, 0, HOR + 20);
    g.addColorStop(0, palette.sky0); g.addColorStop(0.6, palette.sky1); g.addColorStop(1, palette.sky2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, HOR + 20);
    // Sun / moon.
    ctx.fillStyle = palette.moon; ctx.globalAlpha = 0.9;
    ctx.beginPath(); ctx.arc(W * (0.12 + 0.76 * dusk), HOR - 92, 20, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }

  function scenery(t) {
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
    const list = state.items.map((it) => ({ it, mz: mzOf(state, it.z) })).filter((o) => o.mz > 1.0 && o.mz < 32).sort((a, b) => b.mz - a.mz);
    const runnerDrawn = { done: false };
    for (const { it, mz } of list) {
      if (!runnerDrawn.done && mz < RUNNER_MZ) { runner(state, t); runnerDrawn.done = true; }
      const p = proj(mz), x = laneX(it.lane, p.s);
      const fade = clamp((32 - mz) / 6, 0, 1);
      if (it.kind === 'barrier') {
        const w = HALF * 0.55 * p.s, h = 100 * p.s;
        ctx.globalAlpha = fade; ctx.fillStyle = palette.barrier;
        roundRect(x - w, p.y - h, w * 2, h, 18 * p.s); ctx.fill();
        ctx.strokeStyle = palette.edge; ctx.lineWidth = 6 * p.s; ctx.stroke();
        // Hazard chevrons.
        ctx.strokeStyle = palette.edge; ctx.globalAlpha = fade * 0.7; ctx.lineWidth = 5 * p.s;
        for (let k = -1; k <= 1; k += 1) { ctx.beginPath(); ctx.moveTo(x + k * w * 0.5 - 12 * p.s, p.y - h * 0.7); ctx.lineTo(x + k * w * 0.5, p.y - h * 0.35); ctx.lineTo(x + k * w * 0.5 + 12 * p.s, p.y - h * 0.7); ctx.stroke(); }
        ctx.globalAlpha = 1;
      } else {
        const r = 72 * p.s;
        const bob = Math.sin(t / 300 + it.id) * r * 0.12;
        ctx.globalAlpha = 0.25 * fade; ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.ellipse(x, p.y, r * 0.8, r * 0.22, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
        gem(it.color, x, p.y - r * 1.4 + bob, r, fade, mz < 14);
      }
    }
    if (!runnerDrawn.done) runner(state, t);
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  function runner(state, t) {
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
    const share = clamp(state.gap / state.config.chaser.maxGapM, 0, 1);
    // Off-screen at full gap; rises into view as the storm closes in.
    const near = clamp((1 - share) / 0.85, 0, 1);
    const h = -100 + ease(near) * 245 + fx.surge * 30 * near;
    if (h <= -90) return;
    const top = H - h;
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
    // Gap meter.
    const share = clamp(state.gap / c.chaser.maxGapM, 0, 1);
    const mx = 40, mw = W - 80, my = H - 34;
    ctx.globalAlpha = 0.2; ctx.fillStyle = palette.ink; roundRect(mx, my, mw, 8, 4); ctx.fill(); ctx.globalAlpha = 1;
    ctx.save(); ctx.fillStyle = share < 0.25 ? '#ff4d5e' : palette.edge; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 8;
    roundRect(mx, my, Math.max(8, mw * share), 8, 4); ctx.fill(); ctx.restore();
    ctx.fillStyle = palette.cloud; ctx.strokeStyle = palette.bolt; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(mx, my + 4, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = palette.ink; ctx.beginPath(); ctx.arc(mx + mw * share, my + 4, 7, 0, Math.PI * 2); ctx.fill();
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

  function speedLines(state) {
    const sp = state.config.speed;
    const k = clamp((state.distance > 0 ? (sp.base + sp.accelPerSec * state.timeMs / 1000 - sp.base) / (sp.max - sp.base) : 0), 0, 1);
    if (k < 0.15) return;
    ctx.save(); ctx.strokeStyle = palette.ink; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.12 * k;
    for (let i = 0; i < 16; i += 1) {
      const a = (i / 16) * Math.PI * 2 + 0.2, phase = ((state.distance * 0.08 + i * 0.37) % 1);
      const r1 = 140 + phase * 260, r2 = r1 + 50 * k;
      const y1 = HOR + Math.sin(a) * r1 * 0.9; if (y1 < HOR + 30) continue;
      ctx.beginPath(); ctx.moveTo(W / 2 + Math.cos(a) * r1, y1); ctx.lineTo(W / 2 + Math.cos(a) * r2, HOR + Math.sin(a) * r2 * 0.9); ctx.stroke();
    }
    ctx.restore();
  }

  return {
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
      fx.slotPop = fx.slotPop.map((v) => Math.max(0, v - dt * 5));
      if (fx.drain) { fx.drain.t -= dt * 1000; if (fx.drain.t <= 0) fx.drain = null; }
      fx.surge = Math.max(0, fx.surge - dt * 1.5);
      fx.bolt = Math.max(0, fx.bolt - dt * 1000);
      if (fx.shake > 0) { ctx.translate((Math.random() - 0.5) * fx.shake, (Math.random() - 0.5) * fx.shake); fx.shake = Math.max(0, fx.shake - dt * 40); }
      sky(); scenery(state.distance); road(state); speedLines(state); items(state, t); storm(state, t); if (showHud) hud(state, best, t); effects(dt);
    },
  };
}
