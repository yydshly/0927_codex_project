import { chords, frequency, seedRandom } from './lab-model.js';

export function createStudyAudio(onState) {
  let context, musicGain, rainGain, analyser, noiseSource, timer, values;
  let step = 0, nextTime = 0, playing = false, starting = false;
  const voices = new Set();
  let events = [];
  let currentChord = '—';
  function build() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) throw new Error('当前浏览器不支持 Web Audio，请换用支持音频的桌面浏览器。');
    context = new AudioContext();
    const master = context.createGain(); master.gain.value = .55;
    const compressor = context.createDynamicsCompressor(); compressor.threshold.value = -15; compressor.ratio.value = 6;
    analyser = context.createAnalyser(); analyser.fftSize = 256;
    musicGain = context.createGain(); rainGain = context.createGain();
    musicGain.gain.value = 0; rainGain.gain.value = 0;
    musicGain.connect(master); rainGain.connect(master);
    master.connect(compressor); compressor.connect(analyser); analyser.connect(context.destination);
    // Filtered noise is the rain bed. No external audio files are loaded.
    const buffer = context.createBuffer(1, context.sampleRate * 4, context.sampleRate);
    const data = buffer.getChannelData(0), random = seedRandom(151);
    let smooth = 0;
    for (let i = 0; i < data.length; i++) { smooth = .965 * smooth + .035 * (random() * 2 - 1); data[i] = smooth * 3.2; }
    noiseSource = context.createBufferSource(); noiseSource.buffer = buffer; noiseSource.loop = true;
    const low = context.createBiquadFilter(); low.type = 'lowpass'; low.frequency.value = 4600;
    const high = context.createBiquadFilter(); high.type = 'highpass'; high.frequency.value = 380;
    noiseSource.connect(high); high.connect(low); low.connect(rainGain); noiseSource.start();
    context.onstatechange = () => {
      if (context.state !== 'running' && playing) stop();
      onState(playing && context.state === 'running');
    };
    values = new Float32Array(analyser.fftSize);
  }
  function tone(note, time, duration, volume, type = 'sine') {
    const oscillator = context.createOscillator(), envelope = context.createGain();
    oscillator.type = type; oscillator.frequency.value = frequency(note);
    envelope.gain.setValueAtTime(0, time);
    envelope.gain.linearRampToValueAtTime(volume, time + .025);
    envelope.gain.exponentialRampToValueAtTime(.001, time + duration);
    envelope.gain.linearRampToValueAtTime(0, time + duration + .03);
    oscillator.connect(envelope); envelope.connect(musicGain);
    voices.add(oscillator);
    oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); voices.delete(oscillator); };
    oscillator.start(time); oscillator.stop(time + duration + .05);
  }
  function schedule(settings) {
    if (!playing || context.state !== 'running') return;
    const now = context.currentTime;
    if (nextTime < now) nextTime = now + .03; // No burst of missed beats after a throttled tab.
    while (nextTime < now + .18) {
      const chord = chords[Math.floor(step / 8) % chords.length];
      const beat = 60 / settings.bpm;
      if (step % 8 === 0) {
        chord.notes.forEach((note, index) => tone(note, nextTime + index * .012, beat * 3.4, .105, 'triangle'));
        tone(chord.bass, nextTime, beat * 2.6, .19);
        events.push({ time: nextTime, name: chord.name });
      }
      if (step % 2 === 0) tone(chord.notes[(step / 2) % 4] + 12, nextTime, beat * 1.2, .07);
      nextTime += beat / 2; step++;
    }
    while (events.length && events[0].time <= now) currentChord = events.shift().name;
  }
  function update(settings) {
    if (!context) return;
    musicGain.gain.setTargetAtTime(settings.music / 100, context.currentTime, .06);
    rainGain.gain.setTargetAtTime(settings.ambience / 100 * settings.rain / 100 * 1.8, context.currentTime, .06);
  }
  async function start(settings) {
    if (playing || starting) return;
    starting = true;
    try {
      if (!context) build();
      await context.resume();
      // A view change during resume must not start sound on another page.
      if (!starting) { await context.suspend(); return; }
      if (context.state !== 'running') throw new Error('浏览器尚未允许声音，请再次点击开启。');
      playing = true; update(settings); step = 0; nextTime = context.currentTime + .06;
      schedule(settings); timer = window.setInterval(() => schedule(settings), 35); onState(true);
    } finally { starting = false; }
  }
  function stop() {
    starting = false; playing = false; clearInterval(timer); timer = undefined;
    for (const voice of voices) { try { voice.stop(); } catch { /* Already ended. */ } }
    voices.clear(); events = []; currentChord = '—';
    if (context && context.state === 'running') void context.suspend().catch(() => {});
    onState(false);
  }
  function snapshot() {
    if (!playing || !analyser) return { level: 0, chord: '—' };
    analyser.getFloatTimeDomainData(values);
    const rms = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0) / values.length);
    return { level: Math.min(100, Math.round(rms * 900)), chord: currentChord };
  }
  return { start, stop, update, snapshot };
}
