// vehicles.js — apron vehicles, drawn nose-up around (0,0), world units (an average airliner is 84 long)
const VE = 'rgba(26,38,54,0.5)';
const wheels = (c, xs, ys, w = 1.5, h = 5) => { c.fillStyle = '#1d232b'; xs.forEach(x => ys.forEach(y => { c.beginPath(); rr(c, x, y, w, h, 0.6); c.fill(); })); };
function bodyGrad(c, x0, x1, a = '#f6f8fa', b = '#e2e8ee', d = '#b6c1cc') {
  const g = c.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, a); g.addColorStop(0.5, b); g.addColorStop(1, d); return g;
}
function glass(c, x, y, w, h) {
  c.beginPath(); rr(c, x, y, w, h, 1.1); c.fillStyle = '#18283f'; c.fill();
  c.beginPath(); rr(c, x + 0.6, y + 0.5, w * 0.45, h * 0.45, 0.6); c.fillStyle = 'rgba(190,220,255,0.35)'; c.fill();
}
function hazard(c, x, y, w, h) {                    // yellow/black warning edge
  c.save(); c.beginPath(); rr(c, x, y, w, h, 0.4); c.clip(); c.fillStyle = '#f2c21b'; c.fillRect(x, y, w, h);
  c.fillStyle = '#20252c'; for (let i = -h; i < w; i += 2.4) { c.beginPath(); c.moveTo(x + i, y + h); c.lineTo(x + i + 1.2, y + h); c.lineTo(x + i + 1.2 + h, y); c.lineTo(x + i + h, y); c.closePath(); c.fill(); }
  c.restore();
}
const outline = (c, fn, w = 0.35) => { c.beginPath(); fn(c); c.strokeStyle = VE; c.lineWidth = w; c.stroke(); };

// ---- passenger bus (38 x 14) -------------------------------------------------------------
function drawBus(c) {
  const L = 38, W = 14;
  wheels(c, [-W / 2 - 0.7, W / 2 - 0.8], [-L * 0.3, L * 0.24]);
  c.beginPath(); rr(c, -W / 2, -L / 2, W, L, 3.2); c.fillStyle = bodyGrad(c, -W / 2, W / 2); c.fill(); outline(c, k => rr(k, -W / 2, -L / 2, W, L, 3.2));
  c.beginPath(); rr(c, -W / 2 + 1.5, -L / 2 + 6.2, W - 3, L - 11, 1.8); c.fillStyle = '#eef2f6'; c.fill();
  c.strokeStyle = 'rgba(30,46,64,0.25)'; c.lineWidth = 0.3; c.stroke();
  c.fillStyle = '#c3ccd5'; [-3, 7].forEach(y => { c.beginPath(); rr(c, -3.2, y, 6.4, 4.4, 0.9); c.fill(); });
  c.strokeStyle = '#2f86d6'; c.lineWidth = 0.9;                      // blue side stripes
  [-1, 1].forEach(s => { c.beginPath(); c.moveTo(s * (W / 2 - 0.9), -L / 2 + 7); c.lineTo(s * (W / 2 - 0.9), L / 2 - 3); c.stroke(); });
  glass(c, -W / 2 + 1.2, -L / 2 + 1.3, W - 2.4, 4, ); glass(c, -W / 2 + 2, L / 2 - 3.6, W - 4, 2.2);
  c.fillStyle = '#ffe9a8'; [-1, 1].forEach(s => { c.beginPath(); c.arc(s * (W / 2 - 1.6), -L / 2 + 0.7, 0.7, 0, TAU); c.fill(); });
}
const silBus = c => rr(c, -7, -19, 14, 38, 3.2);

