// app.js — start-up, screens, touch input and the main loop
const APP = {
  screen: 'boot', confirm: null, lvPick: 1, upSel: 0, snap: null, dirty: true, dyn: false, blit: false,
  W: 956, H: 440, k: 1, dprCap: 3, fixedDpr: false, canvas: null, ctx: null, menuCv: null, last: 0, note: null, noteUntil: 0, verTaps: [],
  ptr: new Map(), pinch: null, speed: 1, fps: false, ft: [], ftSum: 0, avgDt: 0, errors: [], wl: null, rotate: false, frames: 0,
};
const Q = new URLSearchParams(location.search);

// ---- canvas ---------------------------------------------------------------------------------------
function fitCanvas() {                                      // the 956 x 440 picture fills the window as far as the aspect ratio allows, centred
  const cv = APP.canvas, iw = window.innerWidth, ih = window.innerHeight;
  const s = Math.min(iw / 956, ih / 440), cw = Math.floor(956 * s), ch = Math.floor(440 * s);
  cv.style.width = cw + 'px'; cv.style.height = ch + 'px'; cv.style.left = Math.floor((iw - cw) / 2) + 'px'; cv.style.top = Math.floor((ih - ch) / 2) + 'px';
  const dpr = Math.min(window.devicePixelRatio || 1, APP.dprCap), W = Math.round(cw * dpr), H = Math.round(ch * dpr);
  if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
  if (!APP.ctx) APP.ctx = cv.getContext('2d', { alpha: false });
  APP.W = W; APP.H = H; APP.k = W / 956; APP.menuCv = newCanvas(W, H);
  resetLayers(); for (const k in UI_SPR) delete UI_SPR[k];
  APP.dirty = true; APP.blit = true;
}
function toLogical(e) { const r = APP.canvas.getBoundingClientRect(); return [(e.clientX - r.left) * 956 / r.width, (e.clientY - r.top) * 440 / r.height]; }
function captureSnap() { const s = newCanvas(APP.W, APP.H); s.getContext('2d').drawImage(APP.canvas, 0, 0); APP.snap = s; }
function setScreen(name, confirm) { APP.screen = name; APP.confirm = confirm || null; APP.dirty = true; APP.blit = true; APP.dyn = false; HITS = []; }

// ---- level flow -----------------------------------------------------------------------------------
function startLevel(n) {
  newGame(n); VIEW.cx = MAP_W / 2; VIEW.cy = MAP_H / 2; VIEW.zoom = 1; APP.pinch = null; APP.ptr.clear();
  UI_LAYERS.forEach(L => { L.sig = null; });
  setScreen('game'); APP.last = 0;
}
function pauseGame() { if (APP.screen !== 'game') return; captureSnap(); APP.ptr.clear(); APP.pinch = null; setScreen('pause'); }
function resumeGame() { setScreen('game'); APP.last = 0; }
function leaveLevel() { G = null; setScreen('main'); }

