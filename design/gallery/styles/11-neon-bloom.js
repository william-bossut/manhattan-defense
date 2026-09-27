(function () {
  const rng = MDLib.rng(1111);
  const W = 384, H = 216;
  const COLORS = ['#FF2BD6', '#00F0FF', '#FFE600', '#7A3CFF'];
  const towers = [];
  for (let i = 0; i < 12; i++) {
    towers.push({
      x: rng() * W, w: 16 + rng() * 26, h: 40 + rng() * 130,
      color: COLORS[Math.floor(rng() * COLORS.length)], shape: rng() < 0.5 ? 'rect' : 'tri',
    });
  }

  function drawGrid(ctx, t) {
    ctx.strokeStyle = 'rgba(122,60,255,0.35)'; ctx.lineWidth = 1;
    const horizon = H * 0.78;
    for (let i = -10; i <= 10; i++) {
      const x0 = W / 2 + i * 40;
      ctx.beginPath(); ctx.moveTo(W / 2, horizon); ctx.lineTo(x0, H); ctx.stroke();
    }
    for (let j = 1; j <= 6; j++) {
      const y = horizon + (H - horizon) * (j / 6);
      const warp = Math.sin(t * 0.0008 + j) * 6;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 8) {
        const yy = y + Math.sin(x * 0.05 + j + t * 0.001) * 2 + warp * 0.2;
        if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
  }

  function draw(ctx, w, h, t) {
    ctx.fillStyle = '#0A0014'; ctx.fillRect(0, 0, W, H);
    drawGrid(ctx, t);
    ctx.globalCompositeOperation = 'lighter';
    towers.forEach((tw) => {
      const y = H * 0.78 - tw.h;
      ctx.strokeStyle = tw.color; ctx.shadowColor = tw.color; ctx.shadowBlur = 14; ctx.lineWidth = 2;
      ctx.beginPath();
      if (tw.shape === 'rect') ctx.rect(tw.x, y, tw.w, tw.h);
      else { ctx.moveTo(tw.x, y + tw.h); ctx.lineTo(tw.x + tw.w / 2, y); ctx.lineTo(tw.x + tw.w, y + tw.h); ctx.closePath(); }
      ctx.stroke();
    });
    // particle bursts
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2 + t * 0.0006;
      const r = 30 + 10 * Math.sin(t * 0.002 + i);
      const px = W * 0.5 + Math.cos(a) * r, py = H * 0.4 + Math.sin(a) * r * 0.6;
      ctx.fillStyle = COLORS[i % COLORS.length]; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(px, py, 1.4, 0, Math.PI * 2); ctx.fill();
    }
    // ship: glowing geometric delta
    ctx.strokeStyle = '#00F0FF'; ctx.shadowColor = '#00F0FF'; ctx.shadowBlur = 16; ctx.lineWidth = 2;
    ctx.save(); ctx.translate(W * 0.5, H * 0.4); ctx.rotate(-Math.PI / 2 + t * 0.0003);
    ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-7, 6); ctx.lineTo(-7, -6); ctx.closePath(); ctx.stroke();
    ctx.restore();
    ctx.globalCompositeOperation = 'source-over';
    ctx.shadowBlur = 0;
  }

  MDLib.registerStyle({
    id: '11-neon-bloom', name: 'Neon Geometric Bloom',
    refs: [
      { label: 'Geometry Wars 3', url: 'https://store.steampowered.com/app/310790/' },
      { label: 'Sayonara Wild Hearts', url: 'https://store.steampowered.com/app/1122720/' },
    ],
    palette: ['#0A0014', '#FF2BD6', '#00F0FF', '#FFE600', '#7A3CFF'],
    res: [W, H], titleFont: '"Press Start 2P", monospace',
    note: 'Pure glowing primitives on a warping perspective grid, additive blending everywhere — music-video energy instead of a moody city.',
    draw,
  });
})();
