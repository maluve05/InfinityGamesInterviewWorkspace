// Screen switching: one <section data-screen> per screen; the current name lives on <body data-current>.
export const SCREENS = ['start', 'play', 'end'];
export function show(name) { document.body.dataset.current = name; }
export function current() { return document.body.dataset.current; }
