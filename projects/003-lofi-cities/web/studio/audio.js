import { frequency, seedRandom } from '../lab-model.js';
import { scenes } from './model.js';
import { getProfile, musicTrack, profileBpm, arrangement } from './music.js';

export function createAudio(onState, onTrack) {
  let ctx, master, music, ambience, room, noise, analyser, samples, interval, settings, starting = false, running = false;
  let next = 0, step = 0, trackStart = 0, currentProfile = 'piano', track = musicTrack('piano'), fade = 1;
  let source = 'generated', localBuffer, localNode, loadVersion = 0;
  const voices = new Set(), beds = {};
  function own(node, cleanup = () => {}) {
    voices.add(node); node.onended = () => { node.disconnect(); cleanup(); voices.delete(node); };
  }
  function build() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) throw new Error('当前浏览器不支持音频播放');
    ctx = new AC(); master = ctx.createGain(); music = ctx.createGain(); ambience = ctx.createGain();
    master.gain.value = 0; music.gain.value = 0; ambience.gain.value = 0;
    const compressor = ctx.createDynamicsCompressor(); compressor.threshold.value = -18; compressor.ratio.value = 4;
    analyser = ctx.createAnalyser(); analyser.fftSize = 256; samples = new Float32Array(256);
    music.connect(master); ambience.connect(master); master.connect(compressor); compressor.connect(analyser); analyser.connect(ctx.destination);
    const rng = seedRandom(303);
    noise = ctx.createBuffer(1, ctx.sampleRate * 6, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = rng() * 2 - 1;
    const reverb = ctx.createConvolver(), impulse = ctx.createBuffer(2, Math.floor(ctx.sampleRate * 2.6), ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = impulse.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] = (rng() * 2 - 1) * Math.pow(1 - i / d.length, 3) * .45; }
    reverb.buffer = impulse; room = ctx.createGain(); room.gain.value = .24; room.connect(reverb); reverb.connect(music);
    for (const [name, freq, type, q] of [['rain',2100,'lowpass',.7],['wind',290,'lowpass',.7],['vinyl',3600,'highpass',.6],['fire',750,'lowpass',.8],['sea',950,'lowpass',.7],['train',110,'bandpass',.8]]) {
      const n = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
      n.buffer = noise; n.loop = true; filter.type = type; filter.frequency.value = freq; filter.Q.value = q; gain.gain.value = 0;
      n.connect(filter); filter.connect(gain); gain.connect(ambience); n.start(0, Object.keys(beds).length * .4); beds[name] = gain;
    }
    beds.crickets = ctx.createGain(); beds.crickets.gain.value = 0; beds.crickets.connect(ambience);
    ctx.onstatechange = () => { if (running && ctx.state !== 'running') stop(); onState(running && ctx.state === 'running'); };
    trackStart = ctx.currentTime;
  }
  function envelope(when, length, level, attack = .008, dest = music, wet = true) {
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, when); env.gain.linearRampToValueAtTime(level, when + attack);
    env.gain.exponentialRampToValueAtTime(.0001, when + Math.max(attack + .02, length)); env.gain.linearRampToValueAtTime(0, when + length + .05);
    env.connect(dest); if (wet) env.connect(room); return env;
  }
  function partial(note, when, length, level, ratio = 1, type = 'sine', attack = .008, detune = 0, dest = music) {
    const o = ctx.createOscillator(), env = envelope(when, length, level, attack, dest, dest === music);
    o.type = type; o.frequency.value = frequency(note) * ratio; o.detune.value = detune;
    o.connect(env); o.start(when); o.stop(when + length + .06); own(o, () => env.disconnect());
  }
  function instrument(note, when, length, level, kind) {
    if (kind === 'bass') { partial(note,when,length,level,1,'sine'); return; }
    if (kind === 'guitar') {
      // Karplus–Strong: an excited string loses high frequencies as it decays.
      const count = Math.floor(ctx.sampleRate * length), period = Math.max(2, Math.round(ctx.sampleRate / frequency(note)));
      const buffer = ctx.createBuffer(1,count,ctx.sampleRate), d = buffer.getChannelData(0), rng = seedRandom(note * 137 + step);
      for (let i = 0; i < period; i++) d[i] = (rng() * 2 - 1) * .65;
      for (let i = period; i < count; i++) d[i] = .497 * (d[i-period] + d[i-period+1]);
      const n = ctx.createBufferSource(), env = envelope(when,length,level * 2,.003); n.buffer = buffer; n.connect(env); n.start(when); own(n,()=>env.disconnect()); return;
    }
    if (kind === 'rhodes') {
      const carrier = ctx.createOscillator(), mod = ctx.createOscillator(), depth = ctx.createGain(), env = envelope(when,length,level,.012);
      carrier.frequency.value = frequency(note); mod.frequency.value = frequency(note) * 2;
      depth.gain.setValueAtTime(frequency(note) * .75,when); depth.gain.exponentialRampToValueAtTime(1,when + length * .65);
      mod.connect(depth); depth.connect(carrier.frequency); carrier.connect(env); carrier.start(when); mod.start(when); carrier.stop(when+length+.06); mod.stop(when+length+.06);
      own(carrier,()=>env.disconnect()); own(mod,()=>depth.disconnect()); return;
    }
    if (kind === 'pad') {
      for (const cents of [-7,7]) partial(note,when,length,level * .65,1,'triangle',1.8,cents);
      partial(note,when,length,level * .28,2,'sine',1.3); return;
    }
    if (kind === 'bell') {
      for (const [ratio,gain,decay] of [[1,1,1],[2.76,.23,.5],[5.4,.085,.2]]) partial(note,when,length*decay,level*gain,ratio);
      return;
    }
    if (kind === 'tape') {
      partial(note,when,length,level*.75,1,'triangle',.03,-5); partial(note,when,length*.75,level*.3,1,'sine',.02,6); return;
    }
    for (const [ratio,gain,decay] of [[1,1,1],[2,.26,.6],[3,.07,.25]]) partial(note,when,length*decay,level*gain,ratio,'sine',.008);
  }
  function hit(when, kind) {
    if (kind === 'kick') {
      const o = ctx.createOscillator(), g = envelope(when,.24,.3,.003,music,false);
      o.frequency.setValueAtTime(125,when); o.frequency.exponentialRampToValueAtTime(43,when+.14);
      o.connect(g); o.start(when); o.stop(when+.3); own(o,()=>g.disconnect());
    } else {
      const n = ctx.createBufferSource(), f = ctx.createBiquadFilter(), hat = kind === 'hat', brush = kind === 'brush';
      const length = hat ? .065 : brush ? .23 : .15, env = envelope(when,length,hat?.045:brush?.085:.15,.004,music,false);
      n.buffer = noise; f.type = 'highpass'; f.frequency.value = hat ? 6900 : brush ? 2000 : 1300;
      n.connect(f); f.connect(env); n.start(when,(step*.071)%4,length+.06); own(n,()=>{f.disconnect();env.disconnect();});
      if (!hat && !brush) partial(48,when,.12,.04,1,'triangle');
    }
  }
  function silenceVoices() { for (const voice of voices) { try { voice.stop(); } catch {} } voices.clear(); }
  function stopLocal() { if (localNode) { try { localNode.stop(); } catch {} localNode.disconnect(); localNode = null; } }
  function startLocal() { if (!localBuffer || localNode) return; localNode = ctx.createBufferSource(); localNode.buffer = localBuffer; localNode.loop = true; localNode.connect(music); localNode.start(0,Math.max(0,ctx.currentTime-trackStart)%localBuffer.duration); }
  function chooseTrack(index) {
    if (source === 'local') { stopLocal(); trackStart = ctx.currentTime; if(running)startLocal(); onTrack(track); return; }
    track = musicTrack(currentProfile,index); step = 0;
    if (ctx) { silenceVoices(); trackStart = ctx.currentTime; next = ctx.currentTime + .06; }
    onTrack(track);
  }
  function update(nextSettings) {
    settings = nextSettings;
    if (settings.musicProfile !== currentProfile) { currentProfile = settings.musicProfile; if(source==='generated')chooseTrack(0); }
    if (!ctx) return;
    const now = ctx.currentTime;
    master.gain.setTargetAtTime(settings.master / 100 * .65 * fade,now,.08);
    music.gain.setTargetAtTime(settings.music / 100,now,.09); ambience.gain.setTargetAtTime(settings.ambience / 100,now,.09);
    room.gain.setTargetAtTime(currentProfile==='ambient'?.50:currentProfile==='musicbox'?.34:.20,now,.1);
    const active = scenes.find(s => s.id === settings.scene).channels;
    for (const [key,gain] of Object.entries(beds)) {
      let level = active.includes(key) ? (settings.mix[key] || 0) / 100 : 0;
      if (key === 'sea') level *= .6 + .3 * Math.sin(now * .55);
      if (key === 'train') level *= .72 + .22 * Math.sin(now * 7);
      gain.gain.setTargetAtTime(level * ({rain:.29,wind:.75,vinyl:.035,fire:.4,sea:.55,train:1.1,crickets:.45}[key]),now,.12);
    }
  }
  function schedule() {
    if (!running || ctx.state !== 'running') return;
    update(settings);
    if (source === 'generated' && ctx.currentTime - trackStart >= track.duration) chooseTrack(track.index + 1);
    if (next < ctx.currentTime) next = ctx.currentTime + .04;
    while (next < ctx.currentTime + .22) {
      const beat = 60 / profileBpm(currentProfile,settings.mood), p = getProfile(currentProfile);
      const when = next + (step % 2 ? beat * p.swing : 0);
      if (source === 'generated') for (const e of arrangement(currentProfile,step,track.index,settings.band)) {
        if (e.drum) hit(when,e.drum); else instrument(e.pitch,when+e.delay,e.duration*beat,e.gain,e.instrument);
      }
      if (settings.scene === 'forest' && step % 4 === 1) {
        partial(104,next,.085,.09,1,'sine',.01,0,beds.crickets); partial(106,next+.13,.075,.065,1,'sine',.01,0,beds.crickets);
      }
      next += beat / 2; step++;
    }
  }
  async function start(nextSettings) {
    if (running || starting) return; starting = true;
    try {
      if (!ctx) build(); update(nextSettings); await ctx.resume();
      if (!starting) { await ctx.suspend(); return; }
      if (ctx.state !== 'running') throw new Error('请再次点击播放以允许声音');
      running = true; next = ctx.currentTime + .05; if(source==='local')startLocal(); schedule(); interval = setInterval(schedule,40); onState(true);
    } finally { starting = false; }
  }
  function stop() { starting = false; running = false; clearInterval(interval); silenceVoices(); if(ctx?.state==='running')void ctx.suspend().catch(()=>{}); onState(false); }
  async function loadFile(file) {
    if (!file || file.size > 60 * 1024 * 1024) throw new Error('请选择不超过 60 MB 的音频文件');
    const version = ++loadVersion; if (!ctx) build();
    let decoded; try { decoded = await ctx.decodeAudioData(await file.arrayBuffer()); } catch { throw new Error('无法读取这段音频，请尝试 MP3、WAV 或 OGG 文件'); }
    if (version !== loadVersion) return false;
    stopLocal(); silenceVoices(); localBuffer = decoded; source = 'local';
    track = {index:0,title:file.name,duration:decoded.duration,key:'local'}; trackStart = ctx.currentTime;
    if(running)startLocal(); else await ctx.suspend(); onTrack(track); return true;
  }
  function useGenerated() { ++loadVersion; source = 'generated'; stopLocal(); localBuffer = null; chooseTrack(0); }
  function snapshot() {
    let level = 0;
    if(running&&analyser){analyser.getFloatTimeDomainData(samples);level=Math.min(100,Math.round(Math.sqrt(samples.reduce((s,x)=>s+x*x,0)/samples.length)*850));}
    const elapsed = ctx ? Math.max(0,ctx.currentTime-trackStart) : 0;
    return {playing:running,level,source,elapsed:source==='local'?elapsed%track.duration:elapsed,track};
  }
  return {start,stop,update,loadFile,useGenerated,next:()=>chooseTrack(track.index+1),cue:chooseTrack,snapshot,setFade(value){fade=value;if(settings)update(settings);}};
}
