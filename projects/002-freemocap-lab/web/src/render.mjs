import {cameraProject,validPoint} from './math.mjs';
import {EDGES,LEFT} from './data.mjs';
const C={green:'#62e5be',blue:'#73aaff',amber:'#f1ba70',muted:'#91a4b3',grid:'#283b47'};
export function prepare(canvas){
  const {width,height}=canvas.getBoundingClientRect();
  if(!width||!height) return null;
  const ratio=Math.min(devicePixelRatio||1,2);
  if(canvas.width!==Math.round(width*ratio)||canvas.height!==Math.round(height*ratio)){canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);}
  const ctx=canvas.getContext('2d');ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,width,height);
  return {ctx,width,height};
}
function line(ctx,a,b,color,width=1,dash=[]){if(!a||!b)return;ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();ctx.setLineDash([]);}
function circle(ctx,p,r,fill,stroke){if(!p)return;ctx.beginPath();ctx.arc(p[0],p[1],r,0,Math.PI*2);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.5;ctx.stroke();}}
function text(ctx,s,x,y,color=C.muted,size=11,align='left'){ctx.fillStyle=color;ctx.font=`${size}px "Segoe UI","Microsoft YaHei",sans-serif`;ctx.textAlign=align;ctx.fillText(s,x,y);}
function bones(ctx,points,project,small=false){
  const projected=points.map(project);
  for(const [a,b] of EDGES){const color=LEFT.has(b)?C.green:b===0?'#c2dfd3':C.blue;line(ctx,projected[a],projected[b],color,small?1.6:3);}
  projected.forEach((p,i)=>{if(!p)return;if(!small&&i>4){circle(ctx,p,7,(LEFT.has(i)?'#62e5be':'#73aaff')+'15');}circle(ctx,p,small?1.5:i<5?2.5:4,'#111b23',LEFT.has(i)?C.green:C.blue);});
}
export function renderScene(canvas,points,{yaw=.5,pitch=.17,radius=3.8,trail=[]}={}){
  const s=prepare(canvas);if(!s)return;const {ctx,width:w,height:h}=s;
  const target=[0,.85,0],eye=[Math.sin(yaw)*radius*Math.cos(pitch),.85+Math.sin(pitch)*radius,Math.cos(yaw)*radius*Math.cos(pitch)];
  const project=p=>cameraProject(p,eye,target,w,h,1.05);
  for(let k=-8;k<=8;k++){const t=k*.25;line(ctx,project([-2,0,t]),project([2,0,t]),k===0?'#37545c':C.grid,1);line(ctx,project([t,0,-2]),project([t,0,2]),k===0?'#37545c':C.grid,1);}
  const origin=project([0,.004,0]);line(ctx,origin,project([.45,.004,0]),'#a56f6f',1.5);line(ctx,origin,project([0,.45,0]),'#74a78b',1.5);line(ctx,origin,project([0,.004,.45]),'#638aba',1.5);
  for(let i=1;i<trail.length;i++) line(ctx,project(trail[i-1]),project(trail[i]),`rgba(241,186,112,${.12+.5*i/trail.length})`,1.5);
  if(points) bones(ctx,points,project);
  if(points && !points.some(validPoint)) text(ctx,'此帧没有有效关键点',w/2,h/2,C.muted,14,'center');
}
export function renderCamera(canvas,points,side=false){
  const s=prepare(canvas);if(!s)return;const {ctx,width:w,height:h}=s;
  for(let i=1;i<4;i++){line(ctx,[w*i/4,0],[w*i/4,h],'#22323e66');line(ctx,[0,h*i/4],[w,h*i/4],'#22323e66');}
  const eye=side?[3.2,.9,.1]:[0,.9,3.2];
  bones(ctx,points,p=>cameraProject(p,eye,[0,.9,0],w,h,1.65),true);
}
export function renderChart(canvas,values,index){
  const s=prepare(canvas);if(!s)return;const {ctx,width:w,height:h}=s;
  for(let y=0;y<=2;y++) line(ctx,[0,5+y*(h-10)/2],[w,5+y*(h-10)/2],'#293b4555');
  const pt=(v,i)=>[i/Math.max(1,values.length-1)*w,h-5-v/180*(h-10)];
  ctx.beginPath();let connected=false;
  values.forEach((v,i)=>{if(!Number.isFinite(v)){connected=false;return;}const p=pt(v,i);if(connected)ctx.lineTo(...p);else ctx.moveTo(...p);connected=true;});ctx.strokeStyle=C.green;ctx.lineWidth=1.8;ctx.stroke();
  const x=index/Math.max(1,values.length-1)*w;line(ctx,[x,0],[x,h],'#91b1a677',1,[2,3]);
  if(Number.isFinite(values[index])) circle(ctx,pt(values[index],index),3,C.green);
}
export function renderGeometry(canvas,params,result){
  const s=prepare(canvas);if(!s)return;const {ctx,width:w,height:h}=s;
  const {baseline:B,depth:Z,second,noise,syncMs}=params,maxZ=7,pad=48,scale=Math.min((w-70)/6,(h-76)/maxZ),bottom=h-pad;
  const p=(x,z)=>[w/2+x*scale,bottom-z*scale];
  for(let z=0;z<=7;z++){line(ctx,p(-3,z),p(3,z),'#25343e');if(z>0)text(ctx,`${z} m`,12,p(0,z)[1]+4,'#66808e',10);}
  for(let x=-3;x<=3;x++)line(ctx,p(x,0),p(x,7),'#25343e');
  const A=p(-B/2,0),D=p(B/2,0),truth=p(.3,Z);
  const rayA=p(-B/2+result.left/700*maxZ,maxZ),rayB=p(B/2+result.right/700*maxZ,maxZ);
  ctx.beginPath();ctx.moveTo(...A);ctx.lineTo(...truth);ctx.lineTo(...D);ctx.closePath();ctx.fillStyle='#62e5be06';ctx.fill();
  line(ctx,A,rayA,C.green,1.5);if(second)line(ctx,D,rayB,C.blue,1.5);
  for(const [point,label,color,enabled] of [[A,'A',C.green,true],[D,'B',C.blue,second]]){ctx.fillStyle=enabled?'#1d3134':'#1d242b';ctx.strokeStyle=enabled?color:'#52626c';ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(point[0]-12,point[1]-8,24,16,4);ctx.fill();ctx.stroke();text(ctx,label,point[0],point[1]+4,enabled?color:'#52626c',11,'center');}
  line(ctx,p(-B/2,-.55),p(B/2,-.55),'#78909e',1);text(ctx,`B = ${B.toFixed(2)} m`,w/2,bottom+35,C.muted,11,'center');
  circle(ctx,truth,6,'#121a22','#e4edf4');text(ctx,'真实点',truth[0]+12,truth[1]-9,'#dae5ed',12);
  if(second&&result.z!==null){const estimated=p(result.x,result.z);if(result.z<=7){line(ctx,[estimated[0]-6,estimated[1]],[estimated[0]+6,estimated[1]],C.amber,2);line(ctx,[estimated[0],estimated[1]-6],[estimated[0],estimated[1]+6],C.amber,2);if(noise||syncMs){line(ctx,truth,estimated,'#f1ba7077',1,[3,4]);text(ctx,'重建点',estimated[0]+12,estimated[1]+20,C.amber,12);}}else text(ctx,`重建点在图外：${result.z.toFixed(2)} m`,w/2,25,C.amber,12,'center');}
  if(!second){for(let z=1;z<=6;z+=1.2)circle(ctx,p(-B/2+result.left/700*z,z),3,'#62e5be55');text(ctx,'一条射线上，有无数个可能的位置',w/2,24,C.green,12,'center');}
}
