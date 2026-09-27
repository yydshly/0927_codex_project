export const storageKey = 'lofi-cities-research-preset-v1';
export const templates = {
  writing: { task: 'writing', city: 'istanbul', focus: 50, energy: 'balanced', band: 'no-drums', music: 65, ambience: 40 },
  reading: { task: 'reading', city: 'sydney', focus: 25, energy: 'chill', band: 'keys', music: 40, ambience: 30 },
  coding: { task: 'coding', city: 'tokyo', focus: 50, energy: 'upbeat', band: 'full', music: 70, ambience: 35 },
};
export const taskNames = { writing: '写作', reading: '阅读', coding: '编程' };
export const bandNames = { full: '完整乐队', 'no-drums': '无鼓', keys: '仅键盘' };
export const energyNames = { chill: 'Chill', balanced: 'Balanced', upbeat: 'Upbeat' };
export const bpmRanges = { chill: '60–72 BPM', balanced: '68–88 BPM', upbeat: '80–94 BPM' };

export function normalizePreset(value) {
  const raw = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const fallback = templates.writing;
  const choose = (key, values) => values.includes(raw[key]) ? raw[key] : fallback[key];
  const volume = (key) => typeof raw[key] === 'number' && Number.isFinite(raw[key]) ? Math.round(Math.max(0, Math.min(100, raw[key]))) : fallback[key];
  return { task: choose('task', Object.keys(taskNames)), city: choose('city', ['istanbul', 'tokyo', 'sydney']), focus: choose('focus', [25, 50]), energy: choose('energy', Object.keys(energyNames)), band: choose('band', Object.keys(bandNames)), music: volume('music'), ambience: volume('ambience') };
}

export function serializePreset(value) {
  return { schemaVersion: 1, kind: 'lofi-environment-proposal', source: 'https://loficities.com/istanbul/', note: '本研究项目的配置示例，不是 Lofi Cities 官方 API 或导入格式。', ...normalizePreset(value) };
}
