import {labs,scenes,defaults,sanitize} from './catalog.mjs';
import {makeModel} from './models.mjs';
import {runChecks} from './checks.mjs';
import {render,chart} from './render.mjs';
const $=id=>document.getElementById(id), escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const query=new URLSearchParams(location.search);
let scene=scenes.find(s=>s.id===query.get('scene'))?.id||'coast',lab=Object.hasOwn(labs,query.get('lab'))?query.get('lab'):scenes.find(s=>s.id===scene).lab;
let seed=Math.max(1,Math.min(9999,Math.round(Number(query.get('seed'))||42))),a=defaults(lab),b=defaults(lab),models,time=0,playing=!matchMedia('(prefers-reduced-motion: reduce)').matches,accumulator=0,last=0,history=[],checks=[],events=[],ticks=0,recordUrl='';
try{if(query.has('a'))a=sanitize(lab,JSON.parse(query.get('a')));if(query.has('b'))b=sanitize(lab,JSON.parse(query.get('b')));else if(lab==='waves')b.amplitude=.36;}catch{a=defaults(lab);b=defaults(lab);}
const toNum=(v,d=3)=>Number.isFinite(v)?(Math.abs(v)<1e-12?0:v).toFixed(d):'—';
const concise=v=>Math.abs(v)>0&&Math.abs(v)<.0001?v.toExponential(2):Number(v.toFixed(7)).toString();
let toastTimer;
function toast(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,3600);}
function urlState(){const q=new URLSearchParams({scene,lab,seed:String(seed),a:JSON.stringify(a),b:JSON.stringify(b)});return `${location.origin}${location.pathname}?${q}`;}
function persist(){window.history.replaceState(null,'',urlState()+location.hash);}
function baseline(){ $('baseline-values').innerHTML='<dl>'+labs[lab].controls.map(c=>`<dt>${c.label}</dt><dd>${escape(c.options?c.options.find(([v])=>v===a[c.key])?.[1]:`${concise(a[c.key])} ${c.unit}`)}</dd>`).join('')+'</dl>'; }
function clearChecks(){checks=[];$('check-badge').textContent='参数已更新';$('check-badge').className='';$('check-results').innerHTML='<p class="empty-state">针对当前 B 参数重新运行检查。</p>';}
function resetModels(invalidate=true){models=[makeModel(lab,a,scene,seed),makeModel(lab,b,scene,seed)];time=0;ticks=0;accumulator=0;history=[];events=[];if(invalidate)clearChecks();baseline();draw();persist();}
function updatePlay(){ $('play').textContent=playing?'Ⅱ 暂停':'▶ 播放';$('play').setAttribute('aria-pressed',String(playing)); }
function controls(){
  $('controls').innerHTML=labs[lab].controls.map(c=>`<div class="control"><div class="control-label"><label for="param-${c.key}">${c.label}</label>${c.options?'':`<output for="param-${c.key}" id="value-${c.key}">${concise(b[c.key])} ${c.unit}</output>`}</div>${c.options?`<select id="param-${c.key}" data-param="${c.key}" aria-describedby="hint-${c.key}">${c.options.map(([v,name])=>`<option value="${v}" ${v===b[c.key]?'selected':''}>${name}</option>`).join('')}</select>`:`<input type="range" id="param-${c.key}" data-param="${c.key}" min="${c.min}" max="${c.max}" step="${c.step}" value="${b[c.key]}" aria-describedby="hint-${c.key}">`}<p id="hint-${c.key}">${c.hint}</p></div>`).join('');
  $('seed').value=seed;
}
function populate(){
  const s=scenes.find(s=>s.id===scene),d=labs[lab];
  $('scene-list').innerHTML=scenes.map(s=>`<button class="scene-button" data-scene="${s.id}" aria-pressed="${s.id===scene}"><span class="scene-icon" aria-hidden="true">${s.icon}</span><span><strong>${s.name}</strong><small>${s.tag}</small></span></button>`).join('');
  $('lab-tabs').innerHTML=Object.entries(labs).map(([id,l])=>`<button class="lab-tab" data-lab="${id}" aria-pressed="${id===lab}"><span>${l.number}</span>${l.name}</button>`).join('');
  $('scene-symbol').textContent=s.icon;$('scene-title').textContent=s.name;$('scene-note').textContent=s.note;
  $('scene-modules').innerHTML=s.modules.map(id=>`<button class="module-chip ${id===lab?'active':''}" data-lab="${id}">${labs[id].name}</button>`).join('');
  $('lab-kind').textContent=`${d.number} / ${d.en} · ${d.kind}`;$('lab-title').textContent=d.summary;$('lab-description').textContent=d.description;
  for(const [element,key]of[['input-text','inputs'],['state-text','state'],['formula','formula'],['process-text','process'],['observe-text','observe'],['reuse-text','reuse'],['boundary-text','boundary']])$(element).textContent=d[key];
  $('challenge-title').textContent=d.challenge.title;$('challenge-expected').textContent=d.challenge.expected;
  $('source-links').innerHTML=d.sources.map(([name,url])=>`<a href="${url}" target="_blank" rel="noopener noreferrer">${escape(name)} ↗</a>`).join('');
  $('metrics').innerHTML=d.metrics.map(([name,unit],i)=>`<div class="metric"><span class="metric-name">${name}</span><div class="metric-values"><span class="a"><small>A</small><output id="ma-${i}">—</output></span><span class="b"><small>B</small><output id="mb-${i}">—</output></span></div><div class="metric-unit">${unit||'无量纲'}</div></div>`).join('');
  $('chart-label').textContent=d.metrics[0][0];$('pulse').hidden=!['flow','wetness','transport'].includes(lab);
  $('view-note').textContent=lab==='flow'?'两种观察字段使用固定色标：水深 0–0.8 m；水面偏移 −8 至 +8 cm。箭头长度为示意，收支来自实际格子计算。':lab==='transport'?'白色是浓度，不是白沫几何；复杂流场下的总量漂移与显式消散都可能存在。':'画面为独立教学可视化，没有复现原站完整画质。A/B 使用同一种空间与颜色尺度。';
  document.title=`${d.name} · 算法与场景实验室`;controls();updatePlay();
}
function selectLab(id,newScene){if(!Object.hasOwn(labs,id))return;lab=id;if(newScene)scene=newScene;a=defaults(lab);b=defaults(lab);if(scene==='underwater'&&lab==='optics'){a.depth=3;b.depth=3;}populate();resetModels();document.querySelector(newScene?'.target-strip':'.lab-tabs').scrollIntoView({block:'start',behavior:'auto'});}
document.addEventListener('click',e=>{const target=e.target.closest('[data-scene],[data-lab]');if(!target)return;if(target.dataset.scene){const s=scenes.find(s=>s.id===target.dataset.scene);selectLab(s.lab,s.id);}else selectLab(target.dataset.lab);});
$('controls').addEventListener('input',e=>{const key=e.target.dataset.param;if(!key)return;b=sanitize(lab,{...b,[key]:Number(e.target.value)});const c=labs[lab].controls.find(c=>c.key===key);if($(`value-${key}`))$(`value-${key}`).textContent=`${concise(b[key])} ${c.unit}`;resetModels();});
$('seed').addEventListener('change',()=>{seed=Math.max(1,Math.min(9999,Math.round(Number($('seed').value)||42)));$('seed').value=seed;resetModels();});
$('play').addEventListener('click',()=>{playing=!playing;accumulator=0;updatePlay();});
$('step').addEventListener('click',()=>{playing=false;updatePlay();advance();draw();});
$('restart').addEventListener('click',()=>{resetModels(false);toast('两侧已从 0 秒同步重播。');});
$('pulse').addEventListener('click',()=>{models.forEach(m=>m.pulse?.());events.push({time,type:'same-pulse'});history=[];draw();toast('已向 A/B 施加同样的扰动；当前检查仅验证参数配置。');});
$('reset').addEventListener('click',()=>{a=defaults(lab);b=defaults(lab);controls();resetModels();toast('A/B 均已恢复本算法默认参数。');});
$('pin').addEventListener('click',()=>{a={...b};resetModels();toast('已将 B 参数设为 A；两侧现在相同。');});
$('challenge').addEventListener('click',()=>{a=defaults(lab);b={...a,...labs[lab].challenge.values};controls();resetModels();playing=true;updatePlay();toast('已恢复标准参考，并仅改变引导实验指定的参数。');});
$('check').addEventListener('click',async()=>{
  const button=$('check');button.disabled=true;button.textContent='正在计算…';await new Promise(resolve=>requestAnimationFrame(resolve));
  try{checks=runChecks(lab,b);const passed=checks.filter(c=>c.pass).length;$('check-badge').textContent=`${passed} / ${checks.length} 通过`;$('check-badge').className=passed===checks.length?'pass':'fail';$('check-results').innerHTML=checks.map(c=>`<div class="check-item ${c.pass?'pass':'fail'}"><strong>${c.pass?'✓':'×'} ${escape(c.name)}</strong><div class="check-value">实测 ${concise(c.value)} ｜ 目标 ${concise(c.expected)} ± ${c.tolerance}</div>${c.note?`<p>${escape(c.note)}</p>`:''}</div>`).join('');}
  catch(e){$('check-badge').textContent='检查未完成';$('check-badge').className='fail';$('check-results').textContent=`计算发生错误：${e.message}`;}
  finally{button.disabled=false;button.textContent='重新运行当前算法检查';}
});
$('share').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(urlState());toast('已复制包含 A/B 参数、场景与种子的链接；打开后从 0 秒重播。');}catch{toast('复制未获允许；地址栏已保存当前配置，可直接复制地址。');}});
$('export').addEventListener('click',()=>{
  playing=false;updatePlay();
  const record={version:'1.0',model:'independent-educational',scene,lab,seed,reference:a,trial:b,simulatedSeconds:time,metrics:{labels:labs[lab].metrics,reference:models[0].metrics(),trial:models[1].metrics()},checks,events,history,note:'Checks cover the parameter configuration, not the upstream repositories or physical accuracy. Replay begins at t=0; manual disturbances are not replayed by the shared link.'};
  const text=JSON.stringify(record,null,2);if(recordUrl)URL.revokeObjectURL(recordUrl);recordUrl=URL.createObjectURL(new Blob([text],{type:'application/json'}));$('record-content').value=text;$('download-record').href=recordUrl;$('download-record').download=`algorithm-lab-${lab}-seed-${seed}.json`;$('record-dialog').showModal();
});
$('copy-record').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('record-content').value);toast('完整实验记录已复制。');}catch{toast('复制未获允许，可选中记录文本后手动复制。');}});
function advance(){models.forEach(m=>m.step(1/30));time+=1/30;ticks++;if(ticks%3===0){history.push({t:time,a:models[0].metrics()[0],b:models[1].metrics()[0]});if(history.length>180)history.shift();}}
function draw(){render($('view-a'),lab,models[0]);render($('view-b'),lab,models[1]);const ma=models[0].metrics(),mb=models[1].metrics();labs[lab].metrics.forEach(([,unit,d],i)=>{$(`ma-${i}`).textContent=toNum(ma[i],d);$(`mb-${i}`).textContent=toNum(mb[i],d);});$('clock').textContent=`${time.toFixed(2)} s`;chart($('history'),history);}
let paint=0;
function frame(now){const elapsed=last?Math.min(.1,(now-last)/1000):0;last=now;if(playing&&!document.hidden){accumulator+=elapsed;let n=0;while(accumulator>=1/30&&n<3){advance();accumulator-=1/30;n++;}if(now-paint>32){draw();paint=now;}}requestAnimationFrame(frame);}
document.addEventListener('visibilitychange',()=>{last=0;accumulator=0;});
window.addEventListener('resize',()=>draw());
populate();resetModels();requestAnimationFrame(frame);