// ---- mobile boarding stairs (44 x 13) -----------------------------------------------------
function drawStairs(c) {
  const W = 13;
  wheels(c, [-W / 2 - 0.7, W / 2 - 0.8], [4, 15]);
  // chassis + cab
  c.beginPath(); rr(c, -W / 2, 0, W, 22, 2.4); c.fillStyle = bodyGrad(c, -W / 2, W / 2); c.fill(); outline(c, k => rr(k, -W / 2, 0, W, 22, 2.4));
  c.fillStyle = '#2f86d6'; c.fillRect(-W / 2 + 0.4, 12, W - 0.8, 1.6);
  glass(c, -W / 2 + 1.4, 15.5, W - 2.8, 3.8);
  // stairs
  c.beginPath(); rr(c, -4.4, -17, 8.8, 18, 0.8); c.fillStyle = '#cbd2d9'; c.fill(); outline(c, k => rr(k, -4.4, -17, 8.8, 18, 0.8));
  c.strokeStyle = 'rgba(50,64,80,0.5)'; c.lineWidth = 0.35;
  for (let y = -15.5; y < 0.8; y += 1.5) { c.beginPath(); c.moveTo(-3.9, y); c.lineTo(3.9, y); c.stroke(); }
  c.strokeStyle = '#2f86d6'; c.lineWidth = 0.7;                       // handrails
  [-1, 1].forEach(s => { c.beginPath(); c.moveTo(s * 4.5, -20); c.lineTo(s * 4.5, 0); c.stroke(); });
  // top landing
  c.beginPath(); rr(c, -6, -22, 12, 6.2, 1); c.fillStyle = '#dbe1e6'; c.fill(); outline(c, k => rr(k, -6, -22, 12, 6.2, 1));
  hazard(c, -5.4, -22, 10.8, 1.5);
}
const silStairs = c => { rr(c, -6.5, 0, 13, 22, 2.4); rr(c, -6, -22, 12, 22.2, 1); };

// ---- baggage tug with two carts (62 x 10) -------------------------------------------------
function drawCart(c, y0, seed) {
  const W = 10.5, L = 20, r = rng(seed);
  wheels(c, [-W / 2 - 0.4, W / 2 - 0.9], [y0 + 2, y0 + L - 6], 1.3, 4);
  c.beginPath(); rr(c, -W / 2, y0, W, L, 1.2); c.fillStyle = '#6e7985'; c.fill(); outline(c, k => rr(k, -W / 2, y0, W, L, 1.2));
  [0, 1].forEach(i => {
    const yy = y0 + 1.1 + i * 9.1;
    c.beginPath(); rr(c, -W / 2 + 1, yy, W - 2, 8.1, 1.2); c.fillStyle = '#c9d1d9'; c.fill(); outline(c, k => rr(k, -W / 2 + 1, yy, W - 2, 8.1, 1.2), 0.3);
    const cols = ['#2f86d6', '#e8531c', '#1f9150', '#6c43cc', '#f2b11c'];
    for (let j = 0; j < 4; j++) { c.fillStyle = cols[Math.floor(r() * cols.length)]; c.beginPath(); rr(c, -W / 2 + 1.8 + (j % 2) * 3.3, yy + 1 + Math.floor(j / 2) * 3.3, 2.9, 2.8, 0.6); c.fill(); }
  });
}
function drawTrain(c) {
  const y = -31;                                                     // tug at the front
  wheels(c, [-6, 4.6], [y + 2, y + 10], 1.5, 4);
  c.beginPath(); rr(c, -4.8, y, 9.6, 16, 2.2); c.fillStyle = '#f5c21b'; c.fill(); outline(c, k => rr(k, -4.8, y, 9.6, 16, 2.2));
  c.fillStyle = '#e0a90c'; c.fillRect(-4.8, y + 9, 9.6, 6);
  glass(c, -3.6, y + 1.2, 7.2, 3.4);
  c.beginPath(); rr(c, -3.3, y + 5.2, 6.6, 5.6, 1); c.fillStyle = '#fbe08a'; c.fill();       // canopy
  c.beginPath(); c.arc(0, y + 13, 1.1, 0, TAU); c.fillStyle = '#ff7a1a'; c.fill();             // beacon
  c.strokeStyle = '#2b3038'; c.lineWidth = 0.7;
  c.beginPath(); c.moveTo(0, y + 16); c.lineTo(0, y + 19.5); c.moveTo(0, y + 39.5); c.lineTo(0, y + 42.5); c.stroke();
  drawCart(c, y + 19, 7); drawCart(c, y + 42, 19);
}
const silTrain = c => { rr(c, -4.8, -31, 9.6, 16, 2.2); rr(c, -5.2, -12, 10.4, 20, 1.2); rr(c, -5.2, 11, 10.4, 20, 1.2); };

