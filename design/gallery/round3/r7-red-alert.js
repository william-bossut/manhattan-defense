(function () {
  const W = 480, H = 270, horizon = H * 0.72;
  const buildings = MDBase.makeCityData(7007, W);
  const cityOpts = { buildingColor: '#0F0505', winColors: ['#FF3B3B', '#FF8080'], beacon: true, beaconColor: '#FF3B3B' };
  const asteroids = [
    { x: W * 0.24, y: H * 0.36, sprite: MDSprites.asteroidBig, rot: 0.4 },
    { x: W * 0.72, y: H * 0.5, sprite: MDSprites.asteroidSmall, rot: -0.5 },
  ];

  function draw(ctx, w, h, t) {
    cityOpts.t = t;
    const pulse = 0.5 + 0.5 * Math.sin(t * 0.003);
    const sky = ctx.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, '#0A0303'); sky.addColorStop(1, `rgba(60,10,10,${0.7 + pulse * 0.3})`);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, horizon);
    MDBase.drawGodRays(ctx, W * 0.5, -10, `rgba(255,40,40,${0.12 + pulse * 0.08})`, 6, t, 360);
    MDBase.drawCity(ctx, buildings, horizon, cityOpts);
    MDBase.drawReflection(ctx, () => MDBase.drawCity(ctx, buildings, horizon, cityOpts), horizon, 0.3, 2);
    ctx.fillStyle = 'rgba(10,3,3,0.5)'; ctx.fillRect(0, horizon, W, H - horizon);
    // full-screen danger pulse overlay
    ctx.fillStyle = `rgba(216,31,38,${0.05 + pulse * 0.06})`; ctx.fillRect(0, 0, W, H);
    // rim-lit red asteroids
    asteroids.forEach((a, i) => {
      MDSprites.blitSprite(ctx, a.sprite, a.x, a.y + Math.sin(t * 0.0006 + i) * 4, 1, t * 0.0004 + a.rot);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.25 + pulse * 0.2;
      MDSprites.blitSprite(ctx, a.sprite, a.x, a.y + Math.sin(t * 0.0006 + i) * 4, 1.05, t * 0.0004 + a.rot);
      ctx.restore();
    });
    const sx = W * 0.5, sy = H * 0.42, bob = Math.sin(t * 0.0007) * 3;
    ctx.save(); ctx.translate(sx, sy + bob);
    const flameLen = 8 + 6 * Math.abs(Math.sin(t * 0.03));
    const fg = ctx.createLinearGradient(0, 16, 0, 16 + flameLen);
    fg.addColorStop(0, `rgba(255,60,60,${0.8 + pulse * 0.2})`); fg.addColorStop(1, 'rgba(255,0,0,0)');
    ctx.fillStyle = fg; ctx.fillRect(-4, 16, 8, flameLen);
    ctx.restore();
    MDSprites.blitSprite(ctx, MDSprites.ship, sx, sy + bob, 1.8, 0);
    // HUD-ish danger text
    ctx.fillStyle = `rgba(255,80,80,${0.6 + pulse * 0.4})`;
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.fillText('!! HULL BREACH RISK !!', 14, 22);
  }

  MDLib.registerStyle({
    id: 'r3-07-red-alert', name: 'Red Alert',
    refs: [],
    palette: ['#0A0303', '#0F0505', '#D81F26', '#FF3B3B'],
    res: [W, H], titleFont: '"JetBrains Mono", monospace',
    note: 'A danger-state variant of the base recipe: red pushed from accent to dominant, pulsing sirens on rooftops, rim-lit red asteroids — for the "you\'re about to die" moment.',
    draw,
  });
})();
