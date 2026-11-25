// render.js — draws the running game: map, jet bridges, planes, vehicles, markers and the screen-fixed interface.
// World drawing uses prepared sprites (sprites.js); the interface pieces are cached in small canvases and redrawn only when they change.
let MAPIMG = null;                                         // assets/map.webp (set by app.js)
const VIEW = { cx: MAP_W / 2, cy: MAP_H / 2, zoom: 1 };    // camera: world point in the middle of the screen + zoom (1 = the whole map)
const ZOOM_MAX = 2;
const viewScale = () => (956 / MAP_W) * VIEW.zoom;         // logical px per world unit
function clampView() {
  VIEW.zoom = clamp(VIEW.zoom, 1, ZOOM_MAX);
  const hw = MAP_W / (2 * VIEW.zoom), hh = MAP_H / (2 * VIEW.zoom);
  VIEW.cx = clamp(VIEW.cx, hw, MAP_W - hw); VIEW.cy = clamp(VIEW.cy, hh, MAP_H - hh);
}
function screenToWorld(lx, ly) { const sc = viewScale(); return [VIEW.cx + (lx - 478) / sc, VIEW.cy + (ly - 220) / sc]; }
function worldToScreen(wx, wy) { const sc = viewScale(); return [478 + (wx - VIEW.cx) * sc, 220 + (wy - VIEW.cy) * sc]; }

// a piece of the pre-rendered map; the world point (cx, cy) lands in the middle of the 956 x 440 logical screen, ws = logical px per world unit
function drawMapRegion(c, cx, cy, ws) {
  if (!MAPIMG) { c.fillStyle = '#3d6a33'; c.fillRect(0, 0, 956, 440); return; }
  const k = MAPIMG.width / MAP_W, x0 = cx - 478 / ws, y0 = cy - 220 / ws, x1 = x0 + 956 / ws, y1 = y0 + 440 / ws;
  const a = Math.max(0, x0), b = Math.max(0, y0), e = Math.min(MAP_W, x1), f = Math.min(MAP_H, y1);
  if (e <= a || f <= b) return;
  c.imageSmoothingEnabled = true;
  c.drawImage(MAPIMG, a * k, b * k, (e - a) * k, (f - b) * k, 478 + (a - cx) * ws, 220 + (b - cy) * ws, (e - a) * ws, (f - b) * ws);
}

// ---- small cached canvases for the interface (device resolution = APP.k px per logical px) ----------
const UI_LAYERS = [];
function makeLayer(x, y, w, h) { const L = { x, y, w, h, cv: null, sig: null, k: 0 }; UI_LAYERS.push(L); return L; }
function resetLayers() { UI_LAYERS.forEach(L => { L.cv = null; L.sig = null; }); }
function layerDraw(L, c, sig, fn) {                         // c has the logical transform; fn draws in logical coordinates
  const k = APP.k;
  if (!L.cv || L.k !== k) { L.cv = newCanvas(L.w * k, L.h * k); L.sig = null; L.k = k; }
  if (L.sig !== sig) {
    const lc = L.cv.getContext('2d'); lc.setTransform(1, 0, 0, 1, 0, 0); lc.clearRect(0, 0, L.cv.width, L.cv.height);
    lc.setTransform(k, 0, 0, k, -L.x * k, -L.y * k); fn(lc); L.sig = sig;
  }
  c.drawImage(L.cv, L.x, L.y, L.w, L.h);
}
const L_HUD = makeLayer(212, 0, 534, 42), L_PANEL = makeLayer(280, 340, 396, 100), L_PICK = makeLayer(350, 268, 256, 102);
const L_HINT = makeLayer(138, 32, 680, 60), L_TOAST = makeLayer(238, 78, 480, 44), L_ARROW = makeLayer(840, 34, 56, 56);