// ---- fuel truck (46 x 15) ---------------------------------------------------------------
function drawFuel(c) {
  const W = 15;
  wheels(c, [-W / 2 - 0.7, W / 2 - 0.8], [-12, 8, 15]);
  c.beginPath(); rr(c, -W / 2 + 1, -23, W - 2, 12, 2.4); c.fillStyle = bodyGrad(c, -W / 2, W / 2, '#ffffff', '#eef2f6', '#c4ced8'); c.fill(); outline(c, k => rr(k, -W / 2 + 1, -23, W - 2, 12, 2.4));
  glass(c, -W / 2 + 2.2, -22, W - 4.4, 3.6);
  c.beginPath(); rr(c, -W / 2, -10.5, W, 33, 6.5);                    // tank
  const g = c.createLinearGradient(-W / 2, 0, W / 2, 0);
  g.addColorStop(0, '#dfe5ea'); g.addColorStop(0.3, '#ffffff'); g.addColorStop(0.62, '#d3dbe2'); g.addColorStop(1, '#8e9aa6');
  c.fillStyle = g; c.fill(); outline(c, k => rr(k, -W / 2, -10.5, W, 33, 6.5));
  c.save(); c.beginPath(); rr(c, -W / 2, -10.5, W, 33, 6.5); c.clip();
  c.fillStyle = '#e8531c'; c.fillRect(-W / 2, 2, W, 3.2); c.fillStyle = '#ffffff'; c.fillRect(-W / 2, 5.2, W, 0.8);
  c.restore();
  c.fillStyle = '#39424d'; c.beginPath(); rr(c, -1.2, -8, 2.4, 28, 0.8); c.fill();          // walkway
  c.fillStyle = '#9aa6b2'; [-6, 7, 17].forEach(y => { c.beginPath(); c.arc(0, y, 2.1, 0, TAU); c.fill(); c.strokeStyle = VE; c.lineWidth = 0.3; c.stroke(); });
  c.beginPath(); c.arc(0, 21, 1.8, 0, TAU); c.strokeStyle = '#20252c'; c.lineWidth = 0.9; c.stroke();   // hose reel
}
const silFuel = c => { rr(c, -6.5, -23, 13, 12, 2.4); rr(c, -7.5, -10.5, 15, 33, 6.5); };

// ---- catering truck (40 x 15) -----------------------------------------------------------
function drawCater(c) {
  const W = 15;
  wheels(c, [-W / 2 - 0.7, W / 2 - 0.8], [-8, 12]);
  c.beginPath(); rr(c, -W / 2 + 1, -20, W - 2, 10.5, 2.4); c.fillStyle = bodyGrad(c, -W / 2, W / 2, '#ffffff', '#eef2f6', '#c4ced8'); c.fill(); outline(c, k => rr(k, -W / 2 + 1, -20, W - 2, 10.5, 2.4));
  glass(c, -W / 2 + 2.2, -19, W - 4.4, 3.4);
  c.beginPath(); rr(c, -W / 2, -8.5, W, 28.5, 1.6); c.fillStyle = bodyGrad(c, -W / 2, W / 2, '#f9fbfc', '#e4e9ee', '#b3bec9'); c.fill(); outline(c, k => rr(k, -W / 2, -8.5, W, 28.5, 1.6));
  c.fillStyle = '#e8531c'; [-1, 1].forEach(s => c.fillRect(s > 0 ? W / 2 - 3 : -W / 2, -8.5, 3, 28.5));   // orange side bands
  c.beginPath(); rr(c, -3.8, -5, 7.6, 21.5, 1); c.fillStyle = '#dde3e9'; c.fill(); c.strokeStyle = 'rgba(30,46,64,0.28)'; c.lineWidth = 0.3; c.stroke();
  c.strokeStyle = 'rgba(30,46,64,0.28)'; [-1, 4, 9, 14].forEach(y => { c.beginPath(); c.moveTo(-3.8, y); c.lineTo(3.8, y); c.stroke(); });
  c.beginPath(); rr(c, -5.2, -26, 10.4, 6.4, 0.8); c.fillStyle = '#cfd6dd'; c.fill(); outline(c, k => rr(k, -5.2, -26, 10.4, 6.4, 0.8));   // docking bridge
  hazard(c, -4.8, -26, 9.6, 1.4);
}
const silCater = c => { rr(c, -7.5, -20, 15, 40, 2); rr(c, -5.2, -26, 10.4, 6.4, 0.8); };

