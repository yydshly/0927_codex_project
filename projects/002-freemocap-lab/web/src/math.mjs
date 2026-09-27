export const add = (a,b) => a.map((v,i)=>v+b[i]);
export const sub = (a,b) => a.map((v,i)=>v-b[i]);
export const mul = (a,k) => a.map(v=>v*k);
export const dot = (a,b) => a.reduce((s,v,i)=>s+v*b[i],0);
export const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const norm = a => Math.hypot(...a);
export const unit = a => mul(a,1/(norm(a)||1));
export const validPoint = p => p && p.length===3 && p.every(Number.isFinite);
export function angle(a,b,c){
  if(![a,b,c].every(validPoint)) return NaN;
  const u=sub(a,b),v=sub(c,b),den=norm(u)*norm(v);
  return den<1e-12 ? NaN : Math.acos(Math.max(-1,Math.min(1,dot(u,v)/den)))*180/Math.PI;
}
export function cameraProject(point,eye,target,width,height,factor=.9){
  if(!validPoint(point)) return null;
  const forward=unit(sub(target,eye));
  const right=unit(cross(forward,[0,1,0]));
  const up=cross(right,forward),d=sub(point,eye),z=dot(d,forward);
  if(z<=.02) return null;
  const f=Math.min(width,height)*factor;
  return [width/2+f*dot(d,right)/z,height/2-f*dot(d,up)/z,z];
}
// Rectified, equal-focal-length pinhole stereo; not the upstream DLT solver.
export function stereo({baseline=1.2,depth=3,noise=0,syncMs=0,second=true,focal=700,x=.3,velocity=.8}={}){
  if(![baseline,depth,noise,syncMs,focal,x,velocity].every(Number.isFinite)||baseline<=0||depth<=0||focal<=0) throw new Error('无效的双目参数');
  const left=focal*(x+baseline/2)/depth+noise;
  const right=focal*(x+velocity*syncMs/1000-baseline/2)/depth-noise;
  const disparity=left-right;
  if(!second || disparity<=1e-8) return {left,right,disparity:null,z:null,x:null,error:null};
  const z=focal*baseline/disparity;
  return {left,right,disparity,z,x:left*z/focal-baseline/2,error:Math.abs(z-depth)};
}
