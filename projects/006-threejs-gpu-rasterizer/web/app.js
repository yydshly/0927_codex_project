import * as THREE from 'three';
import {OrbitControls} from './vendor/OrbitControls.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import {planScene} from './planner.mjs';

const sceneHost = document.querySelector('#scene');
const modeButtons = [...document.querySelectorAll('[data-mode]')];
const thresholdInput = document.querySelector('#threshold');
const alerts = new Set([22, 86, 120]);
const items = Array.from({length: 144}, (_, index) => {
  const row = Math.floor(index / 12);
  const column = index % 12;
  return {
    index,
    id: `W-${String(index + 1).padStart(3, '0')}`,
    row,
    column,
    position: new THREE.Vector3((column - 5.5) * 10, 0, (row - 5.5) * 10)
  };
});

const state = {mode: 'adaptive', threshold: 2, selected: 86, dirty: true};
const format = new Intl.NumberFormat('zh-CN');

function buildTurbineGeometry(level) {
  const radial = [32, 14, 6][level];
  const heightSegments = [12, 4, 1][level];
  const parts = [];
  const add = (geometry, transform) => { transform(geometry); parts.push(geometry); };
  add(new THREE.CylinderGeometry(0.46, 0.54, 0.38, radial), g => g.translate(0, 0.19, 0));
  add(new THREE.CylinderGeometry(0.11, 0.31, 6, radial, heightSegments), g => g.translate(0, 3.35, 0));
  add(new THREE.BoxGeometry(0.75, 0.38, 0.53), g => g.translate(0, 6.43, 0.16));
  add(new THREE.SphereGeometry(0.20, radial, Math.max(4, Math.round(radial / 2))), g => g.translate(0, 6.43, 0.49));
  for (let blade = 0; blade < 3; blade++) {
    add(new THREE.BoxGeometry(0.15, 2.45, 0.09, 1, Math.max(1, heightSegments / 2), 1), g => {
      g.translate(0, 1.34, 0);
      g.rotateZ(blade * Math.PI * 2 / 3);
      g.translate(0, 6.43, 0.57);
    });
  }
  if (level === 0) {
    add(new THREE.TorusGeometry(0.29, 0.045, 8, 28), g => g.translate(0, 6.43, 0.37));
    add(new THREE.CylinderGeometry(0.16, 0.16, 0.55, 16), g => g.translate(0, 0.62, 0));
  }
  const result = mergeGeometries(parts, false);
  parts.forEach(part => part.dispose());
  if (!result) throw new Error('Turbine geometry could not be merged');
  result.computeBoundingSphere();
  return result;
}