// ---- telescopic jet bridge: rotunda at the origin, tube along +x, cab at x = len ---------------
function drawJetBridge(c, len = 34) {
  const w1 = 12, w2 = 10, cx = len;
  c.beginPath(); rr(c, 0, -w1 / 2, len * 0.58, w1, 2);
  let g = c.createLinearGradient(0, -w1 / 2, 0, w1 / 2); g.addColorStop(0, '#dde3e8'); g.addColorStop(0.5, '#c3cbd3'); g.addColorStop(1, '#8c97a3');
  c.fillStyle = g; c.fill(); outline(c, k => rr(k, 0, -w1 / 2, len * 0.58, w1, 2));
  c.beginPath(); rr(c, len * 0.46, -w2 / 2, len * 0.54, w2, 1.8);
  g = c.createLinearGradient(0, -w2 / 2, 0, w2 / 2); g.addColorStop(0, '#d2d9df'); g.addColorStop(0.5, '#b3bcc5'); g.addColorStop(1, '#828d99');
  c.fillStyle = g; c.fill(); outline(c, k => rr(k, len * 0.46, -w2 / 2, len * 0.54, w2, 1.8));
  c.strokeStyle = 'rgba(40,56,72,0.3)'; c.lineWidth = 0.4;
  for (let x = 5; x < len - 4; x += 3) { c.beginPath(); c.moveTo(x, -w1 / 2 + 0.8); c.lineTo(x, w1 / 2 - 0.8); c.stroke(); }
  c.beginPath(); c.arc(0, 0, 9, 0, TAU);                                // rotunda
  g = c.createRadialGradient(-2.5, -2.5, 1, 0, 0, 10); g.addColorStop(0, '#e6ebef'); g.addColorStop(1, '#98a3af');
  c.fillStyle = g; c.fill(); outline(c, k => k.arc(0, 0, 9, 0, TAU));
  c.beginPath(); c.arc(0, 0, 2.8, 0, TAU); c.fillStyle = '#6d7885'; c.fill();
  c.beginPath(); rr(c, cx - 4.5, -7.5, 12.5, 15, 2.6); c.fillStyle = '#e6eaee'; c.fill(); outline(c, k => rr(k, cx - 4.5, -7.5, 12.5, 15, 2.6));
  c.beginPath(); rr(c, cx + 5.4, -6.6, 3.6, 13.2, 1.4); c.fillStyle = '#2d3239'; c.fill();           // rubber bellows
  c.beginPath(); rr(c, cx - 2.2, -4.8, 6, 9.6, 1.4); c.fillStyle = '#2a4a73'; c.fill();             // roof window
  hazard(c, cx - 4.2, 5.6, 11, 1.6); hazard(c, cx - 4.2, -7.2, 11, 1.6);
}
const silJetBridge = (c, len = 34) => { rr(c, 0, -5.5, len, 11, 2); c.moveTo(9, 0); c.arc(0, 0, 9, 0, TAU); rr(c, len - 4.5, -7.5, 12.5, 15, 2.6); };

const VEHICLES = {
  bus:    { name: 'Автобус',            draw: drawBus,    sil: silBus,    L: 38, W: 14 },
  stairs: { name: 'Трап',               draw: drawStairs, sil: silStairs, L: 44, W: 13 },
  train:  { name: 'Багажный тягач',     draw: drawTrain,  sil: silTrain,  L: 62, W: 11 },
  fuel:   { name: 'Топливозаправщик',   draw: drawFuel,   sil: silFuel,   L: 46, W: 15 },
  cater:  { name: 'Кейтеринг',          draw: drawCater,  sil: silCater,  L: 46, W: 15 },
};

function drawVehicleAt(c, kind, x, y, hd, sc, o = {}) {
  const V = VEHICLES[kind];
  c.save(); c.translate(x, y); c.rotate(hd);
  if (o.mode !== 'body') castShadow(c, cc => V.sil(cc), sc, o.sdx ?? 2.6, o.sdy ?? 3.8, o.sblur ?? 3, o.sa ?? 0.38);
  if (o.mode !== 'shadow') V.draw(c);
  c.restore();
}
function drawJetBridgeAt(c, x, y, hd, len, sc, o = {}) {
  c.save(); c.translate(x, y); c.rotate(hd);
  if (o.mode !== 'body') castShadow(c, cc => silJetBridge(cc, len), sc, 2.6, 3.8, 3, 0.36);
  if (o.mode !== 'shadow') drawJetBridge(c, len);
  c.restore();
}
