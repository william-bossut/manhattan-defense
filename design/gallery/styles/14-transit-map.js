(function () {
  const W = 384, H = 216;
  const PAPER = '#F4F1EA', INK = '#222222';
  const LINES = ['#EE352E', '#0039A6', '#FCCC0A', '#00933C'];
  const stations = [
    { x: 40, y: 190, label: 'STREET' },
    { x: 120, y: 150, label: 'TOWERS' },
    { x: 190, y: 100, label: 'ROOFTOPS' },
    { x: 270, y: 60, label: 'CLOUDS' },
    { x: 340, y: 24, label: 'ORBIT' },
  ];

  function draw(ctx, w, h, t) {
    ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
    // route: strict 45/90 segments between stations
    ctx.strokeStyle = LINES[0]; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(stations[0].x, stations[0].y);
    for (let i = 1; i < stations.length; i++) {
      const a = stations[i - 1], b = stations[i];
      const midX = a.x + (b.x - a.x) * 0.5;
      ctx.lineTo(midX, a.y);
      ctx.lineTo(midX, b.y);
      ctx.lineTo(b.x, b.y);
    }
    ctx.stroke();
    // a second decorative line (crossing service), different color
    ctx.strokeStyle = LINES[1]; ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(10, 30); ctx.lineTo(150, 30); ctx.lineTo(150, 130); ctx.lineTo(300, 130); ctx.lineTo(300, 190); ctx.lineTo(374, 190);
    ctx.stroke();
    // stations as circles with white fill + ink ring; interchange = double ring
    stations.forEach((s, i) => {
      ctx.fillStyle = PAPER; ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(s.x, s.y, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = INK; ctx.font = '10px Helvetica, Arial, sans-serif';
      ctx.save();
      ctx.translate(s.x + 12, s.y + 3);
      ctx.fillText(s.label, 0, 0);
      ctx.restore();
    });
    // the ship: a moving circle along the route, current progress
    const prog = 0.5 + 0.5 * Math.sin(t * 0.0004);
    const seg = MDLib.clamp(prog, 0, 0.999) * (stations.length - 1);
    const i0 = Math.floor(seg), f = seg - i0;
    const a = stations[i0], b = stations[Math.min(i0 + 1, stations.length - 1)];
    const px = MDLib.lerp(a.x, b.x, f), py = MDLib.lerp(a.y, b.y, f);
    ctx.fillStyle = LINES[2]; ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // legend
    ctx.fillStyle = INK; ctx.font = 'bold 12px Helvetica, Arial, sans-serif';
    ctx.fillText('THE ASCENT LINE', 12, 16);
  }

  MDLib.registerStyle({
    id: '14-transit-map', name: 'Transit Map',
    refs: [{ label: 'Mini Metro', url: 'https://store.steampowered.com/app/287980/Mini_Metro/' }],
    palette: [PAPER, INK, '#EE352E', '#0039A6', '#FCCC0A', '#00933C'],
    res: [W, H], titleFont: 'Helvetica, Arial, sans-serif',
    note: 'The whole climb reduced to a subway diagram: real MTA line colors, only 45°/90° turns, altitude zones as named stations. Reads as New York instantly.',
    draw,
  });
})();
