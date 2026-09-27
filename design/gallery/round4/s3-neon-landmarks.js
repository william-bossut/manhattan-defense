(function () {
  const W = 560, H = 320, horizon = H * 0.7;
  const colors = {
    body: '#341C5E', edge: '#54308E', crown: '#F0E4FF', window: '#FF3BD6', dim: '#1A0E38',
    accent: '#3CF0FF', fillerBody: '#0F0824', silhouette: '#03020A',
  };
  const asteroids = [
    { x: W * 0.16, y: H * 0.3, sprite: MDSprites.debrisMetal, rot: 0.3 },
    { x: W * 0.84, y: H * 0.22, sprite: MDSprites.asteroidBig2, rot: -0.3 },
  ];

  function skyline(ctx, t) { MDLandmarks.drawSkyline(ctx, W, horizon, t, { colors, seed: 900 }); }

  function draw(ctx, w, h, t) {
    const sky = ctx.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, '#020109'); sky.addColorStop(0.6, '#160A33'); sky.addColorStop(1, '#2A1050');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, horizon);
    MDBase.drawStars(ctx, W, horizon * 0.6, 50, 88, t, 0.35);
    MDBase.drawGodRays(ctx, W * 0.5, -30, 'rgba(255,59,214,0.13)', 5, t, 380);
    MDBase.drawGodRays(ctx, W * 0.5, -30, 'rgba(60,240,255,0.09)', 5, t + 900, 380);
    skyline(ctx, t);
    MDBase.drawReflection(ctx, () => skyline(ctx, t), horizon, 0.3, 2);
    ctx.fillStyle = 'rgba(5,3,15,0.5)'; ctx.fillRect(0, horizon, W, H - horizon);
    ctx.fillStyle = 'rgba(255,59,214,0.13)'; ctx.fillRect(0, horizon, W, 2);
    asteroids.forEach((a, i) => MDSprites.blitSprite(ctx, a.sprite, a.x, a.y + Math.sin(t * 0.0005 + i) * 5, 1.2, t * 0.0003 + a.rot));
    const sx = W * 0.55, sy = H * 0.32, bob = Math.sin(t * 0.0007) * 3;
    ctx.save(); ctx.translate(sx, sy + bob);
    const flameLen = 8 + 5 * Math.abs(Math.sin(t * 0.022));
    const fg = ctx.createLinearGradient(0, 16, 0, 16 + flameLen);
    fg.addColorStop(0, 'rgba(60,240,255,0.9)'); fg.addColorStop(1, 'rgba(255,59,214,0)');
    ctx.fillStyle = fg; ctx.fillRect(-3, 16, 6, flameLen);
    ctx.restore();
    MDSprites.blitSprite(ctx, MDSprites.shipCyan, sx, sy + bob, 1.9, 0);
  }

  MDLib.registerStyle({
    id: 'r4-03-neon-landmarks', name: 'Neon Deep Night — Real Landmarks',
    refs: [{ label: 'REPLACED', url: 'https://www.engadget.com/gaming/pixel-art-cyberpunk-game-replaced-arrives-in-march-170253220.html' }],
    palette: ['#020109', '#2A1050', '#FF3BD6', '#3CF0FF'],
    res: [W, H], titleFont: '"JetBrains Mono", monospace',
    note: 'The same recognizable skyline under the cooler magenta/cyan mood, to compare how the landmarks read under a very different palette.',
    draw,
  });
})();
