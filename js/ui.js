// ui.js — patience rings, service hexagon, target-stand highlight (world units) + HUD and service panel (screen px)
const RING = { green: '#7be04a', orange: '#ff8f1f', red: '#ff3b30' };
const RAINBOW = ['#ff4d55', '#ff9a2e', '#ffd84a', '#66e04a', '#33d0ff', '#9a6bff'];

function polyLen(pts) { let L = 0; for (let i = 0; i < pts.length - 1; i++) L += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); return L; }
function strokeFraction(c, pts, frac) {        // stroke the first `frac` of a closed polyline
  const closed = pts.concat([pts[0]]), total = polyLen(closed); let left = total * frac;
  c.beginPath(); c.moveTo(closed[0][0], closed[0][1]);
  for (let i = 0; i < closed.length - 1 && left > 0; i++) {
    const a = closed[i], b = closed[i + 1], d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (left >= d) { c.lineTo(b[0], b[1]); left -= d; } else { const t = left / d; c.lineTo(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t); left = 0; }
  }
  c.stroke();
}
function octPts(cx, cy, r) {            // vertices clockwise, starting at the right end of the top flat (flat sides face up/down/left/right)
  const R = r / Math.cos(Math.PI / 8), p = [];
  for (let i = 0; i < 8; i++) { const a = -Math.PI / 2 + Math.PI / 8 + i * TAU / 8; p.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]); }
  return p;
}
function hexPts(cx, cy, R) { const p = []; for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + i * TAU / 6; p.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]); } return p; }

// patience ring around a stand: the coloured part is what is left, the rest is dimmed
function drawPatienceRing(c, s, frac) {
  const col = frac > 0.5 ? RING.green : frac > 0.25 ? RING.orange : RING.red, pts = [[s.x, s.y - (s.r + 4)]].concat(octPts(s.x, s.y, s.r + 4));
  c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
  c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath();
  c.strokeStyle = 'rgba(20,30,20,0.32)'; c.lineWidth = 4.4; c.stroke();
  c.strokeStyle = rgba(col, 0.22); c.lineWidth = 9; strokeFraction(c, pts, frac);
  c.strokeStyle = col; c.lineWidth = 4.4; strokeFraction(c, pts, frac);
  c.restore();
}
// dotted outline of the stand the player is about to pick
function drawTargetStand(c, s) {
  const pts = octPts(s.x, s.y, s.r + 2);
  c.save(); c.lineCap = 'round'; c.fillStyle = RING.green; c.strokeStyle = rgba(RING.green, 0.9); c.lineWidth = 3.4; c.setLineDash([0.1, 9]);
  c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.stroke(); c.setLineDash([]);
  pts.forEach(p => { c.beginPath(); c.arc(p[0], p[1], 3.6, 0, TAU); c.fill(); });
  c.restore();
}

// the plane the player has tapped: light-blue octagon along the stand outline, with a faint light-blue veil over the plane
function drawSelection(c, s) {
  const pts = octPts(s.x, s.y, s.r), path = () => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); };
  c.save(); c.lineJoin = 'round';
  path(); c.fillStyle = 'rgba(80,190,255,0.14)'; c.fill();
  path(); c.strokeStyle = 'rgba(80,205,255,0.30)'; c.lineWidth = 11; c.stroke();
  path(); c.strokeStyle = '#5fd2ff'; c.lineWidth = 4.2; c.stroke();
  c.restore();
}

// service hexagon with rainbow rim, icon and progress
function drawServiceHex(c, sc, x, y, icon, frac, R = 36) {
  castShadow(c, k => hexPath(k, x, y, R, -Math.PI / 2), sc, 3, 4.5, 4, 0.4);
  c.save(); c.beginPath(); hexPath(c, x, y, R, -Math.PI / 2);
  const g = c.createLinearGradient(x, y - R, x, y + R); g.addColorStop(0, 'rgba(40,48,66,0.94)'); g.addColorStop(1, 'rgba(18,24,38,0.94)');
  c.fillStyle = g; c.fill();
  const p = hexPts(x, y, R - 2.6); c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = 5;
  for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(p[i][0], p[i][1]); c.lineTo(p[(i + 1) % 6][0], p[(i + 1) % 6][1]); c.strokeStyle = RAINBOW[i]; c.stroke(); }
  if (frac > 0) { const q = hexPts(x, y, R - 10); c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 4.4; strokeFraction(c, q, 1);
    c.strokeStyle = '#8bff52'; c.lineWidth = 4.4; strokeFraction(c, q, frac); }
  c.translate(x, y); drawIcon(c, icon, 30, '#ffffff', 2.2); c.restore();
}

