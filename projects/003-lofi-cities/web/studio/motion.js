export const sceneMotion = {
  study: { name: '书房微风', details: ['茶气升起', '绿植轻摇', '远处灯火'] },
  forest: { name: '林间生息', details: ['溪水流动', '炉火跃动', '松枝轻摇'] },
  coast: { name: '海岸潮汐', details: ['海面起伏', '倒影闪动', '咖啡热气'] },
  train: { name: '夜行速度', details: ['窗外行进', '近景掠过', '车厢静置'] },
  neon: { name: '城市呼吸', details: ['霓虹渐变', '地面积水', '植物轻摇'] },
  snow: { name: '山间微风', details: ['烟囱炊烟', '松枝摇曳', '山间薄雾'] },
};
// Keep separate clocks: pausing weather must not freeze the scene, or vice versa.
export function advanceMotion(state, now, settings) {
  const delta = state.previous === null ? 0 : Math.min(.15, Math.max(0, now - state.previous));
  const activity = Math.max(0, Math.min(100, Number(settings.activity ?? 65))) / 100;
  return {
    previous: now,
    weather: state.weather + (settings.motion ? delta : 0),
    scene: state.scene + (settings.motion && settings.dynamics !== false ? delta * activity : 0),
  };
}
export function isPreviewVisible(rect, width, height) {
  return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < height - 88 && rect.right > 0 && rect.left < width;
}
