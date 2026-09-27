struct Params {
  grid: vec4<f32>,
  sea: vec4<f32>,
  view: vec4<f32>,
  extra: vec4<f32>,
};
struct Cell {
  flow: vec4<f32>,
  shore: vec4<f32>,
};
@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read> terrain: array<vec4<f32>>;
@group(0) @binding(2) var<storage, read> cells: array<Cell>;

fn idx(x: i32, y: i32) -> u32 {
  let xx = clamp(x, 0, i32(params.grid.x) - 1);
  let yy = clamp(y, 0, i32(params.grid.y) - 1);
  return u32(yy * i32(params.grid.x) + xx);
}
@vertex fn fullScreen(@builtin(vertex_index) vertex: u32) -> @builtin(position) vec4<f32> {
  var pos = array<vec2<f32>, 3>(vec2<f32>(-1.0, -1.0), vec2<f32>(3.0, -1.0), vec2<f32>(-1.0, 3.0));
  return vec4<f32>(pos[vertex], 0.0, 1.0);
}
@fragment fn shade(@builtin(position) pixel: vec4<f32>) -> @location(0) vec4<f32> {
  let uv = pixel.xy / params.view.xy;
  let gx = uv.x * (params.grid.x - 1.0);
  let gy = uv.y * (params.grid.y - 1.0);
  let x = i32(floor(gx));
  let y = i32(floor(gy));
  let f = fract(vec2<f32>(gx, gy));
  let a = cells[idx(x, y)];
  let b = cells[idx(x + 1, y)];
  let c = cells[idx(x, y + 1)];
  let d = cells[idx(x + 1, y + 1)];
  let flow = mix(mix(a.flow, b.flow, f.x), mix(c.flow, d.flow, f.x), f.y);
  let shore = mix(mix(a.shore, b.shore, f.x), mix(c.shore, d.shore, f.x), f.y);
  let ta = terrain[idx(x, y)];
  let tb = terrain[idx(x + 1, y)];
  let tc = terrain[idx(x, y + 1)];
  let td = terrain[idx(x + 1, y + 1)];
  let ground = mix(mix(ta, tb, f.x), mix(tc, td, f.x), f.y);
  let grain = ground.z * 0.045;
  let wetSand = clamp(shore.x * 0.62 + shore.y * 0.15, 0.0, 0.72);
  var color = mix(vec3<f32>(0.77 + grain, 0.70 + grain * 0.5, 0.54), vec3<f32>(0.42, 0.47, 0.41), wetSand);
  let waterMask = smoothstep(0.004, 0.045, flow.x);
  let depthTone = clamp(flow.x * 1.25, 0.0, 1.0);
  var water = mix(vec3<f32>(0.20, 0.57, 0.59), vec3<f32>(0.025, 0.22, 0.32), depthTone);
  let eL = terrain[idx(x - 1, y)].x + cells[idx(x - 1, y)].flow.x;
  let eR = terrain[idx(x + 1, y)].x + cells[idx(x + 1, y)].flow.x;
  let eU = terrain[idx(x, y - 1)].x + cells[idx(x, y - 1)].flow.x;
  let eD = terrain[idx(x, y + 1)].x + cells[idx(x, y + 1)].flow.x;
  let slope = 0.5 * length(vec2<f32>(eR - eL, eD - eU));
  let glint = clamp(0.4 * (eL - eR) + 0.2 * (eU - eD), -0.045, 0.09);
  let ripple = 0.012 * sin(gx * 0.12 + gy * 0.06 - params.grid.w * 1.4);
  water += vec3<f32>(glint + ripple, glint * 1.2 + ripple, glint + ripple);
  let shallow = 1.0 - smoothstep(0.15, 0.65, flow.x);
  let foam = clamp(flow.w * 1.4 + max(0.0, slope - 0.07) * shallow * 0.22, 0.0, 0.72);
  water = mix(water, vec3<f32>(0.85, 0.94, 0.89), foam);
  color = mix(color, water, waterMask);
  let rockMask = smoothstep(0.22, 0.76, ground.y);
  color = mix(color, vec3<f32>(0.27 + grain, 0.34 + grain, 0.32 + grain * 0.5), rockMask);
  let vignette = 1.0 - 0.12 * length((uv - 0.5) * 1.3);
  return vec4<f32>(clamp(color * vignette, vec3<f32>(0.0), vec3<f32>(1.0)), 1.0);
}
