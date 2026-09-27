import { musicProfiles, sceneMusic } from './music.js';
export const scenes = [
  { id: 'study', name: '雨夜书房', english: 'AFTER HOURS', category: '室内', tag: '雨声 · 温暖 · 阅读', description: '把世界留在窗外，把时间留给自己。', accent: '#d7b98b', clock: 'Asia/Shanghai', timeLabel: '本地夜读', channels: ['rain', 'wind', 'vinyl'], mix: { rain: 48, wind: 12, vinyl: 16 }, mood: 'calm' },
  { id: 'forest', name: '森林木屋', english: 'INTO THE PINES', category: '自然', tag: '松林 · 炉火 · 松弛', description: '松树之间，只有风和炉火的声音。', accent: '#a6c7a3', clock: 'Europe/Oslo', timeLabel: '松林时区', channels: ['wind', 'fire', 'crickets'], mix: { wind: 35, fire: 52, crickets: 18 }, mood: 'calm' },
  { id: 'coast', name: '海边咖啡馆', english: 'SLOW TIDE', category: '自然', tag: '海浪 · 落日 · 轻快', description: '等一杯咖啡，也等下一阵潮汐。', accent: '#e4af83', clock: 'Europe/Lisbon', timeLabel: '海岸时区', channels: ['sea', 'wind', 'vinyl'], mix: { sea: 54, wind: 18, vinyl: 9 }, mood: 'balanced' },
  { id: 'train', name: '深夜列车', english: 'SOMEWHERE, TONIGHT', category: '旅途', tag: '轨道 · 夜行 · 沉浸', description: '窗外的灯火，替你把思绪带向远方。', accent: '#a5b9dd', clock: 'Asia/Tokyo', timeLabel: '夜行时区', channels: ['train', 'rain', 'wind'], mix: { train: 46, rain: 24, wind: 14 }, mood: 'balanced' },
  { id: 'neon', name: '霓虹天台', english: 'CITY IN REVERIE', category: '城市', tag: '霓虹 · 微雨 · 夜色', description: '城市还醒着，你可以慢一点。', accent: '#c7a4d9', clock: 'Asia/Tokyo', timeLabel: '城市时区', channels: ['rain', 'wind', 'vinyl'], mix: { rain: 38, wind: 22, vinyl: 12 }, mood: 'bright' },
  { id: 'snow', name: '雪山小屋', english: 'A QUIETER WORLD', category: '自然', tag: '雪落 · 山峦 · 安静', description: '在雪落下的间隙，找回呼吸的节奏。', accent: '#b5d5df', clock: 'Europe/Zurich', timeLabel: '山间时区', channels: ['wind', 'fire', 'vinyl'], mix: { wind: 40, fire: 40, vinyl: 8 }, mood: 'calm' },
];
export const channelNames = { rain: '窗外雨声', wind: '轻风', vinyl: '唱片底噪', fire: '炉火', crickets: '林间虫鸣', sea: '海浪', train: '轮轨声' };
export const styles = { pixel: '原画', glow: '柔光', mono: '黑白' };
export const moods = { calm: { name: '舒缓', bpm: 66 }, balanced: { name: '平衡', bpm: 78 }, bright: { name: '轻快', bpm: 90 } };
export const bands = { full: '加入节奏', soft: '旋律与低音', keys: '主旋律' };
export const storeKey = 'quiet-spaces-v1';
export const defaultSettings = { scene: 'study', style: 'pixel', mood: 'calm', band: 'keys', musicProfile: 'piano', music: 42, ambience: 58, master: 65, intensity: 65, activity: 65, brightness: 100, motion: true, dynamics: true, particles: true, lighting: true, mix: { ...scenes[0].mix } };
const number = (v, fallback, min, max) => Number.isFinite(Number(v)) ? Math.min(max, Math.max(min, Number(v))) : fallback;
export function normalizeSettings(input = {}) {
  const scene = scenes.find(s => s.id === input?.scene) || scenes[0];
  const result = { ...defaultSettings, scene: scene.id, mix: { ...scene.mix } };
  result.musicProfile = musicProfiles.some(p => p.id === input?.musicProfile) ? input.musicProfile : sceneMusic[scene.id];
  result.band = musicProfiles.find(p => p.id === result.musicProfile).band;
  for (const [key, collection] of [['style', styles], ['mood', moods], ['band', bands]]) if (Object.hasOwn(collection, input?.[key])) result[key] = input[key];
  if (['ambient', 'musicbox'].includes(result.musicProfile)) result.band = 'keys';
  for (const key of ['music', 'ambience', 'master', 'intensity', 'activity', 'brightness']) result[key] = number(input?.[key] ?? result[key], result[key], key === 'brightness' ? 35 : 0, 100);
  for (const key of ['motion', 'dynamics', 'particles', 'lighting']) result[key] = typeof input?.[key] === 'boolean' ? input[key] : true;
  for (const key of scene.channels) result.mix[key] = number(input?.mix?.[key] ?? scene.mix[key], scene.mix[key], 0, 100);
  return result;
}
export function normalizeStore(raw = {}) {
  const settings = normalizeSettings(raw?.settings);
  const favorites = Array.isArray(raw?.favorites) ? [...new Set(raw.favorites.filter(id => scenes.some(s => s.id === id)))] : ['study'];
  const saved = Array.isArray(raw?.saved) ? raw.saved.filter(x => x && typeof x.id === 'string' && typeof x.name === 'string').slice(0, 30).map(x => ({ id: x.id.slice(0, 80), name: x.name.slice(0, 40), settings: normalizeSettings(x.settings) })) : [];
  const sessions = Array.isArray(raw?.sessions) ? raw.sessions.filter(s => s && Number.isFinite(s.finished) && Number.isFinite(s.minutes) && s.minutes > 0 && s.minutes <= 180).slice(-365).map(s => ({ finished: s.finished, minutes: s.minutes, task: String(s.task || '专注时光').slice(0, 80), scene: scenes.some(x => x.id === s.scene) ? s.scene : 'study' })) : [];
  const environments = Object.fromEntries(scenes.map(scene => [scene.id, normalizeSettings({ mood: scene.mood, ...raw?.environments?.[scene.id], scene: scene.id })]));
  return { version: 1, settings, environments, favorites, saved, sessions, previewMotion: typeof raw?.previewMotion === 'boolean' ? raw.previewMotion : true };
}
export function formatTime(seconds) { const n = Math.max(0, Math.ceil(seconds)); return `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`; }
export function newTimer(minutes = 25, rest = 5) { return { phase: 'focus', running: false, remaining: minutes * 60, deadline: null, minutes, rest, completed: 0, task: '' }; }
export function startTimer(timer, now) { return { ...timer, running: true, deadline: now + timer.remaining * 1000 }; }
export function pauseTimer(timer, now) { return { ...timer, remaining: timer.running ? Math.max(0, (timer.deadline - now) / 1000) : timer.remaining, running: false, deadline: null }; }
// Completion advances once, never inventing completed sessions during a suspended tab.
export function tickTimer(timer, now) {
  if (!timer.running) return { timer, completed: null };
  const remaining = Math.max(0, (timer.deadline - now) / 1000);
  if (remaining > 0) return { timer: { ...timer, remaining }, completed: null };
  const finishedFocus = timer.phase === 'focus';
  return { timer: { ...timer, phase: finishedFocus ? 'break' : 'focus', remaining: (finishedFocus ? timer.rest : timer.minutes) * 60, running: false, deadline: null, completed: timer.completed + (finishedFocus ? 1 : 0) }, completed: finishedFocus ? { finished: timer.deadline, minutes: timer.minutes, task: timer.task } : null };
}
export function sleepGain(deadline, now) { return deadline ? Math.min(1, Math.max(0, (deadline - now) / 30000)) : 1; }
const trackWords = [['纸页之间', '凌晨来信', '一盏灯', '远处的雨'], ['松针上的月亮', '木屋来客', '山谷回声', '慢慢生长'], ['橘色海岸', '第二杯拿铁', '潮汐来信', '晒暖的风'], ['下一站以后', '流动的星光', '无人站台', '蓝色车窗'], ['夜色的形状', '紫色电波', '天台来信', '城市慢拍'], ['白色呼吸', '山顶的云', '缓慢降落', '冬日炉边']];
export function trackInfo(scene, index = 0) { const n = Math.max(0, Math.floor(Number(index) || 0)); const names = trackWords[Math.max(0, scenes.findIndex(s => s.id === scene))]; return { index: n, title: names[n % names.length], duration: 120 + (n % 3) * 24, seed: 29 + n * 7, key: ['A minor', 'C major', 'F major', 'D minor'][n % 4] }; }
