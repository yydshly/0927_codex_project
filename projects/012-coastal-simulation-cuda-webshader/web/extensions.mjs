import { QUALITY, SEA_PRESETS, clamp, createTerrain, paintRock, initialCells, distribution, sanitizePresetName } from './extensions-core.mjs';

const $ = id => document.getElementById(id);
const canvas = $('coast');
const state = {
  device: null, context: null, compute: null, render: null, paramsBuffer: null,
  terrainBuffer: null, cells: [], computeGroups: [], renderGroups: [],
  terrain: null, terrainType: 'cove', image: null, rocks: [], quality: 'balanced',
  preset: 'moderate', amplitude: .13, frequency: 2.3, tide: .12, friction: .055,
  running: true, time: 0, source: 0, lastFrame: 0, lastMetric: 0, frameSamples: [], sampleStart: 0,
  dragging: false, lastPaint: 0, results: {}, exportUrl: null,
  active: false, started: false
};
const params = new Float32Array(16);
const savedKey = 'coastal-012-extension-presets-v1';
let saved = {};
try { saved = JSON.parse(localStorage.getItem(savedKey) || '{}') || {}; } catch { saved = {}; }

function setMessage(message) { $('stage-message').textContent = message; }
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.round(canvas.clientWidth * dpr));
  const height = Math.max(1, Math.round(canvas.clientHeight * dpr));
  if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
}
function resetMetrics() {
  state.frameSamples = [];
  state.sampleStart = performance.now();
  state.lastFrame = 0;
  $('p50').textContent = $('p95').textContent = $('fps').textContent = '—';
}
function sizeLabel() {
  const q = QUALITY[state.quality];
  $('grid-label').textContent = `${q.width} × ${q.height}`;
}
function renderComparison() {
  const body = $('comparison-body');
  body.replaceChildren();
  for (const [key, quality] of Object.entries(QUALITY)) {
    const row = document.createElement('tr');
    if (key === state.quality) row.className = 'current';
    const result = state.results[key];
    for (const value of [`${quality.label} ${quality.width}×${quality.height}`, result ? result.p50.toFixed(1) : '待测', result ? result.p95.toFixed(1) : '待测']) {
      const cell = document.createElement('td');
      cell.textContent = value;
      row.append(cell);
    }
    body.append(row);
  }
}
function destroyBuffers() {
  state.terrainBuffer?.destroy();
  for (const buffer of state.cells) buffer.destroy();
}
function makeBuffer(data, usage) {
  const buffer = state.device.createBuffer({ size: data.byteLength, usage });
  state.device.queue.writeBuffer(buffer, 0, data);
  return buffer;
}
function rebuild({ keepResults = false } = {}) {
  if (!state.device) return;
  if (!keepResults) state.results = {};
  const { width, height } = QUALITY[state.quality];
  const terrain = createTerrain(width, height, state.terrainType, state.image);
  for (const rock of state.rocks) paintRock(terrain, width, height, rock.u, rock.v, rock.radius);
  const cells = initialCells(terrain, state.tide, width, state.amplitude);
  destroyBuffers();
  const storage = GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST;
  state.terrainBuffer = makeBuffer(terrain, storage);
  state.cells = [makeBuffer(cells, storage), makeBuffer(cells, storage)];
  state.terrain = terrain;
  state.source = 0;
  state.time = 0;
  state.computeGroups = [0, 1].map(i => state.device.createBindGroup({
    layout: state.compute.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: state.paramsBuffer } },
      { binding: 1, resource: { buffer: state.terrainBuffer } },
      { binding: 2, resource: { buffer: state.cells[i] } },
      { binding: 3, resource: { buffer: state.cells[1 - i] } }
    ]
  }));
  state.renderGroups = [0, 1].map(i => state.device.createBindGroup({
    layout: state.render.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: state.paramsBuffer } },
      { binding: 1, resource: { buffer: state.terrainBuffer } },
      { binding: 2, resource: { buffer: state.cells[i] } }
    ]
  }));
  sizeLabel();
  renderComparison();
  resetMetrics();
  setMessage(`${width} × ${height} 单元已就绪；拖动画面可添加岩石。`);
}
function presetValues(preset) {
  return SEA_PRESETS[preset] || saved[preset] || SEA_PRESETS.moderate;
}
function populatePresets() {
  const select = $('preset');
  select.replaceChildren();
  for (const [key, p] of Object.entries(SEA_PRESETS)) select.add(new Option(p.label, key));
  for (const [key, p] of Object.entries(saved)) select.add(new Option(`自定义 · ${p.label}`, key));
  if (!(state.preset in SEA_PRESETS) && !(state.preset in saved)) state.preset = 'moderate';
  select.value = state.preset;
}
function applyPreset(key) {
  const value = presetValues(key);
  state.preset = key;
  state.amplitude = value.amplitude;
  state.frequency = value.frequency;
  state.tide = value.tide;
  state.friction = value.friction;
  $('amplitude').value = String(state.amplitude);
  $('tide').value = String(state.tide);
  $('amplitude-value').textContent = state.amplitude.toFixed(3);
  $('tide-value').textContent = state.tide.toFixed(3);
  rebuild();
  setMessage(`已应用「${value.label}」；入射波和潮位改变。`);
}
function paint(event) {
  if (!state.device) return;
  const rect = canvas.getBoundingClientRect();
  const u = clamp((event.clientX - rect.left) / rect.width, 0, 1);
  const v = clamp((event.clientY - rect.top) / rect.height, 0, 1);
  const last = state.rocks.at(-1);
  if (last && Math.hypot((last.u - u) * rect.width / rect.height, last.v - v) < .018) return;
  const rock = { u, v, radius: .042 };
  state.rocks.push(rock);
  const { width, height } = QUALITY[state.quality];
  paintRock(state.terrain, width, height, u, v, rock.radius);
  state.device.queue.writeBuffer(state.terrainBuffer, 0, state.terrain);
  state.results = {};
  renderComparison();
  resetMetrics();
  setMessage(`已添加 ${state.rocks.length} 处岩石；求解障碍与可见地形同步更新。`);
}
function bindControls() {
  $('terrain').addEventListener('change', event => {
    state.terrainType = event.target.value;
    state.image = null; state.rocks = [];
    $('terrain').querySelector('option[value="imported"]')?.remove();
    rebuild();
  });
  $('heightmap').addEventListener('change', async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      if (!file.type.startsWith('image/') || file.size > 8_000_000) throw new Error('请选择不超过 8 MB 的 PNG、JPG 或 WebP 图片。');
      const bitmap = await createImageBitmap(file);
      const imageCanvas = document.createElement('canvas');
      imageCanvas.width = Math.min(bitmap.width, 1024);
      imageCanvas.height = Math.min(bitmap.height, 1024);
      const context = imageCanvas.getContext('2d', { willReadFrequently: true });
      context.drawImage(bitmap, 0, 0, imageCanvas.width, imageCanvas.height);
      bitmap.close();
      state.image = { width: imageCanvas.width, height: imageCanvas.height, data: context.getImageData(0, 0, imageCanvas.width, imageCanvas.height).data };
      state.terrainType = 'imported'; state.rocks = [];
      $('terrain').querySelector('option[value="imported"]')?.remove();
      $('terrain').add(new Option(`已导入 · ${file.name.slice(0, 20)}`, 'imported'));
      $('terrain').value = 'imported';
      rebuild();
      setMessage(`已导入 ${file.name}；亮处为高地，极亮处成为固体障碍。`);
    } catch (error) { setMessage(`导入失败：${error.message}`); }
    event.target.value = '';
  });
  $('clear-rocks').addEventListener('click', () => { state.rocks = []; rebuild(); setMessage('岩石笔刷已清除，地形恢复。'); });
  $('preset').addEventListener('change', event => applyPreset(event.target.value));
  for (const key of ['amplitude', 'tide']) $(key).addEventListener('input', event => {
    state[key] = Number(event.target.value);
    $(`${key}-value`).textContent = state[key].toFixed(3);
    if (key === 'tide') rebuild();
    state.preset = '';
    $('preset').value = '';
    state.results = {};
    renderComparison();
    resetMetrics();
  });
  $('save-preset').addEventListener('click', () => {
    const name = sanitizePresetName($('preset-name').value);
    if (!name) { $('preset-hint').textContent = '请先输入预设名称。'; return; }
    const key = `saved-${Date.now()}`;
    saved[key] = { label: name, amplitude: state.amplitude, frequency: state.frequency, tide: state.tide, friction: state.friction };
    const entries = Object.entries(saved).slice(-12);
    saved = Object.fromEntries(entries);
    try { localStorage.setItem(savedKey, JSON.stringify(saved)); }
    catch { $('preset-hint').textContent = '浏览器未允许本地保存；本次会话仍可切换。'; }
    state.preset = key;
    populatePresets();
    $('preset-name').value = '';
    $('preset-hint').textContent = `已保存「${name}」，可从菜单再次选择。`;
  });
  $('quality').addEventListener('change', event => { state.quality = event.target.value; rebuild({ keepResults: true }); setMessage(`已切换${QUALITY[state.quality].label}档；帧时间样本重新收集。`); });
  $('play-toggle').addEventListener('click', () => {
    state.running = !state.running;
    $('play-toggle').textContent = state.running ? '暂停' : '继续';
    $('run-state').textContent = state.running ? '运行中' : '已暂停';
    resetMetrics();
  });
  $('reset').addEventListener('click', () => { rebuild({ keepResults: true }); setMessage('水流状态已重置，地形与当前海况保留。'); });
  $('export').addEventListener('click', () => {
    const { width, height } = QUALITY[state.quality];
    const report = {
      label: '012 independent WebGPU teaching prototype; browser frame intervals, not GPU kernel timings',
      recordedAt: new Date().toISOString(),
      browser: navigator.userAgent,
      grid: { width, height }, terrain: state.terrainType, addedRocks: state.rocks.length,
      sea: { amplitude: state.amplitude, frequency: state.frequency, tide: state.tide, friction: state.friction },
      samples: state.frameSamples.length, frameMs: distribution(state.frameSamples.map(item => item.ms)), comparison: state.results, rawFrameMs: state.frameSamples.map(item => item.ms)
    };
    if (state.exportUrl) URL.revokeObjectURL(state.exportUrl);
    state.exportUrl = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }));
    let link = document.getElementById('download-ready');
    if (!link) {
      link = document.createElement('a');
      link.id = 'download-ready'; link.className = 'download-ready';
      $('export').after(link);
    }
    link.href = state.exportUrl;
    link.download = `coastal-012-${state.quality}-${Date.now()}.json`;
    link.textContent = 'JSON 已生成 · 如果没有自动下载，点这里保存 ↗';
    link.click();
    setMessage(`已生成 ${state.frameSamples.length} 帧的 JSON 数据。`);
  });
  canvas.addEventListener('pointerdown', event => { state.dragging = true; canvas.setPointerCapture(event.pointerId); paint(event); });
  canvas.addEventListener('pointermove', event => {
    if (!state.dragging || performance.now() - state.lastPaint < 45) return;
    state.lastPaint = performance.now(); paint(event);
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) canvas.addEventListener(type, () => { state.dragging = false; });
  window.addEventListener('resize', resize);
  window.addEventListener('beforeunload', () => { if (state.exportUrl) URL.revokeObjectURL(state.exportUrl); });
  document.addEventListener('visibilitychange', () => { state.lastFrame = 0; });
}
async function loadShader(path, device) {
  const response = await fetch(new URL(path, import.meta.url));
  if (!response.ok) throw new Error(`${path} 加载失败（${response.status}）`);
  const module = device.createShaderModule({ code: await response.text() });
  const info = await module.getCompilationInfo();
  const errors = info.messages.filter(item => item.type === 'error');
  if (errors.length) throw new Error(`${path}: ${errors.map(item => item.message).join('; ')}`);
  return module;
}
function frame(now) {
  if (!state.device || !state.active) return;
  resize();
  const { width, height } = QUALITY[state.quality];
  const delta = state.lastFrame ? now - state.lastFrame : 0;
  state.lastFrame = now;
  if (state.running && delta > 0 && delta < 250) {
    state.frameSamples.push({ time: now, ms: delta });
    while (state.frameSamples.length && state.frameSamples[0].time < now - 3000) state.frameSamples.shift();
    if (now - state.lastMetric > 350 && now - state.sampleStart >= 3000) {
      const stats = distribution(state.frameSamples.map(item => item.ms));
      $('p50').textContent = stats.p50.toFixed(1);
      $('p95').textContent = stats.p95.toFixed(1);
      $('fps').textContent = (1000 / stats.mean).toFixed(0);
      state.results[state.quality] = stats;
      renderComparison();
      state.lastMetric = now;
    }
  }
  const frameSeconds = clamp(delta || 16.67, 4, 33.3) / 1000;
  const modelStep = frameSeconds / (1 / 60) * .045;
  params.set([width, height, modelStep, state.time, state.amplitude, state.frequency, state.tide, state.friction, canvas.width, canvas.height, 0, 0, 0, 0, 0, 0]);
  state.device.queue.writeBuffer(state.paramsBuffer, 0, params);
  const encoder = state.device.createCommandEncoder();
  if (state.running) {
    const pass = encoder.beginComputePass();
    pass.setPipeline(state.compute);
    pass.setBindGroup(0, state.computeGroups[state.source]);
    pass.dispatchWorkgroups(Math.ceil(width / 8), Math.ceil(height / 8));
    pass.end();
    state.source = 1 - state.source;
    state.time += frameSeconds;
  }
  const render = encoder.beginRenderPass({ colorAttachments: [{ view: state.context.getCurrentTexture().createView(), loadOp: 'clear', storeOp: 'store', clearValue: { r: .03, g: .1, b: .12, a: 1 } }] });
  render.setPipeline(state.render);
  render.setBindGroup(0, state.renderGroups[state.source]);
  render.draw(3);
  render.end();
  state.device.queue.submit([encoder.finish()]);
  if (state.active) requestAnimationFrame(frame);
}
async function start() {
  bindControls(); populatePresets(); sizeLabel(); resize();
  try {
    if (!navigator.gpu) throw new Error('此浏览器未提供 WebGPU。请使用近期版本的 Chrome 或 Edge，并通过 localhost / HTTPS 打开。');
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) throw new Error('未找到可用的 WebGPU 适配器。请检查浏览器和显卡支持。');
    const device = await adapter.requestDevice();
    state.device = device;
    device.lost.then(info => { $('gpu-error').hidden = false; $('gpu-error-detail').textContent = `GPU 设备已断开：${info.message || info.reason}`; state.device = null; });
    device.addEventListener('uncapturederror', event => { setMessage(`GPU 错误：${event.error.message}`); });
    const context = canvas.getContext('webgpu');
    if (!context) throw new Error('无法创建 WebGPU 画布。');
    context.configure({ device, format: navigator.gpu.getPreferredCanvasFormat(), alphaMode: 'opaque' });
    state.context = context;
    const [simModule, renderModule] = await Promise.all([loadShader('./extensions-sim.wgsl', device), loadShader('./extensions-render.wgsl', device)]);
    state.compute = await device.createComputePipelineAsync({ layout: 'auto', compute: { module: simModule, entryPoint: 'waterStep' } });
    state.render = await device.createRenderPipelineAsync({ layout: 'auto', vertex: { module: renderModule, entryPoint: 'fullScreen' }, fragment: { module: renderModule, entryPoint: 'shade', targets: [{ format: navigator.gpu.getPreferredCanvasFormat() }] }, primitive: { topology: 'triangle-list' } });
    state.paramsBuffer = device.createBuffer({ size: params.byteLength, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    rebuild();
    $('run-state').textContent = '运行中';
    if (state.active) requestAnimationFrame(frame);
  } catch (error) {
    $('gpu-error').hidden = false;
    $('gpu-error-detail').textContent = error.message;
    $('run-state').textContent = '不可用';
    setMessage(`启动失败：${error.message}`);
    console.error(error);
  }
}
window.coastalExtensionLab = {
  activate() {
    state.active = true;
    state.lastFrame = 0;
    if (!state.started) { state.started = true; start(); }
    else if (state.device) requestAnimationFrame(frame);
  },
  deactivate() { state.active = false; state.lastFrame = 0; }
};
