/* Round 5 skyline — rebuilt to match the reference art William provided
 * (banded night sky, bold dark outlines on every silhouette, dense tall
 * red-lit window columns, a real hero tower with setbacks, a suspension
 * bridge in front, a foreground treeline). Dark blue night, not sunset.
 * Exposes MDSkyline2.draw(ctx, W, H, t, opts) — a static composition with
 * a little ambient motion (twinkle, cloud drift, blinking beacons). */
(function (global) {
  'use strict';

  const INK = '#04050D'; // near-black outline used on every silhouette

  function rngRange(rng, a, b) { return a + rng() * (b - a); }

  // Tall window columns with mullion gaps — the main texture, replacing
  // scattered dots. `lit` is the accent color (red); a fraction stay dim.
  function windowColumns(ctx, x, y, w, h, colW, rowH, lit, dim, seed, litRatio) {
    litRatio = litRatio == null ? 0.55 : litRatio;
    const cols = Math.max(1, Math.floor(w / colW));
    const rows = Math.max(1, Math.floor(h / rowH));
    const padX = (w - cols * colW) / 2;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = (r * 131 + c * 17 + seed) | 0;
        const hash = Math.abs(Math.sin(idx * 12.9898) * 43758.5453) % 1;
        ctx.fillStyle = hash < litRatio ? lit : dim;
        ctx.fillRect(x + padX + c * colW + 0.6, y + r * rowH + 0.6, colW - 1.2, rowH - 1.4);
      }
    }
  }

  function outlinedRect(ctx, x, y, w, h, fill) {
    ctx.fillStyle = INK;
    ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);
  }

  // --- Hero tower: Empire-State-like setback tiers + mooring mast ----------
  // Fewer, bolder tiers than a real setback (4, not 6) so they still read
  // clearly at pixel-art resolution, and a body color distinct from the
  // surrounding near-layer buildings so it doesn't blend into the skyline.
  function drawHeroTower(ctx, x, baseY, w, totalH, opts) {
    const tiers = [
      { wf: 1.00, hf: 0.42 }, { wf: 0.74, hf: 0.20 },
      { wf: 0.50, hf: 0.20 }, { wf: 0.26, hf: 0.18 },
    ];
    let curY = baseY, cx = x + w / 2;
    tiers.forEach((tier, i) => {
      const tw = Math.max(6, w * tier.wf), th = totalH * tier.hf, ty = curY - th;
      outlinedRect(ctx, cx - tw / 2, ty, tw, th, opts.body);
      windowColumns(ctx, cx - tw / 2 + 1, ty + 1, tw - 2, th - 2, opts.colW, opts.rowH, opts.lit, opts.dim, opts.seed + i * 31, opts.litRatio);
      // a visible ledge/cornice line at each setback so the steps read
      ctx.fillStyle = INK; ctx.fillRect(cx - tw / 2 - 1, ty, tw + 2, 1);
      curY = ty;
    });
    ctx.fillStyle = INK; ctx.fillRect(cx - 1, curY - totalH * 0.13, 2, totalH * 0.13);
    ctx.fillStyle = opts.accent; ctx.shadowColor = opts.accent; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.arc(cx, curY - totalH * 0.13, 2, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    return curY - totalH * 0.13;
  }

  // A simpler flanking tower with a pointed cap (Chrysler-lite) or a flat
  // roof + antenna, for silhouette variety next to the hero tower — kept
  // shorter than the hero and with a smaller cap so it doesn't upstage it.
  function drawFlankTower(ctx, x, baseY, w, h, opts, capped) {
    outlinedRect(ctx, x, baseY - h, w, h, opts.body);
    windowColumns(ctx, x + 1, baseY - h + 1, w - 2, h - 2, opts.colW, opts.rowH, opts.lit, opts.dim, opts.seed, opts.litRatio);
    if (capped) {
      const capH = w * 0.32;
      ctx.fillStyle = INK;
      ctx.beginPath(); ctx.moveTo(x - 1, baseY - h); ctx.lineTo(x + w / 2, baseY - h - capH); ctx.lineTo(x + w + 1, baseY - h); ctx.closePath(); ctx.fill();
      ctx.fillStyle = opts.cap || '#7A85AE';
      ctx.beginPath(); ctx.moveTo(x + 1, baseY - h); ctx.lineTo(x + w / 2, baseY - h - capH + 1.5); ctx.lineTo(x + w - 1, baseY - h); ctx.closePath(); ctx.fill();
      ctx.fillStyle = opts.accent; ctx.shadowColor = opts.accent; ctx.shadowBlur = 3;
      ctx.beginPath(); ctx.arc(x + w / 2, baseY - h - capH, 1, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = INK; ctx.fillRect(x + w / 2 - 0.5, baseY - h - w * 0.35, 1, w * 0.35);
      if (Math.sin(opts.t * 0.003 + x) > 0.4) { ctx.fillStyle = opts.accent; ctx.fillRect(x + w / 2 - 0.5, baseY - h - w * 0.35, 1, 1); }
    }
  }

  // --- Suspension bridge: triangular pylons + straight converging cables ---
  function drawBridge(ctx, W, deckY, opts) {
    const pylonH = opts.height, gap = opts.gap, cx = W * 0.5;
    const p1 = cx - gap / 2, p2 = cx + gap / 2;
    [p1, p2].forEach((px) => {
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.moveTo(px - opts.pylonW / 2, deckY); ctx.lineTo(px - 1.5, deckY - pylonH);
      ctx.lineTo(px + 1.5, deckY - pylonH); ctx.lineTo(px + opts.pylonW / 2, deckY);
      ctx.closePath(); ctx.fill();
      // cross braces
      ctx.strokeStyle = INK; ctx.lineWidth = 1;
      for (let f = 0.3; f < 1; f += 0.3) {
        ctx.beginPath();
        ctx.moveTo(px - opts.pylonW / 2 * (1 - f), deckY - pylonH * f);
        ctx.lineTo(px + opts.pylonW / 2 * (1 - f), deckY - pylonH * f);
        ctx.stroke();
      }
    });
    ctx.strokeStyle = INK; ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 5) {
      let cableY;
      if (x < p1) cableY = deckY - pylonH * 0.92 * (x / p1);
      else if (x > p2) cableY = deckY - pylonH * 0.92 * ((W - x) / (W - p2));
      else {
        const tt = (x - p1) / (p2 - p1);
        cableY = deckY - pylonH * (0.92 - 0.7 * Math.sin(tt * Math.PI));
      }
      ctx.beginPath(); ctx.moveTo(x, deckY); ctx.lineTo(x, cableY); ctx.stroke();
    }
    ctx.fillStyle = INK; ctx.fillRect(0, deckY, W, 2);
  }

  function drawTreeline(ctx, W, y, seed) {
    const rng = MDLib.rng(seed);
    ctx.fillStyle = INK;
    let x = 0;
    while (x < W) {
      const w = 6 + rng() * 8, h = 3 + rng() * 4;
      ctx.beginPath(); ctx.ellipse(x + w / 2, y, w / 2, h, 0, 0, Math.PI * 2); ctx.fill();
      x += w * 0.7;
    }
    ctx.fillRect(0, y, W, 6);
  }

  function drawClouds(ctx, W, y0, y1, t, seed, color) {
    const rng = MDLib.rng(seed);
    ctx.fillStyle = color;
    for (let i = 0; i < 7; i++) {
      const baseX = ((rng() * (W + 160) - 80 + t * 0.006 * (0.4 + i * 0.05)) % (W + 160)) - 80;
      const cy = y0 + rng() * (y1 - y0);
      ctx.globalAlpha = 0.35 + rng() * 0.25;
      const w = 20 + rng() * 26;
      ctx.fillRect(baseX, cy, w, 3);
      ctx.fillRect(baseX + w * 0.2, cy - 2, w * 0.6, 2);
      ctx.fillRect(baseX + w * 0.15, cy + 3, w * 0.7, 2);
    }
    ctx.globalAlpha = 1;
  }

  function draw(ctx, W, H, t, opts) {
    opts = opts || {};
    const horizon = H * (opts.horizonFrac || 0.66);
    const accent = opts.accent || '#D81F26';
    const lit = opts.lit || accent;
    const dim = opts.dim || '#161B33';

    // banded night sky (no smooth gradient — flat discrete bands)
    const bands = opts.skyBands || ['#03040B', '#050817', '#080D22', '#0C132E', '#121A3E', '#182150'];
    const bandH = horizon / bands.length;
    bands.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(0, i * bandH, W, bandH + 1); });

    // moon with soft banded glow
    const mx = W * (opts.moonX || 0.78), my = horizon * 0.22;
    for (let ring = 4; ring >= 1; ring--) {
      ctx.globalAlpha = 0.06 * (5 - ring);
      ctx.fillStyle = opts.moonColor || '#DCE8FF';
      ctx.beginPath(); ctx.arc(mx, my, ring * 7, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = opts.moonColor || '#DCE8FF';
    ctx.beginPath(); ctx.arc(mx, my, 6, 0, Math.PI * 2); ctx.fill();

    // stars
    const rngS = MDLib.rng(opts.seed || 40);
    ctx.fillStyle = '#DCE8FF';
    for (let i = 0; i < 60; i++) {
      const sx = rngS() * W, sy = rngS() * horizon * 0.85;
      ctx.globalAlpha = 0.3 + 0.5 * Math.abs(Math.sin(t * 0.001 + i));
      ctx.fillRect(sx, sy, 1, 1);
    }
    ctx.globalAlpha = 1;

    drawClouds(ctx, W, horizon * 0.15, horizon * 0.55, t, (opts.seed || 40) + 5, opts.cloudColor || 'rgba(24,33,80,0.8)');

    // --- far layer: hazy silhouette, no windows ---
    const rngFar = MDLib.rng((opts.seed || 40) + 1);
    let x = 0;
    ctx.fillStyle = opts.farColor || '#141B3E';
    while (x < W) {
      const w = 14 + rngFar() * 16, h = 20 + rngFar() * 50;
      ctx.fillRect(x, horizon - h, w, h);
      x += w + 1;
    }

    // --- mid layer: simple towers, sparse red windows, some roof detail ---
    const rngMid = MDLib.rng((opts.seed || 40) + 2);
    x = -6;
    const midColor = opts.midColor || '#0C1230';
    while (x < W + 6) {
      const w = 16 + rngMid() * 18, h = 34 + rngMid() * 60;
      outlinedRect(ctx, x, horizon - h, w, h, midColor);
      windowColumns(ctx, x + 1, horizon - h + 1, w - 2, h - 2, 4, 6, lit, dim, (rngMid() * 999) | 0, 0.28);
      if (rngMid() < 0.3) { ctx.fillStyle = INK; ctx.fillRect(x + w * 0.5, horizon - h - 5, 1, 5); }
      x += w + 2;
    }

    // --- near layer: the featured buildings ---
    const seed = opts.seed || 40;
    const heroX = W * (opts.heroX || 0.46), heroW = W * (opts.heroW || 0.14);
    const heroColor = opts.heroColor || '#242C5C'; // lighter than nearColor so it doesn't blend in
    drawHeroTower(ctx, heroX, horizon, heroW, horizon * (opts.heroHf || 0.78), {
      body: heroColor, colW: 3.6, rowH: 5.4, lit, dim, accent, seed: seed + 10, litRatio: 0.6,
    });
    drawFlankTower(ctx, heroX - heroW * 1.7, horizon, heroW * 0.85, horizon * 0.4, {
      body: opts.nearColor || '#0A0F26', colW: 3.6, rowH: 5.6, lit, dim, seed: seed + 40, litRatio: 0.5, accent, t,
    }, true);
    drawFlankTower(ctx, heroX + heroW * 1.05, horizon, heroW * 0.7, horizon * 0.5, {
      body: opts.nearColor || '#0A0F26', colW: 3.6, rowH: 5.6, lit, dim, seed: seed + 55, litRatio: 0.5, accent, t,
    }, false);
    // a couple more plain near buildings to fill the frame edges
    [0.06, 0.18, 0.86].forEach((fx, i) => {
      const bw = W * (0.08 + (i % 2) * 0.02), bh = horizon * (0.32 + rngMid() * 0.16);
      outlinedRect(ctx, W * fx, horizon - bh, bw, bh, opts.nearColor || '#0A0F26');
      windowColumns(ctx, W * fx + 1, horizon - bh + 1, bw - 2, bh - 2, 3.6, 5.6, lit, dim, seed + 70 + i * 9, 0.45);
    });

    // bridge in the extreme foreground
    drawBridge(ctx, W, horizon + horizon * 0.02, { height: horizon * 0.3, gap: W * 0.34, pylonW: 8 });

    // water reflection strip
    ctx.fillStyle = 'rgba(4,6,16,0.55)';
    ctx.fillRect(0, horizon + horizon * 0.02 + 2, W, H - (horizon + horizon * 0.02 + 2));
    ctx.fillStyle = `rgba(${opts.reflectTint || '216,31,38'},0.10)`;
    ctx.fillRect(0, horizon + horizon * 0.02 + 2, W, 1.5);

    drawTreeline(ctx, W, H - 3, seed + 99);
  }

  // Soft halo so the dark ship hull doesn't disappear against a dark sky.
  function shipHalo(ctx, x, y, r, color) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  global.MDSkyline2 = { draw, windowColumns, outlinedRect, shipHalo };
})(window);