// small icon that shows why the level was lost: black hexagon, red rim (same family as the landing warning)
function drawReasonHex(c, sc, x, y, icon, R = 36) {
  castShadow(c, k => hexPath(k, x, y, R, -Math.PI / 2), sc, 3, 4.5, 4, 0.4);
  c.save(); c.beginPath(); hexPath(c, x, y, R, -Math.PI / 2);
  const g = c.createLinearGradient(x, y - R, x, y + R); g.addColorStop(0, '#191c24'); g.addColorStop(1, '#06070a');
  c.fillStyle = g; c.fill(); c.lineJoin = 'round'; c.lineWidth = 5; c.strokeStyle = '#ff3b30';
  c.beginPath(); hexPath(c, x, y, R - 2.6, -Math.PI / 2); c.stroke();
  c.translate(x, y); drawIcon(c, icon, 30, '#ffffff', 2.2); c.restore();
}

// ---- HUD (screen px, logical 956 x 440) ------------------------------------------------------
function miniPlane(c, T, x, y, s, col) {
  c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = col; c.beginPath(); silhouette(c, T); c.fill(); c.restore();
}
function drawHUD(c, st) {
  const W = 956, h = 25, w = 500, x0 = W / 2 - w / 2;
  c.save();
  c.beginPath(); c.moveTo(x0, 0); c.lineTo(x0 + w, 0); c.lineTo(x0 + w - 14, h); c.lineTo(x0 + 14, h); c.closePath();
  c.shadowColor = 'rgba(0,0,0,0.35)'; c.shadowBlur = 8; c.shadowOffsetY = 2; c.fillStyle = 'rgba(11,18,33,0.84)'; c.fill();
  c.shadowColor = 'transparent'; c.strokeStyle = 'rgba(90,190,255,0.5)'; c.lineWidth = 1; c.stroke();
  c.textBaseline = 'middle'; c.font = '700 11px Inter'; const cy = h / 2 + 0.5;
  const items = [
    { t: 'ПАУЗА', col: '#44d2ff', gap: 22 },
    { plane: 'S', n: st.left.S, gap: 4 }, { plane: 'M', n: st.left.M, gap: 4 }, { plane: 'L', n: st.left.L, gap: 24 },
    { t: 'РЕЙС', col: '#44d2ff', gap: 6 }, { t: st.time, col: '#ffffff', gap: 24 },
    { t: st.money + ' DME€', col: '#92f26b', gap: 24 }, { t: 'ОЧКИ', col: '#44d2ff', gap: 6 }, { t: String(st.score), col: '#ffffff', gap: 0 },
  ];
  const wd = it => it.plane ? 34 : c.measureText(it.t).width;
  let total = items.reduce((a, it, i) => a + wd(it) + (i < items.length - 1 ? it.gap : 0), 0), x = W / 2 - total / 2;
  items.forEach(it => {
    if (it.plane) {
      const T = TYPES[it.plane], s = 0.2 * (T.L < 70 ? 1.0 : T.L < 100 ? 1.12 : 1.3);
      miniPlane(c, T, x + 8, cy, s * 0.62, '#e8f3ff'); c.fillStyle = '#ffffff'; c.textAlign = 'left'; c.fillText(String(it.n), x + 19, cy);
    } else { c.fillStyle = it.col; c.textAlign = 'left'; c.fillText(it.t, x, cy); }
    x += wd(it) + it.gap;
  });
  c.restore();
}

