import { scenes, channelNames, styles, moods, bands, storeKey, defaultSettings, normalizeSettings, normalizeStore, formatTime, newTimer, startTimer, pauseTimer, tickTimer, sleepGain, trackInfo } from './model.js';
import { createVisual } from './scenes.js';
import { sceneMotion, isPreviewVisible } from './motion.js';
import { createAudio } from './audio.js';
import { musicProfiles, sceneMusic, getProfile, profileBpm, musicTrack } from './music.js';
import { icon, hydrateIcons } from './icons.js';
import { moments, momentSettings, matchingMoment } from './moments.js';
import { initUnderstanding } from './understanding.js';

const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let raw = {}, storageOK = true;
try { raw = JSON.parse(localStorage.getItem(storeKey) || '{}'); } catch { storageOK = false; }
let store = normalizeStore(raw), settings = store.settings;
if (!raw?.settings) settings = momentSettings('reading');
if (!raw?.settings && matchMedia('(prefers-reduced-motion: reduce)').matches) settings.motion = false;
if (typeof raw?.previewMotion !== 'boolean' && matchMedia('(prefers-reduced-motion: reduce)').matches) store.previewMotion = false;
let route = '', filter = 'all', mainVisual, playing = false, busy = false, frame = 0, sceneTime = 0, lastFrame = 0, toastTimeout;
let timer = newTimer(), timerScene = settings.scene, sleepDeadline = null, saveDelay;
const dialog = $('#app-dialog'); let dialogTrigger, snapshotURL;
const compare = { left: settings.scene, right: settings.scene === 'forest' ? 'coast' : 'forest', leftStyle: 'pixel', rightStyle: 'pixel', intensity: 65, activity: 65, dynamics: true, particles: true, lighting: true, motion: settings.motion };
const compareVisuals = {};
const previews = new Map(), visualRoutes = ['space','settings','compare','explore','library'];
let lastPreviewFrame = 0, lastSceneFrame = 0;
hydrateIcons();
function toast(message, action) {
  clearTimeout(toastTimeout); $('#toast').replaceChildren(document.createTextNode(message));
  if (action) { const b = document.createElement('button'); b.className = 'text-button'; b.style.color = '#32534a'; b.textContent = action.label; b.onclick = action.run; $('#toast').append(' ', b); }
  $('#toast').hidden = false; toastTimeout = setTimeout(() => { $('#toast').hidden = true; }, 5500);
}
function persist() {
  store.settings = settings; store.environments[settings.scene] = structuredClone(settings);
  try { localStorage.setItem(storeKey, JSON.stringify(store)); storageOK = true; return true; }
  catch { storageOK = false; toast('浏览器无法保存数据，当前设置仅在这次打开期间有效。'); return false; }
}
function saveSoon() { clearTimeout(saveDelay); saveDelay = setTimeout(persist, 220); }
function timerPersist() {
  try { localStorage.setItem(`${storeKey}-timer`, JSON.stringify({ timer, scene: timerScene, sleepDeadline })); }
  catch { toast('计时仍可运行，但当前浏览器无法保存计时状态。'); }
}
try {
  const saved = JSON.parse(localStorage.getItem(`${storeKey}-timer`) || 'null');
  if (saved?.timer) {
    const t = saved.timer;
    if (Number.isFinite(t.minutes) && t.minutes >= 1 && t.minutes <= 180 && Number.isFinite(t.rest) && t.rest >= 1 && t.rest <= 30 && ['focus', 'break'].includes(t.phase)) {
      timer = { ...newTimer(t.minutes, t.rest), phase: t.phase, remaining: Math.max(0, Math.min(Number(t.remaining) || 0, (t.phase === 'focus' ? t.minutes : t.rest) * 60)), task: String(t.task || '').slice(0,80), completed: Math.max(0, Math.floor(Number(t.completed) || 0)), running: !!t.running && Number.isFinite(t.deadline), deadline: Number.isFinite(t.deadline) ? t.deadline : null };
      timerScene = scenes.some(s => s.id === saved.scene) ? saved.scene : settings.scene;
    }
    sleepDeadline = Number.isFinite(saved.sleepDeadline) && saved.sleepDeadline > Date.now() ? saved.sleepDeadline : null;
  }
} catch { /* A malformed saved timer starts a fresh session. */ }
const audio = createAudio(isPlaying => {
  playing = isPlaying; $('#play-button').innerHTML = icon(playing ? 'pause' : 'play');
  $('#play-button').setAttribute('aria-label', playing ? '暂停声音' : '播放声音'); $('#play-button').setAttribute('aria-pressed', String(playing));
  $('#audio-state').textContent = playing ? '正在播放' : '等待播放'; $('#audio-state').dataset.playing = String(playing);
  if (!playing) $('#audio-meter').value = 0;
  renderSession();
}, () => renderTrack());

