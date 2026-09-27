import { normalizeSettings } from './model.js';

// A complete listening environment: picture, motion, music and environmental mix.
export const moments = [
  { id: 'reading', name: '雨夜阅读', scene: 'study', note: '钢琴 · 窗外细雨', settings: { musicProfile: 'piano', music: 44, ambience: 48, intensity: 56, activity: 45, mix: { rain: 52, wind: 8, vinyl: 12 } } },
  { id: 'unwind', name: '林间放松', scene: 'forest', note: '吉他 · 松风炉火', settings: { musicProfile: 'guitar', music: 40, ambience: 54, intensity: 42, activity: 55, mix: { wind: 30, fire: 56, crickets: 15 } } },
  { id: 'afternoon', name: '海岸午后', scene: 'coast', note: '爵士 · 轻柔海浪', settings: { musicProfile: 'jazz', music: 48, ambience: 42, intensity: 40, activity: 60, mix: { sea: 48, wind: 16, vinyl: 8 } } },
  { id: 'journey', name: '深夜远行', scene: 'train', note: '氛围音乐 · 行进轮轨', settings: { musicProfile: 'ambient', music: 48, ambience: 44, intensity: 38, activity: 72, mix: { train: 40, rain: 22, wind: 10 } } },
  { id: 'flow', name: '城市心流', scene: 'neon', note: 'Lo-fi · 霓虹微雨', settings: { musicProfile: 'lofi', music: 50, ambience: 40, intensity: 48, activity: 58, mix: { rain: 42, wind: 12, vinyl: 16 } } },
  { id: 'snowfall', name: '雪夜放空', scene: 'snow', note: '八音盒 · 雪落炉边', settings: { musicProfile: 'musicbox', music: 36, ambience: 48, intensity: 60, activity: 40, mix: { wind: 26, fire: 46, vinyl: 5 } } },
];

export function momentSettings(id, current = {}) {
  const moment = moments.find(m => m.id === id);
  if (!moment) return null;
  return normalizeSettings({ ...moment.settings, scene: moment.scene, mood: 'calm', style: 'pixel', master: current.master, motion: current.motion });
}

export function matchingMoment(settings) {
  return moments.find(m => {
    const expected = momentSettings(m.id, settings);
    return Object.keys(expected).every(key => key === 'mix'
      ? Object.keys(expected.mix).every(channel => expected.mix[channel] === settings.mix[channel])
      : expected[key] === settings[key]);
  }) || null;
}
