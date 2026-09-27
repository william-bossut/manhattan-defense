/* Round 6 skyline — two fixes on top of round 5:
 * 1. A slender, tall hero tower (the round-5 one was too short/wide and
 *    stepped too aggressively — reference has a mostly-uniform shaft, ONE
 *    subtle setback near the top, a small crown with pilaster lines, a
 *    thin mast). Windows are now a fine, dense grid, not wide bar-columns.
 * 2. Parallax: 3 building layers now drift horizontally at different
 *    speeds (the "perspective" from the other session's eboy/neon-noir/
 *    bytepath styles) instead of sitting fully static.
 * Also: a continuous dusk -> night color crossfade (warm gold windows at
 * dusk -> red windows at night, warm sky -> dark blue sky), looping, so
 * both states and the transition are visible without any UI. */
(function (global) {
  'use strict';

  const INK = '#04050D';

  function hexToRgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
    const n = parseInt(hex, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgbToHex(r, g, b) {
    const c = (v) => Math.round(MDLib.clamp(v, 0, 255)).toString(16).padStart(2, '0');
    return '#' + c(r) + c(g) + c(b);
  }
  function lerpColor(a, b, t) {
    const A = hexToRgb(a), B = hexToRgb(b);
    return rgbToHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
  }
  function lerpBands(bandsA, bandsB, t) { return bandsA.map((c, i) => lerpColor(c, bandsB[i], t)); }

  // Fine, dense window grid — small near-square cells, thin gaps. This is
  // the main texture fix versus round 5's wide bar-columns.
  function windowGrid(ctx, x, y, w, h, cell, lit, dim, seed, litRatio) {
    litRatio = litRatio == null ? 0.55 : litRatio;
    const cols = Math.max(1, Math.floor(w / cell));
    const rows = Math.max(1, Math.floor(h / cell));
    const padX = (w - cols * cell) / 2;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = (r * 131 + c * 17 + seed) | 0;
        const hash = Math.abs(Math.sin(idx * 12.9898) * 43758.5453) % 1;
        ctx.fillStyle = hash < litRatio ? lit : dim;
        ctx.fillRect(x + padX + c * cell + 0.5, y + r * cell + 0.5, cell - 1, cell - 1);
      }
    }
  }

  function outlinedRect(ctx, x, y, w, h, fill) {
    ctx.fillStyle = INK; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
    ctx.fillStyle = fill; ctx.fillRect(x, y, w, h);
  }

  // --- Hero tower: slender uniform shaft, one setback, pilasters, small
  // crown + thin mast. Caller should pass a narrow w (aim ~1:6 w:h). ------
  function drawHeroTower(ctx, x, baseY, w, totalH, opts) {
    const shaftH = totalH * 0.76, crownH = totalH * 0.13;
    const cx = x + w / 2;
    outlinedRect(ctx, x, baseY - shaftH, w, shaftH, opts.body);
    windowGrid(ctx, x + 1, baseY - shaftH + 1, w - 2, shaftH - 2, opts.cell, opts.lit, opts.dim, opts.seed, opts.litRatio);
    // pilasters (subtle vertical dividers, like the real building's bays)
    ctx.fillStyle = 'rgba(4,5,13,0.55)';
    for (let f = 1; f <= 2; f++) ctx.fillRect(x + (w * f) / 3 - 0.5, baseY - shaftH, 1, shaftH * 0.985);
    // one setback into a narrower crown
    const crownW = w * 0.62, crownY = baseY - shaftH - crownH;
    outlinedRect(ctx, cx - crownW / 2, crownY, crownW, crownH, opts.body);
    windowGrid(ctx, cx - crownW / 2 + 1, crownY + 1, crownW - 2, crownH - 2, opts.cell, opts.lit, opts.dim, opts.seed + 7, opts.litRatio * 0.75);
    // small pyramidal cap, proportionate (not oversized)
    const capW = crownW * 0.78, capH = totalH * 0.07;
    ctx.fillStyle = INK;
    ctx.beginPath(); ctx.moveTo(cx - capW / 2 - 1, crownY); ctx.lineTo(cx, crownY - capH); ctx.lineTo(cx + capW / 2 + 1, crownY); ctx.closePath(); ctx.fill();
    ctx.fillStyle = opts.cap;
    ctx.beginPath(); ctx.moveTo(cx - capW / 2 + 0.5, crownY); ctx.lineTo(cx, crownY - capH + 1); ctx.lineTo(cx + capW / 2 - 0.5, crownY); ctx.closePath(); ctx.fill();
    // thin mast + tip light
    const mastH = totalH * 0.08, mastTopY = crownY - capH - mastH;
    ctx.strokeStyle = INK; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.moveTo(cx, crownY - capH); ctx.lineTo(cx, mastTopY); ctx.stroke();
    ctx.fillStyle = opts.accent; ctx.shadowColor = opts.accent; ctx.shadowBlur = 5;
    ctx.beginPath(); ctx.arc(cx, mastTopY, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    return mastTopY;
  }

  // Slender flanking tower, small proportionate cap (or a plain antenna).
  function drawFlankTower(ctx, x, baseY, w, h, opts, capped) {
    outlinedRect(ctx, x, baseY - h, w, h, opts.body);
    windowGrid(ctx, x + 1, baseY - h + 1, w - 2, h - 2, opts.cell, opts.lit, opts.dim, opts.seed, opts.litRatio);
    if (capped) {
      const capH = w * 0.85;
      ctx.fillStyle = INK;
      ctx.beginPath(); ctx.moveTo(x - 1, baseY - h); ctx.lineTo(x + w / 2, baseY - h - capH); ctx.lineTo(x + w + 1, baseY - h); ctx.closePath(); ctx.fill();
      ctx.fillStyle = opts.cap;
      ctx.beginPath(); ctx.moveTo(x + 0.5, baseY - h); ctx.lineTo(x + w / 2, baseY - h - capH + 1); ctx.lineTo(x + w - 0.5, baseY - h); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x + w / 2, baseY - h - capH); ctx.lineTo(x + w / 2, baseY - h - capH - w * 0.45); ctx.stroke();
      ctx.fillStyle = opts.accent; ctx.shadowColor = opts.accent; ctx.shadowBlur = 3;
      ctx.beginPath(); ctx.arc(x + w / 2, baseY - h - capH - w * 0.45, 1, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = INK; ctx.fillRect(x + w / 2 - 0.5, baseY - h - w * 0.45, 1, w * 0.45);
      if (Math.sin(opts.t * 0.003 + x) > 0.4) { ctx.fillStyle = opts.accent; ctx.fillRect(x + w / 2 - 0.5, baseY - h - w * 0.45, 1, 1); }
    }
  }

  function drawBridge(ctx, W, deckY, opts) {
    const pylonH = opts.height, gap = opts.gap, cx = W * 0.5;
    const p1 = cx - gap / 2, p2 = cx + gap / 2;
    [p1, p2].forEach((px) => {
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.moveTo(px - opts.pylonW / 2, deckY); ctx.lineTo(px - 1.5, deckY - pylonH);
      ctx.lineTo(px + 1.5, deckY - pylonH); ctx.lineTo(px + opts.pylonW / 2, deckY);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = 1;
      for (let f = 0.3; f < 1; f += 0.3) {
        ctx.beginPath();
        ctx.moveTo(px - (opts.pylonW / 2) * (1 - f), deckY - pylonH * f);
        ctx.lineTo(px + (opts.pylonW / 2) * (1 - f), deckY - pylonH * f);
        ctx.stroke();
      }
    });
    ctx.strokeStyle = INK; ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 5) {
      let cableY;
      if (x < p1) cableY = deckY - pylonH * 0.9 * (x / p1);
      else if (x > p2) cableY = deckY - pylonH * 0.9 * ((W - x) / (W - p2));
      else { const tt = (x - p1) / (p2 - p1); cableY = deckY - pylonH * (0.9 - 0.68 * Math.sin(tt * Math.PI)); }
      ctx.beginPath(); ctx.moveTo(x, deckY); ctx.lineTo(x, cableY); ctx.stroke();
    }
    ctx.fillStyle = INK; ctx.fillRect(0, deckY, W, 2);
  }

  function drawTreeline(ctx, W, y, seed) {
    const rng = MDLib.rng(seed);
    ctx.fillStyle = INK;
    let x = 0;
    while (x < W) { const w = 6 + rng() * 8, h = 3 + rng() * 4; ctx.beginPath(); ctx.ellipse(x + w / 2, y, w / 2, h, 0, 0, Math.PI * 2); ctx.fill(); x += w * 0.7; }
    ctx.fillRect(0, y, W, 6);
  }

  // Parallax filler layer: buildings live on a wide virtual strip and pan
  // horizontally at their own speed, wrapping seamlessly.
  function makeLayer(seed, count, spanMul) {
    const rng = MDLib.rng(seed);
    const arr = [];
    let x = 0;
    const span = 999999; // placeholder, real span passed at draw time via W*spanMul
    while (arr.length < count) {
      arr.push({ xf: rng(), wf: 0.05 + rng() * 0.05, hf: 0.12 + rng() * 0.4, seed: (rng() * 999) | 0 });
    }
    return arr;
  }
  const farLayer = makeLayer(11, 14);
  const midLayer = makeLayer(22, 12);

  function drawParallaxLayer(ctx, layer, W, horizon, offsetPx, spanMul, opts) {
    const span = W * spanMul;
    layer.forEach((b) => {
      const w = b.wf * span, h = b.hf * horizon;
      let x = ((b.xf * span - offsetPx) % span + span) % span - (span - W) / 2;
      const y = horizon - h;
      if (opts.outline) outlinedRect(ctx, x, y, w, h, opts.color);
      else { ctx.fillStyle = opts.color; ctx.fillRect(x, y, w, h); }
      if (opts.windows) windowGrid(ctx, x + 1, y + 1, w - 2, h - 2, opts.cell, opts.lit, opts.dim, b.seed, opts.litRatio);
    });
  }

  function draw(ctx, W, H, t, opts) {
    opts = opts || {};
    const horizon = H * (opts.horizonFrac || 0.68);
    const seed = opts.seed || 40;

    // --- dusk <-> night crossfade, looping ---
    const cycleSpeed = opts.cycleSpeed != null ? opts.cycleSpeed : 0.00014;
    const climb = 0.5 + 0.5 * Math.sin(t * cycleSpeed - Math.PI / 2 + (opts.phaseOffset || 0)); // starts at 0 (dusk)
    const dusk = opts.dusk, night = opts.night;
    const skyBands = lerpBands(dusk.skyBands, night.skyBands, climb);
    const lit = lerpColor(dusk.lit, night.lit, climb);
    const dim = lerpColor(dusk.dim, night.dim, climb);
    const nearColor = lerpColor(dusk.nearColor, night.nearColor, climb);
    const midColor = lerpColor(dusk.midColor, night.midColor, climb);
    const farColor = lerpColor(dusk.farColor, night.farColor, climb);
    const heroColor = lerpColor(dusk.heroColor, night.heroColor, climb);
    const capColor = lerpColor(dusk.cap, night.cap, climb);
    const cloudColor = lerpColor(dusk.cloudColor, night.cloudColor, climb);
    const orbColor = lerpColor(dusk.orbColor, night.orbColor, climb);
    const accent = opts.accent || '#D81F26';

    const bandH = horizon / skyBands.length;
    skyBands.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(0, i * bandH, W, bandH + 1); });

    // sun -> moon: same disc, color/size/glow lerped, sinks slightly as it turns into the moon
    const orbX = W * (opts.orbX || 0.78);
    const orbY = horizon * MDLib.lerp(0.55, 0.18, climb);
    const orbR = MDLib.lerp(13, 6, climb);
    for (let ring = 4; ring >= 1; ring--) {
      ctx.globalAlpha = MDLib.lerp(0.10, 0.05, climb) * (5 - ring);
      ctx.fillStyle = orbColor;
      ctx.beginPath(); ctx.arc(orbX, orbY, ring * orbR * 0.55, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.fillStyle = orbColor;
    ctx.beginPath(); ctx.arc(orbX, orbY, orbR, 0, Math.PI * 2); ctx.fill();

    // stars fade in as it gets darker
    const rngS = MDLib.rng(seed);
    ctx.fillStyle = '#DCE8FF';
    for (let i = 0; i < 55; i++) {
      const sx = rngS() * W, sy = rngS() * horizon * 0.8;
      ctx.globalAlpha = climb * (0.3 + 0.5 * Math.abs(Math.sin(t * 0.001 + i)));
      ctx.fillRect(sx, sy, 1, 1);
    }
    ctx.globalAlpha = 1;

    // clouds, drifting
    ctx.fillStyle = cloudColor;
    const rngC = MDLib.rng(seed + 5);
    for (let i = 0; i < 7; i++) {
      const bx = ((rngC() * (W + 160) - 80 + t * 0.006 * (0.4 + i * 0.05)) % (W + 160)) - 80;
      const cy = horizon * 0.15 + rngC() * horizon * 0.4;
      ctx.globalAlpha = 0.3 + rngC() * 0.25;
      const w = 20 + rngC() * 26;
      ctx.fillRect(bx, cy, w, 3); ctx.fillRect(bx + w * 0.2, cy - 2, w * 0.6, 2); ctx.fillRect(bx + w * 0.15, cy + 3, w * 0.7, 2);
    }
    ctx.globalAlpha = 1;

    // --- parallax layers (the "perspective" effect) ---
    drawParallaxLayer(ctx, farLayer, W, horizon, t * (opts.parFar || 0.006), 1.6, {
      color: farColor, outline: false, windows: false,
    });
    drawParallaxLayer(ctx, midLayer, W, horizon, t * (opts.parMid || 0.014), 1.5, {
      color: midColor, outline: true, windows: true, cell: 3.4, lit, dim, litRatio: 0.3,
    });

    // --- near/featured layer: hero + flanks. Everything else already
    // drifts (far/mid), so this group gets its own motion too — a bounded
    // sway rather than a full scroll-and-wrap, since the hero is a unique
    // set piece, not a repeating filler. Nothing on screen is frozen now. ---
    const nearOffsetX = Math.sin(t * 0.00025) * (opts.nearSway || 16);
    const heroW = W * (opts.heroW || 0.075), heroX = W * (opts.heroX || 0.47) + nearOffsetX;
    drawHeroTower(ctx, heroX, horizon, heroW, horizon * (opts.heroHf || 1.15), {
      body: heroColor, cap: capColor, cell: 2.6, lit, dim, accent, seed: seed + 10, litRatio: 0.62,
    });
    drawFlankTower(ctx, heroX - heroW * 2.6, horizon, heroW * 1.3, horizon * 0.46, {
      body: nearColor, cap: capColor, cell: 2.8, lit, dim, seed: seed + 40, litRatio: 0.5, accent, t,
    }, true);
    drawFlankTower(ctx, heroX + heroW * 1.7, horizon, heroW * 1.1, horizon * 0.6, {
      body: nearColor, cap: capColor, cell: 2.8, lit, dim, seed: seed + 55, litRatio: 0.5, accent, t,
    }, false);
    const rngNear = MDLib.rng(seed + 90);
    [0.04, 0.15, 0.83, 0.93].forEach((fx, i) => {
      const bw = W * (0.07 + (i % 2) * 0.015), bh = horizon * (0.28 + rngNear() * 0.18);
      outlinedRect(ctx, W * fx + nearOffsetX, horizon - bh, bw, bh, nearColor);
      windowGrid(ctx, W * fx + nearOffsetX + 1, horizon - bh + 1, bw - 2, bh - 2, 2.8, lit, dim, seed + 70 + i * 9, 0.42);
    });

    drawBridge(ctx, W, horizon + horizon * 0.02, { height: horizon * 0.28, gap: W * 0.36, pylonW: 8 });

    ctx.fillStyle = `rgba(4,6,16,${MDLib.lerp(0.35, 0.55, climb)})`;
    ctx.fillRect(0, horizon + horizon * 0.02 + 2, W, H - (horizon + horizon * 0.02 + 2));
    ctx.fillStyle = lerpColor('#FFC15E', '#D81F26', climb);
    ctx.globalAlpha = 0.12; ctx.fillRect(0, horizon + horizon * 0.02 + 2, W, 1.5); ctx.globalAlpha = 1;

    drawTreeline(ctx, W, H - 3, seed + 99);

    return { climb };
  }

  function shipHalo(ctx, x, y, r, color) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  global.MDSkyline3 = { draw, shipHalo, lerpColor };
})(window);
