struct Params {
  grid: vec4<f32>,       // width, height, dt, time
  sea: vec4<f32>,        // amplitude, frequency, tide, friction
  view: vec4<f32>,       // canvas width, canvas height, unused, unused
  extra: vec4<f32>,      // reserved for experiments
};
struct Cell {
  flow: vec4<f32>,       // depth, velocity x, velocity y, foam
  shore: vec4<f32>,      // wetness, thin film, unused, unused
};
@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read> terrain: array<vec4<f32>>;
@group(0) @binding(2) var<storage, read> previous: array<Cell>;
@group(0) @binding(3) var<storage, read_write> next: array<Cell>;

fn width() -> i32 { return i32(params.grid.x); }
fn height() -> i32 { return i32(params.grid.y); }
fn cellIndex(x: i32, y: i32) -> u32 {
  let xx = clamp(x, 0, width() - 1);
  let yy = clamp(y, 0, height() - 1);
  return u32(yy * width() + xx);
}
fn surface(x: i32, y: i32) -> f32 {
  let i = cellIndex(x, y);
  return terrain[i].x + previous[i].flow.x;
}
fn fluxX(x: i32, y: i32) -> f32 {
  if (x < 0 || x >= width() - 1) { return 0.0; }
  let a = cellIndex(x, y);
  let b = cellIndex(x + 1, y);
  if (terrain[a].y > 0.5 || terrain[b].y > 0.5) { return 0.0; }
  let v = 0.5 * (previous[a].flow.y + previous[b].flow.y);
  let donor = select(previous[b].flow.x, previous[a].flow.x, v >= 0.0);
  return v * max(0.0, donor);
}
fn fluxY(x: i32, y: i32) -> f32 {
  if (y < 0 || y >= height() - 1) { return 0.0; }
  let a = cellIndex(x, y);
  let b = cellIndex(x, y + 1);
  if (terrain[a].y > 0.5 || terrain[b].y > 0.5) { return 0.0; }
  let v = 0.5 * (previous[a].flow.z + previous[b].flow.z);
  let donor = select(previous[b].flow.x, previous[a].flow.x, v >= 0.0);
  return v * max(0.0, donor);
}

@compute @workgroup_size(8, 8)
fn waterStep(@builtin(global_invocation_id) id: vec3<u32>) {
  let x = i32(id.x);
  let y = i32(id.y);
  if (x >= width() || y >= height()) { return; }
  let i = cellIndex(x, y);
  let t = terrain[i];
  let old = previous[i];
  if (t.y > 0.5) {
    next[i].flow = vec4<f32>(0.0);
    next[i].shore = vec4<f32>(old.shore.x * 0.996, 0.0, 0.0, 0.0);
    return;
  }
  let dt = params.grid.z;
  let eta = t.x + old.flow.x;
  let li = cellIndex(x - 1, y);
  let ri = cellIndex(x + 1, y);
  let ui = cellIndex(x, y - 1);
  let di = cellIndex(x, y + 1);
  let eL = select(surface(x - 1, y), eta, terrain[li].y > 0.5);
  let eR = select(surface(x + 1, y), eta, terrain[ri].y > 0.5);
  let eU = select(surface(x, y - 1), eta, terrain[ui].y > 0.5);
  let eD = select(surface(x, y + 1), eta, terrain[di].y > 0.5);
  let gradient = vec2<f32>(0.5 * (eR - eL), 0.5 * (eD - eU));
  var velocity = old.flow.yz - 2.0 * dt * gradient;
  let velocityLaplacian = previous[li].flow.yz + previous[ri].flow.yz + previous[ui].flow.yz + previous[di].flow.yz - 4.0 * old.flow.yz;
  velocity += 0.7 * dt * velocityLaplacian;
  velocity *= max(0.0, 1.0 - params.sea.w * dt);
  velocity = clamp(velocity, vec2<f32>(-1.4), vec2<f32>(1.4));
  var depth = old.flow.x - dt * (fluxX(x, y) - fluxX(x - 1, y) + fluxY(x, y) - fluxY(x, y - 1));
  depth += 0.28 * dt * (eL + eR + eU + eD - 4.0 * eta);
  if (x < 2) {
    let incoming = params.sea.z + params.sea.x * sin(params.grid.w * params.sea.y - f32(y) * 0.012);
    depth = mix(depth, max(0.0, incoming - t.x), 0.12);
  }
  depth = clamp(depth, 0.0, 2.0);
  if (depth < 0.001) { velocity *= 0.2; }
  let aheadRockX = select(terrain[li].y, terrain[ri].y, velocity.x >= 0.0);
  let aheadRockY = select(terrain[ui].y, terrain[di].y, velocity.y >= 0.0);
  let nearRock = max(aheadRockX, aheadRockY);
  let shallow = 1.0 - smoothstep(0.18, 0.72, depth);
  let breaker = max(0.0, length(gradient) - 0.055) * 0.10 * shallow;
  let impact = nearRock * length(velocity) * 0.006;
  let foam = clamp(old.flow.w * 0.91 + breaker + impact, 0.0, 0.8);
  let wet = select(old.shore.x * 0.996, min(1.0, old.shore.x + 0.16), depth > 0.012);
  let film = clamp(depth * 5.0, 0.0, 1.0);
  next[i].flow = vec4<f32>(depth, velocity, foam);
  next[i].shore = vec4<f32>(wet, film, 0.0, 0.0);
}
