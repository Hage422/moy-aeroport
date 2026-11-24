// menu_ui.js — menu screens (logical size 956 x 440). Dark navy panels with cut corners, light-blue lines, hexagon icons; pause / settings in frosted glass.
// menus.js — menu screens (logical size 956 x 440, drawn 3x). Dark navy panels with cut corners, light-blue lines, hexagon icons.
const PAL = { line: 'rgba(90,190,255,0.55)', blue: '#44d2ff', bright: '#5fd2ff', muted: '#8ea5c0', green: '#92f26b', gold: '#ffd84a', red: '#ff453a' };

// ---- extra icons (24 x 24 box around 0,0) -----------------------------------------------------
Object.assign(ICONS, {
  regist(c) {                                       // boarding pass with a check mark
    c.beginPath(); rr(c, -10.5, -7, 21, 14, 2.6); c.stroke();
    c.beginPath(); c.moveTo(3.6, -7); c.lineTo(3.6, -4.6); c.moveTo(3.6, -1.2); c.lineTo(3.6, 1.2); c.moveTo(3.6, 4.6); c.lineTo(3.6, 7); c.stroke();
    c.beginPath(); c.moveTo(-7.4, 0.2); c.lineTo(-4.4, 3.2); c.lineTo(-0.2, -2.8); c.stroke();
    c.beginPath(); c.moveTo(6.6, -2.4); c.lineTo(8.2, -2.4); c.moveTo(6.6, 1); c.lineTo(8.2, 1); c.stroke();
  },
  bus(c) {
    c.beginPath(); rr(c, -10.5, -7.5, 21, 14, 3); c.stroke();
    c.beginPath(); c.moveTo(-10.5, -1.6); c.lineTo(10.5, -1.6); c.stroke();
    [-7.2, -1.9, 3.4].forEach(x => { c.beginPath(); rr(c, x, -5.9, 4.2, 3, 0.8); c.fill(); });
    c.beginPath(); c.arc(-5.6, 7.4, 2.2, 0, TAU); c.fill(); c.beginPath(); c.arc(5.6, 7.4, 2.2, 0, TAU); c.fill();
  },
  bridge(c) {                                       // jet bridge: terminal wall, tube, cab
    c.beginPath(); rr(c, -11.5, -7, 5, 14, 1.5); c.fill();
    c.beginPath(); c.moveTo(-6.5, -3); c.lineTo(6, -3); c.moveTo(-6.5, 3); c.lineTo(6, 3); c.stroke();
    c.beginPath(); rr(c, 6, -6, 5, 12, 1.6); c.stroke();
    c.beginPath(); c.moveTo(0, 3); c.lineTo(0, 9); c.moveTo(-2.4, 9); c.lineTo(2.4, 9); c.stroke();
  },
  parking(c) {
    c.beginPath(); octPath(c, 0, 0, 10); c.stroke();
    c.save(); c.font = '800 13px Inter'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('P', 0, 1); c.restore();
  },
  ready(c) { ICONS.takeoff(c); c.beginPath(); c.arc(-8.2, -8.2, 2.5, 0, TAU); c.fill(); },
  beacon(c) {
    c.beginPath(); c.moveTo(-5, 10); c.lineTo(0, -2); c.lineTo(5, 10); c.moveTo(-2.6, 5.6); c.lineTo(2.6, 5.6); c.stroke();
    c.beginPath(); c.arc(0, -4.4, 1.8, 0, TAU); c.fill();
    [5.4, 9].forEach(r => { c.beginPath(); c.arc(0, -4.4, r, -0.7, 0.7); c.stroke(); c.beginPath(); c.arc(0, -4.4, r, Math.PI - 0.7, Math.PI + 0.7); c.stroke(); });
  },
  play(c) { c.beginPath(); c.moveTo(-6, -8); c.lineTo(8.5, 0); c.lineTo(-6, 8); c.closePath(); c.fill(); },
  plus(c) { c.beginPath(); c.moveTo(0, -8); c.lineTo(0, 8); c.moveTo(-8, 0); c.lineTo(8, 0); c.stroke(); },
  trophy(c) {
    c.beginPath(); c.moveTo(-6.5, -9); c.lineTo(6.5, -9); c.lineTo(5.6, -2); c.quadraticCurveTo(4.6, 2.6, 0, 3); c.quadraticCurveTo(-4.6, 2.6, -5.6, -2); c.closePath(); c.stroke();
    c.beginPath(); c.moveTo(0, 3); c.lineTo(0, 7.5); c.moveTo(-4.2, 9.5); c.lineTo(4.2, 9.5); c.stroke();
    c.beginPath(); c.moveTo(-6.2, -6.6); c.quadraticCurveTo(-11.4, -6.6, -9.6, -2); c.quadraticCurveTo(-8.6, 0.6, -5.8, 0.4); c.stroke();
    c.beginPath(); c.moveTo(6.2, -6.6); c.quadraticCurveTo(11.4, -6.6, 9.6, -2); c.quadraticCurveTo(8.6, 0.6, 5.8, 0.4); c.stroke();
  },
  gear(c) {
    c.beginPath(); c.arc(0, 0, 5.6, 0, TAU); c.stroke(); c.beginPath(); c.arc(0, 0, 2, 0, TAU); c.stroke();
    for (let i = 0; i < 8; i++) { const a = i * TAU / 8 + 0.39; c.beginPath(); c.moveTo(Math.cos(a) * 6.6, Math.sin(a) * 6.6); c.lineTo(Math.cos(a) * 10, Math.sin(a) * 10); c.stroke(); }
  },
  back(c) { c.beginPath(); c.moveTo(4, -8); c.lineTo(-4.5, 0); c.lineTo(4, 8); c.stroke(); },
  lock(c) { c.beginPath(); rr(c, -7, -1, 14, 10.5, 2.2); c.fill(); c.beginPath(); c.arc(0, -2, 4.4, Math.PI, 0); c.stroke(); },
  check(c) { c.beginPath(); c.moveTo(-7, 0.5); c.lineTo(-2.5, 5.2); c.lineTo(7, -5.6); c.stroke(); },
  hourglass(c) {
    c.beginPath(); c.moveTo(-6.5, -9); c.lineTo(6.5, -9); c.moveTo(-6.5, 9); c.lineTo(6.5, 9); c.stroke();
    c.beginPath(); c.moveTo(-5, -9); c.lineTo(-5, -5); c.lineTo(0, 0); c.lineTo(-5, 5); c.lineTo(-5, 9); c.moveTo(5, -9); c.lineTo(5, -5); c.lineTo(0, 0); c.lineTo(5, 5); c.lineTo(5, 9); c.stroke();
    c.beginPath(); c.moveTo(-3, 7); c.lineTo(3, 7); c.lineTo(0, 3.6); c.closePath(); c.fill();
  },
  info(c) { c.beginPath(); c.arc(0, 0, 9.5, 0, TAU); c.stroke(); c.beginPath(); c.arc(0, -4.4, 1.4, 0, TAU); c.fill(); c.beginPath(); c.moveTo(0, -0.9); c.lineTo(0, 5.4); c.stroke(); },
  home(c) {
    c.beginPath(); c.moveTo(-10, 0); c.lineTo(0, -9); c.lineTo(10, 0); c.stroke();
    c.beginPath(); c.moveTo(-7, -1.5); c.lineTo(-7, 9); c.lineTo(-2.4, 9); c.lineTo(-2.4, 3.5); c.lineTo(2.4, 3.5); c.lineTo(2.4, 9); c.lineTo(7, 9); c.lineTo(7, -1.5); c.stroke();
  },
});

