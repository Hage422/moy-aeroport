// sim.js — the game itself: arrivals, taxiing, services, vehicles, patience, take-off, win and loss. No drawing here.
let G = null;                                                 // the running level (null in menus)
const rand = (a, b) => a + Math.random() * (b - a);
const planeLen = p => TYPES[p.T].L;
const WARN_LEAD = 2.2;                                        // the landing warning appears this many seconds before the plane is spawned below the screen
const SVC_VEH = { deboard: ['stairs', 'bus'], board: ['stairs', 'bus'], baggage: ['train'], fuel: ['fuel'], catering: ['cater'] };
const TURN_RATE = 1.7, TAXI_V = 185, PUSH_V = 55;

const ARR_LEN = {};                                           // length of the arrival route to every stand (parking assistant)
STANDS.forEach(s => { ARR_LEN[s.id] = routeArrive(s)[0].path.len; });

function makeSchedule(def, diff) {
  const types = [];
  ['S', 'M', 'L'].forEach(k => { for (let i = 0; i < def.plan[k]; i++) types.push(k); });
  for (let i = types.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [types[i], types[j]] = [types[j], types[i]]; }
  const livs = LIVERIES.map((_, i) => i);
  for (let i = livs.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [livs[i], livs[j]] = [livs[j], livs[i]]; }
  let t = def.first; const out = [];
  types.forEach((T, i) => { if (i) t += rand(def.gap[0], def.gap[1]) * DIFF_GAP[diff]; out.push({ t, T, liv: livs[i % livs.length], warned: false }); });
  return out;
}

function newGame(n) {
  const def = LEVEL_DEFS[n - 1], diff = SAVE.set.diff;
  const g = {
    n, def, diff, upg: Object.assign({}, SAVE.upg), t: 0, over: null, overT: 0, money: SAVE.money, earned: 0, score: 0,
    left: { S: def.plan.S || 0, M: def.plan.M || 0, L: def.plan.L || 0 }, planes: [], vehicles: [], stands: {}, bridges: {},
    waiting: null, holdOwner: null, beaconLeft: 5, nextId: 1, vid: 1, sel: null, picker: null, toast: null, si: 0, winT: -1, hint: '', lastTake: 0, anim: 0,
  };
  g.sched = makeSchedule(def, diff);
  g.lastArr = g.sched.length ? g.sched[g.sched.length - 1].t : 0;
  STANDS.forEach(s => { g.stands[s.id] = null; if (s.kind === 'jet') g.bridges[s.id] = { f: 0, tgt: 0 }; });
  G = g; return g;
}

// ---- stepping ---------------------------------------------------------------------------------
function stepGame(dt) {
  const g = G; if (!g) return;
  g.anim += dt;
  if (g.over) { g.overT += dt; return; }
  g.t += dt;
  if (g.toast) { g.toast.t -= dt; if (g.toast.t <= 0) g.toast = null; }
  if (g.picker && g.picker.flash > 0) g.picker.flash -= dt;

  const e = g.sched[g.si];                                   // next landing
  if (e) {
    if (!e.warned && g.t >= e.t - WARN_LEAD) { e.warned = true; SND.play('warn'); }
    if (g.t >= e.t) {
      const busy = g.waiting || g.planes.some(p => p.st === 'land');
      if (busy && g.upg.beacon && g.beaconLeft > 0) {          // radio beacon: the runway is not free yet, postpone this landing
        g.beaconLeft--; e.t += 9; e.warned = false; SND.play('beacon');
        g.toast = { text: 'Радиомаяк отложил посадку · осталось ' + g.beaconLeft, t: 3 };
      } else { spawnLanding(e); g.si++; }
    }
  }

  for (const p of g.planes) {
    switch (p.st) {
      case 'land': stepLand(p, dt); break;
      case 'taxiIn': case 'depart': stepLegs(p, dt); break;
      case 'parked': stepParked(p, dt); break;
      case 'hold': stepHold(p, dt); break;
      case 'takeoff': stepTakeoff(p, dt); break;
    }
    if (g.over) return;
  }
  g.planes = g.planes.filter(p => p.st !== 'gone');
  if (g.sel && !g.planes.includes(g.sel)) g.sel = null;

  for (const v of g.vehicles) stepVehicle(v, dt);
  g.vehicles = g.vehicles.filter(v => !v.dead);
  for (const id in g.bridges) { const b = g.bridges[id]; b.f = clamp(b.f + (b.tgt ? 1 : -1) * dt / 1.3, 0, 1); }

  if (g.left.S + g.left.M + g.left.L === 0 && g.si >= g.sched.length) {
    g.winT = g.winT < 0 ? 0 : g.winT + dt;
    if (g.winT > 1.4) winGame();
  }
  updateHint();
}

