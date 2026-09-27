// Independent educational models. No upstream runtime is bundled.
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const TAU = Math.PI * 2;
export function random(seed = 42) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export const mean = a => a.reduce((s, v) => s + v, 0) / a.length;
export const rms = a => Math.sqrt(a.reduce((s, v) => s + v * v, 0) / a.length);

// Iterative radix-2 Cooley–Tukey; inverse is normalized by N.
export function fft(re, im, inverse = false) {
  const n = re.length;
  if (!n || (n & (n - 1)) || im.length !== n) throw new Error('FFT size must be a power of two');
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let size = 2; size <= n; size *= 2) {
    const angle = (inverse ? 1 : -1) * TAU / size;
    for (let start = 0; start < n; start += size) {
      for (let k = 0; k < size / 2; k++) {
        const c = Math.cos(angle * k), s = Math.sin(angle * k), a = start + k, b = a + size / 2;
        const tr = re[b] * c - im[b] * s, ti = re[b] * s + im[b] * c;
        re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
      }
    }
  }
  if (inverse) for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n; }
}
export function fft2(re, im, n, inverse = false) {
  const ar = new Float64Array(n), ai = new Float64Array(n);
  for (let row = 0; row < n; row++) {
    for (let x = 0; x < n; x++) { ar[x] = re[row * n + x]; ai[x] = im[row * n + x]; }
    fft(ar, ai, inverse);
    for (let x = 0; x < n; x++) { re[row * n + x] = ar[x]; im[row * n + x] = ai[x]; }
  }
  for (let x = 0; x < n; x++) {
    for (let y = 0; y < n; y++) { ar[y] = re[y * n + x]; ai[y] = im[y * n + x]; }
    fft(ar, ai, inverse);
    for (let y = 0; y < n; y++) { re[y * n + x] = ar[y]; im[y * n + x] = ai[y]; }
  }
}
export class Waves {
  constructor(p, seed = 42) { this.p = p; this.n = 32; this.width = 32; this.height = 32; this.field = new Float64Array(1024); this.imag = new Float64Array(1024); this.seed = seed; this.time = 0; this.update(0); }
  update(time) {
    this.time = time;
    const { amplitude, frequency, direction, method } = this.p, n = this.n, angle = direction * Math.PI / 180;
    this.imag.fill(0); this.field.fill(0);
    if (method === 0) {
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        let h = 0;
        for (let w = 0; w < 4; w++) {
          const a = angle + w * .39, k = frequency * (.7 + w * .24), weight = 1 / (w + 1);
          h += amplitude * weight * Math.cos(TAU * k * (x * Math.cos(a) + y * Math.sin(a)) / n - Math.sqrt(9.81 * k) * time + w * 1.7) / 2;
        }
        this.field[y * n + x] = h;
      }
    } else {
      // Gaussian directional teaching spectrum, NOT JONSWAP. Hermitian pairs
      // produce real heights. Coefficients evolve with deep-water dispersion.
      const rng = random(this.seed); let energy = 0;
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        const i = y * n + x, j = ((n - y) % n) * n + (n - x) % n;
        if (i >= j || x === n / 2 || y === n / 2) continue;
        const kx = x > n / 2 ? x - n : x, ky = y > n / 2 ? y - n : y, k = Math.hypot(kx, ky);
        if (k === 0) continue;
        const align = (kx * Math.cos(angle) + ky * Math.sin(angle)) / k;
        const a = Math.exp(-.5 * ((k - frequency) / 1.1) ** 2) * (.12 + .88 * align ** 4);
        const phase = rng() * TAU - Math.sqrt(9.81 * k * TAU / 16) * time * (align >= 0 ? 1 : -1);
        this.field[i] = this.field[j] = a * Math.cos(phase);
        this.imag[i] = a * Math.sin(phase); this.imag[j] = -this.imag[i]; energy += 2 * a * a;
      }
      const scale = energy ? amplitude * n * n / Math.sqrt(energy) : 0;
      for (let i = 0; i < n * n; i++) { this.field[i] *= scale; this.imag[i] *= scale; }
      fft2(this.field, this.imag, n, true);
    }
  }
  step(dt) { this.update(this.time + dt); }
  metrics() { return [rms(this.field), Math.max(...this.field) - Math.min(...this.field), Math.max(...this.imag.map(Math.abs))]; }
}