// ---- geometry of the jet bridge: f = 0 retracted at the wall, f = 1 docked to the door of a plane of type T -------------
function jetBridgeFor(s, T, f) {
  const a = [Math.sin(s.hd), -Math.cos(s.hd)], left = [a[1], -a[0]], out = s.side;
  const rot = out < 0 ? Math.PI : 0, wx = s.wallX - out * 2, y0 = s.y + left[1] * 12;
  if (!T || f <= 0) return { x: wx, y: y0, rot, len: 12 };
  const door = [s.x + a[0] * T.L * 0.33, s.y + a[1] * T.L * 0.33], cab = [door[0] + left[0] * (T.fw / 2 + 8.8), door[1] + left[1] * (T.fw / 2 + 8.8)];
  const len1 = Math.abs(wx - cab[0]) - 1.75;
  return { x: wx, y: lerp(y0, cab[1], f), rot, len: lerp(12, len1, f) };
}
const BR_SPR = {};
function bridgeSprite(len, rot) {                           // a bridge at rest, with its soft shadow, painted once
  const key = rot + '|' + len.toFixed(1); if (BR_SPR[key]) return BR_SPR[key];
  const pad = 16, w = Math.ceil(len + pad * 2 + 8), h = 40, cv = newCanvas(w * PS, h * PS), c = cv.getContext('2d');
  const sh = newCanvas(w * PS, h * PS), sc = sh.getContext('2d'), s = rot ? -1 : 1;
  sc.translate(pad * PS, h / 2 * PS); sc.scale(PS, PS); sc.translate(2.6 * s, 3.8 * s); sc.fillStyle = 'rgb(8,14,24)'; sc.beginPath(); silJetBridge(sc, len); sc.fill();
  blurAlpha(sh, 1.7 * PS); c.globalAlpha = 0.42; c.drawImage(sh, 0, 0); c.globalAlpha = 1;
  c.translate(pad * PS, h / 2 * PS); c.scale(PS, PS); drawJetBridge(c, len);
  return (BR_SPR[key] = { cv, w: cv.width / PS, h: cv.height / PS, ox: pad, oy: h / 2 });
}
function drawBridge(c, b, moving) {
  c.save(); c.translate(b.x, b.y); c.rotate(b.rot);
  if (moving) {
    c.save(); c.translate(2.6 * (b.rot ? -1 : 1), 3.8 * (b.rot ? -1 : 1)); c.fillStyle = 'rgba(8,14,24,0.3)'; c.beginPath(); silJetBridge(c, b.len); c.fill(); c.restore();
    drawJetBridge(c, b.len);
  } else { const sp = bridgeSprite(Math.round(b.len * 10) / 10, b.rot); c.drawImage(sp.cv, -sp.ox, -sp.oy, sp.w, sp.h); }
  c.restore();
}

// ---- service hexagon (static look cached as a sprite, only the progress ring is drawn live) ------------
const HEX_SPR = {};
function hexSprite(icon, reason) {
  const key = icon + (reason ? '!' : ''); if (HEX_SPR[key]) return HEX_SPR[key];
  const S = 96, K = 2.4, cv = newCanvas(S * K, S * K), c = cv.getContext('2d');
  c.translate(cv.width / 2, cv.height / 2); c.scale(K, K);
  if (reason) drawReasonHex(c, K, 0, 0, icon, 36); else drawServiceHex(c, K, 0, 0, icon, 0, 36);
  return (HEX_SPR[key] = { cv, S });
}
function drawHexAt(c, x, y, icon, frac, reason) {
  const sp = hexSprite(icon, reason); c.drawImage(sp.cv, x - sp.S / 2, y - sp.S / 2, sp.S, sp.S);
  if (!reason && frac !== null) {
    const q = hexPts(x, y, 26); c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = 4.4;
    c.strokeStyle = 'rgba(0,0,0,0.35)'; strokeFraction(c, q, 1);
    if (frac > 0) { c.strokeStyle = '#8bff52'; strokeFraction(c, q, Math.min(1, frac)); }
    c.restore();
  }
}
function hexPos(s) {                                        // where the service hexagon sits: behind the plane (side stands) or in front of it (top row)
  if (s.lane === 'top') return [s.x, s.y + s.r + 46];
  const d = Math.sin(s.hd) >= 0 ? 1 : -1; return [s.x - d * (s.r + 42), s.y];
}

