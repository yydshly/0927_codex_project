// Algorithm studies rendered locally with Canvas. Their upstream links run CUDA WebShader.
const WIDTH = 480;
const HEIGHT = 270;

function clamp(value, low = 0, high = 255) { return Math.max(low, Math.min(high, value)); }

function makeVolume() {
  const small = document.createElement('canvas');
  small.width = 176; small.height = 99;
  const smallCtx = small.getContext('2d');
  let previous = -1;
  return (ctx, time) => {
    const tick = Math.floor(time * 2.4);
    if (tick === previous) return;
    previous = tick;
    const image = smallCtx.createImageData(small.width, small.height);
    const angle = time * .22;
    const cosine = Math.cos(angle), sine = Math.sin(angle);
    for (let py = 0; py < small.height; py++) for (let px = 0; px < small.width; px++) {
      const x = (px / small.width - .5) * 2.65;
      const y = (.5 - py / small.height) * 1.5;
      let r = 7, g = 20, b = 34, transmittance = 1;
      for (let step = 0; step < 28; step++) {
        const z = -1.15 + step * .083;
        const rx = x * cosine - z * sine;
        const rz = x * sine + z * cosine;
        const ringRadius = Math.hypot(rx, rz) - .57;
        const ring = Math.exp(-(ringRadius * ringRadius * 27 + y * y * 17));
        const core = Math.exp(-((rx + .13) ** 2 * 12 + (y + .04) ** 2 * 22 + rz * rz * 11));
        const satellite = Math.exp(-((rx - .62) ** 2 * 28 + (y - .23) ** 2 * 32 + (rz + .1) ** 2 * 24));
        const density = ring * .72 + core * .87 + satellite * .7;
        const opacity = Math.min(.22, density * .092);
        r += transmittance * opacity * (53 + 174 * satellite + 80 * core);
        g += transmittance * opacity * (180 + 44 * ring + 12 * core);
        b += transmittance * opacity * (195 + 54 * core);
        transmittance *= 1 - opacity;
        if (transmittance < .025) break;
      }
      const p = (py * small.width + px) * 4;
      image.data[p] = clamp(r); image.data[p + 1] = clamp(g); image.data[p + 2] = clamp(b); image.data[p + 3] = 255;
    }
    smallCtx.putImageData(image, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(small, 0, 0, WIDTH, HEIGHT);
    ctx.strokeStyle = '#84dfd84d'; ctx.lineWidth = 1;
    ctx.strokeRect(18, 18, WIDTH - 36, HEIGHT - 36);
    ctx.beginPath(); ctx.moveTo(WIDTH / 2 - 18, HEIGHT / 2); ctx.lineTo(WIDTH / 2 + 18, HEIGHT / 2);
    ctx.moveTo(WIDTH / 2, HEIGHT / 2 - 18); ctx.lineTo(WIDTH / 2, HEIGHT / 2 + 18); ctx.stroke();
    ctx.fillStyle = '#bdfff0'; ctx.font = 'bold 10px system-ui'; ctx.fillText('VOLUME / DENSITY', 29, 66);
    ctx.fillStyle = '#90c9c6'; ctx.fillText('Z · 28 STEPS', 367, 249);
  };
}

function norm(v) {
  const length = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / length, v[1] / length, v[2] / length];
}
function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
function scale(v, n) { return [v[0] * n, v[1] * n, v[2] * n]; }