function start() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#103b50');
  scene.fog = new THREE.Fog('#103b50', 65, 215);

  const renderer = new THREE.WebGLRenderer({antialias: true, powerPreference: 'high-performance'});
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  sceneHost.append(renderer.domElement);

  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 400);
  camera.position.set(82, 94, 105);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 2, 0);
  controls.enableDamping = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  controls.dampingFactor = 0.09;
  controls.maxPolarAngle = Math.PI * 0.48;
  controls.minDistance = 7;
  controls.maxDistance = 270;
  controls.addEventListener('change', () => { state.dirty = true; });
  controls.update();

  scene.add(new THREE.HemisphereLight('#e9fbf3', '#276078', 2.45));
  const sun = new THREE.DirectionalLight('#fff0d9', 2.25);
  sun.position.set(-30, 75, -50);
  scene.add(sun);

  const sea = new THREE.Mesh(
    new THREE.PlaneGeometry(225, 225),
    new THREE.MeshStandardMaterial({color: '#155367', roughness: 0.75, metalness: 0.12})
  );
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = -0.58;
  scene.add(sea);

  const grid = new THREE.GridHelper(220, 22, '#5da0a5', '#397a86');
  grid.position.y = -0.54;
  grid.material.transparent = true;
  grid.material.opacity = 0.20;
  scene.add(grid);

  const platformGeometry = new THREE.CylinderGeometry(0.93, 1.03, 0.35, 12);
  const platforms = new THREE.InstancedMesh(platformGeometry, new THREE.MeshStandardMaterial({color: '#164758', roughness: 0.75}), items.length);
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3(1, 1, 1);
  for (const item of items) {
    matrix.compose(new THREE.Vector3(item.position.x, -0.25, item.position.z), quaternion, scale);
    platforms.setMatrixAt(item.index, matrix);
  }
  scene.add(platforms);

  const geometries = [0, 1, 2].map(buildTurbineGeometry);
  const triangleCounts = geometries.map(geometry => geometry.index.count / 3);
  const colors = ['#e9f4ed', '#a9d3d4', '#78aabe'];
  const meshes = geometries.map((geometry, level) => {
    const mesh = new THREE.InstancedMesh(geometry, new THREE.MeshStandardMaterial({color: colors[level], roughness: 0.47, metalness: 0.25, side: THREE.DoubleSide}), items.length);
    mesh.count = 0;
    mesh.frustumCulled = false;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.userData.level = level;
    mesh.userData.items = [];
    scene.add(mesh);
    return mesh;
  });

  const alertRingGeometry = new THREE.TorusGeometry(1.55, 0.055, 6, 40);
  const alertRingMaterial = new THREE.MeshBasicMaterial({color: '#ffad77', transparent: true, opacity: 0.92});
  for (const index of alerts) {
    const ring = new THREE.Mesh(alertRingGeometry, alertRingMaterial);
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(items[index].position);
    ring.position.y = 0.05;
    scene.add(ring);
  }
  const selectedRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.08, 0.075, 6, 50),
    new THREE.MeshBasicMaterial({color: '#e1f686'})
  );
  selectedRing.rotation.x = -Math.PI / 2;
  selectedRing.position.y = 0.08;
  scene.add(selectedRing);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const viewSize = new THREE.Vector2();
  const frustum = new THREE.Frustum();
  const projected = new THREE.Matrix4();
  const testSphere = new THREE.Sphere(new THREE.Vector3(), 7.2);

  function updateDevice() {
    const item = items[state.selected];
    selectedRing.position.x = item.position.x;
    selectedRing.position.z = item.position.z;
    document.querySelector('#device-name').textContent = `${item.id} · 第 ${item.row + 1} 排 ${item.column + 1} 列`;
    document.querySelector('#device-status').textContent = alerts.has(item.index) ? '待复核' : '运行正常';
    document.querySelector('#device-detail').textContent = alerts.has(item.index)
      ? '模拟告警：齿轮箱温度偏高。接近目标查看结构，几何精度会随屏幕需求提升。'
      : '模拟状态：正常运行。缩放视角，观察这台设备何时恢复高精度。';
  }

  function updatePlan() {
    camera.updateMatrixWorld();
    projected.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(projected);
    renderer.getDrawingBufferSize(viewSize);
    const plan = planScene({
      items,
      mode: state.mode,
      visible: item => {
        testSphere.center.copy(item.position);
        testSphere.center.y = 3.4;
        return frustum.intersectsSphere(testSphere);
      },
      distance: item => camera.position.distanceTo(item.position),
      viewportHeight: viewSize.y,
      fovDegrees: camera.fov,
      threshold: state.threshold,
      errors: [0, 0.08, 0.35],
      triangles: triangleCounts
    });
    plan.groups.forEach((group, level) => {
      const mesh = meshes[level];
      mesh.count = group.length;
      mesh.userData.items = group;
      group.forEach((item, slot) => {
        matrix.compose(item.position, quaternion, scale);
        mesh.setMatrixAt(slot, matrix);
        mesh.setColorAt(slot, new THREE.Color(item.index === state.selected ? '#e9f18a' : alerts.has(item.index) ? '#ffb780' : '#ffffff'));
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    });
    document.querySelector('#visible-count').textContent = format.format(plan.visibleCount);
    document.querySelector('#triangle-count').textContent = format.format(plan.submittedTriangles);
    document.querySelector('#reduction').textContent = `${Math.round(plan.reduction * 100)}%`;
    document.querySelector('#reduction-bar').style.width = `${Math.max(0, Math.min(100, plan.reduction * 100))}%`;
    state.dirty = false;
  }

  function resize() {
    const rect = sceneHost.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    camera.aspect = rect.width / rect.height;
    camera.updateProjectionMatrix();
    renderer.setSize(rect.width, rect.height);
    state.dirty = true;
  }
  new ResizeObserver(resize).observe(sceneHost);
  resize();

  let pointerDown = null;
  renderer.domElement.addEventListener('pointerdown', event => { pointerDown = {x: event.clientX, y: event.clientY}; });
  renderer.domElement.addEventListener('pointerup', event => {
    if (!pointerDown || Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y) > 5) return;
    pointerDown = null;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(meshes, false)[0];
    if (hit) {
      const item = hit.object.userData.items[hit.instanceId];
      if (item) { state.selected = item.index; updateDevice(); state.dirty = true; }
    }
  });

  modeButtons.forEach(button => button.addEventListener('click', () => {
    state.mode = button.dataset.mode;
    modeButtons.forEach(other => {
      const active = other === button;
      other.classList.toggle('active', active);
      other.setAttribute('aria-pressed', String(active));
    });
    state.dirty = true;
  }));
  thresholdInput.addEventListener('input', () => {
    state.threshold = Number(thresholdInput.value);
    document.querySelector('#threshold-value').textContent = `${state.threshold.toFixed(1)} px`;
    state.dirty = true;
  });
  document.querySelector('#overview').addEventListener('click', () => {
    camera.position.set(82, 94, 105);
    controls.target.set(0, 2, 0);
    controls.update();
    state.dirty = true;
  });
  document.querySelector('#locate').addEventListener('click', () => {
    state.selected = 86;
    updateDevice();
    const pos = items[86].position;
    controls.target.set(pos.x, 3, pos.z);
    camera.position.set(pos.x + 10, 10.5, pos.z + 12);
    controls.update();
    state.dirty = true;
  });

  updateDevice();
  function frame() {
    requestAnimationFrame(frame);
    controls.update();
    if (state.dirty) updatePlan();
    renderer.render(scene, camera);
  }
  frame();
}

try {
  start();
} catch (error) {
  console.error(error);
  document.querySelector('#scene-error').hidden = false;
}