function spawnLanding(e) {
  const p = { id: G.nextId++, T: e.T, liv: e.liv, st: 'land', x: 2155, y: 1450, hd: 0, alt: 1, v: 430, ls: 0, stand: null, svcIdx: 0, svc: null, patience: 0,
    pmax: G.def.patience * DIFF_PATIENCE[G.diff], legs: null, li: 0, ls2: 0, tPark: 0, ready: false, touched: false, freed: false, holdT: 0 };
  G.planes.push(p); return p;
}

function stepLand(p, dt) {
  const path = LAND.path, sT = LAND.sTouch, sC = LAND.sCurve, len = path.len;
  let v = p.ls < sT ? lerp(430, 360, p.ls / sT) : p.ls < sC ? lerp(360, 150, (p.ls - sT) / (sC - sT)) : 150;
  v = Math.max(10, Math.min(v, Math.sqrt(2 * 150 * Math.max(0, len - p.ls))));
  p.ls = Math.min(len, p.ls + v * dt); p.v = v;
  const q = pathAt(path, p.ls); p.x = q[0]; p.y = q[1]; p.hd = q[2];
  p.alt = p.ls < sT ? clamp((sT - p.ls) / (sT - LAND.sScreen), 0, 1) : 0;
  if (!p.touched && p.ls >= sT) { p.touched = true; SND.play('touch'); SND.play('engineLand'); }
  const w = G.waiting;
  if (w && p.ls > sT && Math.hypot(p.x - w.x, p.y - w.y) < (planeLen(p) + planeLen(w)) * 0.5 * 0.88) { loseGame('crash', w, 'Самолёт не успел освободить полосу!'); return; }
  if (len - p.ls < 0.6) {
    p.st = 'waiting'; p.x = WAIT_SPOT.x; p.y = WAIT_SPOT.y; p.hd = WAIT_SPOT.hd; p.v = 0; G.waiting = p;
    if (G.upg.park) autoPark(p);
  }
}

function autoPark(p) {
  let best = null, bl = 1e9;
  STANDS.forEach(s => { if (!G.stands[s.id] && ARR_LEN[s.id] < bl) { bl = ARR_LEN[s.id]; best = s; } });
  if (best) sendToStand(p, best);
}

function sendToStand(p, s) {
  G.stands[s.id] = p; p.stand = s.id; p.st = 'taxiIn'; p.legs = routeArrive(s); p.li = 0; p.ls2 = 0; p.v = 0; p.holdRes = false;
  if (G.waiting === p) G.waiting = null;
  if (G.sel === p) G.sel = null;
}