// ---- menu actions -----------------------------------------------------------------------------------
const BACK_TO = { levels: 'main', upgrades: 'levels', records: 'main', settings: 'main' };
function menuAction(id) {
  const sc = APP.screen;
  if (sc === 'confirm') {
    const kind = APP.confirm, base = { exit: 'pause', reset: 'settings', new: 'main' }[kind];
    if (id === 'no') { SND.play('back'); setScreen(base); }
    else if (id === 'yes') {
      SND.play('tap');
      if (kind === 'exit') leaveLevel();
      else if (kind === 'reset') { resetProgress(); setScreen('settings'); }
      else { resetProgress(); APP.lvPick = 1; setScreen('levels'); }
    }
    return;
  }
  if (id === 'back') { SND.play('back'); setScreen(BACK_TO[sc] || 'main'); return; }
  if (/^lv\d+$/.test(id)) {
    const n = +id.slice(2);
    if (!levelUnlocked(n)) { SND.play('error'); return; }
    APP.lvPick = n; APP.upSel = 0; SND.play('tap'); setScreen('upgrades'); return;
  }
  if (/^up\d+$/.test(id)) { APP.upSel = +id.slice(2); SND.play('tap'); APP.dirty = true; return; }
  if (/^diff[012]$/.test(id)) { SAVE.set.diff = +id.slice(4); if (G) G.diff = SAVE.set.diff; writeSave(); SND.play('tap'); APP.dyn = true; return; }
  switch (id) {
    case 'continue': SND.play('tap'); setScreen('levels'); break;
    case 'new': SND.play('tap'); setScreen('confirm', 'new'); break;
    case 'records': SND.play('tap'); setScreen('records'); break;
    case 'settings': SND.play('tap'); setScreen('settings'); break;
    case 'reset': SND.play('tap'); setScreen('confirm', 'reset'); break;
    case 'menu': SND.play('tap'); setScreen('confirm', 'exit'); break;
    case 'resume': SND.play('tap'); resumeGame(); break;
    case 'buy': {
      const U = UPGRADES[APP.upSel]; if (SAVE.upg[U.id]) break;
      if (SAVE.money >= U.price) { SAVE.money -= U.price; SAVE.upg[U.id] = 1; writeSave(); SND.play('coin'); APP.dirty = true; } else SND.play('error');
      break;
    }
    case 'start': SND.play('tap'); startLevel(APP.lvPick); break;
    case 'next': SND.play('tap'); if (G.n < PLAYABLE_LEVELS) { APP.lvPick = G.n + 1; APP.upSel = 0; setScreen('upgrades'); } else setScreen('levels'); break;
    case 'again': SND.play('tap'); APP.lvPick = G.n; APP.upSel = 0; setScreen('upgrades'); break;
    case 'ver': {                                            // five quick taps = +5000 DME€ (test money)
      const t = performance.now(); APP.verTaps = APP.verTaps.filter(q => t - q < 2500); APP.verTaps.push(t);
      if (APP.verTaps.length >= 5) { APP.verTaps = []; SAVE.money += 5000; writeSave(); SND.play('coin'); APP.note = '+5000 DME€'; APP.noteUntil = t + 1800; APP.dyn = true; } else SND.play('tap');
      break;
    }
  }
}
function setSlider(which, x) {
  const v = Math.round(clamp((x - 438.4) / (608 - 438.4), 0, 1) * 100) / 100;
  SAVE.set[which] = v; if (which === 'sound') SND.setVolume(v); APP.dyn = true;
}

// ---- touch input --------------------------------------------------------------------------------------
const dist2 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function startPinch() {
  const ps = [...APP.ptr.values()]; if (ps.length < 2) return;
  const m = [(ps[0].x + ps[1].x) / 2, (ps[0].y + ps[1].y) / 2];
  APP.pinch = { d0: Math.max(20, dist2(ps[0], ps[1])), z0: VIEW.zoom, w0: screenToWorld(m[0], m[1]) };
}
function updatePinch() {
  const ps = [...APP.ptr.values()], pc = APP.pinch; if (ps.length < 2 || !pc) return;
  const m = [(ps[0].x + ps[1].x) / 2, (ps[0].y + ps[1].y) / 2];
  VIEW.zoom = clamp(pc.z0 * dist2(ps[0], ps[1]) / pc.d0, 1, ZOOM_MAX);
  const sc = viewScale(); VIEW.cx = pc.w0[0] - (m[0] - 478) / sc; VIEW.cy = pc.w0[1] - (m[1] - 220) / sc; clampView();
}
function centerOn(p) { if (!p) return; VIEW.cx = p.x; VIEW.cy = p.y; clampView(); }

