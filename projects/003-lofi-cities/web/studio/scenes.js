import { advanceMotion } from './motion.js';

const W=1920,H=1080,cache=new Map(),owners=new WeakMap(),sprites=new Map();
export const artwork=Object.fromEntries(['study','forest','coast','train','neon','snow'].map(id=>[id,new URL('../assets/scenes/'+id+'-v3.png',import.meta.url).href]));
artwork['train-frame']=new URL('../assets/scenes/train-frame-v4.png',import.meta.url).href;
artwork['train-landscape']=new URL('../assets/scenes/train-landscape-v4.png',import.meta.url).href;
function asset(id) {
  if(cache.has(id))return cache.get(id);
  const img=new Image(),entry={img,status:'loading'};
  entry.ready=new Promise(resolve=>{img.onload=()=>{entry.status='ready';resolve();};img.onerror=()=>{entry.status='error';resolve();};});
  img.src=artwork[id];cache.set(id,entry);return entry;
}
const fract=n=>n-Math.floor(n),random=n=>fract(Math.sin(n*127.13+41.7)*43758.5453);
function polygon(c,points){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x*W,y*H):c.moveTo(x*W,y*H));c.closePath();c.clip();}
function sprite(color) {
  if(sprites.has(color))return sprites.get(color);
  const s=document.createElement('canvas');s.width=s.height=96;const c=s.getContext('2d'),g=c.createRadialGradient(48,48,0,48,48,48);
  g.addColorStop(0,'rgba('+color+',.8)');g.addColorStop(.35,'rgba('+color+',.26)');g.addColorStop(1,'rgba('+color+',0)');
  c.fillStyle=g;c.fillRect(0,0,96,96);sprites.set(color,s);return s;
}
function glow(c,x,y,r,alpha,color='255,180,83'){
  c.save();c.globalAlpha=alpha;c.drawImage(sprite(color),(x-r)*W,y*H-r*W,r*W*2,r*W*2);c.restore();
}
function warp(c,img,t,rect,amplitude,phase=0) {
  const [x,y,w,h]=rect,top=y*H,left=x*W,height=h*H,width=w*W;
  c.save();c.beginPath();c.rect(left,top,width,height);c.clip();
  // Pinned boundaries keep surrounding architecture still while organic detail bends.
  for(let offset=0;offset<height;offset+=4){
    const v=offset/height,edge=Math.sin(Math.PI*v)**2,dx=Math.sin(t*1.9+v*3+phase)*amplitude*edge;
    const band=Math.min(4,height-offset);
    c.drawImage(img,x*img.width,(top+offset)/H*img.height,w*img.width,band/H*img.height,left+dx,top+offset,width,band);
  }
  c.restore();
}
function water(c,img,t,points,top,bottom,amplitude=7) {
  c.save();polygon(c,points);
  for(let y=top*H;y<bottom*H;y+=4){
    const depth=(y-top*H)/((bottom-top)*H),wave=Math.sin(y*.063-t*3.1),dx=(wave+Math.sin(y*.017+t*1.7)*.6)*amplitude*(.2+depth);
    const dy=Math.sin(y*.038-t*2)*1.5*(.2+depth),sy=Math.max(0,Math.min(img.height-6,(y+dy)/H*img.height));
    c.drawImage(img,0,sy,img.width,4/H*img.height,dx,y,W,4);
  }
  // Small moving highlights ride on the displaced texture rather than a flat overlay.
  c.globalCompositeOperation='screen';c.lineWidth=1.2;
  for(let i=0;i<55;i++){
    const y=(top+random(i+33)*(bottom-top))*H,x=random(i+2)*W+Math.sin(t*1.5+i)*12,alpha=.08+.19*Math.max(0,Math.sin(t*2+i));
    c.strokeStyle='rgba(213,231,239,'+alpha+')';c.beginPath();c.moveTo(x,y);c.lineTo(x+6+random(i)*29,y);c.stroke();
  }
  c.restore();
}
function plume(c,t,x,y,height,width,color='219,228,239',strength=.35,speed=.15) {
  c.save();c.globalCompositeOperation='screen';
  for(let i=0;i<22;i++){
    const life=fract(t*speed+i/22),rise=life*height,drift=Math.sin(life*5+t*.6+i*.08)*width*life+life*width*.65;
    const r=width*(.14+life*.52),alpha=Math.sin(Math.PI*life)*strength/2.3;
    c.globalAlpha=alpha;c.drawImage(sprite(color),x*W+drift-r,y*H-rise-r,r*2,r*2);
  }
  c.restore();
}
function fire(c,img,t) {
  warp(c,img,t,[.512,.682,.067,.065],5,.3);
  c.save();c.globalCompositeOperation='screen';
  const x=.539*W,y=.735*H;
  for(let i=0;i<7;i++){
    const phase=t*6+i*1.7,h=18+12*Math.sin(phase*.71)+i*2,dx=(i-3)*7,sway=Math.sin(phase)*9;
    c.fillStyle=i%2?'rgba(255,171,49,.36)':'rgba(255,90,20,.25)';
    c.beginPath();c.moveTo(x+dx-8,y);c.quadraticCurveTo(x+dx-13+sway,y-h*.6,x+dx+sway,y-h);c.quadraticCurveTo(x+dx+13+sway,y-h*.38,x+dx+8,y);c.fill();
  }
  glow(c,.54,.731,.085,.27+.08*Math.sin(t*5));
  for(let i=0;i<8;i++){const p=fract(t*.25+i*.19);c.fillStyle='rgba(255,193,96,'+(1-p)*.6+')';c.fillRect(x+Math.sin(i*4+p*5)*24,y-p*95,2,3);}
  c.restore();
}
function neon(c,img,t) {
  const regions=[[.693,.143,.027,.20],[.208,.239,.019,.09],[.952,.189,.025,.121],[.814,.589,.065,.26]];
  c.save();c.globalCompositeOperation='screen';
  for(let i=0;i<regions.length;i++){
    const [x,y,w,h]=regions[i];c.globalAlpha=.12+.25*(.5+.5*Math.sin(t*.8+i*2));
    c.drawImage(img,x*img.width,y*img.height,w*img.width,h*img.height,x*W,y*H,w*W,h*H);
  }
  c.restore();
}
function train(c,background,frame,t) {
  const width=background.width/background.height*H*.66,height=H*.66,travel=t*115,offset=travel%(width*2);
  c.save();c.fillStyle='#111e35';c.fillRect(0,0,W,H);
  for(let i=-1;i<4;i++){
    c.save();const x=i*width-offset;
    if(i%2!==0){c.translate(x+width,0);c.scale(-1,1);c.drawImage(background,0,H*.025,width,height);}
    else c.drawImage(background,x,H*.025,width,height);c.restore();
  }
  // Nearby posts travel faster than the distant landscape to give a sense of depth.
  const poleX=W-(t*560)%(W+1100);
  c.fillStyle='#0e1728';c.fillRect(poleX,100,9,650);c.fillRect(poleX-48,181,106,6);
  c.strokeStyle='#111a2c';c.lineWidth=2;c.beginPath();c.moveTo(poleX-1200,194);c.quadraticCurveTo(poleX-450,260,poleX,181);c.quadraticCurveTo(poleX+520,247,poleX+1300,200);c.stroke();
  c.drawImage(frame,0,0,W,H);c.restore();
}
function rain(c,t,intensity,id){
  c.save();
  if(id==='study')polygon(c,[[.415,.113],[.874,.055],[.875,.55],[.413,.546]]);
  if(id==='train')polygon(c,[[.322,.125],[.857,.081],[.858,.54],[.315,.555]]);
  if(id==='neon')polygon(c,[[.45,0],[1,0],[1,1],[.4,1],[.35,.68],[.36,.35]]);
  for(let i=0;i<Math.round(310*intensity);i++){
    const depth=.35+random(i+500)*.65,x=fract(random(i)*1.7-t*.016*depth)*W,y=fract(random(i+300)+t*(.22+depth*.3))*H;
    c.strokeStyle='rgba(195,220,242,'+(.15+depth*.2)+')';c.lineWidth=.8+depth*1.2;c.beginPath();c.moveTo(x,y);c.lineTo(x-6*depth,y+21*depth);c.stroke();
  }
  c.restore();
}
function weather(c,t,intensity,id){
  if(['study','train','neon'].includes(id)){rain(c,t,intensity,id);return;}
  if(id==='snow'){
    for(let i=0;i<Math.round(225*intensity);i++){
      const depth=.3+random(i+78),x=fract(random(i)+t*.018+Math.sin(t*.5+i)*.012)*W,y=fract(random(i+70)+t*.032*depth)*H;
      c.fillStyle='rgba(225,239,249,'+(.3+depth*.3)+')';c.beginPath();c.arc(x,y,1.3+depth*2.2,0,Math.PI*2);c.fill();
    }
  } else if(id==='forest'){
    for(let i=0;i<Math.round(28*intensity);i++){
      const x=.18+random(i)*.65+Math.sin(t*.6+i)*.025,y=.49+random(i+44)*.36+Math.sin(t*.8+i*2)*.019,alpha=.2+.6*Math.max(0,Math.sin(t*1.2+i*4));
      glow(c,x,y,.008,alpha,'199,230,142');c.fillStyle='rgba(232,244,178,'+alpha+')';c.fillRect(x*W,y*H,2.5,2.5);
    }
  } else if(id==='coast'){
    for(let i=0;i<Math.round(8*intensity);i++){
      const x=fract(random(i)+t*.011)*W,y=(.26+random(i+50)*.065+Math.sin(t*1.3+i)*.003)*H,wing=Math.sin(t*5+i)*3;
      c.strokeStyle='rgba(38,48,67,.65)';c.lineWidth=1.5;c.beginPath();c.moveTo(x-6,y+wing);c.quadraticCurveTo(x-2,y-2,x,y);c.quadraticCurveTo(x+2,y-2,x+6,y+wing);c.stroke();
    }
  }
}
function sceneDynamics(c,img,t,id){
  if(id==='study'){
    warp(c,img,t,[.89,.12,.108,.52],7);warp(c,img,t,[.131,.008,.103,.204],4,1);
    plume(c,t,.711,.704,135,37,'227,226,219',.6,.17);
    c.save();c.globalCompositeOperation='screen';c.globalAlpha=.08+.09*(.5+.5*Math.sin(t*1.1));
    c.drawImage(img,.416*img.width,.26*img.height,.4*img.width,.24*img.height,.416*W,.26*H,.4*W,.24*H);c.restore();
  }
  if(id==='forest'){
    water(c,img,t,[[.298,.576],[.254,.606],[.273,.667],[.299,.72],[.329,.758],[.239,.775],[.151,.74],[.153,.688],[.202,.658],[.185,.636],[.235,.596]],.576,.78,7);
    warp(c,img,t,[.025,.022,.239,.14],5);fire(c,img,t);plume(c,t,.543,.712,160,38,'161,184,199',.22,.095);
  }
  if(id==='coast'){
    water(c,img,t,[[.47,.435],[.955,.413],[.945,.478],[.897,.527],[.856,.601],[.915,.65],[.839,.726],[.659,.679],[.555,.616],[.463,.593],[.421,.568],[.353,.559],[.382,.469]],.412,.734,9);
    warp(c,img,t,[.25,.035,.20,.141],5);plume(c,t,.24,.745,80,24,'240,220,196',.45,.18);plume(c,t,.425,.751,85,22,'240,220,196',.4,.16);
  }
  if(id==='neon'){
    neon(c,img,t);water(c,img,t,[[.293,.787],[.414,.741],[.568,.794],[.62,.94],[.357,.96],[.227,.894]],.74,.963,4);
    warp(c,img,t,[.75,.74,.247,.255],7,1);warp(c,img,t,[.21,.015,.16,.155],5);
  }
  if(id==='snow'){
    warp(c,img,t,[.055,.03,.227,.261],7);warp(c,img,t,[.88,.013,.117,.388],4,2);
    plume(c,t,.799,.242,160,69,'207,220,240',.44,.085);
    plume(c,t*.35,.32,.474,55,350,'184,207,236',.08,.045);
  }
  if(id==='train')plume(c,t,.448,.718,100,27,'224,222,213',.4,.15);
}
export function createVisual(canvas,id){
  const token={};owners.set(canvas,token);
  delete canvas.dataset.layers;
  const preview=canvas.hasAttribute('data-preview');canvas.width=preview?640:1600;canvas.height=preview?360:900;
  const c=canvas.getContext('2d'),entry=asset(id),frame=id==='train'?asset('train-frame'):null,landscape=id==='train'?asset('train-landscape'):null;
  let lastSettings,lastTime=0,clock={previous:null,weather:0,scene:0};
  function draw(time,settings){
    if(owners.get(canvas)!==token)return;
    lastSettings=settings;lastTime=time;clock=advanceMotion(clock,time,settings);
    c.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);c.globalAlpha=1;c.globalCompositeOperation='source-over';c.filter='none';c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
    canvas.dataset.style=settings.style;canvas.dataset.artwork=entry.status;
    canvas.dataset.motionTime=clock.scene.toFixed(3);canvas.dataset.weatherTime=clock.weather.toFixed(3);
    if(entry.status!=='ready'){
      c.fillStyle='#1b2a36';c.fillRect(0,0,W,H);c.fillStyle='#d0d8cf';c.font='26px sans-serif';c.textAlign='center';c.fillText(entry.status==='error'?'场景图片加载失败，请刷新重试':'正在打开这个空间…',W/2,H/2);return;
    }
    c.drawImage(entry.img,0,0,W,H);
    const t=clock.scene,enabled=settings.dynamics!==false&&Number(settings.activity??65)>0;
    if(id==='train'&&frame.status==='ready'&&landscape.status==='ready'){
      train(c,landscape.img,frame.img,enabled?t:0);canvas.dataset.layers='foreground-and-landscape';
    }
    if(enabled)sceneDynamics(c,entry.img,t,id);
    if(settings.particles)weather(c,clock.weather,settings.intensity/100,id);
    if(settings.lighting){
      c.save();c.globalCompositeOperation='screen';
      const lights={study:[.305,.451,.19],forest:[.542,.722,.15],coast:[.845,.385,.18],train:[.2,.392,.20],neon:[.65,.67,.21],snow:[.725,.727,.14]};
      const [x,y,r]=lights[id];glow(c,x,y,r,.18+.07*Math.sin(clock.weather*.85));
      if(id==='forest')glow(c,.718,.43,.15,.06+.03*Math.sin(clock.weather*1.2));
      if(id==='neon')glow(c,.71,.35,.14,.16+.09*Math.sin(clock.weather*.7),'112,186,255');c.restore();
    }
    if(settings.brightness<100){c.fillStyle='rgba(5,12,24,'+(1-settings.brightness/100)*.76+')';c.fillRect(0,0,W,H);}
  }
  const ready=Promise.all([entry.ready,...(frame?[frame.ready,landscape.ready]:[])]);
  ready.then(()=>{if(lastSettings&&canvas.isConnected&&owners.get(canvas)===token)draw(lastTime,lastSettings);});
  return {draw,ready};
}
