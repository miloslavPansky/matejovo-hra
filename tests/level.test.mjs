// Sanity checks for level files: structure, required objects, jumpable gaps and rising difficulty.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'levels');
const index = JSON.parse(readFileSync(join(dir, 'index.json'), 'utf8'));
const MAX_GAP = 4; // tiles; a full-speed jump covers about 5
const VALID_TILES = new Set([0, 1, 2, 3, 4]);
const SOLID = new Set([1, 2, 4]);
const HAZARDS = ['scorpion', 'plant', 'cactus'];

const load = (l) => JSON.parse(readFileSync(join(dir, l.file.replace(/^levels\//, '')), 'utf8'));
const surfaceRow = (map, terrain, c) => {
  for (let r = 0; r < map.height; r++) if (SOLID.has(terrain.data[r * map.width + c])) return r;
  return null;
};

test('world 1 has five levels', () => {
  assert.equal(index.levels.length, 5);
});

const stats = [];
for (const level of index.levels) {
  const map = load(level);
  const terrain = map.layers.find((l) => l.name === 'teren');
  const objects = map.layers.find((l) => l.name === 'objekty')?.objects ?? [];
  stats.push({ key: level.key, hazards: objects.filter((o) => HAZARDS.includes(o.type)).length, gaps: 0 });

  test(`${level.key}: size and layers`, () => {
    assert.equal(map.width, 240, 'every level is 240 tiles long');
    assert.equal(map.tilewidth, 16);
    assert.ok(terrain, 'tile layer "teren" exists');
    assert.equal(terrain.data.length, map.width * map.height);
    for (const id of terrain.data) assert.ok(VALID_TILES.has(id), `unknown tile id ${id}`);
  });

  test(`${level.key}: start, three evenly spaced checkpoints, finish`, () => {
    for (const type of ['start', 'finish']) assert.equal(objects.filter((o) => o.type === type).length, 1, `exactly one ${type}`);
    const cps = objects.filter((o) => o.type === 'checkpoint').map((o) => Math.floor(o.x / 16)).sort((a, b) => a - b);
    assert.equal(cps.length, 3, 'three checkpoints');
    [60, 120, 180].forEach((target, i) => assert.ok(Math.abs(cps[i] - target) <= 8, `checkpoint ${i + 1} near column ${target} (is ${cps[i]})`));
  });

  test(`${level.key}: objects inside the map, scorpions have a range`, () => {
    for (const o of objects) assert.ok(o.x >= 0 && o.x <= map.width * 16 && o.y >= 0 && o.y <= map.height * 16, `${o.type} #${o.id} out of bounds`);
    for (const s of objects.filter((o) => o.type === 'scorpion')) assert.ok(s.properties?.some((p) => p.name === 'range'), `scorpion #${s.id} needs a range`);
  });

  test(`${level.key}: gaps are jumpable and steps are at most one tile`, () => {
    let run = 0, prev = surfaceRow(map, terrain, 0);
    const st = stats.find((s) => s.key === level.key);
    for (let c = 0; c < map.width; c++) {
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
}

test('difficulty rises from level to level', () => {
  for (let i = 1; i < stats.length; i++) {
    assert.ok(stats[i].hazards >= stats[i - 1].hazards, `${stats[i].key} has fewer hazards than ${stats[i - 1].key}`);
  }
  assert.ok(stats.at(-1).hazards > stats[0].hazards, 'the last level is harder than the first');
});
