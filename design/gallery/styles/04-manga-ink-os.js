(function () {
  const rng = MDLib.rng(404);
  const W = 320, H = 200; // "screen" area inside the OS window chrome
  const buildings = [];
  let x = 4;
  while (x < W - 4) {
    const w = 26 + rng() * 34;
    const h = 40 + rng() * 100;
    const eye = rng() < 0.3;
    buildings.push({ x, w, h, eye, eyeR: 3 + rng() * 3, seed: rng() * 999 });
    x += w + 3;
  }

  let screentone = null;
  function getScreentone(ctx) {
    if (screentone) return screentone;
    const p = document.createElement('canvas'); p.width = 4; p.height = 4;
    const pc = p.getContext('2d');
    pc.fillStyle = '#fff'; pc.fillRect(0, 0, 4, 4);
    pc.fillStyle = '#000'; pc.fillRect(0, 0, 1, 1); pc.fillRect(2, 2, 1, 1);
    screentone = ctx.createPattern(p, 'repeat');
    return screentone;
  }

  function jag(ctx, x0, y0, w, h, seed) {
    ctx.beginPath();
    ctx.moveTo(x0, y0 + h); ctx.lineTo(x0, y0);
    const teeth = 3 + (Math.floor(seed) % 3);
    for (let i = 0; i <= teeth; i++) {
      ctx.lineTo(x0 + (w * i) / teeth, y0 + (i % 2 ? h * 0.06 : 0));
    }
    ctx.lineTo(x0 + w, y0 + h);
    ctx.closePath();
  }

  function draw(ctx, w, h, t) {
    ctx.clearRect(0, 0, w, h);
    // retro-OS window chrome
    ctx.fillStyle = '#c8c8c8'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, 16);
    ctx.fillStyle = '#fff'; ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillText('MANHATTAN.EXE  -  SECTOR VIEW', 6, 11);
    ctx.fillStyle = '#000'; ctx.fillRect(w - 14, 4, 8, 8);
    // "screen" panel
    const px = 4, py = 20, pw = W, ph = H;
    ctx.save();
    ctx.translate(px, py);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, pw, ph);
    ctx.beginPath(); ctx.rect(0, 0, pw, ph); ctx.clip();
    // moon with hatched shading
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(pw * 0.78, ph * 0.22, 20, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.stroke();
    for (let i = -18; i < 18; i += 4) {
      ctx.beginPath(); ctx.moveTo(pw * 0.78 - 18, ph * 0.22 + i); ctx.lineTo(pw * 0.78 - 2, ph * 0.22 + i);
      ctx.globalAlpha = 0.5; ctx.stroke(); ctx.globalAlpha = 1;
    }
    // buildings: ink outline + screentone fill, occasional eye
    ctx.fillStyle = getScreentone(ctx);
    buildings.forEach((b) => {
      const y = ph - b.h;
      jag(ctx, b.x, y, b.w, b.h, b.seed);
      ctx.fill(); ctx.strokeStyle = '#000'; ctx.lineWidth = 1.4; ctx.stroke();
      if (b.eye) {
        const ex = b.x + b.w * 0.5, ey = y + b.h * 0.3 + 8 * Math.sin(t * 0.001 + b.seed);
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(ex, ey, b.eyeR * 1.6, b.eyeR, 0, 0, Math.PI * 2); ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(ex, ey, b.eyeR * 0.45, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = getScreentone(ctx);
      }
    });
    // ship: jagged ink triangle
    ctx.fillStyle = '#000';
    ctx.save(); ctx.translate(pw * 0.5, ph * 0.45); ctx.rotate(-Math.PI / 2);
    ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-6, 5); ctx.lineTo(-6, -5); ctx.closePath(); ctx.fill();
    ctx.restore();
    // drip lines
    ctx.strokeStyle = '#000';
    for (let i = 0; i < 6; i++) {
      const dx = 20 + i * 50 + Math.sin(i) * 10;
      ctx.beginPath(); ctx.moveTo(dx, 0); ctx.lineTo(dx, 6 + (i % 3) * 3); ctx.stroke();
    }
    ctx.restore();
    // stat boxes under the screen
    ctx.strokeStyle = '#000'; ctx.fillStyle = '#000'; ctx.font = '9px "JetBrains Mono", monospace';
    ctx.strokeRect(px, py + ph + 4, pw, h - py - ph - 8);
    ctx.fillText('SANITY: ▓▓▓▓▓▓░░░░   ALTITUDE: 0042ft   [ ▮▮▮ SCROLL ▮▮▮ ]', px + 6, py + ph + 18);
  }

  MDLib.registerStyle({
    id: '04-manga-ink-os', name: 'Manga Ink / Retro OS',
    refs: [{ label: 'WORLD OF HORROR', url: 'https://store.steampowered.com/app/913740/WORLD_OF_HORROR/' }],
    palette: ['#ffffff', '#000000', '#c8c8c8'],
    res: [340, 232], titleFont: '"JetBrains Mono", monospace',
    note: 'Hand-drawn ink, screentone fills, jagged hand-inked buildings with the occasional eye — all inside an old-OS window frame, MS-Paint-horror style.',
    draw,
  });
})();
