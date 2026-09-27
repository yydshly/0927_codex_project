// Independent teaching example. No upstream code or media is used.
export const defaults = Object.freeze({ rain: 60, music: 32, ambience: 45, bpm: 72 });
export function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
export function normalizeLab(input = {}) {
  return Object.fromEntries(Object.entries(defaults).map(([key, fallback]) => {
    const value = Number(input[key] ?? fallback);
    return [key, clamp(Number.isFinite(value) ? value : fallback, key === 'bpm' ? 60 : 0, key === 'bpm' ? 90 : 100)];
  }));
}
export function seedRandom(seed = 19) {
  let state = seed >>> 0;
  return () => { state = (1664525 * state + 1013904223) >>> 0; return state / 4294967296; };
}
export const windowBox = Object.freeze({ x: 151, y: 28, width: 287, height: 145 });
const random = seedRandom(314);
const drops = Array.from({ length: 150 }, () => ({ x: random(), y: random(), speed: 38 + random() * 58, length: 3 + random() * 5 }));
const wrap = (value, range) => ((value % range) + range) % range;
export function rainParticles(time, amount) {
  const count = Math.round(clamp(amount, 0, 100) * 1.5);
  return drops.slice(0, count).map(drop => ({
    x: windowBox.x + wrap(drop.x * windowBox.width - time * 10, windowBox.width),
    y: windowBox.y + wrap(drop.y * windowBox.height + time * drop.speed, windowBox.height),
    length: drop.length,
  }));
}
export const chords = Object.freeze([
  { name: 'Am7', notes: [57, 60, 64, 67], bass: 45 },
  { name: 'Fmaj7', notes: [53, 57, 60, 64], bass: 41 },
  { name: 'Cmaj7', notes: [55, 59, 60, 64], bass: 36 },
  { name: 'G6', notes: [55, 59, 62, 64], bass: 43 },
]);
export const frequency = midi => 440 * 2 ** ((midi - 69) / 12);
