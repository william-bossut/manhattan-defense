(function () {
  const W = 480, H = 270;
  const leftTower = { w: W * 0.22, colorA: '#0E1330' };
  const rightTower = { w: W * 0.26, colorA: '#0E1330' };
  const streaks = Array.from({ length: 18 }, (_, i) => ({ y: (i / 18) * H, speed: 2 + (i % 5), len: 20 + (i % 4) * 12 }));
  const asteroids = [
    { x: W * 0.5, y: H * 0.72, sprite: MDSprites.asteroidBig, rot: 0.1 },
  ];

  function drawTower(ctx, x, w, cols, rows, seed) {
    ctx.fillStyle = '#0E1330'; ctx.fillRect(x, 0, w, H);
    const cw = w / (cols + 1), rh = H / (rows + 1);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const idx = (r * 13 + c * 7 + seed) | 0;
      if (idx % 3 !== 0) { ctx.fillStyle = idx % 7 === 0 ? '#46F2FF' : '#FF8A3D'; ctx.fillRect(x + cw * (c + 0.6), rh * (r + 0.6), cw * 0.5, rh * 0.4); }
    }
  }

  function draw(ctx, w, h, t) {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#050813'); sky.addColorStop(1, '#141A34');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    // speed streaks (motion blur lines) implying velocity through the canyon
    ctx.strokeStyle = 'rgba(70,242,255,0.12)'; ctx.lineWidth = 1.5;
    streaks.forEach((s) => {
      const x = (t * s.speed * 0.05) % (W + 100) - 50;
      ctx.beginPath(); ctx.moveTo(x, s.y); ctx.lineTo(x + s.len, s.y); ctx.stroke();
    });
    drawTower(ctx, -8, leftTower.w, 3, 20, 41);
    drawTower(ctx, W - rightTower.w + 8, rightTower.w, 3, 22, 67);
    // vignette focus on the gap
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.15, W / 2, H / 2, H * 0.6);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    asteroids.forEach((a) => MDSprites.blitSprite(ctx, a.sprite, a.x + Math.sin(t * 0.0004) * 30, a.y, 1.6, t * 0.0005 + a.rot));
    const sx = W * 0.5, sy = H * 0.4;
    ctx.save(); ctx.translate(sx, sy);
    const flameLen = 8 + 5 * Math.abs(Math.sin(t * 0.025));
    const fg = ctx.createLinearGradient(0, 16, 0, 16 + flameLen);
    fg.addColorStop(0, 'rgba(255,138,61,0.95)'); fg.addColorStop(1, 'rgba(255,50,50,0)');
    ctx.fillStyle = fg; ctx.fillRect(-4, 16, 8, flameLen);
    ctx.restore();
    MDSprites.blitSprite(ctx, MDSprites.ship, sx, sy, 2.2, Math.sin(t * 0.0012) * 0.06);
  }

  MDLib.registerStyle({
    id: 'r3-05-canyon-closeup', name: 'Canyon Close-Up',
    refs: [{ label: 'The Last Night', url: 'https://store.steampowered.com/app/612400/The_Last_Night/' }],
    palette: ['#050813', '#0E1330', '#141A34', '#46F2FF', '#FF8A3D'],
    res: [W, H], titleFont: '"JetBrains Mono", monospace',
    note: 'Low altitude, camera pulled in tight: the ship threads between two close towers, motion-streaks and a big asteroid selling speed and danger.',
    draw,
  });
})();