async function togglePlay() {
  if (busy) return;
  if (playing) { audio.stop(); return; }
  busy = true; $('#play-button').disabled = true; $('#start-session').disabled = true;
  try { await audio.start(settings); } catch (error) { toast(`声音未能开启：${error.message}`); }
  finally { busy = false; $('#play-button').disabled = false; $('#start-session').disabled = false; }
}
function scene() { return scenes.find(s => s.id === settings.scene); }
function renderSession() {
  const local = audio.snapshot().source === 'local';
  const matched = local ? null : matchingMoment(settings);
  $('#start-session').innerHTML = `${icon(playing ? 'pause' : 'play')}<span>${playing ? '暂停，休息一下' : '开启这一刻'}</span>`;
  $('#start-session').setAttribute('aria-pressed', String(playing));
  $('#session-summary').textContent = `${local ? '我的音乐' : getProfile(settings.musicProfile).name} · ${matched ? matched.name : '我的专属搭配'}`;
  $$('[data-moment]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.moment === matched?.id)));
}
function renderMoments() {
  $('#moment-list').innerHTML = moments.map(m => `<button class="moment-card" data-moment="${m.id}" aria-label="播放${m.name}组合" aria-pressed="false"><img src="./assets/scenes/${m.scene}-v3.png" alt=""><span><strong>${m.name}</strong><small>${m.note}</small></span></button>`).join('');
}
async function chooseMoment(id) {
  const next = momentSettings(id, settings);
  if (!next) return;
  audio.useGenerated(); selectScene(next.scene, next);
  if (!playing) await togglePlay();
}
function renderTrack() {
  const info = audio.snapshot();
  $('#track-title').textContent = info.track.title;
  $('#track-detail').textContent = info.source === 'local' ? `${scene().name} · 本地音频 · 循环播放` : `${getProfile(settings.musicProfile).name} · ${profileBpm(settings.musicProfile,settings.mood)} BPM`;
  $('#next-button').setAttribute('aria-label',info.source==='local'?'从头播放':'下一首');
  $('#track-elapsed').textContent = formatTime(Math.floor(info.elapsed)); $('#track-duration').textContent = formatTime(info.track.duration);
  $('#track-progress').max = info.track.duration; $('#track-progress').value = Math.min(info.elapsed, info.track.duration); $('#audio-meter').value = info.level;
}
function settingsUI() {
  document.documentElement.style.setProperty('--accent', scene().accent);
  $$('[data-setting]').forEach(el => { el.value = settings[el.dataset.setting]; const output = $(`output[for="${el.id}"]`); if(output) output.textContent = `${Math.round(el.value)}%`; });
  $$('[data-mood]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.mood === settings.mood)));
  $$('[data-style]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.style === settings.style)));
  $('#band-select').value = settings.band; $('#particles-toggle').checked = settings.particles; $('#lighting-toggle').checked = settings.lighting;
  $('#dynamics-toggle').checked = settings.dynamics;
  $('#motion-button').innerHTML = icon(settings.motion ? 'pause' : 'play'); $('#motion-button').setAttribute('aria-label', settings.motion ? '暂停画面' : '继续画面'); $('#motion-button').setAttribute('aria-pressed', String(!settings.motion));
  $('#favorite-scene').setAttribute('aria-pressed', String(store.favorites.includes(settings.scene))); $('#favorite-scene').setAttribute('aria-label', store.favorites.includes(settings.scene) ? '取消收藏当前场景' : '收藏当前场景');
  audio.update(settings); renderTrack(); mainVisual?.draw(sceneTime, settings);
  renderMusicState();
  renderSession();
}
function renderMusicState() {
  const local = audio.snapshot().source === 'local', profile = getProfile(settings.musicProfile);
  $('#selected-music-name').textContent = local ? '我的本地音乐' : profile.name;
  $('#music-now-label').textContent = `当前选择：${local ? audio.snapshot().track.title : profile.name}`;
  $('#clear-local-music').hidden = !local;
  $('#local-music-status').textContent = local ? `正在使用：${audio.snapshot().track.title}` : '选择 MP3、WAV 或 OGG，循环播放，并与当前环境声混音。';
  $$('[data-music-profile]').forEach(b=>{const selected=!local&&b.dataset.musicProfile===profile.id;b.setAttribute('aria-pressed',String(selected));b.querySelector('.music-card-action').textContent=selected?'已选择 · 重新播放':'选择并播放';});
  $$('[data-mood]').forEach(b=>b.disabled=local);
  $('#band-select').disabled=local||['ambient','musicbox'].includes(profile.id);
}
function renderMusic() {
  $('#music-grid').innerHTML=musicProfiles.map((p,i)=>`<button class="music-card" data-music-profile="${p.id}" aria-label="选择并播放${p.name}" aria-pressed="false" style="--record-color:${p.color}"><div class="music-art music-art-${p.id}"><span class="music-number">SIDE ${String(i+1).padStart(2,'0')}</span><span class="vinyl-disc"><i></i></span><span class="music-art-caption">${p.english}</span></div><div class="music-card-body"><span class="music-bpm">${p.bpm} BPM 起</span><h2>${p.name}</h2><p>${p.subtitle}</p><p class="music-description">${p.description}</p><span class="music-card-bottom"><span class="music-card-action">选择并播放</span>${icon('play')}</span></div></button>`).join('');
  renderMusicState();
}
async function chooseMusic(id) {
  const p=getProfile(id); settings.musicProfile=p.id; settings.band=p.band; settings.mood='calm';
  audio.useGenerated(); settingsUI(); persist();
  if(!playing)await togglePlay();
}
$('#local-audio-file').onchange=async event=>{
  const input=event.target,file=input.files[0];if(!file)return;
  input.disabled=true;$('#local-music-status').textContent='正在准备你的音乐…';
  try {if(await audio.loadFile(file)){settingsUI();if(!playing)await togglePlay();toast('本地音乐已载入，可与环境声一起调节。');}}
  catch(error){toast(error.message);renderMusicState();}
  finally{input.disabled=false;input.value='';}
};
$('#clear-local-music').onclick=()=>{audio.useGenerated();settingsUI();};
function setupScene() {
  const s = scene();
  $('#scene-name').textContent = s.name; $('#scene-english').textContent = s.english; $('#scene-category').textContent = `${s.category} · ${s.tag.split(' · ')[1]}`; $('#scene-description').textContent = s.description;
  $('#scene-time-label').textContent = s.timeLabel; $('#main-canvas').setAttribute('aria-label', `${s.name}动态画面，可调节动效、亮度和画面效果`);
  $('#channel-controls').innerHTML = s.channels.map(key => `<div class="range-row"><label for="channel-${key}">${channelNames[key]}</label><input id="channel-${key}" data-channel="${key}" type="range" min="0" max="100" value="${settings.mix[key]}"><output for="channel-${key}">${settings.mix[key]}%</output></div>`).join('');
  mainVisual = createVisual($('#main-canvas'), s.id); mainVisual.draw(sceneTime, settings);
  $('#player-cover-image').src = `./assets/scenes/${s.id}-v3.png`;
  $('#scene-loading').hidden = false;
  const loadingVisual = mainVisual;
  mainVisual.ready.then(() => { if (mainVisual === loadingVisual) $('#scene-loading').hidden = true; });
  const label = {study:'窗外雨量',forest:'萤火虫',coast:'潮汐强度',train:'窗外流光',neon:'城市雨量',snow:'飘雪密度'}[s.id];
  $('label[for="intensity"]').textContent = s.id==='coast'?'远处海鸟':s.id==='train'?'窗外雨量':label;
  $('label[for="activity"]').textContent = sceneMotion[s.id].name;
  $('#scene-motion-description').textContent = sceneMotion[s.id].details.join(' · ');
  settingsUI(); updateClock();
}
function selectScene(id, custom) {
  persist(); const target = scenes.find(s => s.id === id); if (!target) return;
  settings = normalizeSettings(custom || store.environments[id] || { ...defaultSettings, scene: id, mood: target.mood, mix: target.mix });
  setupScene(); persist(); if (route === 'space') wake(); else location.hash = 'space';
}
function paintPreviews(root) {
  for(const [canvas] of previews)if(!canvas.isConnected)previews.delete(canvas);
  root.querySelectorAll('canvas[data-preview]').forEach(canvas => {
    const s = scenes.find(x => x.id === canvas.dataset.preview); const visual = createVisual(canvas, s.id);
    const state=normalizeSettings({ scene:s.id, mood:s.mood, ...store.environments[s.id], motion:store.previewMotion });
    previews.set(canvas,{visual,state});visual.draw(sceneTime,state);
  });
  previewControls();
}
function previewControls(){
  $('#preview-motion-toggle').textContent=store.previewMotion?'暂停动态预览':'播放动态预览';
  $('#preview-motion-toggle').setAttribute('aria-pressed',String(!store.previewMotion));
  $$('.card-motion').forEach(el=>el.textContent=store.previewMotion?'动态预览':'静止预览');
}
function drawPreviews(){
  if(!store.previewMotion)return;
  for(const [canvas,entry] of previews){
    if(!canvas.isConnected){previews.delete(canvas);continue;}
    if(canvas.closest('.view')?.id!==route)continue;
    if(isPreviewVisible(canvas.getBoundingClientRect(),innerWidth,innerHeight))entry.visual.draw(sceneTime,{...entry.state,motion:true});
  }
}
$('#preview-motion-toggle').onclick=()=>{store.previewMotion=!store.previewMotion;previewControls();persist();wake();};
function sceneCards(list) {
  return list.map(s => `<article class="scene-card"><button class="scene-open" data-open-scene="${s.id}" aria-label="进入${s.name}"><div class="scene-visual"><canvas data-preview="${s.id}" width="480" height="270" aria-hidden="true"></canvas><span class="card-motion">动态预览</span></div><div class="card-details"><p class="card-overline">${s.english}</p><h2>${s.name}</h2><p>${sceneMotion[s.id].details.join(" · ")}</p></div></button><span class="card-category">${s.category}</span><button class="icon-button" data-favorite="${s.id}" aria-label="${store.favorites.includes(s.id)?'取消收藏':'收藏'}${s.name}" aria-pressed="${store.favorites.includes(s.id)}">${icon('heart')}</button></article>`).join('');
}
function renderExplore() { $('#scene-grid').innerHTML = sceneCards(scenes.filter(s => filter === 'all' || s.category === filter)); paintPreviews($('#scene-grid')); }
function renderLibrary() {
  $('#saved-count').textContent = `${store.saved.length} / 30 个环境`;
  $('#saved-grid').innerHTML = store.saved.length ? store.saved.map(item => { const s = scenes.find(s => s.id === item.settings.scene); return `<article class="saved-card"><p class="eyebrow">${s.english}</p><h3>${escape(item.name)}</h3><p>${s.name} · ${styles[item.settings.style]} · ${getProfile(item.settings.musicProfile).name}</p><p>音乐 ${item.settings.music}% / 环境 ${item.settings.ambience}%</p><div class="saved-actions"><button class="button secondary" data-load="${escape(item.id)}">恢复环境 ${icon('arrow')}</button><button class="text-button" data-delete="${escape(item.id)}">移除</button></div></article>`; }).join('') : '<div class="empty-state"><h3>把舒服的感觉，留到下一次。</h3><p>在空间里调好画面与声音，再点击“保存当前环境”。</p></div>';
  const favorites = scenes.filter(s => store.favorites.includes(s.id));
  $('#favorite-grid').innerHTML = favorites.length ? sceneCards(favorites) : '<div class="empty-state"><h3>还没有收藏的空间</h3><p>在探索页点击爱心，喜欢的场景就会出现在这里。</p><a class="button secondary" href="#explore">去探索空间</a></div>';
  paintPreviews($('#favorite-grid'));
}
function toggleFavorite(id) { store.favorites = store.favorites.includes(id) ? store.favorites.filter(x => x !== id) : [...store.favorites,id]; persist(); settingsUI(); if(route==='library') renderLibrary(); if(route==='explore') renderExplore(); }
function openDialog(html) { dialogTrigger = document.activeElement; $('#dialog-body').innerHTML = html; dialog.showModal(); }
$('#close-dialog').onclick = () => dialog.close();
dialog.addEventListener('close', () => { dialogTrigger?.focus(); if(snapshotURL) { URL.revokeObjectURL(snapshotURL); snapshotURL=undefined; } });
function saveDialog() {
  if(store.saved.length>=30) { toast('已保存 30 个环境，请先移除不需要的环境。'); return; }
  openDialog(`<p class="eyebrow">SAVE THIS FEELING</p><h2 id="dialog-heading">把这个环境留住</h2><p>${scene().name} · ${styles[settings.style]} · ${getProfile(settings.musicProfile).name}。画面细节与全部混音一起保存。${audio.snapshot().source==='local'?' 本地音频文件不保存，恢复时使用所选内置背景。':''}</p><form id="save-form"><label for="environment-name">给它起个名字</label><input id="environment-name" type="text" maxlength="40" required value="${escape(scene().name+' · 我的时光')}"><div class="dialog-actions"><button class="button primary" type="submit">保存环境</button><button class="button secondary" type="button" id="save-cancel">取消</button></div></form>`);
  $('#save-cancel').onclick=()=>dialog.close();
  $('#save-form').onsubmit=event=>{event.preventDefault();const name=$('#environment-name').value.trim(); if(!name)return; store.saved.push({id:crypto.randomUUID(),name,settings:structuredClone(settings)}); const saved=persist(); dialog.close(); if(saved)toast('环境已保存，可以在“收藏”中恢复。'); if(route==='library')renderLibrary();};
  $('#environment-name').select();
}
function setupComparison() {
  for (const side of ['left','right']) {
    $(`#compare-${side}`).innerHTML = scenes.map(s=>`<option value="${s.id}">${s.name}</option>`).join(''); $(`#compare-${side}`).value=compare[side]; $(`#compare-${side}-style`).value=compare[`${side}Style`];
    compareVisuals[side]=createVisual($(`#compare-${side}-canvas`),compare[side]);
  }
  renderComparison();
}
function renderComparison() {
  const left=scenes.find(s=>s.id===compare.left),right=scenes.find(s=>s.id===compare.right);
  for(const side of ['left','right']) { const s=side==='left'?left:right; $(`#compare-${side}-description`).textContent=s.tag; $(`#compare-${side}-canvas`).setAttribute('aria-label',`${side==='left'?'左':'右'}侧：${s.name}，${styles[compare[`${side}Style`]]}效果`); }
  $('#comparison-table').innerHTML=`<table><thead><tr><th>对照项</th><th>${left.name}</th><th>${right.name}</th></tr></thead><tbody><tr><td>画面效果</td><td>${styles[compare.leftStyle]}</td><td>${styles[compare.rightStyle]}</td></tr><tr><td>环境声源</td><td>${left.channels.map(x=>channelNames[x]).join(' / ')}</td><td>${right.channels.map(x=>channelNames[x]).join(' / ')}</td></tr><tr><td>推荐音乐</td><td>${getProfile(sceneMusic[left.id]).name} · ${getProfile(sceneMusic[left.id]).bpm} BPM</td><td>${getProfile(sceneMusic[right.id]).name} · ${getProfile(sceneMusic[right.id]).bpm} BPM</td></tr><tr><td>适合此刻</td><td>${left.description}</td><td>${right.description}</td></tr></tbody></table>`;
  drawComparison();
}
function drawComparison() { for(const side of ['left','right']) compareVisuals[side]?.draw(sceneTime,{...defaultSettings,scene:compare[side],style:compare[`${side}Style`],intensity:compare.intensity,activity:compare.activity,dynamics:compare.dynamics,particles:compare.particles,lighting:compare.lighting,motion:compare.motion}); }
function frameLoop(now) {
  frame=0; if(document.hidden || !visualRoutes.includes(route))return;
  if(lastFrame)sceneTime+=Math.min((now-lastFrame)/1000,.1); lastFrame=now;
  if(now-lastSceneFrame>=32){
    if(['space','settings'].includes(route)&&settings.motion)mainVisual.draw(sceneTime,settings);
    if(route==='compare'&&compare.motion)drawComparison();lastSceneFrame=now;
  }
  if(now-lastPreviewFrame>=65){drawPreviews();lastPreviewFrame=now;}
  frame=requestAnimationFrame(frameLoop);
}
function wake(){if(!frame&&!document.hidden&&visualRoutes.includes(route)){lastFrame=0;frame=requestAnimationFrame(frameLoop);}}
function showRoute(){
  const next=location.hash.slice(1); if(next==='main-content')return;
  const valid=['space','settings','explore','music','compare','library','focus','understanding']; const requested=valid.includes(next)?next:'space';
  if(route===requested)return;
  document.body.classList.remove('immersive'); route=requested;
  document.body.dataset.route = route;
  $$('.view').forEach(el=>el.hidden=el.id!=='space'&&el.id!==route); $$('a[data-route]').forEach(el=>el.dataset.route===route?el.setAttribute('aria-current','page'):el.removeAttribute('aria-current'));
  $('#close-panel').hidden = route === 'space';
  const labels={space:'我的空间',settings:'环境调节',explore:'探索空间',music:'音乐背景',compare:'场景对比',library:'我的收藏',focus:'专注时光',understanding:'产品理解'}; $('#route-label').textContent=labels[route]; document.title=`${labels[route]} · 栖间`;
  if(route==='music')renderMusic();
  if(route==='explore')renderExplore(); if(route==='library')renderLibrary(); if(route==='compare')setupComparison(); if(route==='focus')renderSessions();
  cancelAnimationFrame(frame);frame=0;wake();$(`#${route}`).scrollTop=0;$('#main-content').focus({preventScroll:true});
}
function updateClock(){const now=new Date();$('#local-clock').textContent=now.toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',hour12:false});$('#scene-clock').textContent=now.toLocaleTimeString('zh-CN',{timeZone:scene().clock,hour:'2-digit',minute:'2-digit',hour12:false});}
function renderTimer(){
  const focus=timer.phase==='focus';$('#timer-digits').textContent=formatTime(timer.remaining);$('#timer-phase').textContent=focus?'专注时间':'休息时间';$('#timer-round').textContent=`已完成 ${timer.completed} 轮`;
  $('#mini-timer').textContent=`${focus?'专注':'休息'} ${formatTime(timer.remaining)}${timer.running?' · 进行中':''}`;
  $('#mini-timer').dataset.running = String(timer.running);
  $('#timer-start').textContent=timer.running?'暂停计时':`开始${focus?'专注':'休息'}`;$('#timer-skip').textContent=focus?'切换到休息':'切换到专注';
  $$('[data-duration]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.duration)===timer.minutes)));
  $('#quick-focus small').textContent=`${timer.minutes} 分钟，只做一件事`;
}
function renderSessions(){
  const today=new Date().toLocaleDateString(),rows=[...store.sessions].reverse();const todays=rows.filter(s=>new Date(s.finished).toLocaleDateString()===today);
  $('#today-minutes').textContent=String(todays.reduce((sum,s)=>sum+s.minutes,0));$('#today-count').textContent=String(todays.length);
  $('#session-list').innerHTML=rows.length?rows.slice(0,20).map(s=>`<div class="session-row"><div>${escape(s.task||'专注时光')}</div><span>${scenes.find(x=>x.id===s.scene)?.name||'安静空间'}</span><strong>${s.minutes} 分钟</strong><span>${new Date(s.finished).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false})}</span></div>`).join(''):'<div class="empty-state"><h3>你的第一段专注，从现在开始。</h3><p>完成一次计时后，记录会出现在这里。</p></div>';
}
function tick(){
  const now=Date.now(),result=tickTimer(timer,now); const completedPhase=timer.running&&!result.timer.running;timer=result.timer;
  if(result.completed){store.sessions.push({...result.completed,scene:timerScene});store.sessions=store.sessions.slice(-365);persist();renderSessions();toast('这段专注完成了。伸个懒腰，再开始休息。');}
  else if(completedPhase)toast('休息结束。准备好后，再开始下一段专注。');
  if(completedPhase)timerPersist();renderTimer();
  if(sleepDeadline){const remaining=(sleepDeadline-now)/1000;audio.setFade(sleepGain(sleepDeadline,now));if(remaining<=0){audio.stop();sleepDeadline=null;audio.setFade(1);timerPersist();toast('睡眠定时已结束，声音已停止。');} }
  $('#sleep-status').textContent=sleepDeadline?`还剩 ${formatTime((sleepDeadline-now)/1000)}${sleepDeadline-now<=30000?' · 正在渐弱':''}`:'尚未设置';$('#sleep-start').textContent=sleepDeadline?'取消睡眠定时':'设置睡眠定时';
  renderTrack();updateClock();
}
function chooseDuration(minutes){if(!Number.isFinite(minutes)||minutes<1||minutes>180){toast('请输入 1–180 分钟。');return;}const task=timer.task,completed=timer.completed;timer={...newTimer(Math.round(minutes),minutes>=50?10:5),task,completed};$('#custom-duration').value=timer.minutes;renderTimer();timerPersist();}
$('#task-input').value=timer.task;$('#custom-duration').value=timer.minutes;
$('#task-input').addEventListener('input',()=>{timer.task=$('#task-input').value;timerPersist();});
$('#timer-start').onclick=()=>{if(timer.running)timer=pauseTimer(timer,Date.now());else {timer=startTimer(timer,Date.now());if(timer.phase==='focus')timerScene=settings.scene;}renderTimer();timerPersist();};
$('#timer-reset').onclick=()=>{timer={...timer,running:false,deadline:null,remaining:(timer.phase==='focus'?timer.minutes:timer.rest)*60};renderTimer();timerPersist();};
$('#timer-skip').onclick=()=>{timer={...timer,phase:timer.phase==='focus'?'break':'focus',running:false,deadline:null};timer.remaining=(timer.phase==='focus'?timer.minutes:timer.rest)*60;renderTimer();timerPersist();toast('已切换阶段；跳过的专注不计入记录。');};
$$('[data-duration]').forEach(b=>b.onclick=()=>chooseDuration(Number(b.dataset.duration)));$('#apply-duration').onclick=()=>chooseDuration(Number($('#custom-duration').value));
$('#sleep-start').onclick=()=>{sleepDeadline=sleepDeadline?null:Date.now()+Number($('#sleep-select').value)*60000;audio.setFade(1);timerPersist();tick();if(sleepDeadline&&!playing)toast('定时已设置。点击底部播放按钮即可开启声音。');};
$('#mini-timer').onclick=()=>{location.hash='focus';};
$('#quick-focus').onclick=()=>{location.hash='focus';if(!timer.running){if(timer.phase==='break')timer={...timer,phase:'focus',remaining:timer.minutes*60};timer=startTimer(timer,Date.now());timerScene=settings.scene;timerPersist();renderTimer();}if(!playing)void togglePlay();};
$$('[data-setting]').forEach(el=>el.addEventListener('input',()=>{settings[el.dataset.setting]=Number(el.value);settingsUI();saveSoon();}));
$('#channel-controls').addEventListener('input',event=>{const el=event.target;if(!el.dataset.channel)return;settings.mix[el.dataset.channel]=Number(el.value);$(`output[for="${el.id}"]`).textContent=`${el.value}%`;audio.update(settings);renderSession();saveSoon();});
$$('[data-mood]').forEach(b=>b.onclick=()=>{settings.mood=b.dataset.mood;settingsUI();persist();});
$$('[data-style]').forEach(b=>b.onclick=()=>{settings.style=b.dataset.style;settingsUI();persist();});
$('#band-select').onchange=()=>{settings.band=$('#band-select').value;settingsUI();persist();};
for(const [id,key]of [['dynamics-toggle','dynamics'],['particles-toggle','particles'],['lighting-toggle','lighting']])$(`#${id}`).onchange=()=>{settings[key]=$(`#${id}`).checked;settingsUI();persist();};
$('#motion-button').onclick=()=>{settings.motion=!settings.motion;settingsUI();persist();};
$('#reset-scene').onclick=()=>{settings=normalizeSettings({...defaultSettings,scene:scene().id,mood:'calm',musicProfile:sceneMusic[scene().id],band:getProfile(sceneMusic[scene().id]).band,mix:scene().mix,master:settings.master});setupScene();persist();toast('当前场景已恢复推荐配置。');};
$('#favorite-scene').onclick=()=>toggleFavorite(settings.scene);
$('#save-environment').onclick=saveDialog;$('#library-save').onclick=saveDialog;$('#play-button').onclick=togglePlay;$('#next-button').onclick=()=>audio.next();
$('#start-session').onclick=togglePlay;
document.addEventListener('click',event=>{
  const moment=event.target.closest('[data-moment]');if(moment)void chooseMoment(moment.dataset.moment);
  const musicChoice=event.target.closest('[data-music-profile]');if(musicChoice)void chooseMusic(musicChoice.dataset.musicProfile);
  const open=event.target.closest('[data-open-scene]');if(open)selectScene(open.dataset.openScene);
  const favorite=event.target.closest('[data-favorite]');if(favorite)toggleFavorite(favorite.dataset.favorite);
  const load=event.target.closest('[data-load]');if(load){const item=store.saved.find(s=>s.id===load.dataset.load);if(item){audio.useGenerated();selectScene(item.settings.scene,structuredClone(item.settings));toast(`已恢复“${item.name}”。`);}}
  const remove=event.target.closest('[data-delete]');if(remove){const item=store.saved.find(s=>s.id===remove.dataset.delete);store.saved=store.saved.filter(s=>s.id!==remove.dataset.delete);persist();renderLibrary();toast('环境已移除。',{label:'撤销',run:()=>{if(item&&!store.saved.some(s=>s.id===item.id)){store.saved.push(item);persist();renderLibrary();toast('已恢复环境。');}}});}
});
$$('[data-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;$$('[data-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));renderExplore();});
for(const side of ['left','right']){
  $(`#compare-${side}`).onchange=()=>{compare[side]=$(`#compare-${side}`).value;compareVisuals[side]=createVisual($(`#compare-${side}-canvas`),compare[side]);renderComparison();};
  $(`#compare-${side}-style`).onchange=()=>{compare[`${side}Style`]=$(`#compare-${side}-style`).value;renderComparison();};
  $(`#use-${side}`).onclick=()=>selectScene(compare[side],normalizeSettings({...store.environments[compare[side]],scene:compare[side],style:compare[`${side}Style`],intensity:compare.intensity,activity:compare.activity,dynamics:compare.dynamics,particles:compare.particles,lighting:compare.lighting,motion:compare.motion}));
}
$('#compare-intensity').oninput=()=>{compare.intensity=Number($('#compare-intensity').value);$('output[for="compare-intensity"]').textContent=`${compare.intensity}%`;drawComparison();};
$('#compare-activity').oninput=()=>{compare.activity=Number($('#compare-activity').value);$('output[for="compare-activity"]').textContent=`${compare.activity}%`;drawComparison();};
$('#compare-dynamics').onchange=()=>{compare.dynamics=$('#compare-dynamics').checked;drawComparison();};
$('#compare-particles').onchange=()=>{compare.particles=$('#compare-particles').checked;drawComparison();};$('#compare-lighting').onchange=()=>{compare.lighting=$('#compare-lighting').checked;drawComparison();};
$('#compare-motion').onclick=()=>{compare.motion=!compare.motion;$('#compare-motion').textContent=compare.motion?'暂停两侧画面':'继续两侧画面';$('#compare-motion').setAttribute('aria-pressed',String(!compare.motion));};
$('#queue-button').onclick=()=>{
  const info=audio.snapshot();
  if(info.source==='local'){openDialog('<p class="eyebrow">YOUR MUSIC</p><h2 id="dialog-heading">正在循环你的本地音乐</h2><p>播放完毕后自动从头开始。可以在音乐栏目换一个文件，或切换到内置音乐。</p><button class="button primary" id="open-music-library">选择音乐背景</button>');$('#open-music-library').onclick=()=>{dialog.close();location.hash='music';};return;}
  openDialog('<p class="eyebrow">UP NEXT</p><h2 id="dialog-heading">'+getProfile(settings.musicProfile).name+' · 接下来播放</h2><p>每段结束后自动继续，保持当前配器和速度。</p>'+Array.from({length:4},(_,i)=>musicTrack(settings.musicProfile,info.track.index+i+1)).map(t=>'<button class="queue-row" data-cue="'+t.index+'"><span>'+t.title+'<small>'+getProfile(t.key).subtitle+' · '+profileBpm(settings.musicProfile,settings.mood)+' BPM · '+formatTime(t.duration)+'</small></span>'+icon('play')+'</button>').join(''));
  $$('[data-cue]').forEach(b=>b.onclick=()=>{audio.cue(Number(b.dataset.cue));dialog.close();if(!playing)void togglePlay();});
};
function toggleImmersive() { if(route!=='space')return;document.body.classList.toggle('immersive');if(document.body.classList.contains('immersive'))$('#exit-immersive').focus({preventScroll:true}); }
$('#immersive-button').onclick=toggleImmersive;
$('#exit-immersive').onclick=async()=>{document.body.classList.remove('immersive');if(document.fullscreenElement)await document.exitFullscreen();};
$('#fullscreen-button').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('#stage').requestFullscreen();}catch{document.body.classList.add('immersive');toast('浏览器未允许全屏，已进入沉浸模式。');}};
$('#snapshot-button').onclick=()=>{
  const output=document.createElement('canvas');output.width=1920;output.height=1080;const ctx=output.getContext('2d');ctx.imageSmoothingEnabled=settings.style!=='pixel';ctx.filter=settings.style==='mono'?'grayscale(1) contrast(1.08)':settings.style==='glow'?'saturate(.72) sepia(.14) brightness(1.1)':'none';ctx.drawImage($('#main-canvas'),0,0,1920,1080);
  output.toBlob(blob=>{if(!blob){toast('无法生成图片，请重试。');return;}snapshotURL=URL.createObjectURL(blob);openDialog(`<p class="eyebrow">TAKE A LITTLE QUIET WITH YOU</p><h2 id="dialog-heading">留住这一刻</h2><p>${scene().name} · ${styles[settings.style]} · 1920 × 1080 PNG</p><img class="snapshot-preview" src="${snapshotURL}" alt="${scene().name}导出预览"><a class="button primary" href="${snapshotURL}" download="quiet-${settings.scene}-${Date.now()}.png">下载场景图片</a>`);},'image/png');
};
$('#about-button').onclick=()=>openDialog('<p class="eyebrow">QUIET SPACES / 3.0</p><h2 id="dialog-heading">栖间，给自己一段安静。</h2><p>六个动态空间与六套完整氛围，一键开启画面、音乐和环境声。你也可以单独选择音乐、调节天气和混音，把喜欢的搭配保存下来。场景时钟展示参考时区，画面保持各自的艺术设定，不随真实天气变化。</p><div class="about-features"><span>六个可调场景</span><span>并排场景比较</span><span>独立环境混音</span><span>六种音乐与本地音频</span><span>专注和休息</span><span>睡眠渐弱停播</span><span>保存和恢复环境</span><span>全屏与图片导出</span></div><p>快捷键：空格播放 / 暂停声音，N 下一首，F 沉浸模式，Esc 退出沉浸。输入文字时快捷键不触发。</p><p>设置保存在当前浏览器；此版本没有账号、云同步、多人房间或离线安装。场景原画由 ImageGen 生成；音乐和环境声为程序合成，也支持选择本地音频。柔光与黑白属于画面处理效果。</p>');
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!dialog.open){document.body.classList.remove('immersive');if(document.fullscreenElement)void document.exitFullscreen().catch(()=>{});if(route!=='space')location.hash='space';}if(dialog.open||event.target.closest('input,textarea,select,button,a,[contenteditable]'))return;if(event.code==='Space'){event.preventDefault();void togglePlay();}if(event.key.toLowerCase()==='n')audio.next();if(event.key.toLowerCase()==='f')toggleImmersive();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;lastFrame=0;persist();timerPersist();}else{tick();wake();}});
window.addEventListener('pagehide',()=>{clearTimeout(saveDelay);persist();timerPersist();audio.stop();cancelAnimationFrame(frame);frame=0;});
window.addEventListener('hashchange',showRoute);
initUnderstanding($('#understanding'), chooseMoment);hydrateIcons($('#understanding'));
renderMoments();setupScene();showRoute();tick();setInterval(tick,500);if(!storageOK)toast('当前浏览器的数据保存不可用。');
