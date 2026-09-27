(function () {
  const W = 320, H = 208;
  const asteroids = [
    { x: W * 0.14, y: H * 0.22, sprite: MDSprites.asteroidBig, rot: 0.3 },
    { x: W * 0.85, y: H * 0.18, sprite: MDSprites.debrisMetal, rot: -0.4 },
  ];

  function draw(ctx, w, h, t) {
    MDSkyline2.draw(ctx, W, H, t, {
      seed: 500, accent: '#D81F26', lit: '#FF3B3B', dim: '#141833',
      skyBands: ['#03040B', '#050817', '#080D22', '#0C132E', '#121A3E', '#182150'],
      farColor: '#141B3E', midColor: '#0C1230', nearColor: '#080B22',
      moonColor: '#DCE8FF', moonX: 0.8,
    });
    asteroids.forEach((a, i) => MDSprites.blitSprite(ctx, a.sprite, a.x, a.y + Math.sin(t * 0.0006 + i) * 4, 0.9, t * 0.0003 * (i ? -1 : 1) + a.rot));
    const sx = W * 0.62, sy = H * 0.34, bob = Math.sin(t * 0.0007) * 2.5;
    MDSkyline2.shipHalo(ctx, sx, sy + bob, 26, 'rgba(220,232,255,0.22)');
    ctx.save(); ctx.translate(sx, sy + bob);
    const flameLen = 6 + 4 * Math.abs(Math.sin(t * 0.02));
    const fg = ctx.createLinearGradient(0, 12, 0, 12 + flameLen);
    fg.addColorStop(0, 'rgba(255,59,59,0.9)'); fg.addColorStop(1, 'rgba(255,0,0,0)');
    ctx.fillStyle = fg; ctx.fillRect(-2.5, 12, 5, flameLen);
    ctx.restore();
    MDSprites.blitSprite(ctx, MDSprites.ship, sx, sy + bob, 1.8, 0);
  }

  MDLib.registerStyle({
    id: 'r5-01-night-red', name: 'Night Red — Manhattan',
    refs: [],
    palette: ['#03040B', '#182150', '#080B22', '#FF3B3B', '#DCE8FF'],
    res: [W, H], titleFont: '"JetBrains Mono", monospace',
    note: 'Rebuilt per feedback: bold outlines, dense tall red-lit window columns, banded dark-blue night sky (not sunset), suspension bridge up front, hero tower with setbacks.',
    draw,
  });
})();
