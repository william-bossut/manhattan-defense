(function () {
  const W = 480, H = 270, horizon = H * 0.68;
  const buildings = MDBase.makeCityData(7002, W);
  const cityOpts = { buildingColor: '#160E1A', winColors: ['#FFD37A', '#FFD37A'] };

  function draw(ctx, w, h, t) {
    const sky = ctx.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, '#241730'); sky.addColorStop(0.55, '#5A2E3A'); sky.addColorStop(1, '#F2833D');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, horizon);
    const sunY = horizon * 0.9;
    const sg = ctx.createRadialGradient(W * 0.5, sunY, 0, W * 0.5, sunY, 90);
    sg.addColorStop(0, 'rgba(255,214,140,0.9)'); sg.addColorStop(1, 'rgba(255,214,140,0)');
    ctx.fillStyle = sg; ctx.fillRect(W * 0.5 - 90, sunY - 90, 180, 180);
    ctx.fillStyle = '#FFE9C2'; ctx.beginPath(); ctx.arc(W * 0.5, sunY, 26, 0, Math.PI * 2); ctx.fill();
    MDBase.drawGodRays(ctx, W * 0.5, sunY, 'rgba(255,180,90,0.14)', 8, t, 300);
    // buildings mostly silhouetted against the sun
    MDBase.drawCity(ctx, buildings, horizon, cityOpts);
    MDBase.drawReflection(ctx, () => MDBase.drawCity(ctx, buildings, horizon, cityOpts), horizon, 0.22, 1.5);
    ctx.fillStyle = 'rgba(20,10,18,0.4)'; ctx.fillRect(0, horizon, W, H - horizon);
    // ship silhouetted against the sun disc
    const sx = W * 0.5, sy = H * 0.32 + Math.sin(t * 0.0006) * 3;
    ctx.save(); ctx.globalCompositeOperation = 'multiply';
    MDSprites.blitSprite(ctx, MDSprites.ship, sx, sy, 1.5, 0);
    ctx.restore();
    ctx.save(); ctx.translate(sx, sy);
    const flameLen = 5 + 3 * Math.abs(Math.sin(t * 0.02));
    ctx.fillStyle = 'rgba(255,214,140,0.8)'; ctx.fillRect(-2, 12, 4, flameLen);
    ctx.restore();
  }

  MDLib.registerStyle({
    id: 'r3-02-sodium-dawn', name: 'Sodium Dawn',
    refs: [{ label: 'The Last Night', url: 'https://store.steampowered.com/app/612400/The_Last_Night/' }],
    palette: ['#241730', '#5A2E3A', '#F2833D', '#FFE9C2'],
    res: [W, H], titleFont: '"JetBrains Mono", monospace',
    note: 'Same recipe, warm axis: a low sodium sunrise, buildings and ship read mostly as silhouettes against the glow.',
    draw,
  });
})();
