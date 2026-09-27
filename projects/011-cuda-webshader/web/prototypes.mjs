// Small, independent Canvas studies of the algorithms named in the gallery.
// The CUDA WebShader implementations remain on the linked upstream pages.
import { makeVolume, makeRaytrace, makeQuasirandom, makeHaar, makeBitonic, makeBicubic } from './prototypes-extra.mjs';
const WIDTH = 480;
const HEIGHT = 270;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const visible = new Set();
const studies = new Map();
const initialized = new Set();
let paused = false;
const groups = {
  all: { label: '全部', types: [] },
  motion: { label: '运动模拟', types: ['ocean', 'flow', 'nbody'] },
  image: { label: '图像处理', types: ['sobel', 'bicubic'] },
  spatial: { label: '三维空间', types: ['contour', 'volume'] },
  generative: { label: '生成画面', types: ['fractal', 'raytrace'] },
  numeric: { label: '数值信号', types: ['quasirandom', 'haar', 'bitonic'] }
};

function seeded(seed) {
  let value = seed >>> 0;
  return () => {
    value = (1664525 * value + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function gradient(ctx, y0, y1, stops) {
  const result = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([at, color]) => result.addColorStop(at, color));
  return result;
}

function waveHeight(x, depth, time) {
  const distance = depth / HEIGHT;
  return Math.sin(x * .023 + time * .64 + distance * 2.2) * (2 + distance * 9)
    + Math.sin(x * .049 - time * .91 + distance * 4.5) * (1 + distance * 4)
    + Math.sin(x * .011 + time * .37 + distance * 7) * (1 + distance * 5);
}

function ocean(ctx, time) {
  const sky = gradient(ctx, 0, 158, [[0, '#081a33'], [.63, '#274c61'], [1, '#dcad83']]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, 158);
  const glow = ctx.createRadialGradient(333, 103, 4, 333, 103, 112);
  glow.addColorStop(0, '#ffdbb6be'); glow.addColorStop(.33, '#ffbe8a55'); glow.addColorStop(1, '#ffbe8a00');
  ctx.fillStyle = glow; ctx.fillRect(215, 0, 245, 190);
  ctx.fillStyle = '#ffe0bd'; ctx.beginPath(); ctx.arc(333, 104, 28, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#173344'; ctx.beginPath(); ctx.moveTo(0, 143);
  [[0, 130], [42, 121], [74, 129], [107, 118], [143, 138], [193, 133], [234, 149], [480, 150]].forEach(([x, y]) => ctx.lineTo(x, y));
  ctx.lineTo(WIDTH, 166); ctx.lineTo(0, 166); ctx.fill();
  ctx.fillStyle = gradient(ctx, 137, HEIGHT, [[0, '#2f6671'], [.52, '#15516a'], [1, '#092d48']]);
  ctx.fillRect(0, 137, WIDTH, HEIGHT - 137);
  for (let row = 0; row < 22; row++) {
    const base = 143 + row * 6.4;
    const depth = (base - 140) / 130;
    ctx.beginPath();
    for (let x = 0; x <= WIDTH + 4; x += 4) {
      const y = base + waveHeight(x, base, time) * (.24 + depth * .5);
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = row % 4 === 0 ? `rgba(157,235,222,${.12 + depth * .28})` : `rgba(66,159,177,${.08 + depth * .14})`;
    ctx.lineWidth = row % 4 === 0 ? 1.5 : 1;
    ctx.stroke();
  }
  for (let i = 0; i < 18; i++) {
    const y = 151 + i * 6.2;
    const x = 330 + Math.sin(i * 13.7 + time * .5) * i * 8;
    ctx.fillStyle = `rgba(255,216,170,${.35 - i * .013})`;
    ctx.fillRect(x, y + waveHeight(x, y, time) * .36, Math.max(2, 19 - i * .72), 1.3);
  }
  ctx.fillStyle = '#071d2e';
  ctx.beginPath(); ctx.moveTo(0, HEIGHT); ctx.lineTo(0, 250); ctx.quadraticCurveTo(94, 257, 196, HEIGHT); ctx.fill();
}

function makeFlow(canvas) {
  const random = seeded(147);
  const particles = Array.from({ length: 1250 }, () => ({ x: random() * WIDTH, y: random() * HEIGHT, group: Math.floor(random() * 3) }));
  const pointer = { x: WIDTH / 2, y: HEIGHT / 2, active: false, motionX: 0, motionY: 0 };
  const point = event => {
    const rect = canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * WIDTH / rect.width, y: (event.clientY - rect.top) * HEIGHT / rect.height };
  };
  canvas.addEventListener('pointerdown', event => {
    const p = point(event); Object.assign(pointer, p, { active: true }); canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', event => {
    const p = point(event);
    pointer.motionX = p.x - pointer.x; pointer.motionY = p.y - pointer.y;
    pointer.x = p.x; pointer.y = p.y;
  });
  const release = () => { pointer.active = false; pointer.motionX = 0; pointer.motionY = 0; };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  let primed = false;
  return (ctx, time) => {
    ctx.fillStyle = primed ? 'rgba(5,21,34,.14)' : '#051522'; ctx.fillRect(0, 0, WIDTH, HEIGHT); primed = true;
    const colors = ['rgba(91,226,228,.64)', 'rgba(105,147,255,.54)', 'rgba(247,170,133,.5)'];
    for (let group = 0; group < 3; group++) {
      ctx.beginPath();
      for (const p of particles) {
        if (p.group !== group) continue;
        const ox = p.x, oy = p.y;
        let vx = Math.sin(oy * .026 + time * .52) * 1.22 + Math.cos(ox * .013 - time * .27) * .48;
        let vy = Math.cos(ox * .022 - time * .43) * .88 - Math.sin(oy * .019 + time * .36) * .56;
        if (pointer.active) {
          const dx = ox - pointer.x, dy = oy - pointer.y;
          const influence = Math.exp(-(dx * dx + dy * dy) / 4900);
          vx += (pointer.motionX * .33 - dy * .022) * influence;
          vy += (pointer.motionY * .33 + dx * .022) * influence;
        }
        p.x += vx; p.y += vy;
        if (p.x < 0 || p.x >= WIDTH || p.y < 0 || p.y >= HEIGHT) {
          p.x = (p.x + WIDTH) % WIDTH; p.y = (p.y + HEIGHT) % HEIGHT;
          continue;
        }
        ctx.moveTo(ox, oy); ctx.lineTo(p.x, p.y);
      }
      ctx.strokeStyle = colors[group]; ctx.lineWidth = .9; ctx.stroke();
    }
    pointer.motionX *= .7; pointer.motionY *= .7;
    if (pointer.active) {
      const halo = ctx.createRadialGradient(pointer.x, pointer.y, 2, pointer.x, pointer.y, 48);
      halo.addColorStop(0, '#aaf9eb42'); halo.addColorStop(1, '#aaf9eb00');
      ctx.fillStyle = halo; ctx.fillRect(pointer.x - 50, pointer.y - 50, 100, 100);
    }
  };
}

function makeNBody() {
  const random = seeded(239);
  const center = { x: WIDTH * .51, y: HEIGHT * .52, vx: 0, vy: 0, mass: 180, hue: 42 };
  const bodies = [center];
  for (let i = 0; i < 74; i++) {
    const angle = random() * Math.PI * 2;
    const radius = 25 + random() * 100;
    const speed = Math.sqrt(.045 * center.mass / radius) * (.82 + random() * .36);
    bodies.push({ x: center.x + Math.cos(angle) * radius * 1.6, y: center.y + Math.sin(angle) * radius * .72,
      vx: -Math.sin(angle) * speed * 1.2, vy: Math.cos(angle) * speed * .75, mass: .45 + random() * 1.8, hue: 175 + random() * 75 });
  }
  let primed = false;
  return ctx => {
    ctx.fillStyle = primed ? 'rgba(6,15,34,.11)' : '#060f22'; ctx.fillRect(0, 0, WIDTH, HEIGHT); primed = true;
    const accelerations = bodies.map(() => ({ x: 0, y: 0 }));
    for (let i = 1; i < bodies.length; i++) {
      for (let j = 0; j < bodies.length; j++) {
        if (i === j) continue;
        const dx = bodies[j].x - bodies[i].x, dy = bodies[j].y - bodies[i].y;
        const softened = dx * dx + dy * dy + 55;
        const force = .045 * bodies[j].mass / (softened * Math.sqrt(softened));
        accelerations[i].x += dx * force; accelerations[i].y += dy * force;
      }
    }
    for (let i = 1; i < bodies.length; i++) {
      const body = bodies[i], fromX = body.x, fromY = body.y;
      body.vx += accelerations[i].x; body.vy += accelerations[i].y;
      body.x += body.vx; body.y += body.vy;
      if (body.x < -20 || body.x > WIDTH + 20 || body.y < -20 || body.y > HEIGHT + 20) {
        body.x = center.x + (seeded(i * 938 + Date.now())() - .5) * 120;
        body.y = center.y + (seeded(i * 327 + Date.now())() - .5) * 90;
        body.vx = -(body.y - center.y) * .007; body.vy = (body.x - center.x) * .007;
        continue;
      }
      ctx.strokeStyle = `hsla(${body.hue},92%,72%,.58)`;
      ctx.lineWidth = body.mass > 1.6 ? 1.6 : .8;
      ctx.beginPath(); ctx.moveTo(fromX, fromY); ctx.lineTo(body.x, body.y); ctx.stroke();
      ctx.fillStyle = `hsl(${body.hue},95%,82%)`;
      ctx.fillRect(body.x, body.y, body.mass > 1.6 ? 2.3 : 1.4, body.mass > 1.6 ? 2.3 : 1.4);
    }
    const glow = ctx.createRadialGradient(center.x, center.y, 1, center.x, center.y, 42);
    glow.addColorStop(0, '#fff2c6'); glow.addColorStop(.18, '#ffca828c'); glow.addColorStop(1, '#ffad5900');
    ctx.fillStyle = glow; ctx.fillRect(center.x - 42, center.y - 42, 84, 84);
  };
}

function makeSobel() {
  const source = document.createElement('canvas'); source.width = WIDTH / 2; source.height = HEIGHT;
  const sourceCtx = source.getContext('2d', { willReadFrequently: true });
  const output = document.createElement('canvas'); output.width = source.width; output.height = HEIGHT;
  const outputCtx = output.getContext('2d');
  let lastTick = -1;
  return (ctx, time) => {
    const tick = Math.floor(time * 9);
    if (tick === lastTick) return;
    lastTick = tick;
    const w = source.width, h = HEIGHT;
    sourceCtx.fillStyle = gradient(sourceCtx, 0, h, [[0, '#0e1e36'], [.5, '#294966'], [1, '#b07865']]);
    sourceCtx.fillRect(0, 0, w, h);
    sourceCtx.fillStyle = '#e9b582'; sourceCtx.beginPath(); sourceCtx.arc(178 + Math.sin(time * .25) * 10, 63, 24, 0, 7); sourceCtx.fill();
    const random = seeded(31);
    for (let i = 0; i < 20; i++) {
      const x = i * 15 - 6, height = 45 + random() * 90;
      sourceCtx.fillStyle = i % 3 === 0 ? '#12263a' : '#182c42';
      sourceCtx.fillRect(x, 150 - height, 15 + random() * 10, height + 120);
      sourceCtx.fillStyle = '#f1bf8377';
      for (let y = 154 - height; y < 175; y += 13) for (let wx = x + 4; wx < x + 14; wx += 8) if (random() > .45) sourceCtx.fillRect(wx, y, 2, 4);
    }
    sourceCtx.fillStyle = '#091b30'; sourceCtx.beginPath(); sourceCtx.moveTo(0, 207);
    sourceCtx.lineTo(80, 185); sourceCtx.lineTo(153, 206); sourceCtx.lineTo(w, 188); sourceCtx.lineTo(w, h); sourceCtx.lineTo(0, h); sourceCtx.fill();
    const carX = (time * 32) % (w + 60) - 30;
    sourceCtx.fillStyle = '#a8eff0'; sourceCtx.fillRect(carX, 215, 34, 4);
    sourceCtx.fillStyle = '#ffd9aa'; sourceCtx.fillRect(carX + 4, 210, 20, 3);
    const pixels = sourceCtx.getImageData(0, 0, w, h);
    const result = outputCtx.createImageData(w, h);
    const light = new Float32Array(w * h);
    for (let i = 0; i < light.length; i++) {
      const p = i * 4;
      light[i] = pixels.data[p] * .2126 + pixels.data[p + 1] * .7152 + pixels.data[p + 2] * .0722;
    }
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const p = y * w + x;
      const gx = -light[p - w - 1] + light[p - w + 1] - 2 * light[p - 1] + 2 * light[p + 1] - light[p + w - 1] + light[p + w + 1];
      const gy = -light[p - w - 1] - 2 * light[p - w] - light[p - w + 1] + light[p + w - 1] + 2 * light[p + w] + light[p + w + 1];
      const strength = Math.min(255, Math.hypot(gx, gy) * .72);
      const q = p * 4;
      result.data[q] = 6 + strength * .38;
      result.data[q + 1] = 22 + strength * .82;
      result.data[q + 2] = 36 + strength;
      result.data[q + 3] = 255;
    }
    outputCtx.putImageData(result, 0, 0);
    ctx.drawImage(source, 0, 0); ctx.drawImage(output, w, 0);
    ctx.fillStyle = '#9bdfdf'; ctx.fillRect(w - 1, 0, 2, h);
    ctx.fillStyle = '#d8f3ee'; ctx.font = 'bold 10px system-ui';
    ctx.fillText('SOURCE', 13, 64); ctx.fillText('SOBEL EDGES', w + 13, 53);
  };
}

function terrain(x, y, time) {
  const hills = [[.28, .36, .22, .29, .8], [.7, .54, .24, .37, .92], [.53, .81, .32, .25, .6]];
  let value = .12 + .07 * Math.sin(x * 11 + time * .22) * Math.cos(y * 8 - time * .17);
  for (const [hx, hy, sx, sy, mass] of hills) {
    const dx = (x - hx - Math.sin(time * .3 + hx * 8) * .018) / sx;
    const dy = (y - hy - Math.cos(time * .2 + hy * 7) * .025) / sy;
    value += mass * Math.exp(-(dx * dx + dy * dy) * 1.5);
  }
  return value;
}

function contour(ctx, time) {
  ctx.fillStyle = '#091d29'; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  const cols = 60, rows = 34, cw = WIDTH / cols, ch = HEIGHT / rows;
  const samples = new Float32Array((cols + 1) * (rows + 1));
  for (let y = 0; y <= rows; y++) for (let x = 0; x <= cols; x++) samples[y * (cols + 1) + x] = terrain(x / cols, y / rows, time);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const v = samples[y * (cols + 1) + x];
    const shade = Math.min(1, Math.max(0, v / 1.5));
    ctx.fillStyle = `rgb(${Math.floor(9 + 20 * shade)},${Math.floor(30 + 58 * shade)},${Math.floor(42 + 65 * shade)})`;
    ctx.fillRect(x * cw, y * ch, cw + .5, ch + .5);
  }
  const levels = [.25, .36, .47, .58, .7, .83, .98, 1.15];
  levels.forEach((level, index) => {
    ctx.beginPath();
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const x0 = x * cw, y0 = y * ch;
      const a = samples[y * (cols + 1) + x], b = samples[y * (cols + 1) + x + 1];
      const c = samples[(y + 1) * (cols + 1) + x + 1], d = samples[(y + 1) * (cols + 1) + x];
      const intersections = [];
      if ((a < level) !== (b < level)) intersections.push([x0 + cw * (level - a) / (b - a), y0]);
      if ((b < level) !== (c < level)) intersections.push([x0 + cw, y0 + ch * (level - b) / (c - b)]);
      if ((c < level) !== (d < level)) intersections.push([x0 + cw * (level - d) / (c - d), y0 + ch]);
      if ((d < level) !== (a < level)) intersections.push([x0, y0 + ch * (level - a) / (d - a)]);
      for (let i = 0; i + 1 < intersections.length; i += 2) {
        ctx.moveTo(...intersections[i]); ctx.lineTo(...intersections[i + 1]);
      }
    }
    ctx.strokeStyle = index % 2 ? '#91d0c5aa' : '#d2e5bdc9';
    ctx.lineWidth = index % 2 ? .9 : 1.45; ctx.stroke();
  });
  ctx.fillStyle = '#e2edd4'; ctx.font = 'bold 10px system-ui'; ctx.fillText('ELEVATION / ISO-LINES', 15, 64);
  ctx.fillStyle = '#aad6cd'; ctx.fillText('0.25', 435, 232); ctx.fillText('1.15', 435, 249);
}

