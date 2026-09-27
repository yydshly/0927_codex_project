/** A small CPU model of the demo's visibility/LOD decision, not the PR's GPU implementation. */
export function projectedErrorPixels(errorWorld, distance, viewportHeight, fovDegrees) {
  const cotHalfFov = 1 / Math.tan((fovDegrees * Math.PI) / 360);
  return errorWorld * cotHalfFov * viewportHeight / (2 * Math.max(0.01, distance));
}

export function chooseLevel(distance, viewportHeight, fovDegrees, threshold, errors) {
  for (let level = errors.length - 1; level > 0; level--) {
    if (projectedErrorPixels(errors[level], distance, viewportHeight, fovDegrees) <= threshold) return level;
  }
  return 0;
}

export function planScene({items, mode, visible, distance, viewportHeight, fovDegrees, threshold, errors, triangles}) {
  const groups = errors.map(() => []);
  for (const item of items) {
    if (mode !== 'full' && !visible(item)) continue;
    const level = mode === 'adaptive'
      ? chooseLevel(distance(item), viewportHeight, fovDegrees, threshold, errors)
      : 0;
    groups[level].push(item);
  }
  const submittedTriangles = groups.reduce((sum, group, level) => sum + group.length * triangles[level], 0);
  const baselineTriangles = items.length * triangles[0];
  return {
    groups,
    visibleCount: groups.reduce((sum, group) => sum + group.length, 0),
    submittedTriangles,
    baselineTriangles,
    reduction: baselineTriangles ? 1 - submittedTriangles / baselineTriangles : 0
  };
}
