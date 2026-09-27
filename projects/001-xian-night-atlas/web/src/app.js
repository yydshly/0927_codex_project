import {stations,lines,stationById,stationByName,lineById,linesAt,scenarios} from './data.js';
import {formatTime,departuresFrom,lineLastDeparture,latestStart} from './engine.js';
import {AtlasScene,stationEnglish} from './scene.js';
import {places,placeById,RETURN_BUFFER,planReturn,reachability,compareReachability,readSavedPlan} from './planner.js';
const $=s=>document.querySelector(s);
const state={time:1350,day:'weekday',view:'time',theme:'night',mode:'journey',scenario:'city',place:'bell',stay:0,budget:45,origin:stationByName.get('钟楼').id,destination:stationByName.get('西安北站').id,walk:8,selectedLine:null,selectedStation:null,query:'',sort:'number',playing:false,speed:1};
const storageKey='xian-night-atlas:plan:v1';
try{const saved=readSavedPlan(localStorage.getItem(storageKey));if(saved)Object.assign(state,saved,{scenario:null});}catch{}
const atTime=minutes=>`${Math.round(minutes)>=1440?'次日 ':''}${formatTime(minutes)}`;
const icon=name=>`<i class="icon" style="--icon:url('./icons/${name}.svg')"></i>`;
let plan,reach,later,comparison,lastPlanKey='',lastReachKey='';
const palette=['#72b5fa','#fc9399','#df9ace','#6ed7c0','#d1d790','#aaa1ff'];
const routeColor=id=>state.theme==='night'?palette[Number(id)-1]:['#1c66b1','#c82c42','#a34796','#177e6b','#778415','#6343b0'][Number(id)-1];
const nameOf=id=>stationById.get(id).name;
const badge=l=>`<span class="route-badge" style="--route-color:${routeColor(l.id)}">${l.id}</span>`;
let scene,journey=null,latest=null,timer=null,lastRouteKey='',lastTick=0,toastTimer;
const opts=stations.slice().sort((a,b)=>a.name.localeCompare(b.name,'zh-CN')).map(s=>`<option value="${s.id}">${s.name}</option>`).join('');
$('#origin').innerHTML=opts;$('#destination').innerHTML=opts;$('#scenario-tabs').innerHTML=scenarios.map(s=>`<button data-scenario="${s.id}" aria-pressed="${s.id===state.scenario}">${s.name}</button>`).join('');
function syncControls(){
  $('#origin').value=state.origin;$('#destination').value=state.destination;$('#walk').value=state.walk;$('#walk-value').value=state.walk;$('#walk').style.setProperty('--fill',`${state.walk/30*100}%`);
  for(const key of ['day','view','mode','scenario'])document.querySelectorAll(`[data-${key}]`).forEach(b=>{const active=b.dataset[key]===state[key];b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  $('#atlas-panel').hidden=state.mode!=='atlas';$('#journey-panel').hidden=state.mode==='atlas';$('#height-key').hidden=state.view!=='time';
  document.body.dataset.mode=state.mode;$('#place').value=state.place;
  $('#stay').value=state.stay;$('#stay-value').value=state.stay;$('#stay').style.setProperty('--fill',`${state.stay/90*100}%`);
  const isReach=state.mode==='reach',place=placeById.get(state.place);
  $('#budget-control').hidden=!isReach;$('#reach-result').hidden=!isReach;$('#journey-result').hidden=isReach;
  $('#destination').hidden=isReach;$('label[for=destination]').hidden=isReach;$('#swap').hidden=isReach;
  $('#place-description').textContent=place?.description||'选择一座站，开始你的夜行计划。';
  $('#place-card').style.setProperty('--place-color',place?.color||'#aab9e9');
  $('#departure-preview').innerHTML=`${icon('clock-3')}<span>${atTime(plan.departure)} 离开 · ${atTime(plan.departure+state.walk)} 到站</span>`;
  $('#plan-submit').innerHTML=(isReach?'查看可达目的地':'查看返程步骤')+icon('arrow-up-right');
  document.querySelectorAll('[data-budget]').forEach(b=>{const active=Number(b.dataset.budget)===state.budget;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
}
function computeJourney(){
  const key=[state.origin,state.destination,state.walk,state.day].join('|');
  if(key!==lastRouteKey){latest=latestStart(state.origin,state.destination,state.day,state.walk);lastRouteKey=key;}
  const planKey=[key,Math.round(state.time),state.stay].join('|');
  if(planKey!==lastPlanKey){plan=planReturn(state,latest);journey=plan.journey;lastPlanKey=planKey;}
  if(state.mode!=='reach')return;
  const reachKey=[state.origin,Math.round(state.time),state.walk,state.stay,state.day,state.budget].join('|');
  if(reachKey!==lastReachKey){reach=reachability(state);later=reachability({...state,stay:state.stay+30});comparison=compareReachability(reach,later);lastReachKey=reachKey;}
}
function lineRow(l){const last=lineLastDeparture(l,state.day),remaining=last-state.time;return `<button class="line-row ${state.selectedLine===l.id?'selected':''} ${remaining<0?'closed':''}" data-line="${l.id}" aria-pressed="${state.selectedLine===l.id}" style="--route-color:${routeColor(l.id)}">${badge(l)}<span class="line-meta"><span class="line-name">${l.name}</span><span class="line-terminals">${l.from} — ${l.to}</span></span><span class="line-time"><strong>${formatTime(last)}</strong><small>${remaining<0?'末班已过':'最晚发站'}</small></span><span class="line-progress"><i style="width:${Math.max(0,Math.min(100,remaining/160*100))}%"></i></span></button>`;}
function renderList(){const q=state.query.trim().toLowerCase();$('#list-title').textContent=q?'搜索结果':'西安地铁 · 关键线路';$('#sort').hidden=!!q;if(q){const matches=stations.filter(s=>s.name.includes(q)||stationEnglish(s).toLowerCase().includes(q));$('#line-list').innerHTML=matches.map(s=>`<button class="search-result" data-station="${s.id}"><span>${s.name}</span><small>${linesAt(s.id).map(l=>l.name).join(' · ')}</small></button>`).join('')+lines.filter(l=>l.name.includes(q)||l.id===q).map(lineRow).join('')||'<p class="empty">还没有找到这个站点。<br>试试“钟楼”“大雁塔”或“2号线”。<br>当前原型仅收录 71 个关键站。</p>';}else{const sorted=[...lines];if(state.sort!=='number')sorted.sort((a,b)=>(lineLastDeparture(a,state.day)-lineLastDeparture(b,state.day))*(state.sort==='early'?1:-1));$('#line-list').innerHTML=sorted.map(lineRow).join('');}}
function renderTimeline(){const count=lines.filter(l=>lineLastDeparture(l,state.day)>=state.time).length;$('#time-display').value=formatTime(state.time);$('#time-slider').value=state.time;$('#time-slider').style.setProperty('--fill',`${(state.time-1260)/270*100}%`);$('#time-slider').setAttribute('aria-valuetext',`${Math.round(state.time)>=1440?'次日 ':''}${formatTime(state.time)}`);$('#time-period').textContent=`模拟 · ${Math.round(state.time)>=1440?'次日':'今夜'} · ${state.day==='weekday'?'工作日':'周末'}`;$('#running-count').textContent=count?`${count} 条线路仍有末班`:'今夜的末班，已全部驶过';$('#running-count').style.color=count?'var(--green)':'var(--muted)';$('#map-mood').textContent=count===0?'晚安，长安。':state.time>=1410?'最后一程，仍有光。':'每一条光，是回家的方向。';$('#timeline-summary').textContent=state.view==='time'?'线路高度 = 末班经过时刻':state.view==='layers'?'在不同高度，看清线路交汇':'回到地面，读懂城市脉络';}
function renderJourney(){
  if(state.mode!=='journey')return;
  if(state.origin===state.destination){$('#journey-result').innerHTML='';return;}
  if(!journey){$('#journey-result').innerHTML='<p class="journey-no">计划离开时，已没有可以接续的模拟班次。减少停留、把时间拨早，或在“可达范围”中看看其他目的地。</p><button class="secondary-button" data-mode="reach">看看还能去哪里 '+icon('arrow-right')+'</button>';return;}
  $('#journey-result').innerHTML=`<div class="journey-card"><span class="journey-status ${plan.margin<RETURN_BUFFER?'warn':''}"><span class="status-dot"></span>${plan.margin<RETURN_BUFFER?'可以赶上，但已不足 10 分钟缓冲':'按计划可以完成返程'}</span><div class="journey-duration"><strong>${journey.duration+state.walk}</strong>分钟<span>${journey.transfers?`换乘 ${journey.transfers} 次`:'直达'} · ${atTime(journey.arrival)} 到达</span></div><p class="journey-deadline">${state.stay?`再停留 ${state.stay} 分钟 · `:''}${atTime(plan.departure)} 离开出发地<br>行程用时含步行、候车与换乘，不含停留</p><div class="journey-leg"><span class="route-badge" style="--route-color:var(--muted)">${icon('footprints')}</span><div><p>步行到${nameOf(state.origin)}站</p><small>${state.walk} 分钟 · ${atTime(plan.departure+state.walk)} 到站</small></div></div>${journey.legs.map((leg,i)=>`<div class="journey-leg">${badge(lineById.get(leg.lineId))}<div><p>${nameOf(leg.from)} → ${nameOf(leg.to)}</p><small>${lineById.get(leg.lineId).name} · 往${leg.direction===1?lineById.get(leg.lineId).to:lineById.get(leg.lineId).from}<br>${atTime(leg.departure)} — ${atTime(leg.arrival)}${i<journey.legs.length-1?' · 换乘预留 6 分钟':''}</small></div></div>`).join('')}</div><button class="secondary-button" data-mode="reach">比较其他可达目的地 ${icon('arrow-right')}</button>`;
}
function renderDetail(){const panel=$('#detail-panel');if(!state.selectedLine&&!state.selectedStation){panel.hidden=true;return;}panel.hidden=false;
  if(state.selectedStation){const s=stationById.get(state.selectedStation),deps=departuresFrom(s.id,state.day),r=state.mode==='reach'?reach.destinations.get(s.id):null;const reachInfo=state.mode==='reach'?`<div class="detail-stat">${s.id===state.origin?'当前出发站':r?`<strong>${r.duration} 分钟可达</strong>${atTime(r.arrival)} 到达 · 含步行及换乘`:`不在当前 ${state.budget} 分钟可达范围内`}</div>`:'';$('#detail-content').innerHTML=`<div class="detail-kicker">STATION / 车站</div><h2 class="detail-title">${s.name}</h2><p class="detail-en">${stationEnglish(s)}</p><div class="detail-badges">${linesAt(s.id).map(badge).join('')}</div>${reachInfo}<p class="detail-kicker">各方向末班发站 · 模拟</p>${deps.map(d=>`<div class="departure ${state.time>d.last?'passed':''}">${badge(d.line)}<div>往${d.destination}</div><strong>${formatTime(d.last)}<small>${state.time>d.last?'已过':`还有 ${Math.floor(d.last-state.time)} 分钟`}</small></strong></div>`).join('')}<div class="detail-actions"><button data-station-action="from">从这里出发</button><button data-station-action="to">到这里去</button></div>`;
  }else{const l=lineById.get(state.selectedLine);$('#detail-content').innerHTML=`<div class="detail-kicker">LINE ${l.id} / 线路</div><h2 class="detail-title">${l.name}</h2><p class="detail-en">${l.from} — ${l.to}</p><div class="detail-stat"><strong>${formatTime(lineLastDeparture(l,state.day))}</strong>全线最晚发站 · ${l.stops.length} 个关键站</div><p class="detail-kicker">选择站点，查看双向末班</p><ol class="line-stops" style="--route-color:${routeColor(l.id)}">${l.stops.map(id=>`<li><button data-station="${id}"><span>${nameOf(id)}</span><small>${linesAt(id).length>1?'换乘':''}</small></button></li>`).join('')}</ol>`;}
}
function render(all=true){computeJourney();renderTimeline();renderMapCopy();if(all){syncControls();renderList();renderPlanSummary();renderJourney();renderReach();renderDetail();}scene?.setState(state,journey,state.mode==='reach'?{...reach,lost:comparison.lost}:null);}
function closeExplorer(){$('#explorer').classList.remove('open');$('#explorer-toggle').setAttribute('aria-expanded','false');}
function selectStation(id){state.selectedStation=id;state.selectedLine=null;render();scene?.focusStation(id);closeExplorer();}
function selectLine(id){state.selectedLine=state.selectedLine===id?null:id;state.selectedStation=null;render();if(state.selectedLine)scene?.focusLine(id);else scene?.reset();closeExplorer();}
function toast(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').hidden=false;toastTimer=setTimeout(()=>$('#toast').hidden=true,3000);}
function setMode(mode){state.mode=mode;state.selectedStation=null;state.selectedLine=null;render();$('#journey-panel').scrollTop=0;scene?.reset();}
function setPlaying(value){state.playing=value;$('#play-button').setAttribute('aria-pressed',String(value));$('#play-button').setAttribute('aria-label',value?'暂停时间变化':'播放时间变化');$('#play-button .icon').style.setProperty('--icon',`url('./icons/${value?'pause':'play'}.svg')`);clearInterval(timer);if(value){if(state.time>=1530)state.time=1260;lastTick=performance.now();timer=setInterval(()=>{const now=performance.now();const before=Math.round(state.time);state.time=Math.min(1530,state.time+(now-lastTick)/1000*state.speed*2.5);lastTick=now;render(Math.round(state.time)!==before);if(state.time>=1530)setPlaying(false);},250);}}
$('#search').addEventListener('input',e=>{state.query=e.target.value;renderList();});$('#sort').addEventListener('change',e=>{state.sort=e.target.value;renderList();});$('#time-slider').addEventListener('input',e=>{setPlaying(false);state.time=Number(e.target.value);render();});
$('#walk').addEventListener('input',e=>{state.walk=Number(e.target.value);state.scenario=null;render();});
for(const id of ['origin','destination'])$('#'+id).addEventListener('change',e=>{state[id]=e.target.value;state.scenario=null;if(id==='origin')state.place='custom';render();});
$('#swap').addEventListener('click',()=>{[state.origin,state.destination]=[state.destination,state.origin];state.scenario=null;state.place='custom';render();});
$('#journey-form').addEventListener('submit',e=>{e.preventDefault();setPlaying(false);render();$('#explorer').classList.add('open');$('#explorer-toggle').setAttribute('aria-expanded','true');(state.mode==='reach'?$('#reach-result'):$('#journey-result')).scrollIntoView({block:'start',behavior:'smooth'});});
$('#play-button').addEventListener('click',()=>setPlaying(!state.playing));$('#speed-button').addEventListener('click',()=>{state.speed=state.speed===1?4:1;$('#speed-button').textContent=`${state.speed}×`;});$('#reset-time').addEventListener('click',()=>{setPlaying(false);state.time=1350;render();});
$('#theme-toggle').addEventListener('click',()=>{state.theme=state.theme==='night'?'day':'night';document.documentElement.dataset.theme=state.theme;$('#theme-toggle').setAttribute('aria-label',state.theme==='night'?'切换至日间模式':'切换至夜间模式');$('#theme-toggle .icon').style.setProperty('--icon',`url('./icons/${state.theme==='night'?'sun':'moon'}.svg')`);$('meta[name=theme-color]').content=state.theme==='night'?'#0b1020':'#e9eeec';render();});
$('#detail-close').addEventListener('click',()=>{state.selectedLine=null;state.selectedStation=null;render();scene?.reset();});$('#reset-view').addEventListener('click',()=>scene?.reset());$('#zoom-in').addEventListener('click',()=>scene?.zoom(1.25));$('#zoom-out').addEventListener('click',()=>scene?.zoom(.8));
$('#explorer-toggle').addEventListener('click',()=>{const open=$('#explorer').classList.toggle('open');$('#explorer-toggle').setAttribute('aria-expanded',String(open));if(open){state.selectedStation=null;state.selectedLine=null;render();}});$('#explorer-close').addEventListener('click',closeExplorer);
for(const id of ['about-button','data-button'])$('#'+id).addEventListener('click',()=>$('#about-dialog').showModal());$('#about-close').addEventListener('click',()=>$('#about-dialog').close());$('#about-dialog').addEventListener('click',e=>{if(e.target===$('#about-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.line)selectLine(b.dataset.line);if(b.dataset.station)selectStation(b.dataset.station);if(b.dataset.day){state.day=b.dataset.day;render();}if(b.dataset.view){state.view=b.dataset.view;render();}if(b.dataset.mode)setMode(b.dataset.mode);if(b.dataset.scenario){const s=scenarios.find(s=>s.id===b.dataset.scenario);state.scenario=s.id;state.origin=stationByName.get(s.origin).id;state.destination=stationByName.get(s.destination).id;state.time=s.time;state.walk=s.walk;state.stay=0;state.place=places.find(p=>p.stationId===state.origin)?.id||'custom';setPlaying(false);setMode('journey');}if(b.dataset.stationAction){state[b.dataset.stationAction==='from'?'origin':'destination']=state.selectedStation;state.scenario=null;if(b.dataset.stationAction==='from')state.place='custom';setMode(b.dataset.stationAction==='from'&&state.mode==='reach'?'reach':'journey');if(innerWidth<=820){$('#explorer').classList.add('open');$('#explorer-toggle').setAttribute('aria-expanded','true');}toast(b.dataset.stationAction==='from'?'已设为出发站':'已设为目的地');}if(b.id==='return-to-deadline'){state.time=Math.max(1260,Math.min(1530,plan.recommended));state.stay=0;setPlaying(false);render();}});
document.addEventListener('keydown',e=>{const typing=/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName);if(e.key==='/'&&!typing){e.preventDefault();setMode('atlas');$('#explorer').classList.add('open');$('#explorer-toggle').setAttribute('aria-expanded','true');$('#search').focus();}if(e.code==='Space'&&!typing&&e.target===document.body&&!$('#about-dialog').open){e.preventDefault();setPlaying(!state.playing);}if(e.key==='Escape'){$('#detail-close').click();closeExplorer();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)setPlaying(false);});
$('#place').innerHTML=places.map(p=>`<option value="${p.id}">${p.name}</option>`).join('')+'<option value="custom">自选出发站</option>';
$('#place').addEventListener('change',e=>{state.place=e.target.value;const p=placeById.get(state.place);if(p){state.origin=p.stationId;state.walk=p.walk;}state.scenario=null;state.selectedStation=null;render();scene?.reset();});
$('#stay').addEventListener('input',e=>{state.stay=Number(e.target.value);state.scenario=null;render();});
$('#save-plan').addEventListener('click',()=>{const saved={version:1};for(const key of ['origin','destination','time','walk','stay','day','budget','place','mode'])saved[key]=key==='time'?Math.round(state[key]):state[key];try{localStorage.setItem(storageKey,JSON.stringify(saved));toast('计划已保存，下次打开会恢复。');}catch{toast('当前浏览器无法保存，计划仍可继续使用。');}});
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.budget){state.budget=Number(b.dataset.budget);render();}if(b.dataset.reachDestination){state.destination=b.dataset.reachDestination;state.scenario=null;setMode('journey');$('#explorer').classList.add('open');$('#explorer-toggle').setAttribute('aria-expanded','true');}if(b.id==='try-later'&&state.stay<=60){state.stay+=30;setPlaying(false);render();$('#journey-panel').scrollTop=0;}});

function renderPlanSummary(){
  if(state.mode==='atlas')return;
  if(state.mode==='reach'){
    $('#plan-summary').innerHTML=`<div class="summary-kicker">${atTime(reach.departure)} 出发 · ${state.budget} 分钟内</div><div class="reach-total"><strong>${reach.destinations.size}</strong><span>个目的站<br><small>其中 ${reach.within30} 站在 30 分钟内</small></span><span class="reach-orbit" aria-hidden="true"><i></i><b></b></span></div><p class="summary-foot">含步行、候车与换乘 · 不含出站后步行</p>`;return;
  }
  if(state.origin===state.destination){$('#plan-summary').innerHTML='<span class="summary-kicker">无需乘坐地铁</span><strong class="same-place">起终点是同一站</strong><p class="summary-foot">换个目的地，继续探索今晚的去处。</p>';return;}
  const missed=!journey,tight=plan.margin<RETURN_BUFFER;
  $('#plan-summary').innerHTML=`<div class="summary-kicker ${missed||tight?'warn':''}"><span class="status-dot"></span>${missed?'计划出发时已无法完成返程':tight?'接近模拟末班，请提前出发':'建议离开时间'}</div><div class="deadline-value ${missed?'warn':''}">${atTime(plan.recommended)}<span>已留 ${RETURN_BUFFER} 分缓冲</span></div><p class="summary-foot">${plan.spare>=0?`从此刻起，还能停留 <b>${plan.spare}</b> 分钟`:'已超过建议离开时间'} · 最晚 ${atTime(plan.latest)}</p>${missed?'<button class="text-action" id="return-to-deadline">回到建议出发时刻 '+icon('arrow-right')+'</button>':''}`;
}
function renderReach(){
  if(state.mode!=='reach')return;
  const lost=comparison.lost.size,gained=comparison.gained.size;
  $('#reach-comparison').innerHTML=`<div><span class="comparison-icon">${icon('clock-3')}</span><p>如果再逛 30 分钟<strong>${later.destinations.size} 站可达 <small>${lost?`少 ${lost} 站`:'没有减少'}${gained?` · 新增 ${gained} 站`:''}</small></strong></p></div><button class="text-action" id="try-later" ${state.stay>60?'disabled':''}>试试 ${atTime(plan.departure+30)} 出发 ${icon('arrow-right')}</button><small class="comparison-note">再逛 30 分钟后，部分站点可能超出用时上限或无法到达。</small>`;
  $('#reach-list').innerHTML=reach.list.map(j=>`<button class="reach-row" data-reach-destination="${j.id}" aria-label="查看到${nameOf(j.id)}的返程方案"><span class="reach-dot ${comparison.lost.has(j.id)?'lost':j.duration<=30?'near':'far'}"></span><span class="reach-name">${nameOf(j.id)}<small>${atTime(j.arrival)} 到达 · ${j.transfers?`换乘 ${j.transfers} 次`:'直达'}${comparison.lost.has(j.id)?' · 再逛超出范围':''}</small></span><strong>${j.duration}<small> 分</small></strong>${icon('chevron-right')}</button>`).join('')||'<p class="empty">这个时间上限内，暂时没有可达目的站。<br>试着增加到 60 或 90 分钟，或提前离开。</p>';
}
function renderMapCopy(){
  if(state.mode==='reach'){
    $('#running-count').textContent=`${reach.destinations.size} 个目的站 · ${state.budget} 分钟内可达`;
    $('#map-mood').textContent=`从${nameOf(state.origin)}，还有 ${reach.destinations.size} 种去处。`;
    $('#map-status').textContent=`${atTime(plan.departure)} 出发 · 含步行 ${state.walk} 分钟 · 仅展示关键站`;
    $('#timeline-summary').textContent='拖动时间，观察可达目的地的变化';
  }else if(state.mode==='journey'){
    $('#map-mood').textContent=journey?'把夜晚留长，也留好回家的路。':'今夜的这段返程，需要早一点。';
    $('#map-status').textContent=`${placeById.get(state.place)?.name||nameOf(state.origin)} → ${nameOf(state.destination)} · ${atTime(plan.departure)} 离开`;
    $('#timeline-summary').textContent='此刻 + 停留 + 步行 = 计划到站时刻';
  }else $('#map-status').textContent='拖动时间，看见城市慢慢入夜。';
  $('#map-legend').innerHTML=state.mode==='reach'?'<span><i class="legend-near"></i>30 分内</span><span><i class="legend-far"></i>更久可达</span><span><i class="legend-lost"></i>再逛超限</span>':'<span><i class="legend-live"></i>仍有末班</span><span><i class="legend-passed"></i>末班已过</span><span><i class="legend-train"></i>末班列车</span>';
}

render();
try{const response=await fetch('./src/geography.json');const geography=response.ok?await response.json():null;scene=new AtlasScene($('#scene'),$('#station-labels'),geography,selectStation);render();$('#scene').addEventListener('atlas-context-lost',()=>toast('地图显示暂时中断，请刷新页面恢复。'));}catch(error){console.error('Atlas initialization failed:',error);$('#scene').innerHTML='<div class="fallback"><strong>三维地图暂时无法显示</strong><p>请使用支持 WebGL 的浏览器。线路查询、时间控制与返程规划仍然可以使用。</p></div>';}
