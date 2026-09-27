(function () {
  const rng = MDLib.rng(909);
  const TILE = 8;
  const COLS = 20, ROWS = 18; // 160x144
  const W = COLS * TILE, H = ROWS * TILE;
  const C0 = '#0B0B0B', C1 = '#3A3A3A', C2 = '#BDBDBD', C3 = '#FFFFFF';
  const litFloor = ROWS - 4; // only the current floor is lit; rest is void
  const map = [];
  for (let r = 0; r < ROWS; r++) {
    const row = [];
    for (let c = 0; c < COLS; c++) row.push(0);
    map.push(row);
  }
  // repeating window tile columns as the "city" tilemap, only near the lit floor
  for (let c = 2; c < COLS - 2; c += 2) {
    const h = 3 + Math.floor(rng() * 8);
    for (let k = 0; k < h; k++) {
      const r = litFloor - k;
      if (r < 1) break;
      map[r][c] = (k % 2 === 0) ? 2 : 3; // wall vs window tile code
    }
  }

  function draw(ctx, w, h, t) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = C0; ctx.fillRect(0, 0, W, H);
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const v = map[r][c];
        if (v === 0) continue;
        const onFloor = r >= litFloor - 10; // only light near the floor band
        const lit = onFloor;
        ctx.fillStyle = v === 3 ? (lit ? C3 : C1) : (lit ? C2 : C1);
        ctx.fillRect(c * TILE, r * TILE, TILE - 1, TILE - 1);
      }
    }
    // lit floor strip
    ctx.fillStyle = C2;
    ctx.fillRect(0, litFloor * TILE, W, TILE);
    // ship, one tile, blinking
    const shipC = Math.floor(COLS * 0.5);
    const shipR = litFloor - 5;
    ctx.fillStyle = (Math.floor(t * 0.003) % 2 === 0) ? C3 : C2;
    ctx.fillRect(shipC * TILE, shipR * TILE, TILE - 1, TILE - 1);
    // HUD strip at the very bottom, single row, bitmap-ish font
    ctx.fillStyle = C1; ctx.fillRect(0, H - TILE, W, TILE);
    ctx.fillStyle = C3; ctx.font = '6px "JetBrains Mono", monospace';
    ctx.fillText('FLOOR 07', 4, H - 2);
  }

  MDLib.registerStyle({
    id: '09-gameboy-grid', name: 'Game Boy Grid',
    refs: [{ label: 'Void Stranger', url: 'https://store.steampowered.com/app/2121980/Void_Stranger/' }],
    palette: [C0, C1, C2, C3],
    res: [W, H], titleFont: '"Press Start 2P", monospace',
    note: 'Strict 16px tile grid, 4 greys, most of the frame pure black — only the current "floor" is lit. Quiet and severe, built from grid rhythm and empty space.',
    draw,
  });
})();