// ---- helpers ----------------------------------------------------------------------------------
function logical(c, W) { c.setTransform(W / 956, 0, 0, W / 956, 0, 0); }
function chamfer(c, x, y, w, h, cut) {              // rectangle with cut corners (echoes the octagon stands)
  c.moveTo(x + cut, y); c.lineTo(x + w - cut, y); c.lineTo(x + w, y + cut); c.lineTo(x + w, y + h - cut);
  c.lineTo(x + w - cut, y + h); c.lineTo(x + cut, y + h); c.lineTo(x, y + h - cut); c.lineTo(x, y + cut); c.closePath();
}
function panel(c, x, y, w, h, o = {}) {
  c.save(); c.beginPath(); chamfer(c, x, y, w, h, o.cut ?? 12);
  c.shadowColor = 'rgba(0,0,0,0.45)'; c.shadowBlur = o.blur ?? 16; c.shadowOffsetY = 4;
  const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, o.top || 'rgba(26,40,66,0.95)'); g.addColorStop(1, o.bot || 'rgba(10,17,32,0.95)');
  c.fillStyle = g; c.fill(); c.shadowColor = 'transparent';
  c.lineJoin = 'round'; c.strokeStyle = o.stroke || PAL.line; c.lineWidth = o.lw || 1.2; c.stroke(); c.restore();
}
function measure(c, s, size, w = 700) { c.save(); c.font = `${w} ${size}px Inter`; const m = c.measureText(s).width; c.restore(); return m; }
function txt(c, s, x, y, o = {}) {
  c.save(); c.font = `${o.w || 700} ${o.s || 12}px Inter`; c.fillStyle = o.col || '#fff'; c.textBaseline = o.b || 'middle';
  if (o.shadow) { c.shadowColor = 'rgba(0,0,0,0.55)'; c.shadowBlur = 8; c.shadowOffsetY = 2; }
  if (o.sp) {
    const ch = [...s], ws = ch.map(k => c.measureText(k).width), tot = ws.reduce((a, b) => a + b, 0) + o.sp * (ch.length - 1);
    let px = o.a === 'center' ? x - tot / 2 : o.a === 'right' ? x - tot : x; c.textAlign = 'left';
    ch.forEach((k, i) => { c.fillText(k, px, y); px += ws[i] + o.sp; });
  } else { c.textAlign = o.a || 'left'; c.fillText(s, x, y); }
  c.restore();
}
function wrapLines(c, s, size, maxW, w = 700) {
  c.save(); c.font = `${w} ${size}px Inter`; const words = s.split(' '), lines = []; let cur = '';
  words.forEach(t => { const u = cur ? cur + ' ' + t : t; if (c.measureText(u).width > maxW && cur) { lines.push(cur); cur = t; } else cur = u; });
  if (cur) lines.push(cur); c.restore(); return lines;
}
function mButton(c, x, y, w, h, label, o = {}) {
  if (o.id) hit(o.id, x, y, w, h);
  const kind = o.kind || 'dark', fs = o.fs || 17, cut = o.cut ?? 9;
  c.save(); c.beginPath(); chamfer(c, x, y, w, h, cut);
  c.shadowColor = 'rgba(0,0,0,0.5)'; c.shadowBlur = 10; c.shadowOffsetY = 3;
  const F = { primary: ['#74e2ff', '#1c9de2'], green: ['#a9f87e', '#3cb238'], danger: ['rgba(74,22,30,0.96)', 'rgba(42,10,18,0.96)'], off: ['rgba(26,34,48,0.85)', 'rgba(14,20,32,0.85)'], dark: ['rgba(32,48,80,0.96)', 'rgba(12,20,38,0.96)'] }[kind];
  const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, F[0]); g.addColorStop(1, F[1]); c.fillStyle = g; c.fill(); c.shadowColor = 'transparent';
  c.lineJoin = 'round'; c.lineWidth = 1.3;
  c.strokeStyle = { primary: 'rgba(215,247,255,0.95)', green: 'rgba(225,255,205,0.9)', danger: '#ff5a4f', off: 'rgba(90,110,140,0.45)', dark: PAL.line }[kind]; c.stroke();
  if (kind === 'primary' || kind === 'green') { c.save(); c.beginPath(); chamfer(c, x + 1.5, y + 1.5, w - 3, h / 2 - 1, cut - 1); c.clip(); c.fillStyle = 'rgba(255,255,255,0.22)'; c.fillRect(x, y, w, h / 2); c.restore(); }
  const col = { primary: '#05223a', green: '#0a2a0a', danger: '#ff8f85', off: '#6f8199', dark: '#ffffff' }[kind];
  const lw = label ? measure(c, label, fs, 800) : 0, gap = o.icon && label ? 12 : 0, isz = o.is || 22, total = lw + (o.icon ? isz + gap : 0), x0 = x + w / 2 - total / 2;
  if (o.icon) { c.save(); c.translate(x0 + isz / 2, y + h / 2); drawIcon(c, o.icon, isz, col, 2.3); c.restore(); }
  if (label) txt(c, label, x0 + (o.icon ? isz + gap : 0), y + h / 2 + 0.8, { s: fs, w: 800, col });
  c.restore();
}
function drawStar(c, x, y, R, on) {
  c.save(); c.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? R * 0.46 : R; i ? c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r) : c.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
  c.closePath(); c.lineJoin = 'round';
  if (on) { const g = c.createLinearGradient(0, y - R, 0, y + R); g.addColorStop(0, '#ffeb8f'); g.addColorStop(1, '#ffb11f'); c.fillStyle = g; c.shadowColor = 'rgba(255,190,40,0.55)'; c.shadowBlur = R * 0.7; c.fill(); c.shadowColor = 'transparent'; c.strokeStyle = '#fff3bd'; c.lineWidth = Math.max(1, R * 0.08); c.stroke(); }
  else { c.fillStyle = 'rgba(20,30,50,0.7)'; c.fill(); c.strokeStyle = 'rgba(120,150,190,0.55)'; c.lineWidth = Math.max(1, R * 0.1); c.stroke(); }
  c.restore();
}
function iconHex(c, x, y, R, icon, o = {}) {        // hexagon with a rim (rainbow = bought) and an icon
  c.save(); c.beginPath(); hexPath(c, x, y, R, -Math.PI / 2);
  const g = c.createLinearGradient(x, y - R, x, y + R); g.addColorStop(0, 'rgba(40,52,78,0.97)'); g.addColorStop(1, 'rgba(14,20,36,0.97)'); c.fillStyle = g; c.fill();
  const p = hexPts(x, y, R - 2.2); c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = o.lw || 3.4;
  for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(p[i][0], p[i][1]); c.lineTo(p[(i + 1) % 6][0], p[(i + 1) % 6][1]); c.strokeStyle = o.rim === 'rainbow' ? RAINBOW[i] : (o.rim || PAL.line); c.stroke(); }
  c.translate(x, y); drawIcon(c, icon, o.is || R, o.col || '#ffffff', 2.1); c.restore();
}
function moneyChip(c, xr, cy, v) {
  const s = String(v) + ' DME€', w = measure(c, s, 15, 800) + 30;
  panel(c, xr - w, cy - 16, w, 32, { cut: 8, blur: 8 }); txt(c, s, xr - w / 2, cy + 0.8, { s: 15, w: 800, col: PAL.green, a: 'center' });
}
function topBar(c, title, sub, money) {
  mButton(c, 64, 8, 42, 38, '', { cut: 8, icon: 'back', is: 20 }); hit('back', 50, 0, 80, 56);
  txt(c, title, 120, sub ? 21 : 28, { s: 22, w: 800, shadow: true });
  if (sub) txt(c, sub, 120, 39, { s: 11.5, w: 700, col: PAL.muted });
  if (money !== undefined) moneyChip(c, 892, 27, money);
}


