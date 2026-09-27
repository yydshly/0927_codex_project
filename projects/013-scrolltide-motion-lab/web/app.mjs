import * as THREE from './vendor/three.module.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const $ = (selector) => document.querySelector(selector);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const formatTime = (seconds) => `00:${String(Math.floor(seconds) % 60).padStart(2, '0')}`;

function setupFilm(videoSelector, buttonSelector) {
  const video = $(videoSelector);
  const button = $(buttonSelector);
  if (videoSelector === '#film') {
    button.textContent = '播放镜头';
    const startOnEntry = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) return;
      startOnEntry.disconnect();
      if (reducedMotion.matches || video.dataset.started) return;
      video.dataset.started = 'true';
      video.play().then(() => { button.textContent = '暂停影片'; }).catch(() => { button.textContent = '播放镜头'; });
    }, { threshold: .28 });
    startOnEntry.observe(video);
  } else if (reducedMotion.matches) video.pause();
  else video.play().catch(() => { button.textContent = '播放背景视频'; });
  button.addEventListener('click', async () => {
    if (video.paused) {
      video.dataset.started = 'true';
      if (video.ended) video.currentTime = 0;
      await video.play().catch(() => {});
    }
    else video.pause();
    button.textContent = video.paused ? (videoSelector === '#film' ? '播放影片' : '播放背景视频') : (videoSelector === '#film' ? '暂停影片' : '暂停背景视频');
    button.setAttribute('aria-pressed', String(video.paused));
  });
  if (videoSelector === '#film') video.addEventListener('ended', () => { button.textContent = '重播镜头'; button.setAttribute('aria-pressed', 'true'); });
  return video;
}

const film = setupFilm('#film', '#film-toggle');
const hybridFilm = setupFilm('#hybrid-film', '#hybrid-toggle');
const filmReplay = $('#film-stage-replay');
function replayFilm() {
  film.currentTime = 0;
  film.dataset.started = 'true';
  filmReplay.hidden = true;
  film.play().catch(() => {});
}
$('#film-demo').addEventListener('click', replayFilm);
filmReplay.addEventListener('click', replayFilm);
film.addEventListener('playing', () => { filmReplay.hidden = true; $('#video-status').textContent = `正在播放 · ${formatTime(film.currentTime)}`; });
film.addEventListener('pause', () => { if (!film.ended) $('#video-status').textContent = `已暂停 · ${formatTime(film.currentTime)}`; });
film.addEventListener('ended', () => { filmReplay.hidden = false; $('#video-status').textContent = `已定格 · ${formatTime(film.currentTime)} / ${formatTime(film.duration)}`; });
film.addEventListener('timeupdate', () => {
  const fraction = film.duration ? film.currentTime / film.duration : 0;
  $('#film-progress').style.transform = `scaleX(${fraction})`;
  $('#film-time').textContent = formatTime(film.currentTime);
  if (!film.ended) $('#video-status').textContent = `${film.paused ? '已暂停' : '正在播放'} · ${formatTime(film.currentTime)} / ${formatTime(film.duration || 0)}`;
});
function updateHybridStatus() {
  $('#hybrid-status').textContent = `${hybridFilm.paused ? '背景已暂停' : `背景 ${formatTime(hybridFilm.currentTime)}`} · 战机实时渲染`;
  $('#hybrid-demo').textContent = hybridFilm.paused ? '继续播放背景 ↗' : '暂停背景验证 ↗';
}
hybridFilm.addEventListener('timeupdate', updateHybridStatus);
hybridFilm.addEventListener('play', updateHybridStatus);
hybridFilm.addEventListener('pause', updateHybridStatus);
$('#hybrid-demo').addEventListener('click', () => $('#hybrid-toggle').click());
$('#film-speed').addEventListener('input', (event) => {
  film.playbackRate = Number(event.target.value);
  $('#film-speed-output').textContent = `${film.playbackRate.toFixed(2).replace(/0$/, '').replace(/\.$/, '')}×`;
});

