const families = {
  all: { label: '全部', symbol: '✺' },
  simulation: { label: '动态物理', symbol: '∿' },
  volume: { label: '三维与体数据', symbol: '⬡' },
  image: { label: '图像与纹理', symbol: '▧' },
  numeric: { label: '数值与信号', symbol: '∑' },
  geometry: { label: '几何与渲染', symbol: '◇' }
};

const featuredIds = ['ocean', 'fluids', 'particles', 'pathtracer', 'optical', 'marching', 'mandelbrot', 'nbody'];
const nodes = {
  featured: document.getElementById('featured'),
  grid: document.getElementById('catalog-grid'),
  filters: document.getElementById('filters'),
  search: document.getElementById('search'),
  count: document.getElementById('result-count'),
  empty: document.getElementById('empty-results'),
  stageBody: document.getElementById('stage-body'),
  placeholder: document.getElementById('stage-placeholder'),
  load: document.getElementById('load-preview'),
  stop: document.getElementById('stop-preview'),
  status: document.getElementById('viewer-status'),
  stageName: document.getElementById('stage-name'),
  stageState: document.getElementById('stage-state'),
  placeholderTitle: document.getElementById('placeholder-title'),
  family: document.getElementById('selected-family'),
  title: document.getElementById('selected-title'),
  summary: document.getElementById('selected-summary'),
  scene: document.getElementById('selected-scene'),
  when: document.getElementById('selected-when'),
  scale: document.getElementById('selected-scale'),
  proof: document.getElementById('selected-proof'),
  upstream: document.getElementById('open-upstream')
};

let items = [];
let selected = null;
let activeFamily = 'all';
let frame = null;
let loadTimer = null;
let fallback = null;

function el(tag, className, content) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content !== undefined) node.textContent = content;
  return node;
}

function updateUrl(id) {
  const url = new URL(window.location.href);
  url.searchParams.set('example', id);
  window.history.replaceState(null, '', url);
}

function proofFor(item) {
  if (item.experimental) return '实验性端口。上游记录了与原生 CUDA 的比较，同时明确当前慢于实时。';
  if (item.id === 'particles') return '上游浏览器 GPU 测试与共享缓冲区渲染样例；效果取决于本机设备。';
  return '上游样例目录标注了浏览器检查及原生 CUDA 对照；具体误差与条件请看样例说明。';
}

function clearPreview(message = '已停止演示。你可以再次加载，或在独立窗口打开上游样例。') {
  if (loadTimer) clearTimeout(loadTimer);
  loadTimer = null;
  fallback = null;
  if (frame) {
    frame.remove();
    frame = null;
  }
  nodes.stageBody.replaceChildren(nodes.placeholder);
  nodes.stop.hidden = true;
  nodes.stageState.textContent = '等待加载';
  nodes.status.textContent = message;
}

