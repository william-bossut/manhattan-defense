/* Hand-authored NYC landmarks, not procedural rectangles — meant to be
 * genuinely recognizable and reusable in the real game's background layer.
 * Each draw*() takes (ctx, x, baseY, opts) where x is the left edge and
 * baseY is the ground/horizon line; opts = { width, height, colors, seed }. */
(function (global) {
  'use strict';

  function windowGrid(ctx, x, y, w, h, cols, rows, lit, dim, seed) {
    const cw = w / (cols + 1), rh = h / (rows + 1);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = (r * 13 + c * 7 + seed) | 0;
        ctx.fillStyle = idx % 3 === 0 ? dim : lit;
        ctx.fillRect(x + cw * (c + 0.6), y + rh * (r + 0.6), Math.max(1, cw * 0.45), Math.max(1, rh * 0.4));
      }
    }
  }

  // --- Empire State Building: setback tiers + mooring-mast antenna, the
  // classic tip-light moment (perfect place for the brand's red accent). ---
  function drawEmpireState(ctx, x, baseY, opts) {
    const w = opts.width, H = opts.height, c = opts.colors, seed = opts.seed || 1;
    const tiers = [
      { wf: 1.00, hf: 0.30 }, { wf: 0.86, hf: 0.13 }, { wf: 0.70, hf: 0.11 },
      { wf: 0.52, hf: 0.13 }, { wf: 0.32, hf: 0.10 }, { wf: 0.16, hf: 0.10 },
    ];
    let curY = baseY, cx = x + w / 2;
    tiers.forEach((tier, i) => {
      const tw = w * tier.wf, th = H * tier.hf, ty = curY - th;
      ctx.fillStyle = c.body;
      ctx.fillRect(cx - tw / 2, ty, tw, th);
      ctx.strokeStyle = c.edge; ctx.lineWidth = 1; ctx.strokeRect(cx - tw / 2 + 0.5, ty + 0.5, tw - 1, th - 1);
      windowGrid(ctx, cx - tw / 2, ty, tw, th, Math.max(2, Math.round(tw / 7)), Math.max(2, Math.round(th / 7)), c.window, c.dim, seed + i * 17);
      curY = ty;
    });
    ctx.strokeStyle = c.accent; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(cx, curY); ctx.lineTo(cx, curY - H * 0.10); ctx.stroke();
    ctx.fillStyle = c.accent; ctx.shadowColor = c.accent; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.arc(cx, curY - H * 0.10, 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    return { top: curY - H * 0.10, cx };
  }

  // --- Chrysler Building: terraced art-deco crown with sunburst triangle
  // windows, narrowing to a needle spire. ---
  function drawChrysler(ctx, x, baseY, opts) {
    const w = opts.width, H = opts.height, c = opts.colors, seed = opts.seed || 1;
    const bodyH = H * 0.58, crownH = H * 0.30, spireH = H * 0.12;
    ctx.fillStyle = c.body; ctx.fillRect(x, baseY - bodyH, w, bodyH);
    ctx.strokeStyle = c.edge; ctx.strokeRect(x + 0.5, baseY - bodyH + 0.5, w - 1, bodyH - 1);
    windowGrid(ctx, x, baseY - bodyH, w, bodyH, Math.max(2, Math.round(w / 7)), Math.max(2, Math.round(bodyH / 8)), c.window, c.dim, seed);
    let curY = baseY - bodyH;
    const steps = 5;
    for (let i = 0; i < steps; i++) {
      const stepW = w * (1 - 0.15 * i), stepH = crownH / steps;
      const sx = x + (w - stepW) / 2;
      ctx.fillStyle = c.crown;
      ctx.beginPath();
      ctx.moveTo(sx, curY); ctx.lineTo(sx + stepW, curY);
      ctx.lineTo(sx + stepW * 0.82, curY - stepH); ctx.lineTo(sx + stepW * 0.18, curY - stepH);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = c.edge; ctx.lineWidth = 0.75; ctx.stroke();
      ctx.fillStyle = c.window;
      const tri = 3;
      for (let k = 0; k < tri; k++) {
        const tx = sx + stepW * 0.28 + (stepW * 0.44) * (k / Math.max(1, tri - 1));
        ctx.beginPath(); ctx.moveTo(tx, curY - 2); ctx.lineTo(tx - 2.5, curY - stepH + 2); ctx.lineTo(tx + 2.5, curY - stepH + 2); ctx.closePath(); ctx.fill();
      }
      curY -= stepH;
    }
    ctx.fillStyle = c.crown;
    ctx.beginPath(); ctx.moveTo(x + w * 0.5 - 1.5, curY); ctx.lineTo(x + w * 0.5 + 1.5, curY); ctx.lineTo(x + w * 0.5, curY - spireH); ctx.closePath(); ctx.fill();
    // tip beacon (aviation warning light — another natural red-accent spot)
    ctx.fillStyle = c.accent; ctx.shadowColor = c.accent; ctx.shadowBlur = 5;
    ctx.beginPath(); ctx.arc(x + w * 0.5, curY - spireH, 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    return { top: curY - spireH, cx: x + w * 0.5 };
  }

  // --- One World Trade Center: tapering glass obelisk + thin antenna spire. --
  function drawOneWTC(ctx, x, baseY, opts) {
    const w = opts.width, H = opts.height, c = opts.colors, seed = opts.seed || 1;
    const bodyH = H * 0.88, spireH = H * 0.16;
    ctx.fillStyle = c.body;
    ctx.beginPath();
    ctx.moveTo(x, baseY); ctx.lineTo(x + w * 0.08, baseY - bodyH * 0.2);
    ctx.lineTo(x + w * 0.5, baseY - bodyH); ctx.lineTo(x + w * 0.92, baseY - bodyH * 0.2);
    ctx.lineTo(x + w, baseY); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = c.edge; ctx.lineWidth = 1; ctx.stroke();
    // window rows following the taper
    const rows = Math.max(3, Math.round(bodyH / 10));
    for (let r = 0; r < rows; r++) {
      const rf = r / rows;
      const rowY = baseY - bodyH * rf;
      const rowHalfW = (w / 2) * (1 - rf * 0.42);
      const cols = Math.max(2, Math.round((rowHalfW * 2) / 8));
      for (let cIdx = 0; cIdx < cols; cIdx++) {
        const idx = (r * 13 + cIdx * 7 + seed) | 0;
        ctx.fillStyle = idx % 3 === 0 ? c.dim : c.window;
        const cx0 = x + w / 2 - rowHalfW + (rowHalfW * 2 * (cIdx + 0.5)) / cols;
        ctx.fillRect(cx0 - 1, rowY - bodyH / rows * 0.6, 1.6, bodyH / rows * 0.35);
      }
    }
    ctx.strokeStyle = c.accent; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.moveTo(x + w * 0.5, baseY - bodyH); ctx.lineTo(x + w * 0.5, baseY - bodyH - spireH); ctx.stroke();
    ctx.fillStyle = c.accent; ctx.shadowColor = c.accent; ctx.shadowBlur = 4;
    ctx.beginPath(); ctx.arc(x + w * 0.5, baseY - bodyH - spireH, 1, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    return { top: baseY - bodyH - spireH, cx: x + w * 0.5 };
  }

  // --- Flatiron Building: narrow wedge with its famous pointed prow. --------
  function drawFlatiron(ctx, x, baseY, opts) {
    const w = opts.width, H = opts.height, c = opts.colors, seed = opts.seed || 1;
    ctx.fillStyle = c.body;
    ctx.beginPath();
    ctx.moveTo(x, baseY); ctx.lineTo(x, baseY - H);
    ctx.lineTo(x + w * 0.32, baseY - H - 5); ctx.lineTo(x + w, baseY - H * 0.95);
    ctx.lineTo(x + w, baseY); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = c.edge; ctx.lineWidth = 1; ctx.stroke();
    windowGrid(ctx, x, baseY - H, w, H, Math.max(2, Math.round(w / 5)), Math.max(3, Math.round(H / 7)), c.window, c.dim, seed);
    // cornice line near the top
    ctx.strokeStyle = c.edge; ctx.beginPath(); ctx.moveTo(x, baseY - H * 0.92); ctx.lineTo(x + w, baseY - H * 0.90); ctx.stroke();
    return { top: baseY - H - 5, cx: x + w * 0.4 };
  }

  // --- Brooklyn Bridge: twin Gothic-arch towers + sagging cables, drawn as
  // the extreme foreground silhouette (the classic postcard framing). ------
  function drawBrooklynBridge(ctx, W, baseY, opts) {
    const c = opts.colors, towerH = opts.height, towerW = opts.towerWidth || W * 0.055;
    const t1x = W * 0.5 - opts.gap / 2, t2x = W * 0.5 + opts.gap / 2;
    const topY = baseY - towerH, archTopY = baseY - towerH * 0.62;

    function tower(tx) {
      ctx.fillStyle = c.silhouette;
      ctx.fillRect(tx - towerW / 2, topY, towerW, towerH);
      ctx.globalCompositeOperation = 'destination-out';
      const archW = towerW * 0.30;
      [-1, 1].forEach((side) => {
        const ax = tx + side * towerW * 0.24;
        ctx.beginPath();
        ctx.moveTo(ax - archW / 2, baseY);
        ctx.lineTo(ax - archW / 2, archTopY + towerH * 0.18);
        ctx.quadraticCurveTo(ax, archTopY, ax + archW / 2, archTopY + towerH * 0.18);
        ctx.lineTo(ax + archW / 2, baseY);
        ctx.closePath(); ctx.fill();
      });
      ctx.globalCompositeOperation = 'source-over';
    }
    tower(t1x); tower(t2x);

    const deckY = baseY - towerH * 0.14;
    ctx.strokeStyle = c.silhouette; ctx.lineWidth = 1.3;
    function cable(x0, y0, x1, y1, sagY) {
      ctx.beginPath(); ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo((x0 + x1) / 2, sagY, x1, y1);
      ctx.stroke();
    }
    const towerCableY = topY + towerH * 0.06;
    cable(t1x, towerCableY, t2x, towerCableY, deckY + 6);
    cable(0, deckY, t1x, towerCableY, deckY - towerH * 0.02);
    cable(t2x, towerCableY, W, deckY, deckY - towerH * 0.02);
    // suspender verticals (sparse, just enough to read as cables)
    ctx.lineWidth = 0.6;
    for (let sx = towerW; sx < W - towerW; sx += 14) {
      const span = sx < t1x ? [0, deckY, t1x, towerCableY, deckY - towerH * 0.02]
        : sx < t2x ? [t1x, towerCableY, t2x, towerCableY, deckY + 6]
        : [t2x, towerCableY, W, deckY, deckY - towerH * 0.02];
      const tt = (sx - span[0]) / (span[2] - span[0]);
      const cy = (1 - tt) * (1 - tt) * span[1] + 2 * (1 - tt) * tt * span[4] + tt * tt * span[3];
      ctx.beginPath(); ctx.moveTo(sx, deckY); ctx.lineTo(sx, cy); ctx.stroke();
    }
    ctx.fillStyle = c.silhouette; ctx.fillRect(0, deckY, W, 3);
  }

  // --- Small rooftop water tower — classic NYC texture, scattered on filler
  // buildings so the skyline reads as authentically NY, not generic. --------
  function drawWaterTower(ctx, x, roofY, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x - 1, roofY - 5, 1, 5); ctx.fillRect(x + 3, roofY - 5, 1, 5);
    ctx.fillRect(x - 4, roofY - 12, 8, 7);
    ctx.beginPath(); ctx.moveTo(x - 5, roofY - 12); ctx.lineTo(x + 5, roofY - 12); ctx.lineTo(x, roofY - 17); ctx.closePath(); ctx.fill();
  }

  // --- Full composition: filler buildings + the 4 landmarks + bridge in the
  // foreground. Returns nothing; draws directly. Reusable by any style. ----
  function drawSkyline(ctx, W, horizon, t, opts) {
    opts = opts || {};
    const c = opts.colors || {
      body: '#0E1330', edge: '#1B2350', crown: '#C7CBD8', window: '#FF8A3D', dim: '#1A2040',
      accent: '#D81F26', fillerBody: '#0A0E24', silhouette: '#03040A',
    };
    const rng = MDLib.rng(opts.seed || 55);
    // filler buildings behind/between the landmarks (dimmer, denser, not crude)
    let x = 0;
    const fillers = [];
    while (x < W) {
      const w = 14 + rng() * 22, h = 30 + rng() * 90;
      fillers.push({ x, w, h, seed: rng() * 999, water: rng() < 0.22 });
      x += w + 1 + rng() * 3;
    }
    fillers.forEach((b) => {
      const y = horizon - b.h;
      ctx.fillStyle = c.fillerBody; ctx.fillRect(b.x, y, b.w, b.h);
      windowGrid(ctx, b.x, y, b.w, b.h, Math.max(2, Math.round(b.w / 7)), Math.max(3, Math.round(b.h / 9)), c.window, c.dim, b.seed);
      if (b.water) drawWaterTower(ctx, b.x + b.w * 0.5, y, '#12162A');
    });
    // landmarks, hand-placed so they read as focal points at recognizable relative scale
    drawFlatiron(ctx, W * 0.06, horizon, { width: W * 0.07, height: horizon * 0.42, colors: c, seed: 11 });
    drawChrysler(ctx, W * 0.20, horizon, { width: W * 0.10, height: horizon * 0.72, colors: c, seed: 22 });
    drawEmpireState(ctx, W * 0.42, horizon, { width: W * 0.12, height: horizon * 0.92, colors: c, seed: 33 });
    drawOneWTC(ctx, W * 0.68, horizon, { width: W * 0.11, height: horizon * 0.80, colors: c, seed: 44 });
    // Brooklyn Bridge in the extreme foreground, larger and fully silhouetted
    drawBrooklynBridge(ctx, W, horizon + horizon * 0.02, {
      height: horizon * 0.34, gap: W * 0.42, colors: { silhouette: c.silhouette },
    });
  }

  global.MDLandmarks = {
    drawEmpireState, drawChrysler, drawOneWTC, drawFlatiron, drawBrooklynBridge, drawWaterTower, drawSkyline, windowGrid,
  };
})(window);