// A real image sequence: the browser only selects and draws already rendered frames.
const frameCanvas = $('#sequence-canvas');
const frameContext = frameCanvas.getContext('2d');
const frameRange = $('#frame-range');
const frameImages = Array.from({ length: 72 }, (_, index) => {
  const image = new Image();
  image.src = `media/watch-frames/watch-${String(index).padStart(3, '0')}.webp`;
  return image;
});
let currentFrame = 0;
let sequenceAutoplay = false;
let sequenceLastTick = 0;
let lastManualFrame = 0;
let sequenceAutoUntil = 0;
let sequenceAutoStarted = false;
function setSequenceAutoplay(value) {
  sequenceAutoplay = value;
  $('#frame-auto').textContent = value ? '停止巡回' : '自动巡回';
  $('#frame-auto').setAttribute('aria-pressed', String(value));
  $('#sequence-demo').textContent = value ? '停止逐帧示范 ↗' : '播放逐帧示范 ↗';
  $('#sequence-status').textContent = `${value ? '逐帧巡回' : '当前'} · 第 ${String(currentFrame + 1).padStart(2, '0')} / 72 帧`;
}
function showFrame(index) {
  currentFrame = ((index % 72) + 72) % 72;
  const image = frameImages[currentFrame];
  const draw = () => {
    if (currentFrame !== index && ((index % 72) + 72) % 72 !== currentFrame) return;
    if (image.naturalWidth) frameContext.drawImage(image, 0, 0, 960, 540);
  };
  if (image.complete && image.naturalWidth) draw();
  else image.addEventListener('load', draw, { once: true });
  frameRange.value = String(currentFrame);
  $('#frame-output').textContent = `${String(currentFrame + 1).padStart(2, '0')} / 72`;
  $('#frame-badge').textContent = `FRAME ${String(currentFrame + 1).padStart(2, '0')} / 72`;
  $('#sequence-status').textContent = `${sequenceAutoplay ? '逐帧巡回' : '当前'} · 第 ${String(currentFrame + 1).padStart(2, '0')} / 72 帧`;
}
showFrame(0);
frameRange.addEventListener('input', () => { lastManualFrame = performance.now(); sequenceAutoUntil = 0; setSequenceAutoplay(false); showFrame(Number(frameRange.value)); });
function toggleSequenceAutoplay() { sequenceAutoUntil = 0; setSequenceAutoplay(!sequenceAutoplay); }
$('#frame-auto').addEventListener('click', toggleSequenceAutoplay);
$('#sequence-demo').addEventListener('click', toggleSequenceAutoplay);
let dragX = null;
const sequenceStage = $('#sequence-stage');
sequenceStage.addEventListener('pointerdown', (event) => { dragX = event.clientX; sequenceStage.setPointerCapture(event.pointerId); });
sequenceStage.addEventListener('pointermove', (event) => {
  if (dragX === null) return;
  const delta = event.clientX - dragX;
  if (Math.abs(delta) > 5) { lastManualFrame = performance.now(); sequenceAutoUntil = 0; setSequenceAutoplay(false); showFrame(currentFrame + Math.trunc(delta / 5)); dragX = event.clientX; }
});
for (const type of ['pointerup', 'pointercancel']) sequenceStage.addEventListener(type, () => { dragX = null; });
window.addEventListener('scroll', () => {
  if (sequenceAutoplay || performance.now() - lastManualFrame < 900) return;
  const box = sequenceStage.getBoundingClientRect();
  if (box.bottom < 0 || box.top > window.innerHeight) return;
  const progress = clamp((window.innerHeight * .72 - box.top) / (box.height + window.innerHeight * .28), 0, 1);
  const frame = Math.round(progress * 71);
  if (frame !== currentFrame) showFrame(frame);
}, { passive: true });

function createThreeStage(canvas, fallback, alpha = false) {
  try {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, .1, 100);
    camera.position.set(0, .1, 7);
    scene.add(new THREE.AmbientLight(0x96b9bb, 1.35));
    const key = new THREE.PointLight(0xeaffbe, 85, 20);
    key.position.set(-2.5, 3.5, 3.5);
    scene.add(key);
    const rim = new THREE.PointLight(0x8adbf3, 75, 20);
    rim.position.set(3.5, -1, -2.5);
    scene.add(rim);
    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    new ResizeObserver(resize).observe(canvas);
    resize();
    return { renderer, scene, camera };
  } catch (error) {
    fallback.hidden = false;
    return null;
  }
}