// Conservative staggered pressure/volume model, with donor-cell fluxes.
// This is a teaching reduction: no nonlinear momentum advection or turbulence.
export class Shallow {
  constructor(p, scene = 'channel') {
    this.p = p; this.scene = scene; this.width = 48; this.height = 28; this.dx = .3; this.time = 0;
    const n = this.width * this.height;
    for (const name of ['bed', 'field', 'u', 'v', 'fx', 'fy', 'limit', 'next']) this[name] = new Float64Array(n);
    for (let y = 0; y < this.height; y++) for (let x = 0; x < this.width; x++) {
      const i = y * this.width + x, xx = x * this.dx, yy = y * this.dx;
      const bank = scene === 'channel' ? .45 * Math.exp(-(((yy - .1) / .85) ** 2)) + .45 * Math.exp(-(((yy - 8) / .85) ** 2)) : 0;
      this.bed[i] = p.slope * xx + bank + p.obstacle * Math.exp(-((xx - 7) ** 2 + (yy - 4.1) ** 2) / .9);
      this.field[i] = Math.max(0, .55 - this.bed[i]);
    }
    this.initial = this.volume(); this.external = 0; this.pulse();
  }
  volume() { return this.field.reduce((s, h) => s + h * this.dx * this.dx, 0); }
  pulse() {
    let added = 0;
    for (let y = 0; y < this.height; y++) for (let x = 0; x < this.width; x++) {
      const i = y * this.width + x, d = .09 * Math.exp(-((x - 8) ** 2 + (y - 14) ** 2) / 14);
      this.field[i] += d; added += d * this.dx ** 2;
    }
    this.external += added;
  }
  step(dt) {
    let speed = 0;
    for (let i = 0; i < this.field.length; i++) speed = Math.max(speed, Math.abs(this.u[i]) + Math.abs(this.v[i]) + Math.sqrt(9.81 * this.field[i]));
    const count = Math.max(1, Math.ceil(dt / Math.min(.012, .28 * this.dx / Math.max(speed, .1))));
    for (let q = 0; q < count; q++) this.substep(dt / count);
  }
  substep(dt) {
    const n = this.field.length, w = this.width, hh = this.height, dx = this.dx, h = this.field, b = this.bed;
    this.time += dt;
    this.fx.fill(0); this.fy.fill(0);
    if (this.p.inflow > 0) for (let y = 0; y < hh; y++) {
      const i = y * w, target = Math.max(0, .55 + this.p.inflow * Math.sin(this.time * 2.2) - b[i]);
      const d = (target - h[i]) * (1 - Math.exp(-dt * 5)); h[i] += d; this.external += d * dx * dx;
    }
    for (let y = 0; y < hh; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      for (const [offset, enabled, vel, flux] of [[1, x < w - 1, this.u, this.fx], [w, y < hh - 1, this.v, this.fy]]) {
        if (!enabled) { vel[i] = 0; continue; }
        const j = i + offset, crest = Math.max(b[i], b[j]), a = b[i] + h[i], c = b[j] + h[j];
        if (Math.max(a, c) - crest <= 1e-7) { vel[i] = 0; continue; }
        vel[i] = clamp((vel[i] - 9.81 * dt * (c - a) / dx) / (1 + dt * this.p.friction), -4, 4);
        flux[i] = vel[i] * Math.max(0, (vel[i] >= 0 ? a : c) - crest);
      }
    }
    for (let y = 0; y < hh; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const out = (Math.max(this.fx[i], 0) + (x ? Math.max(-this.fx[i - 1], 0) : 0) + Math.max(this.fy[i], 0) + (y ? Math.max(-this.fy[i - w], 0) : 0)) / dx;
      this.limit[i] = out ? Math.min(1, h[i] / (dt * out)) : 1;
    }
    for (let i = 0; i < n; i++) {
      this.fx[i] *= this.limit[this.fx[i] >= 0 ? i : Math.min(i + 1, n - 1)];
      this.fy[i] *= this.limit[this.fy[i] >= 0 ? i : Math.min(i + w, n - 1)];
    }
    for (let y = 0; y < hh; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      this.next[i] = Math.max(0, h[i] - dt / dx * (this.fx[i] - (x ? this.fx[i - 1] : 0) + this.fy[i] - (y ? this.fy[i - w] : 0)));
    }
    this.field = this.next; this.next = h;
  }
  metrics() { return [this.volume(), (this.volume() - this.initial - this.external) / Math.max(this.initial, 1e-10) * 100, Math.min(...this.field)]; }
}

export function bilinear(field, w, h, x, y) {
  x = (x % w + w) % w; y = (y % h + h) % h;
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const a = field[iy * w + ix], b = field[iy * w + (ix + 1) % w], c = field[((iy + 1) % h) * w + ix], d = field[((iy + 1) % h) * w + (ix + 1) % w];
  return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
}
export class Transport {
  constructor(p) {
    this.p = p; this.width = 64; this.height = 40; this.time = 0; this.field = new Float64Array(2560); this.next = new Float64Array(2560);
    for (let y = 0; y < 40; y++) for (let x = 0; x < 64; x++) this.field[y * 64 + x] = Math.exp(-((x - 22) ** 2 + (y - 20) ** 2) / 28);
    this.initial = this.field.reduce((a, b) => a + b, 0);
  }
  velocity(x, y) { return [this.p.speed + this.p.swirl * Math.sin(y / this.height * TAU) * 7, this.p.swirl * Math.sin(x / this.width * TAU) * 7]; }
  pulse() { for (let y = 15; y < 25; y++) for (let x = 7; x < 12; x++) this.field[y * 64 + x] = 1; this.initial = this.field.reduce((a, b) => a + b, 0); }
  step(dt) {
    for (let y = 0; y < this.height; y++) for (let x = 0; x < this.width; x++) {
      const [vx, vy] = this.velocity(x, y);
      this.next[y * this.width + x] = bilinear(this.field, this.width, this.height, x - vx * dt, y - vy * dt) * Math.exp(-this.p.decay * dt);
    }
    [this.field, this.next] = [this.next, this.field]; this.time += dt;
  }
  metrics() { return [this.field.reduce((s, v) => s + v, 0), Math.max(...this.field), this.time]; }
}

