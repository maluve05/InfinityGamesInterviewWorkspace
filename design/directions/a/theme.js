window.THEME = {
  name: 'A — Neon Dusk',
  note: 'Night city at speed. Deep ink road with electric-teal edges, gems as lit crystals, a violet storm with lightning. Motion: road bands rush, gems bob 0.6 s ease-in-out, chain slots pop with overshoot (back-out, 180 ms), 6-chain = white flash + slow-mo 0.4 s.',
  css: { '--page': '#0b0a14', '--ink': '#f3efe6', '--display': 'Unbounded', '--num': 'Unbounded', '--h1font': '700 28px Unbounded', '--shadow': '0 30px 80px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.06)' },
  sky: [[0, '#120f2b'], [0.55, '#3b1d4a'], [0.9, '#ff7a59'], [1, '#ffb36b']],
  ground: ['#16132a', '#1b1733'], road: ['#1d1a36', '#25213f'],
  edge: '#33f0d0', laneLine: '#8c86c9', fog: '#ff8e6b', barrier: '#2a2350',
  glow: 3.5, text: '#f6f2ea', muted: '#a49fc4', panel: 'rgba(14,12,30,.72)', panelEdge: 'rgba(255,255,255,.12)', slot: 'rgba(255,255,255,.14)',
  cta: '#33f0d0', ctaInk: '#0b0a14', veil: 'rgba(10,8,22,.55)',
  storm: { core: '#120a24', cloud: '#2c1748', bolt: '#c9a6ff' },
  gems: {
    ember: { light: '#ffd0c2', base: '#ff4d5e', deep: '#a3142f', edge: '#ffb3a8' },
    tide: { light: '#d4f6ff', base: '#2fb6ff', deep: '#0c4e9c', edge: '#a8e6ff' },
    leaf: { light: '#e2ffd0', base: '#5be36a', deep: '#167a3a', edge: '#b9f7a8' },
    sun: { light: '#fff6c9', base: '#ffc531', deep: '#b86a00', edge: '#ffe58a' },
  },
  scenery(W, hor) {
    let s = '';
    const xs = [0, 30, 52, 90, 120, 150, 190, 235, 262, 300, 330, 360, 385];
    xs.forEach((x, i) => { const h = 40 + ((i * 37) % 70); s += `<rect x="${x}" y="${hor - h}" width="${22 + (i % 3) * 8}" height="${h}" fill="#1a1236" opacity=".9"/>`;
      for (let w = 0; w < 4; w++) s += `<rect x="${x + 5 + (w % 2) * 9}" y="${hor - h + 8 + w * 10}" width="3" height="4" fill="#ffb36b" opacity="${(i + w) % 3 ? .2 : .8}"/>`; });
    s += `<circle cx="${W * .86}" cy="${hor - 150}" r="20" fill="#ffd9a6" opacity=".85"/>`;
    return s;
  },
  runner() {
    return `<g filter="url(#glow)"><ellipse cx="0" cy="4" rx="26" ry="7" fill="#000" opacity=".35"/>
      <path d="M-14,-6 L-8,-46 L8,-46 L14,-6 Z" fill="#f6f2ea"/><rect x="-11" y="-6" width="8" height="6" rx="2" fill="#33f0d0"/><rect x="3" y="-10" width="8" height="10" rx="2" fill="#33f0d0"/>
      <circle cx="0" cy="-58" r="12" fill="#f6f2ea"/><path d="M-12,-62 Q0,-76 12,-62" fill="#33f0d0"/>
      <path d="M-8,-42 L-24,-26" stroke="#f6f2ea" stroke-width="7" stroke-linecap="round"/><path d="M8,-42 L22,-54" stroke="#f6f2ea" stroke-width="7" stroke-linecap="round"/></g>`;
  },
  title(W) {
    return `<text x="${W / 2}" y="190" text-anchor="middle" class="display" font-size="50" fill="#f6f2ea" filter="url(#glow)">CHROMA</text>
      <text x="${W / 2}" y="246" text-anchor="middle" class="display" font-size="50" fill="#33f0d0" filter="url(#glow)">RUSH</text>`;
  },
};