const threeStage = createThreeStage($('#three-canvas'), $('#three-fallback'), true);
let objectGroup = null;
let turnSpeed = reducedMotion.matches ? 0 : .6;
let draggingThree = false;
let lastPointer = [0, 0];
let threeBaseYaw = .08;
let threeSideView = false;
if (threeStage) {
  objectGroup = new THREE.Group();
  threeStage.scene.add(objectGroup);
  threeStage.renderer.toneMappingExposure = 1.65;
  threeStage.scene.children.filter(item => item.isLight).forEach(light => { light.intensity *= .85; });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x102b22, metalness: .22, roughness: .12, clearcoat: 1, clearcoatRoughness: .05, transmission: .1, thickness: .65 });
  const wine = new THREE.MeshPhysicalMaterial({ color: 0x260a10, metalness: .08, roughness: .22, clearcoat: .9 });
  const profile = [[0,-1.58],[.37,-1.58],[.43,-1.52],[.47,-1.38],[.47,-.58],[.46,.14],[.44,.54],[.38,.72],[.25,.88],[.18,1.02],[.18,1.48],[.20,1.53],[.19,1.60],[0,1.60]].map(([radius,y]) => new THREE.Vector2(radius,y));
  const bottle = new THREE.Mesh(new THREE.LatheGeometry(profile, 64), glass);
  objectGroup.add(bottle);
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(.405, .405, 1.82, 48), wine);
  inner.position.y = -.48;
  objectGroup.add(inner);
  const punt = new THREE.Mesh(new THREE.TorusGeometry(.35, .025, 8, 48), new THREE.MeshPhysicalMaterial({ color: 0x23372a, metalness: .42, roughness: .15 }));
  punt.rotation.x = Math.PI / 2;
  punt.position.y = -1.56;
  objectGroup.add(punt);
  const foil = new THREE.Mesh(new THREE.CylinderGeometry(.215, .19, .66, 48), new THREE.MeshPhysicalMaterial({ color: 0x4b091d, metalness: .65, roughness: .19, clearcoat: .8 }));
  foil.position.y = 1.27;
  objectGroup.add(foil);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(.213, .213, .045, 48), new THREE.MeshStandardMaterial({ color: 0x180810, metalness: .5, roughness: .25 }));
  cap.position.y = 1.62;
  objectGroup.add(cap);
  const labelCanvas = document.createElement('canvas');
  labelCanvas.width = 1024; labelCanvas.height = 600;
  const ctx = labelCanvas.getContext('2d');
  ctx.fillStyle = '#eee6d4'; ctx.fillRect(0, 0, 1024, 600);
  ctx.strokeStyle = '#9d8b74'; ctx.lineWidth = 5; ctx.strokeRect(20, 20, 984, 560);
  ctx.fillStyle = '#6c1229'; ctx.textAlign = 'center';
  ctx.font = '600 38px Georgia'; ctx.fillText('VESPER', 512, 115);
  ctx.fillRect(466, 147, 92, 3);
  ctx.font = 'bold 95px Georgia'; ctx.fillText('ESTATE', 512, 288);
  ctx.font = '30px Georgia'; ctx.fillText('CABERNET SAUVIGNON', 512, 350);
  ctx.font = '23px Georgia'; ctx.fillText('SINGLE VINEYARD   ·   2024', 512, 425);
  ctx.font = '24px Georgia'; ctx.fillText('NAPA VALLEY  /  CALIFORNIA', 512, 502);
  const labelTexture = new THREE.CanvasTexture(labelCanvas);
  labelTexture.colorSpace = THREE.SRGBColorSpace;
  const label = new THREE.Mesh(new THREE.PlaneGeometry(.90, .53), new THREE.MeshStandardMaterial({ map: labelTexture, side: THREE.DoubleSide, roughness: .82 }));
  label.position.y = -.26;
  label.position.z = .495;
  objectGroup.add(label);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(.197, .012, 8, 48), new THREE.MeshStandardMaterial({ color: 0xa66c70, metalness: .85, roughness: .16 }));
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 1.54;
  objectGroup.add(collar);
  objectGroup.rotation.set(.04, .08, -.14);
  const canvas = $('#three-canvas');
  canvas.addEventListener('pointerdown', (event) => { draggingThree = true; lastPointer = [event.clientX, event.clientY]; canvas.setPointerCapture(event.pointerId); });
  canvas.addEventListener('pointermove', (event) => {
    if (!draggingThree) return;
    objectGroup.rotation.y += (event.clientX - lastPointer[0]) * .008;
    threeBaseYaw = objectGroup.rotation.y;
    objectGroup.rotation.x = clamp(objectGroup.rotation.x + (event.clientY - lastPointer[1]) * .008, -1.4, 1.4);
    lastPointer = [event.clientX, event.clientY];
  });
  for (const type of ['pointerup', 'pointercancel']) canvas.addEventListener(type, () => { draggingThree = false; });
}
$('#three-speed').value = String(turnSpeed);
$('#three-speed-output').textContent = `${turnSpeed.toFixed(1)}×`;
$('#three-speed').addEventListener('input', (event) => { turnSpeed = Number(event.target.value); $('#three-speed-output').textContent = `${turnSpeed.toFixed(1)}×`; });
function setThreeSideView(value) {
  threeSideView = value;
  threeBaseYaw = value ? 1.28 : .08;
  $('#three-demo').textContent = value ? '转回正面 ↗' : '转到侧面 ↗';
}
$('#three-demo').addEventListener('click', () => setThreeSideView(!threeSideView));
$('#three-reset').addEventListener('click', () => { setThreeSideView(false); if (objectGroup) objectGroup.rotation.set(.04, .08, -.14); });
if (!threeStage) $('#three-status').textContent = '当前浏览器未启用 WebGL';