function gameDown(P) {
  const g = G; if (!g) return;
  if (APP.ptr.size >= 2) { APP.ptr.forEach(q => { q.ui = true; }); startPinch(); return; }
  if (g.over) { P.ui = true; return; }
  if (inRect(P.x, P.y, PAUSE_HIT)) { P.ui = true; SND.play('tap'); pauseGame(); return; }
  if (waitArrowAngle() !== null && Math.hypot(P.x - ARROW_POS.x, P.y - ARROW_POS.y) < 30) { P.ui = true; SND.play('tap'); centerOn(g.waiting); return; }
  const bi = panelButtonAt(P.x, P.y);
  if (bi !== -2) { P.ui = true; if (bi >= 0) pressService(SERVICES[bi]); return; }
  if (g.picker) { const sz = pickerBoxAt(P.x, P.y); if (sz) { P.ui = true; pickSize(sz); } }
}
function gameMove(P, dx, dy) {
  if (APP.pinch && APP.ptr.size >= 2) { updatePinch(); return; }
  if (P.ui) return;
  if (!P.moved && Math.hypot(P.x - P.sx, P.y - P.sy) > 9) P.moved = true;
  if (P.moved && VIEW.zoom > 1.001) { const sc = viewScale(); VIEW.cx -= dx / sc; VIEW.cy -= dy / sc; clampView(); }
}
function gameUp(P) {
  if (!P.ui && !P.moved && performance.now() - P.t0 < 700 && G) { const w = screenToWorld(P.x, P.y); tapWorld(w[0], w[1]); }
}
function menuDown(P) {
  const h = hitAt(P.x, P.y); P.hit = h ? h.id : null;
  if ((P.hit === 'sound' || P.hit === 'music') && P.x >= 420) { P.drag = P.hit; setSlider(P.drag, P.x); }
}
function menuMove(P) { if (P.drag) setSlider(P.drag, P.x); }
function menuUp(P) {
  if (P.drag) { writeSave(); SND.play('tap'); return; }
  const h = hitAt(P.x, P.y); if (h && h.id === P.hit && h.id !== 'blocker' && h.id !== 'sound' && h.id !== 'music') menuAction(h.id);
  else if (h && h.id === 'blocker' && P.hit === 'blocker') { /* tap outside the window: nothing */ }
}

function onDown(e) {
  e.preventDefault(); SND.init(); wake();
  if (APP.rotate || APP.screen === 'boot') return;
  const [x, y] = toLogical(e);
  try { APP.canvas.setPointerCapture(e.pointerId); } catch (_) {}
  const P = { id: e.pointerId, x, y, sx: x, sy: y, t0: performance.now(), moved: false, ui: false, hit: null, drag: null };
  APP.ptr.set(e.pointerId, P);
  if (APP.screen === 'game') gameDown(P); else menuDown(P);
}
function onMove(e) {
  const P = APP.ptr.get(e.pointerId); if (!P) return;
  e.preventDefault();
  const [x, y] = toLogical(e), dx = x - P.x, dy = y - P.y; P.x = x; P.y = y;
  if (APP.screen === 'game') gameMove(P, dx, dy); else menuMove(P);
}
function onUp(e) {
  const P = APP.ptr.get(e.pointerId); if (!P) return;
  e.preventDefault();
  const [x, y] = toLogical(e); P.x = x; P.y = y;
  APP.ptr.delete(e.pointerId);
  if (APP.ptr.size < 2) APP.pinch = null;
  SND.init();                                                // iOS unlocks sound on the finger lifting
  if (e.type === 'pointercancel') return;
  if (APP.screen === 'game') gameUp(P); else menuUp(P);
}

// ---- main loop ---------------------------------------------------------------------------------------
function renderMenu(now) {
  const name = APP.screen; if (name === 'boot') return;
  if (APP.note && now * 1000 > APP.noteUntil) { APP.note = null; APP.dyn = true; }
  const W = APP.W, H = APP.H, c = APP.ctx;
  if (APP.dirty) { drawMenu(APP.menuCv.getContext('2d'), W, H, name, APP.confirm); APP.dirty = false; APP.blit = true; }
  if (APP.blit || APP.dyn) {
    c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(APP.menuCv, 0, 0);
    if (name === 'pause' || name === 'settings') {
      logical(c, W); glassDyn(c, { diff: SAVE.set.diff, sound: SAVE.set.sound, music: SAVE.set.music });
      if (APP.note && name === 'settings') txt(c, APP.note, 478, 104, { s: 15, w: 800, a: 'center', col: PAL.green });
    }
    APP.blit = APP.dyn = false;
  }
}
function trackPerf(dt) {
  if (!dt) return;
  APP.ft.push(dt); APP.ftSum += dt;
  if (APP.ft.length >= 90) {
    APP.avgDt = APP.ftSum / APP.ft.length; APP.ft.length = 0; APP.ftSum = 0;
    if (APP.avgDt > 0.0225 && APP.dprCap > 1.5 && !APP.fixedDpr) { APP.dprCap = Math.max(1.5, APP.dprCap - 0.5); fitCanvas(); }
  }
}
function gameFrame(now) {
  const real = APP.last ? Math.min(0.1, now - APP.last) : 0, dt = real * APP.speed; APP.last = now;
  const n = Math.max(1, Math.ceil(dt / (1 / 30))); for (let i = 0; i < n; i++) stepGame(dt / n);
  renderGame(APP.ctx, now);
  if (APP.fps) { const c = APP.ctx; c.setTransform(APP.k, 0, 0, APP.k, 0, 0); txt(c, (APP.avgDt * 1000).toFixed(1) + ' мс · dpr ' + (APP.W / APP.canvas.clientWidth).toFixed(2), 70, 430, { s: 10, col: '#ff0' }); }
  trackPerf(real);
  if (G.over && (G.over.win ? G.overT > 0.15 : G.overT > 1.9)) { captureSnap(); setScreen(G.over.win ? 'win' : 'loss'); }
}
function frame(ts) {
  requestAnimationFrame(frame);
  try {
    APP.frames++;
    if (APP.rotate) return;
    if (APP.screen === 'game' && G) gameFrame(ts / 1000); else { APP.last = 0; renderMenu(ts / 1000); }
  } catch (e) { APP.errors.push(String((e && e.stack) || e)); if (APP.errors.length < 10) console.error(e); }
}