// ---- moving along legs (taxi in, pushback, pivot, drive out) -----------------------------------
function isBlocked(p) {
  const hx = Math.sin(p.hd), hy = -Math.cos(p.hd), Lp = planeLen(p);
  for (const q of G.planes) {
    if (q === p || !(q.st === 'taxiIn' || q.st === 'depart' || q.st === 'waiting' || q.st === 'hold')) continue;
    const dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy), gap = (Lp + planeLen(q)) * 0.5 + 22;
    if (d > gap + 30 || d < 1) continue;
    if ((dx * hx + dy * hy) / d < 0.55) continue;                         // not in front of us
    if (Math.abs(angDiff(p.hd, q.hd)) > 1.2) continue;                     // oncoming or crossing: let them pass
    if (d < gap) return true;
  }
  return false;
}
const _tmp = [0, 0, 0];
function stepLegs(p, dt) {
  const leg = p.legs[p.li];
  if (!leg) { legsDone(p); return; }
  if (p.st === 'depart' && p.li === 0 && p.ls2 === 0 && !p.started) {              // wait until the jet bridge has been pulled back
    const b = G.bridges[p.stand]; if (b && b.f > 0.04) return;
    p.started = true;
  }
  if (leg.k === 'pivot') {
    if (leg.dir === undefined) leg.dir = angDiff(p.hd, leg.to) >= 0 ? 1 : -1;          // turn the short way (clockwise on a tie)
    let rem = ((leg.to - p.hd) * leg.dir) % TAU; if (rem < 0) rem += TAU;
    const step = TURN_RATE * dt * (0.35 + 0.65 * Math.min(1, rem / 0.5));
    if (rem <= step || rem > TAU - 0.05) { p.hd = leg.to; p.li++; p.ls2 = 0; } else p.hd += leg.dir * step;
    p.v = 0; return;
  }
  const path = leg.path;
  let lim = Math.max(8, pathLimit(path, p.ls2));
  if (leg.mode === 'fwd') {
    if (isBlocked(p)) lim = 0;
    if (leg.hold) {                                                          // queue for the take-off point
      const gate = Math.max(0, path.len - 330);
      if (!p.holdRes) {
        if (p.ls2 >= gate - 2) { if (!G.holdOwner || G.holdOwner === p) { G.holdOwner = p; p.holdRes = true; } }
        if (!p.holdRes) lim = Math.min(lim, Math.sqrt(2 * path.dec * Math.max(0, gate - p.ls2 - 3)) + (p.ls2 >= gate - 2 ? 0 : 0));
      }
    }
  }
  p.v += clamp(lim - p.v, -path.dec * dt, path.acc * dt);
  if (p.v < 0) p.v = 0;
  p.ls2 = Math.min(path.len, p.ls2 + p.v * dt);
  const q = pathAt(path, p.ls2, _tmp); p.x = q[0]; p.y = q[1]; p.hd = leg.mode === 'rev' ? q[2] + Math.PI : q[2];
  if (p.st === 'depart' && !p.freed && (p.li > 0 || p.ls2 > 100)) { p.freed = true; G.stands[p.stand] = null; }
  if (path.len - p.ls2 < 0.01) {
    p.li++; p.ls2 = 0; p.v = 0;
    if (!p.legs[p.li]) legsDone(p);
  }
}
function legsDone(p) {
  const s = standById(p.stand);
  if (p.st === 'taxiIn') { p.st = 'parked'; p.x = s.x; p.y = s.y; p.hd = s.hd; p.v = 0; p.patience = p.pmax; p.tPark = G.t; p.legs = null; }
  else if (p.st === 'depart') { p.st = 'hold'; p.x = HOLD.x; p.y = HOLD.y; p.hd = 0; p.v = 0; p.holdT = 0; p.legs = null; G.holdOwner = p; }
}

