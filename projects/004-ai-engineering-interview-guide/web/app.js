import source from './source-data.js';
import { catalog, answerNotes, questionTitles } from './question-data.js';
import { modules, groups, routes, companyGroups, topicLabels } from './content.js';

const paths = {
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5"/>',
  cpu: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 1v5m6-5v5M9 18v5m6-5v5M1 9h5m-5 6h5m12-6h5m-5 6h5"/><rect x="10" y="10" width="4" height="4"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5M8 8h5m-5 4h3"/>',
  nodes: '<rect x="9" y="2" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="16" y="16" width="6" height="6" rx="1"/><path d="M12 8v4H5v4m7-4h7v4"/>',
  tune: '<path d="M4 6h5m4 0h7M4 12h9m4 0h3M4 18h3m4 0h9"/><circle cx="11" cy="6" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="9" cy="18" r="2"/>',
  chart: '<path d="M4 3v18h17M8 16v-5m5 5V6m5 10v-7"/>',
  shield: '<path d="m12 2 8 3v7c0 5-8 10-8 10S4 17 4 12V5l8-3Z"/><path d="m8 12 3 3 5-6"/>',
  wave: '<path d="M3 10v4m4-8v12m5-16v20m5-16v12m4-8v4"/>',
  layout: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 9v12"/>',
  code: '<path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-14-2 16"/>'
};
export const icon = (name) => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.layers}</svg>`;
const esc = (text) => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl = url => /^https?:\/\//i.test(url) ? esc(url) : '#';
const details = id => modules.find(m => m.id === id);
const commonGroup = 'Common Questions Asked Across Companies';
const sectionNames = catalog.sections.filter(section => section.group === commonGroup).map(section => section.name);
const questionScope = { value: 'common', section: '', query: '', status: 'all', visible: 20 };
const moduleExamples = {
  architecture: ['q-001', 'q-002'], inference: ['q-017', 'q-025'],
  rag: ['q-032', 'q-035'], agents: ['q-044', 'q-052'],
  training: ['q-059', 'q-063'], evaluation: ['q-068', 'q-071'],
  safety: ['q-078', 'q-083'], multimodal: ['q-090', 'q-091'],
  systems: ['q-098', 'q-100'], coding: ['q-108', 'q-113']
};

function renderQuestion(question, expanded = false) {
  const note = answerNotes.notes[question.id];
  const questionZh = questionTitles[question.id];
  const links = question.answer_links;
  const context = question.group === commonGroup ? `${topicLabels[question.section] || question.section} / ${question.section}` : `${question.section} · ${topicLabels[question.topic] || question.topic}`;
  return `<details class="question-item" ${expanded ? 'open' : ''}><summary><span class="question-number">${esc(question.id.toUpperCase())}</span><span class="question-main"><span class="question-context">${esc(context)}</span>${questionZh ? `<strong>${esc(questionZh)}</strong><span class="question-original" lang="en">${esc(question.question)}</span>` : `<strong lang="en">${esc(question.question)}</strong>`}<span class="question-badges">${note ? '<em class="badge-note">本站答题要点</em>' : ''}${links.length ? `<em class="badge-link">${links.length} 条仓库参考链接</em>` : '<em>仓库无答案链接</em>'}</span></span><span class="question-plus" aria-hidden="true">＋</span></summary><div class="question-answer">${note ? `<div class="answer-note"><span>本站整理的答题要点</span><p>${esc(note.text)}</p></div>` : '<p class="answer-empty">本站暂未为这道题编写答题要点。</p>'}${links.length ? `<div class="answer-sources"><h4>仓库提供的答案参考</h4><ul>${links.map(link => `<li><a href="${safeUrl(link.url)}" target="_blank" rel="noopener noreferrer">${esc(link.title)} ↗</a></li>`).join('')}</ul><small>这些是外部资料链接，不等于经核验的标准答案。</small></div>` : '<p class="answer-missing">上游仓库尚未为此题提供答案链接。</p>'}${note?.references?.length ? `<div class="note-references"><span>答题要点参考</span> ${note.references.map(ref => `<a href="${safeUrl(ref.url)}" target="_blank" rel="noopener noreferrer">${esc(ref.title)} ↗</a>`).join(' · ')}</div>` : ''}<div class="question-origin"><a href="${safeUrl(question.source_url)}" target="_blank" rel="noopener noreferrer">查看仓库原题 ↗</a>${question.asked_at?.length ? `<span>提及公司：${question.asked_at.map(item => esc(item.name)).join(' · ')}</span>` : ''}</div></div></details>`;
}

const sectionSelect = document.querySelector('#question-section');
function fillQuestionSections() {
  const names = questionScope.value === 'common' ? sectionNames : catalog.sections.filter(section => section.group !== commonGroup).map(section => section.name);
  sectionSelect.innerHTML = `<option value="">${questionScope.value === 'common' ? '全部 10 个主题' : '全部 35 个公司章节'}</option>${names.map(name => `<option value="${esc(name)}">${esc(questionScope.value === 'common' ? `${topicLabels[name] || name} / ${name}` : name)}</option>`).join('')}`;
  sectionSelect.value = questionScope.section;
}
function filteredQuestions() {
  const query = questionScope.query.trim().toLocaleLowerCase();
  return catalog.questions.filter(question => {
    if ((question.group === commonGroup) !== (questionScope.value === 'common')) return false;
    if (questionScope.section && question.section !== questionScope.section) return false;
    if (questionScope.status === 'note' && !answerNotes.notes[question.id]) return false;
    if (questionScope.status === 'link' && !question.answer_links.length) return false;
    if (questionScope.status === 'none' && question.answer_links.length) return false;
    if (query && !`${question.question} ${questionTitles[question.id] || ''} ${question.section} ${topicLabels[question.section] || ''} ${question.topic} ${topicLabels[question.topic] || ''} ${question.group} ${answerNotes.notes[question.id]?.text || ''}`.toLocaleLowerCase().includes(query)) return false;
    return true;
  });
}
function renderQuestionResults() {
  const matches = filteredQuestions();
  const shown = matches.slice(0, questionScope.visible);
  const companyContext = document.querySelector('#company-context');
  const company = questionScope.value === 'company' && questionScope.section ? catalog.sections.find(section => section.group !== commonGroup && section.name === questionScope.section) : null;
  companyContext.hidden = !company;
  companyContext.innerHTML = company ? `<strong>${esc(company.name)} · 仓库章节说明</strong><p><b>涉及岗位：</b>${esc(company.roles)}</p><details><summary>查看仓库整理的面试流程</summary><p>${esc(company.interview_loop)}</p></details>` : '';
  document.querySelector('#question-results-summary').textContent = `找到 ${matches.length} 道题，当前显示 ${shown.length} 道`;
  document.querySelector('#question-results').innerHTML = shown.length ? shown.map((question, index) => renderQuestion(question, index === 0 && !questionScope.query)).join('') : '<div class="question-empty">没有匹配的题目。试试其他关键词或筛选条件。</div>';
  document.querySelector('#question-more').hidden = shown.length >= matches.length;
}
fillQuestionSections();
renderQuestionResults();
document.querySelectorAll('[data-question-scope]').forEach(button => button.addEventListener('click', () => {
  questionScope.value = button.dataset.questionScope;
  questionScope.section = '';
  questionScope.visible = 20;
  document.querySelectorAll('[data-question-scope]').forEach(tab => { const active = tab === button; tab.classList.toggle('active', active); tab.setAttribute('aria-pressed', String(active)); });
  fillQuestionSections();
  renderQuestionResults();
}));
sectionSelect.addEventListener('change', () => { questionScope.section = sectionSelect.value; questionScope.visible = 20; renderQuestionResults(); });
document.querySelector('#question-search').addEventListener('input', event => { questionScope.query = event.target.value; questionScope.visible = 20; renderQuestionResults(); });
document.querySelector('#question-status').addEventListener('change', event => { questionScope.status = event.target.value; questionScope.visible = 20; renderQuestionResults(); });
document.querySelector('#question-more').addEventListener('click', () => { questionScope.visible += 20; renderQuestionResults(); });

document.querySelector('#module-groups').innerHTML = groups.map(group => `<div class="module-group"><div class="group-label"><span>${group.number}</span><h3>${group.name}</h3><p>${group.description}</p></div><div class="module-grid">${group.modules.map(id => {
  const module = details(id), stats = source.sections[module.index];
  return `<button type="button" class="module-card" data-module="${id}" aria-haspopup="dialog"><div class="card-top"><span class="module-icon">${icon(module.icon)}</span><span class="module-number">${module.number}</span></div><h4>${module.title}</h4><p>${module.summary}</p><div class="card-examples"><span>这个模块会问</span><ul>${moduleExamples[id].map(questionId => `<li>${esc(questionTitles[questionId])}</li>`).join('')}</ul></div><div class="card-bottom"><span>${stats.question_entries} 条通用题 <i>·</i> ${stats.entries_with_answer_links} 条附答案</span><span class="card-arrow" aria-hidden="true">↗</span></div></button>`;
}).join('')}</div></div>`).join('');

const dialog = document.querySelector('#module-dialog');
function openModule(id) {
  const module = details(id);
  if (!module) return;
  const stats = source.sections[module.index];
  const questions = catalog.questions.filter(question => question.group === commonGroup && question.section === stats.name);
  document.querySelector('#dialog-content').innerHTML = `<div class="detail-header"><span class="module-icon">${icon(module.icon)}</span><p class="eyebrow">MODULE ${module.number} / ${module.english}</p><h2 id="dialog-title">${module.title}</h2><p>${module.why}</p><div class="detail-meta">${stats.question_entries} 条通用题 <span>·</span> ${stats.entries_with_answer_links} 条附答案链接</div></div><div class="detail-body"><section><h3>本模块原题与答案入口</h3><div class="dialog-questions">${questions.map((question, index) => renderQuestion(question, index === 0)).join('')}</div></section><section><h3>这个模块讲什么</h3><dl>${module.concepts.map(([term,def]) => `<div><dt>${term}</dt><dd>${def}</dd></div>`).join('')}</dl></section><section><h3>建议怎么读</h3><ol class="reading-steps">${module.steps.map(step => `<li>${step}</li>`).join('')}</ol><div class="prerequisite"><strong>先备知识</strong><p>${module.prerequisite}</p></div></section><section class="outcome"><h3>读完后，尝试做到</h3><p>${module.outcome}</p></section><div class="detail-action"><p>导读与学习目标为本页整理建议。</p><a class="primary-link" href="${stats.source_url}" target="_blank" rel="noopener noreferrer">阅读上游章节 <span aria-hidden="true">↗</span></a></div></div>`;
  dialog.showModal();
  dialog.scrollTop = 0;
  document.body.classList.add('dialog-open');
}
document.addEventListener('click', event => {
  const trigger = event.target.closest('[data-module]');
  if (trigger) openModule(trigger.dataset.module);
});
document.querySelector('.close-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => document.body.classList.remove('dialog-open'));
dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if(event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });

document.querySelector('#route-tabs').innerHTML = routes.map((route, i) => `<button type="button" id="route-tab-${route.id}" role="tab" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" aria-controls="route-panel" data-route="${route.id}">${route.name}</button>`).join('');
function selectRoute(id, moveFocus = false) {
  const route = routes.find(r => r.id === id);
  if (!route) return;
  document.querySelectorAll('[data-route]').forEach(button => {
    const active = button.dataset.route === id;
    button.setAttribute('aria-selected', String(active));
    button.tabIndex = active ? 0 : -1;
    if(active && moveFocus) button.focus();
  });
  const panel = document.querySelector('#route-panel');
  panel.setAttribute('aria-labelledby', `route-tab-${id}`);
  panel.innerHTML = `<div class="route-intro"><span class="route-kicker">建议阅读顺序</span><h3>${route.heading}</h3><p>${route.description}</p></div><ol class="route-steps" style="--step-count:${route.modules.length}">${route.modules.map((id, i) => `<li><button type="button" data-module="${id}" aria-haspopup="dialog"><span class="route-step-number">${String(i+1).padStart(2,'0')}</span><strong>${details(id).title}</strong><small>${route.reasons[i]}</small></button></li>`).join('')}</ol><div class="route-result"><span>用一个成果检验理解</span><p>${route.outcome}</p></div>`;
}
selectRoute(routes[0].id);
document.querySelector('#route-tabs').addEventListener('click', event => { const button = event.target.closest('[data-route]'); if(button) selectRoute(button.dataset.route); });
document.querySelector('#route-tabs').addEventListener('keydown', event => {
  const current = routes.findIndex(route => route.id === event.target.dataset.route);
  if(current < 0) return;
  let next;
  if(event.key === 'ArrowRight') next = (current + 1) % routes.length;
  if(event.key === 'ArrowLeft') next = (current + routes.length - 1) % routes.length;
  if(event.key === 'Home') next = 0;
  if(event.key === 'End') next = routes.length - 1;
  if(next !== undefined) { event.preventDefault(); selectRoute(routes[next].id, true); }
});

