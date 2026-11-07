// Seeded PRNG (mulberry32). Pure: returns the value and the next seed.
export function next(seed) {
  let t = (seed + 0x6d2b79f5) >>> 0;
  let r = Math.imul(t ^ (t >>> 15), t | 1);
  r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
  return { value: ((r ^ (r >>> 14)) >>> 0) / 4294967296, seed: t };
}
// Convenience for engine code that threads seed through a mutable cursor.
export function rngCursor(seed) {
  const c = { seed: seed >>> 0 };
  c.float = () => { const o = next(c.seed); c.seed = o.seed; return o.value; };
  c.int = (lo, hi) => lo + Math.floor(c.float() * (hi - lo + 1));
  return c;
}
