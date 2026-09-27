(function () {
  const rng = MDLib.rng(1212);
  const W = 384, H = 216;
  const S = 10; // voxel size
  const originX = W * 0.5, originY = H * 0.9;
  function iso(gx, gy, gz) {
    return { x: originX + (gx - gy) * S * 0.87, y: originY + (gx + gy) * S * 0.5 - gz * S };
  }
  const towers = [];
  for (let gx = -8; gx <= 8; gx++) {
    for (let gy = -8; gy <= 8; gy++) {
      if (rng() < 0.55) continue;
      const height = 2 + Math.floor(rng() * 14);
      towers.push({ gx, gy, height, hue: rng() });
    }
  }
  towers.sort((a, b) => (a.gx + a.gy) - (b.gx + b.gy));

  function faceColor(base, lightness) {
    return base.map((v) => Math.round(v * lightness));
  }
  function drawCube(ctx, gx, gy, gz, hue) {
    const top = iso(gx, gy, gz + 1);
    const topR = iso(gx + 1, gy, gz + 1);
    const topL = iso(gx, gy + 1, gz + 1);
    const topRL = iso(gx + 1, gy + 1, gz + 1);
    const bot = iso(gx, gy, gz);
    const botR = iso(gx + 1, gy, gz);
    const botL = iso(gx, gy + 1, gz);
    const emissive = ((gx * 13 + gy * 7 + gz * 3) | 0) % 6 === 0;
    const base = emissive ? [255, 200, 87] : [31, 42, 77];
    // top face (brightest)
    ctx.fillStyle = `rgb(${faceColor(base, 1.5).join(',')})`;
    ctx.beginPath(); ctx.moveTo(top.x, top.y); ctx.lineTo(topR.x, topR.y); ctx.lineTo(topRL.x, topRL.y); ctx.lineTo(topL.x, topL.y); ctx.closePath(); ctx.fill();
    // right face
    ctx.fillStyle = `rgb(${faceColor(base, 0.9).join(',')})`;
    ctx.beginPath(); ctx.moveTo(topR.x, topR.y); ctx.lineTo(botR.x, botR.y); ctx.lineTo(bot.x, bot.y); ctx.lineTo(top.x, top.y); ctx.closePath(); ctx.fill();
    // left face (darkest)
    ctx.fillStyle = `rgb(${faceColor(base, 0.6).join(',')})`;
    ctx.beginPath(); ctx.moveTo(topL.x, topL.y); ctx.lineTo(botL.x, botL.y); ctx.lineTo(bot.x, bot.y); ctx.lineTo(top.x, top.y); ctx.closePath(); ctx.fill();
    if (emissive) {
      ctx.shadowColor = '#FFC857'; ctx.shadowBlur = 6;
      ctx.fillStyle = '#FFC857';
      ctx.beginPath(); ctx.arc((top.x + bot.x) / 2, (top.y + bot.y) / 2, 1.4, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  function draw(ctx, w, h, t) {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#0B0E1F'); sky.addColorStop(1, '#1F2A4D');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    towers.forEach((tw) => {
      for (let z = 0; z < tw.height; z++) drawCube(ctx, tw.gx, tw.gy, z, tw.hue);
    });
    // height fog
    const fog = ctx.createLinearGradient(0, H * 0.5, 0, H);
    fog.addColorStop(0, 'rgba(11,14,31,0)'); fog.addColorStop(1, 'rgba(11,14,31,0.55)');
    ctx.fillStyle = fog; ctx.fillRect(0, 0, W, H);
    // ship, small isometric-ish delta descending the canyon
    const sx = W * 0.5, sy = H * 0.28 + Math.sin(t * 0.0006) * 4;
    ctx.fillStyle = '#FF4FA3'; ctx.shadowColor = '#FF4FA3'; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.moveTo(sx, sy - 5); ctx.lineTo(sx - 5, sy + 4); ctx.lineTo(sx + 5, sy + 4); ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;
  }

  MDLib.registerStyle({
    id: '12-voxel-isometric', name: 'Voxel Isometric',
    refs: [{ label: 'Cloudpunk', url: 'https://store.steampowered.com/app/746850/Cloudpunk/' }],
    palette: ['#0B0E1F', '#1F2A4D', '#FF4FA3', '#FFC857', '#3CF0FF'],
    res: [W, H], titleFont: '"JetBrains Mono", monospace',
    note: 'Isometric voxel towers built face-by-face with a painter\'s algorithm, scattered emissive windows, height fog — a toy-like neon canyon.',
    draw,
  });
})();
