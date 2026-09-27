import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePreset, serializePreset, templates } from '../preset.js';

test('saved presets survive a JSON round trip with all chosen settings', () => {
  const expected = { ...templates.reading, music: 13, ambience: 82, focus: 50 };
  assert.deepEqual(normalizePreset(JSON.parse(JSON.stringify(expected))), expected);
});

test('corrupt saved values cannot introduce unknown cities or unsafe display values', () => {
  const result = normalizePreset({ city: '../elsewhere', task: '<script>', energy: 'loud', band: null, focus: -1, music: Infinity, ambience: '90' });
  assert.deepEqual(result, templates.writing);
  assert.deepEqual(normalizePreset(null), templates.writing);
  assert.deepEqual(normalizePreset(['tokyo']), templates.writing);
});

test('volume values are finite, integral, and inside the control range', () => {
  assert.equal(normalizePreset({ music: 120 }).music, 100);
  assert.equal(normalizePreset({ ambience: -5 }).ambience, 0);
  assert.equal(normalizePreset({ music: 40.6 }).music, 41);
});

test('exported configuration identifies its proposal status and preserves settings', () => {
  const result = serializePreset(templates.coding);
  assert.equal(result.schemaVersion, 1);
  assert.equal(result.kind, 'lofi-environment-proposal');
  assert.match(result.note, /不是 Lofi Cities 官方 API/);
  for (const [key, value] of Object.entries(templates.coding)) assert.equal(result[key], value);
});
