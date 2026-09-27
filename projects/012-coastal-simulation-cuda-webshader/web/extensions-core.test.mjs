import assert from 'node:assert/strict';
import test from 'node:test';
import { createTerrain, paintRock, initialCells, distribution, sanitizePresetName } from './extensions-core.mjs';

test('terrain and visible obstacle share one data source', () => {
  const width = 48, height = 28;
  const terrain = createTerrain(width, height, 'open');
  const before = initialCells(terrain, .1);
  paintRock(terrain, width, height, .35, .5, .1);
  const after = initialCells(terrain, .1);
  const i = (Math.round(.5 * (height - 1)) * width + Math.round(.35 * (width - 1)));
  assert.equal(terrain[i * 4 + 1], 1);
  assert.ok(before[i * 8] > 0);
  assert.equal(after[i * 8], 0);
});

test('heightmap import maps bright elevations to dry obstacles', () => {
  const image = { width: 2, height: 1, data: new Uint8ClampedArray([0, 0, 0, 255, 255, 255, 255, 255]) };
  const terrain = createTerrain(8, 8, 'cove', image);
  assert.ok(terrain[0] < 0);
  assert.equal(terrain[(8 - 1) * 4 + 1], 1);
});

test('initial swell changes offshore state while solid rock stays dry', () => {
  const width = 48, height = 28;
  const terrain = createTerrain(width, height, 'open');
  const flat = initialCells(terrain, .1);
  const swell = initialCells(terrain, .1, width, .2);
  const offshore = (Math.floor(height / 2) * width + 8) * 8;
  assert.ok(Math.abs(swell[offshore] - flat[offshore]) > .005);
  paintRock(terrain, width, height, .35, .5, .1);
  const withRock = initialCells(terrain, .1, width, .2);
  const rockCell = (Math.round(.5 * (height - 1)) * width + Math.round(.35 * (width - 1))) * 8;
  assert.equal(withRock[rockCell], 0);
  assert.equal(withRock[rockCell + 1], 0);
});

test('frame distribution and saved preset name are bounded', () => {
  assert.deepEqual(distribution([10, 20, 30, 40]), { p50: 20, p95: 40, mean: 25 });
  assert.equal(sanitizePresetName('  <海况>\n  '), '海况');
});
