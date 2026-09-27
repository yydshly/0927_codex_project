import {clamp, optics, ballistic, flight, material, noise, TAU} from './models.mjs';
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
const rgb=a=>`rgb(${a.map(v=>Math.round(clamp(v,0,255))).join(',')})`;
function setup(canvas) {
  const w=canvas.clientWidth||400,h=canvas.clientHeight||300,dpr=Math.min(window.devicePixelRatio||1,2);
  if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
  const c=canvas.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);return [c,w,h];
}
function backdrop(c,w,h){const g=c.createLinearGradient(0,0,w,h);g.addColorStop(0,'#14303e');g.addColorStop(1,'#0c252f');c.fillStyle=g;c.fillRect(0,0,w,h);c.strokeStyle='#8ac2c808';c.lineWidth=.7;for(let x=0;x<w;x+=28){c.beginPath();c.moveTo(x,0);c.lineTo(x,h);c.stroke();}for(let y=0;y<h;y+=28){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();}}
function label(c,text,x,y,color='#80a6ab',align='left'){c.font='9px "Segoe UI","Microsoft YaHei",sans-serif';c.textAlign=align;c.fillStyle=color;c.fillText(text,x,y);}
function poly(c,points,fill,stroke){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=.55;c.stroke();}}
function arrow(c,x1,y1,x2,y2,color,width=1){const a=Math.atan2(y2-y1,x2-x1);c.strokeStyle=color;c.fillStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();c.beginPath();c.moveTo(x2,y2);c.lineTo(x2-5*Math.cos(a-.45),y2-5*Math.sin(a-.45));c.lineTo(x2-5*Math.cos(a+.45),y2-5*Math.sin(a+.45));c.closePath();c.fill();}
function raster(model,nx,ny){if(!model.image || model.image.width!==nx||model.image.height!==ny){model.raster=document.createElement('canvas');model.raster.width=nx;model.raster.height=ny;model.rctx=model.raster.getContext('2d');model.image=model.rctx.createImageData(nx,ny);}return model.image.data;}
function waveView(c,w,h,m){
  const n=m.n,grid=m.field,sx=w*.0142,sy=h*.011,sz=h*.22;
  const point=(x,y,z=0)=>[w*.5+(x-y)*sx,h*.18+(x+y)*sy-z*sz];
  poly(c,[point(0,0,-.65),point(31,0,-.65),point(31,31,-.65),point(0,31,-.65)],'#0b2029','#4c727b60');
  poly(c,[point(0,31,grid[31*n]),point(31,31,grid[n*n-1]),point(31,31,-.65),point(0,31,-.65)],'#163c49');
  poly(c,[point(31,0,grid[31]),point(31,31,grid[n*n-1]),point(31,31,-.65),point(31,0,-.65)],'#1a4653');
  for(let sum=0;sum<61;sum++)for(let x=0;x<n-1;x++){const y=sum-x;if(y<0||y>=n-1)continue;const i=y*n+x,z=grid[i],slope=(grid[i+1]-z)*3+(grid[i+n]-z)*1.5;const light=clamp(.4+z*.6-slope*.4);const color=mix([20,80,100],[115,192,190],light);poly(c,[point(x,y,z),point(x+1,y,grid[i+1]),point(x+1,y+1,grid[i+n+1]),point(x,y+1,grid[i+n])],rgb(color),'#b5e1d427');}
  label(c,m.p.method?'二维 IFFT · 教学频谱':'四组解析波 · 高度叠加',14,20);label(c,'16 m × 16 m / 高度轴放大示意',14,h-14,'#638c92');
  const a=m.p.direction*Math.PI/180;arrow(c,w-40,h-37,w-40+22*Math.cos(a),h-37-22*Math.sin(a),'#dac08b',1.4);
}
function fieldView(c,w,h,m,id){
  const nx=m.width,ny=m.height,data=raster(m,nx,ny);
  for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){
    const i=y*nx+x,v=m.field[i];let color;
    if(id==='flow'){const delta=m.bed[i]+v-.55;const tint=delta>0?mix([105,168,162],[233,184,107],clamp(delta/.08)):mix([105,168,162],[22,78,120],clamp(-delta/.08));color=v<.002?mix([111,99,80],[173,154,108],clamp(m.bed[i])):m.p.display===1?tint:mix([57,153,156],[19,62,89],clamp(v/.8));}
    else color=mix([18,60,77],[234,244,218],clamp(v));
    data[i*4]=color[0];data[i*4+1]=color[1];data[i*4+2]=color[2];data[i*4+3]=255;
  }
  m.rctx.putImageData(m.image,0,0);const x0=14,y0=38,ww=w-28,hh=h-78;
  c.imageSmoothingEnabled=true;c.drawImage(m.raster,x0,y0,ww,hh);
  c.strokeStyle='#91bcc02b';c.lineWidth=.5;c.strokeRect(x0,y0,ww,hh);
  for(let y=3;y<ny-1;y+=5)for(let x=3;x<nx-1;x+=6){let vx,vy;
    if(id==='flow'){if(m.field[y*nx+x]<.003)continue;vx=m.u[y*nx+x]*35;vy=m.v[y*nx+x]*35;}else [vx,vy]=m.velocity(x,y);
    const px=x0+(x+.5)/nx*ww,py=y0+(y+.5)/ny*hh;arrow(c,px,py,px+clamp(vx,-12,12),py+clamp(vy,-10,10),'#d8efe56a',.65);
  }
  label(c,id==='flow'?(m.p.display===1?'俯视 · 水面偏移与流速':'俯视 · 水深与流速'):'俯视 · 浓度与给定速度场',14,20);
  if(id==='flow'){label(c,m.p.inflow?'左侧水位驱动 / 其余封闭':'封闭边界 / 初始水团',14,h-15);label(c,m.p.display===1?'蓝 −8 cm / 暖 +8 cm':'浅水 → 深水',w-14,h-15,'#779fa4','right');}
  else{label(c,'周期边界 · 白色为高浓度',14,h-15);label(c,'0 → 1',w-14,h-15,'#b5cdb8','right');}
}
function wetView(c,w,h,m){
  const nx=m.width,ny=m.height,data=raster(m,nx,ny);
  for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){
    const i=y*nx+x,wet=m.field[i],film=m.film[i],grain=noise(x*.6,y*.6),tile=(Math.floor(x/8)+Math.floor(y/6))%2;
    let color=mix([129+grain*22,135+grain*20,125+grain*13],[62,84,78],wet*.8);
    color=color.map(v=>v*(tile?.94:1));const glint=film*Math.exp(-((x-26)**2/190+(y-12)**2/25));color=mix(color,[211,228,197],clamp(glint*.9));
    if(x%8===0||y%6===0)color=color.map(v=>v*.72);
    data.set([...color.map(Math.round),255],i*4);
  }
  m.rctx.putImageData(m.image,0,0);c.imageSmoothingEnabled=true;c.drawImage(m.raster,14,37,w-28,h-88);
  label(c,'地表材质 · 暗色湿痕 / 亮色水膜',14,20);const values=m.metrics();
  for(let i=0;i<2;i++){const yy=h-34+i*15;label(c,i?'湿度':'水膜',14,yy);c.fillStyle='#ffffff12';c.fillRect(45,yy-6,w-61,4);c.fillStyle=i?'#6daf91':'#d8e6b2';c.fillRect(45,yy-6,(w-61)*values[i],4);}
}
function opticsView(c,w,h,m){
  const o=optics(m.p),surface=h*.37,ground=h*.76,cx=w*.45;
  const sky=c.createLinearGradient(0,0,0,surface);sky.addColorStop(0,'#79979c');sky.addColorStop(1,'#bdd0c5');c.fillStyle=sky;c.fillRect(0,0,w,surface);
  const water=c.createLinearGradient(0,surface,0,ground);water.addColorStop(0,rgb(mix([25,91,107],[165,191,174],o.reflection)));water.addColorStop(1,rgb(o.rgb.map((t,i)=>[156,177,158][i]*t+[12,39,47][i]*(1-t))));c.fillStyle=water;c.fillRect(0,surface,w,ground-surface);
  c.fillStyle=rgb(o.rgb.map((v,i)=>[165,158,119][i]*v+20));c.fillRect(0,ground,w,5);c.strokeStyle='#e6efda9c';c.lineWidth=1.4;c.beginPath();c.moveTo(0,surface);c.lineTo(w,surface);c.stroke();
  c.setLineDash([3,4]);c.strokeStyle='#f3f7d94d';c.lineWidth=.7;c.beginPath();c.moveTo(cx,17);c.lineTo(cx,ground);c.stroke();c.setLineDash([]);
  const angle=m.p.angle*Math.PI/180,L=Math.min(w*.35,h*.24);
  arrow(c,cx-Math.sin(angle)*L,surface-Math.cos(angle)*L,cx,surface,'#ffe6a5',1.5);
  arrow(c,cx,surface,cx+Math.sin(angle)*L,surface-Math.cos(angle)*L,`rgba(253,230,167,${.25+o.reflection*.75})`,1+3*o.reflection);
  const dy=ground-surface;arrow(c,cx,surface,cx+Math.tan(o.theta)*dy,ground,'#d7f3c5b3',1.4);
  label(c,'光学剖面 · 箭头示意光路',14,20,'#244c51');label(c,'空气',w-14,surface-10,'#385e5d','right');label(c,`${m.p.depth.toFixed(1)} m 水层`,14,ground-12,'#b9d6c4');
  const yy=h-39,bw=(w-62)/3;['R','G','B'].forEach((name,i)=>{const x=14+i*(bw+17);label(c,name,x,yy+2,['#d99784','#8abc9e','#80b7c6'][i]);c.fillStyle='#ffffff12';c.fillRect(x+12,yy-5,bw-12,6);c.fillStyle=['#c6947d','#7cae8f','#73abbc'][i];c.fillRect(x+12,yy-5,(bw-12)*o.rgb[i],6);});
  label(c,'色条 = 实际计算的透光率',14,h-14);
}
function breakerView(c,w,h,m){
  const p=m.p,scale=Math.min(w/7.6,h/4.4),origin=[w*.16,h*.69],tf=flight(p.height,p.lift,p.gravity),phase=(m.time%3.7)-.6;
  const pt=(x,y)=>[origin[0]+x*scale,origin[1]-y*scale];
  const water=c.createLinearGradient(0,origin[1]-40,0,h);water.addColorStop(0,'#429293');water.addColorStop(1,'#1c4f64');
  c.beginPath();c.moveTo(0,origin[1]+7);c.bezierCurveTo(w*.12,origin[1]+8,w*.08,origin[1]-p.height*scale,w*.16,origin[1]-p.height*scale);c.bezierCurveTo(w*.24,origin[1]-p.height*scale,w*.24,origin[1]+8,w,origin[1]+4);c.lineTo(w,h);c.lineTo(0,h);c.fillStyle=water;c.fill();
  const end=pt(tf*p.speed,0);c.setLineDash([3,4]);c.strokeStyle='#d4b17f5e';c.beginPath();c.moveTo(end[0],h*.25);c.lineTo(end[0],origin[1]+12);c.stroke();c.setLineDash([]);
  if(phase>=0){const age=Math.min(phase,tf);c.beginPath();for(let i=0;i<=44;i++){const t=age*i/44,[x,y]=ballistic(t,p.height,p.speed,p.lift,p.gravity),[px,py]=pt(x,y);i?c.lineTo(px,py):c.moveTo(px,py);}c.strokeStyle='#7fd2cba8';c.lineWidth=9;c.lineCap='round';c.stroke();c.strokeStyle='#d6f3dfce';c.lineWidth=1.5;c.stroke();c.lineCap='butt';const nose=pt(...ballistic(age,p.height,p.speed,p.lift,p.gravity));c.fillStyle='#f3d29c';c.beginPath();c.arc(nose[0],nose[1],3,0,TAU);c.fill();}
  if(phase>tf&&phase<tf+1.3){const t=phase-tf;for(let i=0;i<24;i++){const vx=(i/23-.4)*2.7,vy=1.4+Math.sin(i*6.2)*.7,[dx,dy]=ballistic(t,0,vx,vy,p.gravity);if(dy<0)continue;const [px,py]=pt(tf*p.speed+dx,dy);c.fillStyle=`rgba(220,240,211,${.9-t*.5})`;c.beginPath();c.arc(px,py,1.2+i%3*.5,0,TAU);c.fill();}}
  label(c,'浪唇轨迹 · 剖面教学示意',14,20);label(c,phase<0?'蓄势':phase<tf?'浪唇飞行':phase<tf+1?'落水 / 喷溅':'等待下一轮',14,h-14,'#b3d2c5');label(c,'虚线：预测落点',w-14,h-14,'#afac8e','right');
}
function materialView(c,w,h,m){
  const n=120,data=raster(m,n,n),angle=m.time*.13,ca=Math.cos(angle),sa=Math.sin(angle);
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
    const xx=(x+.5)/n*2-1,yy=1-(y+.5)/n*2,r=xx*xx+yy*yy,i=(y*n+x)*4;
    if(r>1){data[i+3]=0;continue;}const zz=Math.sqrt(1-r),normal=[xx*ca+zz*sa,yy,zz*ca-xx*sa],sample=material(m.p,normal,normal);
    const light=clamp(.24+Math.max(0,-xx*.45+yy*.6+zz*.5)*.8);let color;
    if(m.p.weights)color=sample.weights.map((v,j)=>(v*220+35)*light);
    else{const grain=sample.value,layer=.5+.5*Math.sin((yy*10+grain*.7)*Math.PI);color=mix([77,94,91],[192,181,151],grain*.8+layer*.15).map(v=>v*light);}
    data.set([...color.map(Math.round),255],i);
  }
  m.rctx.putImageData(m.image,0,0);const size=Math.min(w*.75,h*.7),x=(w-size)/2,y=h*.12;
  c.save();c.fillStyle='#020e1655';c.beginPath();c.ellipse(w/2,y+size+5,size*.4,8,0,0,TAU);c.fill();c.restore();c.imageSmoothingEnabled=true;c.drawImage(m.raster,x,y,size,size);
  label(c,m.p.projection?'三向投影 · 按法线混合':'单平面投影 · 观察侧面拉伸',14,20);label(c,m.p.weights?'R = X / G = Y / B = Z':'程序化材质 · 球体为检查载体',14,h-14);
}
export function render(canvas,id,model){const [c,w,h]=setup(canvas);backdrop(c,w,h);if(id==='waves')waveView(c,w,h,model);else if(id==='flow'||id==='transport')fieldView(c,w,h,model,id);else if(id==='wetness')wetView(c,w,h,model);else if(id==='optics')opticsView(c,w,h,model);else if(id==='breaker')breakerView(c,w,h,model);else materialView(c,w,h,model);}
export function chart(canvas,history){const[c,w,h]=setup(canvas);if(history.length<2){label(c,'运行后出现曲线',w/2,h/2,'#9daa9d','center');return;}const values=history.flatMap(p=>[p.a,p.b]).filter(Number.isFinite),lo=Math.min(...values),hi=Math.max(...values),range=Math.max(hi-lo,Math.abs(hi)*.05,.001),y=v=>h-16-(v-lo)/range*(h-33);c.strokeStyle='#dce5d8';c.lineWidth=.7;for(let i=0;i<3;i++){const yy=12+(h-27)*i/2;c.beginPath();c.moveTo(37,yy);c.lineTo(w,yy);c.stroke();}label(c,hi.toPrecision(3),0,15,'#92a08c');label(c,lo.toPrecision(3),0,h-14,'#92a08c');for(const [key,color]of[['a','#689ca9'],['b','#bf9453']]){c.beginPath();history.forEach((p,i)=>{const xx=38+i/(history.length-1)*(w-41);i?c.lineTo(xx,y(p[key])):c.moveTo(xx,y(p[key]));});c.strokeStyle=color;c.lineWidth=1.5;c.stroke();}label(c,`${history[0].t.toFixed(1)} s`,38,h-2,'#9aa491');label(c,`${history.at(-1).t.toFixed(1)} s`,w-2,h-2,'#9aa491','right');}
