/* Designed pixel sprites for the ship ("the rocket") and the asteroids/debris,
 * shared across styles so they don't stay placeholder triangles/polygons.
 * Built as small offscreen canvases (real pixel grids), then blitted with
 * MDLib.blitSprite so every style renders the same designed shapes. */
(function (global) {
  'use strict';

  function px(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
  }

  // --- Ship ("the rocket") ------------------------------------------------
  // 13-wide grid, nose pointing up (-Y). Built from a symmetric half-width
  // profile so the silhouette stays clean, plus hand-placed cockpit/fins.
  function buildShip(accent) {
    accent = accent || '#D81F26';
    const W = 13, H = 18;
    const cx = document.createElement('canvas'); cx.width = W; cx.height = H;
    const ctx = cx.getContext('2d');
    const half = [0, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 2, 2, 2];
    const center = 6;
    for (let r = 0; r < H; r++) {
      const hw = half[r];
      for (let c = center - hw; c <= center + hw; c++) {
        if (c < 0 || c >= W) continue;
        px(ctx, c, r, '#2A2E3A');
      }
      if (hw >= 2) px(ctx, center - hw + 1, r, '#4A5066'); // left highlight strip
      if (hw >= 1) { px(ctx, center - hw, r, '#14151C'); px(ctx, center + hw, r, '#14151C'); } // outline
    }
    // fin flares at the base
    px(ctx, 1, 13, '#14151C'); px(ctx, 0, 14, '#14151C'); px(ctx, 1, 14, '#14151C');
    px(ctx, 11, 13, '#14151C'); px(ctx, 12, 14, '#14151C'); px(ctx, 11, 14, '#14151C');
    // cockpit window
    for (let r = 6; r <= 8; r++) for (let c = 5; c <= 7; c++) px(ctx, c, r, '#7CE8F2');
    px(ctx, 6, 7, '#DFFBFF');
    // engine nozzle (darker, where the flame will be drawn separately)
    for (let r = 15; r <= 16; r++) for (let c = 5; c <= 7; c++) px(ctx, c, r, '#1A1B22');
    // red accent stripe, broken at the cockpit
    [2, 3, 4, 5, 10, 11].forEach((r) => { if (half[r] > 0) px(ctx, center, r, accent); });
    return cx;
  }

  // --- Asteroid / debris ---------------------------------------------------
  function buildAsteroid(seed, size) {
    const rng = MDLib.rng(seed);
    const cx = document.createElement('canvas'); cx.width = size; cx.height = size;
    const ctx = cx.getContext('2d');
    const c = size / 2;
    const pts = 9 + Math.floor(rng() * 3);
    const radii = [];
    for (let i = 0; i < pts; i++) radii.push(size * 0.28 + rng() * size * 0.16);
    ctx.beginPath();
    for (let i = 0; i <= pts; i++) {
      const a = (i / pts) * Math.PI * 2;
      const r = radii[i % pts];
      const x = c + Math.cos(a) * r, y = c + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    const grad = ctx.createRadialGradient(c - size * 0.18, c - size * 0.18, 2, c, c, size * 0.55);
    grad.addColorStop(0, '#9A9AA0'); grad.addColorStop(0.6, '#5A5A62'); grad.addColorStop(1, '#2E2E34');
    ctx.fillStyle = grad; ctx.fill();
    ctx.strokeStyle = '#15151A'; ctx.lineWidth = 1; ctx.stroke();
    // craters
    const craters = 3 + Math.floor(rng() * 3);
    for (let i = 0; i < craters; i++) {
      const a = rng() * Math.PI * 2, r = rng() * size * 0.28;
      const x = c + Math.cos(a) * r, y = c + Math.sin(a) * r;
      const cr = 1.2 + rng() * size * 0.06;
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.beginPath(); ctx.arc(x, y, cr, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      ctx.beginPath(); ctx.arc(x - cr * 0.3, y - cr * 0.3, cr * 0.4, 0, Math.PI * 2); ctx.fill();
    }
    return cx;
  }

  // Chunkier twin-engine gunship — wider silhouette, horizontal accent band.
  function buildGunship(accent) {
    accent = accent || '#D81F26';
    const W = 13, H = 14;
    const cx = document.createElement('canvas'); cx.width = W; cx.height = H;
    const ctx = cx.getContext('2d');
    const half = [1, 2, 3, 3, 4, 4, 5, 5, 5, 4, 4, 3, 3, 2];
    const center = 6;
    for (let r = 0; r < H; r++) {
      const hw = half[r];
      for (let c = center - hw; c <= center + hw; c++) px(ctx, c, r, '#33363F');
      if (hw >= 3) px(ctx, center - hw + 1, r, '#565B68');
      px(ctx, center - hw, r, '#101116'); px(ctx, center + hw, r, '#101116');
    }
    for (let c = center - 5; c <= center + 5; c++) px(ctx, c, 6, accent);
    for (let r = 2; r <= 3; r++) for (let c = center - 1; c <= center + 1; c++) px(ctx, c, r, '#7CE8F2');
    [center - 3, center - 2, center + 2, center + 3].forEach((c) => px(ctx, c, H - 1, '#1A1B22'));
    return cx;
  }

  // Tiny sleek scout — minimal detail, built for speed.
  function buildScout(accent) {
    accent = accent || '#4DE1FF';
    const W = 9, H = 12;
    const cx = document.createElement('canvas'); cx.width = W; cx.height = H;
    const ctx = cx.getContext('2d');
    const half = [0, 1, 1, 2, 2, 2, 2, 2, 1, 1, 1, 1];
    const center = 4;
    for (let r = 0; r < H; r++) {
      const hw = half[r];
      for (let c = center - hw; c <= center + hw; c++) px(ctx, c, r, '#20222B');
      px(ctx, center - hw, r, '#0C0D11'); px(ctx, center + hw, r, '#0C0D11');
    }
    px(ctx, center, 4, accent); px(ctx, center, 5, '#CFF7FF'); px(ctx, center, 9, accent);
    for (let c = center - 1; c <= center + 1; c++) px(ctx, c, H - 1, '#0C0D11');
    return cx;
  }

  // Broad delta-wing interceptor — accent traces the leading edges instead of a stripe.
  function buildInterceptor(accent) {
    accent = accent || '#D81F26';
    const W = 15, H = 10;
    const cx = document.createElement('canvas'); cx.width = W; cx.height = H;
    const ctx = cx.getContext('2d');
    const half = [0, 1, 2, 3, 4, 5, 6, 7, 7, 7];
    const center = 7;
    for (let r = 0; r < H; r++) {
      const hw = half[r];
      for (let c = center - hw; c <= center + hw; c++) px(ctx, c, r, '#2A2E3A');
      px(ctx, center - hw, r, accent); px(ctx, center + hw, r, accent);
    }
    for (let r = 2; r <= 3; r++) for (let c = center - 1; c <= center + 1; c++) px(ctx, c, r, '#7CE8F2');
    for (let c = center - 2; c <= center + 2; c++) px(ctx, c, H - 1, '#101116');
    return cx;
  }

  // --- More debris variants ------------------------------------------------
  // Angular metal satellite/hull debris — a sharper, man-made counterpart to
  // the rounded rock asteroids, with panel lines and a blinking beacon.
  function buildDebrisMetal(seed, size) {
    const rng = MDLib.rng(seed);
    const cx = document.createElement('canvas'); cx.width = size; cx.height = size;
    const ctx = cx.getContext('2d');
    const c = size / 2;
    const pts = 6 + Math.floor(rng() * 2);
    const radii = [];
    for (let i = 0; i < pts; i++) radii.push(size * 0.22 + rng() * size * 0.2);
    ctx.beginPath();
    for (let i = 0; i <= pts; i++) {
      const a = (i / pts) * Math.PI * 2, r = radii[i % pts];
      const x = c + Math.cos(a) * r, y = c + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, '#8A94A8'); grad.addColorStop(1, '#3A4252');
    ctx.fillStyle = grad; ctx.fill();
    ctx.strokeStyle = '#181C24'; ctx.lineWidth = 1; ctx.stroke();
    ctx.strokeStyle = 'rgba(20,24,32,0.5)';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath(); ctx.moveTo(c - size * 0.3 + i * size * 0.2, c - size * 0.25);
      ctx.lineTo(c - size * 0.3 + i * size * 0.2, c + size * 0.25); ctx.stroke();
    }
    ctx.fillStyle = '#FF3B3B'; ctx.shadowColor = '#FF3B3B'; ctx.shadowBlur = 3;
    ctx.beginPath(); ctx.arc(c + size * 0.2, c - size * 0.15, 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    return cx;
  }

  // Glowing crystalline hazard — faceted, red-lit, reads as "don't touch."
  function buildCrystalHazard(seed, size) {
    const rng = MDLib.rng(seed);
    const cx = document.createElement('canvas'); cx.width = size; cx.height = size;
    const ctx = cx.getContext('2d');
    const c = size / 2, pts = 6;
    const radii = [];
    for (let i = 0; i < pts; i++) radii.push(size * 0.24 + rng() * size * 0.2);
    ctx.beginPath();
    for (let i = 0; i <= pts; i++) {
      const a = (i / pts) * Math.PI * 2, r = radii[i % pts];
      const x = c + Math.cos(a) * r, y = c + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    const grad = ctx.createRadialGradient(c, c, 2, c, c, size * 0.55);
    grad.addColorStop(0, '#FF9AA8'); grad.addColorStop(0.6, '#D81F26'); grad.addColorStop(1, '#5A0E12');
    ctx.fillStyle = grad; ctx.shadowColor = '#FF3B4A'; ctx.shadowBlur = 6; ctx.fill(); ctx.shadowBlur = 0;
    ctx.strokeStyle = '#3A0508'; ctx.lineWidth = 1; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    for (let i = 0; i < pts; i++) {
      const a = (i / pts) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(c, c); ctx.lineTo(c + Math.cos(a) * radii[i] * 0.9, c + Math.sin(a) * radii[i] * 0.9); ctx.stroke();
    }
    return cx;
  }

  function blitSprite(ctx, spriteCanvas, x, y, scale, rot) {
    ctx.save();
    ctx.translate(x, y);
    if (rot) ctx.rotate(rot);
    const w = spriteCanvas.width * scale, h = spriteCanvas.height * scale;
    ctx.drawImage(spriteCanvas, -w / 2, -h / 2, w, h);
    ctx.restore();
  }

  function drawEngineFlame(ctx, shipCanvas, scale, t, color) {
    // call right after blitSprite(ship,...) in the same translated/rotated frame is awkward
    // across styles, so instead this draws a standalone flame at a given local nose-down point.
  }

  global.MDSprites = {
    ship: buildShip('#D81F26'),
    shipCyan: buildShip('#4DE1FF'),
    shipGunship: buildGunship('#D81F26'),
    shipScout: buildScout('#4DE1FF'),
    shipInterceptor: buildInterceptor('#D81F26'),
    asteroidBig: buildAsteroid(77, 22),
    asteroidSmall: buildAsteroid(133, 13),
    asteroidBig2: buildAsteroid(211, 20),
    debrisMetal: buildDebrisMetal(303, 20),
    crystalHazard: buildCrystalHazard(404, 18),
    blitSprite,
  };
})(window);