// ---- parked planes: patience, services --------------------------------------------------------
function stepParked(p, dt) {
  if (!p.svc) {
    p.patience -= dt;
    if (p.patience <= 0) { loseGame('patience', p, 'Превышен предел ожидания по обслуживанию рейса!'); return; }
  } else updateService(p, dt);
}
function svcDuration(p, k) {
  const s = standById(p.stand); let d = SVC_TIME;
  if (k === 'deboard' || k === 'board') d = s.kind === 'jet' ? SVC_TIME : STEP_TIME_REMOTE;
  if (k === 'board' && G.upg.reg) d *= FAST;
  if (k === 'fuel' && G.upg.fuel) d *= FAST;
  if (k === 'baggage' && ((s.sector === 'A' || s.sector === 'B') ? G.upg.bagAB : (s.sector === 'C' || s.sector === 'D') ? G.upg.bagCD : false)) d *= FAST;
  return d;
}
function needsPicker(p, k) {
  const s = standById(p.stand), ab = s.sector === 'A' || s.sector === 'B';
  if (k === 'takeoff') return false;
  if (k === 'deboard') return s.kind === 'jet' ? !(ab ? G.upg.brgAB : G.upg.brgCD) : !G.upg.bus;
  if (k === 'board' && s.kind === 'jet') return !(ab ? G.upg.brgAB : G.upg.brgCD);
  if (k === 'catering') return !G.upg.cater;
  return true;
}
function startService(p, k) {
  const s = standById(p.stand), passenger = k === 'deboard' || k === 'board';
  p.svc = { k, st: 'in', t: 0, dur: svcDuration(p, k), veh: [] };
  G.sel = null; G.picker = null;
  if (passenger && s.kind === 'jet') { G.bridges[s.id].tgt = 1; G.bridges[s.id].T = p.T; SND.play('bridge'); }
  else SVC_VEH[k].forEach((vk, i) => p.svc.veh.push(spawnVehicle(p, vk, i * 0.9)));
}
function updateService(p, dt) {
  const sv = p.svc, s = standById(p.stand);
  if (sv.st === 'in') {
    const needBridge = (sv.k === 'deboard' || sv.k === 'board') && s.kind === 'jet';
    if (sv.veh.every(v => v.phase !== 'in') && (!needBridge || G.bridges[s.id].f >= 0.999)) { sv.st = 'work'; sv.t = 0; }
  } else if (sv.t += dt, sv.t >= sv.dur) {
    sv.veh.forEach(v => { v.phase = 'out'; });
    p.svc = null; p.svcIdx++;
    p.patience = Math.min(p.pmax, p.patience + p.pmax * 0.4);
    SND.play('done');
    if (p.svcIdx >= 5) { p.ready = true; if (G.upg.ready) SND.play('ready'); }
  }
}
function departPlane(p) {
  const s = standById(p.stand);
  p.st = 'depart'; p.legs = routeDepart(s); p.li = 0; p.ls2 = 0; p.v = 0; p.started = false; p.holdRes = false;
  if (G.bridges[s.id]) { G.bridges[s.id].tgt = 0; SND.play('bridge'); }
  G.sel = null; G.picker = null;
}
function stepHold(p, dt) {
  p.holdT += dt;
  const busy = G.planes.some(q => q.st === 'takeoff' && q.y > 430);
  if (p.holdT > 1.6 && !busy) { p.st = 'takeoff'; p.v = 0; p.lifted = false; G.holdOwner = null; SND.play('engineTake'); }
}
function stepTakeoff(p, dt) {
  p.v = Math.min(590, p.v + 205 * dt); p.y -= p.v * dt; p.x = TAKEOFF.x; p.hd = 0;
  p.alt = clamp((TAKEOFF.liftY - p.y) / 380, 0, 1);
  if (!p.lifted && p.y < TAKEOFF.liftY) { p.lifted = true; tookOff(p); }
  if (p.y < TAKEOFF.y1) p.st = 'gone';
}
function tookOff(p) {
  const g = G, cycle = g.t - p.tPark;
  const speed = clamp(1.5 - (cycle - 70) / 140, 1, 1.5), lvl = 1 + 0.12 * (g.n - 1);
  const reward = Math.round(BASE_REWARD[p.T] * lvl * speed / 5) * 5;
  g.money += reward; g.earned += reward; g.score += reward * 5; g.left[p.T] = Math.max(0, g.left[p.T] - 1);
  g.lastTake = g.t; SND.play('coin');
}