// ---- hit areas (logical coordinates): every screen draw refills the list --------------------------
let HITS = [];
function hit(id, x, y, w, h) { HITS.push({ id, x, y, w, h }); }
function hitAt(x, y) { for (let i = HITS.length - 1; i >= 0; i--) { const h = HITS[i]; if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) return h; } return null; }

// ---- blur without ctx.filter (Safari has none): shrink by halves, box-blur the small copy, enlarge ----
function boxBlurCanvas(cv, sigma) {
  const w = cv.width, h = cv.height, ctx = cv.getContext('2d'), img = ctx.getImageData(0, 0, w, h), d = img.data, buf = new Uint8ClampedArray(d.length);
  const r = Math.max(1, Math.round((Math.sqrt(4 * sigma * sigma + 1) - 1) / 2)), n = 2 * r + 1;
  const pass = (src, dst, horiz) => {
    const len = horiz ? w : h, lines = horiz ? h : w, stride = horiz ? 4 : w * 4, lstep = horiz ? w * 4 : 4;
    for (let l = 0; l < lines; l++) for (let ch = 0; ch < 3; ch++) {
      const base = l * lstep + ch; let sum = 0;
      for (let k = -r; k <= r; k++) sum += src[base + clamp(k, 0, len - 1) * stride];
      for (let i = 0; i < len; i++) {
        dst[base + i * stride] = sum / n;
        sum += src[base + clamp(i + r + 1, 0, len - 1) * stride] - src[base + clamp(i - r, 0, len - 1) * stride];
      }
    }
  };
  for (let k = 0; k < 3; k++) { pass(d, buf, true); pass(buf, d, false); }
  ctx.putImageData(img, 0, 0);
}
function blurCanvas(src, sigmaDev) {
  const k = Math.max(0, Math.round(Math.log2(Math.max(1, sigmaDev / 2.2)))), W = src.width, H = src.height;
  let cur = src, w = W, h = H;
  for (let i = 0; i < k; i++) {
    const nw = Math.max(16, Math.round(w / 2)), nh = Math.max(16, Math.round(h / 2)), t = newCanvas(nw, nh), tc = t.getContext('2d');
    tc.imageSmoothingEnabled = true; tc.imageSmoothingQuality = 'high'; tc.drawImage(cur, 0, 0, nw, nh); cur = t; w = nw; h = nh;
  }
  if (cur === src) { const t = newCanvas(W, H); t.getContext('2d').drawImage(src, 0, 0); cur = t; }
  boxBlurCanvas(cur, sigmaDev / Math.pow(2, k));
  if (cur.width === W && cur.height === H) return cur;
  const out = newCanvas(W, H), oc = out.getContext('2d'); oc.imageSmoothingEnabled = true; oc.imageSmoothingQuality = 'high'; oc.drawImage(cur, 0, 0, W, H);
  return out;
}

