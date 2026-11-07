import test, { beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { STORAGE_KEY, VERSION, load, save, update, reset } from '../public/src/storage.js';

function createFakeLocalStorage(initial = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
}

beforeEach(() => {
  delete globalThis.localStorage;
  reset();
});

afterEach(() => {
  delete globalThis.localStorage;
  reset();
});

test('defaults when nothing is saved', () => {
  globalThis.localStorage = createFakeLocalStorage();
  const data = load();
  assert.deepEqual(data, {
    version: VERSION,
    best: 0,
    runs: 0,
    settings: { sound: true },
    tutorialDone: false,
  });
});

test('save then load round-trips best and settings.sound', () => {
  const fake = createFakeLocalStorage();
  globalThis.localStorage = fake;
  save({ best: 420, runs: 3, settings: { sound: false } });
  const loaded = load();
  assert.equal(loaded.best, 420);
  assert.equal(loaded.settings.sound, false);
  assert.equal(loaded.runs, 3);
  assert.equal(loaded.version, VERSION);
  assert.ok(fake.getItem(STORAGE_KEY) !== null, 'saved payload exists under STORAGE_KEY');
});

test('update(fn) applies fn', () => {
  globalThis.localStorage = createFakeLocalStorage();
  save({ best: 100, runs: 1, settings: { sound: true } });
  const updated = update((prev) => ({
    ...prev,
    best: prev.best + 150,
    runs: prev.runs + 1,
  }));
  assert.equal(updated.best, 250);
  assert.equal(updated.runs, 2);
  const reloaded = load();
  assert.equal(reloaded.best, 250);
  assert.equal(reloaded.runs, 2);
});

test('reset() returns defaults', () => {
  const fake = createFakeLocalStorage();
  globalThis.localStorage = fake;
  save({ best: 999, runs: 10, settings: { sound: false } });
  const res = reset();
  assert.deepEqual(res, {
    version: VERSION,
    best: 0,
    runs: 0,
    settings: { sound: true },
    tutorialDone: false,
  });
  const loaded = load();
  assert.deepEqual(loaded, {
    version: VERSION,
    best: 0,
    runs: 0,
    settings: { sound: true },
    tutorialDone: false,
  });
  assert.equal(fake.getItem(STORAGE_KEY), null);
});

test('corrupt JSON in storage returns defaults without throwing', () => {
  const fake = createFakeLocalStorage({ [STORAGE_KEY]: '{ invalid json ::: broken' });
  globalThis.localStorage = fake;
  let data;
  assert.doesNotThrow(() => {
    data = load();
  });
  assert.deepEqual(data, {
    version: VERSION,
    best: 0,
    runs: 0,
    settings: { sound: true },
    tutorialDone: false,
  });
});

test('an unknown version keeps best but resets the rest', () => {
  const fake = createFakeLocalStorage({
    [STORAGE_KEY]: JSON.stringify({
      version: 999,
      best: 750,
      runs: 25,
      settings: { sound: false },
      extraOldField: 'legacy',
    }),
  });
  globalThis.localStorage = fake;
  const loaded = load();
  assert.equal(loaded.best, 750);
  assert.equal(loaded.version, VERSION);
  assert.equal(loaded.runs, 0);
  assert.equal(loaded.settings.sound, true);
  assert.equal(loaded.tutorialDone, false);
  assert.equal(loaded.extraOldField, undefined);
});

test('works with no localStorage at all (memory fallback)', () => {
  delete globalThis.localStorage;
  reset();
  const init = load();
  assert.deepEqual(init, {
    version: VERSION,
    best: 0,
    runs: 0,
    settings: { sound: true },
    tutorialDone: false,
  });
  save({ best: 300, runs: 2, settings: { sound: false } });
  const loaded = load();
  assert.equal(loaded.best, 300);
  assert.equal(loaded.runs, 2);
  assert.equal(loaded.settings.sound, false);
  update((prev) => ({ ...prev, best: 500 }));
  assert.equal(load().best, 500);
  reset();
  assert.deepEqual(load(), {
    version: VERSION,
    best: 0,
    runs: 0,
    settings: { sound: true },
    tutorialDone: false,
  });
});

test('a localStorage whose methods throw does not throw', () => {
  // Methods throw errors (e.g. QuotaExceededError or security restrictions)
  globalThis.localStorage = {
    getItem() {
      throw new Error('Blocked getItem');
    },
    setItem() {
      throw new Error('QuotaExceededError');
    },
    removeItem() {
      throw new Error('Blocked removeItem');
    },
  };

  assert.doesNotThrow(() => {
    const data = load();
    assert.equal(data.version, VERSION);
  });

  assert.doesNotThrow(() => {
    save({ best: 120 });
  });

  assert.doesNotThrow(() => {
    update((prev) => ({ ...prev, best: 200 }));
  });

  assert.doesNotThrow(() => {
    reset();
  });

  // Accessing property throws
  delete globalThis.localStorage;
  Object.defineProperty(globalThis, 'localStorage', {
    get() {
      throw new Error('SecurityError: Access is denied for this document');
    },
    configurable: true,
  });

  assert.doesNotThrow(() => {
    load();
    save({ best: 10 });
    reset();
  });
});

test('storage: defaults include tutorialDone: false, old saves load false, round-trips true', () => {
  // 1. Defaults include tutorialDone: false
  const def = load();
  assert.equal(def.tutorialDone, false);

  // 2. Old save without the field loads false
  const fake = createFakeLocalStorage({
    [STORAGE_KEY]: JSON.stringify({ version: VERSION, best: 500, runs: 4, settings: { sound: true } }),
  });
  globalThis.localStorage = fake;
  const oldLoaded = load();
  assert.equal(oldLoaded.tutorialDone, false);
  assert.equal(oldLoaded.best, 500);

  // 3. Save / load round-trips true
  save({ tutorialDone: true, best: 600 });
  const reloaded = load();
  assert.equal(reloaded.tutorialDone, true);
  assert.equal(reloaded.best, 600);
});

