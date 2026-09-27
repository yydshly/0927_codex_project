const menuButton = document.querySelector('.menu-toggle');
const sidebar = document.querySelector('.sidebar');
function closeMenu() {
  sidebar.dataset.open = 'false';
  menuButton.setAttribute('aria-expanded', 'false');
}
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  sidebar.dataset.open = String(open);
  menuButton.setAttribute('aria-expanded', String(open));
});
document.querySelectorAll('.chapter-nav a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
    closeMenu(); menuButton.focus();
  }
});
const sections = [...document.querySelectorAll('main > section')];
let scrollPending = false;
function updateChapter() {
  const threshold = window.innerWidth <= 780 ? 150 : 180;
  let active = sections[0];
  for (const section of sections) if (section.getBoundingClientRect().top <= threshold) active = section;
  for (const link of document.querySelectorAll('.chapter-nav a')) {
    if (link.hash === '#' + active.id) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
  scrollPending = false;
}
window.addEventListener('scroll', () => {
  if (!scrollPending) { scrollPending = true; requestAnimationFrame(updateChapter); }
}, { passive: true });
updateChapter();

const sceneTabs = [...document.querySelectorAll('[role="tab"]')];
function selectScene(selected, focus = false) {
  sceneTabs.forEach(tab => {
    const active = tab === selected;
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    document.getElementById(tab.getAttribute('aria-controls')).hidden = !active;
  });
  if (focus) selected.focus();
}
sceneTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectScene(tab));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % sceneTabs.length;
    if (event.key === 'ArrowLeft') next = (index - 1 + sceneTabs.length) % sceneTabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = sceneTabs.length - 1;
    if (next !== undefined) { event.preventDefault(); selectScene(sceneTabs[next], true); }
  });
});

const copyButton = document.getElementById('copy-example');
const copyStatus = document.getElementById('copy-status');
copyButton.addEventListener('click', async () => {
  const example = document.getElementById('prompt-example');
  try {
    if (!navigator.clipboard) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(example.textContent);
    copyButton.textContent = '已复制';
    copyStatus.textContent = '已复制研究记录模板，可填写观察结果和证据。';
  } catch {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(example);
    selection.removeAllRanges();
    selection.addRange(range);
    copyStatus.textContent = '自动复制不可用，已选中模板。请按 Ctrl+C（Mac 为 ⌘C）或长按复制。';
  }
});

const sourceBody = document.getElementById('source-rows');
if (window.RESEARCH_SOURCE?.files) {
  const fragment = document.createDocumentFragment();
  for (const file of window.RESEARCH_SOURCE.files) {
    const row = document.createElement('tr');
    const name = document.createElement('td');
    const link = document.createElement('a');
    link.textContent = file.path;
    link.href = file.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    name.append(link);
    const category = document.createElement('td');
    category.textContent = file.category;
    const description = document.createElement('td');
    description.textContent = file.description;
    row.append(name, category, description);
    fragment.append(row);
  }
  sourceBody.append(fragment);
} else {
  const row = document.createElement('tr');
  const cell = document.createElement('td');
  cell.colSpan = 3;
  cell.textContent = '本地清单未能加载，请使用上方固定版本链接查看源文件。';
  row.append(cell); sourceBody.append(row);
}
