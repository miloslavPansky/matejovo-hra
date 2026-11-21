// Sanity checks for level files: structure, required objects and that every gap is jumpable.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'levels');
const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
const MAX_GAP = 4; // tiles; jump reaches ~5 tiles at full run speed
const VALID_TILES = new Set([0, 1, 2, 3, 4]);

test('there is at least one level', () => {
  assert.ok(files.length > 0);
});

for (const file of files) {
  const map = JSON.parse(readFileSync(join(dir, file), 'utf8'));
  const terrain = map.layers.find((l) => l.name === 'teren');
  const objects = map.layers.find((l) => l.name === 'objekty')?.objects ?? [];

  test(`${file}: has the expected size and layers`, () => {
    assert.equal(map.width, 120, 'every level is 120 tiles long');
    assert.equal(map.tilewidth, 16);
    assert.ok(terrain, 'tile layer "teren" exists');
    assert.equal(terrain.data.length, map.width * map.height);
    for (const id of terrain.data) assert.ok(VALID_TILES.has(id), `unknown tile id ${id}`);
  });

  test(`${file}: has start, checkpoint and finish`, () => {
    for (const type of ['start', 'checkpoint', 'finish']) {
      assert.equal(objects.filter((o) => o.type === type).length, 1, `exactly one ${type}`);
    }
  });

  test(`${file}: objects are inside the map`, () => {
    for (const o of objects) {
      assert.ok(o.x >= 0 && o.x <= map.width * 16 && o.y >= 0 && o.y <= map.height * 16, `${o.type} #${o.id} out of bounds`);
    }
    for (const s of objects.filter((o) => o.type === 'scorpion')) {
      assert.ok(s.properties?.some((p) => p.name === 'range'), `scorpion #${s.id} needs a range`);
    }
  });

  test(`${file}: every gap is at most ${MAX_GAP} tiles wide`, () => {
    let run = 0;
    for (let c = 0; c < map.width; c++) {
      const column = Array.from({ length: map.height }, (_, r) => terrain.data[r * map.width + c]);
      const solid = column.some((id) => id === 1 || id === 2 || id === 4);
      run = solid ? 0 : run + 1;
      assert.ok(run <= MAX_GAP, `gap wider than ${MAX_GAP} tiles ending at column ${c}`);
    }
  });
}
