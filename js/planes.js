// planes.js — paints one aircraft (nose up) at the origin in world units.
const PLANE_EDGE = 'rgba(36,50,66,0.45)';

function wingPt(g, t, f) {            // t: 0 root -> 1 tip, f: 0 leading -> 1 trailing edge (right wing)
  const x = lerp(g.xr, g.hs, t);
  return [x, lerp(g.LE(x), g.TE(x), f)];
}

function paintWing(c, T, liv, g, side) {
  const pts = side > 0 ? g.wing : mirrorPts(g.wing);
  const gr = c.createLinearGradient(side * g.xr, 0, side * g.hs, 0);
  gr.addColorStop(0, '#f6f8fa'); gr.addColorStop(1, '#cdd6de');
  c.beginPath(); polyPath(c, pts); c.fillStyle = gr; c.fill();
  c.save(); c.beginPath(); polyPath(c, pts); c.clip();
  if (liv.pat === 'wing') {                       // outer half of the wing painted
    const g2 = c.createLinearGradient(side * lerp(g.xr, g.hs, 0.4), 0, side * g.hs, 0);
    g2.addColorStop(0, rgba(liv.c1, 0)); g2.addColorStop(0.25, rgba(liv.c1, 0.95)); g2.addColorStop(1, liv.c1);
    c.fillStyle = g2; c.fillRect(Math.min(0, side * g.hs) - 1, -200, Math.abs(g.hs) + 2, 400);
  } else {                                        // only the tip
    c.fillStyle = liv.c1; c.fillRect(side > 0 ? g.hs * 0.93 : -g.hs - 1, -200, g.hs * 0.07 + 1, 400);
  }
  const lw = Math.max(0.22, T.L / 330);
  c.strokeStyle = 'rgba(40,56,72,0.26)'; c.lineWidth = lw; c.lineCap = 'butt';
  const seg = (a, b) => { c.beginPath(); c.moveTo(side * a[0], a[1]); c.lineTo(side * b[0], b[1]); c.stroke(); };
  seg(wingPt(g, 0.06, 0.15), wingPt(g, 0.97, 0.17));      // slat line
  seg(wingPt(g, 0.05, 0.72), wingPt(g, 0.60, 0.70));      // flap line
  seg(wingPt(g, 0.66, 0.76), wingPt(g, 0.97, 0.74));      // aileron line
  [0.2, 0.36, 0.52, 0.62, 0.68, 0.83].forEach(t => seg(wingPt(g, t, 0.72), wingPt(g, t, 1.02)));
  c.restore();
  c.beginPath(); polyPath(c, pts); c.strokeStyle = PLANE_EDGE; c.lineWidth = lw * 1.3; c.stroke();
  // winglet: thin canted plate at the tip
  const tip = [wingPt(g, 1, 0), wingPt(g, 1, 1)];
  c.beginPath();
  c.moveTo(side * (tip[0][0] - 0.2), tip[0][1] - T.L * 0.012);
  c.lineTo(side * (tip[0][0] + T.L * 0.014), tip[0][1] - T.L * 0.004);
  c.lineTo(side * (tip[1][0] + T.L * 0.012), tip[1][1] + T.L * 0.01);
  c.lineTo(side * (tip[1][0] - 0.2), tip[1][1]);
  c.closePath(); c.fillStyle = shade(liv.c1, -0.12); c.fill();
}

function paintStab(c, T, liv, g, side) {
  const pts = side > 0 ? g.stab : mirrorPts(g.stab);
  const gr = c.createLinearGradient(side * g.stab[0][0], 0, side * g.stab[1][0], 0);
  gr.addColorStop(0, '#f2f5f7'); gr.addColorStop(1, '#c8d1da');
  c.beginPath(); polyPath(c, pts); c.fillStyle = gr; c.fill();
  c.save(); c.beginPath(); polyPath(c, pts); c.clip();
  c.fillStyle = liv.c1; const sx = g.stab[1][0] * 0.78;
  c.fillRect(side > 0 ? sx : -g.stab[1][0] - 1, -200, g.stab[1][0] - sx + 1, 400);
  c.restore();
  c.beginPath(); polyPath(c, pts); c.strokeStyle = PLANE_EDGE; c.lineWidth = Math.max(0.25, T.L / 300); c.stroke();
}

