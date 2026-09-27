(function () {
  const W = 480, H = 270, horizon = H * 0.86; // city pushed low — we're high up
  const buildings = MDBase.makeCityData(7006, W);
  const cityOpts = { buildingColor: '#0E1330', winColors: ['#FF8A3D', '#46F2FF'], scale: 0.4 };
  const asteroids = [
    { x: W * 0.2, y: H * 0.25, sprite: MDSprites.asteroidSmall, rot: 0.3 },
    { x: W * 0.62, y: H * 0.15, sprite: MDSprites.asteroidBig2, rot: -0.2 },
  ];

  function draw(ctx, w, h, t) {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#000000'); sky.addColorStop(0.75, '#050512'); sky.addColorStop(1, '#0E1330');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    MDBase.drawStars(ctx, W, H * 0.8, 120, 300, t, 0.5);
    // thin atmosphere haze arc, hinting at curvature
    ctx.save();
    ctx.beginPath(); ctx.ellipse(W * 0.5, horizon + 260, W * 0.9, 40, 0, 0, Math.PI * 2);
    const at = ctx.createRadialGradient(W * 0.5, horizon, 10, W * 0.5, horizon, 60);
    at.addColorStop(0, 'rgba(255,150,90,0.5)'); at.addColorStop(1, 'rgba(70,120,255,0)');
    ctx.fillStyle = at; ctx.fill();
    ctx.restore();
    MDBase.drawCity(ctx, buildings, horizon, cityOpts);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, horizon - 4, W, H - horizon + 4);
    asteroids.forEach((a, i) => MDSprites.blitSprite(ctx, a.sprite, a.x, a.y + Math.sin(t * 0.0005 + i) * 4, 1.3, t * 0.0004 + a.rot));
    // ship large, heading further up and away from the city
    const sx = W * 0.5, sy = H * 0.42, bob = Math.sin(t * 0.0006) * 4;
    ctx.save(); ctx.translate(sx, sy + bob);
    const flameLen = 8 + 5 * Math.abs(Math.sin(t * 0.018));
    const fg = ctx.createLinearGradient(0, 16, 0, 16 + flameLen);
    fg.addColorStop(0, 'rgba(70,242,255,0.9)'); fg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = fg; ctx.fillRect(-4, 16, 8, flameLen);
    ctx.restore();
    MDSprites.blitSprite(ctx, MDSprites.shipCyan, sx, sy + bob, 2.4, 0);
  }

  MDLib.registerStyle({
    id: 'r3-06-high-orbit', name: 'High Orbit Approach',
    refs: [{ label: 'REPLACED', url: 'https://www.engadget.com/gaming/pixel-art-cyberpunk-game-replaced-arrives-in-march-170253220.html' }],
    palette: ['#000000', '#050512', '#0E1330', '#46F2FF', '#FF8A3D'],
    res: [W, H], titleFont: '"JetBrains Mono", monospace',
    note: 'The far end of the climb: the city is now small and distant, stars dominate, a thin haze arc hints at the planet\'s curvature, ship large in frame heading up.',
    draw,
  });
})();