document.querySelector('#company-groups').innerHTML = companyGroups.map((group, i) => {
  const companies = source.sections.filter(section => section.group === group.name);
  return `<details class="company-group" ${i === 0 ? 'open' : ''}><summary><span class="company-group-number">${group.number}</span><span class="company-group-title"><strong>${group.title}</strong><small>${group.description}</small></span><span class="company-group-count">${companies.length} 个章节</span><span class="expand-icon" aria-hidden="true">＋</span></summary><div class="company-list">${companies.map(company => {
    const combined = company.name.startsWith('Consumer-Scale');
    return `<button type="button" class="company-item" data-company="${esc(company.name)}"><div><h3>${combined ? '消费互联网公司（合并章节）' : esc(company.name)} <span aria-hidden="true">↗</span></h3><p>${combined ? 'Uber · Netflix · LinkedIn · Airbnb · Pinterest · Spotify' : company.topics.map(topic => topicLabels[topic] || esc(topic)).join(' · ')}</p></div><span class="company-question-count"><b>${company.question_entries}</b> 条专项题<small>${company.entries_with_answer_links} 条附答案</small></span></button>`;
  }).join('')}</div></details>`;
}).join('');
document.querySelector('#company-groups').addEventListener('click', event => {
  const company = event.target.closest('[data-company]');
  if (!company) return;
  questionScope.value = 'company';
  questionScope.section = company.dataset.company;
  questionScope.query = '';
  questionScope.status = 'all';
  questionScope.visible = 20;
  document.querySelector('#question-search').value = '';
  document.querySelector('#question-status').value = 'all';
  document.querySelectorAll('[data-question-scope]').forEach(tab => { const active = tab.dataset.questionScope === 'company'; tab.classList.toggle('active', active); tab.setAttribute('aria-pressed', String(active)); });
  fillQuestionSections();
  renderQuestionResults();
  document.querySelector('#questions').scrollIntoView();
});
document.querySelector('#source-repo').href = source.repository;
document.querySelector('#source-commit').href = `${source.repository}/commit/${source.commit}`;

const observer = new IntersectionObserver(entries => {
  for (const entry of entries) if (entry.isIntersecting) document.querySelectorAll('.side-nav a').forEach(link => {
    const active = link.hash === `#${entry.target.id}`;
    link.classList.toggle('active', active);
    if(active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
  });
}, { rootMargin: '-15% 0px -65% 0px' });
document.querySelectorAll('.page-section').forEach(section => observer.observe(section));