// ---- vehicles ---------------------------------------------------------------------------------
function dockPose(kind, s, T) {
  const a = [Math.sin(s.hd), -Math.cos(s.hd)], r = [-a[1], a[0]], L = T.L, fw = T.fw;
  const at = (al, lat) => [s.x + a[0] * al + r[0] * lat, s.y + a[1] * al + r[1] * lat], toR = hdOf(r[0], r[1]);
  switch (kind) {
    case 'stairs': return { p: at(0.30 * L, -(fw / 2 + 21.6)), hd: toR };
    case 'bus':    return { p: at(0.30 * L, -(fw / 2 + 52)), hd: s.hd };
    case 'train':  return { p: at(-0.10 * L, fw / 2 + 34), hd: toR };
    case 'fuel':   return { p: at(-0.05 * L, fw / 2 + 25), hd: s.hd };
    default:       return { p: at(-0.30 * L, -(fw / 2 + 26)), hd: toR };       // cater
  }
}
function spawnVehicle(p, kind, delay) {
  const s = standById(p.stand), pose = dockPose(kind, s, TYPES[p.T]), base = vehicleBase(s);
  let best = Math.max(0, base.length - 26), bd = 1e9;
  for (let i = Math.max(0, base.length - 26); i < base.length; i++) { const d = Math.hypot(base[i][0] - pose.p[0], base[i][1] - pose.p[1]); if (d < bd) { bd = d; best = i; } }
  const pts = base.slice(0, best + 1); pts.push(pose.p);
  const path = makePath(pts);
  const v = { id: G.vid++, k: kind, stand: s.id, path, s: 0, x: pts[0][0], y: pts[0][1], hd: path.tan[0], dockHd: pose.hd, v: 0, phase: 'in', wait: delay, dead: false };
  G.vehicles.push(v); return v;
}
function stepVehicle(v, dt) {
  const L = v.path.len;
  if (v.wait > 0) { v.wait -= dt; return; }
  if (v.phase === 'in') {
    const rem = L - v.s, vt = Math.min(210, Math.max(24, Math.sqrt(2 * 160 * rem)));
    v.v += clamp(vt - v.v, -300 * dt, 150 * dt); v.s = Math.min(L, v.s + v.v * dt);
    const q = pathAt(v.path, v.s, _tmp), want = rem < 38 ? v.dockHd : q[2];
    v.x = q[0]; v.y = q[1]; v.hd += clamp(angDiff(v.hd, want), -5 * dt, 5 * dt);
    if (L - v.s < 0.2) { v.phase = 'work'; v.v = 0; v.hd = v.dockHd; }
  } else if (v.phase === 'out') {
    v.v += clamp(200 - v.v, -300 * dt, 140 * dt); v.s = Math.max(0, v.s - v.v * dt);
    const q = pathAt(v.path, v.s, _tmp);
    v.x = q[0]; v.y = q[1]; v.hd += clamp(angDiff(v.hd, q[2] + Math.PI), -5 * dt, 5 * dt);
    if (v.s <= 0.2) v.dead = true;
  }
}

