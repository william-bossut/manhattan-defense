(function () {
  const rng = MDLib.rng(1313);
  const W = 384, H = 216;
  const PALETTE = ['#FF3E7F', '#FFB400', '#00D1B2', '#2B0F54', '#F5F0E1'];
  const blobs = [];
  let x = -10;
  while (x < W + 10) {
    const w = 26 + rng() * 40;
    const h = 50 + rng() * 120;
    const wobble = 4 + rng() * 10;
    const color = PALETTE[Math.floor(rng() * (PALETTE.length - 1))]; // never pick the paper color
    blobs.push({ x, w, h, wobble, color, seed: rng() * 999 });
    x += w + 4;
  }

  function hueShift(hex, deg) {
    // quick hex -> hsl-ish shift via canvas is overkill; approximate by rotating channel order slightly using CSS filter instead.
    return hex;
  }

  function meltyPath(ctx, b, t) {
    const y0 = H - b.h;
    ctx.beginPath();
    ctx.moveTo(b.x, H);
    const steps = 8;
    for (let i = 0; i <= steps; i++) {
      const yy = MDLib.lerp(H, y0, i / steps);
      const wob = Math.sin(i * 1.3 + b.seed + t * 0.0008) * b.wobble * (i / steps);
      ctx.lineTo(b.x - wob, yy);
    }
    for (let i = 0; i <= steps; i++) {
      const yy = MDLib.lerp(y0, H, i / steps);
      const wob = Math.sin((steps - i) * 1.3 + b.seed + 2 + t * 0.0008) * b.wobble * ((steps - i) / steps);
      ctx.lineTo(b.x + b.w + wob, yy);
    }
    ctx.closePath();
  }

  function draw(ctx, w, h, t) {
    ctx.fillStyle = PALETTE[4]; // paper background — bold flat, not black
    ctx.fillRect(0, 0, W, H);
    // hue-cycle wash via a translucent color overlay (cheap stand-in for full hue rotation)
    ctx.save();
    ctx.filter = `hue-rotate(${(t * 0.02) % 360}deg)`;
    blobs.forEach((b) => {
      ctx.fillStyle = b.color;
      meltyPath(ctx, b, t);
      ctx.fill();
      ctx.strokeStyle = '#2B0F54'; ctx.lineWidth = 3;
      ctx.stroke();
    });
    // ship: flat shape, thick outline, no shading
    ctx.fillStyle = PALETTE[2];
    ctx.save(); ctx.translate(W * 0.5, H * 0.4); ctx.rotate(-Math.PI / 2);
    ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-7, 6); ctx.lineTo(-7, -6); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#2B0F54'; ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
    ctx.restore();
    // sun, flat clashing circle
    ctx.fillStyle = PALETTE[1];
    ctx.beginPath(); ctx.arc(W * 0.82, H * 0.2, 22, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2B0F54'; ctx.lineWidth = 3; ctx.stroke();
  }

  MDLib.registerStyle({
    id: '13-psychedelic-flat', name: 'Psychedelic Flat',
    refs: [
      { label: 'Ultros', url: 'https://store.steampowered.com/app/2386310/Ultros/' },
      { label: 'Hotline Miami', url: 'https://store.steampowered.com/app/219150/' },
    ],
    palette: PALETTE,
    res: [W, H], titleFont: 'Georgia, serif',
    note: 'Loud, clashing, fully saturated flat colors with thick dark outlines, melting organic tower shapes, and a slow palette hue-cycle — the opposite of clean cyberpunk.',
    draw,
  });
})();
