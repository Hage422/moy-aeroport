// layout.js — the airfield (daytime map), world 2400 x 1105. All coordinates are world units.
const MAP_W = 2400, MAP_H = 1105;
const STAND_R = 58;                                   // octagon apothem

const RUNWAYS = [{ x0: 160, x1: 330, side: 'L' }, { x0: 2070, x1: 2240, side: 'R' }];
const APRON = { x0: 330, x1: 2070 };
const LANES = { V0: 425, V1: 650, V2: 1200, V3: 1750, V4: 1975 };
const TOP_Y = 150, H1_Y = 238, H2_Y = 520;            // top stand row, top taxi road, middle taxi road
const LOOP = { x: 760, y: 276, w: 880, h: 200 };       // big loop round the roundel

// two piers (sectors A/B and C/D), mirrored around x = 1200
function pierDef(mirror) {
  const m = x => (mirror ? MAP_W - x : x);
  return { base: [m(965), 1010], tip: [m(885), 585], hw0: 62, hw1: 56, mirror };
}
const PIERS = { AB: pierDef(false), CD: pierDef(true) };
const pierAxisX = (p, y) => p.base[0] + (p.tip[0] - p.base[0]) * (p.base[1] - y) / (p.base[1] - p.tip[1]);
const pierHalfW = (p, y) => p.hw0 + (p.hw1 - p.hw0) * (p.base[1] - y) / (p.base[1] - p.tip[1]);

// stands: nose direction hd (radians, 0 = up, clockwise), kind = jet | remote | big
function buildStands() {
  const S = [];
  const add = (id, x, y, hd, kind, extra = {}) => S.push(Object.assign({ id, x, y, hd, kind, r: kind === 'big' ? 80 : STAND_R }, extra));
  [TOP_Y].forEach(y => [760, 910, 1060, 1340, 1490, 1640].forEach((x, i) => add('T' + (i + 1), x, y, Math.PI, 'remote', { lane: 'top' })));
  [600, 726, 852].forEach((y, i) => { add('L' + (i + 1), 545, y, Math.PI / 2, 'remote', { lane: 'V0' }); add('R' + (i + 1), 2400 - 545, y, -Math.PI / 2, 'remote', { lane: 'V4' }); });
  add('X1', 548, 1000, Math.PI / 2, 'big', { lane: 'V0', label: 'A380' });
  [['AB', false], ['CD', true]].forEach(([k, mir]) => {
    const p = PIERS[k], first = mir ? 'C' : 'A', second = mir ? 'D' : 'B';
    [660, 786, 912].forEach((y, i) => {
      const xa = pierAxisX(p, y), hw = pierHalfW(p, y), off = hw + 76;
      // left of the axis / right of the axis (screen sides)
      const leftSide = { x: xa - off, hd: Math.PI / 2, wallX: xa - hw, door: -1 };
      const rightSide = { x: xa + off, hd: -Math.PI / 2, wallX: xa + hw, door: 1 };
      const a = mir ? rightSide : leftSide, b = mir ? leftSide : rightSide;
      add(first + (i + 1), a.x, y, a.hd, 'jet', { sector: first, wallX: a.wallX, side: a.door, lane: mir ? 'V3' : 'V1' });
      add(second + (i + 1), b.x, y, b.hd, 'jet', { sector: second, wallX: b.wallX, side: b.door, lane: 'V2' });
    });
  });
  return S;
}
const STANDS = buildStands();
const standById = id => STANDS.find(s => s.id === id);

const ISLANDS = [   // grass islands (pill shaped)
  { x: 470, y: 300, w: 190, h: 62 }, { x: 1740, y: 300, w: 190, h: 62 },
  { x: 374, y: 545, w: 28, h: 455 }, { x: 1998, y: 545, w: 28, h: 455 },
];

const ROUNDEL = { x: 1200, y: 376, r: 60 };
const TERMINAL = [[600, 1105], [715, 1014], [885, 975], [1515, 975], [1685, 1014], [1800, 1105]];
const UTILITY = { x: 376, y: -14, w: 200, h: 100 };