// ---- player commands --------------------------------------------------------------------------
function planeAt(wx, wy) {
  let best = null, bd = 1e9;
  for (const p of G.planes) {
    if (p.st !== 'parked' && p.st !== 'waiting') continue;
    const T = TYPES[p.T], r = Math.max(T.L, T.S) / 2 + 12, d = Math.hypot(wx - p.x, wy - p.y);
    let hit = d < r; if (p.st === 'parked') { const s = standById(p.stand); hit = hit || (Math.abs(wx - s.x) < s.r + 6 && Math.abs(wy - s.y) < s.r + 6); }
    if (hit && d < bd) { bd = d; best = p; }
  }
  return best;
}
function standAt(wx, wy) { return STANDS.find(s => Math.abs(wx - s.x) < s.r + 4 && Math.abs(wy - s.y) < s.r + 4) || null; }
// tap on the airfield; returns the sound to play
function tapWorld(wx, wy) {
  const g = G; if (!g || g.over) return;
  const p = planeAt(wx, wy);
  if (p && p !== g.sel) { g.sel = p; g.picker = null; SND.play('select'); return; }
  if (p && p === g.sel) { g.sel = null; g.picker = null; return; }
  const s = standAt(wx, wy);
  if (g.sel && g.sel.st === 'waiting' && s && !g.stands[s.id]) { sendToStand(g.sel, s); SND.play('tap'); return; }
  if (g.sel || g.picker) { g.sel = null; g.picker = null; }
}
function pressService(k) {
  const g = G; if (!g || g.over) return;
  const p = g.sel;
  if (!p || p.st !== 'parked' || p.svc) return;
  if (SERVICES[p.svcIdx] !== k) return;                                       // out of order: nothing happens
  if (k === 'takeoff') { departPlane(p); SND.play('tap'); return; }
  if (g.picker && g.picker.svc === k) { g.picker = null; return; }
  if (needsPicker(p, k)) { g.picker = { plane: p, svc: k, flash: 0 }; SND.play('tap'); }
  else { startService(p, k); SND.play('tap'); }
}
function pickSize(sz) {
  const g = G; if (!g || !g.picker) return;
  const pk = g.picker, p = pk.plane;
  if (sz === p.T) { startService(p, pk.svc); SND.play('tap'); } else { pk.flash = 0.55; SND.play('error'); }
}

// ---- end of the level -------------------------------------------------------------------------
function loseGame(reason, p, text) {
  if (G.over) return;
  G.over = { win: false, reason, text, standId: p && p.stand, wx: p && p.x, wy: p && p.y }; G.overT = 0; G.sel = null; G.picker = null; SND.play('lose');
}
function winGame() {
  if (G.over) return;
  const g = G, base = g.lastArr, tut = g.n === 1, time = g.t;
  const stars = time <= base + (tut ? 180 : 125) ? 3 : time <= base + (tut ? 300 : 190) ? 2 : 1;
  const before = SAVE.lv[g.n] || { stars: 0, score: 0 };
  SAVE.lv[g.n] = { stars: Math.max(before.stars, stars), score: Math.max(before.score, g.score) };
  SAVE.money = g.money; writeSave();
  g.over = { win: true, stars, reward: g.earned, time }; g.overT = 0; g.sel = null; g.picker = null; SND.play('win');
}

// ---- tutorial hints (level 1) ------------------------------------------------------------------
function updateHint() {
  const g = G; if (!g.def.tut) { g.hint = ''; return; }
  const p = g.planes[0];
  let h = 'Приготовьтесь: самолёт заходит на посадку.';
  if (p) {
    if (p.st === 'land') h = 'Самолёт заходит на посадку на правую полосу.';
    else if (p.st === 'waiting') h = g.sel === p ? 'Теперь нажмите на любую свободную стоянку.' : 'Самолёт приземлился. Нажмите на него, затем на свободную стоянку.';
    else if (p.st === 'taxiIn') h = 'Самолёт сам едет на стоянку.';
    else if (p.st === 'parked') {
      if (p.svc) h = 'Машины едут к самолёту. Подождите, пока услуга выполнится.';
      else if (p.svcIdx >= 5) h = g.sel === p ? 'Нажмите значок «Взлёт» внизу.' : 'Самолёт готов. Нажмите на него, затем на значок «Взлёт».';
      else if (g.picker) h = 'Выберите силуэт, подходящий по размеру самолёта.';
      else if (g.sel === p) h = 'Нажмите значок «' + SERVICE_NAMES[SERVICES[p.svcIdx]] + '» внизу.';
      else h = p.svcIdx === 0 ? 'Нажмите на самолёт, затем на значок «Высадка пассажиров» внизу.' : 'Следующая услуга: ' + SERVICE_NAMES[SERVICES[p.svcIdx]].toLowerCase() + '. Нажмите на самолёт.';
    } else if (p.st === 'depart' || p.st === 'hold' || p.st === 'takeoff') h = 'Самолёт сам доедет до полосы и взлетит.';
  } else if (g.left.S + g.left.M + g.left.L === 0) h = 'Отлично!';
  g.hint = h;
}
