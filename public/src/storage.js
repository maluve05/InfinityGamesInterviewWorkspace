// Versioned save data. Never throws: falls back to memory when storage is blocked.
export const STORAGE_KEY = 'infinity-runner-save';
export const VERSION = 1;
const DEFAULTS = () => ({ version: VERSION, best: 0, runs: 0, settings: { sound: true }, tutorialDone: false });

let memory = null;
function backend() {
  try { const ls = globalThis.localStorage; if (ls) { ls.getItem(STORAGE_KEY); return ls; } } catch { /* blocked */ }
  return null;
}

export function load() {
  const ls = backend();
  let raw = null;
  try { raw = ls ? ls.getItem(STORAGE_KEY) : memory; } catch { raw = memory; }
  if (!raw) return DEFAULTS();
  try {
    const data = JSON.parse(raw);
    if (!data || data.version !== VERSION) return { ...DEFAULTS(), best: Number(data?.best) || 0 };
    return {
      ...DEFAULTS(),
      ...data,
      tutorialDone: Boolean(data?.tutorialDone),
      settings: { ...DEFAULTS().settings, ...data.settings },
    };
  } catch { return DEFAULTS(); }
}

export function save(data) {
  const raw = JSON.stringify({ ...data, version: VERSION });
  memory = raw;
  try { backend()?.setItem(STORAGE_KEY, raw); } catch { /* memory only */ }
  return data;
}

export function update(fn) { return save(fn(load())); }

export function reset() {
  memory = null;
  try { backend()?.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  return DEFAULTS();
}
