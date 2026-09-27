import test from 'node:test';
import assert from 'node:assert/strict';
import {chooseLevel, planScene, projectedErrorPixels} from '../planner.mjs';

test('projected geometric error decreases with camera distance', () => {
  assert.ok(projectedErrorPixels(0.3, 10, 800, 50) > projectedErrorPixels(0.3, 100, 800, 50));
});

test('the closest view retains high detail while a distant view can use low detail', () => {
  const errors = [0, 0.08, 0.35];
  assert.equal(chooseLevel(8, 800, 50, 2, errors), 0);
  assert.equal(chooseLevel(200, 800, 50, 2, errors), 2);
});

test('full, frustum-only and adaptive modes account for the same source scene', () => {
  const items = [{id: 1}, {id: 2}];
  const base = {items, visible: item => item.id === 1, distance: () => 200,
    viewportHeight: 800, fovDegrees: 50, threshold: 2,
    errors: [0, 0.08, 0.35], triangles: [1000, 400, 100]};
  assert.equal(planScene({...base, mode: 'full'}).submittedTriangles, 2000);
  assert.equal(planScene({...base, mode: 'cull'}).submittedTriangles, 1000);
  const adaptive = planScene({...base, mode: 'adaptive'});
  assert.equal(adaptive.submittedTriangles, 100);
  assert.equal(adaptive.reduction, 0.95);
});