// ---- bottom service panel: the plate is cached, the icons are drawn every frame -----------------------------
// The icon of the service the selected plane needs right now grows and turns lime green (as in the original), the neighbours slide aside.
const PANEL_CYAN = [63, 210, 255], PANEL_LIME = [125, 251, 46], PANEL_ICON = 26, PANEL_BIG = 1.6, PANEL_Y = 364 + 24 + 2;
const mixRGB = (a, b, t) => 'rgb(' + a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',') + ')';
function panelLayout(sc) {                                  // sc[i] = current scale of icon i -> icon centres and slot edges (the row stays centred)
  const w = sc.map(s => 53.2 + PANEL_ICON * 0.6 * (s - 1)), tot = w.reduce((p, q) => p + q, 0);
  let x = 478 - tot / 2; const edge = [x], cx = [];
  for (let i = 0; i < 6; i++) { cx.push(x + w[i] / 2); x += w[i]; edge.push(x); }
  return { cx, edge };
}
function drawServicePanel(c) {
  const W = 956, H = 440, w = 336, h = 48, x0 = W / 2 - w / 2, y0 = H - h - 28;
  c.save();
  c.beginPath(); c.moveTo(x0 + 24, y0); c.lineTo(x0 + w - 24, y0); c.lineTo(x0 + w + 6, y0 + h + 6); c.lineTo(x0 - 6, y0 + h + 6); c.closePath();
  c.shadowColor = 'rgba(0,0,0,0.4)'; c.shadowBlur = 12; c.shadowOffsetY = 2; c.fillStyle = 'rgba(11,18,33,0.9)'; c.fill();
  c.shadowColor = 'transparent'; c.strokeStyle = 'rgba(90,190,255,0.45)'; c.lineWidth = 1; c.stroke();
  c.restore();
}
function drawServiceIcons(c, sc) {
  const L = panelLayout(sc), names = ['deboard', 'baggage', 'fuel', 'catering', 'board', 'takeoff'];
  c.save();
  c.strokeStyle = 'rgba(90,190,255,0.35)'; c.lineWidth = 1; c.beginPath(); c.moveTo(L.edge[5], 372); c.lineTo(L.edge[5], 410); c.stroke();     // line before the take-off icon
  names.forEach((n, i) => {
    const t = clamp((sc[i] - 1) / (PANEL_BIG - 1), 0, 1);
    c.save(); c.translate(L.cx[i], PANEL_Y); drawIcon(c, n, PANEL_ICON * sc[i], mixRGB(PANEL_CYAN, PANEL_LIME, t), 2); c.restore();
  });
  c.restore();
}
// soft green glow behind the service button the player has just pressed; x = centre of the icon, a = 0..1 strength, breathe = 0..1 slow pulse
function drawServiceGlow(c, x, a, breathe) {
  const k = a * (0.9 + 0.1 * breathe), al = v => (v * k).toFixed(3);
  c.save();
  c.globalCompositeOperation = 'lighter';                                      // light adds up: a halo instead of a flat coloured disc
  const g = c.createRadialGradient(x, PANEL_Y, 6, x, PANEL_Y, 46);
  g.addColorStop(0, 'rgba(125,251,46,' + al(0.36) + ')'); g.addColorStop(0.5, 'rgba(110,240,60,' + al(0.17) + ')'); g.addColorStop(1, 'rgba(100,230,60,0)');
  c.fillStyle = g; c.beginPath(); c.arc(x, PANEL_Y, 46, 0, TAU); c.fill();
  c.restore();
}

// plane-size choice (small / medium / large silhouettes) right above the service panel
function drawSizePicker(c, flash) {
  const cx = 956 / 2, bw = 56, bh = 50, gap = 8, w = 3 * bw + 2 * gap + 22, h = bh + 14, x0 = cx - w / 2, y0 = 440 - 48 - 28 - 8 - h;
  c.save();
  c.beginPath(); c.moveTo(x0 + 16, y0); c.lineTo(x0 + w - 16, y0); c.lineTo(x0 + w + 4, y0 + h); c.lineTo(x0 - 4, y0 + h); c.closePath();
  c.shadowColor = 'rgba(0,0,0,0.4)'; c.shadowBlur = 12; c.shadowOffsetY = 2; c.fillStyle = 'rgba(11,18,33,0.92)'; c.fill();
  c.shadowColor = 'transparent'; c.strokeStyle = 'rgba(90,190,255,0.5)'; c.lineWidth = 1; c.stroke();
  ['S', 'M', 'L'].forEach((k, i) => {
    const bx = x0 + 11 + i * (bw + gap), by = y0 + 7, T = TYPES[k];
    c.beginPath(); rr(c, bx, by, bw, bh, 9); c.fillStyle = flash ? 'rgba(255,70,60,0.38)' : 'rgba(70,170,230,0.14)'; c.fill(); c.strokeStyle = flash ? 'rgba(255,120,110,0.95)' : 'rgba(120,225,255,0.55)'; c.lineWidth = flash ? 1.8 : 1.2; c.stroke();
    miniPlane(c, T, bx + bw / 2, by + bh / 2, 0.38, flash ? '#ffd2cd' : '#f1f8ff');
  });
  c.restore();
}

// warning before a landing (a sound plays with it): black hexagon, red outline, white landing icon; pinned to the bottom edge of the screen
function drawLandingWarning(c, x, y, R = 24) {
  c.save();
  c.beginPath(); hexPath(c, x, y, R, -Math.PI / 2);
  c.shadowColor = 'rgba(255,59,48,0.7)'; c.shadowBlur = 14;
  const g = c.createLinearGradient(x, y - R, x, y + R); g.addColorStop(0, '#191c24'); g.addColorStop(1, '#06070a');
  c.fillStyle = g; c.fill(); c.shadowColor = 'transparent';
  c.lineJoin = 'round'; c.lineWidth = 3.6; c.strokeStyle = '#ff3b30';
  c.beginPath(); hexPath(c, x, y, R - 1.8, -Math.PI / 2); c.stroke();
  c.translate(x, y); drawIcon(c, 'landing', 32, '#ffffff', 2.1);
  c.restore();
}
