// Controller: input → engine → view / audio / storage / telemetry. No rules here.
import { CONFIG } from './config.js';
import { createGame, step, tick, summary } from './engine.js';
import { createView, duskAmount } from './view.js';
import * as storage from './storage.js';
import * as audio from './audio.js';
import { SCREENS, show, current } from './screens.js';

const SIM_MS = 1000 / 120;          // fixed simulation step
const SLOWMO = { scale: 0.3, ms: 400 };
const $ = (id) => document.getElementById(id);

const canvas = $('view');
const view = createView(canvas);
view.onStrike = (near) => audio.play('thunder', { near });
let save = storage.load();
let state = createGame(CONFIG, seed());
let running = false, paused = false, acc = 0, last = performance.now(), slowmoMs = 0, attemptNo = 0, attemptStart = 0;
let debugRun = false;

// ---------- Telemetry (Local buffer + Cloudflare D1 Remote) ----------
const TELEMETRY_KEY = 'infinity-runner-telemetry';
const CONSENT_KEY = 'infinity-cookie-consent';
const DEMO_USER_ID = 'demo_user';

let cookieConsent = null;
try { cookieConsent = localStorage.getItem(CONSENT_KEY); } catch {}

const telemetry = (() => { try { return JSON.parse(localStorage.getItem(TELEMETRY_KEY)) || []; } catch { return []; } })();
const ftueSeen = new Set(telemetry.filter((e) => e.event === 'ftue').map((e) => e.name));

