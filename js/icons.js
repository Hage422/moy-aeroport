// icons.js — service icons, drawn in a 24 x 24 box around (0,0) with the current stroke/fill colour
const ICON_CUT = '#18202f';   // colour of the little cut-outs (matches the dark button background)
function person(c, x, y, s) {
  c.beginPath(); c.arc(x, y - 7 * s, 2.5 * s, 0, TAU); c.fill();
  c.beginPath(); c.moveTo(x, y - 3.6 * s); c.lineTo(x, y + 2.4 * s);
  c.moveTo(x - 4 * s, y - 0.8 * s); c.lineTo(x, y - 2.4 * s); c.lineTo(x + 4 * s, y - 0.8 * s);
  c.moveTo(x, y + 2.4 * s); c.lineTo(x - 3 * s, y + 9 * s); c.moveTo(x, y + 2.4 * s); c.lineTo(x + 3 * s, y + 9 * s); c.stroke();
}
const ICONS = {
  deboard(c) {
    c.beginPath(); c.moveTo(-8, -9); c.lineTo(-8, 7); c.moveTo(-12.4, 2.6); c.lineTo(-8, 7.2); c.lineTo(-3.6, 2.6); c.stroke();
    person(c, 6, 0, 1.0);
  },
  board(c) {
    c.beginPath(); c.moveTo(-8, 9); c.lineTo(-8, -7); c.moveTo(-12.4, -2.6); c.lineTo(-8, -7.2); c.lineTo(-3.6, -2.6); c.stroke();
    person(c, 6, 0, 1.0);
  },
  baggage(c) {
    c.beginPath(); rr(c, -9, -5.5, 18, 14.5, 3); c.fill();
    c.beginPath(); c.moveTo(-3.6, -5.5); c.lineTo(-3.6, -9); c.lineTo(3.6, -9); c.lineTo(3.6, -5.5); c.stroke();
    c.save(); c.strokeStyle = ICON_CUT; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(-4, -3); c.lineTo(-4, 6.5); c.moveTo(4, -3); c.lineTo(4, 6.5); c.stroke(); c.restore();
  },
  fuel(c) {
    c.beginPath(); rr(c, -8, -10, 11, 19.5, 2.2); c.fill();
    c.save(); c.fillStyle = ICON_CUT; c.beginPath(); rr(c, -5.6, -7.6, 6.2, 5.4, 1); c.fill(); c.restore();
    c.beginPath(); c.moveTo(3, -5.5); c.lineTo(6.2, -5.5); c.quadraticCurveTo(8.6, -5.5, 8.6, -2.6); c.lineTo(8.6, 4.4); c.quadraticCurveTo(8.6, 7.4, 6, 7.4); c.stroke();
    c.beginPath(); c.moveTo(-10.5, 9.8); c.lineTo(5.5, 9.8); c.stroke();
  },
  catering(c) {
    c.beginPath(); c.arc(0, 0, 5.4, 0, TAU); c.stroke(); c.beginPath(); c.arc(0, 0, 2.2, 0, TAU); c.stroke();      // plate
    c.beginPath(); c.moveTo(-12.2, -9); c.lineTo(-12.2, -3.6); c.quadraticCurveTo(-12.2, -1.4, -10.2, -1.4);         // fork
    c.quadraticCurveTo(-8.2, -1.4, -8.2, -3.6); c.lineTo(-8.2, -9); c.moveTo(-10.2, -9); c.lineTo(-10.2, 9.4); c.stroke();
    c.beginPath(); c.moveTo(11.6, 9.4); c.lineTo(11.6, -9); c.quadraticCurveTo(8.8, -7, 8.9, -0.6); c.lineTo(11.6, -0.6); c.stroke();   // knife
  },
  takeoff(c) {
    c.save(); c.translate(1.5, -1.5); c.rotate(0.78); c.scale(0.2, 0.2);
    c.beginPath(); silhouette(c, { L: 64, S: 62, fw: 8.2, engW: 6 }); c.fill(); c.restore();
    c.beginPath(); c.moveTo(-11, 10); c.lineTo(11, 10); c.stroke();
    c.beginPath(); c.moveTo(-11, 6.6); c.lineTo(-4, 6.6); c.stroke();
  },
  landing(c) {                       // plane coming down to the runway (warning before a landing)
    c.save(); c.translate(-1.5, -2.2); c.rotate(2.36); c.scale(0.22, 0.22);
    c.beginPath(); silhouette(c, { L: 64, S: 62, fw: 8.2, engW: 6 }); c.fill(); c.restore();
    c.beginPath(); c.moveTo(-9, 9.4); c.lineTo(9, 9.4); c.stroke();
    c.beginPath(); c.moveTo(3.5, 6); c.lineTo(9, 6); c.stroke();
  },
};
function drawIcon(c, name, size, color, lw = 2.1) {
  c.save(); c.scale(size / 24, size / 24);
  c.fillStyle = color; c.strokeStyle = color; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round';
  ICONS[name](c); c.restore();
}
