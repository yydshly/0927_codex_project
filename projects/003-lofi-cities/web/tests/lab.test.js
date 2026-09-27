import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, normalizeLab, rainParticles, windowBox, frequency } from '../lab-model.js';

test('invalid audio settings fall back and all public parameters remain bounded', () => {
  assert.deepEqual(normalizeLab(), defaults);
  assert.deepEqual(normalizeLab({ rain: -4, music: 999, ambience: 'bad', bpm: 200 }), { rain: 0, music: 100, ambience: 45, bpm: 90 });
});
test('rain parameter reaches zero and maximum without adding out-of-range particles', () => {
  assert.deepEqual(rainParticles(3, 0), []);
  assert.equal(rainParticles(3, 100).length, 150);
  assert.equal(rainParticles(3, 900).length, 150);
});
test('rain is deterministic, moves with time, and wraps within the window on long sessions', () => {
  assert.deepEqual(rainParticles(100, 60), rainParticles(100, 60));
  assert.notDeepEqual(rainParticles(100, 60), rainParticles(100.1, 60));
  for (const time of [0, .2, 10000, 1000000]) {
    for (const drop of rainParticles(time, 100)) {
      assert.ok(drop.x >= windowBox.x && drop.x < windowBox.x + windowBox.width);
      assert.ok(drop.y >= windowBox.y && drop.y < windowBox.y + windowBox.height);
    }
  }
});
test('synthesis uses concert pitch and doubles frequency each octave', () => {
  assert.equal(frequency(69), 440);
  assert.equal(frequency(81), 880);
  assert.equal(frequency(57), 220);
});
