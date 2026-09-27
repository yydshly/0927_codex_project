'use strict';
const data = JSON.parse(document.getElementById('page-data').textContent);
const image = document.getElementById('gallery-image');
document.querySelectorAll('.gallery-select').forEach(button => {
  button.addEventListener('click', () => {
    const shot = data.gallery[Number(button.dataset.image)];
    image.src = `./assets/${shot.file}`;
    image.alt = shot.alt;
    document.getElementById('gallery-link').href = image.src;
    document.getElementById('gallery-caption').textContent = shot.caption;
    document.querySelectorAll('.gallery-select').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  });
});
document.querySelectorAll('.stage-select').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.stage-select').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    document.querySelectorAll('.stage-panel').forEach(panel => { panel.hidden = panel.id !== button.getAttribute('aria-controls'); });
  });
});
const recommendations = {
  learn: '优先阅读 coastal-simulation：状态场较集中，输入、流动、泡沫、材质之间的关系更容易追踪。',
  curl: '优先研究 ShoreBreak：它用独立浪唇网格表现翻卷与浪腔，并把撞击接入浅水和白沫系统。',
  swim: '优先研究 ShoreBreak：已有游泳、下潜视角、水下光学与气泡云；仍需在目标设备验证体验。',
  engineering: '两者都不能直接用于工程预测。需要经过验证的海岸模型、实测地形与边界条件，以及误差评估。'
};
document.getElementById('goal').addEventListener('change', event => {
  document.getElementById('recommendation').textContent = recommendations[event.target.value];
});
const demoButton = document.getElementById('demo-toggle');
const demoContainer = document.getElementById('demo-container');
const demoStatus = document.getElementById('demo-status');
let demoFrame = null;
demoButton.addEventListener('click', () => {
  if (demoFrame) {
    demoFrame.remove(); demoFrame = null; demoContainer.hidden = true;
    demoButton.textContent = '加载原站演示';
    demoStatus.textContent = '已停止嵌入演示。可继续阅读，或重新加载。';
    return;
  }
  const frame = document.createElement('iframe');
  frame.title = `${data.name} 上游实时演示`;
  frame.allow = 'fullscreen';
  frame.setAttribute('allowfullscreen', '');
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
  frame.src = data.demo;
  demoFrame = frame; demoContainer.hidden = false; demoContainer.replaceChildren(frame);
  demoButton.textContent = '停止演示';
  demoStatus.textContent = '已请求上游页面。首次加载会准备资源和着色器；若空白或提示无法嵌入，请使用“独立窗口打开”。';
  frame.addEventListener('load', () => {
    if (demoFrame === frame) demoStatus.textContent = '嵌入页面已返回；三维场景可能仍在预热。由于跨站限制，本页不能判断上游内部的加载进度。';
  });
});
document.getElementById('copy-commands').addEventListener('click', async () => {
  const status = document.getElementById('copy-status');
  try {
    await navigator.clipboard.writeText(document.getElementById('commands').textContent);
    status.textContent = '命令已复制。请在单独的上游目录运行，并满足上面的环境要求。';
  } catch {
    status.textContent = '此浏览器未允许复制，请直接选中上方命令复制。';
  }
});
const nav = [...document.querySelectorAll('.sidebar nav a')];
function markActive(id) {
  nav.forEach(item => {
    if (item.hash === `#${id}`) item.setAttribute('aria-current', 'location');
    else item.removeAttribute('aria-current');
  });
}
markActive(location.hash.slice(1) || 'overview');
const observer = new IntersectionObserver(entries => {
  const current = entries.filter(entry => entry.isIntersecting).sort((a,b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
  if (current) markActive(current.target.id);
}, {rootMargin:'-15% 0px -65% 0px'});
document.querySelectorAll('main > section[id]').forEach(section => observer.observe(section));
window.addEventListener('hashchange', () => markActive(location.hash.slice(1)));
