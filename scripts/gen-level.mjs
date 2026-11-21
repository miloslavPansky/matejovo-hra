// Generates the levels of world 1 (Zlaté duny) in Tiled JSON format, plus public/levels/index.json.
// Every level is 120 x 17 tiles. A level is a hand-written list of segments; the builder lays them
// out, pads with flat ground, and places the start, the checkpoint (middle) and the finish (Sun Gate).
// The JSON files can be edited in Tiled (https://www.mapeditor.org/) afterwards.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const W = 120, H = 17, TILE = 16, BASE = 13, MIN_TOP = 9;
const SAND = 1, STONE = 2, PLANK = 3, STONE2 = 4; // keep in sync with src/config.ts TILES
const HALF_A = [6, 55];   // columns available for the first half
const CHECK_ZONE = 8;     // flat columns around the checkpoint
const HALF_B_END = 111;   // last column of the second half; the rest is the finish zone

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
const LEVELS = [
  { n: 1, a: ['flat 4 c', 'scorp 9', 'gap 2', 'plant', 'flat 3 c', 'cactus', 'hill'], b: ['plat 8', 'scorp 9', 'gap 2', 'plant', 'flat 3 c', 'cactus'] },
  { n: 2, a: ['scorp 8', 'gap 2', 'up', 'plant', 'cactus', 'down', 'gap 3', 'scorp 8'], b: ['hill', 'plat 8', 'gap 3', 'plant', 'scorp 9', 'cactus'] },
  { n: 3, a: ['up', 'scorp 8', 'gap 3', 'plat 8', 'down', 'plant', 'cactus', 'gap 3', 'scorp 8'], b: ['plant', 'gap 3', 'hill', 'scorp 8', 'plat 7', 'cactus', 'gap 3', 'plant'] },
  { n: 4, a: ['scorp 8', 'gapP 4', 'cactus', 'up', 'plant', 'up', 'scorp 8', 'down', 'gap 3', 'plant'], b: ['down', 'plat 7', 'gap 4', 'scorp 8', 'cactus', 'gap 3', 'plant', 'scorp 8'] },
  { n: 5, a: ['plant', 'gapP 4', 'scorp 8', 'cactus', 'gap 3', 'up', 'plant', 'up', 'scorp 7', 'cactus'], b: ['down', 'gap 4', 'plant', 'gapP 4', 'scorp 8', 'cactus', 'down', 'plant', 'gap 3', 'scorp 7'] },
];

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
      case 'up': if (h - 1 < MIN_TOP) throw new Error(`L${def.n}: too high`); h--; break;
      case 'down': if (h + 1 > BASE) throw new Error(`L${def.n}: below base`); h++; break;
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

  // start zone
  flat(HALF_A[0]);
  obj('start', 2, h);
  for (const s of def.a) segment(s);
  if (col > HALF_A[1] + 1) throw new Error(`L${def.n}: first half too long (${col})`);
  flat(HALF_A[1] + 1 - col);
  const cp = col + 3;
  flat(CHECK_ZONE);
  obj('checkpoint', cp, h);
  for (const s of def.b) segment(s);
  if (col > HALF_B_END + 1) throw new Error(`L${def.n}: second half too long (${col})`);
  flat(HALF_B_END + 1 - col);
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
const index = [];
for (const def of LEVELS) {
  const map = buildLevel(def);
  const key = `level-1-${def.n}`;
  writeFileSync(join(dir, `${key}.json`), JSON.stringify(map, null, 1) + '\n');
  index.push({ key, file: `levels/${key}.json`, name: `Level ${def.n}` });
  const objs = map.layers[1].objects;
  const count = (t) => objs.filter((o) => o.type === t).length;
  console.log(`${key}: ${count('coin')} coins, ${count('scorpion')} scorpions, ${count('plant')} plants, ${count('cactus')} cacti`);
}
writeFileSync(join(dir, 'index.json'), JSON.stringify({ world: 'Zlaté duny', levels: index }, null, 1) + '\n');
