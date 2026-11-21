// Generates public/levels/level-1-1.json in Tiled JSON format (map 120 x 17 tiles of 16 px).
// The file can be opened and edited in Tiled (https://www.mapeditor.org/); this script is only
// the starting point for the first prototype level.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const W = 120;
const H = 17;
const TILE = 16;
const GROUND = 13; // default row of the sand surface
// Tile ids (gid, firstgid = 1). Must match src/config.ts TILES.
const SAND = 1, STONE = 2, PLANK = 3, STONE2 = 4;

const top = new Array(W).fill(GROUND);
const gap = new Array(W).fill(false);
const setTop = (a, b, row) => { for (let c = a; c <= b; c++) top[c] = row; };
const setGap = (a, b) => { for (let c = a; c <= b; c++) gap[c] = true; };

// Terrain
setTop(15, 19, 12);
setGap(30, 31);
setTop(38, 39, 12); setTop(40, 43, 11); setTop(44, 47, 12);
setGap(69, 71);
setTop(80, 83, 12); setTop(84, 87, 11); setTop(88, 91, 12);
setGap(95, 96);

const data = new Array(W * H).fill(0);
const put = (c, r, id) => { data[r * W + c] = id; };
for (let c = 0; c < W; c++) {
  if (gap[c]) continue;
  put(c, top[c], SAND);
  for (let r = top[c] + 1; r < H; r++) put(c, r, (c * 7 + r * 3) % 5 === 0 ? STONE2 : STONE);
}
// One-way plank platforms
const planks = [[50, 53, 9], [104, 108, 9]];
for (const [a, b, r] of planks) for (let c = a; c <= b; c++) put(c, r, PLANK);

// Objects
let nextId = 1;
const objects = [];
const point = (type, col, row, properties) => {
  const o = { id: nextId++, name: '', type, x: col * TILE + TILE / 2, y: row * TILE, width: 0, height: 0, rotation: 0, visible: true, point: true };
  if (properties) o.properties = Object.entries(properties).map(([name, value]) => ({ name, type: 'int', value }));
  objects.push(o);
};
const onGround = (c) => top[c]; // y of the surface row => objects stand on it

point('start', 2, onGround(2));
point('checkpoint', 60, onGround(60));
point('finish', 116, onGround(116));

// Scorpions patrol +- range pixels around their spawn
for (const [c, range] of [[23, 48], [51, 52], [76, 52], [100, 40]]) point('scorpion', c, onGround(c), { range });
// Carnivorous plants
for (const c of [35, 66, 112]) point('plant', c, onGround(c));

// Coins: [col, rowsAboveSurface]
const coin = (c, up) => point('coin', c, onGround(c) - up + 0.5);
for (const c of [6, 7, 8]) coin(c, 1);
for (const c of [16, 17, 18]) coin(c, 1);
for (const [c, up] of [[29, 3], [30.5, 4], [32, 3]]) coin(Math.round(c), up);
for (const [c, up] of [[34, 3], [35, 4], [36, 3]]) coin(c, up);
for (const c of [41, 42]) coin(c, 1);
for (const c of [50, 51, 52, 53]) point('coin', c, 8 + 0.5);
for (const c of [57, 58]) coin(c, 1);
for (const [c, up] of [[65, 3], [66, 4], [67, 3]]) coin(c, up);
for (const [c, up] of [[69, 4], [70, 5], [71, 4]]) point('coin', c, GROUND - up + 0.5);
for (const c of [85, 86]) coin(c, 1);
for (const [c, up] of [[95, 4], [96, 4]]) point('coin', c, GROUND - up + 0.5);
for (const c of [104, 105, 106, 107, 108]) point('coin', c, 8 + 0.5);
for (const [c, up] of [[111, 3], [112, 4], [113, 3]]) coin(c, up);

const map = {
  compressionlevel: -1,
  width: W,
  height: H,
  tilewidth: TILE,
  tileheight: TILE,
  infinite: false,
  orientation: 'orthogonal',
  renderorder: 'right-down',
  tiledversion: '1.11.0',
  type: 'map',
  version: '1.10',
  nextlayerid: 3,
  nextobjectid: nextId,
  properties: [{ name: 'nazev', type: 'string', value: 'Kraj 1 · Level 1' }],
  layers: [
    { id: 1, name: 'teren', type: 'tilelayer', width: W, height: H, x: 0, y: 0, opacity: 1, visible: true, data },
    { id: 2, name: 'objekty', type: 'objectgroup', draworder: 'topdown', x: 0, y: 0, opacity: 1, visible: true, objects },
  ],
  tilesets: [
    { firstgid: 1, name: 'poust', image: '../tiles/poust.png', imagewidth: 64, imageheight: 16, tilewidth: 16, tileheight: 16, tilecount: 4, columns: 4, margin: 0, spacing: 0 },
  ],
};

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'public', 'levels', 'level-1-1.json');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(map, null, 1) + '\n');
console.log(`Wrote ${out}: ${objects.length} objects, ${objects.filter((o) => o.type === 'coin').length} coins`);
