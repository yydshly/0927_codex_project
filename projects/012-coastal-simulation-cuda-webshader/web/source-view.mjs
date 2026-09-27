// The bundled upstream site is same-origin. Its published API lets this page
// select views and conditions without altering the upstream solver or renderer.
const $ = id => document.getElementById(id);
const frame = $('upstream-frame');
let mode = 'source';
let pollTimer = 0;
let loadVersion = 0;

function status(message) { $('source-status').textContent = message; }
function upstream() {
  try { return frame.contentWindow?.saltreach ?? null; }
  catch { return null; }
}
function applyControls(api) {
  api.setView($('source-camera').value);
  api.configure({ strength: Number($('source-sea').value), tide: Number($('source-tide').value) });
  api.setQuality($('source-quality').value);
  api.setPause(false);
  $('source-pause').textContent = '暂停模拟';
}
function watchReady(version) {
  if (version !== loadVersion || mode !== 'source') return;
  const api = upstream();
  if (api?.diagnostics?.ready) {
    applyControls(api);
    status($('source-reef').value === 'reef' ? 'WebGPU 已运行 · 新礁石参与求解' : 'WebGPU / CUDA WebShader 已运行');
    return;
  }
  if (api?.diagnostics?.errors?.length) {
    status(`源库启动失败：${String(api.diagnostics.errors.at(-1)).slice(0, 90)}`);
    return;
  }
  pollTimer = window.setTimeout(() => watchReady(version), 400);
}
function reloadSource() {
  loadVersion += 1;
  window.clearTimeout(pollTimer);
  const extended = $('source-reef').value === 'reef';
  status(extended ? '正在建立新礁石与初始海况…' : '正在加载上游原版场景…');
  frame.src = extended ? './upstream/index.html?reef=1' : './upstream/index.html';
}
function show(which) {
  mode = which;
  const source = which === 'source';
  $('source-stage').hidden = !source;
  $('experiment-view').hidden = source;
  $('show-source').classList.toggle('selected', source);
  $('show-experiment').classList.toggle('selected', !source);
  $('show-source').setAttribute('aria-pressed', String(source));
  $('show-experiment').setAttribute('aria-pressed', String(!source));
  if (source) {
    window.coastalExtensionLab?.deactivate();
    reloadSource();
  } else {
    loadVersion += 1;
    window.clearTimeout(pollTimer);
    frame.src = 'about:blank';
    window.coastalExtensionLab?.activate();
  }
}

frame.addEventListener('load', () => {
  if (mode !== 'source') return;
  loadVersion += 1;
  window.clearTimeout(pollTimer);
  status('页面已加载，正在初始化 GPU…');
  watchReady(loadVersion);
});
$('show-source').addEventListener('click', () => { if (mode !== 'source') show('source'); });
$('show-experiment').addEventListener('click', () => { if (mode !== 'experiment') show('experiment'); });
$('source-camera').add(new Option('Offshore · 新礁石近景', 'ocean'));
$('source-reef').addEventListener('change', () => {
  $('source-camera').value = 'ocean';
  if (mode === 'source') reloadSource();
});
$('source-camera').addEventListener('change', event => { upstream()?.setView(event.target.value); });
$('source-sea').addEventListener('input', event => {
  const value = Number(event.target.value);
  $('source-sea-value').textContent = value.toFixed(2);
  upstream()?.configure({ strength: value });
});
$('source-tide').addEventListener('input', event => {
  const value = Number(event.target.value);
  $('source-tide-value').textContent = `${value.toFixed(2)} m`;
  upstream()?.configure({ tide: value });
});
$('source-quality').addEventListener('change', event => { upstream()?.setQuality(event.target.value); });
$('source-pause').addEventListener('click', () => {
  const api = upstream();
  if (!api) return;
  api.setPause(!api.paused);
  $('source-pause').textContent = api.paused ? '继续模拟' : '暂停模拟';
});
show('source');