function paintEngine(c, T, liv, e, side) {
  const x = side * e.x, w = e.w, len = e.len, y = e.y;
  const gr = c.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
  gr.addColorStop(0, '#f4f6f8'); gr.addColorStop(0.45, '#dde3e9'); gr.addColorStop(1, '#a9b3be');
  c.beginPath(); rr(c, x - w / 2, y, w, len, w * 0.46); c.fillStyle = gr; c.fill();
  c.save(); c.beginPath(); rr(c, x - w / 2, y, w, len, w * 0.46); c.clip();
  c.fillStyle = liv.c1; c.fillRect(x - w, y - 1, w * 2, len * 0.2);                 // coloured lip
  c.beginPath(); c.ellipse(x, y + len * 0.015, w * 0.4, len * 0.065, 0, 0, TAU);   // intake opening
  c.fillStyle = '#1a2130'; c.fill();
  c.beginPath(); c.moveTo(x - w * 0.2, y + len * 0.3); c.lineTo(x - w * 0.2, y + len * 0.82);
  c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = w * 0.13; c.stroke();     // highlight
  c.beginPath(); c.ellipse(x, y + len * 0.97, w * 0.27, len * 0.055, 0, 0, TAU);   // exhaust
  c.fillStyle = '#4b5460'; c.fill();
  c.restore();
  c.beginPath(); rr(c, x - w / 2, y, w, len, w * 0.46);
  c.strokeStyle = PLANE_EDGE; c.lineWidth = Math.max(0.25, T.L / 300); c.stroke();
}

function paintLivery(c, T, liv, g) {          // clipped to the fuselage by the caller
  const L = T.L, h = g.h, n = -L / 2, big = h + 2;
  c.fillStyle = liv.c1; c.strokeStyle = liv.c2; c.lineWidth = Math.max(0.5, L / 95);
  if (liv.pat === 'cone') {
    c.beginPath(); c.moveTo(-big, L * 0.3); c.quadraticCurveTo(0, L * 0.245, big, L * 0.3);
    c.lineTo(big, L); c.lineTo(-big, L); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(-big, L * 0.275); c.quadraticCurveTo(0, L * 0.22, big, L * 0.275); c.stroke();
  } else if (liv.pat === 'split') {
    c.beginPath(); c.moveTo(-big, L * 0.1); c.lineTo(big, L * 0.31); c.lineTo(big, L); c.lineTo(-big, L); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(-big, L * 0.075); c.lineTo(big, L * 0.285); c.stroke();
  } else if (liv.pat === 'stripe') {
    c.beginPath(); c.moveTo(0, n + L * 0.2); c.lineTo(h * 0.24, n + L * 0.27); c.lineTo(h * 0.24, L * 0.34);
    c.lineTo(h * 0.5, L * 0.5); c.lineTo(-h * 0.5, L * 0.5); c.lineTo(-h * 0.24, L * 0.34); c.lineTo(-h * 0.24, n + L * 0.27); c.closePath(); c.fill();
    c.lineWidth = Math.max(0.35, L / 150);
    [-1, 1].forEach(s => { c.beginPath(); c.moveTo(s * h * 0.46, n + L * 0.3); c.lineTo(s * h * 0.46, L * 0.3); c.stroke(); });
  } else {                                              // 'wing': thin cheat-lines + coloured tail cone
    c.beginPath(); c.moveTo(-big, L * 0.36); c.lineTo(big, L * 0.36); c.lineTo(big, L); c.lineTo(-big, L); c.closePath(); c.fill();
    c.lineWidth = Math.max(0.4, L / 130); c.strokeStyle = liv.c1;
    [-1, 1].forEach(s => { c.beginPath(); c.moveTo(s * h * 0.6, n + L * 0.24); c.lineTo(s * h * 0.6, L * 0.33); c.stroke(); });
  }
}