function sendRemoteTelemetry(payload) {
  if (debugRun || cookieConsent === 'essential') return;
  try {
    const body = JSON.stringify(payload);
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon('/api/telemetry', body);
    } else {
      fetch('/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  } catch { /* offline / network fallback */ }
}

function track(event, fields = {}) {
  const payload = {
    v: 1,
    ts: Date.now(),
    player: DEMO_USER_ID,
    event,
    type: event,
    ...fields,
    ...(debugRun ? { debug: true } : {}),
  };
  telemetry.push(payload);
  while (telemetry.length > 500) telemetry.shift();
  try { localStorage.setItem(TELEMETRY_KEY, JSON.stringify(telemetry)); } catch { /* memory only */ }
  sendRemoteTelemetry(payload);
}
let sessionStarted = false;
function ensureSession() {
  if (!sessionStarted) {
    sessionStarted = true;
    track('session_start');
  }
}
function ftue(step, name) { if (!ftueSeen.has(name)) { ftueSeen.add(name); track('ftue', { step, name }); } }

function seed() { return (Math.random() * 2 ** 32) >>> 0; }

// ---------- Flow ----------
function startRun() {
  ensureSession();
  audio.unlock();
  state = createGame(CONFIG, seed(), { tutorial: !save.tutorialDone });
  acc = 0; slowmoMs = 0; paused = false; running = true;
  attemptNo += 1; attemptStart = performance.now();
  show('play');
  audio.play('start'); audio.music(true);
  track('attempt_start', { level: 1, attempt_no: attemptNo });
  ftue(1, 'first_run');
}

function endRun(result = 'lose') {
  running = false;
  const s = summary(state);
  const isBest = s.score > save.best;
  audio.music(false);
  if (isBest && s.score > 0 && !debugRun) setTimeout(() => audio.play('best'), 900);
  save = storage.update((d) => ({ ...d, best: Math.max(d.best, s.score), runs: (d.runs || 0) + 1 }));
  track('attempt_end', { level: 1, attempt_no: attemptNo, result, duration_ms: Math.round(performance.now() - attemptStart), grade: s.score, resource_left: Number.isFinite(state.chaserStep) ? 3 - state.chaserStep : Math.round(state.gap), cause: s.cause || result, distance: s.distance, matches: s.matches, max_chains: s.maxChains, stumbles: s.stumbles });
  $('caught').textContent = `CAUGHT AT ${s.distance.toLocaleString('en')} M`;
  $('final').textContent = s.score.toLocaleString('en');
  $('newbest').classList.toggle('on', isBest && s.score > 0);
  $('st-six').textContent = s.maxChains;
  $('st-match').textContent = s.matches;
  $('st-best').textContent = save.best.toLocaleString('en');
  setTimeout(() => { if (!running) show('end'); }, debugRun ? 0 : 650);
}

function setPause(p) {
  if (!running) return;
  paused = p; show(p ? 'pause' : 'play'); audio.duck(p);
  if (!p) last = performance.now();
}

// ---------- Engine plumbing ----------
function apply(events) {
  view.onEvents(state, events);
  for (const e of events) {
    if (e.type === 'collect') { audio.play('collect', { count: e.count }); ftue(2, 'first_gem'); }
    else if (e.type === 'match') {
      audio.play(e.max ? 'burst' : 'match', { count: e.count });
      ftue(3, 'first_match');
      if (e.max) { slowmoMs = SLOWMO.ms; ftue(4, 'first_six_chain'); }
    } else if (e.type === 'break') audio.play('break');
    else if (e.type === 'stumble' && e.cause === 'hit') audio.play('hit');
    else if (e.type === 'jump') audio.play('jump');
    else if (e.type === 'land') audio.play('land');
    else if (e.type === 'vault') audio.play('vault');
    else if (e.type === 'skip') audio.play('skip');
    else if (e.type === 'chaser' && e.dir > 0) audio.play('storm-step');
    else if (e.type === 'lane') audio.play('lane');
    else if (e.type === 'colors') audio.play('unlock');
    else if (e.type === 'tutorial' && e.step === 'done') {
      save = storage.update((d) => ({ ...d, tutorialDone: true }));
    } else if (e.type === 'caught') { audio.play('caught'); endRun('lose'); }
  }
}

function act(type) {
  if (!running || paused) return;
  const r = step(state, { type }); state = r.state; apply(r.events);
}

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (running && !paused) {
    let simDt = dt * 1000;
    if (slowmoMs > 0) { slowmoMs -= simDt; simDt *= SLOWMO.scale; }
    acc += simDt;
    while (acc >= SIM_MS && running) { const r = tick(state, SIM_MS); state = r.state; acc -= SIM_MS; apply(r.events); }
  }
  const dusk = view.setPalette(state.distance);
  const pal = dusk > 0.5 ? 'dusk' : 'day';
  if (document.body.dataset.palette !== pal) document.body.dataset.palette = pal;
  view.draw(state, save.best, now, running && !paused ? dt : dt * 0.5, current() !== 'start');
  requestAnimationFrame(frame);
}

// ---------- Input ----------
const KEYS = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', Space: 'jump', ArrowUp: 'jump', KeyW: 'jump', ArrowDown: 'drop', KeyS: 'drop' };
window.addEventListener('keydown', (e) => {
  if (['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault();
  audio.unlock();
  const scr = current();
  if (e.code === 'KeyM') { toggleMute(); return; }
  if (e.code === 'Escape') { if (scr === 'play' || scr === 'pause') setPause(!paused); return; }
  if ((e.code === 'Space' || e.code === 'Enter') && (scr === 'start' || scr === 'end')) { if (!e.repeat) startRun(); return; }
  if (scr === 'pause' && (e.code === 'Space' || e.code === 'Enter')) { setPause(false); return; }
  const a = KEYS[e.code]; if (a && !e.repeat) act(a);
});
window.addEventListener('keyup', (e) => {
  if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) act('jumpRelease');
});

let down = null, jumpedOnSwipe = false;
canvas.addEventListener('pointerdown', (e) => {
  audio.unlock();
  if (current() !== 'play') return;
  down = { x: e.clientX, y: e.clientY, t: performance.now() };
  jumpedOnSwipe = false;
});
canvas.addEventListener('pointermove', (e) => {
  if (!down || current() !== 'play' || jumpedOnSwipe) return;
  const dx = e.clientX - down.x, dy = e.clientY - down.y;
  if (dy < -30 && Math.abs(dy) > Math.abs(dx)) {
    act('jump');
    jumpedOnSwipe = true;
  }
});
canvas.addEventListener('pointerup', (e) => {
  if (!down || current() !== 'play') return;
  if (jumpedOnSwipe) {
    act('jumpRelease');
    down = null;
    jumpedOnSwipe = false;
    return;
  }
  const dx = e.clientX - down.x, dy = e.clientY - down.y;
  const r = canvas.getBoundingClientRect();
  if (dy < -30 && Math.abs(dy) > Math.abs(dx)) {
    act('jump');                     // a flick: the finger is already up, so it's a full jump (no same-frame release)
  } else if (Math.abs(dx) > 30) {
    act(dx < 0 ? 'left' : 'right');
  } else {
    act(e.clientX - r.left < r.width / 2 ? 'left' : 'right');
  }
  down = null;
  jumpedOnSwipe = false;
});
$('play').addEventListener('click', () => { audio.unlock(); audio.play('ui'); startRun(); });
$('again').addEventListener('click', () => { audio.play('ui'); startRun(); });
$('resume').addEventListener('click', () => { audio.play('ui'); setPause(false); });
document.addEventListener('visibilitychange', () => { if (document.hidden && running && !paused) setPause(true); });

function toggleMute() {
  save = storage.update((d) => ({ ...d, settings: { ...d.settings, sound: !d.settings.sound } }));
  audio.setMuted(!save.settings.sound);
  $('mute').classList.toggle('off', !save.settings.sound);
}
$('mute').addEventListener('click', (e) => { e.stopPropagation(); audio.unlock(); toggleMute(); });
audio.setMuted(!save.settings.sound);
$('mute').classList.toggle('off', !save.settings.sound);

// ---------- Cookie & Privacy UI ----------
const banner = $('cookie-banner');
const acceptBtn = $('cookie-accept');
const optBtn = $('cookie-opt');

function syncConsentUI() {
  if (!banner) return;
  if (cookieConsent) {
    banner.classList.add('hidden');
  } else {
    banner.classList.remove('hidden');
  }
}

if (acceptBtn) {
  acceptBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    cookieConsent = 'accepted';
    try { localStorage.setItem(CONSENT_KEY, 'accepted'); } catch {}
    syncConsentUI();
    ensureSession();
    track('consent_choice', { choice: 'accepted' });
  });
}

