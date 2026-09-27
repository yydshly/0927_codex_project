import {angle,stereo,validPoint} from './math.mjs';
import {makeSynthetic,parseNpy,toDataset,toCsv} from './data.mjs';
import {renderScene,renderCamera,renderChart,renderGeometry} from './render.mjs';
const $=id=>document.getElementById(id);
let dataset=makeSynthetic(),cursor=0,playing=!matchMedia('(prefers-reduced-motion: reduce)').matches,speed=1;
let yaw=.5,pitch=.17,radius=3.8,view='motion',dirty=true,lastTime=0,lastFrame=-1,chartValues=[];
const tabs=Array.from(document.querySelectorAll('[data-view]'));
function setView(next,focus=false){
  if(!['motion','geometry','capabilities'].includes(next)) next='motion';
  view=next;
  for(const tab of tabs){const selected=tab.dataset.view===next;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;$(tab.dataset.view).hidden=!selected;if(focus&&selected)tab.focus();}
  dirty=true;if(next==='geometry')updateGeometry();
}
tabs.forEach((tab,index)=>{
  tab.addEventListener('click',()=>{location.hash=tab.dataset.view;setView(tab.dataset.view);window.scrollTo({top:0,behavior:'instant'});});
  tab.addEventListener('keydown',e=>{let next;if(['ArrowDown','ArrowRight'].includes(e.key))next=(index+1)%3;else if(['ArrowUp','ArrowLeft'].includes(e.key))next=(index+2)%3;else if(e.key==='Home')next=0;else if(e.key==='End')next=2;else return;e.preventDefault();location.hash=tabs[next].dataset.view;setView(tabs[next].dataset.view,true);});
});
document.querySelectorAll('[data-go]').forEach(button=>button.addEventListener('click',()=>{location.hash=button.dataset.go;setView(button.dataset.go,true);window.scrollTo({top:0,behavior:'instant'});}));
document.querySelectorAll('[data-scroll]').forEach(button=>button.addEventListener('click',()=>{
  const target=$(button.dataset.scroll);
  if(!target)return;
  if(!target.hasAttribute('tabindex'))target.tabIndex=-1;
  target.focus({preventScroll:true});
  target.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
}));
function updateMapZoom(){
  $('map-image').style.width=$('map-zoom').value+'%';
  $('map-zoom-out').textContent=$('map-zoom').value+'%';
}
document.querySelectorAll('[data-open-map]').forEach(button=>button.addEventListener('click',()=>{
  $('map-zoom').value='100';updateMapZoom();$('map-dialog').showModal();
  $('map-scroll').scrollTo({top:0,left:0,behavior:'instant'});
}));
$('close-map').addEventListener('click',()=>$('map-dialog').close());
$('map-zoom').addEventListener('input',updateMapZoom);
$('fit-map').addEventListener('click',()=>{$('map-zoom').value='100';updateMapZoom();$('map-scroll').scrollLeft=0;});
addEventListener('hashchange',()=>setView(location.hash.slice(1)));
function updatePlay(){
  $('play').textContent=playing?'Ⅱ':'▶';$('play').setAttribute('aria-label',playing?'暂停回放':'播放动作');
}
function loadDataset(data){
  dataset=data;cursor=0;lastFrame=-1;dirty=true;
  $('timeline').max=String(dataset.frames.length-1);$('timeline').value='0';
  const step=Math.max(1,Math.ceil(dataset.frames.length/720));
  chartValues=[];for(let i=0;i<dataset.frames.length;i+=step){const f=dataset.frames[i];chartValues.push(angle(f[11],f[13],f[15]));}
  $('frame-meta').textContent=`${dataset.frames.length.toLocaleString()} 帧 / ${dataset.fps} FPS / 17 显示关键点`;
  document.body.classList.toggle('imported',data.source==='imported');
  $('data-source').textContent=data.source==='synthetic'?'合成动作 · 教学演示':data.source==='synthetic-file'?'合成文件 · NPY 格式示例':'本地文件 · '+data.name;
  $('data-description').textContent=data.source==='synthetic'?'参数化生成的 17 点骨架，不代表 FreeMoCap 实测精度。':`原始 ${data.originalPoints} 点 · 仅显示身体主骨架 · 已居中并调整显示地面`;
  $('coordinate-label').textContent=data.source==='synthetic'?'显示坐标 · 米 / Y 向上':'显示坐标 · 米 / Y 向上 / 已平移';
  document.querySelectorAll('[data-motion]').forEach(b=>{const active=data.source==='synthetic'&&b.dataset.motion===data.name;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  yaw=.5;pitch=.17;radius=3.8;updatePlay();
}
document.querySelectorAll('[data-motion]').forEach(b=>b.addEventListener('click',()=>loadDataset(makeSynthetic(b.dataset.motion))));
$('play').addEventListener('click',()=>{playing=!playing;updatePlay();});
$('timeline').addEventListener('input',()=>{cursor=Number($('timeline').value);playing=false;updatePlay();dirty=true;});
$('speed').addEventListener('change',()=>{speed=Number($('speed').value);});
$('rotate-left').addEventListener('click',()=>{yaw-=.3;dirty=true;});
$('rotate-right').addEventListener('click',()=>{yaw+=.3;dirty=true;});
$('reset-view').addEventListener('click',()=>{yaw=.5;pitch=.17;radius=3.8;dirty=true;});
let drag=null;
$('scene').addEventListener('pointerdown',e=>{drag=[e.clientX,e.clientY];$('scene').setPointerCapture(e.pointerId);$('scene').style.cursor='grabbing';});
$('scene').addEventListener('pointermove',e=>{if(!drag)return;yaw-=(e.clientX-drag[0])*.009;pitch=Math.max(-.15,Math.min(1.15,pitch+(e.clientY-drag[1])*.006));drag=[e.clientX,e.clientY];dirty=true;});
function stopDrag(){drag=null;$('scene').style.cursor='grab';}
$('scene').addEventListener('pointerup',stopDrag);$('scene').addEventListener('pointercancel',stopDrag);
$('scene').addEventListener('wheel',e=>{e.preventDefault();radius=Math.max(1.8,Math.min(10,radius+e.deltaY*.003));dirty=true;},{passive:false});
new ResizeObserver(()=>{dirty=true;if(view==='geometry')updateGeometry();}).observe($('main'));
function drawMotion(index){
  const frame=dataset.frames[index],trail=dataset.frames.slice(Math.max(0,index-40),index+1).map(f=>f[10]);
  renderScene($('scene'),frame,{yaw,pitch,radius,trail});renderCamera($('camera-a'),frame);renderCamera($('camera-b'),frame,true);
  renderChart($('angle-chart'),chartValues,Math.min(chartValues.length-1,Math.floor(index/dataset.frames.length*chartValues.length)));
  const knee=angle(frame[11],frame[13],frame[15]);$('knee-angle').textContent=Number.isFinite(knee)?knee.toFixed(1):'—';
  const validHips=validPoint(frame[11])&&validPoint(frame[12]);$('hip-height').textContent=validHips?((frame[11][1]+frame[12][1])/2).toFixed(2)+' m':'缺失';
  $('timeline').value=String(index);$('timecode').textContent=`${(index/dataset.fps).toFixed(2).padStart(5,'0')} / ${(dataset.frames.length/dataset.fps).toFixed(2)}`;
}
function tick(time){
  const dt=lastTime?Math.min((time-lastTime)/1000,.1):0;lastTime=time;
  if(view==='motion'){
    if(playing&&!document.hidden)cursor=(cursor+dt*dataset.fps*speed)%dataset.frames.length;
    const index=Math.min(dataset.frames.length-1,Math.floor(cursor));
    if(dirty||index!==lastFrame){drawMotion(index);lastFrame=index;dirty=false;}
  }
  requestAnimationFrame(tick);
}
function getGeometry(){return{baseline:Number($('baseline').value),depth:Number($('depth').value),noise:Number($('noise').value),syncMs:Number($('sync').value),second:$('second-camera').checked};}
function updateGeometry(){
  const p=getGeometry(),r=stereo(p);
  $('baseline-out').textContent=p.baseline.toFixed(2)+' m';$('depth-out').textContent=p.depth.toFixed(2)+' m';$('noise-out').textContent='±'+p.noise+' px';$('sync-out').textContent=p.syncMs+' ms';
  $('disparity').textContent=r.disparity===null?'—':r.disparity.toFixed(1)+' px';$('reconstructed-depth').textContent=r.z===null?'无法确定':r.z.toFixed(3)+' m';$('depth-error').textContent=r.error===null?'—':(r.error*1000).toFixed(1)+' mm';
  let insight='理想同步、无像素偏移：两条射线在真实点相交。';
  if(!p.second)insight='只有一台摄像头时，沿射线的多个深度都可能成立，无法仅靠此几何观测确定深度。';
  else if(p.noise&&p.syncMs)insight='像素偏移和时间差会共同改变视差；误差可能叠加，也可能偶然抵消。';
  else if(p.noise)insight='保持像素偏移不变，缩小机位间距或增大距离，观察深度误差如何变化。';
  else if(p.syncMs)insight='两机看见的是运动点的两个不同位置，时间差会被误当成空间视差。';
  $('experiment-insight').textContent=insight;renderGeometry($('geometry-canvas'),p,r);
}
for(const id of ['baseline','depth','noise','sync','second-camera'])$(id).addEventListener('input',updateGeometry);
$('reset-geometry').addEventListener('click',()=>{$('baseline').value='1.2';$('depth').value='3';$('noise').value='0';$('sync').value='0';$('second-camera').checked=true;updateGeometry();});
$('open-import').addEventListener('click',()=>{$('import-error').textContent='';$('import-dialog').showModal();});
$('close-import').addEventListener('click',()=>$('import-dialog').close());
$('load-sample').addEventListener('click',async()=>{
  $('load-sample').disabled=true;
  try{
    const response=await fetch(new URL('../samples/synthetic-mediapipe-body.npy',import.meta.url));
    if(!response.ok)throw new Error('示例文件暂时无法读取，请检查本地服务。');
    const sample=toDataset(parseNpy(await response.arrayBuffer()),{schema:'mediapipe',scale:.001,up:'z',fps:30,name:'synthetic-mediapipe-body.npy'});
    sample.source='synthetic-file';loadDataset(sample);$('import-dialog').close();toast('已解析合成 NPY 样例；这不是 FreeMoCap 实拍数据。');
  }catch(error){$('import-error').textContent=error.message;}finally{$('load-sample').disabled=false;}
});
$('import-form').addEventListener('submit',async e=>{
  e.preventDefault();const file=$('npy-file').files[0];if(!file){$('import-error').textContent='未读取到文件内容，请重新选择本地 .npy 文件。';return;}
  const button=e.submitter;button.disabled=true;$('import-error').textContent='';
  try{
    if(file.size>64*1024*1024)throw new Error('文件超过 64 MB，请先裁剪录制片段。');
    const parsed=parseNpy(await file.arrayBuffer());
    loadDataset(toDataset(parsed,{schema:$('import-schema').value,scale:Number($('import-unit').value),up:$('import-up').value,fps:Number($('import-fps').value),name:file.name}));
    $('import-dialog').close();toast('已载入本地数据。可暂停、逐帧查看或切回教学动作。');
  }catch(error){$('import-error').textContent=error.message;}finally{button.disabled=false;}
});
let toastTimer;
function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,4500);}
$('export-csv').addEventListener('click',()=>{
  const csv=toCsv(dataset),blob=new Blob(['\uFEFF',csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=dataset.source==='synthetic'?`synthetic-${dataset.name}-display-coordinates.csv`:dataset.source==='synthetic-file'?'synthetic-file-display-coordinates.csv':'imported-body-display-coordinates.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  toast('已导出显示坐标（米 / Y 向上），文件包含数据来源标记。');
});
loadDataset(dataset);setView(location.hash.slice(1));updatePlay();requestAnimationFrame(tick);
