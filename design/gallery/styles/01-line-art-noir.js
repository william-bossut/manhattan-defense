(function () {
  const rng = MDLib.rng(101);
  const W = 384, H = 216;
  const buildings = [];
  for (let i = 0; i < 22; i++) {
    const x = rng() * W * 1.1 - W * 0.05;
    const w = 22 + rng() * 38;
    const h = 50 + rng() * 130;
    const teeth = 3 + Math.floor(rng() * 4);
    const chain = rng() < 0.35;
    const hatches = [];
    const hn = 2 + Math.floor(rng() * 3);
    for (let k = 0; k < hn; k++) hatches.push({ x: w * (0.15 + rng() * 0.7), y: h * (0.1 + rng() * 0.7) });
    buildings.push({ x, w, h, teeth, chain, hatches, seed: rng() * 999 });
  }
  buildings.sort((a, b) => a.x - b.x);
  const stars = Array.from({ length: 40 }, () => ({ x: rng() * W, y: rng() * H * 0.55, ph: rng() * 10 }));

  function drawBuilding(ctx, b) {
    const y = H - b.h;
    ctx.beginPath();
    ctx.moveTo(b.x, H);
    ctx.lineTo(b.x, y);
    for (let i = 0; i <= b.teeth; i++) {
      const tx = b.x + (b.w * i) / b.teeth;
      const ty = y + (i % 2 === 0 ? 0 : b.h * 0.05 * ((i * 7 + b.seed) % 3));
      ctx.lineTo(tx, ty);
    }
    ctx.lineTo(b.x + b.w, H);
    ctx.stroke();
    b.hatches.forEach((h) => {
      const hx = b.x + h.x, hy = y + h.y;
      ctx.beginPath();
      ctx.moveTo(hx - 3, hy - 3); ctx.lineTo(hx + 3, hy + 3);
      ctx.moveTo(hx + 3, hy - 3); ctx.lineTo(hx - 3, hy + 3);
      ctx.stroke();
    });
    if (b.chain) {
      ctx.save(); ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.moveTo(b.x + b.w * 0.5, y); ctx.lineTo(b.x + b.w * 0.5, y + b.h * 0.4);
      ctx.stroke(); ctx.restore();
    }
  }

  function draw(ctx, w, h, t) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    stars.forEach((s) => {
      ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 0.001 + s.ph));
      ctx.fillRect(s.x, s.y, 1, 1);
    });
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
    ctx.shadowColor = '#fff'; ctx.shadowBlur = 3;
    buildings.forEach((b) => drawBuilding(ctx, b));
    ctx.shadowBlur = 0;
    // ship: small outline triangle, rare red thruster
    const sx = W * 0.52, sy = H * 0.4;
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(-Math.PI / 2 + Math.sin(t * 0.0004) * 0.1);
    ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(-7, 5); ctx.lineTo(-4, 0); ctx.lineTo(-7, -5); ctx.closePath();
    ctx.stroke();
    ctx.strokeStyle = '#D81F26'; ctx.shadowColor = '#D81F26'; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(-9, 0); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
    // vignette
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.8);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  }

  MDLib.registerStyle({
    id: '01-line-art-noir', name: 'Line-Art Noir',
    refs: [{ label: 'Visiophobia', url: 'https://itch.io/search?q=visiophobia' }],
    palette: ['#000000', '#ffffff', '#D81F26'],
    res: [W, H], titleFont: '"Press Start 2P", monospace',
    note: 'Thin glowing white strokes on black. Hazard hatch-marks, hanging chains, jagged silhouettes. Red is a rare accent (the thruster only).',
    draw,
  });
})();
