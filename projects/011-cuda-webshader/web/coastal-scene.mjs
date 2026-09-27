// A deliberately small, local teaching model: linearized shallow-water waves
// on one shared grid. It is separate from the upstream CUDA/WebGPU examples.
const canvas = document.querySelector('#coastal-canvas');
if (canvas) {
  const ctx = canvas.getContext('2d');
  const chart = document.querySelector('#coastal-chart');
  const chartCtx = chart.getContext('2d');
  const strengthInput = document.querySelector('#wave-strength');
  const tideInput = document.querySelector('#tide-level');
  const strengthValue = document.querySelector('#wave-strength-value');
  const tideValue = document.querySelector('#tide-level-value');
  const offshoreReadout = document.querySelector('#coastal-offshore');
  const harborReadout = document.querySelector('#coastal-harbor');
  const status = document.querySelector('#coastal-status');
  const pauseButton = document.querySelector('#coastal-pause');
  const resetButton = document.querySelector('#coastal-reset');
  const modeButtons = [...document.querySelectorAll('[data-scene-mode]')];

  const NX = 168, NY = 96, N = NX * NY;
  const RW = 480, RH = 270;
  const raster = document.createElement('canvas');
  raster.width = RW; raster.height = RH;
  const rctx = raster.getContext('2d');
  const pixels = rctx.createImageData(RW, RH);
  const eta = new Float32Array(N), nextEta = new Float32Array(N);
  const u = new Float32Array(N), v = new Float32Array(N);
  const nextU = new Float32Array(N), nextV = new Float32Array(N);
  const depth = new Float32Array(N), solid = new Uint8Array(N);
  const particles = [];
  const historyA = [], historyB = [];
  const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
  const index = (x, y) => y * NX + x;
  let phase = 0, frame = 0, lastFrame = 0, lastRecordedFrame = -1;
  let paused = false, sceneVisible = true, mode = 'surface';
  let waveStrength = Number(strengthInput.value) / 72;
  let tide = Number(tideInput.value) / 100;

  function shore(y) {
    const cove = Math.exp(-(((y - .43) / .22) ** 2));
    return .88 + .055 * cove - .017 * Math.sin(y * 12.5) - tide * .13;
  }
  function distanceToSegment(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    const t = clamp(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy), 0, 1);
    return Math.hypot(px - ax - t * dx, py - ay - t * dy);
  }
  function onBarrier(x, y) {
    // Detached western breakwater and a shore-connected southern jetty.
    return distanceToSegment(x, y, .59, .19, .595, .56) < .013 ||
      distanceToSegment(x, y, .68, .72, .865, .73) < .010;
  }
  function setTerrain() {
    for (let y = 0; y < NY; y++) for (let x = 0; x < NX; x++) {
      const xx = x / (NX - 1), yy = y / (NY - 1), i = index(x, y);
      solid[i] = Number(xx >= shore(yy) || onBarrier(xx, yy));
      const coastDistance = Math.max(.002, shore(yy) - xx);
      const shoal = .36 * Math.exp(-(((xx - .71) / .095) ** 2 + ((yy - .82) / .14) ** 2));
      depth[i] = clamp(.32 + 3.5 * Math.min(1, coastDistance * 3.1) + tide * .8 - shoal, .22, 3.8);
      if (solid[i]) { eta[i] = 0; u[i] = 0; v[i] = 0; }
    }
  }
  function reset() {
    eta.fill(0); nextEta.fill(0); u.fill(0); v.fill(0); nextU.fill(0); nextV.fill(0);
    phase = 0; frame = 0; lastRecordedFrame = -1;
    historyA.length = 0; historyB.length = 0; particles.length = 0;
    setTerrain();
    // Fill with a consistent traveling wave so the harbor is readable on first paint.
    for (let y = 1; y < NY - 1; y++) for (let x = 1; x < NX - 1; x++) {
      const i = index(x, y); if (solid[i]) continue;
      const k = x * .115 + .18 * Math.sin(y * .04);
      const envelope = .55 + .45 * Math.min(1, (NX - x) / 35);
      eta[i] = waveStrength * envelope * (.145 * Math.sin(k) + .052 * Math.sin(k * 1.58 + 1.2));
      u[i] = eta[i] * .42;
    }
  }
  function step() {
    const dt = .28, g = .29;
    phase += dt;
    for (let y = 1; y < NY - 1; y++) for (let x = 1; x < NX - 1; x++) {
      const i = index(x, y);
      if (solid[i]) { nextU[i] = 0; nextV[i] = 0; continue; }
      const friction = depth[i] < .7 ? .975 : .993;
      // Face-centered velocities avoid odd/even checkerboard artifacts.
      nextU[i] = solid[i + 1] ? 0 : (u[i] - g * dt * (eta[i + 1] - eta[i])) * friction;
      nextV[i] = solid[i + NX] ? 0 : (v[i] - g * dt * (eta[i + NX] - eta[i])) * friction;
    }
    for (let y = 1; y < NY - 1; y++) for (let x = 1; x < NX - 1; x++) {
      const i = index(x, y);
      if (solid[i]) { nextEta[i] = 0; continue; }
      const fluxE = solid[i + 1] ? 0 : nextU[i] * Math.min(depth[i], depth[i + 1]);
      const fluxW = solid[i - 1] ? 0 : nextU[i - 1] * Math.min(depth[i], depth[i - 1]);
      const fluxS = solid[i + NX] ? 0 : nextV[i] * Math.min(depth[i], depth[i + NX]);
      const fluxN = solid[i - NX] ? 0 : nextV[i - NX] * Math.min(depth[i], depth[i - NX]);
      nextEta[i] = (eta[i] - dt * (fluxE - fluxW + fluxS - fluxN)) * .9992;
    }
    const source = waveStrength * (.17 * Math.sin(phase * .145) + .055 * Math.sin(phase * .225 + 1.3));
    for (let y = 1; y < NY - 1; y++) {
      for (let x = 1; x < 4; x++) {
        const i = index(x, y);
        nextEta[i] = source * (.93 + .07 * Math.sin(y * .065));
        nextU[i] = source * .46;
      }
    }
    eta.set(nextEta); u.set(nextU); v.set(nextV);
  }
  function sample(field, xx, yy) {
    const x = clamp(xx * (NX - 1), 0, NX - 1.001), y = clamp(yy * (NY - 1), 0, NY - 1.001);
    const ix = Math.floor(x), iy = Math.floor(y), tx = x - ix, ty = y - iy, i = index(ix, iy);
    return (field[i] * (1 - tx) + field[i + 1] * tx) * (1 - ty) +
      (field[i + NX] * (1 - tx) + field[i + NX + 1] * tx) * ty;
  }
  function addImpulse(xx, yy, amount = .42) {
    for (let y = 1; y < NY - 1; y++) for (let x = 1; x < NX - 1; x++) {
      const i = index(x, y); if (solid[i]) continue;
      const dx = x / (NX - 1) - xx, dy = y / (NY - 1) - yy;
      const d2 = dx * dx + dy * dy;
      if (d2 < .004) eta[i] += amount * Math.exp(-d2 / .00065);
    }
    for (let n = 0; n < 18; n++) particles.push({x:xx + (Math.random()-.5)*.018,y:yy + (Math.random()-.5)*.018,life:.7 + Math.random()*.4});
  }
  function updateFoam() {
    if (frame % 2 === 0) for (let n = 0; n < 4; n++) {
      const y = .13 + Math.random() * .75;
      const x = .50 + Math.random() * .34;
      const e = sample(eta, x, y), h = sample(depth, x, y);
      if (e > .06 && (h < 1.25 || onBarrier(x + .012, y))) particles.push({x,y,life:.5 + Math.random()*.65});
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      const vx = sample(u, p.x, p.y), vy = sample(v, p.x, p.y);
      p.x += vx * .005 + .0003;
      p.y += vy * .005;
      p.life -= .006 + Math.random() * .003;
      if (p.life <= 0 || p.x < 0 || p.x > .98 || p.y < 0 || p.y > 1 || onBarrier(p.x,p.y)) particles.splice(i,1);
    }
    if (particles.length > 360) particles.splice(0, particles.length - 360);
  }
  function renderWater() {
    const data = pixels.data;
    for (let py = 0; py < RH; py++) {
      const yy = py / (RH - 1), row = Math.min(NY - 1, Math.floor(yy * NY));
      for (let px = 0; px < RW; px++) {
        const xx = px / (RW - 1), col = Math.min(NX - 1, Math.floor(xx * NX));
        const i = index(col, row), p = (py * RW + px) * 4;
        const land = xx >= shore(yy), barrier = !land && onBarrier(xx, yy);
        const noise = Math.sin(px * .58 + py * .36) * Math.sin(py * .67 - px * .15) * 2.5;
        let r, g, b;
        if (barrier) { r = 47+noise; g = 67+noise; b = 70+noise; }
        else if (land) {
          const beach = xx - shore(yy);
          const green = clamp((beach - .035) * 15, 0, 1);
          r = 197 - green * 90 + noise * 1.5;
          g = 174 - green * 53 + noise * 1.5;
          b = 120 - green * 65 + noise;
        } else {
          const d = depth[i], shallow = clamp((2.6 - d) / 2.2, 0, 1);
          const e = sample(eta, xx, yy), vx = sample(u,xx,yy), vy = sample(v,xx,yy);
          const speed = Math.hypot(vx,vy);
          if (mode === 'velocity') {
            const t = clamp(speed * 11, 0, 1);
            r = 18 + t * 220; g = 58 + t * 120; b = 78 - t * 25;
          } else if (mode === 'elevation') {
            const t = clamp(e * 2.5 + .5, 0, 1);
            r = 30 + t * 190; g = 60 + t * 155; b = 123 - t * 55;
          } else {
            const crest = clamp(e * 240, -70, 90);
            const shine = e > .07 ? (e - .07) * 110 : 0;
            r = 12 + shallow * 57 + crest * .45 + shine + noise;
            g = 67 + shallow * 90 + crest * .72 + shine + noise;
            b = 91 + shallow * 73 + crest * .44 + shine * .7 + noise;
          }
          const edge = Math.max(0, .02 - (shore(yy) - xx));
          if (edge > 0 && mode === 'surface') { r += edge * 2700; g += edge * 2500; b += edge * 1800; }
        }
        data[p] = clamp(r,0,255); data[p+1] = clamp(g,0,255); data[p+2] = clamp(b,0,255); data[p+3] = 255;
      }
    }
    rctx.putImageData(pixels,0,0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(raster,0,0,canvas.width,canvas.height);
  }
  function drawBarrier(ax,ay,bx,by,width) {
    ctx.lineCap = 'round';
    ctx.beginPath();ctx.moveTo(ax*960,ay*540);ctx.lineTo(bx*960,by*540);
    ctx.strokeStyle = '#122f39aa';ctx.lineWidth = width + 8;ctx.stroke();
    ctx.strokeStyle = '#4f6664';ctx.lineWidth = width;ctx.stroke();
    ctx.strokeStyle = '#9aa99b';ctx.lineWidth = 2;ctx.stroke();
  }
  function drawOverlay() {
    const w = canvas.width, h = canvas.height;
    drawBarrier(.59,.19,.595,.56,14);
    drawBarrier(.68,.72,.865,.73,10);
    ctx.beginPath();ctx.arc(.595*w,.56*h,8,0,Math.PI*2);ctx.fillStyle='#d6baa0';ctx.fill();
    ctx.beginPath();ctx.arc(.595*w,.56*h,4,0,Math.PI*2);ctx.fillStyle='#fff2c0';ctx.fill();
    // Shore contour and a tiny pier make the map read as a built harbor.
    ctx.beginPath();for(let y=0;y<=h;y+=3){const x=shore(y/h)*w;if(y===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)}
    ctx.strokeStyle='#ffe5a4b5';ctx.lineWidth=3;ctx.stroke();
    ctx.fillStyle='#304344';ctx.fillRect(.865*w,.37*h,45,6);ctx.fillRect(.865*w,.44*h,31,5);
    if (mode === 'velocity') {
      ctx.strokeStyle='#d7f9dbc4';ctx.fillStyle='#d7f9dbd9';ctx.lineWidth=1.5;
      for(let y=9;y<NY-5;y+=9)for(let x=9;x<NX-6;x+=11){const i=index(x,y);if(solid[i])continue;const xx=x/(NX-1)*w,yy=y/(NY-1)*h;const dx=u[i]*90,dy=v[i]*70;const mag=Math.hypot(dx,dy);if(mag<1.5)continue;ctx.beginPath();ctx.moveTo(xx,yy);ctx.lineTo(xx+dx,yy+dy);ctx.stroke();ctx.beginPath();ctx.arc(xx+dx,yy+dy,1.8,0,Math.PI*2);ctx.fill();}
    }
    if (mode === 'surface') {
      ctx.fillStyle='#e8fff1';
      for(const p of particles){ctx.globalAlpha=clamp(p.life,0,.8);ctx.beginPath();ctx.arc(p.x*w,p.y*h,1.1+Math.max(0,p.life)*1.3,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
    }
    drawGauge(.20,.42,'A','外海', '#b9f5d9');
    drawGauge(.75,.42,'B','港内', '#f3cf8e');
    ctx.fillStyle='#effbf2d9';ctx.font='700 12px system-ui';ctx.letterSpacing='1px';
    ctx.fillText('OPEN SEA  →',37,43);
    ctx.fillStyle='#e9f6ebdc';ctx.fillText('SHELTERED HARBOR',.67*w,.18*h);
    ctx.font='11px system-ui';ctx.fillText('防波堤',.51*w,.63*h);
  }
  function drawGauge(x,y,name,label,color){
    const xx=x*960,yy=y*540;
    ctx.beginPath();ctx.arc(xx,yy,16,0,Math.PI*2);ctx.fillStyle='#082c3bc9';ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle=color;ctx.font='700 14px system-ui';ctx.textAlign='center';ctx.fillText(name,xx,yy+5);ctx.textAlign='left';
    ctx.fillStyle='#f3fff6';ctx.font='11px system-ui';ctx.fillText(label,xx+22,yy+4);
  }
  function drawChart(){
    const w=chart.width,h=chart.height;chartCtx.clearRect(0,0,w,h);
    chartCtx.strokeStyle='#9dbec441';chartCtx.lineWidth=1;
    for(let y=20;y<h;y+=24){chartCtx.beginPath();chartCtx.moveTo(0,y);chartCtx.lineTo(w,y);chartCtx.stroke();}
    function line(values,color){if(values.length<2)return;chartCtx.beginPath();for(let i=0;i<values.length;i++){const x=i/(Math.max(1,values.length-1))*w,y=h/2-values[i]*94;if(i===0)chartCtx.moveTo(x,y);else chartCtx.lineTo(x,y)}chartCtx.strokeStyle=color;chartCtx.lineWidth=2;chartCtx.stroke();}
    line(historyA,'#a9efcf');line(historyB,'#ebc585');
  }
  function updateReadings(){
    const a=sample(eta,.20,.42), b=sample(eta,.75,.42);
    offshoreReadout.innerHTML=`${a>=0?'+':''}${a.toFixed(2)} <small>相对水位</small>`;
    harborReadout.innerHTML=`${b>=0?'+':''}${b.toFixed(2)} <small>相对水位</small>`;
    if(frame%3===0 && frame!==lastRecordedFrame){
      lastRecordedFrame=frame;historyA.push(a);historyB.push(b);
      if(historyA.length>120){historyA.shift();historyB.shift();}drawChart();
    }
  }
  function paint(){renderWater();drawOverlay();updateReadings();}
  function animate(now){
    requestAnimationFrame(animate);
    if(now-lastFrame<31)return;lastFrame=now;
    if(paused || !sceneVisible)return;
    for(let n=0;n<4;n++)step();frame++;updateFoam();
    paint();
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries=>{sceneVisible=entries[0].isIntersecting;},{rootMargin:'200px'}).observe(canvas);
  }
  canvas.addEventListener('pointerdown',event=>{
    const rect=canvas.getBoundingClientRect();const x=(event.clientX-rect.left)/rect.width,y=(event.clientY-rect.top)/rect.height;
    if(x<shore(y)&&!onBarrier(x,y)){addImpulse(x,y);paint();}
  });
  strengthInput.addEventListener('input',()=>{
    waveStrength=Number(strengthInput.value)/72;
    const n=Number(strengthInput.value);strengthValue.value=n<50?'较弱':n<90?'中等':'较强';
  });
  tideInput.addEventListener('input',()=>{
    tide=Number(tideInput.value)/100;
    tideValue.value=tide<-0.08?'低潮':tide>0.08?'高潮':'常位';
    setTerrain();paint();
  });
  modeButtons.forEach(button=>button.addEventListener('click',()=>{
    mode=button.dataset.sceneMode;modeButtons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));paint();
  }));
  pauseButton.addEventListener('click',()=>{paused=!paused;pauseButton.textContent=paused?'继续':'暂停';status.textContent=paused?'已暂停 · 点击海面仍可激起波纹':'计算中 · 点击海面激起一圈波纹';});
  resetButton.addEventListener('click',()=>{reset();paint();});
  reset();paint();requestAnimationFrame(animate);
}
