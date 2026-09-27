/* Same recipe as r1, pinned to each end of the crossfade so both states can
 * be inspected without waiting for the loop. */
(function () {
  const W = 340, H = 220;
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

  function makeDraw(phaseOffset, shipSprite, flameA, flameB) {
    const asteroids = [
      { x: W * 0.16, y: H * 0.22, sprite: MDSprites.asteroidBig2, rot: 0.3 },
    ];
    return function draw(ctx, w, h, t) {
      MDSkyline3.draw(ctx, W, H, t, { seed: 640, accent: '#D81F26', dusk: DUSK, night: NIGHT, cycleSpeed: 0, phaseOffset });
      asteroids.forEach((a) => MDSprites.blitSprite(ctx, a.sprite, a.x, a.y + Math.sin(t * 0.0006) * 4, 1, t * 0.0003));
      const sx = W * 0.6, sy = H * 0.3, bob = Math.sin(t * 0.0007) * 2.5;
      MDSkyline3.shipHalo(ctx, sx, sy + bob, 24, 'rgba(220,220,255,0.16)');
      ctx.save(); ctx.translate(sx, sy + bob);
      const flameLen = 6 + 4 * Math.abs(Math.sin(t * 0.02));
      const fg = ctx.createLinearGradient(0, 12, 0, 12 + flameLen);
      fg.addColorStop(0, flameA); fg.addColorStop(1, flameB);
      ctx.fillStyle = fg; ctx.fillRect(-2.5, 12, 5, flameLen);
      ctx.restore();
      MDSprites.blitSprite(ctx, shipSprite, sx, sy + bob, 1.8, 0);
    };
  }

  MDLib.registerStyle({
    id: 'r6-02-dusk-pinned', name: 'Dusk (pinned)',
    refs: [],
    palette: ['#F2A65C', '#7A3B52', '#FFC15E', '#4A3856'],
    res: [W, H], titleFont: '"JetBrains Mono", monospace',
    note: 'The dusk end of the crossfade, held still — gold-lit windows, warm sky, low sun. Compare directly against your reference images above.',
    draw: makeDraw(0, MDSprites.ship, 'rgba(255,193,94,0.9)', 'rgba(255,90,40,0)'),
  });

  MDLib.registerStyle({
    id: 'r6-03-night-pinned', name: 'Night (pinned)',
    refs: [],
    palette: ['#03040B', '#182150', '#FF3B3B', '#242C5C'],
    res: [W, H], titleFont: '"JetBrains Mono", monospace',
    note: 'The night end of the crossfade, held still — red-lit windows, dark blue banded sky, small pale moon.',
    draw: makeDraw(Math.PI, MDSprites.shipCyan, 'rgba(255,59,59,0.9)', 'rgba(255,0,0,0)'),
  });
})();