function select(item, scroll = false) {
  if (!item) return;
  if (frame) clearPreview('已切换样例。按“加载实时演示”运行新的上游页面。');
  selected = item;
  nodes.stageName.textContent = item.upstreamTitle;
  nodes.placeholderTitle.textContent = item.title;
  nodes.family.textContent = families[item.family].label + (item.experimental ? ' / 实验性' : '');
  nodes.title.textContent = item.title;
  nodes.summary.textContent = item.summary;
  nodes.scene.textContent = item.use.scene;
  nodes.when.textContent = item.use.when;
  nodes.scale.textContent = item.scale;
  nodes.proof.textContent = proofFor(item);
  nodes.upstream.href = item.url;
  updateUrl(item.id);
  if (scroll) document.getElementById('viewer').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function makeCard(item, index) {
  const card = el('article', 'catalog-card');
  card.dataset.family = item.family;
  const art = el('div', 'card-art');
  art.dataset.symbol = families[item.family].symbol;
  art.append(el('span', '', families[item.family].label.toUpperCase() + ' / 图形示意'));
  const content = el('div', 'card-content');
  const top = el('div', 'card-top');
  top.append(el('span', 'card-no', String(index + 1).padStart(2, '0') + ' / ' + item.upstreamTitle));
  if (item.experimental) top.append(el('span', 'card-flag', '实验性'));
  const use = el('div', 'card-use');
  use.append(
    el('span', 'card-use-label', '现实任务 · 本站推演'),
    el('strong', '', item.use.scene),
    el('span', 'card-use-label', '什么时候用'),
    el('p', '', item.use.when)
  );
  const details = el('details', 'card-use-details');
  details.append(el('summary', '', '输入与结果'), el('p', '', item.use.result));
  content.append(top, el('h3', '', item.title), el('span', 'card-upstream-label', '上游计算'), el('p', '', item.summary), use, details, el('div', 'card-scale', item.scale));
  const actions = el('div', 'card-actions');
  const preview = el('button', '', '在预览区打开 ↗');
  preview.type = 'button';
  preview.setAttribute('aria-label', '在预览区打开' + item.title);
  preview.addEventListener('click', () => select(item, true));
  const direct = el('a', '', '上游原页 ↗');
  direct.href = item.url;
  direct.target = '_blank';
  direct.rel = 'noopener noreferrer';
  direct.setAttribute('aria-label', '在新窗口运行' + item.title);
  actions.append(preview, direct);
  content.append(actions);
  card.append(art, content);
  return card;
}

function renderCatalog() {
  const term = nodes.search.value.trim().toLocaleLowerCase();
  const visible = items.filter(item => {
    if (activeFamily !== 'all' && item.family !== activeFamily) return false;
    return !term || [item.title, item.upstreamTitle, item.summary, item.scale, item.family, item.use.scene, item.use.when, item.use.result]
      .some(value => value.toLocaleLowerCase().includes(term));
  });
  nodes.grid.replaceChildren(...visible.map(item => makeCard(item, items.indexOf(item))));
  nodes.empty.hidden = visible.length !== 0;
  nodes.count.textContent = visible.length + ' / ' + items.length;
}

function renderFilters() {
  const keys = Object.keys(families);
  const counts = Object.fromEntries(keys.map(key => [key, key === 'all' ? items.length : items.filter(item => item.family === key).length]));
  const buttons = keys.map(key => {
    const button = el('button', '', families[key].label + ' ' + counts[key]);
    button.type = 'button';
    button.setAttribute('aria-pressed', String(key === activeFamily));
    button.addEventListener('click', () => {
      activeFamily = key;
      for (const other of nodes.filters.querySelectorAll('button')) other.setAttribute('aria-pressed', String(other === button));
      renderCatalog();
    });
    return button;
  });
  nodes.filters.replaceChildren(...buttons);
}

function renderFeatured() {
  const buttons = featuredIds.map(id => {
    const item = items.find(candidate => candidate.id === id);
    if (!item) return null;
    const button = el('button', '', families[item.family].symbol + '  ' + item.title + '  ↗');
    button.type = 'button';
    button.addEventListener('click', () => select(item, true));
    return button;
  }).filter(Boolean);
  nodes.featured.replaceChildren(...buttons);
}

nodes.load.addEventListener('click', () => {
  if (!selected || frame) return;
  const next = document.createElement('iframe');
  next.title = selected.title + ' · 上游 WebGPU 实时演示';
  next.src = selected.url;
  next.allow = 'fullscreen';
  next.setAttribute('allowfullscreen', '');
  next.referrerPolicy = 'strict-origin-when-cross-origin';
  frame = next;
  nodes.stageBody.replaceChildren(next);
  nodes.stop.hidden = false;
  nodes.stageState.textContent = '请求中';
  nodes.status.textContent = '正在请求上游页面。着色器编译和资源准备可能需要一些时间。';
  loadTimer = setTimeout(() => {
    if (frame !== next || fallback) return;
    nodes.stageState.textContent = '嵌入待确认';
    nodes.status.textContent = '页内预览长时间没有响应。原站可在独立窗口运行；这可能是跨站嵌入限制。';
    fallback = el('div', 'frame-fallback');
    fallback.append(el('strong', '', '页内预览未能确认加载'));
    fallback.append(el('p', '', '请在独立窗口运行上游样例，查看真实 GPU 画面。'));
    const direct = el('a', 'button primary', '独立窗口运行 ↗');
    direct.href = selected.url;
    direct.target = '_blank';
    direct.rel = 'noopener noreferrer';
    fallback.append(direct);
    nodes.stageBody.append(fallback);
  }, 12000);
  next.addEventListener('load', () => {
    if (frame !== next) return;
    if (loadTimer) clearTimeout(loadTimer);
    loadTimer = null;
    fallback?.remove();
    fallback = null;
    nodes.stageState.textContent = '页面已响应';
    nodes.status.textContent = '嵌入页面已响应；跨站限制使本页无法判断内部 GPU 是否运行成功。若画面空白，请点“独立窗口运行”。';
  });
  next.addEventListener('error', () => {
    if (frame !== next) return;
    if (loadTimer) clearTimeout(loadTimer);
    loadTimer = null;
    nodes.stageState.textContent = '加载失败';
    nodes.status.textContent = '嵌入加载失败。请点“独立窗口运行”查看原页。';
  });
});

nodes.stop.addEventListener('click', () => clearPreview());
nodes.search.addEventListener('input', renderCatalog);
window.addEventListener('keydown', event => {
  if (event.key !== '/' || event.altKey || event.ctrlKey || event.metaKey) return;
  const tag = document.activeElement?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;
  event.preventDefault();
  nodes.search.focus();
});

try {
  const [response, useResponse] = await Promise.all([fetch('./catalog.json'), fetch('./applications.json')]);
  if (!response.ok || !useResponse.ok) throw new Error('目录文件请求失败');
  const [data, applications] = await Promise.all([response.json(), useResponse.json()]);
  if (!Array.isArray(data.items) || data.items.length !== 50) throw new Error('样例目录数量与研究快照不一致');
  if (!Array.isArray(applications.items) || applications.items.length !== 50) throw new Error('实际用途目录数量与样例不一致');
  const useById = new Map(applications.items.map(entry => [entry.id, entry]));
  if (useById.size !== 50 || data.items.some(item => !useById.has(item.id))) throw new Error('实际用途目录缺少样例');
  items = data.items.map(item => ({ ...item, use: useById.get(item.id) }));
  renderFeatured();
  renderFilters();
  renderCatalog();
  const requested = new URL(window.location.href).searchParams.get('example');
  select(items.find(item => item.id === requested) || items.find(item => item.id === 'ocean') || items[0]);
} catch (error) {
  nodes.title.textContent = '目录加载失败';
  nodes.summary.textContent = '请通过本地服务器打开页面，或直接访问上游样例目录。';
  nodes.status.textContent = '目录不可用：' + error.message;
  nodes.count.textContent = '—';
  nodes.empty.hidden = false;
  nodes.empty.textContent = '本地目录加载失败。请检查 catalog.json 是否与页面一起发布。';
}