function makeFractal(canvas) {
  let centerX = -.7, centerY = 0, scale = 3.25, dirty = true;
  canvas.tabIndex = 0;
  canvas.setAttribute('role', 'button');
  canvas.setAttribute('title', '点击放大；双击或按 Backspace 复位');
  const reset = () => { centerX = -.7; centerY = 0; scale = 3.25; dirty = true; render(); };
  const zoom = (x, y) => {
    centerX += (x / WIDTH - .5) * scale;
    centerY += (y / HEIGHT - .5) * scale * HEIGHT / WIDTH;
    scale = Math.max(scale * .53, .00006); dirty = true; render();
  };
  canvas.addEventListener('click', event => {
    if (event.detail > 1) return;
    const rect = canvas.getBoundingClientRect();
    zoom((event.clientX - rect.left) * WIDTH / rect.width, (event.clientY - rect.top) * HEIGHT / rect.height);
  });
  canvas.addEventListener('dblclick', reset);
  canvas.addEventListener('keydown', event => {
    if (event.key === 'Backspace') { event.preventDefault(); reset(); }
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); zoom(WIDTH / 2, HEIGHT / 2); }
  });
  const ctx = canvas.getContext('2d');
  function render() {
    if (!dirty) return;
    dirty = false;
    const image = ctx.createImageData(WIDTH, HEIGHT);
    const max = Math.min(230, 72 + Math.floor(Math.log2(3.25 / scale) * 13));
    for (let y = 0; y < HEIGHT; y++) for (let x = 0; x < WIDTH; x++) {
      const cr = centerX + (x / WIDTH - .5) * scale;
      const ci = centerY + (y / HEIGHT - .5) * scale * HEIGHT / WIDTH;
      let zr = 0, zi = 0, iter = 0;
      while (iter < max && zr * zr + zi * zi <= 64) {
        const next = zr * zr - zi * zi + cr;
        zi = 2 * zr * zi + ci; zr = next; iter++;
      }
      const p = (y * WIDTH + x) * 4;
      if (iter === max) { image.data[p] = 5; image.data[p + 1] = 17; image.data[p + 2] = 29; }
      else {
        const smooth = iter + 1 - Math.log2(Math.log2(Math.sqrt(zr * zr + zi * zi)));
        const band = smooth * .14;
        image.data[p] = 46 + 85 * (1 + Math.sin(band + .9)) / 2;
        image.data[p + 1] = 65 + 150 * (1 + Math.sin(band + 2.6)) / 2;
        image.data[p + 2] = 81 + 145 * (1 + Math.sin(band + 4.1)) / 2;
      }
      image.data[p + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);
  }
  return render;
}