if (optBtn) {
  optBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    cookieConsent = 'essential';
    try { localStorage.setItem(CONSENT_KEY, 'essential'); } catch {}
    syncConsentUI();
    ensureSession();
    track('consent_choice', { choice: 'essential' });
  });
}
syncConsentUI();

// ---------- Boot ----------
window.addEventListener('resize', view.resize);
view.resize();
show('start');
requestAnimationFrame((t) => { last = t; frame(t); });

// ---------- Debug hooks (used by npm run smoke / shots) ----------
window.__GAME__ = {
  get state() { return state; },
  screens: SCREENS,
  goTo(name) {
    if (name === 'start') { running = false; state = createGame(CONFIG, 7); show('start'); }
    else if (name === 'play') { debugRun = true; startRun(); for (let i = 0; i < 600; i += 1) { const r = tick(state, SIM_MS); state = r.state; } state.chain = { color: 'ember', count: 4 }; }
    else if (name === 'end') { debugRun = true; startRun(); state.score = 14700; state.distance = 2184; state.maxChains = 7; state.matches = 31; state.cause = 'caught'; endRun('lose'); }
  },
  async smoke() {
    const problems = [];
    debugRun = true;
    try {
      if (current() !== 'start') problems.push(`expected start screen, got ${current()}`);
      const hadTutorial = save.tutorialDone;
      save = { ...save, tutorialDone: true };   // the smoke idles, which a tutorial run waits out forever
      $('play').click();
      save = { ...save, tutorialDone: hadTutorial };
      if (current() !== 'play') problems.push('play button did not start a run');
      act('left'); act('jump'); act('right'); act('right');
      if (state.lane !== 2) problems.push(`lane changes failed (lane ${state.lane})`);
      // Run the real engine forward with no further input until the storm catches the runner.
      for (let i = 0; i < 120 * 300 && running; i += 1) { const r = tick(state, SIM_MS); state = r.state; apply(r.events); }
      if (running) problems.push('run never ended in 300 s of simulated idle play');
      if (state.gems === 0) problems.push('no gems collected');
      await new Promise((r) => setTimeout(r, 20));
      if (current() !== 'end') problems.push(`expected end screen, got ${current()}`);
      $('again').click();
      if (current() !== 'play' || !running) problems.push('restart failed');
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    } catch (e) { problems.push(`threw: ${e.message}`); }
    debugRun = false;
    return problems;
  },
  exportTelemetry: () => telemetry.map((e) => JSON.stringify(e)).join('\n'),
  dusk: duskAmount,
};
