import test from 'node:test';
import assert from 'node:assert/strict';
import {angle,stereo,cameraProject,norm,sub} from '../src/math.mjs';
import {makeSynthetic,parseNpy,toDataset,toCsv,MEDIAPIPE_MAP} from '../src/data.mjs';
function fixture({version=1,endian='<',size=4,shape=[2,33,3],fortran=false,missing=false}={}){
  const offset=version===1?10:12;
  let header="{'descr': '"+endian+'f'+size+"', 'fortran_order': "+(fortran?'True':'False')+", 'shape': ("+shape.join(', ')+",), }";
  header+=' '.repeat((64-((offset+header.length+1)%64))%64)+'\n';
  const count=shape.reduce((a,b)=>a*b,1),buffer=new ArrayBuffer(offset+header.length+count*size),bytes=new Uint8Array(buffer),view=new DataView(buffer);
  bytes.set([147,78,85,77,80,89,version,0]);if(version===1)view.setUint16(8,header.length,true);else view.setUint32(8,header.length,true);bytes.set(new TextEncoder().encode(header),offset);
  for(let i=0;i<count;i++){const v=missing?NaN:i+.25;if(size===4)view.setFloat32(offset+header.length+i*size,v,endian!=='>');
    else view.setFloat64(offset+header.length+i*size,v,endian!=='>');}
  return buffer;
}
test('ideal stereo independently recovers a known point and disparity',()=>{
  const r=stereo();assert.equal(r.disparity,280);assert.equal(r.z,3);assert.ok(Math.abs(r.x-.3)<1e-10);assert.equal(r.error,0);
});
test('pixel error becomes worse with short baselines and long distances',()=>{
  assert.ok(stereo({baseline:.3,noise:4}).error>stereo({baseline:2,noise:4}).error);
  assert.ok(stereo({depth:6,noise:4}).error>stereo({depth:2,noise:4}).error);
});
test('asynchronous moving target produces the predicted biased depth',()=>{
  const r=stereo({syncMs:100});assert.ok(Math.abs(r.z-3*1.2/(1.2-.08))<1e-12);
});
test('single camera yields no determinate depth; invalid inputs are rejected',()=>{
  assert.equal(stereo({second:false}).z,null);assert.equal(stereo({second:false}).disparity,null);assert.throws(()=>stereo({baseline:0}));
});
test('joint angles have meaningful straight, right-angle, and missing cases',()=>{
  assert.equal(angle([1,0,0],[0,0,0],[0,1,0]),90);assert.equal(angle([-1,0,0],[0,0,0],[1,0,0]),180);assert.ok(Number.isNaN(angle([NaN,0,0],[0,0,0],[1,0,0])));
});
test('camera projection centers its target and rejects points behind the camera',()=>{
  assert.deepEqual(cameraProject([0,0,0],[0,0,3],[0,0,0],800,600),[400,300,3]);assert.equal(cameraProject([0,0,4],[0,0,3],[0,0,0],800,600),null);
});
test('synthetic motion maintains leg lengths throughout the cycle',()=>{
  for(const name of ['squat','reach','walk'])for(const f of makeSynthetic(name).frames){assert.ok(Math.abs(norm(sub(f[11],f[13]))-.44)<1e-10);assert.ok(Math.abs(norm(sub(f[13],f[15]))-.44)<1e-10);}
});
for(const version of [1,2,3]) for(const endian of ['<','>']) for(const size of [4,8])test('NPY '+version+', '+endian+'f'+size+': header and endian decoding',()=>{
  const p=parseNpy(fixture({version,endian,size}));assert.deepEqual(p.shape,[2,33,3]);assert.equal(p.values[0],.25);assert.equal(p.values[197],197.25);
});
test('NPY malformed, truncated, wrong dimensions and Fortran arrays fail clearly',()=>{
  assert.throws(()=>parseNpy(new ArrayBuffer(40)),/不是有效/);assert.throws(()=>parseNpy(fixture().slice(0,-1)),/长度/);assert.throws(()=>parseNpy(fixture({fortran:true})),/C-order/);assert.throws(()=>parseNpy(fixture({shape:[33,3]})),/形状/);
});
test('schema mapping and coordinate conversion preserve units and angle geometry',()=>{
  const parsed=parseNpy(fixture());const d=toDataset(parsed,{schema:'mediapipe',scale:.001,up:'z',fps:60});
  assert.equal(d.fps,60);assert.equal(d.frames[0].length,17);assert.equal(d.source,'imported');
  const left=MEDIAPIPE_MAP[5],right=MEDIAPIPE_MAP[6];assert.ok(Math.abs((d.frames[0][6][0]-d.frames[0][5][0])-(right-left)*3*.001)<1e-12);
  assert.ok(Math.abs((d.frames[0][11][0]+d.frames[0][12][0])/2)<1e-12);
});
test('mismatched skeleton and all-missing datasets do not silently load',()=>{
  assert.throws(()=>toDataset(parseNpy(fixture()),{schema:'rtmpose'}),/17 或 133/);assert.throws(()=>toDataset(parseNpy(fixture({missing:true}))),/有效的双侧髋部/);assert.throws(()=>toDataset(parseNpy(fixture()),{fps:0}),/帧率/);
});
test('CSV identifies provenance and has one record per joint per frame',()=>{
  const csv=toCsv(makeSynthetic());const lines=csv.split('\r\n');assert.equal(lines.length,1+180*17);assert.ok(lines[0].includes('x_m'));assert.ok(lines[1].startsWith('synthetic,0,0.00000,nose,'));
});