function makeRaytrace() {
  const small = document.createElement('canvas'); small.width = 224; small.height = 126;
  const smallCtx = small.getContext('2d');
  const spheres = [
    { center: [-1.02, -.25, 2.45], radius: .94, color: [222, 156, 83], reflection: .77 },
    { center: [1.08, -.44, 1.88], radius: .74, color: [79, 174, 184], reflection: .3 },
    { center: [.37, .64, 4.15], radius: .58, color: [184, 191, 235], reflection: .52 }
  ];
  let previous = -1;
  return (ctx, time) => {
    const tick = Math.floor(time * 2.1);
    if (tick === previous) return;
    previous = tick;
    const light = [-2.3 + Math.sin(time * .6) * .75, 4.3, -.5];
    function intersect(origin, direction) {
      let nearest = null;
      for (const sphere of spheres) {
        const oc = sub(origin, sphere.center);
        const b = dot(oc, direction);
        const c = dot(oc, oc) - sphere.radius * sphere.radius;
        const discriminant = b * b - c;
        if (discriminant <= 0) continue;
        const root = Math.sqrt(discriminant);
        const distance = -b - root > .001 ? -b - root : -b + root;
        if (distance <= .001 || (nearest && distance >= nearest.distance)) continue;
        const point = add(origin, scale(direction, distance));
        nearest = { distance, point, normal: norm(sub(point, sphere.center)), color: sphere.color, reflection: sphere.reflection };
      }
      if (direction[1] < -.0001) {
        const distance = (-1.2 - origin[1]) / direction[1];
        if (distance > .001 && (!nearest || distance < nearest.distance)) {
          const point = add(origin, scale(direction, distance));
          const tile = (Math.floor(point[0] * .8) + Math.floor(point[2] * .8)) & 1;
          nearest = { distance, point, normal: [0, 1, 0], color: tile ? [35, 51, 67] : [45, 62, 78], reflection: .16 };
        }
      }
      return nearest;
    }
    function trace(origin, direction, depth) {
      const hit = intersect(origin, direction);
      if (!hit) {
        const horizon = clamp((direction[1] + .45) * 100, 0, 70);
        return [11 + horizon * .16, 23 + horizon * .35, 42 + horizon * .46];
      }
      const toLight = norm(sub(light, hit.point));
      const shadowOrigin = add(hit.point, scale(hit.normal, .008));
      const blocker = intersect(shadowOrigin, toLight);
      const lightDistance = Math.hypot(...sub(light, hit.point));
      const shadow = blocker && blocker.distance < lightDistance ? .2 : 1;
      const diffuse = Math.max(0, dot(hit.normal, toLight)) * shadow;
      const half = norm(sub(toLight, direction));
      const highlight = Math.pow(Math.max(0, dot(hit.normal, half)), hit.reflection > .5 ? 70 : 24) * shadow;
      let result = hit.color.map(component => component * (.16 + diffuse * .82) + highlight * 150);
      if (depth > 0 && hit.reflection > 0) {
        const bounced = sub(direction, scale(hit.normal, 2 * dot(direction, hit.normal)));
        const reflected = trace(shadowOrigin, norm(bounced), depth - 1);
        result = result.map((component, i) => component * (1 - hit.reflection) + reflected[i] * hit.reflection);
      }
      const fog = Math.min(.45, hit.distance * .018);
      return result.map((component, i) => component * (1 - fog) + [11, 23, 42][i] * fog);
    }
    const image = smallCtx.createImageData(small.width, small.height);
    for (let y = 0; y < small.height; y++) for (let x = 0; x < small.width; x++) {
      const direction = norm([(x / small.width - .5) * 2.55, (.5 - y / small.height) * 1.43 - .05, 2.6]);
      const color = trace([0, .1, -4.5], direction, 1);
      const p = (y * small.width + x) * 4;
      image.data[p] = clamp(color[0]); image.data[p + 1] = clamp(color[1]); image.data[p + 2] = clamp(color[2]); image.data[p + 3] = 255;
    }
    smallCtx.putImageData(image, 0, 0);
    ctx.imageSmoothingEnabled = true; ctx.drawImage(small, 0, 0, WIDTH, HEIGHT);
    const shine = ctx.createRadialGradient(350, 43, 3, 350, 43, 95);
    shine.addColorStop(0, '#fff4ce77'); shine.addColorStop(1, '#fff4ce00');
    ctx.fillStyle = shine; ctx.fillRect(245, 0, 205, 145);
    ctx.fillStyle = '#e5e9e9'; ctx.font = 'bold 10px system-ui'; ctx.fillText('RAY / REFLECTION', 17, 64);
  };
}

function halton(index, base) {
  let fraction = 1 / base, value = 0;
  while (index > 0) {
    value += fraction * (index % base);
    index = Math.floor(index / base);
    fraction /= base;
  }
  return value;
}

function makeQuasirandom() {
  const points = Array.from({ length: 2300 }, (_, i) => [halton(i + 1, 2) - .5, halton(i + 1, 3) - .5, halton(i + 1, 5) - .5]);
  const corners = Array.from({ length: 8 }, (_, i) => [(i & 1) ? .5 : -.5, (i & 2) ? .5 : -.5, (i & 4) ? .5 : -.5]);
  return (ctx, time) => {
    const background = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
    background.addColorStop(0, '#09182e'); background.addColorStop(1, '#19183b');
    ctx.fillStyle = background; ctx.fillRect(0, 0, WIDTH, HEIGHT);
    const yaw = time * .21, pitch = .4 + Math.sin(time * .15) * .12;
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const project = ([x, y, z]) => {
      const rx = x * cy - z * sy, rz = x * sy + z * cy;
      const ry = y * cp - rz * sp, depth = y * sp + rz * cp;
      const perspective = 310 / (2.35 - depth);
      return [WIDTH / 2 + rx * perspective, HEIGHT / 2 + ry * perspective, depth];
    };
    const projected = corners.map(project);
    ctx.strokeStyle = '#91bce04b'; ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) for (let axis = 0; axis < 3; axis++) {
      const next = i ^ (1 << axis);
      if (next < i) continue;
      ctx.beginPath(); ctx.moveTo(projected[i][0], projected[i][1]); ctx.lineTo(projected[next][0], projected[next][1]); ctx.stroke();
    }
    for (const point of points) {
      const [x, y, depth] = project(point);
      ctx.fillStyle = depth > 0 ? '#b8f5edc9' : '#9aafe58d';
      const size = depth > .1 ? 1.55 : 1.1;
      ctx.fillRect(x, y, size, size);
    }
    ctx.fillStyle = '#d5f2ee'; ctx.font = 'bold 10px system-ui'; ctx.fillText('HALTON / 2,300 SAMPLES', 16, 64);
    ctx.fillStyle = '#8fadd2'; ctx.fillText('BASES 2 · 3 · 5', 365, 249);
  };
}