// The second WebGL scene is transparent and sits above a separate HTML video element.
const hybridStage = createThreeStage($('#hybrid-canvas'), $('#hybrid-fallback'), true);
let hybridGroup = null;
let hybridDepth = .5;
let pointerTarget = [0, 0];
if (!hybridStage) $('#hybrid-status').textContent = '背景视频可播放 · 3D 不可用';
if (hybridStage) {
  hybridGroup = new THREE.Group();
  hybridStage.scene.add(hybridGroup);
  hybridStage.renderer.toneMappingExposure = 1.3;
  hybridStage.scene.children.filter(item => item.isLight).forEach(light => { light.color.setHex(0xffffff); light.intensity *= 1.15; });
  const silver = new THREE.MeshPhysicalMaterial({ color: 0xc8d2d5, metalness: .65, roughness: .29, clearcoat: .65, side: THREE.DoubleSide });
  const lightSilver = new THREE.MeshPhysicalMaterial({ color: 0xe0e8e6, metalness: .53, roughness: .31, side: THREE.DoubleSide });
  const dark = new THREE.MeshPhysicalMaterial({ color: 0x48555b, metalness: .62, roughness: .28 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x162b39, metalness: .38, roughness: .08, clearcoat: 1, emissive: 0x103442, emissiveIntensity: .25 });
  const add = (geometry, material, x=0, y=0, z=0) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x,y,z);
    hybridGroup.add(mesh);
    return mesh;
  };
  const hull = add(new THREE.CylinderGeometry(.25, .34, 2.18, 16), silver);
  hull.rotation.x = Math.PI / 2;
  const nose = add(new THREE.ConeGeometry(.255, .9, 16), lightSilver, 0, 0, 1.50);
  nose.rotation.x = Math.PI / 2;
  const spine = add(new THREE.BoxGeometry(.36, .11, 1.1), lightSilver, 0, .20, -.30);
  const canopy = add(new THREE.SphereGeometry(.31, 32, 20), glass, 0, .22, .45);
  canopy.scale.set(.78, .47, 1.38);
  const canopyRim = add(new THREE.TorusGeometry(.24, .015, 7, 48), dark, 0, .21, .43);
  canopyRim.scale.set(.9, 1, 1.55);
  canopyRim.rotation.x = Math.PI / 2;
  const wing = (side, points, material, y) => {
    const shape = new THREE.Shape();
    shape.moveTo(points[0][0] * side, -points[0][1]);
    points.slice(1).forEach(([x,z]) => shape.lineTo(x * side, -z));
    shape.closePath();
    const mesh = add(new THREE.ShapeGeometry(shape), material, 0, y, 0);
    mesh.rotation.x = -Math.PI / 2;
    return mesh;
  };
  for (const side of [-1, 1]) {
    wing(side, [[.21,.45],[.52,.35],[1.85,-.45],[2.03,-.66],[.50,-.48],[.25,-.58]], silver, -.09);
    wing(side, [[.35,-.69],[1.08,-1.18],[1.15,-1.31],[.36,-1.11]], lightSilver, -.07);
    wing(side, [[.52,-.92],[.63,-1.47],[.76,-1.54],[.81,-.96]], dark, .33).rotation.set(-Math.PI/2,0,side * .13);
    const engine = add(new THREE.CylinderGeometry(.19, .22, 1.08, 16), dark, side * .38, -.12, -.79);
    engine.rotation.x = Math.PI / 2;
    const intake = add(new THREE.BoxGeometry(.35, .32, .44), lightSilver, side * .37, -.16, -.18);
    intake.rotation.y = side * .08;
    add(new THREE.CylinderGeometry(.145, .145, .035, 20), new THREE.MeshStandardMaterial({ color: 0x202e36, metalness: .75, roughness: .34 }), side * .38, -.12, -1.35).rotation.x = Math.PI / 2;
    const rail = add(new THREE.CylinderGeometry(.022, .035, 1.0, 8), dark, side * 1.21, -.18, -.48);
    rail.rotation.x = Math.PI / 2;
    const missile = add(new THREE.CylinderGeometry(.055, .055, .49, 8), lightSilver, side * 1.21, -.23, -.46);
    missile.rotation.x = Math.PI / 2;
    add(new THREE.ConeGeometry(.055, .15, 8), lightSilver, side * 1.21, -.23, -.13).rotation.x = Math.PI / 2;
  }
  hybridGroup.scale.setScalar(1.12);
  hybridGroup.rotation.set(.58, .07, -.04);
  const hybridCanvas = $('#hybrid-canvas');
  hybridCanvas.parentElement.addEventListener('pointermove', (event) => {
    const bounds = hybridCanvas.getBoundingClientRect();
    pointerTarget = [(event.clientX - bounds.left) / bounds.width - .5, (event.clientY - bounds.top) / bounds.height - .5];
  });
  hybridCanvas.parentElement.addEventListener('pointerleave', () => { pointerTarget = [0, 0]; });
}
$('#hybrid-depth').addEventListener('input', (event) => { hybridDepth = Number(event.target.value) / 100; $('#hybrid-depth-output').textContent = `${event.target.value}%`; });