// ---- the world --------------------------------------------------------------------------------------
const GROUND_ST = { parked: 1, taxiIn: 1, depart: 1, hold: 1, waiting: 1 };
function clipOutsideTerminal(c) {                           // vehicles drive out from under the terminal roof
  c.beginPath(); c.rect(-300, -300, MAP_W + 600, MAP_H + 600);
  TERMINAL.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.clip('evenodd');
}
function drawWorld(c, g, sc) {
  const mx = 478 / sc + 150, my = 220 / sc + 150;
  const vis = (x, y) => Math.abs(x - VIEW.cx) < mx && Math.abs(y - VIEW.cy) < my;

  for (const s of STANDS) if (s.kind === 'jet' && vis(s.wallX, s.y)) {                       // jet bridges
    const br = g.bridges[s.id], f = br.f, e = f * f * (3 - 2 * f);
    drawBridge(c, jetBridgeFor(s, br.T && f > 0 ? TYPES[br.T] : null, e), f > 0 && f < 1);
  }

  const veh = g.vehicles.filter(v => vis(v.x, v.y));
  if (veh.length) {                                                                          // vehicles: shadows, then bodies, outside the terminal roof
    c.save(); clipOutsideTerminal(c);
    veh.forEach(v => blitShadow(c, SPR.vShadow[v.k], v.x, v.y, v.hd, 2.6, 3.8, 0.38));
    c.restore();
  }
  const gp = [], ap = [];
  for (const p of g.planes) { if (!vis(p.x, p.y)) continue; (GROUND_ST[p.st] ? gp : ap).push(p); }
  gp.forEach(p => blitShadow(c, SPR.pShadow[p.T].ground, p.x, p.y, p.hd, 4.5, 6.5, 0.4));
  ap.forEach(p => {                                                                          // in the air the shadow slides away and gets softer
    const a = p.alt;
    if (a < 0.98) blitShadow(c, SPR.pShadow[p.T].ground, p.x, p.y, p.hd, 4.5, 6.5, 0.4 * (1 - a));
    if (a > 0.02) blitShadow(c, SPR.pShadow[p.T].air, p.x, p.y, p.hd, 4.5 + 10.5 * a, 6.5 + 14.5 * a, 0.3 * a);
  });
  if (veh.length) { c.save(); clipOutsideTerminal(c); veh.forEach(v => blitRot(c, SPR.veh[v.k], v.x, v.y, v.hd)); c.restore(); }
  gp.forEach(p => blitRot(c, SPR.plane[p.T][p.liv], p.x, p.y, p.hd));
  ap.forEach(p => blitRot(c, SPR.plane[p.T][p.liv], p.x, p.y, p.hd, 1 + 0.14 * p.alt));

  // markers
  const sel = g.sel, T = (g.t * 1000) | 0;
  if (sel && sel.st === 'waiting' && !g.over) {                                              // free stands to choose from
    for (const s of STANDS) if (!g.stands[s.id] && vis(s.x, s.y)) drawTargetStand(c, s);
  }
  if (sel) drawSelection(c, sel.st === 'parked' ? standById(sel.stand) : { x: sel.x, y: sel.y, r: 52 });
  for (const p of g.planes) {
    if (p.st !== 'parked') continue;
    const s = standById(p.stand); if (!vis(s.x, s.y)) continue;
    drawPatienceRing(c, s, clamp(p.patience / p.pmax, 0, 1));
    const h = hexPos(s);
    if (p.svc) drawHexAt(c, h[0], h[1], p.svc.k, p.svc.st === 'work' ? p.svc.t / p.svc.dur : 0);
    else if (p.ready && g.upg.ready) drawHexAt(c, h[0], h[1], 'ready', 1);
  }
  if (g.over && !g.over.win) {                                                               // the small icon at the place that lost the level
    const o = g.over;
    if (o.standId) { const s = standById(o.standId), h = hexPos(s); drawHexAt(c, h[0], h[1], 'hourglass', null, true); }
    else if (o.wx !== undefined) drawHexAt(c, o.wx - 90, o.wy, 'landing', null, true);
  }
}

