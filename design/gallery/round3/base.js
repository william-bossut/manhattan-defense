/* Shared building blocks for the round-3 "Pixel + Real Lighting" family.
 * Each variation file calls these with different params/palettes instead of
 * re-writing the same sky/city/godray/reflection code seven times. */
(function (global) {
  'use strict';

  function makeCityData(seed, spanW) {
    const rng = MDLib.rng(seed);
    const arr = [];
    let x = -20;
    while (x < spanW + 20) {
      const w = 26 + rng() * 50, h = 44 + rng() * 160;
      const cols = 2 + Math.floor(rng() * 3), rows = 4 + Math.floor(rng() * 7);
      arr.push({ x, w, h, cols, rows, seed: rng() * 999 });
      x += w + 2 + rng() * 6;
    }
    return arr;
  }

  function drawCity(ctx, buildings, horizon, opts) {
    opts = opts || {};
    const winA = opts.winColors ? opts.winColors[0] : '#FF8A3D';
    const winB = opts.winColors ? opts.winColors[1] : '#46F2FF';
    const scale = opts.scale || 1;
    buildings.forEach((b) => {
      const w = b.w * scale, h = b.h * scale, x = b.x * scale;
      const y = horizon - h;
      ctx.fillStyle = opts.buildingColor || '#0E1330';
      ctx.fillRect(x, y, w, h);
      const cw = w / (b.cols + 1), rh = h / (b.rows + 1);
      for (let r = 0; r < b.rows; r++) {
        for (let c = 0; c < b.cols; c++) {
          const idx = (r * 13 + c * 7 + b.seed) | 0;
          if (idx % 3 !== 0) {
            ctx.fillStyle = idx % 7 === 0 ? winB : winA;
            ctx.fillRect(x + cw * (c + 0.6), y + rh * (r + 0.6), Math.max(1, cw * 0.5), Math.max(1, rh * 0.4));
          }
        }
      }
      if (opts.beacon && idxBeacon(b)) {
        ctx.fillStyle = opts.beaconColor || '#FF3B3B';
        ctx.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin((opts.t || 0) * 0.004 + b.seed));
        ctx.beginPath(); ctx.arc(x + w / 2, y - 2, 1.6, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      }
    });
    function idxBeacon(b) { return Math.floor(b.seed) % 5 === 0; }
  }

  function drawGodRays(ctx, rx, ry, color, count, t, len) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < count; i++) {
      const a0 = Math.PI * 0.55 + i * (0.5 / count) + Math.sin(t * 0.0003 + i) * 0.01;
      const grad = ctx.createLinearGradient(rx, ry, rx + Math.cos(a0) * len, ry + Math.sin(a0) * len);
      grad.addColorStop(0, color); grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.moveTo(rx, ry);
      ctx.lineTo(rx + Math.cos(a0 - 0.03) * len, ry + Math.sin(a0 - 0.03) * len);
      ctx.lineTo(rx + Math.cos(a0 + 0.03) * len, ry + Math.sin(a0 + 0.03) * len);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  function drawReflection(ctx, drawFn, horizon, alpha, blur) {
    ctx.save();
    ctx.translate(0, horizon * 2); ctx.scale(1, -1);
    ctx.filter = `blur(${blur || 1.5}px)`; ctx.globalAlpha = alpha;
    drawFn();
    ctx.filter = 'none'; ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawStars(ctx, W, H, count, seed, t, alphaBase) {
    const rng = MDLib.rng(seed);
    for (let i = 0; i < count; i++) {
      const x = rng() * W, y = rng() * H;
      const tw = (alphaBase || 0.5) + 0.5 * Math.abs(Math.sin(t * 0.001 + i));
      ctx.globalAlpha = tw; ctx.fillStyle = '#fff'; ctx.fillRect(x, y, 1, 1);
    }
    ctx.globalAlpha = 1;
  }

  function drawRain(ctx, W, H, count, seed, t, color) {
    const rng = MDLib.rng(seed);
    ctx.strokeStyle = color || 'rgba(180,210,255,0.35)';
    ctx.lineWidth = 1;
    for (let i = 0; i < count; i++) {
      const baseX = rng() * (W + 200) - 100;
      const speed = 220 + rng() * 160;
      const len = 8 + rng() * 10;
      const y = (rng() * H + t * speed * 0.001) % (H + 20);
      const x = baseX + y * 0.15;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - len * 0.25, y + len); ctx.stroke();
    }
  }

  global.MDBase = { makeCityData, drawCity, drawGodRays, drawReflection, drawStars, drawRain };
})(window);
