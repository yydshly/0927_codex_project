import { rainParticles, seedRandom, windowBox } from './lab-model.js';

export function createStudyScene(canvas) {
  canvas.width = 480; canvas.height = 270;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const base = document.createElement('canvas');
  base.width = 480; base.height = 270;
  const b = base.getContext('2d');
  const rect = (c, color, x, y, w, h) => { c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), w, h); };
  const poly = (c, color, points) => { c.fillStyle = color; c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fill(); };
  const rng = seedRandom(91);
  // This canvas is painted once, then copied on every frame.
  rect(b, '#292936', 0, 0, 480, 270);
  rect(b, '#30303c', 8, 0, 464, 209);
  for (let y = 0; y < 209; y += 12) rect(b, '#33313b', 8, y, 464, 1);
  rect(b, '#242634', 0, 208, 480, 62);
  for (let y = 222; y < 270; y += 17) rect(b, '#33313d', 0, y, 480, 2);
  for (let x = 16; x < 480; x += 72) rect(b, '#1e2331', x, 223, 2, 47);
  // Recessed window and a city built entirely from rectangles.
  rect(b, '#151d30', 141, 18, 308, 168);
  rect(b, '#75605e', 145, 22, 299, 158);
  const sky = b.createLinearGradient(0, 28, 0, 173);
  sky.addColorStop(0, '#14253d'); sky.addColorStop(1, '#4f6478');
  b.fillStyle = sky; b.fillRect(151, 28, 287, 145);
  rect(b, '#c0cabb', 391, 44, 13, 13); rect(b, '#14253d', 386, 41, 13, 13);
  for (let row = 0; row < 2; row++) {
    for (let x = 152; x < 438; x += 17 + Math.floor(rng() * 11)) {
      const height = 17 + Math.floor(rng() * (row ? 57 : 38));
      const width = 13 + Math.floor(rng() * 16); const y = (row ? 167 : 138) - height;
      rect(b, row ? '#233b51' : '#384b61', x, y, width, height);
      rect(b, '#26394e', x + 4, y - 3, width - 7, 3);
      for (let wy = y + 6; wy < y + height - 2; wy += 10) {
        for (let wx = x + 3; wx < Math.min(x + width - 2, 437); wx += 6) {
          if (rng() > .48) rect(b, rng() > .7 ? '#d0ab75' : '#728a96', wx, wy, 2, 3);
        }
      }
    }
  }
  // Moonlit canal, bridge and reflections.
  rect(b, '#324c62', 151, 151, 287, 22);
  for (let i = 0; i < 90; i++) rect(b, i % 6 ? '#5a7180' : '#b4a486', 151 + rng() * 281, 153 + rng() * 19, 2 + Math.floor(rng() * 7), 1);
  rect(b, '#1e3043', 151, 140, 287, 4);
  for (let x = 152; x < 438; x += 19) rect(b, '#1e3043', x, 142, 4, 10);
  // Left shelf: original pixel illustration, not a background image.
  rect(b, '#1b2330', 19, 33, 108, 159);
  rect(b, '#5c4947', 22, 36, 5, 154); rect(b, '#514244', 119, 36, 6, 154);
  const colors = ['#ae745c', '#637570', '#b39468', '#65758a', '#9a6470', '#a99b80'];
  for (const y of [75, 119, 163]) {
    let x = 30;
    while (x < 112) {
      const w = 4 + Math.floor(rng() * 6), h = 20 + Math.floor(rng() * 14);
      const color = colors[Math.floor(rng() * colors.length)];
      rect(b, color, x, y - h, w, h); rect(b, '#d4bd9144', x + 1, y - h + 5, w - 2, 1);
      rect(b, '#1d253440', x + w - 2, y - h, 2, h); x += w + 2;
    }
    rect(b, '#806257', 25, y, 96, 4); rect(b, '#382e38', 25, y + 4, 96, 3);
  }
  rect(b, '#927353', 34, 174, 31, 4); rect(b, '#5f6c79', 31, 178, 38, 5);
  // Round wall clock approximated in crisp pixel steps.
  rect(b, '#937963', 61, 8, 24, 22); rect(b, '#cbb99a', 64, 10, 18, 17);
  rect(b, '#4b4246', 72, 12, 1, 7); rect(b, '#4b4246', 72, 18, 6, 1);
  // Plant beside the window.
  rect(b, '#765342', 119, 191, 22, 18); rect(b, '#9b7158', 117, 187, 26, 5);
  rect(b, '#486b62', 129, 144, 2, 43);
  for (const [x, y, w, h] of [[115, 155, 15, 5], [131, 147, 13, 5], [114, 172, 17, 5], [131, 164, 15, 6], [123, 138, 7, 13]]) {
    rect(b, '#526f5e', x, y, w, h); rect(b, '#7d8c6b', x + 2, y, w - 3, 2);
  }

  function foreground() {
    // Window frame is above the rain, keeping drops outside the room.
    rect(ctx, '#6d6261', 243, 28, 5, 145); rect(ctx, '#625c60', 343, 28, 5, 145);
    rect(ctx, '#958078', 243, 28, 1, 145); rect(ctx, '#958078', 343, 28, 1, 145);
    rect(ctx, '#696065', 151, 98, 287, 4);
    rect(ctx, '#998078', 144, 175, 303, 6); rect(ctx, '#50414a', 139, 181, 313, 6);
    // Heavy curtains, picked out by the warm desk lamp.
    for (let x = 132; x < 151; x += 5) rect(ctx, x % 2 ? '#63505b' : '#4b4253', x, 23, 5, 158);
    for (let x = 439; x < 464; x += 5) rect(ctx, x % 2 ? '#6f535a' : '#574452', x, 23, 5, 168);
    rect(ctx, '#ac8970', 130, 20, 337, 4);
    // Desk, supports, book, pencils, mug and a small radio.
    rect(ctx, '#261f2c', 154, 216, 8, 54); rect(ctx, '#261f2c', 441, 216, 8, 54);
    rect(ctx, '#a77759', 140, 207, 325, 9); rect(ctx, '#c19368', 140, 207, 325, 2);
    rect(ctx, '#533b38', 147, 216, 311, 6); rect(ctx, '#302431', 144, 222, 309, 4);
    for (const [x, w] of [[151, 25], [225, 30], [340, 37], [419, 22]]) rect(ctx, '#815a484f', x, 211, w, 1);
    poly(ctx, '#52434a', [[239, 200], [270, 194], [301, 199], [309, 207], [237, 207]]);
    poly(ctx, '#d4bb8d', [[241, 198], [269, 192], [273, 201], [244, 205]]);
    poly(ctx, '#e8d3a3', [[269, 192], [296, 194], [303, 203], [273, 201]]);
    for (let y = 196; y < 202; y += 2) rect(ctx, '#938574', 279, y, 16, 1);
    rect(ctx, '#a97562', 314, 197, 15, 10); rect(ctx, '#d4b897', 313, 195, 17, 3);
    rect(ctx, '#c19171', 329, 198, 5, 2); rect(ctx, '#c19171', 332, 199, 2, 5); rect(ctx, '#c19171', 329, 203, 5, 2);
    rect(ctx, '#3e3238', 315, 195, 12, 1);
    rect(ctx, '#73666b', 358, 194, 10, 13); rect(ctx, '#c59366', 360, 181, 2, 15); rect(ctx, '#7b9495', 365, 185, 2, 10);
    rect(ctx, '#66524c', 167, 190, 32, 17); rect(ctx, '#b09874', 170, 193, 26, 11);
    for (let x = 172; x < 186; x += 3) rect(ctx, '#665654', x, 195, 1, 7);
    rect(ctx, '#d5b988', 190, 196, 3, 3); rect(ctx, '#887769', 174, 187, 19, 3);
    // Desk lamp silhouette.
    rect(ctx, '#313440', 399, 202, 27, 5); rect(ctx, '#6d6260', 411, 161, 3, 42);
    rect(ctx, '#988371', 411, 154, 3, 31);
    poly(ctx, '#b88c68', [[398, 142], [426, 142], [436, 160], [388, 160]]);
    rect(ctx, '#e2b87d', 388, 158, 48, 3);
    // Armchair and rug anchor the foreground.
    poly(ctx, '#483842', [[36, 236], [194, 236], [213, 270], [17, 270]]);
    for (let y = 244; y < 270; y += 6) rect(ctx, '#735351', 34, y, 154, 1);
    rect(ctx, '#28303a', 71, 207, 59, 53); rect(ctx, '#4b5656', 74, 201, 52, 48);
    rect(ctx, '#657066', 78, 201, 44, 4); rect(ctx, '#414c4e', 81, 208, 34, 33);
    rect(ctx, '#343c43', 64, 233, 14, 27); rect(ctx, '#343c43', 122, 233, 14, 27);
    rect(ctx, '#646d61', 63, 233, 16, 4); rect(ctx, '#646d61', 121, 233, 16, 4);
  }
  function render(time, state) {
    ctx.clearRect(0, 0, 480, 270); ctx.drawImage(base, 0, 0);
    const animated = !state.baseOnly;
    const drops = animated && state.rainLayer ? rainParticles(time, state.rain) : [];
    ctx.save(); ctx.beginPath(); ctx.rect(windowBox.x, windowBox.y, windowBox.width, windowBox.height); ctx.clip();
    ctx.strokeStyle = '#acccdd80'; ctx.lineWidth = 1;
    for (const drop of drops) { ctx.beginPath(); ctx.moveTo(Math.floor(drop.x), Math.floor(drop.y)); ctx.lineTo(Math.floor(drop.x) - 1, Math.floor(drop.y + drop.length)); ctx.stroke(); }
    ctx.restore(); foreground();
    if (animated && state.lightLayer) {
      const pulse = .17 + Math.sin(time * 1.6) * .012;
      const glow = ctx.createRadialGradient(408, 165, 5, 394, 180, 98);
      glow.addColorStop(0, `rgba(255,192,98,${pulse * 2})`); glow.addColorStop(1, 'rgba(255,192,98,0)');
      ctx.fillStyle = glow; ctx.fillRect(288, 83, 192, 161);
      poly(ctx, '#ffd18b16', [[392, 161], [433, 161], [462, 207], [360, 207]]);
    }
    if (animated && state.steamLayer) {
      for (let k = 0; k < 3; k++) for (let j = 0; j < 11; j++) {
        const phase = (time * 8 + j * 1.7 + k * 7) % 22;
        ctx.globalAlpha = (1 - phase / 22) * .45;
        rect(ctx, '#e4d6bd', 317 + k * 3 + Math.sin(phase / 4 + time) * 2, 193 - phase, 1, 2);
      }
      ctx.globalAlpha = 1;
    }
    // Subtle crisp border, no baked-in screenshot or animation file.
    ctx.strokeStyle = '#111827'; ctx.strokeRect(.5, .5, 479, 269);
    return drops.length;
  }
  return { render };
}