// ---- system things ------------------------------------------------------------------------------------
async function wake() {                                      // keep the screen on while playing
  try { if ('wakeLock' in navigator && !APP.wl) { APP.wl = await navigator.wakeLock.request('screen'); APP.wl.addEventListener('release', () => { APP.wl = null; }); } } catch (_) { APP.wl = null; }
}
function checkOrientation() {
  const portrait = window.innerHeight > window.innerWidth * 1.05, el = document.getElementById('rot');
  if (el) el.hidden = !portrait;
  if (portrait && !APP.rotate && APP.screen === 'game') pauseGame();
  APP.rotate = portrait; if (!portrait) { APP.dirty = true; APP.blit = true; }
}
function onResize() { fitCanvas(); checkOrientation(); }

function loadImage(src) { return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error('не загрузилось ' + src)); im.src = src; }); }
async function boot() {
  const cv = APP.canvas = document.getElementById('c');
  APP.fps = Q.has('fps'); APP.speed = +Q.get('speed') || 1; if (Q.get('dpr')) { APP.dprCap = +Q.get('dpr'); APP.fixedDpr = true; }
  loadSave(); SND.vol = SAVE.set.sound;
  try { await Promise.all([[500, 600, 700, 800].map(w => document.fonts.load(w + ' 16px Inter', 'Аа Яя 0123')), loadImage('assets/map.webp?v=1').then(im => { MAPIMG = im; return im.decode ? im.decode().catch(() => {}) : 0; })].flat()); }
  catch (e) { APP.errors.push(String(e)); }
  buildSprites(); fitCanvas();
  cv.addEventListener('pointerdown', onDown); cv.addEventListener('pointermove', onMove);
  cv.addEventListener('pointerup', onUp); cv.addEventListener('pointercancel', onUp);
  cv.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
  cv.addEventListener('contextmenu', e => e.preventDefault());
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(n => document.addEventListener(n, e => e.preventDefault(), { passive: false }));
  window.addEventListener('resize', onResize); window.addEventListener('orientationchange', () => setTimeout(onResize, 200));
  document.addEventListener('visibilitychange', () => { if (document.hidden) { if (APP.screen === 'game') pauseGame(); } else { wake(); APP.dirty = true; APP.blit = true; SND.init(); } });
  window.addEventListener('pagehide', () => { if (APP.screen === 'game') pauseGame(); });
  window.addEventListener('error', e => { APP.errors.push(String(e.message)); });
  const ld = document.getElementById('loading'); if (ld) ld.remove();
  checkOrientation(); setScreen('main');
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
  if (Q.get('lv')) { SAVE.lv = { 1: { stars: 3, score: 1 }, 2: { stars: 3, score: 1 }, 3: { stars: 3, score: 1 }, 4: { stars: 3, score: 1 }, 5: { stars: 3, score: 1 } }; startLevel(+Q.get('lv')); }
  requestAnimationFrame(frame);
}
boot().catch(e => { const ld = document.getElementById('loading'); if (ld) ld.textContent = 'Ошибка запуска: ' + e.message; APP.errors.push(String(e && e.stack || e)); });