// ---- backdrops -------------------------------------------------------------------------------
const MENU_SCENE = [['A1', 'M', 0], ['A2', 'S', 1], ['B1', 'L', 5], ['B3', 'M', 3], ['C1', 'M', 4], ['D2', 'L', 7], ['T2', 'S', 2], ['L1', 'M', 6], ['L2', 'L', 0], ['R3', 'M', 5], ['T5', 'M', 1], ['R1', 'S', 3]];
function airfieldCanvas(W, H, view, withPlanes = true) {            // a piece of the map with a few parked planes, device size
  const off = newCanvas(W, H), oc = off.getContext('2d'), ws = (956 / MAP_W) * view.zoom;
  oc.fillStyle = '#000'; oc.fillRect(0, 0, W, H); oc.setTransform(W / 956, 0, 0, W / 956, 0, 0);
  drawMapRegion(oc, view.cx, view.cy, ws);
  if (withPlanes) {
    oc.translate(478 - view.cx * ws, 220 - view.cy * ws); oc.scale(ws, ws);
    MENU_SCENE.forEach(([id, k, l]) => { const s = standById(id); blitShadow(oc, SPR.pShadow[k].ground, s.x, s.y, s.hd, 4.5, 6.5, 0.4); });
    MENU_SCENE.forEach(([id, k, l]) => { const s = standById(id); blitRot(oc, SPR.plane[k][l], s.x, s.y, s.hd); });
  }
  return off;
}
function backdrop(c, W, H, view, o = {}) { dimLayer(c, W, H, airfieldCanvas(W, H, view), o); }
function gameBackdrop(c, W, H, snap, o = {}) { dimLayer(c, W, H, snap, o); }
function dimLayer(c, W, H, off, o) {
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
  const img = o.blur ? blurCanvas(off, o.blur * W / 956) : off;
  if (o.exact) c.drawImage(img, 0, 0, W, H); else c.drawImage(img, -W * 0.02, -H * 0.02, W * 1.04, H * 1.04);
  c.fillStyle = `rgba(7,13,26,${o.dim ?? 0.55})`; c.fillRect(0, 0, W, H);
  if (o.tint) { c.fillStyle = o.tint; c.fillRect(0, 0, W, H); }
  if (o.flat) { c.fillStyle = o.flat; c.fillRect(0, 0, W, H); }
  if (o.grad) { const g = c.createLinearGradient(0, 0, W, 0); g.addColorStop(0, 'rgba(7,13,26,0.8)'); g.addColorStop(0.5, 'rgba(7,13,26,0.3)'); g.addColorStop(1, 'rgba(7,13,26,0.05)'); c.fillStyle = g; c.fillRect(0, 0, W, H); }
  const v = c.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, W * 0.62); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.5)'); c.fillStyle = v; c.fillRect(0, 0, W, H);
  c.restore(); logical(c, W);
}
const MENU_VIEW = { cx: 1200, cy: 560, zoom: 1.3 };


