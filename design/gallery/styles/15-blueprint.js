(function () {
  const rng = MDLib.rng(1515);
  const W = 384, H = 216;
  const BLUE = '#0B3D91', LINE = '#E6F0FF';
  const buildings = [];
  let x = 10;
  while (x < W - 20) {
    const w = 30 + rng() * 40;
    const h = 50 + rng() * 130;
    buildings.push({ x, w, h });
    x += w + 14; // extra gap reserved for dimension arrows
  }

  function dimensionLine(ctx, x0, x1, y, label) {
    ctx.strokeStyle = LINE; ctx.lineWidth = 0.75;
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
    [x0, x1].forEach((x) => { ctx.beginPath(); ctx.moveTo(x, y - 3); ctx.lineTo(x, y + 3); ctx.stroke(); });
    ctx.fillStyle = LINE; ctx.font = '7px "JetBrains Mono", monospace';
    ctx.fillText(label, (x0 + x1) / 2 - 8, y - 3);
  }

  function draw(ctx, w, h, t) {
    ctx.fillStyle = BLUE; ctx.fillRect(0, 0, W, H);
    // faint grid
    ctx.strokeStyle = 'rgba(230,240,255,0.12)'; ctx.lineWidth = 0.5;
    for (let gx = 0; gx < W; gx += 12) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
    for (let gy = 0; gy < H; gy += 12) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }
    // buildings: line-only, hatched cross-section on one
    ctx.strokeStyle = LINE; ctx.lineWidth = 1;
    buildings.forEach((b, i) => {
      const y = H - b.h;
      ctx.strokeRect(b.x, y, b.w, b.h);
      if (i === 2) {
        // hatched section fill
        ctx.save(); ctx.beginPath(); ctx.rect(b.x, y, b.w, b.h); ctx.clip();
        ctx.strokeStyle = 'rgba(230,240,255,0.5)'; ctx.lineWidth = 0.5;
        for (let d = -b.h; d < b.w; d += 6) {
          ctx.beginPath(); ctx.moveTo(b.x + d, y + b.h); ctx.lineTo(b.x + d + b.h, y); ctx.stroke();
        }
        ctx.restore();
        ctx.strokeStyle = LINE;
      }
      // floor lines
      const floors = Math.floor(b.h / 14);
      for (let f = 1; f < floors; f++) {
        ctx.beginPath(); ctx.moveTo(b.x, y + f * 14); ctx.lineTo(b.x + b.w, y + f * 14); ctx.stroke();
      }
    });
    // dimension annotations
    if (buildings.length > 1) dimensionLine(ctx, buildings[0].x, buildings[1].x, H - 8, `${Math.round(buildings[1].x - buildings[0].x)}FT`);
    dimensionLine(ctx, 10, 10, H * 0.3, ''); // vertical marker (label omitted, kept simple)
    // ship as technical outline with leader line + label
    const sx = W * 0.55, sy = H * 0.4;
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(-Math.PI / 2);
    ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(-7, 5); ctx.lineTo(-4, 0); ctx.lineTo(-7, -5); ctx.closePath(); ctx.stroke();
    ctx.restore();
    ctx.beginPath(); ctx.moveTo(sx + 12, sy - 12); ctx.lineTo(sx + 40, sy - 30); ctx.stroke();
    ctx.fillStyle = LINE; ctx.font = '8px "JetBrains Mono", monospace';
    ctx.fillText('UNIT-07 (SEE DETAIL A)', sx + 42, sy - 28);
    // title block, bottom-right
    ctx.strokeRect(W - 130, H - 34, 122, 26);
    ctx.fillText('MANHATTAN DEFENSE', W - 124, H - 22);
    ctx.fillText('SHEET A-042  REV.3', W - 124, H - 11);
  }

  MDLib.registerStyle({
    id: '15-blueprint', name: 'Blueprint',
    refs: [],
    palette: [BLUE, LINE],
    res: [W, H], titleFont: '"JetBrains Mono", monospace',
    note: 'No direct game reference — a technical-drawing idea: cyanotype blue, dimension arrows, a hatched cross-section, and a title block, like an architectural sheet of the tower.',
    draw,
  });
})();
