// sprites.js — planes and vehicles are painted once into small canvases (nose up) and then drawn rotated every frame.
// Soft shadows are blurred by hand (no ctx.filter: Safari does not have it).
const PS = 1.7;                                          // sprite pixels per world unit
const SPR = { plane: {}, pShadow: {}, veh: {}, vShadow: {} };

function newCanvas(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }

// three box-blur passes on the alpha channel (≈ gaussian); r in pixels
function blurAlpha(cv, sigma) {
  const w = cv.width, h = cv.height, ctx = cv.getContext('2d'), img = ctx.getImageData(0, 0, w, h), d = img.data;
  const a = new Float32Array(w * h), b = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) a[i] = d[i * 4 + 3];
  const r = Math.max(1, Math.round((Math.sqrt(4 * sigma * sigma + 1) - 1) / 2)), n = 2 * r + 1;
  const pass = (src, dst, horiz) => {
    const len = horiz ? w : h, lines = horiz ? h : w, stride = horiz ? 1 : w, step = horiz ? w : 1;
    for (let l = 0; l < lines; l++) {
      const base = l * step; let sum = 0;
      for (let k = -r; k <= r; k++) sum += src[base + clamp(k, 0, len - 1) * stride];
      for (let i = 0; i < len; i++) {
        dst[base + i * stride] = sum / n;
        sum += src[base + clamp(i + r + 1, 0, len - 1) * stride] - src[base + clamp(i - r, 0, len - 1) * stride];
      }
    }
  };
  for (let k = 0; k < 3; k++) { pass(a, b, true); pass(b, a, false); }
  for (let i = 0; i < w * h; i++) d[i * 4 + 3] = a[i];
  ctx.putImageData(img, 0, 0);
}
function makeShadow(pathFn, half, sigmaUnits) {            // half = half size of the box in world units
  const size = half * 2 * PS, cv = newCanvas(size, size), c = cv.getContext('2d');
  c.translate(cv.width / 2, cv.height / 2); c.scale(PS, PS);
  c.fillStyle = 'rgb(8,14,24)'; c.beginPath(); pathFn(c); c.fill();
  blurAlpha(cv, sigmaUnits * PS);
  return { cv, w: cv.width / PS, h: cv.height / PS };
}

function buildSprites() {
  ['S', 'M', 'L'].forEach(k => {
    const T = TYPES[k], half = Math.max(T.L, T.S) / 2 + 7;
    SPR.plane[k] = [];
    LIVERIES.forEach((liv, i) => {
      const cv = newCanvas(half * 2 * PS, half * 2 * PS), c = cv.getContext('2d');
      c.translate(cv.width / 2, cv.height / 2); c.scale(PS, PS); drawPlane(c, T, liv);
      SPR.plane[k][i] = { cv, w: cv.width / PS, h: cv.height / PS };
    });
    const sh = half + 14;
    SPR.pShadow[k] = { ground: makeShadow(cc => silhouette(cc, T), sh, 2.7), air: makeShadow(cc => silhouette(cc, T), sh + 8, 4.6) };
  });
  Object.keys(VEHICLES).forEach(k => {
    const V = VEHICLES[k], half = 38, cv = newCanvas(half * 2 * PS, half * 2 * PS), c = cv.getContext('2d');
    c.translate(cv.width / 2, cv.height / 2); c.scale(PS, PS); V.draw(c);
    SPR.veh[k] = { cv, w: cv.width / PS, h: cv.height / PS };
    SPR.vShadow[k] = makeShadow(cc => V.sil(cc), half + 6, 1.5);
  });
}

// draw helpers (world coordinates; the caller has set the camera transform)
function blitRot(c, s, x, y, hd, k = 1) {
  c.save(); c.translate(x, y); c.rotate(hd); if (k !== 1) c.scale(k, k); c.drawImage(s.cv, -s.w / 2, -s.h / 2, s.w, s.h); c.restore();
}
function blitShadow(c, s, x, y, hd, dx, dy, alpha, k = 1) {
  c.save(); c.globalAlpha = alpha; c.translate(x + dx, y + dy); c.rotate(hd); if (k !== 1) c.scale(k, k); c.drawImage(s.cv, -s.w / 2, -s.h / 2, s.w, s.h); c.restore();
}
