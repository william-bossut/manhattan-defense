(function () {
  const W = 340, H = 220;
  const asteroids = [
    { x: W * 0.14, y: H * 0.2, sprite: MDSprites.asteroidBig, rot: 0.3 },
    { x: W * 0.88, y: H * 0.16, sprite: MDSprites.debrisMetal, rot: -0.4 },
  ];

  const DUSK = {
    skyBands: ['#2B1F3D', '#4A2A4E', '#7A3B52', '#B14F52', '#DC7A4A', '#F2A65C'],
    lit: '#FFC15E', dim: '#4A3322', nearColor: '#2E2038', midColor: '#3A2A44', farColor: '#5C4560',
    heroColor: '#4A3856', cap: '#C9A876', cloudColor: '#F2B8A0', orbColor: '#FFDD99',
  };
  const NIGHT = {
    skyBands: ['#03040B', '#050817', '#080D22', '#0C132E', '#121A3E', '#182150'],
    lit: '#FF3B3B', dim: '#141833', nearColor: '#0A0F26', midColor: '#0C1230', farColor: '#141B3E',
    heroColor: '#242C5C', cap: '#B7C0E2', cloudColor: '#182150', orbColor: '#DCE8FF',
  };

  function draw(ctx, w, h, t) {
    MDSkyline3.draw(ctx, W, H, t, {
      seed: 500, accent: '#D81F26', dusk: DUSK, night: NIGHT, cycleSpeed: 0.00011,
    });
    asteroids.forEach((a, i) => MDSprites.blitSprite(ctx, a.sprite, a.x, a.y + Math.sin(t * 0.0006 + i) * 4, 0.95, t * 0.0003 * (i ? -1 : 1) + a.rot));
    const sx = W * 0.63, sy = H * 0.3, bob = Math.sin(t * 0.0007) * 2.5;
    MDSkyline3.shipHalo(ctx, sx, sy + bob, 26, 'rgba(220,232,255,0.18)');
    ctx.save(); ctx.translate(sx, sy + bob);
    const flameLen = 6 + 4 * Math.abs(Math.sin(t * 0.02));
    const fg = ctx.createLinearGradient(0, 12, 0, 12 + flameLen);
    fg.addColorStop(0, 'rgba(255,80,60,0.9)'); fg.addColorStop(1, 'rgba(255,0,0,0)');
    ctx.fillStyle = fg; ctx.fillRect(-2.5, 12, 5, flameLen);
    ctx.restore();
    MDSprites.blitSprite(ctx, MDSprites.ship, sx, sy + bob, 1.8, 0);
  }

  MDLib.registerStyle({
    id: 'r6-01-dusk-to-night', name: 'Dusk → Night (looping)',
    refs: [],
    palette: ['#F2A65C', '#182150', '#FFC15E', '#FF3B3B', '#0A0F26'],
    res: [W, H], titleFont: '"JetBrains Mono", monospace',
    note: 'Loops continuously: warm gold-lit dusk crossfades into dark-blue night with red windows — sky, windows, moon/sun and clouds all blend together. 3 building layers now drift at different speeds (the parallax you pointed out). Hero tower rebuilt slender with one setback + fine dense windows, not a stacked wedding cake.',
    draw,
  });
})();
