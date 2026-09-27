(function () {
  const rng = MDLib.rng(505);
  const COLS = 70, ROWS = 34;
  const CELL = 6; // logical px per char cell before CSS scaling
  const W = COLS * CELL, H = ROWS * CELL;
  const DENSITY = ' .:-=+*#%█▓▒░';
  const grid = [];
  for (let r = 0; r < ROWS; r++) {
    const row = [];
    for (let c = 0; c < COLS; c++) row.push(' ');
    grid.push(row);
  }
  // buildings as vertical bands of density chars
  let c = 2;
  const cols = [];
  while (c < COLS - 2) {
    const w = 3 + Math.floor(rng() * 5);
    const h = 6 + Math.floor(rng() * (ROWS - 12));
    cols.push({ c, w, h });
    c += w + 1;
  }
  cols.forEach((b) => {
    for (let r = ROWS - b.h; r < ROWS - 4; r++) {
      for (let cc = b.c; cc < b.c + b.w; cc++) {
        const edge = cc === b.c || cc === b.c + b.w - 1;
        grid[r][cc] = edge ? '|' : (rng() < 0.4 ? '▓' : (rng() < 0.5 ? '▒' : '░'));
      }
    }
    grid[ROWS - b.h - 1][b.c] = '/';
    grid[ROWS - b.h - 1][b.c + b.w - 1] = '\\';
    for (let cc = b.c + 1; cc < b.c + b.w - 1; cc++) grid[ROWS - b.h - 1][cc] = '_';
  });
  // stars
  for (let i = 0; i < 30; i++) {
    const r = Math.floor(rng() * ROWS * 0.4), cc = Math.floor(rng() * COLS);
    grid[r][cc] = rng() < 0.5 ? '.' : '*';
  }
  const shipCol = Math.floor(COLS * 0.5), shipRow = Math.floor(ROWS * 0.45);

  function draw(ctx, w, h, t) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    ctx.font = `${CELL}px "JetBrains Mono", monospace`;
    ctx.textBaseline = 'top';
    for (let r = 0; r < ROWS; r++) {
      let line = '';
      for (let cc = 0; cc < COLS; cc++) line += grid[r][cc];
      ctx.fillStyle = '#D8D8D8';
      ctx.fillText(line, 0, r * CELL);
    }
    // ship glyph, gently animated trail
    const trail = ['~', '-', '='][Math.floor(t * 0.004) % 3];
    ctx.fillStyle = '#4DE1FF';
    ctx.fillText('>', shipCol * CELL, shipRow * CELL);
    ctx.fillStyle = '#FFB000';
    ctx.fillText(trail, (shipCol - 1) * CELL, shipRow * CELL);
    // HUD line, all text
    ctx.fillStyle = '#D8D8D8';
    ctx.fillText('SCORE:004200  ALT:0042  [PLAY]', 2 * CELL, (ROWS - 2) * CELL);
  }

  MDLib.registerStyle({
    id: '05-ascii', name: 'ASCII / Text-Mode',
    refs: [{ label: 'Stone Story RPG', url: 'https://store.steampowered.com/app/603390/Stone_Story_RPG/' }],
    palette: ['#000000', '#D8D8D8', '#4DE1FF', '#FFB000'],
    res: [W, H], titleFont: '"JetBrains Mono", monospace',
    note: 'The entire city, ship and HUD are built from monospace characters (█▓▒░|/\\_) — everything, including the UI, is text.',
    draw,
  });
})();
