/* ==========================================================================
 * D — BYTEPATH VECTOR
 * Technique: geometric minimalism + juice. Buildings are 1px outline rects,
 * everything else is motion: glow trails, engine particles, pulsing polygon
 * enemies, hit-flash + particle bursts (real bullet/enemy collisions here,
 * to demo game feel). References: a327ex/BYTEPATH & SNKRX (open source),
 * Geometry Wars. Red = anything interactive.
 * ========================================================================== */
(function () {
  'use strict';
  const { rng, lerp, clamp } = MDLib;

  const RED = '#D81F26';

  MDLib.registerStyle({
    id: 'bytepath',
    letter: 'D',
    name: 'BYTEPATH Vector',
    ref: 'a327ex/BYTEPATH',
    scanlines: 0,
    tagline:
      'All personality comes from motion: glowing red polygons, engine particle ' +
      'trails, <em>hit-flash and death bursts</em> (live collisions in this panel). ' +
      'Cheapest to build, best game feel — but the least literally "NY".',
    tags: [
      { label: 'juice-first' },
      { label: 'particles' },
      { label: 'red = interactive', red: true },
      { label: 'least NY' },
    ],

    create(ctx, W, H) {
      const R = rng(1337);
      const buildings = [];
      let bx = -6;
      while (bx < W + 6) {
        const w = 18 + R() * 26;
        buildings.push({ x: bx, w, h: 170 + R() * 330, beacon: R() < 0.35 });
        bx += w + (R() < 0.2 ? 6 : 0);
      }
      const dust = [];
      for (let i = 0; i < 90; i++) dust.push({ x: R() * W, y: R() * H, z: 0.3 + R() * 0.7 });

      const ship = { x: W / 2, y: H * 0.66 };
      const enemies = [];
      function spawnEnemy(e) {
        e.x = 20 + R() * (W - 40);
        e.y = 24 + R() * H * 0.4;
        e.sides = 3 + ((R() * 3) | 0);
        e.r = 6 + R() * 4;
        e.rot = R() * 7;
        e.p = R() * 7;
        e.flash = 0;
      }
      for (let i = 0; i < 4; i++) { const e = {}; spawnEnemy(e); enemies.push(e); }
      const bullets = [];
      const particles = [];
      let fireT = 0, lastT = 0, shake = 0;

      function burst(x, y, n, spd) {
        for (let i = 0; i < n; i++) {
          const a = R() * Math.PI * 2, v = spd * (0.4 + R() * 0.6);
          particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.35 + R() * 0.3, t: 0 });
        }
      }
      function smooth(a, b, v) { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }

      function poly(x, y, r, sides, rot) {
        ctx.beginPath();
        for (let i = 0; i < sides; i++) {
          const a = rot + (i / sides) * Math.PI * 2;
          const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
      }

      function render(t, alt) {
        const dt = Math.min(0.05, t - lastT || 0.016);
        lastT = t;
        const scroll = alt * (H + 200);

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, W, H);

        // screen shake
        shake = Math.max(0, shake - dt * 3);
        const shaking = shake > 0;
        if (shaking) {
          ctx.save();
          ctx.translate((R() - 0.5) * shake * 4, (R() - 0.5) * shake * 4);
        }

        // climbing dust (parallax speed = altitude feel)
        const spd = 14 + alt * 60;
        ctx.fillStyle = '#3D3D3D';
        for (const d of dust) {
          d.y += spd * d.z * dt;
          if (d.y > H) { d.y = -1; d.x = R() * W; }
          ctx.fillRect(d.x | 0, d.y | 0, 1, 1);
        }

        // city: bare outline rects
        const cityA = 1 - smooth(0.86, 1.0, alt);
        if (cityA > 0) {
          ctx.globalAlpha = cityA;
          ctx.strokeStyle = '#2B2B2B';
          const baseY = H + scroll;
          for (const b of buildings) {
            const topY = baseY - b.h;
            if (topY > H || baseY < -40) continue;
            ctx.strokeRect(b.x + 0.5, topY + 0.5, b.w, b.h);
            if (b.beacon && topY > 12 && topY < H) {
              const pulse = 0.5 + 0.5 * Math.sin(t * 3 + b.x);
              ctx.save();
              ctx.globalAlpha = cityA * pulse;
              ctx.shadowColor = RED; ctx.shadowBlur = 6;
              ctx.fillStyle = RED;
              ctx.fillRect(b.x + b.w / 2 - 1, topY - 3, 2, 2);
              ctx.restore();
            }
          }
          ctx.globalAlpha = 1;
        }

        // planet outline at orbit
        const earthA = smooth(0.88, 1.0, alt);
        if (earthA > 0) {
          const cy = H + 300 - earthA * 258;
          ctx.save();
          ctx.globalAlpha = earthA;
          ctx.strokeStyle = '#3D3D3D';
          ctx.beginPath(); ctx.arc(W / 2, cy, 300, 0, Math.PI * 2); ctx.stroke();
          ctx.strokeStyle = 'rgba(216,31,38,0.6)';
          ctx.beginPath(); ctx.arc(W / 2, cy, 300, Math.PI * 1.25, Math.PI * 1.75); ctx.stroke();
          ctx.restore();
        }

        // enemies: pulsing red polygons
        for (const e of enemies) {
          e.rot += dt * 0.8;
          e.flash = Math.max(0, e.flash - dt * 6);
          const ex = e.x + Math.sin(t * 0.6 + e.p) * 10;
          const ey = e.y + Math.cos(t * 0.45 + e.p * 2) * 6;
          const r = e.r * (1 + 0.12 * Math.sin(t * 4 + e.p));
          e.cx = ex; e.cy = ey;
          ctx.save();
          if (e.flash > 0) {
            ctx.fillStyle = '#fff';
            poly(ex, ey, r, e.sides, e.rot); ctx.fill();
          } else {
            ctx.shadowColor = RED; ctx.shadowBlur = 8;
            ctx.strokeStyle = RED;
            poly(ex, ey, r, e.sides, e.rot); ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.fillStyle = RED;
            ctx.fillRect(ex - 1, ey - 1, 2, 2);
          }
          ctx.restore();
        }

        // ship: white vector dart + red engine particles
        ship.x = W / 2 + Math.sin(t * 0.7) * 16;
        ship.y = H * 0.66 + Math.sin(t * 1.3) * 3;
        if (((t * 60) | 0) % 2 === 0) {
          particles.push({
            x: ship.x + (R() - 0.5) * 2, y: ship.y + 4,
            vx: (R() - 0.5) * 8, vy: 40 + R() * 20, life: 0.3, t: 0,
          });
        }
        ctx.save();
        ctx.shadowColor = '#fff'; ctx.shadowBlur = 6;
        ctx.strokeStyle = '#fff';
        poly(ship.x, ship.y, 6, 3, -Math.PI / 2);
        ctx.stroke();
        ctx.restore();

        // bullets + live collisions (the juice demo)
        fireT -= dt;
        if (fireT <= 0) { bullets.push({ x: ship.x, y: ship.y - 8 }); fireT = 0.28; }
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.shadowColor = RED; ctx.shadowBlur = 7;
        ctx.fillStyle = RED;
        for (let i = bullets.length - 1; i >= 0; i--) {
          const b = bullets[i];
          b.y -= 260 * dt;
          if (b.y < 14) { bullets.splice(i, 1); continue; }
          let hit = false;
          for (const e of enemies) {
            if (e.flash <= 0 && Math.abs(b.x - e.cx) < e.r && Math.abs(b.y - e.cy) < e.r) {
              e.flash = 1; shake = 1;
              burst(e.cx, e.cy, 12, 70);
              spawnEnemy(e);
              hit = true;
              break;
            }
          }
          if (hit) { bullets.splice(i, 1); continue; }
          ctx.fillRect(b.x - 1, b.y, 2, 4);
        }
        ctx.restore();

        // particles
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.t += dt;
          if (p.t >= p.life) { particles.splice(i, 1); continue; }
          p.x += p.vx * dt; p.y += p.vy * dt;
          ctx.globalAlpha = 1 - p.t / p.life;
          ctx.fillStyle = RED;
          ctx.fillRect(p.x | 0, p.y | 0, 1, 1);
        }
        ctx.restore();
        ctx.globalAlpha = 1;

        if (shaking) ctx.restore();

        // HUD: bare minimum
        ctx.fillStyle = '#BFBFBF'; ctx.font = '6px "JetBrains Mono", monospace';
        ctx.fillText('SCORE 012400', 4, 9);
        ctx.fillStyle = RED;
        ctx.fillText(String(Math.round(alt * 1000)).padStart(3, '0') + 'M', W - 26, 9);
      }

      return { render };
    },
  });
})();
