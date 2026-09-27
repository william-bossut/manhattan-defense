(function () {
  const W = 480, H = 270, horizon = H * 0.72;
  const buildings = MDBase.makeCityData(7001, W);
  const asteroids = [
    { x: W * 0.22, y: H * 0.32, rot: 0.4, sc: 1, sprite: MDSprites.asteroidBig },
    { x: W * 0.7, y: H * 0.56, rot: -0.6, sc: 1.1, sprite: MDSprites.asteroidSmall },
  ];
  const cityOpts = { buildingColor: '#0E1330', winColors: ['#FF8A3D', '#46F2FF'] };

  function draw(ctx, w, h, t) {
    const sky = ctx.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, '#07080F'); sky.addColorStop(0.6, '#12173A'); sky.addColorStop(1, '#1B2340');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, horizon);
    MDBase.drawStars(ctx, W, horizon, 36, 55, t, 0.3);
    MDBase.drawGodRays(ctx, W * 0.85, -20, 'rgba(255,138,61,0.16)', 6, t, 380);
    for (let i = 0; i < 3; i++) { ctx.globalAlpha = 0.12; ctx.fillStyle = '#3E4C7A'; ctx.fillRect(0, horizon - 40 - i * 30, W, 22); }
    ctx.globalAlpha = 1;
    MDBase.drawCity(ctx, buildings, horizon, cityOpts);
    MDBase.drawReflection(ctx, () => MDBase.drawCity(ctx, buildings, horizon, cityOpts), horizon, 0.28, 1.5);
    ctx.fillStyle = 'rgba(7,8,15,0.45)'; ctx.fillRect(0, horizon, W, H - horizon);
    ctx.fillStyle = 'rgba(70,242,255,0.15)'; ctx.fillRect(0, horizon, W, 1.5);
    asteroids.forEach((a, i) => {
      MDSprites.blitSprite(ctx, a.sprite, a.x, a.y + Math.sin(t * 0.0006 + i) * 4, a.sc, t * 0.0004 * (i ? -1 : 1) + a.rot);
    });
    const sx = W * 0.42, sy = H * 0.4, bob = Math.sin(t * 0.0007) * 3;
    ctx.save(); ctx.translate(sx, sy + bob);
    const flameLen = 6 + 4 * Math.abs(Math.sin(t * 0.02));
    const fg = ctx.createLinearGradient(0, 14, 0, 14 + flameLen);
    fg.addColorStop(0, 'rgba(255,138,61,0.9)'); fg.addColorStop(1, 'rgba(255,50,50,0)');
    ctx.fillStyle = fg; ctx.fillRect(-3, 14, 6, flameLen);
    ctx.restore();
    MDSprites.blitSprite(ctx, MDSprites.ship, sx, sy + bob, 1.6, 0);
  }

  MDLib.registerStyle({
    id: 'r3-01-cinematic-base', name: 'Cinematic Base',
    refs: [
      { label: 'The Last Night', url: 'https://store.steampowered.com/app/612400/The_Last_Night/' },
      { label: 'REPLACED', url: 'https://www.engadget.com/gaming/pixel-art-cyberpunk-game-replaced-arrives-in-march-170253220.html' },
    ],
    palette: ['#07080F', '#1B2340', '#3E4C7A', '#FF8A3D', '#46F2FF'],
    res: [W, H], titleFont: '"JetBrains Mono", monospace',
    note: 'The direction you picked, refined: a designed ship + asteroid sprites (not placeholders), better composition, layered god rays / fog / wet reflection.',
    draw,
  });
})();
