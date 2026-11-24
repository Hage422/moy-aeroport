// net.js — taxi network: paths, fillets, stand leads and routes (shared by the map renderer and the game)
const NET_STEP = 5;                                   // flattening step of arcs / curves, world units
const WAIT_SPOT = { x: 2002, y: 330, hd: -Math.PI / 2 };    // where a landed plane stops and waits for a stand
const EXIT_J = [1975, 330];                           // landing exit line meets the right lane here
const HOLD = { x: 245, y: 975 };                      // departure runway: waiting point before the take-off run
const LEAD_R = 44;
const MID_Y = H2_Y;                                   // middle taxi road

const angDiff = (a, b) => { let d = b - a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
const hdOf = (dx, dy) => Math.atan2(dx, -dy);          // 0 = up, clockwise

// ---- polylines -------------------------------------------------------------------------------
function makePath(pts) {
  const clean = [pts[0].slice()];
  for (let i = 1; i < pts.length; i++) { const p = clean[clean.length - 1]; if (Math.hypot(pts[i][0] - p[0], pts[i][1] - p[1]) > 0.05) clean.push(pts[i].slice()); }
  const n = clean.length, cum = [0], seg = [];
  for (let i = 0; i < n - 1; i++) { const dx = clean[i + 1][0] - clean[i][0], dy = clean[i + 1][1] - clean[i][1]; cum.push(cum[i] + Math.hypot(dx, dy)); seg.push(hdOf(dx, dy)); }
  const tan = [];
  for (let j = 0; j < n; j++) {
    if (n < 2) tan.push(0);
    else if (j === 0) tan.push(seg[0]); else if (j === n - 1) tan.push(seg[n - 2]);
    else tan.push(Math.atan2(Math.sin(seg[j - 1]) + Math.sin(seg[j]), Math.cos(seg[j - 1]) + Math.cos(seg[j])));
  }
  return { pts: clean, cum, len: cum[n - 1], tan, vl: null };
}
// position and heading at distance s along the path
function pathAt(p, s, out = [0, 0, 0]) {
  const n = p.pts.length;
  if (s <= 0) { out[0] = p.pts[0][0]; out[1] = p.pts[0][1]; out[2] = p.tan[0]; return out; }
  if (s >= p.len) { out[0] = p.pts[n - 1][0]; out[1] = p.pts[n - 1][1]; out[2] = p.tan[n - 1]; return out; }
  let lo = 0, hi = n - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (p.cum[m] <= s) lo = m; else hi = m; }
  const t = (s - p.cum[lo]) / (p.cum[hi] - p.cum[lo]);
  out[0] = p.pts[lo][0] + (p.pts[hi][0] - p.pts[lo][0]) * t; out[1] = p.pts[lo][1] + (p.pts[hi][1] - p.pts[lo][1]) * t;
  out[2] = p.tan[lo] + angDiff(p.tan[lo], p.tan[hi]) * t;
  return out;
}
function reversePath(p) { return makePath(p.pts.slice().reverse()); }
function joinPaths(...ps) { const pts = []; ps.forEach(p => p.pts.forEach(q => pts.push(q))); return makePath(pts); }

// rounds every interior corner of a polyline with an arc (radius per vertex), returns the flattened points
function fillet(pts, radii, step = NET_STEP) {
  const n = pts.length, T = new Array(n).fill(0), info = new Array(n).fill(null);
  for (let i = 1; i < n - 1; i++) {
    const A = pts[i - 1], B = pts[i], C = pts[i + 1];
    const ux = A[0] - B[0], uy = A[1] - B[1], vx = C[0] - B[0], vy = C[1] - B[1], lu = Math.hypot(ux, uy), lv = Math.hypot(vx, vy);
    if (lu < 1e-6 || lv < 1e-6) continue;
    const th = Math.acos(clamp((ux * vx + uy * vy) / (lu * lv), -1, 1)), R = Array.isArray(radii) ? radii[i] : radii;
    if (!R || th > Math.PI - 0.02 || th < 0.05) continue;
    T[i] = R / Math.tan(th / 2); info[i] = { th, ux, uy, vx, vy, lu, lv };
  }
  for (let i = 0; i < n - 1; i++) {
    const L = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]), need = T[i] + T[i + 1];
    if (need > L * 0.98) { const k = L * 0.98 / need; T[i] *= k; T[i + 1] *= k; }
  }
  const out = [pts[0].slice()];
  for (let i = 1; i < n - 1; i++) {
    const f = info[i];
    if (!f || T[i] < 0.4) { out.push(pts[i].slice()); continue; }
    const B = pts[i], t = T[i], R = t * Math.tan(f.th / 2);
    const p1 = [B[0] + f.ux / f.lu * t, B[1] + f.uy / f.lu * t], p2 = [B[0] + f.vx / f.lv * t, B[1] + f.vy / f.lv * t];
    const bx = f.ux / f.lu + f.vx / f.lv, by = f.uy / f.lu + f.vy / f.lv, bl = Math.hypot(bx, by), dist = R / Math.sin(f.th / 2);
    const cx = B[0] + bx / bl * dist, cy = B[1] + by / bl * dist;
    const a1 = Math.atan2(p1[1] - cy, p1[0] - cx), d = angDiff(a1, Math.atan2(p2[1] - cy, p2[0] - cx)), ns = Math.max(2, Math.ceil(Math.abs(d) * R / step));
    for (let k = 0; k <= ns; k++) { const a = a1 + d * k / ns; out.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]); }
  }
  out.push(pts[n - 1].slice());
  return out;
}
function bezierPts(p0, p1, p2, p3, n = 16) {
  const out = [];
  for (let k = 0; k <= n; k++) {
    const t = k / n, u = 1 - t, a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
    out.push([a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]]);
  }
  return out;
}

