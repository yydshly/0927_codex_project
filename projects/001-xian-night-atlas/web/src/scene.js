import * as THREE from 'three';
import {EffectComposer} from '../vendor/postprocessing/EffectComposer.js';
import {RenderPass} from '../vendor/postprocessing/RenderPass.js';
import {UnrealBloomPass} from '../vendor/postprocessing/UnrealBloomPass.js';
import {OutputPass} from '../vendor/postprocessing/OutputPass.js';
import {OrbitControls} from '../vendor/OrbitControls.js';
import {stations,lines,linesAt} from './data.js';
import {lastDeparture} from './engine.js';

const colors=['#429efa','#fa687c','#d975c1','#38d4ae','#b9ca58','#937bfa'];
const dayColors=['#1c66b1','#c82c42','#a34796','#177e6b','#778415','#6343b0'];
const english={'钟楼':'BELL TOWER','西安北站':'XI’AN NORTH','北大街':'BEIDAJIE','五路口':'WULUKOU','永宁门':'YONGNINGMEN','小寨':'XIAOZHAI','大雁塔':'DAYANTA','大唐芙蓉园':'TANG PARADISE','科技路':'KEJILU','西北工业大学':'NORTHWESTERN POLYTECHNICAL UNIV.','大差市':'DACHAISHI','行政中心':'XINGZHENG ZHONGXIN','大明宫':'DAMING PALACE','纺织城':'FANGZHICHENG','后卫寨':'HOUWEIZHAI','鱼化寨':'YUHUAZHAI','创新港':'CHUANGXINGANG','航天城':'HANGTIANCHENG','保税区':'BAOSHUIQU','曲江池西':'QUJIANGCHIXI','南稍门':'NANSHAOMEN','青龙寺':'QINGLONGSI','建筑科技大学·李家村':'LIJIACUN','交通大学·兴庆宫':'XINGQING PALACE'};
const priorityNames=['钟楼','大雁塔','西安北站','科技路','纺织城','北大街','小寨','大差市','后卫寨','创新港','五路口','大唐芙蓉园','行政中心','青龙寺','保税区','南稍门','大明宫','鱼化寨','航天城','西北工业大学','香湖湾','航天新城'];
const priority=new Map(priorityNames.map((n,i)=>[n,i]));
const aliases={'西部大道':'西部大道（西太路口）','西安北站':'西安北站','建筑科技大学·李家村':'建筑科技大学·李家村','交通大学·兴庆宫':'交通大学·兴庆宫'};
const normalize=n=>n.replace(/[·•・\s（）()]/g,'').replace(/站$/,'');
const project=([lon,lat])=>new THREE.Vector3((lon-108.947)*480,0,-(lat-34.263)*580);
export const stationEnglish=s=>english[s.name]||s.en||'XI’AN METRO';
export class AtlasScene{
  constructor(container,labelRoot,geography,onSelect){
    this.container=container;this.labelRoot=labelRoot;this.onSelect=onSelect;this.state={time:1350,day:'weekday',view:'time',theme:'night'};this.width=innerWidth;this.height=innerHeight;this.meshes=[];this.labels=[];this.stations=new Map();this.positions=new Map();this.trainDots=[];this.railDots=[];this.wires=[];this.roadMaterials=[];this.lastFrame=0;this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#0b1020');this.scene.fog=new THREE.FogExp2('#0b1020',.0018);
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));this.renderer.setSize(this.width,this.height);this.renderer.setClearColor('#0b1020');this.renderer.outputColorSpace=THREE.SRGBColorSpace;container.append(this.renderer.domElement);this.renderer.domElement.setAttribute('aria-label','可拖动旋转和缩放的三维西安线路图');
    const aspect=this.width/this.height;this.camera=new THREE.OrthographicCamera(-110*aspect,110*aspect,110,-110,.1,1200);this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.enableDamping=!this.reduced;this.controls.dampingFactor=.08;this.controls.minPolarAngle=.12;this.controls.maxPolarAngle=Math.PI*.47;this.controls.minZoom=.55;this.controls.maxZoom=4;this.controls.enablePan=true;this.controls.panSpeed=.6;this.controls.rotateSpeed=.5;this.controls.zoomSpeed=.6;this.controls.target.set(0,10,0);
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.12;this.composer=new EffectComposer(this.renderer);this.composer.renderTarget1.samples=4;this.composer.renderTarget2.samples=4;this.composer.addPass(new RenderPass(this.scene,this.camera));this.bloom=new UnrealBloomPass(new THREE.Vector2(this.width,this.height),.55,.42,.38);this.composer.addPass(this.bloom);this.composer.addPass(new OutputPass());
    this.scene.add(new THREE.AmbientLight('#ffffff',2));const sun=new THREE.DirectionalLight('#c4d6ff',2);sun.position.set(-50,150,90);this.scene.add(sun);
    for(const s of stations){let found=geography?.stations?.find(p=>normalize(p.name)===normalize(aliases[s.name]||s.name));if(!found&&s.name==='西安北站')found=geography?.stations?.find(p=>p.name==='北客站');if(!found&&s.name==='建筑科技大学·李家村')found=geography?.stations?.find(p=>p.name==='李家村');if(!found&&s.name==='交通大学·兴庆宫')found=geography?.stations?.find(p=>p.name==='交通大学·兴庆宫'||p.name==='兴庆宫');this.positions.set(s.id,found?project([found.lon,found.lat]):new THREE.Vector3((s.x-550)*.18,0,(s.y-260)*.25));if(found?.en)s.en=found.en.replace(/[<>&"']/g,'');}
    this.makeGround(geography);this.makeNetwork();this.makeLabels();this.reset(true);this.resize();this.setState(this.state);
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(container);this.controls.addEventListener('start',()=>{this.focusAnimation=null;});
    this.raycaster=new THREE.Raycaster();this.pointer=new THREE.Vector2();let down=null;
    this.renderer.domElement.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};});this.renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>6)return;this.pointer.set(e.clientX/this.width*2-1,-e.clientY/this.height*2+1);this.raycaster.setFromCamera(this.pointer,this.camera);const hit=this.raycaster.intersectObjects([...this.stations.values()].map(s=>s.hit),false)[0];if(hit)this.onSelect(hit.object.userData.stationId);});
    this.renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();container.dispatchEvent(new CustomEvent('atlas-context-lost'));});
    this.frame=this.frame.bind(this);requestAnimationFrame(this.frame);
  }
  makeGround(geo){
    const mat=new THREE.MeshBasicMaterial({color:'#10192a',transparent:true,opacity:.55,side:THREE.DoubleSide});this.groundMaterial=mat;const ground=new THREE.Mesh(new THREE.PlaneGeometry(450,360),mat);ground.rotation.x=-Math.PI/2;ground.position.y=-.4;this.scene.add(ground);
    const makeLines=(features,color,opacity,y=0)=>{const points=[];for(const f of features||[])for(let i=1;i<f.points.length;i++){const a=project(f.points[i-1]),b=project(f.points[i]);points.push(a.x,y,a.z,b.x,y,b.z);}const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));const material=new THREE.LineBasicMaterial({color,transparent:true,opacity,depthWrite:false});const object=new THREE.LineSegments(geometry,material);this.scene.add(object);return material;};
    if(geo?.roads?.length){this.roadMaterials.push(makeLines(geo.roads.filter(f=>f.kind==='secondary'),'#4c668b',.20));this.roadMaterials.push(makeLines(geo.roads.filter(f=>f.kind!=='secondary'),'#526b93',.32));this.waterMat=makeLines(geo.water,'#486f88',.38,.08);this.wallMat=makeLines(geo.walls,'#b59e7a',.6,.16);this.parkMat=makeLines(geo.parks,'#47776b',.27,.04);}
    else {const grid=new THREE.GridHelper(360,36,'#243650','#1a283f');grid.material.transparent=true;grid.material.opacity=.35;this.scene.add(grid);document.querySelector('#map-credit').textContent='地面与站点位置为示意';document.querySelector('#map-credit').removeAttribute('href');}
    const ticks=[];for(let x=-160;x<=160;x+=20)for(let z=-100;z<=100;z+=20)ticks.push(x,0,z);const stars=new THREE.BufferGeometry();stars.setAttribute('position',new THREE.Float32BufferAttribute(ticks,3));this.groundPoints=new THREE.Points(stars,new THREE.PointsMaterial({color:'#70809a',size:.32,transparent:true,opacity:.22}));this.scene.add(this.groundPoints);
    this.timePlane=new THREE.Mesh(new THREE.PlaneGeometry(240,165),new THREE.MeshBasicMaterial({color:'#728ab5',transparent:true,opacity:.023,depthWrite:false,side:THREE.DoubleSide}));this.timePlane.rotation.x=-Math.PI/2;this.scene.add(this.timePlane);
    const border=new THREE.EdgesGeometry(this.timePlane.geometry);this.planeBorder=new THREE.LineSegments(border,new THREE.LineBasicMaterial({color:'#6f88ba',transparent:true,opacity:.13}));this.planeBorder.rotation.x=-Math.PI/2;this.scene.add(this.planeBorder);
  }
  heightAt(line,index,dir,view=this.state.view){if(view==='flat')return .7;if(view==='layers')return 4+Number(line.id)*5;return 5+Math.max(0,lastDeparture(line,index,dir,this.state.day)-1335)*.29;}
  makeNetwork(){
    for(const line of lines){const color=colors[Number(line.id)-1];const group=new THREE.Group();this.scene.add(group);const points=line.stops.map(id=>this.positions.get(id));
      for(let i=0;i<points.length-1;i++)for(const dir of [1,-1]){
        const color=colors[Number(line.id)-1];const mat=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.95});const glow=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.06,depthWrite:false,blending:THREE.AdditiveBlending});const tube=new THREE.Mesh(new THREE.BufferGeometry(),mat),halo=new THREE.Mesh(new THREE.BufferGeometry(),glow);group.add(tube,halo);
        this.meshes.push({line,index:i,dir,tube,halo,points,curve:null,heights:[0,0]});
      }
      for(let i=0;i<line.stops.length;i++)for(const dir of [1,-1]){const dot=new THREE.Mesh(new THREE.SphereGeometry(.31,8,6),new THREE.MeshBasicMaterial({color:new THREE.Color('#ffffff').multiplyScalar(1.25),transparent:true}));dot.position.copy(points[i]);this.scene.add(dot);this.railDots.push({dot,line,index:i,dir});}
      for(const dir of [1,-1]){const dot=new THREE.Mesh(new THREE.SphereGeometry(.5,10,8),new THREE.MeshBasicMaterial({color:'#fff'}));const halo=new THREE.Mesh(new THREE.SphereGeometry(1.05,10,8),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.17,depthWrite:false}));dot.add(halo);this.scene.add(dot);this.trainDots.push({line,dir,dot});}
    }
    for(const s of stations){const p=this.positions.get(s.id),interchange=linesAt(s.id).length>1;const material=new THREE.MeshBasicMaterial({color:'#dfeaff',transparent:true,opacity:1});const ring=new THREE.Mesh(new THREE.TorusGeometry(interchange?.68:.38,interchange?.18:.12,6,14),material);ring.rotation.x=-Math.PI/2;ring.position.copy(p);this.scene.add(ring);
      const core=new THREE.Mesh(new THREE.SphereGeometry(.95,8,6),new THREE.MeshBasicMaterial({visible:false}));core.position.copy(p);core.userData.stationId=s.id;this.scene.add(core);
      const stemGeo=new THREE.BufferGeometry().setFromPoints([p.clone(),p.clone()]);const stem=new THREE.Line(stemGeo,new THREE.LineBasicMaterial({color:'#778daf',transparent:true,opacity:interchange?.28:.13}));this.scene.add(stem);
      const groundDot=new THREE.Mesh(new THREE.CircleGeometry(interchange?.8:.4,12),new THREE.MeshBasicMaterial({color:'#557396',transparent:true,opacity:.28,side:THREE.DoubleSide}));groundDot.rotation.x=-Math.PI/2;groundDot.position.copy(p);groundDot.position.y=.08;this.scene.add(groundDot);this.stations.set(s.id,{station:s,ring,hit:core,stem,groundDot,y:0,target:0});
    }
  }
  makeLabels(){for(const s of stations){const button=document.createElement('button');button.className='station-label';button.setAttribute('aria-label',`查看${s.name}站详情`);button.innerHTML=`${s.name.replace('建筑科技大学·','').replace('交通大学·','')}<small>${stationEnglish(s)}</small>`;button.addEventListener('click',()=>this.onSelect(s.id));this.labelRoot.append(button);this.labels.push({station:s,element:button});}this.labels.sort((a,b)=>(priority.get(a.station.name)??100)-(priority.get(b.station.name)??100));}
  buildCurve(m,h1,h2){const p=m.points,a=p[m.index].clone(),b=p[m.index+1].clone(),prev=p[Math.max(0,m.index-1)],next=p[Math.min(p.length-1,m.index+2)];const normal=new THREE.Vector3(-(b.z-a.z),0,b.x-a.x).normalize().multiplyScalar(.4*m.dir);a.add(normal);b.add(normal);a.y=h1;b.y=h2;const c1=a.clone().add(b.clone().sub(new THREE.Vector3(prev.x+normal.x,h1-(h2-h1),prev.z+normal.z)).multiplyScalar(.14));const c2=b.clone().sub(new THREE.Vector3(next.x+normal.x,h2+(h2-h1),next.z+normal.z).sub(a).multiplyScalar(.14));const curve=new THREE.CubicBezierCurve3(a,c1,c2,b);const old=m.tube.geometry.attributes.position?.array.slice();const oldHalo=m.halo.geometry.attributes.position?.array.slice();m.tube.geometry.dispose();m.halo.geometry.dispose();m.tube.geometry=new THREE.TubeGeometry(curve,16,.29,5,false);m.halo.geometry=new THREE.TubeGeometry(curve,16,.7,5,false);m.curve=curve;if(old&&old.length===m.tube.geometry.attributes.position.array.length&&!this.reduced){m.morph={old,oldHalo,target:m.tube.geometry.attributes.position.array.slice(),targetHalo:m.halo.geometry.attributes.position.array.slice(),start:performance.now()};}}
  setState(state,journey=null,reach=null){const old=this.state;this.state={...state};const themeChanged=old.theme!==state.theme||!this.themeReady;this.journey=journey;this.reach=reach;const routeEdges=new Set();if(state.mode==='journey'&&journey)for(const leg of journey.legs)for(let i=0;i<leg.stationIds.length-1;i++)routeEdges.add(`${leg.lineId}|${leg.stationIds[i]}|${leg.stationIds[i+1]}`);
    const day=state.theme==='day';this.bloom.enabled=!day;if(old.view!==state.view){const target=this.controls.target.clone(),flat=state.view==='flat';this.focusAnimation={from:target.clone(),to:target,position:this.camera.position.clone(),targetPosition:target.clone().add(flat?new THREE.Vector3(0,230,.1):new THREE.Vector3(35,125,205)),zoom:this.camera.zoom,targetZoom:this.camera.zoom,start:performance.now(),duration:this.reduced?1:750};}if(themeChanged){this.renderer.toneMapping=day?THREE.NoToneMapping:THREE.ACESFilmicToneMapping;this.themeReady=true;this.scene.background.set(day?'#e9eeec':'#0b1020');this.scene.fog.color.copy(this.scene.background);this.groundMaterial.color.set(day?'#dee5e1':'#10192a');this.roadMaterials.forEach((m,i)=>{m.color.set(day?'#8d9eac':i?'#526b93':'#4c668b');m.opacity=day?(i?.32:.2):(i?.32:.20);});if(this.waterMat)this.waterMat.color.set(day?'#779aaf':'#486f88');if(this.wallMat)this.wallMat.color.set(day?'#a19979':'#b59e7a');this.groundPoints.material.color.set(day?'#9aaab3':'#70809a');}
    for(const m of this.meshes){
      const from=m.line.stops[m.dir===1?m.index:m.index+1],to=m.line.stops[m.dir===1?m.index+1:m.index];
      const key=`${m.line.id}|${from}|${to}`;
      const dim=(state.selectedLine&&state.selectedLine!==m.line.id)||(state.mode==='journey'&&!routeEdges.has(key))||(reach&&!reach.edges.has(key));
      const last=lastDeparture(m.line,m.dir===1?m.index:m.index+1,m.dir,state.day)+m.line.times[m.index];
      const active=state.time<=last,palette=day?dayColors:colors;
      const reached=reach?.destinations.get(to);
      const reachColor=reach?.lost.has(to)?(day?'#aa672b':'#edb775'):reached?.duration<=30?(day?'#237e65':'#79dbbf'):(day?'#336cba':'#91b5fa');
      m.tube.material.color.set(reach&&!dim?reachColor:active?palette[Number(m.line.id)-1]:day?'#b8c4c9':'#354359');
      if(active&&!day)m.tube.material.color.multiplyScalar(1.3);
      m.tube.material.opacity=dim?(reach?.09:state.mode==='journey'?.22:.10):active?.96:.35;
      m.halo.material.color.copy(m.tube.material.color);m.halo.material.opacity=day||dim||!active?0:.075;
      const heights=[this.heightAt(m.line,m.index,m.dir),this.heightAt(m.line,m.index+1,m.dir)];
      if(m.heights[0]!==heights[0]||m.heights[1]!==heights[1]){m.heights=heights;this.buildCurve(m,...heights);}
    }
    for(const item of this.stations.values()){
      const id=item.station.id,ls=linesAt(id),r=reach?.destinations.get(id),origin=reach&&id===state.origin;
      item.target=Math.max(...ls.flatMap(l=>[1,-1].map(dir=>this.heightAt(l,l.stops.indexOf(id),dir))));
      const muted=(state.selectedLine&&!ls.some(l=>l.id===state.selectedLine))||(reach&&!r&&!origin)||(state.mode==='journey'&&journey&&!journey.stationIds.includes(id));
      const color=reach?(origin?(day?'#445a9d':'#e3e9ff'):reach.lost.has(id)?(day?'#aa672b':'#edb775'):r?.duration<=30?(day?'#237e65':'#79dbbf'):(day?'#336cba':'#91b5fa')):(day?'#fbffff':'#e6efff');
      item.ring.material.color.set(color);item.ring.material.opacity=muted?.12:.95;item.ring.scale.setScalar(origin?2:r?1.45:1);
      item.stem.material.color.set(reach?color:day?'#8d9eac':'#778daf');item.stem.material.opacity=muted?.025:reach?.4:ls.length>1?.25:.11;
      item.groundDot.material.color.set(reach?color:day?'#8d9eac':'#557396');item.groundDot.material.opacity=muted?.06:reach?.45:.28;item.groundDot.scale.setScalar(origin?4:r?2:1);
      if(this.reduced)item.y=item.target;
    }
    for(const r of this.railDots){
      r.target=this.heightAt(r.line,r.index,r.dir);
      const id=r.line.stops[r.index],dim=(state.selectedLine&&state.selectedLine!==r.line.id)||(reach&&!reach.destinations.has(id)&&id!==state.origin)||(state.mode==='journey'&&journey&&!journey.stationIds.includes(id));
      r.dot.material.opacity=dim?.07:state.time>lastDeparture(r.line,r.index,r.dir,state.day)?.1:.95;if(this.reduced)r.dot.position.y=r.target;
    }
    this.timePlane.visible=state.view==='time';this.planeBorder.visible=this.timePlane.visible;this.timePlane.position.y=5+Math.max(0,state.time-1335)*.29;this.planeBorder.position.y=this.timePlane.position.y;
    for(const label of this.labels){const id=label.station.id,r=reach?.destinations.get(id);label.element.classList.toggle('selected',id===state.selectedStation);for(const cls of ['reach-near','reach-far','reach-lost','reach-origin'])label.element.classList.remove(cls);if(reach){if(id===state.origin)label.element.classList.add('reach-origin');else if(r)label.element.classList.add(reach.lost.has(id)?'reach-lost':r.duration<=30?'reach-near':'reach-far');}}
    this.updateTrains();
  }
  updateTrains(){for(const t of this.trainDots){const last=t.dir===1?t.line.lastForward:t.line.lastBackward;const start=last+(this.state.day==='weekend'?12:0),elapsed=this.state.time-start,total=t.line.times.reduce((a,b)=>a+b,0);t.dot.visible=this.state.mode!=='reach'&&elapsed>=0&&elapsed<=total;const dim=this.state.selectedLine&&this.state.selectedLine!==t.line.id;t.dot.material.opacity=dim?.15:1;t.dot.material.transparent=!!dim;if(!t.dot.visible)continue;let remain=elapsed;const indexes=t.dir===1?t.line.times.map((_,i)=>i):t.line.times.map((_,i)=>i).reverse();for(const i of indexes){if(remain<=t.line.times[i]){const m=this.meshes.find(m=>m.line.id===t.line.id&&m.dir===t.dir&&m.index===i);const fraction=remain/t.line.times[i];t.dot.position.copy(m.curve.getPoint(t.dir===1?fraction:1-fraction));break;}remain-=t.line.times[i];}}}
  resize(){this.width=this.container.clientWidth;this.height=this.container.clientHeight;const mobile=this.width<=820;const size=mobile?128:100;const aspect=this.width/this.height;this.camera.left=-size*aspect;this.camera.right=size*aspect;this.camera.top=size;this.camera.bottom=-size;this.camera.setViewOffset(this.width,this.height,mobile?-4:-142,mobile?20:-12,this.width,this.height);this.camera.updateProjectionMatrix();this.renderer.setSize(this.width,this.height);this.composer?.setSize(this.width,this.height);for(const label of this.labels){label.element.hidden=false;label.width=label.element.offsetWidth;label.height=label.element.offsetHeight;}}
  reset(immediate=false){const mobile=this.width<=820;const target=new THREE.Vector3(mobile?2:-6,12,2),position=target.clone().add(this.state.view==='flat'?new THREE.Vector3(0,230,.1):new THREE.Vector3(35,125,205));if(immediate||this.reduced){this.controls.target.copy(target);this.camera.position.copy(position);this.camera.zoom=mobile?1:1;this.camera.updateProjectionMatrix();this.controls.update();}else this.focusAnimation={from:this.controls.target.clone(),to:target,position:this.camera.position.clone(),targetPosition:position,zoom:this.camera.zoom,targetZoom:mobile?1:1,start:performance.now(),duration:650};}
  focusStation(id){const p=this.positions.get(id);if(!p)return;const y=this.stations.get(id)?.target||10;this.focusTo(new THREE.Vector3(p.x,y*.5,p.z),innerWidth<=820?1.6:1.65);}
  focusLine(id){const line=lines.find(l=>l.id===id),box=new THREE.Box3();for(const sid of line.stops)box.expandByPoint(this.positions.get(sid));const center=box.getCenter(new THREE.Vector3());center.y=15;this.focusTo(center,innerWidth<=820?1:1.1);}
  focusTo(target,zoom){const offset=this.camera.position.clone().sub(this.controls.target);this.focusAnimation={from:this.controls.target.clone(),to:target,position:this.camera.position.clone(),targetPosition:target.clone().add(offset),zoom:this.camera.zoom,targetZoom:zoom,start:performance.now(),duration:this.reduced?1:650};}
  zoom(factor){this.camera.zoom=THREE.MathUtils.clamp(this.camera.zoom*factor,.55,4);this.camera.updateProjectionMatrix();}
  layoutLabels(){
    const occupied=[],mobile=this.width<=820,maxLabels=mobile?10:24,p=new THREE.Vector3();let count=0;
    const first=this.state.selectedStation||(this.state.mode!=='atlas'?this.state.origin:null);const sorted=first?[...this.labels].sort((a,b)=>(a.station.id===first?-1:b.station.id===first?1:0)):this.labels;
    for(const {station:s,element,width,height} of sorted){
      const item=this.stations.get(s.id),onLine=this.state.selectedLine&&linesAt(s.id).some(l=>l.id===this.state.selectedLine),selected=s.id===this.state.selectedStation,endpoint=(this.state.mode==='journey'&&(s.id===this.state.origin||s.id===this.state.destination))||(this.reach&&s.id===this.state.origin),important=priority.has(s.name);
      let show=selected||endpoint||(count<maxLabels&&(this.state.selectedLine?onLine:this.reach?this.reach.destinations.has(s.id)&&(important||this.camera.zoom>1.3):important||this.camera.zoom>1.9));
      if(show){
        p.copy(item.ring.position);p.y+=1.1;p.project(this.camera);const anchorX=(p.x*.5+.5)*this.width,anchorY=(-p.y*.5+.5)*this.height-8,w=width||90,h=height||36;
        show=false;
        for(const [ox,oy] of [[0,0],[42,-8],[-42,-8],[0,-40],[84,-4],[-84,-4]]){
          const x=anchorX+ox,y=anchorY+oy,rect={left:x-w/2,right:x+w/2,top:y-h,bottom:y};
          const blocked=mobile?(y<100||y>this.height-275||(x>this.width-66&&y>this.height-385)):(rect.left<340&&y<this.height-152)||y<90||y>this.height-159||(x>350&&x<580&&y<190);
          if(p.z< -1||p.z>1||x<w/2+7||x>this.width-w/2-7||blocked||occupied.some(r=>rect.left<r.right+7&&rect.right>r.left-7&&rect.top<r.bottom+7&&rect.bottom>r.top-7))continue;
          occupied.push(rect);element.style.left=`${x}px`;element.style.top=`${y}px`;element.style.setProperty('--stem-length',`${Math.hypot(ox,9-oy)}px`);element.style.setProperty('--stem-angle',`${Math.atan2(ox,9-oy)}rad`);element.style.opacity=this.state.selectedLine&&!onLine&&!selected?.35:1;count++;show=true;break;
        }
      }
      element.hidden=!show;
    }
  }
  frame(now){requestAnimationFrame(this.frame);if(document.hidden)return;const dt=Math.min((now-this.lastFrame)/1000,.05);this.lastFrame=now;if(this.focusAnimation){const a=this.focusAnimation,t=Math.min((now-a.start)/a.duration,1),k=1-Math.pow(1-t,3);this.controls.target.lerpVectors(a.from,a.to,k);this.camera.position.lerpVectors(a.position,a.targetPosition,k);this.camera.zoom=THREE.MathUtils.lerp(a.zoom,a.targetZoom,k);this.camera.updateProjectionMatrix();if(t===1)this.focusAnimation=null;}
    for(const item of this.stations.values()){item.y=THREE.MathUtils.lerp(item.y,item.target,Math.min(dt*9,1));item.ring.position.y=item.y;item.hit.position.y=item.y;const coords=item.stem.geometry.attributes.position;coords.setY(1,item.y);coords.needsUpdate=true;}
    this.controls.update();for(const m of this.meshes){if(!m.morph)continue;const a=m.morph,t=Math.min((now-a.start)/650,1),k=1-Math.pow(1-t,3);for(const [mesh,from,to] of [[m.tube,a.old,a.target],[m.halo,a.oldHalo,a.targetHalo]]){const attr=mesh.geometry.attributes.position;for(let i=0;i<attr.array.length;i++)attr.array[i]=from[i]+(to[i]-from[i])*k;attr.needsUpdate=true;}if(t===1)m.morph=null;}for(const r of this.railDots)r.dot.position.y=THREE.MathUtils.lerp(r.dot.position.y,r.target,Math.min(dt*9,1));this.composer.render();this.layoutLabels();
  }
}
