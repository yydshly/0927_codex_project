import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceMotion, isPreviewVisible, sceneMotion } from '../studio/motion.js';
import { normalizeSettings, normalizeStore, scenes } from '../studio/model.js';
const clock=()=>({previous:0,weather:0,scene:0});
test('scene animation continues with weather disabled and pauses independently',()=>{
  const state=advanceMotion(clock(),.1,{motion:true,dynamics:true,particles:false,activity:100});
  assert.equal(state.scene,.1);
  assert.equal(advanceMotion(state,.2,{motion:true,dynamics:false,activity:100}).scene,.1);
  assert.equal(advanceMotion(state,.2,{motion:true,dynamics:false,activity:100}).weather,.2);
});
test('pause freezes both clocks, zero activity freezes the scene, slow frames cannot jump ahead',()=>{
  assert.deepEqual(advanceMotion(clock(),3,{motion:false,dynamics:true,activity:100}),{previous:3,weather:0,scene:0});
  assert.equal(advanceMotion(clock(),.1,{motion:true,dynamics:true,activity:0}).scene,0);
  assert.equal(advanceMotion(clock(),10000,{motion:true,dynamics:true,activity:100}).scene,.15);
  assert.equal(advanceMotion(clock(),.1,{motion:true,dynamics:true,activity:50}).scene,.05);
});
test('motion preferences migrate safely and survive environment persistence',()=>{
  assert.equal(normalizeSettings({}).dynamics,true);assert.equal(normalizeSettings({}).activity,65);
  const store=normalizeStore({previewMotion:false,settings:{dynamics:false,activity:24},saved:[{id:'motion',name:'微风',settings:{scene:'coast',activity:82,particles:false}}]});
  assert.deepEqual(normalizeStore(JSON.parse(JSON.stringify(store))),store);
  assert.equal(store.settings.activity,24);assert.equal(store.saved[0].settings.activity,82);
  assert.equal(normalizeSettings({activity:200}).activity,100);
  assert.equal(normalizeStore({previewMotion:'false'}).previewMotion,true);
  assert.deepEqual(Object.keys(sceneMotion),scenes.map(s=>s.id));
});
test('only cards in the visible content area need animated drawing',()=>{
  assert.equal(isPreviewVisible({width:400,height:225,left:20,right:420,top:250,bottom:475},1440,1000),true);
  assert.equal(isPreviewVisible({width:400,height:225,left:20,right:420,top:930,bottom:1155},1440,1000),false);
  assert.equal(isPreviewVisible({width:0,height:0,left:0,right:0,top:0,bottom:0},1440,1000),false);
  assert.equal(isPreviewVisible({width:400,height:225,left:20,right:420,top:-300,bottom:-75},1440,1000),false);
});
