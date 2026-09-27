/* ==========================================================================
 * B — NEON NOIR
 * Technique: near-black navy atmosphere, dim window grids, red neon with
 * bloom (shadowBlur), rain, wet-street smear. References: Katana ZERO,
 * The Last Night, VA-11 Hall-A. The atmospheric option — deliberately the
 * least strict on the pure-black rule (uses #05070F navy for depth).
 * ========================================================================== */
(function () {
  'use strict';
  const { rng, lerp, clamp } = MDLib;

  const RED = '#D81F26';

  MDLib.registerStyle({
    id: 'neon-noir',
    letter: 'B',
    name: 'Neon Noir',
    ref: 'Katana ZERO / Last Night',
    scanlines: 0.05,
    tagline:
      'Manhattan at 2am in the rain. Navy near-black sky, thousands of dim windows, ' +
      '<em>red neon signage with real bloom</em>, wet-street smear at ground level. ' +
      'Most cinematic option; red lives in signs, brake lights and danger.',
    tags: [
      { label: 'bloom + fog' },
      { label: 'red neon', red: true },
      { label: 'rain' },
      { label: 'breaks black-only' },
    ],

    create(ctx, W, H) {
      const R = rng(7717);
      const layers = [
        { par: 0.4, fill: '#0B0E1A', winA: 0.25, buildings: [] },
        { par: 0.7, fill: '#101527', winA: 0.45, buildings: [] },
        { par: 1.0, fill: '#161D33', winA: 0.7, buildings: [] },
      ];
      const SIGNS = ['HOTEL', 'BAR', '24H', 'RAMEN', 'LIQUOR', 'OPEN', 'TAXI'];
      for (const layer of layers) {
        let x = -8;
        while (x < W + 8) {
          const w = 16 + R() * 24;
          const b = {
            x, w, h: 120 + R() * 200,
            winSeed: (R() * 1e9) | 0,
            sign: null, beacon: R() < 0.3,
          };
          if (layer.par === 1.0 && R() < 0.5) {
            b.sign = { word: SIGNS[(R() * SIGNS.length) | 0], y: 30 + R() * 60 };
          }
          layer.buildings.push(b);
          x += w + (R() < 0.2 ? 5 : 0);
        }
      }
      const rain = [];
      for (let i = 0; i < 70; i++) rain.push({ x: R() * W, y: R() * H, v: 130 + R() * 90 });
      const stars = [];
      for (let i = 0; i < 90; i++) stars.push({ x: R() * W, y: R() * H, p: R() * 7 });

      const ship = { x: W / 2, y: H * 0.66 };
      const enemies = [];
      for (let i = 0; i < 4; i++) {
        enemies.push({ x: 20 + R() * (W - 40), y: 40 + R() * H * 0.45, p: R() * 7, r: 5 + R() * 3 });
      }
      const bullets = [];
      let fireT = 0, lastT = 0;

      function smooth(a, b, v) { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }

      function render(t, alt) {
        const dt = Math.min(0.05, t - lastT || 0.016);
        lastT = t;
        const scroll = alt * (H + 200);

        // sky: navy gradient, red glow on the horizon at low altitude
        const sky = ctx.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#04050C');
        sky.addColorStop(1, '#0B1020');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, H);
        const glowA = (1 - smooth(0.1, 0.5, alt)) * 0.16;
        if (glowA > 0.01) {
          const rg = ctx.createLinearGradient(0, H * 0.45, 0, H);
          rg.addColorStop(0, 'rgba(216,31,38,0)');
          rg.addColorStop(1, 'rgba(216,31,38,' + glowA.toFixed(3) + ')');
          ctx.fillStyle = rg;
          ctx.fillRect(0, H * 0.45, W, H * 0.55);
        }

        // stars up high
        const starA = smooth(0.5, 0.8, alt);
        if (starA > 0) {
          ctx.fillStyle = '#BFBFBF';
          ctx.globalAlpha = starA * 0.8;
          for (const s of stars) if (Math.sin(t * 1.5 + s.p) > -0.4) ctx.fillRect(s.x | 0, s.y | 0, 1, 1);
          ctx.globalAlpha = 1;
        }

        // city layers
        const cityA = 1 - smooth(0.86, 1.0, alt);
        if (cityA > 0) {
          ctx.globalAlpha = cityA;
          for (const layer of layers) {
            const baseY = H + scroll * layer.par;
            for (const b of layer.buildings) {
              const topY = baseY - b.h;
              if (topY > H || baseY < -40) continue;
              ctx.fillStyle = layer.fill;
              ctx.fillRect(b.x, topY, b.w, b.h);
              // window grid
              const wr = rng(b.winSeed + ((t * 0.5) | 0) * 0); // static lit pattern
              ctx.fillStyle = '#BFBFBF';
              const y0 = Math.max(topY + 4, 16);
              for (let wy = y0; wy < Math.min(baseY - 5, H); wy += 6) {
                for (let wx = b.x + 2; wx < b.x + b.w - 3; wx += 5) {
                  const r = wr();
                  if (r < 0.30) { ctx.globalAlpha = cityA * layer.winA; ctx.fillRect(wx, wy, 2, 3); }
                  else if (r > 0.985) { ctx.globalAlpha = cityA * 0.9; ctx.fillStyle = RED; ctx.fillRect(wx, wy, 2, 3); ctx.fillStyle = '#BFBFBF'; }
                }
              }
              ctx.globalAlpha = cityA;
              // red neon sign with bloom
              if (b.sign && topY + b.sign.y < H - 20 && alt < 0.6) {
                ctx.save();
                ctx.shadowColor = RED;
                ctx.shadowBlur = 7;
                ctx.fillStyle = RED;
                ctx.font = '5px "JetBrains Mono", monospace';
                const sx = b.x + b.w / 2 - 2;
                const chars = b.sign.word.split('');
                for (let i = 0; i < chars.length; i++) {
                  ctx.fillText(chars[i], sx, topY + b.sign.y + i * 6);
                }
                ctx.restore();
                // wet smear under the sign
                const sm = ctx.createLinearGradient(0, topY + b.sign.y, 0, Math.min(baseY, H));
                sm.addColorStop(0, 'rgba(216,31,38,0.14)');
                sm.addColorStop(1, 'rgba(216,31,38,0)');
                ctx.fillStyle = sm;
                ctx.fillRect(sx - 3, topY + b.sign.y, 8, Math.min(baseY, H) - topY - b.sign.y);
              }
              // rooftop beacon
              if (b.beacon && topY > 14 && topY < H && Math.sin(t * 2.4 + b.x) > 0.2) {
                ctx.save();
                ctx.shadowColor = RED; ctx.shadowBlur = 5;
                ctx.fillStyle = RED;
                ctx.fillRect(b.x + (b.w / 2 | 0), topY - 2, 2, 2);
                ctx.restore();
              }
            }
          }
          ctx.globalAlpha = 1;
        }

        // street-level extras: brake lights + subway globe
        if (alt < 0.22) {
          const a = 1 - alt / 0.22;
          const baseY = H + scroll;
          ctx.globalAlpha = a;
          for (let i = 0; i < 4; i++) {
            const bx = ((t * (18 + i * 6) + i * 90) % (W + 20)) - 10;
            ctx.save();
            ctx.shadowColor = RED; ctx.shadowBlur = 4;
            ctx.fillStyle = RED;
            ctx.fillRect(bx, baseY - 5, 2, 2);
            ctx.fillRect(bx + 4, baseY - 5, 2, 2);
            ctx.restore();
          }
          ctx.globalAlpha = 1;
        }

        // clouds: soft navy blobs
        const cloudA = Math.max(0, 1 - Math.abs(alt - 0.83) / 0.14);
        if (cloudA > 0) {
          ctx.fillStyle = 'rgba(20,26,48,' + (0.8 * cloudA).toFixed(2) + ')';
          for (let i = 0; i < 6; i++) {
            const cx = ((i * 97 + t * 6) % (W + 60)) - 30;
            const cy = 50 + i * 43 % (H - 100);
            ctx.beginPath(); ctx.ellipse(cx, cy, 34, 7, 0, 0, Math.PI * 2); ctx.fill();
          }
        }

        // Earth glow at orbit
        const earthA = smooth(0.88, 1.0, alt);
        if (earthA > 0) {
          const cy = H + 300 - earthA * 268;
          ctx.save();
          ctx.shadowColor = '#BFBFBF'; ctx.shadowBlur = 18;
          ctx.fillStyle = '#0B1020';
          ctx.beginPath(); ctx.arc(W / 2, cy, 300, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
          ctx.strokeStyle = 'rgba(216,31,38,0.5)';
          ctx.beginPath(); ctx.arc(W / 2, cy, 300, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
        }

        // rain, stronger near the ground
        const rainA = 1 - smooth(0.3, 0.6, alt);
        if (rainA > 0) {
          ctx.strokeStyle = 'rgba(191,191,191,' + (0.22 * rainA).toFixed(2) + ')';
          ctx.beginPath();
          for (const r of rain) {
            r.y += r.v * dt;
            if (r.y > H) { r.y = -6; r.x = R() * W; }
            ctx.moveTo(r.x, r.y);
            ctx.lineTo(r.x - 1, r.y + 6);
          }
          ctx.stroke();
        }

        // enemies: dark drones, glowing red eye
        for (const e of enemies) {
          const ex = e.x + Math.sin(t * 0.6 + e.p) * 8;
          const ey = e.y + Math.cos(t * 0.4 + e.p * 2) * 5;
          ctx.fillStyle = '#101527';
          ctx.beginPath(); ctx.arc(ex, ey, e.r, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#3D3D3D'; ctx.stroke();
          ctx.save();
          ctx.shadowColor = RED; ctx.shadowBlur = 8;
          ctx.fillStyle = RED;
          ctx.fillRect(ex - 1, ey - 1, 2, 2);
          ctx.restore();
        }

        // ship: dark hull, white rim, red underglow
        ship.x = W / 2 + Math.sin(t * 0.7) * 16;
        ship.y = H * 0.66 + Math.sin(t * 1.3) * 3;
        ctx.save();
        ctx.shadowColor = RED; ctx.shadowBlur = 10;
        ctx.fillStyle = 'rgba(216,31,38,0.35)';
        ctx.beginPath(); ctx.ellipse(ship.x, ship.y + 5, 7, 3, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        ctx.fillStyle = '#161D33';
        ctx.beginPath();
        ctx.moveTo(ship.x, ship.y - 7); ctx.lineTo(ship.x - 5, ship.y + 3); ctx.lineTo(ship.x + 5, ship.y + 3);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#EDEDED'; ctx.stroke();
        const flick = 2 + rng((t * 55) | 0) * 3;
        ctx.save();
        ctx.shadowColor = RED; ctx.shadowBlur = 6;
        ctx.fillStyle = RED;
        ctx.fillRect(ship.x - 1, ship.y + 3, 2, flick);
        ctx.restore();

        // bullets: red glow tracers
        fireT -= dt;
        if (fireT <= 0) { bullets.push({ x: ship.x, y: ship.y - 9 }); fireT = 0.3; }
        ctx.save();
        ctx.shadowColor = RED; ctx.shadowBlur = 6;
        ctx.fillStyle = RED;
        for (let i = bullets.length - 1; i >= 0; i--) {
          const b = bullets[i];
          b.y -= 250 * dt;
          if (b.y < 16) { bullets.splice(i, 1); continue; }
          ctx.fillRect(b.x - 1, b.y, 2, 5);
        }
        ctx.restore();

        // HUD: dim chrome, red zone tag
        const hg = ctx.createLinearGradient(0, 0, 0, 16);
        hg.addColorStop(0, 'rgba(4,5,12,0.95)'); hg.addColorStop(1, 'rgba(4,5,12,0)');
        ctx.fillStyle = hg; ctx.fillRect(0, 0, W, 16);
        ctx.fillStyle = '#7A7A7A'; ctx.font = '6px "JetBrains Mono", monospace';
        ctx.fillText('SCORE 012400', 4, 9);
        ctx.fillStyle = RED;
        ctx.fillText(String(Math.round(alt * 1000)).padStart(3, '0') + 'M', W - 26, 9);
      }

      return { render };
    },
  });
})();