function slider(c, x0, x1, y, v) {
  const g = c.createLinearGradient(x0, 0, x1, 0);
  [[0, '#72cfe9'], [0.3, '#66ceda'], [0.5, '#76d8bf'], [0.7, '#90e29f'], [0.85, '#a5ed86'], [1, '#b0f07a']].forEach(([t, k]) => g.addColorStop(t, k));
  c.save(); c.lineCap = 'round'; c.lineWidth = 3.3;
  c.strokeStyle = 'rgba(255,255,255,0.14)'; c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke();
  c.strokeStyle = g; c.beginPath(); c.moveTo(x0, y); c.lineTo(x0 + (x1 - x0) * v, y); c.stroke();
  c.beginPath(); c.arc(x0 + (x1 - x0) * v, y, 3.7, 0, TAU); c.fillStyle = '#d6dadb'; c.shadowColor = 'rgba(0,0,0,0.45)'; c.shadowBlur = 2.5; c.fill(); c.restore();
}
function glassEdge(c, x, y, w, h, r, a0, a1, a2, rgb = '255,255,255') {   // thin outline: bright at the left end (alpha a0), faint after 12% (a1), faintest at the right end (a2)
  const g = c.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, `rgba(${rgb},${a0})`); g.addColorStop(0.12, `rgba(${rgb},${a1})`); g.addColorStop(1, `rgba(${rgb},${a2})`);
  c.save(); c.beginPath(); rr(c, x, y, w, h, r); c.strokeStyle = g; c.lineWidth = 0.85; c.stroke(); c.restore();
}
function panelEdge(c, x, y, w, h, r) {                      // the big panel outline: strong light at the top-left corner, a weaker one at the bottom-right
  const A = a => `rgba(255,255,255,${a})`;
  const parts = [
    { clip: [x - 3, y - 3, w + 6, r + 3], dir: 'x', stops: [[0, .74], [.037, .83], [.112, .65], [.187, .52], [.26, .39], [.336, .27], [.41, .16], [.485, .086], [.56, .014], [.62, 0], [1, 0]] },
    { clip: [x - 3, y + h - r, w + 6, r + 3], dir: 'x', stops: [[0, .145], [.075, .08], [.15, .04], [.26, 0], [.3, 0], [.37, .03], [.56, .06], [.71, .12], [.82, .18], [.9, .25], [1, .27]] },
    { clip: [x - 3, y + r, w / 2 + 3, h - 2 * r], dir: 'y', stops: [[0, .47], [.5, .29], [.75, .19], [1, .12]] },
    { clip: [x + w / 2, y + r, w / 2 + 3, h - 2 * r], dir: 'y', stops: [[0, .03], [.37, .075], [.56, .12], [.74, .17], [.93, .22], [1, .26]] },
  ];
  parts.forEach(P => {
    c.save(); c.beginPath(); c.rect(...P.clip); c.clip();
    const g = P.dir === 'x' ? c.createLinearGradient(x, 0, x + w, 0) : c.createLinearGradient(0, y, 0, y + h);
    P.stops.forEach(([t, a]) => g.addColorStop(t, A(a)));
    c.beginPath(); rr(c, x, y, w, h, r); c.strokeStyle = g; c.lineWidth = 0.9; c.stroke(); c.restore();
  });
}
function glassPanel(c, W, px, py, pw, ph, pr, o = {}) {                    // frosted glass over whatever is on the canvas now
  c.save(); c.beginPath(); rr(c, px, py, pw, ph, pr); c.clip();
  const bl = o.blur ?? 1.6;
  if (bl > 0.4) {
    const snap = newCanvas(c.canvas.width, c.canvas.height); snap.getContext('2d').drawImage(c.canvas, 0, 0);
    c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(blurCanvas(snap, bl * W / 956), 0, 0); logical(c, W);
  }
  if (o.shade) { c.fillStyle = `rgba(6,10,18,${o.shade})`; c.fillRect(px, py, pw, ph); }
  c.fillStyle = 'rgba(255,255,255,0.075)';                                                // gloss: the upper ~45% is lighter, with a hard lower edge
  c.beginPath(); c.moveTo(px, py); c.lineTo(px + pw, py); c.lineTo(px + pw, py + ph * 0.445); c.lineTo(px, py + ph * 0.46); c.closePath(); c.fill();
  c.restore();
  panelEdge(c, px, py, pw, ph, pr);
  c.save(); c.translate(px + 31, py); c.scale(1, 0.2);                                    // little bloom on the top edge, near the left corner
  const g = c.createRadialGradient(0, 0, 0, 0, 0, 22); g.addColorStop(0, 'rgba(220,235,255,0.62)'); g.addColorStop(0.4, 'rgba(200,220,255,0.25)'); g.addColorStop(1, 'rgba(190,210,255,0)');
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, 22, 0, TAU); c.fill(); c.restore();
}
function glassButton(c, bx, by, bw, bh, label, kind, id) {
  const red = kind === 'danger'; if (id) hit(id, bx, by, bw, bh);
  c.save(); c.beginPath(); rr(c, bx, by, bw, bh, 2.5); c.clip();
  c.fillStyle = red ? 'rgba(80,14,18,0.36)' : 'rgba(8,14,24,0.22)'; c.fillRect(bx, by, bw, bh);
  c.fillStyle = red ? 'rgba(255,120,110,0.09)' : 'rgba(255,255,255,0.075)'; c.fillRect(bx, by, bw, bh * 0.4);      // gloss on the upper part
  c.restore();
  glassEdge(c, bx, by, bw, bh, 2.5, red ? 0.6 : 0.4, red ? 0.16 : 0.08, red ? 0.13 : 0.06, red ? '255,110,100' : '255,255,255');
  txt(c, label, bx + bw / 2, by + bh / 2 + 0.45, { s: 14.45, w: 600, a: 'center', col: red ? '#ff9b92' : '#ffffff' });
}
// the common look of pause and settings: title, subtitle, difficulty row, two slider rows, two buttons under the panel
function glassScreen(c, W, H, o, withDyn = true) {                         // static part: panel, title, rows, buttons
  const px = 239, py = 120.3, pw = 480.5, ph = 200.9, pr = 8;
  glassPanel(c, W, px, py, pw, ph, pr);
  txt(c, o.title, 478.4, 147.0, { s: 25.65, w: 700, a: 'center' });
  txt(c, o.sub, 478.4, 171.3, { s: 11.45, w: 700, a: 'center', col: '#e9f2fa' });
  const rx = 321.9, rw = 311.5, rh = 37.5, ry = [180.7, 221.9, 264.3];
  const row = (y) => {                                                                    // transparent row with a thin outline
    c.save(); c.beginPath(); rr(c, rx, y, rw, rh, 2); const g = c.createLinearGradient(0, y, 0, y + rh);
    g.addColorStop(0, 'rgba(255,255,255,0.03)'); g.addColorStop(1, 'rgba(0,0,0,0.05)'); c.fillStyle = g; c.fill(); c.restore();
    glassEdge(c, rx, y, rw, rh, 2, 0.31, 0.07, 0.03);
  };
  row(ry[0]); [0, 1, 2].forEach(i => hit('diff' + i, [323, 426, 529][i], ry[0], 103, rh));
  hit('sound', 322, ry[1], 311, rh); row(ry[1]); txt(c, 'ЗВУК', 346, 241.3, { s: 13.75, w: 700 });
  hit('music', 322, ry[2], 311, rh); row(ry[2]); txt(c, 'МУЗЫКА', 346, 284.3, { s: 13.75, w: 700 });
  glassButton(c, 236.8, 324.9, 238.2, 38.1, o.btn[0][0], o.btn[0][1], o.btn[0][2]);
  glassButton(c, 481, 324.9, 237.5, 38.1, o.btn[1][0], o.btn[1][1], o.btn[1][2]);
  if (withDyn) glassDyn(c, o);
}
// changing part: the chosen difficulty and the two sliders (redrawn on top of the cached static part)
function glassDyn(c, o) {
  const ry = [180.7, 221.9, 264.3], rh = 37.5;
  const opts = ['Легко', 'Нормально', 'Сложно'], ocx = [374.9, 477.7, 580.3], sel = o.diff;
  const gcx = ocx[sel], gx = c.createLinearGradient(gcx - 44, 0, gcx + 44, 0);          // soft teal glow behind the chosen option
  for (let k = 0; k <= 10; k++) { const d = (k / 10 - 0.5) * 88; gx.addColorStop(k / 10, `rgba(35,175,190,${(0.32 * Math.exp(-d * d / (2 * 18.5 * 18.5))).toFixed(3)})`); }
  c.fillStyle = gx; c.fillRect(gcx - 44, ry[0] + 1, 88, rh - 2);
  opts.forEach((s, i) => txt(c, s, ocx[i], 200.2, { s: 14.1, w: 600, a: 'center', col: i === sel ? '#a2ec5e' : '#70dbe6' }));
  slider(c, 438.4, 608, 242.4, o.sound); slider(c, 438.4, 608, 285.2, o.music);
}