function paintFuselage(c, T, liv, g) {
  const L = T.L, h = g.h, n = -L / 2;
  const fg = c.createLinearGradient(-h, 0, h, 0);
  fg.addColorStop(0, '#d9e0e7'); fg.addColorStop(0.3, '#ffffff'); fg.addColorStop(0.62, '#f0f3f6'); fg.addColorStop(1, '#b7c2cd');
  c.beginPath(); fusePath(c, T); c.fillStyle = fg; c.fill();
  c.save(); c.beginPath(); fusePath(c, T); c.clip();
  paintLivery(c, T, liv, g);
  const sh = c.createLinearGradient(-h, 0, h, 0);        // soft cylinder shading over the paint
  sh.addColorStop(0, 'rgba(255,255,255,0.18)'); sh.addColorStop(0.35, 'rgba(255,255,255,0.0)');
  sh.addColorStop(0.7, 'rgba(0,0,0,0.0)'); sh.addColorStop(1, 'rgba(10,20,40,0.22)');
  c.fillStyle = sh; c.fillRect(-h - 1, n - 1, 2 * h + 2, L + 2);
  // windows
  c.fillStyle = 'rgba(28,48,78,0.42)';
  const step = L * 0.033, wy0 = n + L * 0.2, wy1 = L * 0.3;
  for (let y = wy0; y < wy1; y += step) {
    if (Math.abs(y - (-L * 0.01)) < step * 1.4) continue;       // over-wing exit gap
    [-1, 1].forEach(s => { c.beginPath(); rr(c, s * h * 0.7 - 0.28, y, 0.56, step * 0.5, 0.25); c.fill(); });
  }
  c.restore();
  // doors
  c.strokeStyle = 'rgba(30,44,60,0.5)'; c.lineWidth = Math.max(0.22, L / 330);
  [n + L * 0.17, L * 0.22].forEach(y => [-1, 1].forEach(s => { c.beginPath(); rr(c, s * (h - 1.15), y, 1.0, L * 0.03, 0.4); c.stroke(); }));
  // windscreen
  const wy = n + L * 0.058, wh = L * 0.042;
  c.beginPath(); c.moveTo(-h * 0.44, wy); c.lineTo(h * 0.44, wy); c.lineTo(h * 0.8, wy + wh); c.lineTo(-h * 0.8, wy + wh); c.closePath();
  c.fillStyle = '#16263e'; c.fill();
  c.beginPath(); c.moveTo(-h * 0.34, wy + 0.25); c.lineTo(-h * 0.05, wy + 0.25); c.lineTo(-h * 0.14, wy + wh * 0.5); c.lineTo(-h * 0.56, wy + wh * 0.5); c.closePath();
  c.fillStyle = 'rgba(190,220,255,0.35)'; c.fill();
  c.beginPath(); fusePath(c, T); c.strokeStyle = PLANE_EDGE; c.lineWidth = Math.max(0.28, L / 250); c.stroke();
}

function paintFin(c, T, liv, g) {
  const L = T.L, fw = Math.max(1.6, T.fw * 0.3), y0 = L * 0.285, y1 = L * 0.485;
  const left = (c1) => { c.beginPath(); c.moveTo(0, y0); c.lineTo(-fw / 2, y0 + L * 0.045); c.lineTo(-fw / 2, y1 - L * 0.01); c.lineTo(0, y1); c.closePath(); c.fillStyle = c1; c.fill(); };
  const right = (c1) => { c.beginPath(); c.moveTo(0, y0); c.lineTo(fw / 2, y0 + L * 0.045); c.lineTo(fw / 2, y1 - L * 0.01); c.lineTo(0, y1); c.closePath(); c.fillStyle = c1; c.fill(); };
  left(shade(liv.c1, 0.18)); right(shade(liv.c1, -0.22));
  c.beginPath(); c.moveTo(0, y0); c.lineTo(fw / 2, y0 + L * 0.045); c.lineTo(fw / 2, y1 - L * 0.01); c.lineTo(0, y1); c.lineTo(-fw / 2, y1 - L * 0.01); c.lineTo(-fw / 2, y0 + L * 0.045); c.closePath();
  c.strokeStyle = 'rgba(20,30,45,0.4)'; c.lineWidth = Math.max(0.22, L / 330); c.stroke();
  c.beginPath(); c.ellipse(0, L * 0.5 - 1.3, 0.8, 1.2, 0, 0, TAU); c.fillStyle = '#3d4652'; c.fill();     // APU exhaust
}

function drawPlane(c, T, liv) {
  const g = geom(T);
  c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
  [1, -1].forEach(s => paintStab(c, T, liv, g, s));
  [1, -1].forEach(s => paintWing(c, T, liv, g, s));
  g.engs.forEach(e => [1, -1].forEach(s => paintEngine(c, T, liv, e, s)));
  paintFuselage(c, T, liv, g);
  paintFin(c, T, liv, g);
  c.restore();
}

// mode: 'shadow' | 'body' | undefined (both). hd = heading in radians, 0 = nose up, clockwise.
function drawPlaneAt(c, T, liv, x, y, hd, sc, o = {}) {
  c.save(); c.translate(x, y); c.rotate(hd); if (o.k) c.scale(o.k, o.k);
  if (o.mode !== 'body') castShadow(c, cc => silhouette(cc, T), sc * (o.k || 1), o.sdx ?? 4.5, o.sdy ?? 6.5, o.sblur ?? 5.5, o.sa ?? 0.4);
  if (o.mode !== 'shadow') drawPlane(c, T, liv);
  c.restore();
}