const factories = {
  ocean: () => ocean,
  flow: makeFlow,
  nbody: makeNBody,
  sobel: makeSobel,
  contour: () => contour,
  fractal: makeFractal,
  volume: makeVolume,
  raytrace: makeRaytrace,
  quasirandom: makeQuasirandom,
  haar: makeHaar,
  bitonic: makeBitonic,
  bicubic: makeBicubic
};

for (const card of document.querySelectorAll('[data-prototype]')) {
  const canvas = card.querySelector('canvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const type = card.dataset.prototype;
  const render = factories[type](canvas);
  studies.set(card, { render, ctx, type });
}

function initialize(card) {
  if (initialized.has(card)) return;
  const study = studies.get(card);
  study.render(study.ctx, 0);
  initialized.add(card);
}

const filters = document.getElementById('prototype-filters');
const count = document.getElementById('prototype-count');
const pause = document.getElementById('prototype-pause');
function applyFilter(key) {
  let shown = 0;
  studies.forEach((study, card) => {
    const keep = key === 'all' || groups[key].types.includes(study.type);
    card.hidden = !keep;
    if (keep) shown++;
  });
  count.textContent = `${shown} / ${studies.size} 个算法画面`;
  filters.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.group === key)));
}
Object.entries(groups).forEach(([key, group]) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.group = key;
  button.textContent = `${group.label} ${key === 'all' ? studies.size : group.types.length}`;
  button.addEventListener('click', () => applyFilter(key));
  filters.append(button);
});
applyFilter('all');
if (reducedMotion) {
  pause.textContent = '已减少动画';
  pause.disabled = true;
} else {
  pause.addEventListener('click', () => {
    paused = !paused;
    pause.textContent = paused ? '继续动画' : '暂停动画';
    pause.setAttribute('aria-pressed', String(paused));
  });
}

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        visible.add(entry.target);
        initialize(entry.target);
      } else visible.delete(entry.target);
    }
  }, { rootMargin: '160px' });
  studies.forEach((_, card) => observer.observe(card));
} else {
  studies.forEach((_, card) => { visible.add(card); initialize(card); });
}

if (!reducedMotion) {
  let previous = 0;
  const frame = now => {
    if (!document.hidden && !paused && now - previous > 42) {
      previous = now;
      studies.forEach(({ render, ctx, type }, card) => {
        if (visible.has(card) && !card.hidden && type !== 'fractal') render(ctx, now / 1000);
      });
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
