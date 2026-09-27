(function () {
  const rng = MDLib.rng(1010);
  const W = 384, H = 216;
  const GREEN = '#33FF66';
  const towers = [];
  for (let i = 0; i < 14; i++) {
    const cx = rng() * W;
    const depth = 0.3 + rng() * 0.9; // smaller = farther
    const baseW = 30 * depth, baseH = 60 * depth + rng() * 50 * depth;
    towers.push({ cx, depth, baseW, baseH });
  }
  towers.sort((a, b) => a.depth - b.depth);

  function drawTowerWire(ctx, tw) {
    const w = tw.baseW, h = tw.baseH;
    const x0 = tw.cx - w / 2, y0 = H - h;
    const persp = 6 * tw.depth; // top face recedes
    ctx.beginPath();
    // front face
    ctx.moveTo(x0, H); ctx.lineTo(x0, y0); ctx.lineTo(x0 + w, y0); ctx.lineTo(x0 + w, H);
    // top face (simple perspective)
    ctx.moveTo(x0, y0); ctx.lineTo(x0 + persp, y0 - persp);
    ctx.lineTo(x0 + w + persp, y0 - persp); ctx.lineTo(x0 + w, y0);
    ctx.moveTo(x0 + w + persp, y0 - persp); ctx.lineTo(x0 + w, H);
    ctx.stroke();
  }

  function draw(ctx, w, h, t) {
    // phosphor persistence: translucent fade instead of clear
    ctx.fillStyle = 'rgba(2,10,4,0.35)';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = GREEN;
    ctx.shadowColor = GREEN;
    ctx.lineWidth = 1;
    towers.forEach((tw) => {
      ctx.globalAlpha = 0.4 + tw.depth * 0.6;
      ctx.shadowBlur = 4 + tw.depth * 6;
      drawTowerWire(ctx, tw);
    });
    ctx.globalAlpha = 1;
    // ship as a wireframe delta, with a small readout box (Duskers-style terminal UI)
    ctx.shadowBlur = 8;
    const sx = W * 0.5, sy = H * 0.45 + Math.sin(t * 0.001) * 3;
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(-Math.PI / 2);
    ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(-7, 5); ctx.lineTo(-7, -5); ctx.closePath(); ctx.stroke();
    ctx.restore();
    ctx.shadowBlur = 0;
    // terminal readout
    ctx.strokeRect(6, 6, 90, 28);
    ctx.font = '8px "JetBrains Mono", monospace'; ctx.fillStyle = GREEN;
    ctx.fillText('> UNIT.07 CLIMBING', 10, 16);
    ctx.fillText('> ALT 0412 M', 10, 26);
    // scanlines + vignette overlay
    ctx.globalAlpha = 0.12;
    for (let y = 0; y < H; y += 2) ctx.fillRect(0, y, W, 1);
    ctx.globalAlpha = 1;
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.85);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  }

  MDLib.registerStyle({
    id: '10-vector-crt', name: 'Vector CRT Phosphor',
    refs: [
      { label: 'Duskers', url: 'https://store.steampowered.com/app/254320/Duskers/' },
      { label: 'Vector Arcade', url: 'https://paulvern.itch.io/vector-arcade' },
    ],
    palette: ['#020A04', '#33FF66'],
    res: [W, H], titleFont: '"JetBrains Mono", monospace',
    note: 'Glowing green strokes only, drawn with phosphor persistence (a translucent fade instead of a clear) plus scanlines and a terminal-style readout box.',
    draw,
  });
})();
