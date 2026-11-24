// planes_geom.js — shapes of the three airliner types. Nose points UP (-y), origin = centre of the aircraft.
const TYPES = {
  S: { key: 'S', name: 'Малый',   L: 68,  S: 66,  fw: 8.2,  engW: 5.7, rear: true },
  M: { key: 'M', name: 'Средний', L: 90,  S: 88,  fw: 10.2, engW: 7.9 },
  L: { key: 'L', name: 'Большой', L: 120, S: 120, fw: 14,   engW: 11 },
};

// invented airlines (no real brands): c1 = main colour, c2 = second colour, pat = paint scheme
const LIVERIES = [
  { name: 'Северный ветер', c1: '#1d56b0', c2: '#79c8ff', pat: 'cone'   },
  { name: 'Зарница',        c1: '#e8531c', c2: '#ffc61f', pat: 'split'  },
  { name: 'Лесной',         c1: '#1f9150', c2: '#a6e35f', pat: 'stripe' },
  { name: 'Янтарь',         c1: '#f2b11c', c2: '#2c313b', pat: 'cone'   },
  { name: 'Вега',           c1: '#6c43cc', c2: '#ff74b4', pat: 'wing'   },
  { name: 'Лазурь',         c1: '#10a8a2', c2: '#0c4f5e', pat: 'split'  },
  { name: 'Рубин',          c1: '#c8133a', c2: '#ffffff', pat: 'stripe' },
  { name: 'Графит',         c1: '#3b4451', c2: '#b4bfca', pat: 'wing'   },
];

function geom(T) {
  const L = T.L, hs = T.S / 2, h = T.fw / 2, rear = !!T.rear;
  const y0 = rear ? -L * 0.02 : -L * 0.065;          // wing root, leading edge
  const rc = L * (rear ? 0.19 : 0.245);               // root chord
  const tc = L * (rear ? 0.07 : 0.072);               // tip chord
  const sw = (hs - h) * (rear ? 0.56 : 0.66);         // sweep: how far back the tip sits
  const xr = h * 0.8;                                 // wing root x
  const LE = x => y0 + sw * Math.max(0, x - xr) / (hs - xr);
  const TE = x => y0 + rc + (sw + tc - rc) * Math.max(0, x - xr) / (hs - xr);
  const kx = h + (hs - h) * 0.3;
  const wing = [[xr, y0], [hs, y0 + sw], [hs, y0 + sw + tc], [kx, TE(kx) + L * 0.013], [xr, y0 + rc]];
  const ty0 = L * (rear ? 0.335 : 0.36), tsp = hs * 0.36, th = h * 0.5, tsw = (tsp - th) * 0.6;
  const stab = [[th, ty0], [tsp, ty0 + tsw], [tsp, ty0 + tsw + L * 0.044], [th, ty0 + L * 0.105]];
  let engs = [];
  if (rear) {
    const w = T.engW, len = L * 0.2;
    engs.push({ x: h + w * 0.62, y: L * 0.1, w, len });
  } else {
    const w = T.engW, len = L * 0.21, x = h + (hs - h) * 0.36;
    engs.push({ x, y: LE(x) - len * 0.56, w, len });
  }
  return { L, hs, h, y0, rc, tc, sw, xr, LE, TE, wing, stab, engs, rear };
}

const mirrorPts = pts => pts.map(p => [-p[0], p[1]]).reverse();   // keeps winding clockwise

function polyPath(c, pts) { pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); }

function fusePath(c, T) {
  const L = T.L, h = T.fw / 2, n = -L / 2, t = L / 2;
  c.moveTo(0, n);
  c.bezierCurveTo(h * 0.64, n, h, n + L * 0.05, h, n + L * 0.155);
  c.lineTo(h, L * 0.17);
  c.bezierCurveTo(h, L * 0.31, h * 0.58, L * 0.43, h * 0.2, t - 0.5);
  c.quadraticCurveTo(0, t + 0.9, -h * 0.2, t - 0.5);
  c.bezierCurveTo(-h * 0.58, L * 0.43, -h, L * 0.31, -h, L * 0.17);
  c.lineTo(-h, n + L * 0.155);
  c.bezierCurveTo(-h, n + L * 0.05, -h * 0.64, n, 0, n);
  c.closePath();
}

function engPath(c, e, side) {
  const w = e.w, r = w * 0.46;
  rr(c, side * e.x - w / 2, e.y, w, e.len, r);
}

// union silhouette (for shadows) — every sub-path is clockwise
function silhouette(c, T) {
  const g = geom(T);
  fusePath(c, T);
  polyPath(c, g.wing); polyPath(c, mirrorPts(g.wing));
  polyPath(c, g.stab); polyPath(c, mirrorPts(g.stab));
  g.engs.forEach(e => { engPath(c, e, 1); engPath(c, e, -1); });
}