// ---- screens ---------------------------------------------------------------------------------
function screenMain(c, W, H) {
  backdrop(c, W, H, { cx: 1500, cy: 520, zoom: 1.7 }, { blur: 3, dim: 0.3, grad: true, tint: 'rgba(18,72,170,0.36)' });
  const ex = 152, ey = 108;                                           // emblem
  c.save(); c.beginPath(); c.arc(ex, ey, 40, 0, TAU); c.shadowColor = 'rgba(0,0,0,0.5)'; c.shadowBlur = 14; c.fillStyle = 'rgba(11,18,33,0.88)'; c.fill(); c.shadowColor = 'transparent';
  c.strokeStyle = PAL.bright; c.lineWidth = 3; c.stroke();
  c.setLineDash([0.1, 5.2]); c.lineCap = 'round'; c.lineWidth = 1.8; c.strokeStyle = 'rgba(95,210,255,0.8)'; c.beginPath(); c.arc(ex, ey, 33, 0, TAU); c.stroke(); c.setLineDash([]);
  c.translate(ex, ey); c.rotate(38 * Math.PI / 180); c.scale(0.5, 0.5); c.fillStyle = '#ffffff'; c.beginPath(); silhouette(c, { L: 64, S: 62, fw: 7.6, engW: 6 }); c.fill(); c.restore();
  txt(c, 'МОЙ', 86, 178, { s: 24, w: 800, col: PAL.blue, sp: 9, shadow: true });
  txt(c, 'АЭРОПОРТ', 83, 228, { s: 58, w: 800, shadow: true });
  c.save(); c.fillStyle = PAL.bright; c.fillRect(86, 270, 150, 3); c.fillStyle = 'rgba(95,210,255,0.4)'; c.fillRect(242, 270, 70, 3); c.restore();
  const B = [['Продолжить', 'play', 'primary', 'continue'], ['Новая игра', 'plus', 'dark', 'new'], ['Рекорды', 'trophy', 'dark', 'records'], ['Настройки', 'gear', 'dark', 'settings']];
  B.forEach((b, i) => mButton(c, 584, 104 + i * 62, 290, 50, b[0], { kind: b[2], icon: b[1], fs: 18, id: b[3] }));
}

function levelList() {
  const out = [];
  for (let n = 1; n <= 12; n++) {
    if (n > PLAYABLE_LEVELS) out.push({ n, state: 'soon' });
    else { const st = levelStars(n); out.push({ n, name: LEVEL_DEFS[n - 1].name, state: st > 0 ? 'done' : levelUnlocked(n) ? 'open' : 'locked', stars: st }); }
  }
  return out;
}
function levelCard(c, x, y, w, h, L) {
  const soon = L.state === 'soon', locked = L.state === 'locked', open = L.state === 'open', done = L.state === 'done';
  if (!soon) hit('lv' + L.n, x, y, w, h);
  panel(c, x, y, w, h, {
    cut: 12, blur: open ? 20 : 10, lw: open ? 2.4 : 1.2, stroke: open ? PAL.bright : soon ? 'rgba(90,120,160,0.28)' : PAL.line,
    top: soon ? 'rgba(20,28,46,0.72)' : open ? 'rgba(36,70,110,0.97)' : 'rgba(28,42,70,0.95)', bot: soon ? 'rgba(10,16,28,0.72)' : open ? 'rgba(14,34,64,0.97)' : 'rgba(10,17,32,0.95)',
  });
  const cx = x + w / 2, cy = y + 47, R = 29;
  c.save(); c.beginPath(); hexPath(c, cx, cy, R, -Math.PI / 2);
  const g = c.createLinearGradient(cx, cy - R, cx, cy + R);
  if (done || open) { g.addColorStop(0, '#79e4ff'); g.addColorStop(1, '#1e9fe2'); } else { g.addColorStop(0, 'rgba(46,58,82,0.9)'); g.addColorStop(1, 'rgba(24,32,50,0.9)'); }
  c.fillStyle = g; c.fill(); c.lineJoin = 'round'; c.lineWidth = 1.6; c.strokeStyle = (done || open) ? 'rgba(220,248,255,0.9)' : 'rgba(110,135,170,0.45)'; c.stroke(); c.restore();
  if (locked) { c.save(); c.translate(cx, cy); drawIcon(c, 'lock', 24, '#9fb4cc', 2.2); c.restore(); }
  else txt(c, String(L.n), cx, cy + 1, { s: 28, w: 800, a: 'center', col: soon ? '#5f728c' : '#05223a' });
  if (soon) txt(c, 'Скоро', cx, y + 102, { s: 12.5, w: 700, a: 'center', col: '#6f84a0' });
  else txt(c, L.name, cx, y + 102, { s: 12.5, w: 700, a: 'center', col: locked ? '#9db2cb' : '#ffffff' });
  if (done || open) for (let i = 0; i < 3; i++) drawStar(c, cx + (i - 1) * 26, y + h - 25, 9.5, i < L.stars);
  if (locked) txt(c, 'Закрыт', cx, y + h - 25, { s: 11, w: 700, a: 'center', col: '#6f84a0' });
}
function screenLevels(c, W, H) {
  backdrop(c, W, H, MENU_VIEW, { blur: 4, dim: 0.5, tint: 'rgba(18,64,150,0.32)' });
  topBar(c, 'Выбор уровня', undefined, SAVE.money);
  levelList().forEach((L, i) => levelCard(c, 64 + (i % 6) * 140, 62 + Math.floor(i / 6) * 162, 128, 150, L));
  txt(c, 'Пройдите уровень, чтобы открыть следующий', 478, 398, { s: 12, w: 700, a: 'center', col: PAL.muted });
}

