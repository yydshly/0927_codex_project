export const musicProfiles = [
  { id: 'piano', name: '纸页钢琴', english: 'FELT PIANO', subtitle: '柔和琴键 · 缓慢琶音', description: '轻轻落下的琴音，给阅读留出空隙。', instrument: 'piano', bpm: 66, band: 'keys', color: '#bda98a', tracks: ['纸页之间', '灯下的留白', '写给凌晨', '一小段安静'], chords: [[57,60,64,71],[53,57,60,67],[60,64,67,74],[55,59,62,69]], melody: [0,2,1,3,2,1,0,2], swing: 0 },
  { id: 'jazz', name: '午夜爵士', english: 'MIDNIGHT RHODES', subtitle: '电钢琴 · 摇摆节奏 · 贝斯', description: '温暖的和弦与轻柔的鼓刷，像一间深夜小酒馆。', instrument: 'rhodes', bpm: 78, band: 'full', color: '#bf936e', tracks: ['第二杯浓缩', '空着的吧台', '蓝色转角', '夜班来信'], chords: [[53,57,60,64,67],[58,62,65,69,72],[52,55,59,62,66],[57,60,64,67,71]], melody: [4,2,3,1,2,4,3,0], swing: .17 },
  { id: 'lofi', name: '城市慢拍', english: 'LO-FI BEATS', subtitle: '温暖采样感 · 鼓机 · 切分', description: '颗粒感琴音配上稳定鼓点，陪你进入工作状态。', instrument: 'tape', bpm: 84, band: 'full', color: '#a690c2', tracks: ['屋顶电台', '无人街道', '微醺节拍', '最后一班车'], chords: [[57,60,64,67],[53,57,60,64],[50,53,57,60],[52,55,59,62]], melody: [2,0,3,1,0,2,1,3], swing: .10 },
  { id: 'ambient', name: '漂浮星河', english: 'AMBIENT DRIFT', subtitle: '宽阔合成器 · 长音 · 无鼓', description: '缓慢交叠的音色，像夜空里没有边界的云。', instrument: 'pad', bpm: 48, band: 'keys', color: '#849dbc', tracks: ['失重时刻', '星际潮汐', '远方的光', '云的边界'], chords: [[48,55,60,64],[53,60,65,69],[45,52,57,60],[43,50,55,62]], melody: [0,1,2,3], swing: 0 },
  { id: 'guitar', name: '海岸木吉他', english: 'COASTAL STRINGS', subtitle: '拨弦 · 分解和弦 · 轻盈', description: '明亮而松弛的弦音，带一点海边午后的温度。', instrument: 'guitar', bpm: 72, band: 'soft', color: '#82b6b0', tracks: ['晒暖的风', '潮汐来信', '沿着海岸', '慢半拍的夏天'], chords: [[48,55,60,64,67],[43,50,55,59,62],[45,52,57,60,64],[41,48,53,57,60]], melody: [0,2,4,3,1,3,4,2], swing: 0 },
  { id: 'musicbox', name: '雪夜八音盒', english: 'WINTER MUSIC BOX', subtitle: '清脆钟音 · 稀疏旋律 · 余响', description: '很轻、很慢，给睡前留下一点童话感。', instrument: 'bell', bpm: 58, band: 'keys', color: '#a6b9ca', tracks: ['第一片雪', '玻璃里的冬天', '月光小径', '晚安以后'], chords: [[60,64,67,71],[57,60,64,67],[53,57,60,64],[55,59,62,67]], melody: [2,3,1,2,0,1,3,2], swing: 0 },
];
export const sceneMusic = { study: 'piano', forest: 'guitar', coast: 'jazz', train: 'ambient', neon: 'lofi', snow: 'musicbox' };
export function getProfile(id) { return musicProfiles.find(p => p.id === id) || musicProfiles[0]; }
export function profileBpm(id, mood = 'calm') { return getProfile(id).bpm + ({calm:0,balanced:8,bright:16}[mood] || 0); }
export function musicTrack(id, index = 0) {
  const profile = getProfile(id), n = Number.isFinite(Number(index)) ? Math.max(0, Math.floor(Number(index))) : 0;
  return { index: n, title: profile.tracks[n % profile.tracks.length], duration: 128 + n % 3 * 16, key: profile.id, seed: 29 + n * 7 };
}
// A deterministic arrangement makes each background audibly distinct and testable.
export function arrangement(id, step, index = 0, band = 'soft') {
  const p = getProfile(id), bar = Math.floor(step / 8), chord = p.chords[(bar + index) % 4], pos = step % 8;
  const events = [], note = (pitch, duration, gain, instrument = p.instrument, delay = 0) => events.push({ pitch, duration, gain, instrument, delay });
  if (p.id === 'ambient') {
    if (pos === 0) chord.forEach((n, i) => note(n, 6.2, .040, 'pad', i * .12));
  } else if (p.id === 'guitar') {
    note(chord[p.melody[(step + index) % 8]], 1.55, .22, 'guitar');
    if (band !== 'keys' && pos === 0) note(chord[0] - 12, 2.8, .17, 'bass');
  } else if (p.id === 'musicbox') {
    if (pos % 2 === 0) note(chord[p.melody[(Math.floor(step / 2) + index) % 8] % chord.length] + 12, 3.6, .16, 'bell');
    if (pos === 0) note(chord[0], 4, .055, 'bell');
  } else {
    if (pos === 0 || (p.id === 'jazz' && pos === 5) || (p.id === 'lofi' && pos === 7)) {
      chord.forEach((n, i) => note(n, p.id === 'piano' ? 3.4 : 2.2, p.id === 'piano' ? .085 : .075, p.instrument, i * (p.id === 'piano' ? .065 : .014)));
    }
    const play = p.id === 'lofi' ? [1,4,6].includes(pos) : pos % 2 === 0;
    if (play) note(chord[p.melody[(Math.floor(step / 2) + index) % 8] % chord.length] + 12, p.id === 'piano' ? 2.6 : 1.1, .105);
    if (band !== 'keys' && pos % 4 === 0) note(chord[pos === 0 ? 0 : 2] - 12, 1.8, .2, 'bass');
  }
  if (band === 'full' && !['ambient','musicbox'].includes(p.id)) {
    if ([0, p.id === 'lofi' ? 3 : 6].includes(pos)) events.push({ drum: 'kick' });
    if ([2,6].includes(pos)) events.push({ drum: p.id === 'jazz' ? 'brush' : 'snare' });
    if (pos % 2 === 1) events.push({ drum: 'hat' });
  }
  return events;
}
