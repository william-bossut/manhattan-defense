(function () {
  const W = 560, H = 320, horizon = H * 0.7;
  const colors = {
    body: '#242C5C', edge: '#3E4A8C', crown: '#E4E8F5', window: '#FF8A3D', dim: '#161B36',
    accent: '#D81F26', fillerBody: '#0A0E24', silhouette: '#04050C',
  };
  const asteroids = [
    { x: W * 0.14, y: H * 0.24, sprite: MDSprites.asteroidBig, rot: 0.3 },
    { x: W * 0.86, y: H * 0.2, sprite: MDSprites.debrisMetal, rot: -0.4 },
  ];

  function skyline(ctx, t) { MDLandmarks.drawSkyline(ctx, W, horizon, t, { colors, seed: 900 }); }

  function draw(ctx, w, h, t) {
    const sky = ctx.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, '#05060F'); sky.addColorStop(0.6, '#10163A'); sky.addColorStop(1, '#1B2350');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, horizon);
    MDBase.drawStars(ctx, W, horizon * 0.55, 46, 55, t, 0.3);
    MDBase.drawGodRays(ctx, W * 0.86, -20, 'rgba(255,138,61,0.14)', 6, t, 420);
    for (let i = 0; i < 3; i++) { ctx.globalAlpha = 0.10; ctx.fillStyle = '#3E4C7A'; ctx.fillRect(0, horizon - 50 - i * 34, W, 26); }
    ctx.globalAlpha = 1;
    skyline(ctx, t);
    MDBase.drawReflection(ctx, () => skyline(ctx, t), horizon, 0.24, 1.6);
    ctx.fillStyle = 'rgba(5,6,15,0.42)'; ctx.fillRect(0, horizon, W, H - horizon);
    ctx.fillStyle = 'rgba(70,242,255,0.14)'; ctx.fillRect(0, horizon, W, 1.5);
    asteroids.forEach((a, i) => MDSprites.blitSprite(ctx, a.sprite, a.x, a.y + Math.sin(t * 0.0005 + i) * 5, 1.3, t * 0.0003 * (i ? -1 : 1) + a.rot));
    const sx = W * 0.5, sy = H * 0.3, bob = Math.sin(t * 0.0007) * 3;
    ctx.save(); ctx.translate(sx, sy + bob);
    const flameLen = 7 + 5 * Math.abs(Math.sin(t * 0.02));
    const fg = ctx.createLinearGradient(0, 16, 0, 16 + flameLen);
    fg.addColorStop(0, 'rgba(255,138,61,0.9)'); fg.addColorStop(1, 'rgba(255,50,50,0)');
    ctx.fillStyle = fg; ctx.fillRect(-3, 16, 6, flameLen);
    ctx.restore();
    MDSprites.blitSprite(ctx, MDSprites.ship, sx, sy + bob, 1.9, 0);
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillText('FLATIRON · CHRYSLER · EMPIRE STATE · ONE WTC · BROOKLYN BRIDGE', 12, H - 10);
  }

  MDLib.registerStyle({
    id: 'r4-01-cinematic-landmarks', name: 'Cinematic — Real Landmarks',
    refs: [{ label: 'The Last Night', url: 'https://store.steampowered.com/app/612400/The_Last_Night/' }],
    palette: ['#05060F', '#1B2350', '#3E4C7A', '#FF8A3D', '#46F2FF'],
    res: [W, H], titleFont: '"JetBrains Mono", monospace',
    note: 'The recognizable skyline: Flatiron, Chrysler\'s terraced crown, Empire State\'s setbacks + tip light, One WTC\'s taper, Brooklyn Bridge in silhouette up front.',
    draw,
  });
})();
