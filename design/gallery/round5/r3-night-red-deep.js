(function () {
  const W = 320, H = 208;
  const asteroids = [
    { x: W * 0.1, y: H * 0.3, sprite: MDSprites.crystalHazard, rot: 0.3 },
    { x: W * 0.9, y: H * 0.26, sprite: MDSprites.asteroidBig2, rot: -0.3 },
  ];

  function draw(ctx, w, h, t) {
    MDSkyline2.draw(ctx, W, H, t, {
      seed: 780, accent: '#D81F26', lit: '#FF2A3D', dim: '#0F1330',
      skyBands: ['#010208', '#030510', '#05081A', '#080D26', '#0B1234', '#0F1846'],
      farColor: '#101636', midColor: '#090D26', nearColor: '#05071A', heroColor: '#232A5C',
      moonColor: '#B9CEFF', moonX: 0.85, horizonFrac: 0.7,
    });
    asteroids.forEach((a, i) => MDSprites.blitSprite(ctx, a.sprite, a.x, a.y + Math.sin(t * 0.0006 + i) * 4, 0.85, t * 0.0003 + a.rot));
    const sx = W * 0.46, sy = H * 0.28, bob = Math.sin(t * 0.0007) * 2.5;
    MDSkyline2.shipHalo(ctx, sx, sy + bob, 26, 'rgba(185,206,255,0.2)');
    ctx.save(); ctx.translate(sx, sy + bob);
    const flameLen = 6 + 4 * Math.abs(Math.sin(t * 0.02));
    const fg = ctx.createLinearGradient(0, 11, 0, 11 + flameLen);
    fg.addColorStop(0, 'rgba(255,42,61,0.9)'); fg.addColorStop(1, 'rgba(255,0,0,0)');
    ctx.fillStyle = fg; ctx.fillRect(-3, 11, 6, flameLen);
    ctx.restore();
    MDSprites.blitSprite(ctx, MDSprites.shipGunship, sx, sy + bob, 1.6, 0);
  }

  MDLib.registerStyle({
    id: 'r5-03-night-red-deep', name: 'Night Red — Deep Blue',
    refs: [],
    palette: ['#010208', '#0F1846', '#05071A', '#FF2A3D', '#B9CEFF'],
    res: [W, H], titleFont: '"JetBrains Mono", monospace',
    note: 'Darker, deeper blue variant with a lower horizon (more sky, more of the city visible) and the gunship — check which blue depth feels right.',
    draw,
  });
})();
