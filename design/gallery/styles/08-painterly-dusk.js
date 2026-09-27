(function () {
  const rng = MDLib.rng(808);
  const W = 320, H = 180;
  const horizon = H * 0.68;
  const bands = ['#1D1A2F', '#2B2246', '#3B2E5A', '#6A4A79', '#8E5A8C', '#C97A83', '#E98C6B', '#F7D08A'];
  const buildings = [];
  let x = -6;
  while (x < W + 6) {
    const w = 14 + rng() * 22;
    const h = 20 + rng() * 70;
    buildings.push({ x, w, h, near: rng() < 0.5 });
    x += w + 1;
  }
  const trainY = horizon - 6;

  function draw(ctx, w, h, t) {
    // sky in flat bands
    bands.forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.fillRect(0, (horizon * i) / bands.length, W, horizon / bands.length + 1);
    });
    // low sun
    const sunY = horizon * 0.62;
    const sg = ctx.createRadialGradient(W * 0.5, sunY, 0, W * 0.5, sunY, 46);
    sg.addColorStop(0, 'rgba(247,208,138,0.9)'); sg.addColorStop(1, 'rgba(247,208,138,0)');
    ctx.fillStyle = sg; ctx.fillRect(W * 0.5 - 46, sunY - 46, 92, 92);
    ctx.fillStyle = '#F7D08A';
    ctx.beginPath(); ctx.arc(W * 0.5, sunY, 14, 0, Math.PI * 2); ctx.fill();
    // ground
    ctx.fillStyle = '#150F22'; ctx.fillRect(0, horizon, W, H - horizon);
    // buildings, flat color clusters, silhouetted against sun
    buildings.forEach((b) => {
      const y = horizon - b.h;
      ctx.fillStyle = b.near ? '#160F26' : '#241A3D';
      ctx.fillRect(b.x, y, b.w, b.h);
      // a few lit windows, warm
      if (b.near) {
        ctx.fillStyle = '#F7D08A';
        for (let i = 0; i < 3; i++) {
          if (rng() < 0.5) ctx.fillRect(b.x + 3 + (i % 2) * 6, y + 6 + i * 10, 2, 3);
        }
      }
    });
    // train with steam, small animated
    const tx = (t * 0.01) % (W + 60) - 30;
    ctx.fillStyle = '#0E0A18'; ctx.fillRect(tx, trainY, 26, 5);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath(); ctx.ellipse(tx - 4, trainY - 3, 5, 3, 0, 0, Math.PI * 2); ctx.fill();
    // sickly green accent bird / signal, single accent color
    ctx.fillStyle = '#9FD36B';
    ctx.fillRect(W * 0.15, horizon - 40, 2, 2);
    // ship, quiet silhouette, still camera
    ctx.fillStyle = '#160F26';
    ctx.save(); ctx.translate(W * 0.7, H * 0.33); ctx.rotate(-Math.PI / 2);
    ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(-4, 3); ctx.lineTo(-4, -3); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  MDLib.registerStyle({
    id: '08-painterly-dusk', name: 'Painterly Dusk',
    refs: [
      { label: 'NORCO', url: 'https://store.steampowered.com/app/1221250/NORCO/' },
      { label: 'Waneella', url: 'https://www.harugonomayu.com/waneella' },
    ],
    palette: ['#1D1A2F', '#3B2E5A', '#8E5A8C', '#E98C6B', '#F7D08A', '#9FD36B'],
    res: [W, H], titleFont: 'Georgia, "Times New Roman", serif',
    note: 'No outlines — forms are built from flat color clusters. A big banded sky, a low sun, a still camera. Reads as a melancholy anime landscape, not an arcade game.',
    draw,
  });
})();
