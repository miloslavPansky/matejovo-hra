// Generates the levels of world 1 (Zlaté duny) in Tiled JSON format, plus public/levels/index.json.
// Every level is 480 x 17 tiles split into eight sections of about 60 tiles. Each section is one of
// the hand-designed segment lists below (grouped into five difficulty tiers); a checkpoint follows each
// of the first seven sections. Levels mix two neighbouring tiers, so the hardest level is as dense as
// the hardest tier and never harder. Finally the levels are ordered by their number of hazards.
// The JSON files can be edited in Tiled (https://www.mapeditor.org/) afterwards.
import { writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const W = 480, H = 17, TILE = 16, BASE = 13, MIN_TOP = 9;
const SAND = 1, STONE = 2, PLANK = 3, STONE2 = 4; // keep in sync with src/config.ts TILES
const LEVEL_COUNT = 10;
const SECTIONS = 8;
const START_ZONE = 6;     // flat columns at the start
const CHECK_ZONE = 8;     // flat columns around each checkpoint (flag at the 4th column)
const FINISH_ZONE = 8;    // flat columns at the end
// Last column each section may use; checkpoints follow at columns 59, 119, …, 419.
const SECTION_END = Array.from({ length: SECTIONS }, (_, i) => (i < SECTIONS - 1 ? 60 * (i + 1) - 5 : W - FINISH_ZONE - 1));

function rng(seed) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Segments:
 *  flat N [c]  N flat columns, "c" adds coins just above the ground
 *  up / down   raise or lower the ground by one tile from the next column
 *  scorp N     N flat columns with a patrolling scorpion and coins above it
 *  plant       5 columns, carnivorous plant in the middle, coin arc above
 *  cactus      5 columns, cactus in the middle, coin arc above
 *  gap N       N empty columns (max 4) with a coin arc, then 2 landing columns
 *  gapP N      like gap, with a one-way plank stepping stone in the middle
 *  plat N      N flat columns with a plank platform 3 tiles above and coins on it
 *  hill        7 columns: up 1, up 2, down, with coins on the top
 */
const TIERS = [
  { n: 1, q: [
    ['flat 4 c', 'scorp 9', 'gap 2', 'plant', 'flat 3 c', 'cactus', 'hill'],
    ['plat 8', 'scorp 9', 'gap 2', 'plant', 'flat 4 c', 'cactus', 'hill'],
    ['flat 3 c', 'plant', 'gap 2', 'scorp 9', 'plat 8', 'cactus', 'flat 4 c'],
    ['hill', 'scorp 9', 'gap 2', 'cactus', 'flat 3 c', 'plant'],
  ] },
  { n: 2, q: [
    ['scorp 8', 'gap 2', 'up', 'plant', 'cactus', 'down', 'gap 3', 'scorp 8'],
    ['hill', 'plat 8', 'gap 3', 'plant', 'scorp 9', 'cactus'],
    ['cactus', 'gap 3', 'up', 'scorp 8', 'plant', 'down', 'plat 8', 'gap 2'],
    ['scorp 8', 'gap 3', 'plant', 'hill', 'cactus', 'gap 2', 'plant'],
  ] },
  { n: 3, q: [
    ['up', 'scorp 8', 'gap 3', 'plat 8', 'down', 'plant', 'cactus', 'gap 3', 'scorp 8'],
    ['plant', 'gap 3', 'hill', 'scorp 8', 'plat 7', 'cactus', 'gap 3', 'plant'],
    ['scorp 8', 'up', 'cactus', 'gap 3', 'plant', 'down', 'scorp 8', 'gap 3', 'cactus'],
    ['plat 7', 'plant', 'gap 3', 'hill', 'scorp 8', 'cactus'],
  ] },
  { n: 4, q: [
    ['scorp 8', 'gapP 4', 'cactus', 'up', 'plant', 'up', 'scorp 8', 'down', 'gap 3', 'plant'],
    ['down', 'plat 7', 'gap 4', 'scorp 8', 'cactus', 'gap 3', 'plant', 'scorp 8'],
    ['cactus', 'gap 4', 'up', 'scorp 8', 'plant', 'gapP 4', 'cactus', 'down', 'plant'],
    ['scorp 8', 'gap 3', 'hill', 'plant', 'gap 4', 'cactus'],
  ] },
  { n: 5, q: [
    ['plant', 'gapP 4', 'scorp 8', 'cactus', 'gap 3', 'up', 'plant', 'up', 'scorp 7', 'cactus'],
    ['down', 'gap 4', 'plant', 'gapP 4', 'scorp 8', 'cactus', 'down', 'plant', 'gap 3', 'scorp 7'],
    ['cactus', 'gap 4', 'plant', 'up', 'scorp 8', 'gapP 4', 'cactus', 'down', 'plant', 'gap 3'],
    ['scorp 8', 'gap 4', 'plant', 'cactus', 'hill', 'gap 3', 'scorp 7'],
  ] },
];

/** Columns a segment list needs, including the steps back down to the base height. */
function widthOf(list) {
  let w = 0, rise = 0;
  for (const s of list) {
    const [kind, arg] = s.split(' ');
    const n = Number(arg);
    if (kind === 'up') rise++;
    else if (kind === 'down') rise = Math.max(0, rise - 1);
    else if (kind === 'plant' || kind === 'cactus') w += 5;
    else if (kind === 'gap' || kind === 'gapP') w += n + 2;
    else if (kind === 'hill') w += 7;
    else w += n;
  }
  return w + rise;
}

/** Picks eight sections for level n: tier ceil(n/2), mixed with the tier below it (more of it on odd levels). */
function composeLevel(n) {
  const R = rng(1000 + n * 7919);
  const tier = Math.ceil(n / 2);
  const lower = Math.max(1, tier - 1);
  const fromLower = n % 2 ? 4 : 2;
  const tiers = Array.from({ length: SECTIONS }, (_, i) => (i < fromLower ? lower : tier));
  for (let i = tiers.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [tiers[i], tiers[j]] = [tiers[j], tiers[i]]; }
  const sections = [];
  let prev = null;
  tiers.forEach((t, i) => {
    const slot = SECTION_END[i] - (i === 0 ? START_ZONE : SECTION_END[i - 1] + 1 + CHECK_ZONE) + 1;
    const pool = TIERS[t - 1].q.filter((q) => q !== prev && widthOf(q) <= slot);
    const pick = pool[Math.floor(R() * pool.length)];
    sections.push(pick);
    prev = pick;
  });
  return { n, tier, sections };
}

function buildLevel(def) {
  const top = new Array(W).fill(null); // surface row per column, null = gap
  const planks = []; // [col, row]
  const objects = [];
  let col = 0, h = BASE, nextId = 1;

  const obj = (type, c, row, properties) => {
    const o = { id: nextId++, name: '', type, x: c * TILE + TILE / 2, y: Math.round(row * TILE), width: 0, height: 0, rotation: 0, visible: true, point: true };
    if (properties) o.properties = Object.entries(properties).map(([name, value]) => ({ name, type: 'int', value }));
    objects.push(o);
  };
  const coin = (c, rowsAbove, base = top[c] ?? h) => obj('coin', c, base - rowsAbove + 0.5);
  const flat = (n) => { for (let i = 0; i < n; i++) top[col++] = h; };
  const arc = (c0, n) => { for (let i = 0; i < n; i++) coin(c0 + i, i === 0 || i === n - 1 ? 3 : 4, h); };

  const segment = (s) => {
    const [kind, arg, flag] = s.split(' ');
    const n = Number(arg);
    const start = col;
    switch (kind) {
      case 'flat': flat(n); if (flag === 'c') for (let i = 1; i < n - 1; i++) coin(start + i, 1); break;
      // Sections always start at the base height, so a "down" at the base is simply skipped.
      case 'up': if (h - 1 >= MIN_TOP) h--; break;
      case 'down': if (h + 1 <= BASE) h++; break;
      case 'scorp': {
        if (n < 7) throw new Error('scorp needs at least 7 columns');
        flat(n);
        const mid = start + Math.floor(n / 2);
        obj('scorpion', mid, h, { range: Math.floor((n / 2 - 1.5) * TILE) });
        arc(mid - 1, 3);
        break;
      }
      case 'plant': case 'cactus':
        flat(5); obj(kind, start + 2, h); arc(start + 1, 3); break;
      case 'gap': case 'gapP': {
        if (n > 4) throw new Error('gap max 4');
        for (let i = 0; i < n; i++) top[col++] = null;
        if (kind === 'gapP') planks.push([start + Math.floor(n / 2) - (n % 2 ? 0 : 1), h - 2], [start + Math.floor(n / 2), h - 2]);
        for (let i = 0; i < n; i++) coin(start + i, kind === 'gapP' ? 3 : 4, h);
        flat(2);
        break;
      }
      case 'plat': {
        flat(n);
        for (let c = start + 1; c < start + n - 1; c++) { planks.push([c, h - 3]); coin(c, 4, h); }
        break;
      }
      case 'hill': {
        if (h - 2 < MIN_TOP) throw new Error(`L${def.n}: hill too high`);
        h--; flat(2); h--; flat(3); for (let i = 0; i < 3; i++) coin(col - 3 + i, 1); h++; flat(2); h++;
        break;
      }
      default: throw new Error(`Unknown segment ${s}`);
    }
  };

  flat(START_ZONE);
  obj('start', 2, h);
  def.sections.forEach((section, si) => {
    for (const s of section) segment(s);
    while (h < BASE) { flat(1); h++; } // step back down to the base height
    const end = SECTION_END[si];
    if (col > end + 1) throw new Error(`L${def.n}: section ${si + 1} too long (ends at ${col - 1}, limit ${end})`);
    flat(end + 1 - col);
    if (si < SECTIONS - 1) {
      const cp = col + 3;
      flat(CHECK_ZONE);
      obj('checkpoint', cp, h);
    }
  });
  flat(W - col);
  obj('finish', W - 4, h);

  const data = new Array(W * H).fill(0);
  for (let c = 0; c < W; c++) {
    if (top[c] === null) continue;
    data[top[c] * W + c] = SAND;
    for (let r = top[c] + 1; r < H; r++) data[r * W + c] = (c * 7 + r * 3) % 5 === 0 ? STONE2 : STONE;
  }
  for (const [c, r] of planks) data[r * W + c] = PLANK;

  return {
    compressionlevel: -1, width: W, height: H, tilewidth: TILE, tileheight: TILE, infinite: false,
    orientation: 'orthogonal', renderorder: 'right-down', tiledversion: '1.11.0', type: 'map', version: '1.10',
    nextlayerid: 3, nextobjectid: nextId,
    properties: [{ name: 'nazev', type: 'string', value: `Kraj 1 · Level ${def.n}` }],
    layers: [
      { id: 1, name: 'teren', type: 'tilelayer', width: W, height: H, x: 0, y: 0, opacity: 1, visible: true, data },
      { id: 2, name: 'objekty', type: 'objectgroup', draworder: 'topdown', x: 0, y: 0, opacity: 1, visible: true, objects },
    ],
    tilesets: [{ firstgid: 1, name: 'poust', image: '../tiles/poust.png', imagewidth: 64, imageheight: 16, tilewidth: 16, tileheight: 16, tilecount: 4, columns: 4, margin: 0, spacing: 0 }],
  };
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'public', 'levels');
mkdirSync(dir, { recursive: true });
for (const f of readdirSync(dir)) if (/^level-1-\d+\.json$/.test(f)) unlinkSync(join(dir, f));

const HAZARDS = ['scorpion', 'plant', 'cactus'];
const built = Array.from({ length: LEVEL_COUNT }, (_, i) => composeLevel(i + 1)).map((def) => {
  const map = buildLevel(def);
  return { def, map, hazards: map.layers[1].objects.filter((o) => HAZARDS.includes(o.type)).length };
});
// Order by number of hazards so difficulty never drops from one level to the next.
built.sort((a, b) => a.hazards - b.hazards || a.def.n - b.def.n);

const index = [];
built.forEach(({ map, def }, i) => {
  const n = i + 1;
  map.properties = [{ name: 'nazev', type: 'string', value: `Kraj 1 · Level ${n}` }];
  const key = `level-1-${n}`;
  writeFileSync(join(dir, `${key}.json`), JSON.stringify(map, null, 1) + '\n');
  index.push({ key, file: `levels/${key}.json`, name: `Level ${n}` });
  const objs = map.layers[1].objects;
  const count = (t) => objs.filter((o) => o.type === t).length;
  console.log(`${key} (tier ${def.tier}): ${count('coin')} coins, ${count('scorpion')} scorpions, ${count('plant')} plants, ${count('cactus')} cacti, ${count('checkpoint')} checkpoints`);
});
writeFileSync(join(dir, 'index.json'), JSON.stringify({ world: 'Zlaté duny', levels: index }, null, 1) + '\n');
