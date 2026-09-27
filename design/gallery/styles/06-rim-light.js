(function () {
  const rng = MDLib.rng(606);
  const W = 384, H = 216;
  const lightX = W * 0.78, lightY = H * 0.2;
  const buildings = [];
  let x = -10;
  while (x < W + 10) {
    const w = 24 + rng() * 40;
    const h = 40 + rng() * 140;
    buildings.push({ x, w, h, depth: rng() });
    x += w + rng() * 8;
  }

  function bandedAlpha(dist, maxDist) {
    const t = MDLib.clamp(1 - dist / maxDist, 0, 1);
    const bands = 4;
    return Math.ceil(t * bands) / bands;
  }

  function draw(ctx, w, h, t) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    // posterized light falloff glow around the light source (the moon/beacon)
    const maxDist = W * 0.9;
    for (let ring = 5; ring >= 1; ring--) {
      const r = (ring / 5) * maxDist * 0.5;
      ctx.globalAlpha = 0.05 * (6 - ring);
      ctx.fillStyle = '#F2D17C';
      ctx.beginPath(); ctx.arc(lightX, lightY, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#FFF6DD';
    ctx.beginPath(); ctx.arc(lightX, lightY, 8, 0, Math.PI * 2); ctx.fill();

    buildings.forEach((b) => {
      const y = H - b.h;
      // near-black silhouette
      ctx.fillStyle = `rgb(${5 + Math.round(b.depth * 6)},${6 + Math.round(b.depth * 6)},${10 + Math.round(b.depth * 8)})`;
      ctx.fillRect(b.x, y, b.w, b.h);
      // rim light only on the edge facing the light source
      const cx = b.x + b.w / 2;
      const dist = Math.hypot(cx - lightX, y - lightY);
      const alpha = bandedAlpha(dist, maxDist);
      const facingRight = lightX > cx;
      const rimColor = alpha > 0.7 ? '#F2D17C' : '#7CF2E8';
      ctx.strokeStyle = rimColor;
      ctx.globalAlpha = 0.35 + alpha * 0.65;
      ctx.lineWidth = 1;
      ctx.beginPath();
      if (facingRight) { ctx.moveTo(b.x + b.w, y); ctx.lineTo(b.x + b.w, H); }
      else { ctx.moveTo(b.x, y); ctx.lineTo(b.x, H); }
      ctx.moveTo(b.x, y); ctx.lineTo(b.x + b.w, y);
      ctx.stroke();
      ctx.globalAlpha = 1;
      // faint lamp
      if (rng() < 0) {}
    });
    // small lamp with bloom
    const lampX = W * 0.3, lampY = H * 0.86;
    const lg = ctx.createRadialGradient(lampX, lampY, 0, lampX, lampY, 16);
    lg.addColorStop(0, 'rgba(255,111,181,0.9)'); lg.addColorStop(1, 'rgba(255,111,181,0)');
    ctx.fillStyle = lg; ctx.fillRect(lampX - 16, lampY - 16, 32, 32);
    // ship: dark silhouette with a thin rim
    const sx = W * 0.55, sy = H * 0.55;
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(-Math.PI / 2 + Math.sin(t * 0.0005) * 0.15);
    ctx.fillStyle = '#05060A';
    ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(-7, 5); ctx.lineTo(-4, 0); ctx.lineTo(-7, -5); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#F2D17C'; ctx.lineWidth = 1; ctx.globalAlpha = 0.8; ctx.stroke(); ctx.globalAlpha = 1;
    ctx.restore();
  }

  MDLib.registerStyle({
    id: '06-rim-light', name: 'Rim-Light Silhouettes',
    refs: [{ label: 'Animal Well', url: 'https://store.steampowered.com/app/813230/ANIMAL_WELL/' }],
    palette: ['#000000', '#05060A', '#7CF2E8', '#F2D17C', '#FF6FB5'],
    res: [W, H], titleFont: '"JetBrains Mono", monospace',
    note: 'Almost everything is near-black; only the edges facing the one light source get a bright rim, with posterized (banded, not smooth) falloff.',
    draw,
  });
})();