// speed limits along a path (by curvature), smoothed so that the plane brakes before a bend; end = speed at the last point
function setSpeedLimits(p, vmax, vEnd = 0, aLat = 150, acc = 110, dec = 170) {
  const n = p.pts.length, v = new Array(n).fill(vmax);
  for (let j = 1; j < n - 1; j++) {
    const ds = Math.max(1, (p.cum[j + 1] - p.cum[j - 1]) / 2);
    const h0 = hdOf(p.pts[j][0] - p.pts[j - 1][0], p.pts[j][1] - p.pts[j - 1][1]), h1 = hdOf(p.pts[j + 1][0] - p.pts[j][0], p.pts[j + 1][1] - p.pts[j][1]);
    const k = Math.abs(angDiff(h0, h1)) / ds;
    if (k > 1e-4) v[j] = clamp(Math.sqrt(aLat / k), 34, vmax);
  }
  v[n - 1] = Math.min(v[n - 1], vEnd);
  for (let j = n - 2; j >= 0; j--) v[j] = Math.min(v[j], Math.sqrt(v[j + 1] * v[j + 1] + 2 * dec * (p.cum[j + 1] - p.cum[j])));
  p.vl = v; p.acc = acc; p.dec = dec;
  return p;
}
function pathLimit(p, s) {
  const n = p.pts.length; if (!p.vl) return 100;
  if (s <= 0) return p.vl[0]; if (s >= p.len) return p.vl[n - 1];
  let lo = 0, hi = n - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (p.cum[m] <= s) lo = m; else hi = m; }
  const t = (s - p.cum[lo]) / (p.cum[hi] - p.cum[lo]); return p.vl[lo] + (p.vl[hi] - p.vl[lo]) * t;
}

// ---- stand leads -----------------------------------------------------------------------------
// side stands: a quarter arc from the lane (north of the stand) into the stand; top row: east lead = arrival, west lead = departure
function buildLeads(s) {
  if (s.lane === 'top') {
    const x0 = s.x, y0 = s.y + s.r, bez = sg => bezierPts([x0, y0], [x0, y0 + 20], [x0 + sg * 30, H1_Y], [x0 + sg * 76, H1_Y], 18);
    const west = bez(-1), east = bez(1);
    return { top: true, arrive: east.slice().reverse().concat([[s.x, s.y]]), depart: [[s.x, s.y]].concat(west), westEnd: west[west.length - 1], eastEnd: east[east.length - 1] };
  }
  const lx = LANES[s.lane], d = Math.sign(s.x - lx), ex = s.x - d * s.r, R = Math.min(LEAD_R, Math.abs(ex - lx) - 4);
  const cx = lx + d * R, cy = s.y - R, a0 = d > 0 ? Math.PI : 0, pts = [];
  for (let k = 0; k <= 14; k++) { const a = a0 + (Math.PI / 2 - a0) * k / 14; pts.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]); }
  pts.push([s.x, s.y]);
  return { top: false, d, R, lx, mouth: pts[0], arrive: pts, depart: pts.slice().reverse() };
}
STANDS.forEach(s => { s.lead = buildLeads(s); });