// DOM elements retain selectable text while CSS supplies the perspective illusion.
const cards = [...document.querySelectorAll('.orbit-card')];
const carouselWorld = $('#carousel-world');
let activeCard = 2;
let tilt = .62;
function renderCards() {
  const step = Math.min(220, carouselWorld.clientWidth * .245);
  cards.forEach((card, index) => {
    const offset = index - activeCard;
    const distance = Math.abs(offset);
    card.style.transform = `translate3d(${offset * step}px, ${distance * 17}px, ${-distance * (130 + tilt * 115)}px) rotateY(${-offset * (17 + tilt * 43)}deg) scale(${1 - distance * .065})`;
    card.style.zIndex = String(10 - distance);
    card.style.opacity = String(1 - distance * .18);
    card.style.filter = `brightness(${1 - distance * .12}) blur(${distance * .65}px)`;
    card.setAttribute('aria-current', String(index === activeCard));
  });
  $('#carousel-count').textContent = String(activeCard + 1).padStart(2, '0');
  $('#carousel-status').textContent = `当前第 ${String(activeCard + 1).padStart(2, '0')} / 05 张卡片`;
}
renderCards();
$('#carousel-prev').addEventListener('click', () => { activeCard = (activeCard + cards.length - 1) % cards.length; renderCards(); });
$('#carousel-next').addEventListener('click', () => { activeCard = (activeCard + 1) % cards.length; renderCards(); });
$('#carousel-demo').addEventListener('click', () => $('#carousel-next').click());
cards.forEach((card, index) => card.addEventListener('click', () => { activeCard = index; renderCards(); }));
$('#carousel-tilt').addEventListener('input', (event) => { tilt = Number(event.target.value) / 100; $('#carousel-tilt-output').textContent = `${event.target.value}%`; renderCards(); });
new ResizeObserver(renderCards).observe(carouselWorld);
let carouselStart = null;
carouselWorld.addEventListener('pointerdown', (event) => { carouselStart = event.clientX; });
carouselWorld.addEventListener('pointerup', (event) => {
  if (carouselStart === null) return;
  const distance = event.clientX - carouselStart;
  if (Math.abs(distance) > 50) { activeCard = (activeCard + (distance < 0 ? 1 : cards.length - 1)) % cards.length; renderCards(); }
  carouselStart = null;
});

