// Image loader for pre-rendered sprites (ElevenLabs art, cut out offline).
// Never blocks: `img(name)` returns null until the image has loaded, so the view
// can fall back to its vector drawing and the game never shows a hole.
const BASE = './assets/';
const WORLD_FILES = {
  coast: ['palm', 'coral', 'lamp', 'buoy', 'hut'],
};
export const SPRITES = {
  ...Object.fromEntries(Object.entries(WORLD_FILES).flatMap(([w, props]) => [
    [`${w}-backdrop`, `${w}/backdrop.jpg`], [`${w}-road`, `${w}/road.jpg`], [`${w}-barrier`, `${w}/barrier.png`],
    ...props.map((pr) => [`${w}-${pr}`, `${w}/${pr}.png`]),
  ])),
  storm: 'storm.png',
  'gem-ember': 'gems/ember.png',
  'gem-tide': 'gems/tide.png',
  'gem-sun': 'gems/sun.png',
  'gem-leaf': 'gems/leaf.png',
  'gem-plum': 'gems/plum.png',
  ...Object.fromEntries([0, 1, 2, 3, 4, 5, 6, 7].map((i) => [`run-${i}`, `runner/run-${i}.png`])),
  idle: 'runner/idle.png',
};

/** A copy of `im` whose white scarf pixels (upper part of the frame only) take `hex`. Cached by the caller. */
export function tintScarf(im, hex) {
  const c = document.createElement('canvas');
  c.width = im.naturalWidth; c.height = im.naturalHeight;
  const g = c.getContext('2d');
  g.drawImage(im, 0, 0);
  if (!hex) return c;
  const d = g.getImageData(0, 0, c.width, c.height), px = d.data;
  const tr = parseInt(hex.slice(1, 3), 16), tg = parseInt(hex.slice(3, 5), 16), tb = parseInt(hex.slice(5, 7), 16);
  const maxY = Math.floor(c.height * 0.62);
  for (let y = 0; y < maxY; y += 1) {
    for (let x = 0; x < c.width; x += 1) {
      const i = (y * c.width + x) * 4;
      const r = px[i], gg = px[i + 1], b = px[i + 2];
      const hi = Math.max(r, gg, b), lo = Math.min(r, gg, b);
      if (px[i + 3] > 20 && hi > 175 && hi - lo < 34) {
        const k = hi / 255;   // keep the painted shading
        px[i] = Math.min(255, tr * k + 40 * k * k); px[i + 1] = Math.min(255, tg * k + 40 * k * k); px[i + 2] = Math.min(255, tb * k + 40 * k * k);
      }
    }
  }
  g.putImageData(d, 0, 0);
  return c;
}

export function loadSprites(map = SPRITES) {
  const imgs = {};
  for (const [name, path] of Object.entries(map)) {
    const im = new Image();
    im.decoding = 'async';
    im.src = BASE + path;
    imgs[name] = im;
  }
  return {
    img(name) { const im = imgs[name]; return im && im.complete && im.naturalWidth > 0 ? im : null; },
    add(name, path) { if (!imgs[name]) { const im = new Image(); im.src = BASE + path; imgs[name] = im; } },
  };
}
