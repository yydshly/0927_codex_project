import { scenes, capabilities, directions } from './content.js';
import { initLab } from './lab.js';
import { templates, normalizePreset, serializePreset, taskNames, bandNames, energyNames, bpmRanges, storageKey } from './preset.js';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const dialog = $('#detail-dialog');
let dialogTrigger;
let currentTask = 'writing';
let currentView;
const lab = initLab();

function showView() {
  const requested = location.hash.slice(1);
  if (requested === 'main' && currentView) return;
  const view = ['overview', 'lab', 'presets', 'directions', 'sources'].includes(requested) ? requested : 'overview';
  $$('.view').forEach((section) => { section.hidden = section.id !== view; });
  $$('[data-view]').forEach((link) => {
    if (link.dataset.view === view) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  document.title = `${{ overview: '能力总览', lab: '雨夜书房实验', presets: '环境组合演示', directions: '产品扩展方向', sources: '来源与验证范围' }[view]} · Lofi Cities`;
  lab.setActive(view === 'lab');
  if (currentView && currentView !== view) { window.scrollTo(0, 0); $('#main').focus({ preventScroll: true }); }
  currentView = view;
}
window.addEventListener('hashchange', showView);
showView();

function selectScene(key) {
  const scene = scenes[key];
  $('#scene-image').src = `./assets/${key}-scene.png`;
  $('#scene-image').alt = scene.alt;
  $('#scene-title').textContent = scene.name;
  $('#scene-subtitle').textContent = scene.subtitle;
  $('#scene-index').textContent = `${scene.index} / 03`;
  $('#scene-link').href = `https://loficities.com/${key}/`;
  $$('[data-scene]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.scene === key)));
}
$$('[data-scene]').forEach((button) => button.addEventListener('click', () => selectScene(button.dataset.scene)));

function openCapability(item, trigger) {
  dialogTrigger = trigger;
  $('#dialog-content').innerHTML = `<div class="dialog-layout"><div class="dialog-image"><img src="./assets/evidence/${item.file}" alt="${item.title}的原站走查截图"></div><div class="dialog-body"><p class="eyebrow">CAPABILITY ${item.id} / ${item.layer}</p><span class="badge ${item.status}">${item.badge}</span><h2 id="dialog-title">${item.title}</h2><p>${item.summary}</p><h3>观察到的行为</h3><p>${item.observation}</p><h3>可复用的价值</h3><p>${item.value}</p><p class="dialog-note">验证边界：${item.limit}</p><a class="text-link" href="https://loficities.com/istanbul/" target="_blank" rel="noopener noreferrer">前往原站体验 ↗</a></div></div>`;
  dialog.showModal();
}
$('.close-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => { if (event.target === dialog) { const box = dialog.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close(); } });
dialog.addEventListener('close', () => { dialogTrigger?.focus(); });

function renderCapabilities(filter = 'all') {
  const items = capabilities.filter((item) => filter === 'all' || item.category === filter);
  $('#capability-grid').innerHTML = items.map((item) => `<button class="cap-card" data-capability="${item.id}" aria-label="查看${item.title}详情"><span class="cap-top"><span class="cap-id">${item.id} / ${item.layer}</span><span class="badge ${item.status}">${item.badge}</span></span><h3>${item.title}</h3><p>${item.summary}</p><span class="cap-bottom"><span>证据与价值</span><span aria-hidden="true">↗</span></span></button>`).join('');
  $('#cap-count').textContent = `${items.length} 项能力`;
  $$('[data-capability]').forEach((button) => button.addEventListener('click', () => openCapability(capabilities.find((item) => item.id === button.dataset.capability), button)));
}
$$('[data-filter]').forEach((button) => button.addEventListener('click', () => {
  $$('[data-filter]').forEach((other) => other.setAttribute('aria-pressed', String(other === button)));
  renderCapabilities(button.dataset.filter);
}));
renderCapabilities();

$('#evidence-grid').innerHTML = capabilities.map((item) => `<button class="evidence-card" data-evidence="${item.id}" aria-label="查看步骤 ${item.id}：${item.title}"><img src="./assets/evidence/${item.file}" width="578" height="871" loading="lazy" alt="${item.title}操作截图"><div><small>STEP ${item.id} · ${item.badge}</small><h3>${item.title}</h3></div></button>`).join('');
$$('[data-evidence]').forEach((button) => button.addEventListener('click', () => openCapability(capabilities.find((item) => item.id === button.dataset.evidence), button)));

function showDirection(id) {
  const direction = directions.find((item) => item.id === id);
  $$('[data-direction]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.direction === id)));
  $('#direction-detail').innerHTML = `<p class="eyebrow">PRODUCT DIRECTION / ${directions.indexOf(direction) + 1}</p><span class="badge proposal">${direction.label}</span><h2>${direction.title}</h2><p>${direction.description}</p><div class="direction-metrics"><span>主要用户<strong>${direction.who}</strong></span><span>新增复杂度<strong>${direction.effort}</strong></span></div><h3>可以继承的基础</h3><p>${direction.foundation}</p><h3>需要新增的能力</h3><ul>${direction.items.map((text) => `<li>${text}</li>`).join('')}</ul><div class="validation"><strong>首先验证一个问题</strong>${direction.validation}</div><h3>主要约束</h3><p>${direction.risk}</p><h3>建议的第一步</h3><p>${direction.next}</p>`;
}
$('#direction-list').innerHTML = directions.map((direction, index) => `<button class="direction-button" data-direction="${direction.id}" aria-pressed="${index === 0}"><span class="dir-top"><span>0${index + 1}</span><span>${direction.label}</span></span><h3>${direction.title}</h3><p>${direction.short}</p></button>`).join('');
$$('[data-direction]').forEach((button) => button.addEventListener('click', () => showDirection(button.dataset.direction)));
showDirection('workspace');

function readForm() {
  return normalizePreset({ task: currentTask, city: $('#preset-city').value, focus: Number($('#preset-focus').value), energy: $('[name=energy]:checked').value, band: $('[name=band]:checked').value, music: Number($('#mix-music').value), ambience: Number($('#mix-ambience').value) });
}
function renderPreset() {
  const preset = readForm();
  const scene = scenes[preset.city];
  $('#preset-image').src = `./assets/${preset.city}-scene.png`;
  $('#preset-image').alt = scene.alt;
  $('#preset-name').textContent = `${taskNames[preset.task]} · ${scene.name}`;
  $('#preset-summary').textContent = `${energyNames[preset.energy]} / ${bandNames[preset.band]} / 音乐 ${preset.music}% / 环境声 ${preset.ambience}%`;
  $('#focus-value').textContent = `${preset.focus} 分钟`;
  $('#break-value').textContent = `${preset.focus === 50 ? 10 : 5} 分钟`;
  $('#bpm-value').textContent = bpmRanges[preset.energy];
  $('#preset-json').textContent = JSON.stringify(serializePreset(preset), null, 2);
  $$('#preset-form output').forEach((output) => { output.textContent = `${document.getElementById(output.getAttribute('for')).value}%`; });
  $$('[data-preset]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.preset === currentTask)));
}
function applyPreset(value) {
  const preset = normalizePreset(value);
  currentTask = preset.task;
  $('#preset-city').value = preset.city;
  $('#preset-focus').value = String(preset.focus);
  $(`[name=energy][value="${preset.energy}"]`).checked = true;
  $(`[name=band][value="${preset.band}"]`).checked = true;
  $('#mix-music').value = String(preset.music);
  $('#mix-ambience').value = String(preset.ambience);
  renderPreset();
}
function markUnsaved() { $('#preset-status').textContent = '配置已修改，尚未保存。'; }
$('#preset-form').addEventListener('input', () => { renderPreset(); markUnsaved(); });
$('#preset-form').addEventListener('change', () => { renderPreset(); markUnsaved(); });
$$('[data-preset]').forEach((button) => button.addEventListener('click', () => { applyPreset(templates[button.dataset.preset]); markUnsaved(); }));
$('#reset-preset').addEventListener('click', () => { applyPreset(templates.writing); markUnsaved(); });
$('#preset-form').addEventListener('submit', (event) => {
  event.preventDefault();
  try { localStorage.setItem(storageKey, JSON.stringify(readForm())); $('#preset-status').textContent = '已保存到当前浏览器。下次打开会自动恢复。'; }
  catch { $('#preset-status').textContent = '浏览器不允许本地保存。你仍可导出配置。'; }
});
$('#export-preset').addEventListener('click', () => {
  const preset = readForm();
  const json = JSON.stringify(serializePreset(preset), null, 2);
  dialogTrigger = $('#export-preset');
  $('#dialog-content').innerHTML = '<div class="dialog-body-only"><p class="eyebrow">EXPORT CONFIGURATION</p><h2 id="dialog-title">导出环境预设</h2><p>配置已生成。可以下载 JSON，也可以直接选择并复制下面的内容。此格式是本页扩展示例，不是原站官方导入格式。</p><pre id="export-json" tabindex="0"></pre><a id="download-json" class="primary">下载 JSON 文件</a></div>';
  $('#export-json').textContent = json;
  $('#download-json').href = `data:application/json;charset=utf-8,${encodeURIComponent(json)}`;
  $('#download-json').download = `lofi-preset-${preset.task}.json`;
  dialog.showModal();
  $('#preset-status').textContent = '配置已生成，可在导出窗口下载或复制。';
});
try {
  const stored = localStorage.getItem(storageKey);
  applyPreset(stored ? JSON.parse(stored) : templates.writing);
  if (stored) $('#preset-status').textContent = '已恢复当前浏览器上次保存的配置。';
} catch { applyPreset(templates.writing); $('#preset-status').textContent = '无法读取已存配置，已使用默认写作示例。'; }
