// util.js — small helpers shared by map / planes / vehicles / ui
const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;

// rounded rectangle sub-path (clockwise)
function rr(c, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

// regular octagon with flat sides facing up/down/left/right; r = apothem (centre -> flat side)
function octPath(c, cx, cy, r) {
  const R = r / Math.cos(Math.PI / 8);
  for (let i = 0; i < 8; i++) {
    const a = (i + 0.5) * TAU / 8;
    const px = cx + Math.cos(a) * R, py = cy + Math.sin(a) * R;
    i ? c.lineTo(px, py) : c.moveTo(px, py);
  }
  c.closePath();
}

function hexPath(c, cx, cy, R, rot = Math.PI / 6) {
  for (let i = 0; i < 6; i++) {
    const a = rot + i * TAU / 6;
    const px = cx + Math.cos(a) * R, py = cy + Math.sin(a) * R;
    i ? c.lineTo(px, py) : c.moveTo(px, py);
  }
  c.closePath();
}

// deterministic random numbers
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// colour helpers
function hex2rgb(h) {
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map(x => x + x).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(a, b, t) {
  const A = hex2rgb(a), B = hex2rgb(b);
  return 'rgb(' + A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',') + ')';
}
const shade = (h, t) => (t >= 0 ? mix(h, '#ffffff', t) : mix(h, '#000000', -t));
function rgba(h, a) { const [r, g, b] = hex2rgb(h); return `rgba(${r},${g},${b},${a})`; }

// Soft shadow of an arbitrary path. The shape itself is drawn far off-canvas and only its
// blurred shadow lands in view; shadowOffset is device-space, so the offset stays constant
// in world space however the sprite is rotated. sc = world->device scale at the caller.
const SH_OFF = 8000;
function castShadow(c, pathFn, sc, dx, dy, blur, alpha, col = '8,14,24') {
  c.save();
  const M = c.getTransform();
  c.setTransform(new DOMMatrix().translate(-SH_OFF, 0).multiply(M));
  c.shadowColor = `rgba(${col},${alpha})`;
  c.shadowBlur = blur * sc;
  c.shadowOffsetX = SH_OFF + dx * sc;
  c.shadowOffsetY = dy * sc;
  c.fillStyle = '#000';
  c.beginPath();
  pathFn(c);
  c.fill();
  c.restore();
}

// cubic-ish noise for texture (value noise on a lattice)
function makeNoise(seed, n = 64) {
  const r = rng(seed), g = new Float32Array(n * n);
  for (let i = 0; i < g.length; i++) g[i] = r();
  const sm = t => t * t * (3 - 2 * t);
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = sm(x - xi), yf = sm(y - yi);
    const a = g[((yi % n + n) % n) * n + ((xi % n + n) % n)];
    const b = g[((yi % n + n) % n) * n + (((xi + 1) % n + n) % n)];
    const c2 = g[(((yi + 1) % n + n) % n) * n + ((xi % n + n) % n)];
    const d = g[(((yi + 1) % n + n) % n) * n + (((xi + 1) % n + n) % n)];
    return lerp(lerp(a, b, xf), lerp(c2, d, xf), yf);
  };
}
