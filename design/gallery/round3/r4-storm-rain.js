(function () {
  const W = 480, H = 270, horizon = H * 0.72;
  const buildings = MDBase.makeCityData(7004, W);
  const cityOpts = { buildingColor: '#0B0F1C', winColors: ['#8FD0FF', '#46F2FF'] };
  let lastFlash = -9999;

  function draw(ctx, w, h, t) {
    // occasional lightning flash brightens the sky briefly
    if (t - lastFlash > 3200 + (t % 1000)) lastFlash = t;
    const sinceFlash = t - lastFlash;
    const flash = sinceFlash < 120 ? (1 - sinceFlash / 120) * 0.5 : 0;

    const sky = ctx.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, `rgba(${18 + flash * 200},${20 + flash * 200},${30 + flash * 200},1)`);
    sky.addColorStop(1, '#141A2E');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, horizon);
    for (let i = 0; i < 4; i++) { ctx.globalAlpha = 0.15; ctx.fillStyle = '#3E4C7A'; ctx.fillRect(0, horizon - 60 - i * 24, W, 26); }
    ctx.globalAlpha = 1;
    MDBase.drawCity(ctx, buildings, horizon, cityOpts);
    MDBase.drawReflection(ctx, () => MDBase.drawCity(ctx, buildings, horizon, cityOpts), horizon, 0.4, 2.2);
    ctx.fillStyle = 'rgba(11,15,28,0.5)'; ctx.fillRect(0, horizon, W, H - horizon);
    ctx.fillStyle = 'rgba(143,208,255,0.18)'; ctx.fillRect(0, horizon, W, 2);
    MDBase.drawRain(ctx, W, H, 90, 44, t, 'rgba(180,210,255,0.4)');
    if (flash > 0) { ctx.fillStyle = `rgba(220,230,255,${flash})`; ctx.fillRect(0, 0, W, H); }
    const sx = W * 0.48, sy = H * 0.4, bob = Math.sin(t * 0.001) * 3;
    ctx.save(); ctx.translate(sx, sy + bob);
    const flameLen = 6 + 4 * Math.abs(Math.sin(t * 0.02));
    const fg = ctx.createLinearGradient(0, 14, 0, 14 + flameLen);
    fg.addColorStop(0, 'rgba(70,242,255,0.9)'); fg.addColorStop(1, 'rgba(70,120,255,0)');
    ctx.fillStyle = fg; ctx.fillRect(-3, 14, 6, flameLen);
    ctx.restore();
    MDSprites.blitSprite(ctx, MDSprites.shipCyan, sx, sy + bob, 1.6, Math.sin(t * 0.0009) * 0.08);
  }

  MDLib.registerStyle({
    id: 'r3-04-storm-rain', name: 'Storm & Rain',
    refs: [{ label: 'The Last Night', url: 'https://store.steampowered.com/app/612400/The_Last_Night/' }],
    palette: ['#0B0F1C', '#141A2E', '#3E4C7A', '#8FD0FF', '#46F2FF'],
    res: [W, H], titleFont: '"JetBrains Mono", monospace',
    note: 'Same base recipe with weather added: animated rain streaks, a periodic lightning flash, and stronger wet-street reflections.',
    draw,
  });
})();
