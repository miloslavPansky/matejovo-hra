// Sanity checks for level files: structure, required objects, jumpable gaps and rising difficulty.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'levels');
const index = JSON.parse(readFileSync(join(dir, 'index.json'), 'utf8'));
const MAX_GAP = 4; // tiles; a full-speed jump covers about 5
const VALID_TILES = new Set([0, 1, 2, 3, 4, 5]);
const PLANK = 3, FAKE = 5;
const SOLID = new Set([1, 2, 4]);
const HAZARDS = ['scorpion', 'plant', 'cactus'];

const load = (l) => JSON.parse(readFileSync(join(dir, l.file.replace(/^levels\//, '')), 'utf8'));
const surfaceRow = (map, terrain, c) => {
  for (let r = 0; r < map.height; r++) if (SOLID.has(terrain.data[r * map.width + c])) return r;
  return null;
};

test('world 1 has ten levels', () => {
  assert.equal(index.levels.length, 10);
});

const stats = [];
for (const level of index.levels) {
  const map = load(level);
  const terrain = map.layers.find((l) => l.name === 'teren');
  const objects = map.layers.find((l) => l.name === 'objekty')?.objects ?? [];
  stats.push({ key: level.key, hazards: objects.filter((o) => HAZARDS.includes(o.type)).length, gaps: 0 });
  const rooms = objects.filter((o) => o.type === 'secret');
  const inRoom = (c) => rooms.some((r) => c >= r.x / 16 && c < (r.x + r.width) / 16);

  test(`${level.key}: size and layers`, () => {
    assert.equal(map.width, 480, 'every level is 480 tiles long');
    assert.equal(map.tilewidth, 16);
    assert.ok(terrain, 'tile layer "teren" exists');
    assert.equal(terrain.data.length, map.width * map.height);
    for (const id of terrain.data) assert.ok(VALID_TILES.has(id), `unknown tile id ${id}`);
  });

  test(`${level.key}: start, a checkpoint every ~60 tiles, finish`, () => {
    for (const type of ['start', 'finish']) assert.equal(objects.filter((o) => o.type === type).length, 1, `exactly one ${type}`);
    const cps = objects.filter((o) => o.type === 'checkpoint').map((o) => Math.floor(o.x / 16)).sort((a, b) => a - b);
    assert.equal(cps.length, 7, 'seven checkpoints');
    cps.forEach((c, i) => assert.ok(Math.abs(c - 60 * (i + 1)) <= 8, `checkpoint ${i + 1} near column ${60 * (i + 1)} (is ${c})`));
  });

  test(`${level.key}: objects inside the map, scorpions have a range`, () => {
    for (const o of objects) assert.ok(o.x >= 0 && o.x <= map.width * 16 && o.y >= 0 && o.y <= map.height * 16, `${o.type} #${o.id} out of bounds`);
    for (const s of objects.filter((o) => o.type === 'scorpion')) assert.ok(s.properties?.some((p) => p.name === 'range'), `scorpion #${s.id} needs a range`);
  });

  test(`${level.key}: gaps are jumpable and steps are at most one tile`, () => {
    let run = 0, prev = surfaceRow(map, terrain, 0);
    const st = stats.find((s) => s.key === level.key);
    for (let c = 0; c < map.width; c++) {
      if (inRoom(c)) continue; // the secret room is checked on its own below
      const row = surfaceRow(map, terrain, c);
      if (row === null) {
        if (run === 0) st.gaps++;
        run++;
        assert.ok(run <= MAX_GAP, `gap wider than ${MAX_GAP} tiles at column ${c}`);
        continue;
      }
      if (run === 0 && prev !== null) assert.ok(Math.abs(row - prev) <= 1, `step of ${Math.abs(row - prev)} tiles at column ${c}`);
      run = 0;
      prev = row;
    }
  });

  test(`${level.key}: hazards stand on ground and not right at a gap landing`, () => {
    for (const o of objects.filter((x) => HAZARDS.includes(x.type))) {
      const c = Math.floor(o.x / 16);
      const row = surfaceRow(map, terrain, c);
      assert.ok(row !== null, `${o.type} #${o.id} floats over a gap`);
      assert.equal(o.y, row * 16, `${o.type} #${o.id} is not on the surface`);
      for (const d of [1, 2]) assert.ok(surfaceRow(map, terrain, c - d) !== null, `${o.type} #${o.id} too close after a gap`);
    }
  });

  test(`${level.key}: one secret room with a way in, coins and a way out`, () => {
    assert.equal(rooms.length, 1, 'exactly one secret room');
    const r = rooms[0];
    const c0 = r.x / 16, len = r.width / 16, top = r.y / 16 - 1; // surface row above the room
    const tile = (c, row) => terrain.data[row * map.width + c];
    assert.ok(top + 3 < map.height, 'the room has a floor inside the map');
    assert.deepEqual([tile(c0, top), tile(c0 + 1, top)], [FAKE, FAKE], 'entrance is fake sand');
    for (let i = len - 3; i < len; i++) assert.equal(tile(c0 + i, top), PLANK, 'exit is one-way planks');
    for (let i = 0; i < len; i++) {
      assert.equal(tile(c0 + i, top + 1), 0, 'cavity is empty');
      assert.equal(tile(c0 + i, top + 2), 0, 'cavity is two tiles high');
      assert.ok(SOLID.has(tile(c0 + i, top + 3)), 'cavity has a floor');
    }
    for (const c of [c0 - 1, c0 + len]) assert.equal(surfaceRow(map, terrain, c), top, 'ground on both sides is level with the room');
    const coins = objects.filter((o) => o.type === 'coin' && o.x / 16 > c0 && o.x / 16 < c0 + len && o.y > (top + 1) * 16);
    assert.ok(coins.length >= 8, 'bonus coins inside');
    for (const o of objects.filter((x) => HAZARDS.includes(x.type))) {
      const c = Math.floor(o.x / 16);
      assert.ok(c < c0 - 2 || c > c0 + len + 1, `${o.type} #${o.id} too close to the secret room`);
    }
  });
}

test('difficulty does not exceed the old hardest level (at most 22 hazards per 240 tiles)', () => {
  for (const s of stats) assert.ok(s.hazards <= 44, `${s.key} has ${s.hazards} hazards`);
});

test('difficulty rises from level to level', () => {
  for (let i = 1; i < stats.length; i++) {
    assert.ok(stats[i].hazards >= stats[i - 1].hazards, `${stats[i].key} has fewer hazards than ${stats[i - 1].key}`);
  }
  assert.ok(stats.at(-1).hazards > stats[0].hazards, 'the last level is harder than the first');
});
