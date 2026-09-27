import test from 'node:test';
import assert from 'node:assert/strict';
import { musicProfiles, sceneMusic, musicTrack, profileBpm, arrangement } from '../studio/music.js';
import { readFileSync } from 'node:fs';
import { scenes, normalizeSettings, normalizeStore, newTimer, startTimer, pauseTimer, tickTimer, sleepGain, trackInfo, formatTime } from '../studio/model.js';

test('every scene has its own valid audio palette and complete saved configuration',()=>{
  assert.equal(scenes.length,6);
  for(const scene of scenes){const state=normalizeSettings({scene:scene.id,mix:scene.mix});assert.equal(state.scene,scene.id);assert.deepEqual(Object.keys(state.mix),scene.channels);assert.deepEqual(normalizeSettings(JSON.parse(JSON.stringify(state))),state);}
});
test('music selection survives saved environments and old preferences migrate to a scene recommendation',()=>{
  for(const s of scenes)assert.equal(normalizeSettings({scene:s.id}).musicProfile,sceneMusic[s.id]);
  const state=normalizeStore({settings:{scene:'coast',musicProfile:'lofi',band:'full'},saved:[{id:'jazz',name:'爵士夜',settings:{scene:'study',musicProfile:'jazz'}}]});
  assert.deepEqual(normalizeStore(JSON.parse(JSON.stringify(state))),state);
  assert.equal(state.saved[0].settings.musicProfile,'jazz');
  assert.equal(normalizeSettings({musicProfile:'invalid'}).musicProfile,'piano');
  assert.equal(normalizeSettings({musicProfile:'ambient',band:'full'}).band,'keys');
});
test('six backgrounds have distinct instruments and arrangements, valid notes and selectable queues',()=>{
  assert.equal(new Set(musicProfiles.map(p=>p.instrument)).size,6);
  const patterns=[];
  for(const p of musicProfiles){
    const events=Array.from({length:32},(_,step)=>arrangement(p.id,step,0,p.band));patterns.push(JSON.stringify(events));
    for(const e of events.flat()){if(e.drum)continue;assert.ok(e.pitch>=20&&e.pitch<=100);assert.ok(e.duration>0&&e.gain>0);assert.ok(Number.isFinite(e.delay));}
    assert.equal(new Set(Array.from({length:4},(_,i)=>musicTrack(p.id,i).title)).size,4);
    assert.ok(profileBpm(p.id,'bright')>profileBpm(p.id,'calm'));
    if(['ambient','musicbox'].includes(p.id))assert.equal(events.flat().some(e=>e.drum),false);
  }
  assert.equal(new Set(patterns).size,6);
  assert.equal(Array.from({length:32},(_,i)=>arrangement('lofi',i,0,'keys')).flat().some(e=>e.drum),false);
});
test('all six detailed scene assets are locally available high resolution PNGs',()=>{
  for(const s of scenes){const image=readFileSync(new URL('../assets/scenes/'+s.id+'-v3.png',import.meta.url));assert.equal(image.toString('hex',0,8),'89504e470d0a1a0a');assert.ok(image.readUInt32BE(16)>=1600);assert.ok(image.readUInt32BE(20)>=900);}
});
test('corrupt stored data cannot select unknown scenes or carry arbitrary mix channels',()=>{
  const settings=normalizeSettings({scene:'no',style:'<script>',master:999,music:-10,brightness:0,mix:{rain:'bad',hack:100}});
  assert.equal(settings.scene,'study');assert.equal(settings.style,'pixel');assert.equal(settings.master,100);assert.equal(settings.music,0);assert.equal(settings.brightness,35);assert.equal(settings.mix.rain,48);assert.equal(settings.mix.hack,undefined);
  assert.deepEqual(normalizeStore({favorites:['study','no','study']}).favorites,['study']);
  assert.equal(normalizeStore(null).saved.length,0);
});
test('saved environments survive a roundtrip and retain different per-scene choices',()=>{
  const store=normalizeStore({settings:{scene:'snow',style:'mono'},environments:{forest:{scene:'forest',intensity:0,mix:{fire:81}}},saved:[{id:'one',name:'夜读',settings:{scene:'coast',music:14}}]});
  assert.deepEqual(normalizeStore(JSON.parse(JSON.stringify(store))),store);assert.equal(store.environments.forest.intensity,0);assert.equal(store.environments.forest.mix.fire,81);assert.equal(store.saved[0].settings.music,14);
});
test('focus timer pauses and resumes without losing remaining time',()=>{
  let timer=startTimer(newTimer(25,5),1000);timer=pauseTimer(timer,61000);assert.equal(timer.remaining,1440);assert.equal(timer.running,false);
  timer=startTimer(timer,200000);assert.equal(timer.deadline,1640000);assert.equal(tickTimer(timer,230000).timer.remaining,1410);
});
test('timer expiration records one focus session and waits before beginning a break',()=>{
  let timer={...startTimer(newTimer(1,5),0),task:'阅读'};const result=tickTimer(timer,61000);
  assert.equal(result.completed.minutes,1);assert.equal(result.completed.task,'阅读');assert.equal(result.timer.phase,'break');assert.equal(result.timer.running,false);assert.equal(result.timer.remaining,300);assert.equal(result.timer.completed,1);
  assert.equal(tickTimer(result.timer,900000).completed,null);
});
test('background wakeup cannot invent multiple completed cycles',()=>{
  const result=tickTimer(startTimer(newTimer(25,5),0),86400000);
  assert.equal(result.timer.completed,1);assert.equal(result.completed.finished,1500000);assert.equal(result.timer.running,false);
});
test('completing a break does not count as a completed focus session',()=>{
  const timer=startTimer({...newTimer(25,5),phase:'break',remaining:300,completed:1},1000);const result=tickTimer(timer,301000);
  assert.equal(result.completed,null);assert.equal(result.timer.phase,'focus');assert.equal(result.timer.completed,1);assert.equal(result.timer.remaining,1500);
});
test('sleep fade starts only in the last 30 seconds and clamps exactly at zero',()=>{
  assert.equal(sleepGain(null,0),1);assert.equal(sleepGain(60000,0),1);assert.equal(sleepGain(60000,45000),.5);assert.equal(sleepGain(60000,60000),0);assert.equal(sleepGain(60000,80000),0);
});
test('queue tracks stay finite and deterministic across all scenes',()=>{
  for(const s of scenes)for(const index of [0,1,4,999]){const track=trackInfo(s.id,index);assert.ok(track.title);assert.ok(track.duration>=120);assert.deepEqual(trackInfo(s.id,index),track);}
  assert.notEqual(trackInfo('forest',0).title,trackInfo('coast',0).title);assert.equal(formatTime(-1),'00:00');assert.equal(formatTime(60),'01:00');
});