function makeHaar() {
  const count = 256;
  return (ctx, time) => {
    const background = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    background.addColorStop(0, '#121b34'); background.addColorStop(1, '#0b1730');
    ctx.fillStyle = background; ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.strokeStyle = '#79b9c52b'; ctx.lineWidth = 1;
    for (let x = 0; x < WIDTH; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, HEIGHT); ctx.stroke(); }
    for (let y = 34; y < HEIGHT; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WIDTH, y); ctx.stroke(); }
    const signal = new Float32Array(count);
    const pulse = (time * .07) % 1;
    for (let i = 0; i < count; i++) {
      const x = i / count;
      const transient = Math.exp(-Math.pow((x - pulse) / .035, 2)) * 1.15;
      signal[i] = .42 * Math.sin(i * .075 + time * .5) + .22 * Math.sin(i * .19 - time * .3) + transient;
    }
    ctx.beginPath();
    for (let i = 0; i < count; i++) {
      const x = 17 + i * (WIDTH - 34) / (count - 1), y = 91 - signal[i] * 41;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#7fe8df'; ctx.lineWidth = 1.7; ctx.shadowColor = '#7fe8df'; ctx.shadowBlur = 8; ctx.stroke(); ctx.shadowBlur = 0;
    const coefficients = Float32Array.from(signal);
    const next = new Float32Array(count);
    for (let span = count; span >= 2; span /= 2) {
      for (let i = 0; i < span / 2; i++) {
        const a = coefficients[i * 2], b = coefficients[i * 2 + 1];
        next[i] = (a + b) / Math.SQRT2;
        next[span / 2 + i] = (a - b) / Math.SQRT2;
      }
      coefficients.set(next.subarray(0, span), 0);
    }
    ctx.fillStyle = '#123448'; ctx.fillRect(16, 160, WIDTH - 32, 93);
    for (let i = 1; i < count; i++) {
      const strength = Math.log1p(Math.abs(coefficients[i]) * 5) * 23;
      const height = Math.min(39, strength);
      const x = 18 + i * (WIDTH - 36) / count;
      const positive = coefficients[i] >= 0;
      ctx.fillStyle = positive ? '#8ee3d7' : '#eab083';
      ctx.fillRect(x, positive ? 207 - height : 207, 1.35, height);
    }
    ctx.strokeStyle = '#a2d2d272'; ctx.beginPath(); ctx.moveTo(17, 207); ctx.lineTo(WIDTH - 17, 207); ctx.stroke();
    ctx.fillStyle = '#d8efed'; ctx.font = 'bold 10px system-ui';
    ctx.fillText('INPUT SIGNAL', 17, 64); ctx.fillText('HAAR / DETAIL COEFFICIENTS', 17, 181);
    ctx.fillStyle = '#8cb2bd'; ctx.fillText('TIME', 443, 143); ctx.fillText('SCALE →', 419, 248);
  };
}

