// Sound: unlocks on the first gesture; samples when loaded, a soft procedural synth otherwise.
let ctx = null, master = null, muted = false;
const samples = new Map();
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16];

export function unlock() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain(); master.gain.value = muted ? 0 : 0.5; master.connect(ctx.destination);
}

export function setMuted(m) { muted = m; if (master) master.gain.value = m ? 0 : 0.5; }

/** Optional samples: { name: url }. Missing ones fall back to the synth. */
export async function load(map) {
  if (!ctx) return;
  await Promise.all(Object.entries(map).map(async ([name, url]) => {
    try { const buf = await (await fetch(url)).arrayBuffer(); samples.set(name, await ctx.decodeAudioData(buf)); } catch { /* synth fallback */ }
  }));
}

const freq = (semi, base = 523.25) => base * 2 ** (semi / 12);

function tone(f, { at = 0, dur = 0.18, type = 'triangle', vol = 0.25, attack = 0.005, slideTo } = {}) {
  const t = ctx.currentTime + at;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.02);
}

function noise({ at = 0, dur = 0.25, vol = 0.15, from = 1200, to = 300 } = {}) {
  const t = ctx.currentTime + at;
  const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
  const d = buf.getChannelData(0); for (let i = 0; i < d.length; i += 1) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource(); src.buffer = buf;
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(master); src.start(t);
}

function sample(name, { pitch = 1, volume = 1 } = {}) {
  const buf = samples.get(name); if (!buf) return false;
  const src = ctx.createBufferSource(); src.buffer = buf; src.playbackRate.value = pitch * (0.98 + Math.random() * 0.04);
  const g = ctx.createGain(); g.gain.value = volume; src.connect(g).connect(master); src.start();
  return true;
}

let lastCollect = 0;
export function play(name, opts = {}) {
  if (!ctx || muted) return;
  const n = opts.count ?? 1;
  if (name === 'collect') {
    if (ctx.currentTime - lastCollect < 0.05) return; lastCollect = ctx.currentTime;
    if (sample('collect', { pitch: 2 ** (PENTA[n - 1] / 12) })) return;
    tone(freq(PENTA[n - 1]), { type: 'sine', vol: 0.22, dur: 0.22 }); tone(freq(PENTA[n - 1] + 12), { type: 'triangle', vol: 0.06, dur: 0.15 });
  } else if (name === 'match') {
    if (sample('match', { pitch: 1 + (n - 3) * 0.12 })) return;
    [0, 4, 7, 12].slice(0, n - 1).forEach((s, i) => tone(freq(s + (n - 3) * 2, 392), { at: i * 0.05, type: 'triangle', vol: 0.18, dur: 0.4 }));
  } else if (name === 'burst') {
    if (sample('burst')) return;
    [0, 4, 7, 11, 14, 19].forEach((s, i) => tone(freq(s, 523.25), { at: i * 0.045, type: 'triangle', vol: 0.2, dur: 0.55 }));
    noise({ dur: 0.6, vol: 0.12, from: 3000, to: 600 });
  } else if (name === 'break') {
    if (sample('break')) return;
    tone(freq(-5, 261.6), { type: 'sine', vol: 0.25, dur: 0.3, slideTo: 140 });
  } else if (name === 'hit') {
    if (sample('hit')) return;
    tone(110, { type: 'sine', vol: 0.4, dur: 0.25, slideTo: 55 }); noise({ dur: 0.18, vol: 0.2, from: 800, to: 200 });
  } else if (name === 'jump') {
    if (sample('jump')) return;
    noise({ dur: 0.22, vol: 0.06, from: 600, to: 2400 });
  } else if (name === 'lane') {
    if (sample('lane')) return;
    noise({ dur: 0.09, vol: 0.04, from: 1800, to: 900 });
  } else if (name === 'caught') {
    if (sample('caught')) return;
    tone(196, { type: 'sine', vol: 0.3, dur: 0.9, slideTo: 65 }); noise({ dur: 1, vol: 0.18, from: 900, to: 80 });
  } else if (name === 'start') {
    if (sample('start')) return;
    [0, 7, 12].forEach((s, i) => tone(freq(s), { at: i * 0.07, type: 'triangle', vol: 0.15, dur: 0.3 }));
  }
}
