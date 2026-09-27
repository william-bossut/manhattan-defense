(function () {
  const W = 480, H = 270, horizon = H * 0.72;
  const buildings = MDBase.makeCityData(7003, W);
  const cityOpts = { buildingColor: '#120A24', winColors: ['#FF3BD6', '#3CF0FF'] };
  const asteroids = [
    { x: W * 0.16, y: H * 0.4, rot: 0.2, sprite: MDSprites.asteroidBig2 },
    { x: W * 0.82, y: H * 0.3, rot: -0.3, sprite: MDSprites.asteroidSmall },
  ];

  function draw(ctx, w, h, t) {
    const sky = ctx.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, '#03040C'); sky.addColorStop(0.6, '#170B33'); sky.addColorStop(1, '#2A1050');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, horizon);
    MDBase.drawStars(ctx, W, horizon * 0.7, 50, 88, t, 0.35);
    MDBase.drawGodRays(ctx, W * 0.5, -30, 'rgba(255,59,214,0.14)', 5, t, 340);
    MDBase.drawGodRays(ctx, W * 0.5, -30, 'rgba(60,240,255,0.10)', 5, t + 900, 340);
    MDBase.drawCity(ctx, buildings, horizon, cityOpts);
    MDBase.drawReflection(ctx, () => MDBase.drawCity(ctx, buildings, horizon, cityOpts), horizon, 0.32, 2);
    ctx.fillStyle = 'rgba(5,3,15,0.5)'; ctx.fillRect(0, horizon, W, H - horizon);
    ctx.fillStyle = 'rgba(255,59,214,0.14)'; ctx.fillRect(0, horizon, W, 2);
    asteroids.forEach((a, i) => MDSprites.blitSprite(ctx, a.sprite, a.x, a.y + Math.sin(t * 0.0005 + i) * 5, 1, t * 0.0003 + a.rot));
    const sx = W * 0.55, sy = H * 0.42, bob = Math.sin(t * 0.0007) * 3;
    ctx.save(); ctx.translate(sx, sy + bob);
    const flameLen = 7 + 5 * Math.abs(Math.sin(t * 0.022));
    const fg = ctx.createLinearGradient(0, 14, 0, 14 + flameLen);
    fg.addColorStop(0, 'rgba(60,240,255,0.9)'); fg.addColorStop(1, 'rgba(255,59,214,0)');
    ctx.fillStyle = fg; ctx.fillRect(-3, 14, 6, flameLen);
    ctx.restore();
    MDSprites.blitSprite(ctx, MDSprites.shipCyan, sx, sy + bob, 1.7, 0);
  }

  MDLib.registerStyle({
    id: 'r3-03-neon-deep-night', name: 'Neon Deep Night',
    refs: [{ label: 'REPLACED', url: 'https://www.engadget.com/gaming/pixel-art-cyberpunk-game-replaced-arrives-in-march-170253220.html' }],
    palette: ['#03040C', '#170B33', '#2A1050', '#FF3BD6', '#3CF0FF'],
    res: [W, H], titleFont: '"JetBrains Mono", monospace',
    note: 'Cooler and more saturated: magenta + cyan double god-rays, purple-black towers, heavier bloom — closer to full cyberpunk than the base.',
    draw,
  });
})();
