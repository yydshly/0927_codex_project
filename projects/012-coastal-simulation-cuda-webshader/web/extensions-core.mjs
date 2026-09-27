// Independent teaching model for the 012 extension lab; not the upstream solver.
export const QUALITY = Object.freeze({
  low: { width: 96, height: 54, label: '省电' },
  balanced: { width: 160, height: 90, label: '均衡' },
  high: { width: 256, height: 144, label: '精细' }
});

export const SEA_PRESETS = Object.freeze({
  calm: { label: '平静海湾', amplitude: 0.035, frequency: 1.6, tide: 0.08, friction: 0.075 },
  moderate: { label: '日常浪涌', amplitude: 0.13, frequency: 2.3, tide: 0.12, friction: 0.055 },
  storm: { label: '风暴海况', amplitude: 0.25, frequency: 3.0, tide: 0.19, friction: 0.04 }
});

export const clamp = (value, lo, hi) => Math.min(hi, Math.max(lo, value));

function rock(x, y, cx, cy, rx, ry) {
  const nx = (x - cx) / rx, ny = (y - cy) / ry;
  const angle = Math.atan2(ny, nx);
  const edge = 1 + .13 * Math.sin(angle * 5 + cx * 17) + .07 * Math.sin(angle * 9 + cy * 23);
  return Math.exp(-(nx * nx + ny * ny) * 2.4 / (edge * edge));
}

export function createTerrain(width, height, type = 'cove', pixels = null) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 8 || height < 8) {
    throw new RangeError('Terrain dimensions must be integers of at least 8');
  }
  const data = new Float32Array(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const u = x / (width - 1), v = y / (height - 1), i = (y * width + x) * 4;
    let bed, obstacle = 0;
    if (pixels) {
      const px = Math.min(pixels.width - 1, Math.floor(u * pixels.width));
      const py = Math.min(pixels.height - 1, Math.floor(v * pixels.height));
      const j = (py * pixels.width + px) * 4;
      const grey = (pixels.data[j] * .2126 + pixels.data[j + 1] * .7152 + pixels.data[j + 2] * .0722) / 255;
      bed = -0.9 + grey * 1.6;
      obstacle = grey > .91 ? 1 : 0;
    } else if (type === 'channel') {
      const bank = Math.abs(v - .5) * 2;
      bed = -.72 + 1.2 * bank ** 2 + .13 * u;
      obstacle = rock(u, v, .49, .48, .055, .13) > .36 ? 1 : 0;
      bed += .92 * rock(u, v, .49, .48, .065, .15);
    } else if (type === 'open') {
      bed = -0.7 + 1.3 * u ** 1.55 + .04 * Math.sin(v * 12);
    } else {
      const bend = .045 * Math.sin(v * 7.4) + .04 * Math.cos(v * 13.1);
      bed = -.88 + 1.42 * u ** 1.55 + bend + .025 * Math.sin(u * 28 + v * 11);
      const r1 = rock(u, v, .38, .32, .055, .09);
      const r2 = rock(u, v, .55, .61, .045, .07);
      const r3 = rock(u, v, .68, .18, .04, .06);
      bed += 1.15 * Math.max(r1, r2, r3);
      obstacle = Math.max(r1, r2, r3) > .34 ? 1 : 0;
    }
    data[i] = bed;
    data[i + 1] = obstacle;
    data[i + 2] = .5 + .5 * Math.sin(u * 42 + v * 19);
    data[i + 3] = 0;
  }
  return data;
}

export function paintRock(terrain, width, height, u, v, radius = .04) {
  if (terrain.length !== width * height * 4) throw new RangeError('Terrain buffer size mismatch');
  const aspect = width / height;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const dx = (x / (width - 1) - u) * aspect, dy = y / (height - 1) - v;
    const d = Math.hypot(dx, dy), i = (y * width + x) * 4;
    const angle = Math.atan2(dy, dx);
    const edge = radius * (1 + .13 * Math.sin(6 * angle + u * 25) + .07 * Math.sin(11 * angle + v * 31));
    if (d >= edge) continue;
    const strength = 1 - d / edge;
    terrain[i] = Math.max(terrain[i], .36 + .55 * strength);
    terrain[i + 1] = 1;
  }
  return terrain;
}

export function initialCells(terrain, seaLevel, width = 0, amplitude = 0) {
  const cells = new Float32Array(terrain.length * 2);
  for (let i = 0; i < terrain.length / 4; i++) {
    const bed = terrain[i * 4], obstacle = terrain[i * 4 + 1] > .5;
    const baseDepth = Math.max(0, seaLevel - bed);
    const offshore = Math.min(1, baseDepth / .3);
    const wave = width ? amplitude * .55 * Math.sin((i % width) / width * Math.PI * 5.2) * offshore : 0;
    cells[i * 8] = obstacle ? 0 : Math.max(0, baseDepth + wave);
    cells[i * 8 + 1] = obstacle || cells[i * 8] < .03 ? 0 : wave * .4;
    cells[i * 8 + 4] = cells[i * 8] > .015 ? 1 : 0;
  }
  return cells;
}

export function distribution(values) {
  if (!values.length) return { p50: 0, p95: 0, mean: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  const valueAt = p => sorted[Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1)];
  return { p50: valueAt(.5), p95: valueAt(.95), mean: values.reduce((a, b) => a + b, 0) / values.length };
}

export function sanitizePresetName(name) {
  return String(name).trim().replace(/[<>\x00-\x1f]/g, '').slice(0, 20);
}
