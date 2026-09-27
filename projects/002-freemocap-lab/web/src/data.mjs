import {validPoint} from './math.mjs';
export const NAMES=['nose','left_eye','right_eye','left_ear','right_ear','left_shoulder','right_shoulder','left_elbow','right_elbow','left_wrist','right_wrist','left_hip','right_hip','left_knee','right_knee','left_ankle','right_ankle'];
export const EDGES=[[0,1],[0,2],[1,3],[2,4],[3,5],[4,6],[5,6],[5,7],[7,9],[6,8],[8,10],[5,11],[6,12],[11,12],[11,13],[13,15],[12,14],[14,16]];
export const LEFT=new Set([1,3,5,7,9,11,13,15]);
export const MEDIAPIPE_MAP=[0,2,5,7,8,11,12,13,14,15,16,23,24,25,26,27,28];
export function syntheticFrame(kind,index,count=180){
  const t=index/count*Math.PI*2,p=Array.from({length:17},()=>[0,0,0]);
  let hipY=.96,hipZ=0;
  const squat=kind==='squat' ? (1-Math.cos(t))*0.49 : 0;
  if(kind==='squat') hipY=.08+.88*Math.cos(squat);
  p[11]=[-.145,hipY,hipZ];p[12]=[.145,hipY,hipZ];
  for(const [hip,knee,ankle,side] of [[11,13,15,-1],[12,14,16,1]]){
    if(kind==='walk'){
      const phase=t*2+(side===1?Math.PI:0),a=.43*Math.sin(phase),bend=.48*Math.max(0,-Math.cos(phase));
      p[knee]=[side*.145,hipY-.44*Math.cos(a),.44*Math.sin(a)];
      p[ankle]=[side*.145,p[knee][1]-.44*Math.cos(a-bend),p[knee][2]+.44*Math.sin(a-bend)];
    }else{p[ankle]=[side*.145,.08,0];p[knee]=[side*.145,.08+.44*Math.cos(squat),.44*Math.sin(squat)];}
  }
  const lean=kind==='squat'?squat*.22:0,sy=hipY+.46*Math.cos(lean),sz=hipZ+.46*Math.sin(lean);
  p[5]=[-.22,sy,sz];p[6]=[.22,sy,sz];
  for(const [shoulder,elbow,wrist,side] of [[5,7,9,-1],[6,8,10,1]]){
    if(kind==='reach'){
      const a=.15+(1-Math.cos(t))*.7;
      p[elbow]=[side*(.22+.27*Math.sin(a)),sy-.27*Math.cos(a),sz];
      p[wrist]=[p[elbow][0]+side*.25*Math.sin(a+.35),p[elbow][1]-.25*Math.cos(a+.35),sz+.035];
    }else if(kind==='squat'){
      p[elbow]=[side*.23,sy-.14,sz+.22];p[wrist]=[side*.18,sy-.1,sz+.47];
    }else{
      const swing=Math.sin(t*2+(side===-1?Math.PI:0))*.45;
      p[elbow]=[side*.24,sy-.28,sz+.28*Math.sin(swing)];
      p[wrist]=[side*.22,sy-.50,sz+.45*Math.sin(swing)+.07];
    }
  }
  p[0]=[0,sy+.25,sz+.075];p[1]=[-.038,sy+.285,sz+.075];p[2]=[.038,sy+.285,sz+.075];p[3]=[-.073,sy+.255,sz];p[4]=[.073,sy+.255,sz];
  return p;
}
export function makeSynthetic(kind='squat'){
  return {frames:Array.from({length:180},(_,i)=>syntheticFrame(kind,i)),fps:30,source:'synthetic',name:kind,originalPoints:17};
}
export function parseNpy(buffer){
  if(!(buffer instanceof ArrayBuffer)||buffer.byteLength<12) throw new Error('文件过短，无法读取 NPY 头。');
  if(buffer.byteLength>64*1024*1024) throw new Error('文件超过 64 MB，请先裁剪录制片段。');
  const bytes=new Uint8Array(buffer),view=new DataView(buffer);
  if(bytes[0]!==147 || new TextDecoder().decode(bytes.slice(1,6))!=='NUMPY') throw new Error('这不是有效的 .npy 文件。');
  const version=bytes[6];
  if(![1,2,3].includes(version)) throw new Error('不支持此 NPY 版本。');
  const offset=version===1?10:12,length=version===1?view.getUint16(8,true):view.getUint32(8,true);
  if(length>65536 || offset+length>buffer.byteLength) throw new Error('NPY 头长度异常。');
  const header=new TextDecoder().decode(bytes.slice(offset,offset+length));
  const dtype=header.match(/['"]descr['"]\s*:\s*['"]([<>=|])f([48])['"]/);
  if(!dtype) throw new Error('仅支持 float32 / float64 数组，不支持对象、整数或压缩文件。');
  if(!/['"]fortran_order['"]\s*:\s*False/.test(header)) throw new Error('仅支持 C-order，请先将数组转为连续的 C-order。');
  const shapeText=header.match(/['"]shape['"]\s*:\s*\(([^)]*)\)/)?.[1];
  if(!shapeText || !/^\s*\d+\s*,\s*\d+\s*,\s*3\s*,?\s*$/.test(shapeText)) throw new Error('数组形状必须是 [帧数, 关键点数, 3]。');
  const shape=shapeText.split(',').map(s=>s.trim()).filter(Boolean).map(Number);
  if(shape.some(n=>!Number.isSafeInteger(n)||n<1)||shape[0]>200000||shape[1]>1000) throw new Error('数组尺寸不受支持。');
  const total=shape.reduce((a,b)=>a*b,1),size=Number(dtype[2]),start=offset+length;
  if(start+total*size!==buffer.byteLength) throw new Error('数组长度与文件头不一致，文件可能不完整。');
  const values=new Float64Array(total),little=dtype[1]!=='>';
  for(let i=0;i<total;i++) values[i]=size===4?view.getFloat32(start+i*size,little):view.getFloat64(start+i*size,little);
  return {shape,values};
}
export function toDataset(parsed,{schema='mediapipe',scale=.001,up='z',fps=30,name='本地数据'}={}){
  if(!Number.isFinite(fps)||fps<1||fps>240) throw new Error('帧率应为 1–240。');
  if(![.001,1].includes(scale)||!['y','z'].includes(up)) throw new Error('坐标设置无效。');
  const [count,points]=parsed.shape;
  if(count>30000) throw new Error('最多支持 30,000 帧，请先裁剪较长的录制。');
  if(schema==='mediapipe' && points!==33) throw new Error('MediaPipe 模式需要身体 33 点数组，请选择 body_3d_xyz.npy。');
  if(schema==='rtmpose' && ![17,133].includes(points)) throw new Error('RTMPose 模式需要 17 或 133 点数组。');
  if(!['mediapipe','rtmpose'].includes(schema)) throw new Error('未知骨架定义。');
  const map=schema==='mediapipe'?MEDIAPIPE_MAP:NAMES.map((_,i)=>i);
  const frames=Array.from({length:count},(_,f)=>map.map(j=>{
    const base=(f*points+j)*3,[x,y,z]=Array.from(parsed.values.subarray(base,base+3),v=>v*scale);
    return up==='z'?[x,z,-y]:[x,y,z];
  }));
  const first=frames.find(f=>validPoint(f[11])&&validPoint(f[12]));
  if(!first) throw new Error('未找到有效的双侧髋部数据，请检查骨架定义或文件。');
  const centerX=(first[11][0]+first[12][0])/2,centerZ=(first[11][2]+first[12][2])/2;
  let floor=Infinity;
  for(let f=0;f<count;f+=Math.max(1,Math.floor(count/600))) for(const p of frames[f]) if(validPoint(p)) floor=Math.min(floor,p[1]);
  for(const frame of frames) for(const p of frame){p[0]-=centerX;p[1]-=floor;p[2]-=centerZ;}
  return {frames,fps,source:'imported',name,originalPoints:points,schema,scale,up,displayOffset:[centerX,floor,centerZ]};
}
export function toCsv(dataset){
  const head=['source,frame,time_s,joint,x_m,y_m,z_m'];
  for(let f=0;f<dataset.frames.length;f++) dataset.frames[f].forEach((p,j)=>head.push([dataset.source,f,(f/dataset.fps).toFixed(5),NAMES[j],...p.map(v=>Number.isFinite(v)?v.toFixed(6):'')].join(',')));
  return head.join('\r\n');
}
