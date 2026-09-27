/* ==========================================================================
 * A — DOWNWELL NY
 * Technique: filled 1-bit silhouettes + Bayer dither shading. Pure black sky,
 * white/grey city, red ONLY where it means something: bullets, enemy cores,
 * thruster, aviation beacons, lives. References: Downwell, Gato Roboto,
 * Return of the Obra Dinn (dither).
 * ========================================================================== */
(function () {
  'use strict';
  const { rng, lerp, clamp, ditherOn, BAYER8 } = MDLib;

  const RED = '#D81F26';
  const WHITE = '#EDEDED';
  const INK = '#000000';

  MDLib.registerStyle({
    id: 'downwell',
    letter: 'A',
    name: 'Downwell NY',
    ref: 'Downwell / Obra Dinn',
    scanlines: 0,
    tagline:
      'Filled white silhouettes on pure black, dither for shade and fog. ' +
      '<em>Red is never decoration</em> — it only marks things that can kill you ' +
      '(bullets, cores, beacons). NY reads through silhouette: water towers, spires, setbacks.',
    tags: [
      { label: '1-bit + dither' },
      { label: 'red = danger only', red: true },
      { label: 'highest readability' },
    ],

    create(ctx, W, H) {
      // ---- seeded city -----------------------------------------------------
      const R = rng(4102);
      const layers = [
        { par: 0.45, shade: 0.22, buildings: [] },   // far: dither-wash grey
        { par: 1.0, shade: 1.0, buildings: [] },     // near: solid white
      ];
      for (const layer of layers) {
        let x = -10;
        while (x < W + 10) {
          const w = 14 + R() * 26;
          layer.buildings.push({
            x, w,
            h: 130 + R() * 210,
            spire: R() < 0.3,
            beacon: R() < 0.45,
            waterTower: R() < 0.4,
            winSeed: (R() * 1e9) | 0,
          });
          x += w + (R() < 0.25 ? 4 : 0);
        }
      }
      const stars = [];
      for (let i = 0; i < 130; i++) stars.push({ x: R() * W, y: R() * H, p: R() * 7 });
      const clouds = [];
      for (let i = 0; i < 7; i++) {
        clouds.push({ x: R() * W, y: 40 + R() * (H - 120), w: 34 + R() * 50, h: 8 + R() * 10, v: 2 + R() * 3 });
      }

      // ---- actors ----------------------------------------------------------
      const ship = { x: W / 2, y: H * 0.66 };
      const enemies = [];
      for (let i = 0; i < 4; i++) {
        enemies.push({ x: 20 + R() * (W - 40), y: 30 + R() * (H * 0.5), a: R() * 7, s: 0.4 + R() * 0.5, sz: 5 + R() * 4 });
      }
      const bullets = [];
      let fireT = 0, lastT = 0;

      // ---- helpers ---------------------------------------------------------
      function ditherFill(x0, y0, w, h, brightness, color) {
        ctx.fillStyle = color;
        const xi = x0 | 0, yi = y0 | 0, wi = Math.ceil(w), hi = Math.ceil(h);
        for (let y = 0; y < hi; y++) {
          for (let x = 0; x < wi; x++) {
            if (ditherOn(xi + x, yi + y, brightness, BAYER8)) ctx.fillRect(xi + x, yi + y, 1, 1);
          }
        }
      }
      function smooth(a, b, v) { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }

      function drawBuilding(b, baseY, solid) {
        const topY = baseY - b.h;
        if (topY > H || baseY < -40) return;
        if (solid) {
          ctx.fillStyle = WHITE;
          ctx.fillRect(b.x, topY, b.w, b.h);
          // dither shade on the left 4px for depth
          ditherFill(b.x, topY, 4, b.h, 0.45, INK);
          // black window cutouts (only the visible slice)
          const wr = rng(b.winSeed);
          const yStart = Math.max(topY + 4, 18);
          for (let wy = yStart; wy < Math.min(baseY - 6, H); wy += 7) {
            for (let wx = b.x + 3; wx < b.x + b.w - 4; wx += 6) {
              if (wr() < 0.72) ctx.fillRect(wx, wy, 3, 4);
            }
          }
          ctx.fillStyle = WHITE;
        } else {
          ditherFill(b.x, topY, b.w, b.h, 0.22, WHITE);
        }
        // roof clutter once the roofline is on screen
        if (topY > 14 && topY < H) {
          ctx.fillStyle = solid ? WHITE : INK;
          if (b.waterTower && solid) {
            // NYC water tower: legs + tank + cone, black cutout on white roof
            ctx.fillStyle = INK;
            const tx = b.x + b.w / 2 - 4, ty = topY - 1;
            ctx.fillRect(tx, ty - 9, 8, 6);            // tank
            ctx.fillRect(tx + 1, ty - 11, 6, 2);       // cone
            ctx.fillRect(tx + 1, ty - 3, 1, 3);        // legs
            ctx.fillRect(tx + 6, ty - 3, 1, 3);
            ctx.fillStyle = WHITE;
          }
          if (b.spire) ctx.fillRect(b.x + (b.w / 2 | 0), topY - 14, 1, 14);
          if (b.beacon) {
            const on = Math.sin((performance.now() / 1000) * 2.4 + b.x) > 0.2;
            if (on) {
              ctx.fillStyle = RED;
              ctx.fillRect(b.x + (b.w / 2 | 0) - 1, topY - (b.spire ? 16 : 3), 2, 2);
            }
          }
        }
      }

      // ---- main render -----------------------------------------------------
      function render(t, alt) {
        const dt = Math.min(0.05, t - lastT || 0.016);
        lastT = t;
        const scroll = alt * (H + 200);

        ctx.fillStyle = INK;
        ctx.fillRect(0, 0, W, H);

        // stars fade in with altitude
        const starA = smooth(0.5, 0.8, alt);
        if (starA > 0) {
          ctx.fillStyle = WHITE;
          ctx.globalAlpha = starA;
          for (const s of stars) {
            if (Math.sin(t * 1.5 + s.p) > -0.4) ctx.fillRect(s.x | 0, s.y | 0, 1, 1);
          }
          ctx.globalAlpha = 1;
        }

        // city (slides down as we climb), gone by orbit
        const cityA = 1 - smooth(0.86, 1.0, alt);
        if (cityA > 0) {
          ctx.globalAlpha = cityA;
          for (const layer of layers) {
            const baseY = H + scroll * layer.par;
            for (const b of layer.buildings) drawBuilding(b, baseY, layer.shade === 1);
          }
          ctx.globalAlpha = 1;
        }

        // street props at the very bottom, only near the ground
        if (alt < 0.22) {
          const baseY = H + scroll;
          const a = 1 - alt / 0.22;
          ctx.globalAlpha = a;
          // taxi: white box, red tail light
          const tx = ((t * 26) % (W + 30)) - 15;
          ctx.fillStyle = WHITE;
          ctx.fillRect(tx, baseY - 6, 9, 4);
          ctx.fillStyle = INK; ctx.fillRect(tx + 2, baseY - 5, 2, 2); ctx.fillRect(tx + 5, baseY - 5, 2, 2);
          ctx.fillStyle = RED; ctx.fillRect(tx, baseY - 5, 1, 2);
          // steam from a manhole: dithered puff
          const sy = baseY - 10 - ((t * 9) % 22);
          ditherFill(60, sy, 8, 6, 0.35 * (1 - ((baseY - 10 - sy) / 24)), WHITE);
          ctx.globalAlpha = 1;
        }

        // cloud band around 800m
        const cloudA = Math.max(0, 1 - Math.abs(alt - 0.83) / 0.14);
        if (cloudA > 0) {
          for (const c of clouds) {
            const cx = ((c.x + t * c.v) % (W + c.w)) - c.w;
            ditherFill(cx, c.y, c.w, c.h, 0.5 * cloudA, WHITE);
          }
        }

        // Earth at orbit: black disc, white rim, dithered atmosphere,
        // red city lights below the rim (NYC from space — diegetic red)
        const earthA = smooth(0.88, 1.0, alt);
        if (earthA > 0) {
          const cy = H + 300 - earthA * 265;
          const r = 300;
          ctx.fillStyle = INK;   // occlude stars below the rim
          ctx.beginPath(); ctx.arc(W / 2, cy, r, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = WHITE;
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(W / 2, cy, r, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
          ctx.lineWidth = 1;
          // atmosphere: dither bands fading upward, following the curve
          for (let x = 0; x < W; x++) {
            const dx = x - W / 2;
            if (Math.abs(dx) >= r) continue;
            const rimY = cy - Math.sqrt(r * r - dx * dx);
            for (let dy = 0; dy < 10; dy++) {
              const br = 0.55 * (1 - dy / 10);
              if (ditherOn(x, (rimY - 10 + dy) | 0, br, BAYER8)) ctx.fillRect(x, rimY - 10 + dy, 1, 1);
            }
          }
          // red city lights just below the rim
          const cl = rng(777);
          ctx.fillStyle = RED;
          for (let i = 0; i < 46; i++) {
            const lx = cl() * W;
            const dx = lx - W / 2;
            if (Math.abs(dx) >= r - 6) continue;
            const rimY = cy - Math.sqrt(r * r - dx * dx);
            const ly = rimY + 3 + cl() * 26;
            if (cl() < 0.75) ctx.fillRect(lx | 0, ly | 0, 1, 1);
          }
          // satellite with red blink
          const sx = ((t * 14) % (W + 20)) - 10, sy = 60 + Math.sin(t * 0.8) * 8;
          ctx.fillStyle = WHITE; ctx.fillRect(sx - 3, sy - 1, 6, 3); ctx.fillRect(sx - 6, sy, 2, 1); ctx.fillRect(sx + 4, sy, 2, 1);
          if (Math.sin(t * 3) > 0) { ctx.fillStyle = RED; ctx.fillRect(sx, sy - 2, 1, 1); }
        }

        // enemies: white debris chunks, single red core
        for (const e of enemies) {
          e.a += dt * e.s;
          e.x += Math.sin(t * 0.5 + e.a) * 0.15;
          e.y += Math.cos(t * 0.35 + e.a * 2) * 0.1;
          ctx.save();
          ctx.translate(e.x, e.y);
          ctx.rotate(e.a);
          ctx.fillStyle = WHITE;
          ctx.fillRect(-e.sz / 2, -e.sz / 2, e.sz, e.sz);
          ctx.fillStyle = INK;
          ctx.fillRect(-e.sz / 2 + 1, -1, 2, 2);
          ctx.fillStyle = RED;
          ctx.fillRect(1, 1, 2, 2);
          ctx.restore();
        }

        // ship: white pixel dart, red thruster
        ship.x = W / 2 + Math.sin(t * 0.7) * 16;
        ship.y = H * 0.66 + Math.sin(t * 1.3) * 3;
        ctx.fillStyle = WHITE;
        ctx.fillRect(ship.x - 1, ship.y - 6, 2, 2);
        ctx.fillRect(ship.x - 3, ship.y - 4, 6, 5);
        ctx.fillRect(ship.x - 5, ship.y, 2, 3);
        ctx.fillRect(ship.x + 3, ship.y, 2, 3);
        ctx.fillStyle = INK; ctx.fillRect(ship.x - 1, ship.y - 3, 2, 2);
        const flick = rng((t * 55) | 0);
        ctx.fillStyle = RED;
        ctx.fillRect(ship.x - 1, ship.y + 2, 2, 2 + flick * 3);

        // bullets: the brightest red on screen
        fireT -= dt;
        if (fireT <= 0) { bullets.push({ x: ship.x, y: ship.y - 8 }); fireT = 0.3; }
        ctx.fillStyle = RED;
        for (let i = bullets.length - 1; i >= 0; i--) {
          const b = bullets[i];
          b.y -= 240 * dt;
          if (b.y < 16) { bullets.splice(i, 1); continue; }
          ctx.fillRect(b.x - 1, b.y, 2, 4);
        }

        // HUD
        ctx.fillStyle = INK; ctx.fillRect(0, 0, W, 14);
        ctx.fillStyle = '#1F1F1F'; ctx.fillRect(0, 14, W, 1);
        ctx.fillStyle = WHITE; ctx.font = '6px "JetBrains Mono", monospace';
        ctx.fillText('SC 012400', 4, 9);
        const altTxt = String(Math.round(alt * 1000)).padStart(3, '0') + 'M';
        ctx.fillText('ALT ' + altTxt, W / 2 - 14, 9);
        ctx.fillStyle = RED;
        for (let i = 0; i < 3; i++) ctx.fillRect(W - 8 - i * 6, 5, 4, 4);
      }

      return { render };
    },
  });
})();
