(function () {
  const rng = MDLib.rng(202);
  const W = 160, H = 288;
  const buildings = [];
  let x = -10;
  while (x < W + 10) {
    const w = 24 + rng() * 30;
    const h = 60 + rng() * 170;
    const cols = 2 + Math.floor(rng() * 2);
    const rows = 5 + Math.floor(rng() * 8);
    buildings.push({ x, w, h, cols, rows, seed: rng() * 999 });
    x += w + 2 + rng() * 6;
  }
  const enemies = [
    { x: W * 0.28, y: H * 0.22, r: 6 }, { x: W * 0.68, y: H * 0.4, r: 5 },
  ];

  function draw(ctx, w, h, t) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    // solid white silhouettes with black window cut-outs
    buildings.forEach((b) => {
      const y = H - b.h;
      ctx.fillStyle = '#fff';
      ctx.fillRect(b.x, y, b.w, b.h);
      ctx.fillStyle = '#000';
      const cw = b.w / (b.cols + 1), rh = b.h / (b.rows + 1);
      for (let r = 0; r < b.rows; r++) {
        for (let c = 0; c < b.cols; c++) {
          const on = ((r * 13 + c * 7 + b.seed) | 0) % 5 !== 0;
          if (on) ctx.fillRect(b.x + cw * (c + 0.6), y + rh * (r + 0.6), cw * 0.5, rh * 0.45);
        }
      }
    });
    // rare red: enemy cores + ship thruster only
    ctx.fillStyle = '#FF2A3D';
    enemies.forEach((e) => { ctx.fillRect(e.x - 1, e.y - 1, 3, 3); });
    // ship (chunky, white, 1-bit)
    const sx = W * 0.5, sy = H * 0.62;
    ctx.save(); ctx.translate(sx, sy);
    ctx.fillStyle = '#fff';
    ctx.fillRect(-2, -6, 4, 10);
    ctx.fillRect(-6, 2, 4, 4); ctx.fillRect(2, 2, 4, 4);
    ctx.fillStyle = '#FF2A3D';
    const flame = 4 + Math.round(3 * Math.abs(Math.sin(t * 0.006)));
    ctx.fillRect(-2, 4, 4, flame);
    ctx.restore();
    // side HUD strip (chunky gem-counter style)
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, W, 14);
    ctx.fillStyle = '#000';
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillText('0042', 6, 10);
    ctx.fillStyle = '#FF2A3D'; ctx.fillRect(W - 16, 3, 8, 8);
  }

  MDLib.registerStyle({
    id: '02-hot-1bit-red', name: 'Hot 1-Bit + Red',
    refs: [
      { label: 'Downwell', url: 'https://store.steampowered.com/app/360740/Downwell/' },
      { label: 'Lorelei and the Laser Eyes', url: 'https://store.steampowered.com/app/2008920/' },
    ],
    palette: ['#000000', '#ffffff', '#FF2A3D'],
    res: [W, H], titleFont: '"Press Start 2P", monospace',
    note: 'Black + white + one hot red. Solid silhouettes with punched-out windows, portrait shaft composition, red under 5% of the frame.',
    draw,
  });
})();
