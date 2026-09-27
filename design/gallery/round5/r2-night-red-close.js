(function () {
  const W = 320, H = 208;
  const asteroids = [
    { x: W * 0.5, y: H * 0.16, sprite: MDSprites.asteroidSmall, rot: 0.2 },
  ];

  function draw(ctx, w, h, t) {
    MDSkyline2.draw(ctx, W, H, t, {
      seed: 640, accent: '#D81F26', lit: '#FF3B3B', dim: '#111428',
      skyBands: ['#020309', '#040713', '#070C1E', '#0A1129', '#0F1836', '#14204A'],
      farColor: '#121838', midColor: '#0A0F2A', nearColor: '#06081C', heroColor: '#2A3266',
      moonColor: '#C9DBFF', moonX: 0.2, horizonFrac: 0.62,
      heroX: 0.5, heroW: 0.18, heroHf: 0.86,
    });
    asteroids.forEach((a, i) => MDSprites.blitSprite(ctx, a.sprite, a.x, a.y + Math.sin(t * 0.0006 + i) * 3, 1, t * 0.0004 + a.rot));
    const sx = W * 0.26, sy = H * 0.38, bob = Math.sin(t * 0.0007) * 2.5;
    MDSkyline2.shipHalo(ctx, sx, sy + bob, 26, 'rgba(201,219,255,0.22)');
    ctx.save(); ctx.translate(sx, sy + bob);
    const flameLen = 6 + 4 * Math.abs(Math.sin(t * 0.022));
    const fg = ctx.createLinearGradient(0, 12, 0, 12 + flameLen);
    fg.addColorStop(0, 'rgba(255,59,59,0.9)'); fg.addColorStop(1, 'rgba(255,0,0,0)');
    ctx.fillStyle = fg; ctx.fillRect(-2.5, 12, 5, flameLen);
    ctx.restore();
    MDSprites.blitSprite(ctx, MDSprites.shipInterceptor, sx, sy + bob, 1.7, Math.sin(t * 0.001) * 0.06);
  }

  MDLib.registerStyle({
    id: 'r5-02-night-red-close', name: 'Night Red — Close-Up',
    refs: [],
    palette: ['#020309', '#14204A', '#06081C', '#FF3B3B', '#C9DBFF'],
    res: [W, H], titleFont: '"JetBrains Mono", monospace',
    note: 'Same recipe, hero tower centered and larger, moon on the opposite side, interceptor ship — a tighter, more dramatic crop of the same skyline.',
    draw,
  });
})();