function makeBitonic() {
  let seed = 619;
  const random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
  const count = 64;
  let values = Array.from({ length: count }, () => .12 + random() * .85);
  const stages = [];
  for (let size = 2; size <= count; size *= 2) {
    for (let stride = size / 2; stride >= 1; stride /= 2) stages.push({ size, stride });
  }
  let stageIndex = 0, hold = 0, previous = -1, changed = new Set();
  return (ctx, time) => {
    const tick = Math.floor(time * 6);
    if (tick === previous) return;
    previous = tick;
    if (stageIndex < stages.length) {
      const { size, stride } = stages[stageIndex++];
      changed = new Set();
      for (let i = 0; i < count; i++) {
        const pair = i ^ stride;
        if (pair <= i) continue;
        const ascending = (i & size) === 0;
        if ((values[i] > values[pair]) === ascending) {
          [values[i], values[pair]] = [values[pair], values[i]];
          changed.add(i); changed.add(pair);
        }
      }
    } else if (++hold > 12) {
      values = Array.from({ length: count }, () => .12 + random() * .85);
      stageIndex = 0; hold = 0; changed.clear();
    }
    const background = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    background.addColorStop(0, '#102039'); background.addColorStop(1, '#09242f');
    ctx.fillStyle = background; ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.strokeStyle = '#78b9c339';
    for (let y = 70; y <= 229; y += 40) { ctx.beginPath(); ctx.moveTo(20, y); ctx.lineTo(460, y); ctx.stroke(); }
    const barWidth = (WIDTH - 42) / count;
    values.forEach((value, index) => {
      const x = 21 + index * barWidth, height = value * 176;
      ctx.fillStyle = changed.has(index) ? '#f3b986' : stageIndex >= stages.length ? '#9bf0d0' : '#75c4d1';
      ctx.fillRect(x, 229 - height, Math.max(2, barWidth - 1.4), height);
    });
    ctx.fillStyle = '#def2ea'; ctx.font = 'bold 10px system-ui';
    ctx.fillText('BITONIC / PARALLEL SORT', 20, 64);
    ctx.fillStyle = '#9bc8c9'; ctx.fillText(`STAGE ${String(stageIndex).padStart(2, '0')} / ${stages.length}`, 368, 25);
    ctx.fillText(stageIndex >= stages.length ? 'SORTED · RESTARTING' : 'COMPARE / SWAP', 20, 251);
  };
}

function cubic(a, b, c, d, t) {
  return b + .5 * t * (c - a + t * (2 * a - 5 * b + 4 * c - d + t * (3 * (b - c) + d - a)));
}

function makeBicubic() {
  const side = 12;
  const source = new Float32Array(side * side * 3);
  const sourceAt = (x, y, channel) => source[(Math.max(0, Math.min(side - 1, y)) * side + Math.max(0, Math.min(side - 1, x))) * 3 + channel];
  let previous = -1;
  return (ctx, time) => {
    const tick = Math.floor(time * 4);
    if (tick === previous) return;
    previous = tick;
    for (let y = 0; y < side; y++) for (let x = 0; x < side; x++) {
      const dx = x - 5.5 - Math.sin(time * .55) * 1.1;
      const dy = y - 5.2 - Math.cos(time * .4) * .7;
      const radius = Math.hypot(dx, dy);
      const highlight = Math.abs(x - y - 1) < 1.2;
      const p = (y * side + x) * 3;
      source[p] = radius < 2.8 ? 236 : radius < 4.5 ? 76 : highlight ? 213 : 19 + y * 3;
      source[p + 1] = radius < 2.8 ? 153 : radius < 4.5 ? 219 : highlight ? 163 : 35 + x * 5;
      source[p + 2] = radius < 2.8 ? 123 : radius < 4.5 ? 204 : highlight ? 151 : 68 + y * 3;
    }
    const image = ctx.createImageData(WIDTH, HEIGHT);
    const half = WIDTH / 2;
    for (let y = 0; y < HEIGHT; y++) {
      const fy = y / (HEIGHT - 1) * (side - 1), iy = Math.floor(fy), ty = fy - iy;
      for (let x = 0; x < WIDTH; x++) {
        const localX = x % half;
        const fx = localX / (half - 1) * (side - 1), ix = Math.floor(fx), tx = fx - ix;
        const p = (y * WIDTH + x) * 4;
        for (let channel = 0; channel < 3; channel++) {
          if (x < half) image.data[p + channel] = sourceAt(Math.round(fx), Math.round(fy), channel);
          else {
            const rows = [];
            for (let offset = -1; offset <= 2; offset++) {
              rows.push(cubic(sourceAt(ix - 1, iy + offset, channel), sourceAt(ix, iy + offset, channel),
                sourceAt(ix + 1, iy + offset, channel), sourceAt(ix + 2, iy + offset, channel), tx));
            }
            image.data[p + channel] = clamp(cubic(rows[0], rows[1], rows[2], rows[3], ty));
          }
        }
        image.data[p + 3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);
    ctx.fillStyle = '#bce7db'; ctx.fillRect(half - 1, 0, 2, HEIGHT);
    ctx.fillStyle = '#ebf7ef'; ctx.font = 'bold 10px system-ui';
    ctx.fillText('NEAREST', 15, 64); ctx.fillText('BICUBIC', half + 15, 53);
  };
}

export { makeVolume, makeRaytrace, makeQuasirandom, makeHaar, makeBitonic, makeBicubic };