function upgCard(c, x, y, w, h, U, sel, idx) {
  const bought = !!SAVE.upg[U.id], afford = SAVE.money >= U.price && !bought;
  hit('up' + idx, x, y, w, h);
  panel(c, x, y, w, h, { cut: 12, blur: sel ? 20 : 10, lw: sel ? 2.4 : 1.2, stroke: sel ? PAL.bright : PAL.line, top: sel ? 'rgba(36,70,110,0.97)' : undefined, bot: sel ? 'rgba(14,34,64,0.97)' : undefined });
  iconHex(c, x + w / 2, y + 38, 27, U.icon, { rim: bought ? 'rainbow' : PAL.bright, is: 27 });
  const lines = wrapLines(c, U.name, 11.5, w - 16), y0 = y + 87 - (lines.length - 1) * 7;
  lines.forEach((s, i) => txt(c, s, x + w / 2, y0 + i * 14, { s: 11.5, a: 'center' }));
  if (bought) { const tw = measure(c, 'Куплено', 12, 800); c.save(); c.translate(x + w / 2 - tw / 2 - 9, y + h - 17); drawIcon(c, 'check', 13, PAL.blue, 2.6); c.restore(); txt(c, 'Куплено', x + w / 2 + 6, y + h - 16, { s: 12, w: 800, a: 'center', col: PAL.blue }); }
  else txt(c, U.price + ' DME€', x + w / 2, y + h - 16, { s: 12.5, w: 800, a: 'center', col: afford ? PAL.green : '#ff7d73' });
}
function screenUpgrades(c, W, H) {
  const n = APP.lvPick, def = LEVEL_DEFS[n - 1], SEL = APP.upSel;
  backdrop(c, W, H, MENU_VIEW, { blur: 4, dim: 0.54, tint: 'rgba(18,64,150,0.32)' });
  topBar(c, 'Улучшения', 'Уровень ' + n + ' · ' + def.name, SAVE.money);
  const cw = 128, ch = 132, gx = 12;
  UPGRADES.forEach((U, i) => {
    const row = i < 6 ? 0 : 1, col = row ? i - 6 : i, off = row ? (6 - 5) * (cw + gx) / 2 : 0;
    upgCard(c, 64 + off + col * (cw + gx), 58 + row * (ch + 12), cw, ch, U, i === SEL, i);
  });
  const S = UPGRADES[SEL], bought = !!SAVE.upg[S.id], afford = SAVE.money >= S.price;
  panel(c, 64, 352, 478, 62, { cut: 10, blur: 10 });
  txt(c, S.name, 82, 369, { s: 13, w: 800, col: PAL.blue });
  wrapLines(c, S.desc, 12, 440).forEach((s, i) => txt(c, s, 82, 388 + i * 15, { s: 12, w: 700 }));
  if (bought) mButton(c, 554, 352, 176, 62, 'Куплено', { kind: 'off', fs: 15, cut: 10, icon: 'check', is: 16 });
  else mButton(c, 554, 352, 176, 62, 'Купить ' + S.price + ' DME€', { kind: afford ? 'green' : 'off', fs: 15, cut: 10, id: 'buy' });
  mButton(c, 742, 352, 150, 62, 'Начать', { kind: 'primary', fs: 20, cut: 10, icon: 'play', is: 18, id: 'start' });
}

function screenRecords(c, W, H) {
  backdrop(c, W, H, MENU_VIEW, { blur: 4, dim: 0.54, tint: 'rgba(18,64,150,0.32)' });
  topBar(c, 'Рекорды');
  const px = 128, pw = 700, py = 62, ph = 340;
  panel(c, px, py, pw, ph, { cut: 16 });
  txt(c, 'УРОВЕНЬ', px + 36, py + 28, { s: 10.5, w: 800, col: PAL.muted, sp: 1.6 });
  txt(c, 'ЗВЁЗДЫ', px + 430, py + 28, { s: 10.5, w: 800, col: PAL.muted, sp: 1.6, a: 'center' });
  txt(c, 'ОЧКИ', px + pw - 36, py + 28, { s: 10.5, w: 800, col: PAL.muted, sp: 1.6, a: 'right' });
  c.save(); c.fillStyle = 'rgba(95,210,255,0.3)'; c.fillRect(px + 28, py + 44, pw - 56, 1.5); c.restore();
  LEVEL_DEFS.forEach((L, i) => {
    const r = SAVE.lv[L.n], y = py + 70 + i * 36;
    c.save(); c.beginPath(); hexPath(c, px + 50, y, 14, -Math.PI / 2); c.fillStyle = r ? PAL.bright : 'rgba(46,58,82,0.9)'; c.fill(); c.restore();
    txt(c, String(L.n), px + 50, y + 1, { s: 14, w: 800, a: 'center', col: r ? '#05223a' : '#6f84a0' });
    txt(c, L.name, px + 78, y + 1, { s: 15, w: 700, col: r ? '#ffffff' : '#6f84a0' });
    for (let k = 0; k < 3; k++) drawStar(c, px + 430 + (k - 1) * 28, y, 9.5, r ? k < r.stars : false);
    txt(c, r ? String(r.score) : '—', px + pw - 36, y + 1, { s: 17, w: 800, a: 'right', col: r ? '#ffffff' : '#6f84a0' });
  });
  c.save(); c.fillStyle = 'rgba(95,210,255,0.3)'; c.fillRect(px + 28, py + ph - 58, pw - 56, 1.5); c.restore();
  txt(c, 'Всего очков', px + 36, py + ph - 31, { s: 14, w: 700, col: PAL.muted });
  txt(c, String(totalScore()), px + pw - 36, py + ph - 31, { s: 20, w: 800, a: 'right', col: PAL.blue });
}

