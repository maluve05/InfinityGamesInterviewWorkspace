window.THEME = {
  name: 'B — Paper Daylight',
  note: 'Infinity-calm in the open air. Warm cream sky, terracotta road, flat glossy gems like boiled sweets, an ink-blue dust wave behind. Motion: softer, bouncier (spring 0.35 s), gems spin slowly, 6-chain = confetti of the gem shape + a chord, no flash.',
  css: { '--page': '#efe6d6', '--ink': '#2b2a3a', '--display': 'Bricolage', '--num': 'Bricolage', '--h1font': '800 30px Bricolage', '--shadow': '0 24px 60px rgba(70,50,30,.25), 0 0 0 1px rgba(0,0,0,.05)' },
  sky: [[0, '#bfe3e6'], [0.6, '#f6e7c8'], [1, '#ffd6a3']],
  ground: ['#e9c48f', '#e2b97f'], road: ['#d0694a', '#c45f42'],
  edge: '#fff4e0', laneLine: '#ffe5c9', fog: '#fff3dc', barrier: '#3d4a7a',
  glow: 1.2, text: '#2b2a3a', muted: '#7b6f66', panel: 'rgba(255,250,240,.86)', panelEdge: 'rgba(43,42,58,.12)', slot: 'rgba(43,42,58,.14)',
  cta: '#2b2a3a', ctaInk: '#fff4e0', veil: 'rgba(250,240,222,.62)',
  storm: { core: '#2a3566', cloud: '#3d4a7a', bolt: '#bfe3e6' },
  gems: {
    ember: { light: '#ffc2b0', base: '#f0553f', deep: '#b8321f', edge: '#8f2414' },
    tide: { light: '#bfe9ff', base: '#3a9ad9', deep: '#1f5f9a', edge: '#164a7a' },
    leaf: { light: '#d6f5b8', base: '#69b84a', deep: '#3f7f2a', edge: '#2f6420' },
    sun: { light: '#fff1b8', base: '#f6b931', deep: '#c98a10', edge: '#8f6108' },
  },
  scenery(W, hor) {
    return `<path d="M0,${hor} Q60,${hor - 50} 130,${hor - 18} T260,${hor - 30} T405,${hor - 12} V${hor} Z" fill="#f2cf95"/>
      <path d="M0,${hor} Q90,${hor - 26} 190,${hor - 8} T405,${hor - 22} V${hor} Z" fill="#e8bb7c"/>
      <circle cx="${W * .14}" cy="${hor - 150}" r="22" fill="#fff4d6"/>`;
  },
  runner() {
    return `<g><ellipse cx="0" cy="4" rx="26" ry="7" fill="#5a3b2a" opacity=".3"/>
      <path d="M-14,-6 L-9,-46 L9,-46 L14,-6 Z" fill="#2b2a3a"/><rect x="-11" y="-6" width="8" height="6" rx="3" fill="#fff4e0"/><rect x="3" y="-10" width="8" height="10" rx="3" fill="#fff4e0"/>
      <circle cx="0" cy="-58" r="12" fill="#2b2a3a"/><path d="M-13,-60 L13,-60" stroke="#f0553f" stroke-width="5" stroke-linecap="round"/><path d="M12,-60 q14,2 22,12" stroke="#f0553f" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M-8,-42 L-24,-26" stroke="#2b2a3a" stroke-width="7" stroke-linecap="round"/><path d="M8,-42 L22,-54" stroke="#2b2a3a" stroke-width="7" stroke-linecap="round"/></g>`;
  },
  title(W) {
    return `<text x="${W / 2}" y="200" text-anchor="middle" class="display" font-size="64" fill="#2b2a3a">chroma</text>
      <text x="${W / 2}" y="258" text-anchor="middle" class="display" font-size="64" fill="#f0553f">rush</text>`;
  },
};
