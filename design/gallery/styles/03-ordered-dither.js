(function () {
  const rng = MDLib.rng(303);
  const W = 400, H = 240;
  const INK = [229, 255, 255]; // Obra-Dinn-ish cyan-white
  const PAPER = [0x33, 0x33, 0x19];

  const buildings = [];
  let x = -10;
  while (x < W + 10) {
    const w = 30 + rng() * 46;
    const h = 40 + rng() * 150;
    buildings.push({ x, w, h });
    x += w + 4;
  }

  // Precompute a static brightness field [0..1]: sky gradient + fog + building silhouettes.
  const bright = new Float32Array(W * H);
  for (let y = 0; y < H; y++) {
    const skyB = MDLib.lerp(0.85, 0.3, y / H);
    for (let x2 = 0; x2 < W; x2++) {
      let b = skyB;
      buildings.forEach((bd) => {
        if (x2 >= bd.x && x2 < bd.x + bd.w && y >= H - bd.h) b = 0.06;
      });
      const fog = MDLib.clamp((y - H * 0.7) / (H * 0.3), 0, 1) * 0.25;
      bright[y * W + x2] = MDLib.clamp(b + fog, 0, 1);
    }
  }

  let imgData = null;
  function renderDither(ctx) {
    if (!imgData) imgData = ctx.createImageData(W, H);
    const data = imgData.data;
    for (let y = 0; y < H; y++) {
      for (let x2 = 0; x2 < W; x2++) {
        const i = y * W + x2;
        const on = MDLib.ditherOn(x2, y, bright[i], MDLib.BAYER8);
        const c = on ? INK : PAPER;
        const o = i * 4;
        data[o] = c[0]; data[o + 1] = c[1]; data[o + 2] = c[2]; data[o + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }

  function drawOutline(ctx, b) {
    const y = H - b.h;
    ctx.beginPath();
    ctx.moveTo(b.x, H); ctx.lineTo(b.x, y); ctx.lineTo(b.x + b.w, y); ctx.lineTo(b.x + b.w, H);
    ctx.stroke();
  }

  function draw(ctx, w, h, t) {
    renderDither(ctx);
    ctx.strokeStyle = `rgb(${INK.join(',')})`;
    ctx.lineWidth = 1;
    buildings.forEach((b) => drawOutline(ctx, b));
    // ship: outlined engraved shape
    const sx = W * 0.5, sy = H * 0.42;
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(-Math.PI / 2);
    ctx.beginPath(); ctx.moveTo(11, 0); ctx.lineTo(-8, 6); ctx.lineTo(-4, 0); ctx.lineTo(-8, -6); ctx.closePath();
    ctx.stroke();
    ctx.restore();
    // subtle animated fog line drifting
    ctx.globalAlpha = 0.15 + 0.1 * Math.sin(t * 0.0006);
    ctx.fillStyle = `rgb(${INK.join(',')})`;
    ctx.fillRect(0, H * 0.75, W, 1);
    ctx.globalAlpha = 1;
  }

  MDLib.registerStyle({
    id: '03-ordered-dither', name: 'Ordered Dither',
    refs: [
      { label: 'Return of the Obra Dinn', url: 'https://store.steampowered.com/app/653530/' },
      { label: 'Mars After Midnight (Playdate)', url: 'https://play.date/games/mars-after-midnight/' },
    ],
    palette: [`rgb(${PAPER.join(',')})`, `rgb(${INK.join(',')})`],
    res: [W, H], titleFont: '"JetBrains Mono", monospace',
    note: '8x8 Bayer ordered dither turns a greyscale scene into 2 colors — tonal depth from printmaking, not from a palette.',
    draw,
  });
})();