function screenSettings(c, W, H, full = true) {                         // same look as the pause, over the dimmed airfield of the main menu
  backdrop(c, W, H, MENU_VIEW, { blur: 2.4, dim: 0.64, flat: 'rgba(33,40,47,0.25)', tint: 'rgba(18,64,150,0.2)' });
  glassScreen(c, W, H, { title: 'НАСТРОЙКИ', sub: 'Мой аэропорт · версия 0.1', diff: SAVE.set.diff, sound: SAVE.set.sound, music: SAVE.set.music, btn: [['НАЗАД', undefined, 'back'], ['СБРОСИТЬ ПРОГРЕСС', 'danger', 'reset']] }, full);
  hit('ver', 380, 158, 200, 26);
}
function screenPause(c, W, H, full = true) {
  gameBackdrop(c, W, H, APP.snap, { dim: 0.78, exact: true, flat: 'rgba(33,40,47,0.4)' });          // the game screen exactly as it was, just dimmed
  glassScreen(c, W, H, { title: 'ПАУЗА', sub: G.n + '  ' + G.def.name.toUpperCase(), diff: SAVE.set.diff, sound: SAVE.set.sound, music: SAVE.set.music, btn: [['МЕНЮ', undefined, 'menu'], ['ПРОДОЛЖИТЬ', undefined, 'resume']] }, full);
}
const CONFIRMS = {
  exit:  { title: 'ВЫЙТИ В МЕНЮ?', lines: ['Прогресс этого уровня пропадёт.'], no: 'ОСТАТЬСЯ', yes: 'ВЫЙТИ', base: screenPause },
  reset: { title: 'СБРОСИТЬ ПРОГРЕСС?', lines: ['Все уровни, звёзды, улучшения и деньги', 'будут удалены. Это нельзя отменить.'], no: 'ОТМЕНА', yes: 'СБРОСИТЬ', base: screenSettings },
  new:   { title: 'НАЧАТЬ НОВУЮ ИГРУ?', lines: ['Все уровни, звёзды, улучшения и деньги', 'будут удалены. Это нельзя отменить.'], no: 'ОТМЕНА', yes: 'НАЧАТЬ', base: screenMain },
};
function screenConfirm(c, W, H, kind) {                    // small question window over the pause / settings / main menu
  const K = CONFIRMS[kind]; K.base(c, W, H);
  const snap = newCanvas(W, H); snap.getContext('2d').drawImage(c.canvas, 0, 0);
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(blurCanvas(snap, 3.2 * W / 956), 0, 0);        // the whole screen behind the window: blurred and darker
  c.fillStyle = 'rgba(4,8,14,0.38)'; c.fillRect(0, 0, W, H); c.restore(); logical(c, W);
  HITS = []; hit('blocker', 0, 0, 956, 440);
  const pw = 372, ph = K.lines.length > 1 ? 178 : 158, px = 478.4 - pw / 2, py = 220 - ph / 2;
  glassPanel(c, W, px, py, pw, ph, 8, { shade: 0.3, blur: 0 });
  txt(c, K.title, 478.4, py + 34, { s: 19, w: 700, a: 'center' });
  K.lines.forEach((t, i) => txt(c, t, 478.4, py + 64 + i * 17, { s: 12.5, w: 600, a: 'center', col: '#d6e3f0' }));
  const bw = (pw - 48) / 2, by = py + ph - 54;
  glassButton(c, px + 16, by, bw, 38, K.no, undefined, 'no');
  glassButton(c, px + 32 + bw, by, bw, 38, K.yes, 'danger', 'yes');
}

function fmtTime(t) { t = Math.max(0, Math.floor(t)); return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0'); }
function screenResult(c, W, H, win) {
  const o = G.over;
  gameBackdrop(c, W, H, APP.snap, { blur: win ? 7 : 2, dim: 0.46, tint: 'rgba(18,60,140,0.16)' });
  const px = 238, pw = 480, py = 76, ph = 280;
  panel(c, px, py, pw, ph, { cut: 16, stroke: win ? PAL.bright : '#ff5a4f', lw: 1.6 });
  txt(c, win ? 'Уровень пройден!' : 'Уровень не пройден', 478, py + 34, { s: 25, w: 800, a: 'center', col: win ? '#ffffff' : '#ff6b60', shadow: true });
  if (win) txt(c, 'Уровень ' + G.n + ' · ' + G.def.name, 478, py + 58, { s: 12, w: 700, a: 'center', col: PAL.muted });
  else txt(c, o.text, 478, py + 58, { s: 12.5, w: 700, a: 'center', col: '#ff9a90' });
  const stars = win ? o.stars : 0;
  [-1, 0, 1].forEach((k, i) => drawStar(c, 478 + k * 64, py + 104 - (k === 0 ? 6 : 0), k === 0 ? 27 : 22, i < stars));
  const chips = [['НАГРАДА', '+' + (win ? o.reward : 0) + ' DME€', PAL.green], ['ОЧКИ', String(G.score), '#ffffff'], ['ВРЕМЯ', fmtTime(G.t), '#ffffff']];
  chips.forEach((k, i) => {
    const x = px + 26 + i * 146;
    panel(c, x, py + 146, 136, 46, { cut: 8, blur: 6, top: 'rgba(18,28,48,0.9)', bot: 'rgba(8,14,26,0.9)' });
    txt(c, k[0], x + 68, py + 160, { s: 9.5, w: 800, a: 'center', col: PAL.muted, sp: 1.4 });
    txt(c, k[1], x + 68, py + 178, { s: 16, w: 800, a: 'center', col: k[2] });
  });
  if (win) { mButton(c, px + 26, py + 212, 210, 50, 'Далее', { kind: 'primary', fs: 18, icon: 'play', is: 18, id: 'next' }); mButton(c, px + 244, py + 212, 210, 50, 'Ещё раз', { kind: 'dark', fs: 18, id: 'again' }); }
  else { mButton(c, px + 26, py + 212, 210, 50, 'Далее', { kind: 'off', fs: 18, icon: 'lock', is: 18 }); mButton(c, px + 244, py + 212, 210, 50, 'Ещё раз', { kind: 'primary', fs: 18, id: 'again' }); }
}

// draws one menu screen into context c (logical transform already set); fills HITS
function drawMenu(c, W, H, name, arg) {
  HITS = []; logical(c, W);
  c.clearRect(0, 0, W, H);
  ({ main: screenMain, levels: screenLevels, upgrades: screenUpgrades, pause: (a, b, d) => screenPause(a, b, d, false), settings: (a, b, d) => screenSettings(a, b, d, false), records: screenRecords,
     confirm: (a, b, d) => screenConfirm(a, b, d, arg), win: (a, b, d) => screenResult(a, b, d, true), loss: (a, b, d) => screenResult(a, b, d, false) })[name](c, W, H);
}
