(function () {
  // The version William liked, fixed: sky goes back to dark blue/navy; red
  // stays as the DANGER signal (beacons, pulse, HUD, flame) instead of
  // taking over the whole sky.
  const W = 560, H = 320, horizon = H * 0.7;
  const colors = {
    body: '#1E2450', edge: '#363E78', crown: '#D8DCF0', window: '#7CA8FF', dim: '#131736',
    accent: '#D81F26', fillerBody: '#080B1C', silhouette: '#04050C',
  };
  const asteroids = [
    { x: W * 0.2, y: H * 0.28, sprite: MDSprites.crystalHazard, rot: 0.2 },
    { x: W * 0.78, y: H * 0.22, sprite: MDSprites.asteroidSmall, rot: -0.5 },
  ];

  function skyline(ctx, t) { MDLandmarks.drawSkyline(ctx, W, horizon, t, { colors, seed: 900 }); }

  function draw(ctx, w, h, t) {
    const pulse = 0.5 + 0.5 * Math.sin(t * 0.0028);
    const sky = ctx.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, '#02030A'); sky.addColorStop(0.6, '#070A20'); sky.addColorStop(1, '#0E1436');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, horizon);
    MDBase.drawStars(ctx, W, horizon * 0.5, 40, 71, t, 0.3);
    skyline(ctx, t);
    MDBase.drawReflection(ctx, () => skyline(ctx, t), horizon, 0.22, 1.8);
    ctx.fillStyle = 'rgba(2,3,10,0.45)'; ctx.fillRect(0, horizon, W, H - horizon);
    // danger signal: a slow red sweep/beacon glow low in the sky, not a red sky
    const bx = W * (0.3 + 0.4 * Math.sin(t * 0.0004));
    const bg = ctx.createRadialGradient(bx, horizon * 0.5, 0, bx, horizon * 0.5, 160);
    bg.addColorStop(0, `rgba(216,31,38,${0.10 + pulse * 0.08})`); bg.addColorStop(1, 'rgba(216,31,38,0)');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, horizon);
    ctx.fillStyle = `rgba(216,31,38,${0.04 + pulse * 0.05})`; ctx.fillRect(0, 0, W, H);
    asteroids.forEach((a, i) => {
      MDSprites.blitSprite(ctx, a.sprite, a.x, a.y + Math.sin(t * 0.0006 + i) * 4, 1.2, t * 0.0004 + a.rot);
    });
    const sx = W * 0.5, sy = H * 0.3, bob = Math.sin(t * 0.0007) * 3;
    ctx.save(); ctx.translate(sx, sy + bob);
    const flameLen = 8 + 6 * Math.abs(Math.sin(t * 0.03));
    const fg = ctx.createLinearGradient(0, 16, 0, 16 + flameLen);
    fg.addColorStop(0, `rgba(255,60,60,${0.85 + pulse * 0.15})`); fg.addColorStop(1, 'rgba(255,0,0,0)');
    ctx.fillStyle = fg; ctx.fillRect(-3, 16, 6, flameLen);
    ctx.restore();
    MDSprites.blitSprite(ctx, MDSprites.ship, sx, sy + bob, 1.9, 0);
    ctx.fillStyle = `rgba(255,90,90,${0.55 + pulse * 0.45})`;
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.fillText('!! HULL BREACH RISK !!', 16, 26);
  }

  MDLib.registerStyle({
    id: 'r4-02-red-alert-navy', name: 'Red Alert (navy sky)',
    refs: [],
    palette: ['#02030A', '#0E1436', '#7CA8FF', '#D81F26'],
    res: [W, H], titleFont: '"JetBrains Mono", monospace',
    note: 'Fixed per feedback: the sky is dark navy again, not red. Danger reads through a sweeping red beacon glow, pulse overlay, HUD text and the flame — red stays the signal, not the setting.',
    draw,
  });
})();