// ---- the interface (logical 956 x 440 coordinates) ----------------------------------------------------
const PAUSE_HIT = { x: 222, y: 0, w: 112, h: 40 };
const PANEL_HIT = { x: 300, y: 356, w: 356, h: 62 }, PANEL_STEP = 53.2, PANEL_X0 = 345, PANEL_CY = 390;
function panelButtonAt(x, y) {
  if (y < PANEL_HIT.y || y > PANEL_HIT.y + PANEL_HIT.h || x < PANEL_HIT.x || x > PANEL_HIT.x + PANEL_HIT.w) return -2;      // not on the panel
  const i = Math.floor((x - (PANEL_X0 - PANEL_STEP / 2)) / PANEL_STEP); return i >= 0 && i < 6 ? i : -1;
}
function pickerBoxAt(x, y) {
  for (let i = 0; i < 3; i++) { const bx = 386 + i * 64; if (x >= bx - 5 && x <= bx + 61 && y >= 294 && y <= 358) return ['S', 'M', 'L'][i]; }
  return null;
}
const inRect = (x, y, r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
const ARROW_POS = { x: 868, y: 62 };
function waitArrowAngle() {                                  // null when the arrow is not shown
  const g = G; if (VIEW.zoom <= 1.04 || !g || !g.waiting || g.over) return null;
  const p = worldToScreen(g.waiting.x, g.waiting.y);
  if (p[0] >= 20 && p[0] <= 936 && p[1] >= 20 && p[1] <= 420) return null;
  return Math.atan2(p[0] - 478, -(p[1] - 220));
}

function drawHint(c, text) {
  const lines = wrapLines(c, text, 13, 560), w = Math.max(...lines.map(s => measure(c, s, 13))) + 44, h = 14 + lines.length * 17, x = 478 - w / 2, y = 40;
  panel(c, x, y, w, h, { cut: 8, blur: 8, top: 'rgba(14,26,48,0.93)', bot: 'rgba(8,15,30,0.93)' });
  lines.forEach((s, i) => txt(c, s, 478, y + 7 + 8.5 + i * 17, { s: 13, a: 'center' }));
}
function drawToast(c, text) {
  const w = measure(c, text, 12.5) + 36, x = 478 - w / 2, y = 86;
  panel(c, x, y, w, 28, { cut: 6, blur: 6, top: 'rgba(40,30,8,0.92)', bot: 'rgba(24,18,6,0.92)', stroke: 'rgba(255,200,90,0.7)' });
  txt(c, text, 478, y + 14.5, { s: 12.5, a: 'center', col: '#ffe0a0' });
}
function drawWaitArrow(c, ang) {
  const x = ARROW_POS.x, y = ARROW_POS.y;
  c.save(); c.translate(x, y); c.beginPath(); hexPath(c, 0, 0, 22, -Math.PI / 2);
  const g = c.createLinearGradient(0, -22, 0, 22); g.addColorStop(0, 'rgba(30,44,70,0.94)'); g.addColorStop(1, 'rgba(10,16,30,0.94)'); c.fillStyle = g; c.fill();
  c.lineJoin = 'round'; c.lineWidth = 2.4; c.strokeStyle = PAL.bright; c.stroke();
  c.rotate(ang); c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = '#ffffff'; c.lineWidth = 3.2;
  c.beginPath(); c.moveTo(-6.5, 3.5); c.lineTo(0, -5); c.lineTo(6.5, 3.5); c.moveTo(0, -5); c.lineTo(0, 8); c.stroke();
  c.restore();
}

function drawOverlay(c, g, now) {
  const left = g.left;
  layerDraw(L_HUD, c, [fmtTime(g.t), g.money, g.score, left.S, left.M, left.L].join('|'),
    lc => drawHUD(lc, { left, time: fmtTime(g.t), money: g.money, score: g.score }));
  if (g.hint && g.def.tut && !g.over) layerDraw(L_HINT, c, g.hint, lc => drawHint(lc, g.hint));
  if (g.toast && !g.over) layerDraw(L_TOAST, c, g.toast.text, lc => drawToast(lc, g.toast.text));

  const ang = waitArrowAngle();                                                               // arrow to the waiting plane (zoomed in and the plane is out of sight)
  if (ang !== null) { const q = Math.round(ang * 20); layerDraw(L_ARROW, c, q, lc => drawWaitArrow(lc, q / 20)); }

  // landing announcement: sound + a black hexagon pinned to the bottom edge above the landing runway
  const e = g.sched[g.si], land = g.planes.find(p => p.st === 'land');
  const warn = !g.over && ((e && e.warned) || (land && land.ls < LAND.sScreen + 60));
  if (warn) {
    const lx = clamp(478 + (2155 - VIEW.cx) * viewScale(), 62 + 28, 956 - 62 - 28), pulse = 1 + 0.07 * Math.sin(now * 9);
    const sp = uiSprite('warn', 80, 80, lc => drawLandingWarning(lc, 40, 40, 24));
    c.save(); c.translate(lx, 392); c.scale(pulse, pulse); c.drawImage(sp, -40, -40, 80, 80); c.restore();
  }

  if (g.picker) layerDraw(L_PICK, c, g.picker.flash > 0 ? 'f' : 'n', lc => drawSizePicker(lc, g.picker.flash > 0));
  layerDraw(L_PANEL, c, 0, lc => drawServicePanel(lc, -1));
  const gl = g.glow;                                                                          // glow of the pressed service: steady while its size choice is open, then it fades
  if (gl) {
    let a = 1;
    if (g.picker && SERVICES.indexOf(g.picker.svc) === gl.i) gl.rel = null;
    else {
      if (gl.rel === null) gl.rel = now;
      const t = (now - gl.rel - GLOW_HOLD) / GLOW_FADE; a = t <= 0 ? 1 : 1 - t * t * (3 - 2 * t);
    }
    if (a <= 0.01) g.glow = null; else drawServiceGlow(c, gl.i, a, 0.5 + 0.5 * Math.sin(now * 5));
  }
}
const GLOW_HOLD = 0.3, GLOW_FADE = 0.6;                                                       // seconds the glow stays full after the choice, then fades out
const UI_SPR = {};
function uiSprite(key, w, h, fn) {
  const k = APP.k, e = UI_SPR[key]; if (e && e.k === k) return e.cv;
  const cv = newCanvas(w * k, h * k), c = cv.getContext('2d'); c.setTransform(k, 0, 0, k, 0, 0); fn(c);
  UI_SPR[key] = { cv, k }; return cv;
}

// one frame of the running level into the main canvas context c (device px)
function renderGame(c, now) {
  const g = G, k = APP.k, sc = viewScale();
  c.setTransform(k, 0, 0, k, 0, 0);
  drawMapRegion(c, VIEW.cx, VIEW.cy, sc);
  c.save(); c.translate(478 - VIEW.cx * sc, 220 - VIEW.cy * sc); c.scale(sc, sc);
  drawWorld(c, g, sc);
  c.restore();
  c.setTransform(k, 0, 0, k, 0, 0);
  drawOverlay(c, g, now);
}