export function wetStep(film, wet, rain, drain, dry, dt) {
  const decay = Math.exp(-drain * dt), nextFilm = clamp(film * decay + (drain > 0 ? rain / drain * (1 - decay) : rain * dt));
  const soak = nextFilm * .9, rate = soak + dry;
  const nextWet = rate ? wet * Math.exp(-rate * dt) + soak / rate * (1 - Math.exp(-rate * dt)) : wet;
  return [nextFilm, clamp(nextWet)];
}
export function hash(x, y, z = 0) { const v = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return v - Math.floor(v); }
const smooth = t => t * t * (3 - 2 * t);
export function noise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y), a = smooth(x - ix), b = smooth(y - iy);
  return (hash(ix, iy) * (1 - a) + hash(ix + 1, iy) * a) * (1 - b) + (hash(ix, iy + 1) * (1 - a) + hash(ix + 1, iy + 1) * a) * b;
}
export function fbm(x, y, octaves = 3) { let s = 0, norm = 0, a = 1; for (let i = 0; i < octaves; i++) { s += a * noise(x, y); norm += a; a *= .5; x *= 2; y *= 2; } return s / norm; }
export class Wetness {
  constructor(p) {
    this.p = p; this.width = 48; this.height = 30; this.field = new Float64Array(1440); this.film = new Float64Array(1440); this.time = 0; this.pulse();
  }
  pulse() { for (let y = 0; y < this.height; y++) for (let x = 0; x < this.width; x++) {
    const i = y * this.width + x, v = Math.exp(-((x - 24) ** 2 / 170 + (y - 15) ** 2 / 55)) * (.65 + .35 * noise(x * .3, y * .3));
    this.film[i] = Math.max(this.film[i], v); this.field[i] = Math.max(this.field[i], v * .8);
  } }
  step(dt) { for (let i = 0; i < this.field.length; i++) [this.film[i], this.field[i]] = wetStep(this.film[i], this.field[i], this.p.rain, this.p.drain, this.p.dry, dt); this.time += dt; }
  metrics() { return [mean(this.film), mean(this.field), this.p.drain > 0 ? Math.log(2) / this.p.drain : Infinity]; }
}

export function fresnel(angle, ior = 1.333) { const r0 = ((1 - ior) / (1 + ior)) ** 2; return r0 + (1 - r0) * (1 - Math.cos(angle * Math.PI / 180)) ** 5; }
export const transmission = (sigma, distance) => Math.exp(-sigma * distance);
export function march(sigma, distance, steps = 40, density = () => 1) { let t = 1; const ds = distance / steps; for (let i = 0; i < steps; i++) t *= Math.exp(-sigma * density((i + .5) * ds) * ds); return t; }
export function optics(p) {
  const theta = Math.asin(Math.sin(p.angle * Math.PI / 180) / p.ior), path = p.depth / Math.max(.01, Math.cos(theta));
  return { reflection: fresnel(p.angle, p.ior), path, theta, rgb: [.72, .2, .14].map(s => march(s * p.turbidity, path)) };
}
export function flight(height, velocity, gravity) { return (velocity + Math.sqrt(velocity ** 2 + 2 * gravity * height)) / gravity; }
export function ballistic(t, height, vx, vy, g) { return [vx * t, height + vy * t - .5 * g * t * t]; }
export function triWeights(n, sharpness = 4) { const w = n.map(x => Math.abs(x) ** sharpness), s = w.reduce((a, b) => a + b, 0); return s ? w.map(x => x / s) : [1 / 3, 1 / 3, 1 / 3]; }
export function material(p, point, normal) {
  const [x, y, z] = point.map(v => v * p.scale), w = triWeights(normal, p.sharpness);
  const samples = [fbm(y, z, p.octaves), fbm(x, z, p.octaves), fbm(x, y, p.octaves)];
  return { value: p.projection === 0 ? samples[1] : samples.reduce((s, v, i) => s + v * w[i], 0), weights: w };
}
export function makeModel(id, p, scene, seed = 42) {
  if (id === 'waves') return new Waves(p, seed);
  if (id === 'flow') return new Shallow(p, scene);
  if (id === 'transport') return new Transport(p);
  if (id === 'wetness') return new Wetness(p);
  return { p, time: 0, step(dt) { this.time += dt; }, metrics() {
    if (id === 'optics') { const o = optics(p); return [o.reflection * 100, o.rgb[0] * 100, o.path]; }
    if (id === 'breaker') { const t = flight(p.height, p.lift, p.gravity); return [t, t * p.speed, p.gravity]; }
    return [p.octaves, p.scale, triWeights([.4, .8, .2], p.sharpness).reduce((a, b) => a + b, 0)];
  } };
}
