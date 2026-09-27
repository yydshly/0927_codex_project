// Generates a synthetic format fixture, NOT an actual FreeMoCap capture.
import {writeFile,mkdir} from 'node:fs/promises';
import {makeSynthetic,MEDIAPIPE_MAP} from '../web/src/data.mjs';
const data=makeSynthetic('squat'),count=data.frames.length,shape=[count,33,3];
let header="{'descr': '<f4', 'fortran_order': False, 'shape': ("+shape.join(', ')+",), }";
header+=' '.repeat((64-((10+header.length+1)%64))%64)+'\n';
const buffer=new ArrayBuffer(10+header.length+count*33*3*4),view=new DataView(buffer),bytes=new Uint8Array(buffer);
bytes.set([147,78,85,77,80,89,1,0]);view.setUint16(8,header.length,true);bytes.set(new TextEncoder().encode(header),10);
for(let i=10+header.length;i<buffer.byteLength;i+=4)view.setFloat32(i,NaN,true);
for(let f=0;f<count;f++)MEDIAPIPE_MAP.forEach((j,k)=>{const [x,y,z]=data.frames[f][k],p=[x*1000,-z*1000,y*1000];p.forEach((v,a)=>view.setFloat32(10+header.length+((f*33+j)*3+a)*4,v,true));});
const folder=new URL('../experiments/',import.meta.url);await mkdir(folder,{recursive:true});
await writeFile(new URL('synthetic-mediapipe-body.npy',folder),bytes);
await mkdir(new URL('../web/samples/',import.meta.url),{recursive:true});
await writeFile(new URL('../web/samples/synthetic-mediapipe-body.npy',import.meta.url),bytes);
console.log('Created synthetic-mediapipe-body.npy (synthetic, 33 landmarks, mm, Z up, 30 FPS)');
