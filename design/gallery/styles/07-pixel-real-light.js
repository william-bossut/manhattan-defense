(function () {
  const rng = MDLib.rng(707);
  const W = 480, H = 270;
  const horizon = H * 0.72;
  const buildings = [];
  let x = -10;
  while (x < W + 10) {
    const w = 30 + rng() * 50;
    const h = 50 + rng() * 150;
    const cols = 2 + Math.floor(rng() * 3), rows = 4 + Math.floor(rng() * 6);
    buildings.push({ x, w, h, cols, rows, seed: rng() * 999 });
    x += w + 2;
  }

  function drawCity(ctx, alpha) {
    ctx.globalAlpha = alpha;
    buildings.forEach((b) => {
      const y = horizon - b.h;
      ctx.fillStyle = '#0E1330';
      ctx.fillRect(b.x, y, b.w, b.h);
      const cw = b.w / (b.cols + 1), rh = b.h / (b.rows + 1);
      for (let r = 0; r < b.rows; r++) {
        for (let c = 0; c < b.cols; c++) {
          const idx = (r * 13 + c * 7 + b.seed) | 0;
          if (idx % 3 !== 0) {
            ctx.fillStyle = idx % 7 === 0 ? '#46F2FF' : '#FF8A3D';
            ctx.fillRect(b.x + cw * (c + 0.6), y + rh * (r + 0.6), cw * 0.5, rh * 0.4);
          }
        }
      }
    });
    ctx.globalAlpha = 1;
  }

  function draw(ctx, w, h, t) {
    // night sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, '#07080F'); sky.addColorStop(0.6, '#12173A'); sky.addColorStop(1, '#1B2340');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, horizon);
    // additive god rays from upper-right
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const rx = W * 0.85, ry = -20;
    for (let i = 0; i < 6; i++) {
      const a0 = Math.PI * 0.55 + i * 0.09 + Math.sin(t * 0.0003 + i) * 0.01;
      const len = 380;
      const grad = ctx.createLinearGradient(rx, ry, rx + Math.cos(a0) * len, ry + Math.sin(a0) * len);
      grad.addColorStop(0, 'rgba(255,138,61,0.16)'); grad.addColorStop(1, 'rgba(255,138,61,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx + Math.cos(a0 - 0.03) * len, ry + Math.sin(a0 - 0.03) * len);
      ctx.lineTo(rx + Math.cos(a0 + 0.03) * len, ry + Math.sin(a0 + 0.03) * len);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    // parallax fog bands
    for (let i = 0; i < 3; i++) {
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = '#3E4C7A';
      ctx.fillRect(0, horizon - 40 - i * 30, W, 22);
    }
    ctx.globalAlpha = 1;
    drawCity(ctx, 1);
    // reflection: flipped, blurred, dimmer, below horizon
    ctx.save();
    ctx.translate(0, horizon * 2);
    ctx.scale(1, -1);
    ctx.filter = 'blur(1.5px)';
    drawCity(ctx, 0.28);
    ctx.filter = 'none';
    ctx.restore();
    ctx.fillStyle = 'rgba(7,8,15,0.45)';
    ctx.fillRect(0, horizon, W, H - horizon);
    // wet street sheen line
    ctx.fillStyle = 'rgba(70,242,255,0.15)';
    ctx.fillRect(0, horizon, W, 1.5);
    // tiny ship, cinematic scale
    const sx = W * 0.42, sy = H * 0.4;
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#0E1330';
    ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(-4, 3); ctx.lineTo(-4, -3); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#46F2FF'; ctx.lineWidth = 0.6; ctx.stroke();
    ctx.restore();
  }

  MDLib.registerStyle({
    id: '07-pixel-real-light', name: 'Pixel + Real Lighting',
    refs: [
      { label: 'The Last Night', url: 'https://store.steampowered.com/app/612400/The_Last_Night/' },
      { label: 'REPLACED', url: 'https://www.engadget.com/gaming/pixel-art-cyberpunk-game-replaced-arrives-in-march-170253220.html' },
    ],
    palette: ['#07080F', '#1B2340', '#3E4C7A', '#FF8A3D', '#46F2FF'],
    res: [W, H], titleFont: '"JetBrains Mono", monospace',
    note: 'Low-res pixel city, but the light (god rays, fog, wet reflections) is drawn smooth and high-res on top — cinematic widescreen framing.',
    draw,
  });
})();
