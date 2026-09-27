import { defaults, normalizeLab } from './lab-model.js';
import { createStudyScene } from './lab-scene.js';
import { createStudyAudio } from './lab-audio.js';

export function initLab() {
  const $ = selector => document.querySelector(selector);
  const root = $('#lab');
  const settings = { ...defaults, rainLayer: true, steamLayer: true, lightLayer: true, baseOnly: false };
  const scene = createStudyScene($('#study-canvas'));
  let active = false, frame = 0, lastTime = 0, sceneTime = 0, lastReadout = 0;
  let paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let soundOn = false, audioBusy = false;
  const audio = createStudyAudio(running => {
    soundOn = running;
    $('#lab-sound').textContent = running ? '关闭声音' : '开启声音';
    $('#lab-sound').setAttribute('aria-pressed', String(running));
    $('#lab-audio-state').textContent = running ? '声音正在合成' : '声音未开启';
    $('#lab-audio-state').dataset.running = String(running);
    if (!running) {
      $('#lab-level').value = 0; $('#lab-level-value').textContent = '0'; $('#lab-chord').textContent = '—';
    }
  });
  function updateControls() {
    root.querySelectorAll('[data-lab-setting]').forEach(input => {
      const key = input.dataset.labSetting;
      input.value = settings[key];
      $(`#${input.id}-value`).textContent = `${settings[key]}${key === 'bpm' ? '' : '%'}`;
    });
    root.querySelectorAll('[data-lab-layer]').forEach(input => { input.checked = settings[input.dataset.labLayer]; });
    $('#lab-pause').textContent = paused ? '继续画面' : '暂停画面';
    $('#lab-pause').setAttribute('aria-pressed', String(paused));
    $('#lab-base').setAttribute('aria-pressed', String(settings.baseOnly));
    $('#lab-base').textContent = settings.baseOnly ? '恢复完整场景' : '对比纯底图';
    $('#lab-view-state').textContent = settings.baseOnly ? '纯底图 · 动态层已隐藏' : paused ? '画面已暂停 · 声音独立运行' : '实时绘制 · 480 × 270';
    $('#lab-param').textContent = `雨量 ${settings.rain}% → ${Math.round(settings.rain * 1.5)} 条雨滴 / 雨声强度 × ${(settings.rain / 100).toFixed(2)}`;
    audio.update(settings); draw();
  }
  function draw() {
    const count = scene.render(sceneTime, settings);
    $('#lab-drops').textContent = String(count);
    $('#lab-time').textContent = `${sceneTime.toFixed(1)} s`;
  }
  function tick(now) {
    if (!active || document.hidden) { frame = 0; return; }
    if (lastTime && !paused && !settings.baseOnly) sceneTime += Math.min((now - lastTime) / 1000, .1);
    lastTime = now;
    if (!paused && !settings.baseOnly) draw();
    if (now - lastReadout > 100) {
      const snapshot = audio.snapshot();
      $('#lab-level').value = snapshot.level; $('#lab-level-value').textContent = String(snapshot.level);
      $('#lab-chord').textContent = snapshot.chord; lastReadout = now;
    }
    frame = requestAnimationFrame(tick);
  }
  function wake() {
    if (active && !document.hidden && !frame) { lastTime = 0; frame = requestAnimationFrame(tick); }
  }
  root.querySelectorAll('[data-lab-setting]').forEach(input => input.addEventListener('input', () => {
    settings[input.dataset.labSetting] = Number(input.value);
    Object.assign(settings, normalizeLab(settings)); updateControls();
  }));
  root.querySelectorAll('[data-lab-layer]').forEach(input => input.addEventListener('change', () => {
    settings[input.dataset.labLayer] = input.checked; updateControls();
  }));
  $('#lab-pause').addEventListener('click', () => { paused = !paused; lastTime = 0; updateControls(); });
  $('#lab-base').addEventListener('click', () => { settings.baseOnly = !settings.baseOnly; updateControls(); });
  $('#lab-reset').addEventListener('click', () => {
    Object.assign(settings, defaults, { rainLayer: true, steamLayer: true, lightLayer: true, baseOnly: false });
    paused = matchMedia('(prefers-reduced-motion: reduce)').matches; sceneTime = 0; lastTime = 0; updateControls();
    $('#lab-status').textContent = '已恢复默认场景与参数；声音保持当前开关状态。';
  });
  $('#lab-sound').addEventListener('click', async () => {
    if (audioBusy) return;
    if (soundOn) { audio.stop(); $('#lab-status').textContent = '声音已关闭，画面可以继续运行。'; return; }
    audioBusy = true; $('#lab-sound').disabled = true;
    try {
      await audio.start(settings);
      if (active && soundOn) $('#lab-status').textContent = '正在实时合成轻柔和弦与雨声，可分别调节音量。';
    } catch (error) { audio.stop(); $('#lab-status').textContent = `声音未能开启：${error.message}`; }
    finally { audioBusy = false; $('#lab-sound').disabled = false; }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; lastTime = 0; }
    else wake();
  });
  window.addEventListener('pagehide', () => { audio.stop(); cancelAnimationFrame(frame); frame = 0; });
  updateControls();
  return {
    setActive(value) {
      active = value;
      if (active) wake();
      else {
        audio.stop(); cancelAnimationFrame(frame); frame = 0; lastTime = 0;
        $('#lab-status').textContent = '声音默认关闭。点击开启后，由浏览器现场生成。';
      }
    },
  };
}