// ---- routes ----------------------------------------------------------------------------------
const WAIT_P = [WAIT_SPOT.x, WAIT_SPOT.y];
// roads leading to a lane mouth: from the exit junction down the right lane, along the middle road, down a lane
function approachPts(s) {
  const L = s.lead;
  if (L.top) return { pts: [WAIT_P, EXIT_J, [LANES.V4, H1_Y], [L.eastEnd[0], H1_Y]], radii: [0, 27, 78, 0] };
  const lx = LANES[s.lane], my = L.mouth[1];
  if (lx === LANES.V4) return { pts: [WAIT_P, EXIT_J, [lx, my]], radii: [0, 27, 0] };
  return { pts: [WAIT_P, EXIT_J, [LANES.V4, MID_Y], [lx, MID_Y], [lx, my]], radii: [0, 27, 60, 60, 0] };
}
// arrival route legs from the waiting spot to the stand
function routeArrive(s) {
  const a = approachPts(s), road = fillet(a.pts, a.radii), L = s.lead;
  const full = makePath(road.concat(L.arrive.slice(1)));
  setSpeedLimits(full, 150, 0, 150, 90, 150);
  const legs = [{ k: 'path', path: full, mode: 'fwd' }];
  if (L.top) legs.push({ k: 'pivot', to: s.hd });
  return legs;
}
// departure route legs: pushback (side stands), a turn on the spot if needed, then the long way to the hold point
function routeDepart(s) {
  const L = s.lead, legs = [];
  let pts;
  if (L.top) {                                // stand -> south -> west lead -> H1 west -> corner -> V0 south
    const body = fillet([L.westEnd, [LANES.V0, H1_Y], [LANES.V0, 940]], [0, 78, 0]);
    pts = L.depart.concat(body.slice(1));
  } else {
    const push = makePath(L.depart); setSpeedLimits(push, 55, 0, 60, 40, 80);
    legs.push({ k: 'path', path: push, mode: 'rev' });
    const lx = L.lx, my = L.mouth[1];
    if (lx === LANES.V0) pts = my < 940 ? [[lx, my], [LANES.V0, 940]] : [[lx, my]];          // X1 starts below the hairpin corner: no reversing
    else {
      legs.push({ k: 'pivot', to: 0 });                                    // nose north, then drive off
      pts = lx === LANES.V4 ? fillet([[lx, my], [lx, H1_Y], [LANES.V0, H1_Y], [LANES.V0, 940]], [0, 78, 78, 0])
                            : fillet([[lx, my], [lx, MID_Y], [LANES.V0, MID_Y], [LANES.V0, 940]], [0, 60, 60, 0]);
    }
  }
  const drive = makePath(pts.concat(hairpinPts()));
  setSpeedLimits(drive, 150, 0, 150, 90, 150);
  legs.push({ k: 'path', path: drive, mode: 'fwd', hold: true });
  return legs;
}
// V0 south end -> hairpin -> up the centre line of the left runway to the hold point
function hairpinPts() {
  const raw = fillet([[LANES.V0, 940], [LANES.V0, 1075], [245, 1075], [245, HOLD.y]], [0, 55, 55, 0]);
  return raw.slice(1);
}
// landing: from below the screen up the right runway, off onto the apron, stop at the waiting spot
const LAND = (() => {
  const pre = [[2155, 1450], [2155, 540]], curve = bezierPts([2155, 540], [2155, 440], [2130, 330], [2040, 330], 24);
  const path = makePath(pre.concat(curve.slice(1), [[WAIT_SPOT.x, WAIT_SPOT.y]]));
  return { path, sScreen: 1450 - 1105, sTouch: 1450 - 880, sCurve: 1450 - 540 };   // plane enters the screen / touches down / starts the turn-off
})();
// takeoff run: straight up the left runway
const TAKEOFF = { x: 245, y0: HOLD.y, y1: -190, liftY: 640 };

// ---- vehicle routes (from the terminal) ------------------------------------------------------
const TERM_EXIT = { V1: [LANES.V1, 1085], V2: [LANES.V2, 1002], V3: [LANES.V3, 1085] };
function vehicleRoutePts(s) {
  const L = s.lead;
  if (L.top) {
    const west = s.x < 1200, laneSide = west ? LANES.V0 : LANES.V4, mouth = west ? L.westEnd : L.eastEnd;
    const from = TERM_EXIT.V2, pts = [from, [LANES.V2, MID_Y], [laneSide, MID_Y], [laneSide, H1_Y], [mouth[0], H1_Y]];
    return { pts, radii: [0, 60, 60, 78, 0], lead: (west ? L.depart.slice().reverse() : L.arrive).slice(0) };
  }
  const lx = L.lx, my = L.mouth[1];
  if (lx === LANES.V1) return { pts: [TERM_EXIT.V1, [lx, my]], radii: [0, 0], lead: L.arrive };
  if (lx === LANES.V2) return { pts: [TERM_EXIT.V2, [lx, my]], radii: [0, 0], lead: L.arrive };
  if (lx === LANES.V3) return { pts: [TERM_EXIT.V3, [lx, my]], radii: [0, 0], lead: L.arrive };
  if (lx === LANES.V0) return { pts: [TERM_EXIT.V1, [LANES.V1, MID_Y], [lx, MID_Y], [lx, my]], radii: [0, 60, 60, 0], lead: L.arrive };
  return { pts: [TERM_EXIT.V3, [LANES.V3, MID_Y], [lx, MID_Y], [lx, my]], radii: [0, 60, 60, 0], lead: L.arrive };
}
const _vrCache = {};
function vehicleBase(s) {                       // path terminal -> stand mouth -> into the stand (cached)
  if (_vrCache[s.id]) return _vrCache[s.id];
  const r = vehicleRoutePts(s), road = fillet(r.pts, r.radii);
  return (_vrCache[s.id] = road.concat(r.lead.slice(1)));
}
