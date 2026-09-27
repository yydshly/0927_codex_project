const upstream = './upstream/index.html';

const filterButtons = [...document.querySelectorAll('[data-filter]')];
const cards = [...document.querySelectorAll('.cap-card')];
const filterCount = document.getElementById('filter-count');

function setFilter(group) {
  let visible = 0;
  for (const card of cards) {
    const show = group === 'all' || card.dataset.group === group;
    card.hidden = !show;
    if (show) visible += 1;
  }
  for (const button of filterButtons) {
    button.setAttribute('aria-pressed', String(button.dataset.filter === group));
  }
  filterCount.textContent = group === 'all'
    ? `显示全部 ${visible} 项能力`
    : `显示 ${visible} / ${cards.length} 项能力`;
}

for (const button of filterButtons) {
  button.addEventListener('click', () => setFilter(button.dataset.filter));
}
setFilter('all');

const screen = document.getElementById('stage-screen');
const placeholder = document.getElementById('stage-placeholder');
const loadButton = document.getElementById('load-demo');
const stopButton = document.getElementById('stop-demo');
const stageState = document.getElementById('stage-state');
const status = document.getElementById('demo-status');
const fallback = document.getElementById('embed-fallback');
let frame = null;
let fallbackTimer = null;
let readyTimer = null;

loadButton.addEventListener('click', () => {
  if (frame) return;
  frame = document.createElement('iframe');
  frame.src = upstream;
  frame.title = '上游 coastal-simulation CUDA WebShader 实时演示';
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
  frame.allow = 'fullscreen';
  frame.setAttribute('allowfullscreen', '');
  frame.addEventListener('load', () => {
    if (!frame) return;
    stageState.textContent = '正在初始化 GPU';
    status.textContent = '本地上游页面已加载，正在建立 WebGPU 场景。';
    const checkReady = () => {
      if (!frame) return;
      const diagnostics = frame.contentWindow?.saltreach?.diagnostics;
      if (diagnostics?.ready) {
        window.clearTimeout(fallbackTimer);
        fallback.hidden = true;
        stageState.textContent = 'WebGPU 运行中';
        status.textContent = '上游完整场景已在本站本地运行。可在画面内切换视角和海况。';
        return;
      }
      if (diagnostics?.errors?.length) {
        stageState.textContent = '启动失败';
        status.textContent = `源库启动失败：${String(diagnostics.errors.at(-1)).slice(0, 110)}`;
        fallback.hidden = false;
        return;
      }
      readyTimer = window.setTimeout(checkReady, 400);
    };
    checkReady();
  });
  placeholder.hidden = true;
  screen.append(frame);
  fallbackTimer = window.setTimeout(() => {
    if (!frame) return;
    fallback.hidden = false;
    status.textContent = '加载仍在进行；可在新页面单独打开本地源库场景。';
  }, 15000);
  stopButton.hidden = false;
  stageState.textContent = '正在请求';
  status.textContent = '正在加载本站打包的上游 WebGPU 场景。';
});

stopButton.addEventListener('click', () => {
  window.clearTimeout(fallbackTimer);
  window.clearTimeout(readyTimer);
  fallbackTimer = null;
  if (frame) frame.remove();
  frame = null;
  fallback.hidden = true;
  placeholder.hidden = false;
  stopButton.hidden = true;
  stageState.textContent = '已卸载';
  status.textContent = '已停止嵌入演示；再次点击可重新加载。';
});