const vertexShader = `attribute vec2 a_position; void main(){ gl_Position=vec4(a_position,0.0,1.0); }`;
const fragmentShader = `precision highp float;
uniform vec2 u_resolution; uniform float u_time; uniform float u_hue; uniform float u_fold;
vec3 hsv2rgb(vec3 c){vec3 p=abs(fract(c.xxx+vec3(0.,2./3.,1./3.))*6.-3.);return c.z*mix(vec3(1.),clamp(p-1.,0.,1.),c.y);}
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void main(){
  vec2 p=(gl_FragCoord.xy-.5*u_resolution.xy)/min(u_resolution.x,u_resolution.y);
  float t=u_time;
  float bend=.31*sin(p.x*2.2-t*.62)+.11*sin(p.x*5.6+p.y*1.4+t*.46);
  bend+=.075*sin(p.x*8.1-p.y*3.2-t*.72);
  float flow=p.y+bend;
  float bands=sin(flow*(10.0+u_fold*6.0)+.6*sin(p.x*2.1+t*.42));
  float ribbons=pow(.5+.5*bands,4.2);
  float silk=.5+.5*sin(flow*3.2+p.x*.8-t*.38);
  float eddy=.5+.5*sin((p.x+p.y*.23)*3.3+t*.48);
  vec3 deep=hsv2rgb(vec3(u_hue,.78,.11));
  vec3 mid=hsv2rgb(vec3(u_hue+.018,.66,.55));
  vec3 pale=mix(vec3(.82,.96,1.0),hsv2rgb(vec3(u_hue,.18,1.0)),.45);
  vec3 colour=mix(deep,mid,smoothstep(.16,.84,silk*.55+eddy*.45));
  colour=mix(colour,pale,ribbons*(.49+.25*silk));
  colour+=mid*.15*pow(.5+.5*sin(flow*5.0+t*.38),3.0);
  float vignette=1.0-.34*dot(p,p);
  colour*=vignette;
  colour+=(hash(gl_FragCoord.xy)-.5)*.016;
  gl_FragColor=vec4(colour,1.0);
}`;
function setupShader(canvas) {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
  if (!gl) return null;
  const compile = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
    return shader;
  };
  const program = gl.createProgram();
  gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexShader));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentShader));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const uniforms = Object.fromEntries(['u_resolution','u_time','u_hue','u_fold'].map(name => [name, gl.getUniformLocation(program, name)]));
  const resize = () => {
    const bounds = canvas.getBoundingClientRect();
    const scale = Math.min(window.devicePixelRatio || 1, 1.3);
    canvas.width = Math.max(1, Math.floor(bounds.width * scale));
    canvas.height = Math.max(1, Math.floor(bounds.height * scale));
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  new ResizeObserver(resize).observe(canvas);
  resize();
  return (time, hue, fold) => {
    gl.uniform2f(uniforms.u_resolution, canvas.width, canvas.height);
    gl.uniform1f(uniforms.u_time, time);
    gl.uniform1f(uniforms.u_hue, hue / 360);
    gl.uniform1f(uniforms.u_fold, fold);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  };
}
let drawShader = null;
try { drawShader = setupShader($('#shader-canvas')); } catch (error) { console.warn('Shader unavailable:', error); }
if (!drawShader) $('#shader-fallback').hidden = false;
let shaderHue = 210, shaderFlow = reducedMotion.matches ? 0 : 1, shaderFold = .5;
if (!drawShader) $('#shader-status').textContent = '当前浏览器未启用 WebGL';
$('#shader-hue').addEventListener('input', (event) => { shaderHue = Number(event.target.value); $('#shader-hue-output').textContent = `${shaderHue}°`; });
$('#shader-flow').value = String(shaderFlow);
$('#shader-flow-output').textContent = `${shaderFlow.toFixed(1)}×`;
$('#shader-flow').addEventListener('input', (event) => { shaderFlow = Number(event.target.value); $('#shader-flow-output').textContent = `${shaderFlow.toFixed(1)}×`; });
$('#shader-demo').addEventListener('click', () => {
  shaderFlow = shaderFlow > 1.5 ? 1 : 2.4;
  $('#shader-flow').value = String(shaderFlow);
  $('#shader-flow-output').textContent = `${shaderFlow.toFixed(1)}×`;
  $('#shader-demo').textContent = shaderFlow > 1.5 ? '恢复正常流速 ↗' : '加快流动 ↗';
});
$('#shader-fold').addEventListener('input', (event) => { shaderFold = Number(event.target.value) / 100; $('#shader-fold-output').textContent = `${event.target.value}%`; });

