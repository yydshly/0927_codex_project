import test from 'node:test';
import assert from 'node:assert/strict';
import { moments, momentSettings, matchingMoment } from '../studio/moments.js';
import { normalizeStore } from '../studio/model.js';

test('ready-to-play environments cover all six scenes and all six music backgrounds', () => {
  const configs = moments.map(m => momentSettings(m.id));
  assert.equal(new Set(configs.map(s => s.scene)).size, 6);
  assert.equal(new Set(configs.map(s => s.musicProfile)).size, 6);
  for (const config of configs) {
    assert.ok(config.music > 0 && config.ambience > 0);
    assert.ok(Object.values(config.mix).some(v => v > 0));
    assert.deepEqual(normalizeStore({ settings: config }).settings, config);
  }
});

test('changing a complete environment preserves listener volume and reduced-motion preference', () => {
  const state = momentSettings('journey', { master: 17, motion: false });
  assert.equal(state.master, 17);
  assert.equal(state.motion, false);
  assert.equal(state.scene, 'train');
  assert.equal(state.musicProfile, 'ambient');
  assert.equal(momentSettings('unknown'), null);
});

test('custom mixes are not incorrectly labelled as a curated combination', () => {
  const state = momentSettings('reading');
  assert.equal(matchingMoment(state).id, 'reading');
  state.mix.rain = 0;
  assert.equal(matchingMoment(state), null);
  state.mix.rain = 52;
  state.musicProfile = 'jazz';
  assert.equal(matchingMoment(state), null);
});