const visible = new Set();
const observer = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) {
    visible.add(entry.target.id);
    if (entry.target.id === 'sequence' && !sequenceAutoStarted && !reducedMotion.matches) {
      sequenceAutoStarted = true;
      sequenceAutoUntil = performance.now() + 2200;
      setSequenceAutoplay(true);
    }
  } else visible.delete(entry.target.id);
}), { rootMargin: '80px' });
for (const id of ['sequence','three','hybrid','shader']) observer.observe(document.getElementById(id));
let previousTime = performance.now();
let shaderTime = 0;
let lastStatusTick = 0;
function animate(now) {
  const delta = Math.min(.05, (now - previousTime) / 1000);
  previousTime = now;
  if (document.visibilityState === 'visible') {
    if (sequenceAutoUntil && now > sequenceAutoUntil) { sequenceAutoUntil = 0; setSequenceAutoplay(false); }
    if (visible.has('sequence') && sequenceAutoplay && now - sequenceLastTick > 70) { showFrame(currentFrame + 1); sequenceLastTick = now; }
    if (threeStage && visible.has('three')) {
      if (!draggingThree) {
        const yaw = threeBaseYaw + Math.sin(now * .00085 * turnSpeed) * .09;
        objectGroup.rotation.y += (yaw - objectGroup.rotation.y) * .025;
        const box = $('#three').getBoundingClientRect();
        const progress = clamp((window.innerHeight - box.top) / (window.innerHeight + box.height), 0, 1);
        objectGroup.rotation.z += ((-.13 + (progress - .5) * -.27) - objectGroup.rotation.z) * .025;
        objectGroup.position.y = Math.sin(now * .00065) * .035;
      }
      threeStage.renderer.render(threeStage.scene, threeStage.camera);
    }
    if (hybridStage && visible.has('hybrid')) {
      hybridGroup.position.z = (hybridDepth - .5) * 3.1;
      hybridGroup.position.y = Math.sin(now * .0012) * .085;
      hybridGroup.rotation.y += ((pointerTarget[0] * .23 + Math.sin(now * .0009) * .08) - hybridGroup.rotation.y) * .04;
      hybridGroup.rotation.z += ((pointerTarget[0] * -.4 + Math.sin(now * .0011) * .10) - hybridGroup.rotation.z) * .035;
      hybridGroup.rotation.x += ((.58 + pointerTarget[1] * .23) - hybridGroup.rotation.x) * .04;
      hybridStage.renderer.render(hybridStage.scene, hybridStage.camera);
    }
    if (drawShader && visible.has('shader')) { shaderTime += delta * shaderFlow; drawShader(shaderTime, shaderHue, shaderFold); }
    if (now - lastStatusTick > 180) {
      if (threeStage && objectGroup && visible.has('three')) $('#three-status').textContent = `实时渲染 · 水平转角 ${Math.round(objectGroup.rotation.y * 180 / Math.PI)}°`;
      if (drawShader && visible.has('shader')) $('#shader-status').textContent = `运行时间 ${shaderTime.toFixed(1)} 秒 · ${shaderFlow.toFixed(1)}×`;
      lastStatusTick = now;
    }
  }
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

reducedMotion.addEventListener('change', (event) => {
  if (event.matches) { film.pause(); hybridFilm.pause(); turnSpeed = 0; shaderFlow = 0; sequenceAutoplay = false; }
});
