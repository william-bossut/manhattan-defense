/* ==========================================================================
 * C — NY DUSK DIORAMA
 * Technique: eBoy-style detail-maximalist pixel city, reworked round 2.5:
 *  - Sky starts as a red CREPUSCULE at street level (striped sun, lit clouds)
 *    and crossfades to a DARK BLUE NIGHT as you climb; windows progressively
 *    light up RED.
 *  - Unmistakable Manhattan: Empire State, Chrysler, One WTC, suspension
 *    bridge, water towers, billboards, steam, cabs.
 *  - Gameplay shown for real: Asteroids-style ship (inertia, rotation, screen
 *    wrap) hunting tumbling asteroids that come from EVERY direction and
 *    split when shot.
 * Palette: black/greys + #D81F26 family (dusk reds count as the accent).
 * ========================================================================== */
(function () {
  'use strict';
  const { rng, lerp, clamp, ditherOn, BAYER8 } = MDLib;

  const RED = '#D81F26';
  const RED_HI = '#F03E45';
  const RED_LO = '#7A1218';

  // --- small color helpers --------------------------------------------------
  function hx(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
  function mix(c1, c2, t) {
    const a = hx(c1), b = hx(c2);
    return 'rgb(' + Math.round(lerp(a[0], b[0], t)) + ',' + Math.round(lerp(a[1], b[1], t)) + ',' + Math.round(lerp(a[2], b[2], t)) + ')';
  }
  function smooth(a, b, v) { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }

  MDLib.registerStyle({
    id: 'eboy',
    letter: 'C',
    name: 'NY Dusk Diorama',
    ref: 'eBoy / your sunset refs',
    scanlines: 0,
    tagline:
      'The picked direction, reworked: <em>dusk at street level fading to dark-blue ' +
      'night</em> as you climb, windows lighting up red. Empire State, Chrysler, One WTC, ' +
      'a suspension bridge — no mistaking the city. Ship flies <em>Asteroids-style</em>: ' +
      'free inertia navigation, rocks from every direction, splitting on hits.',
    tags: [
      { label: 'dusk → night' },
      { label: 'NY landmarks' },
      { label: 'red windows', red: true },
      { label: 'real asteroids loop' },
    ],

    create(ctx, W, H) {
      const R = rng(9021);

      // ---- sky: pre-rendered dusk & night gradients -------------------------
      function skyStrip(stops) {
        const c = document.createElement('canvas');
        c.width = 1; c.height = H;
        const g = c.getContext('2d');
        const grad = g.createLinearGradient(0, 0, 0, H);
        for (const [p, col] of stops) grad.addColorStop(p, col);
        g.fillStyle = grad;
        g.fillRect(0, 0, 1, H);
        return c;
      }
      const SKY_DUSK = skyStrip([[0, '#07060F'], [0.5, '#160A18'], [0.75, '#3A0E1A'], [0.9, '#8A1620'], [1, '#C41B24']]);
      const SKY_NIGHT = skyStrip([[0, '#03040A'], [0.6, '#070B18'], [1, '#0B1020']]);

      // ---- city --------------------------------------------------------------
      // regular buildings per layer + landmark buildings with custom drawers
      const layers = [
        { par: 0.35, dusk: '#1A0A12', night: '#101010', buildings: [] },
        { par: 0.65, dusk: '#140810', night: '#181818', buildings: [] },
        { par: 1.0, dusk: '#0F060C', night: '#222222', buildings: [] },
      ];
      for (const layer of layers) {
        let x = -8;
        while (x < W + 8) {
          const w = 14 + R() * 20;
          layer.buildings.push({
            x, w, h: 90 + R() * 130,
            winSeed: (R() * 1e9) | 0,
            waterTower: R() < 0.45, antenna: R() < 0.35, beacon: R() < 0.3,
            billboard: layer.par === 1 && R() < 0.3 ? { y: 22 + R() * 40, kind: (R() * 3) | 0 } : null,
          });
          x += w + (R() < 0.2 ? 4 : 0);
        }
      }
      // landmarks live in the near layer, fixed spots
      const landmarks = [
        { kind: 'chrysler', x: 46, w: 20, h: 285 },
        { kind: 'empire', x: 148, w: 26, h: 310 },
        { kind: 'wtc', x: 214, w: 20, h: 335 },
      ];

      const stars = [];
      for (let i = 0; i < 110; i++) stars.push({ x: R() * W, y: R() * H, p: R() * 7 });
      const clouds = [];
      for (let i = 0; i < 5; i++) clouds.push({ x: R() * W, y: 30 + R() * 130, w: 40 + R() * 46, v: 1.5 + R() * 2 });
      const cabs = [{ x: 0, v: 26, dir: 1 }, { x: 170, v: 20, dir: -1 }];
      const vents = [{ x: 30 }, { x: 118 }, { x: 195 }];

      // ---- ship: 11x11 pixel sprite, 16 pre-rotated frames -------------------
      const SPR = [
        '.....1.....',
        '....111....',
        '....121....',
        '...11211...',
        '...11111...',
        '..1111111..',
        '..111.111..',
        '.111...111.',
        '.11.....11.',
        '11.......11',
        '1.........1',
      ];
      const FRAMES = [], SHADOW = [];
      {
        const base = document.createElement('canvas');
        base.width = 24; base.height = 24;
        const b = base.getContext('2d');
        for (let y = 0; y < SPR.length; y++) {
          for (let x = 0; x < SPR[y].length; x++) {
            const ch = SPR[y][x];
            if (ch === '1') { b.fillStyle = '#EDEDED'; b.fillRect(6 + x, 6 + y, 1, 1); }
            if (ch === '2') { b.fillStyle = RED; b.fillRect(6 + x, 6 + y, 1, 1); }
          }
        }
        for (let k = 0; k < 16; k++) {
          const f = document.createElement('canvas');
          f.width = 24; f.height = 24;
          const g = f.getContext('2d');
          g.imageSmoothingEnabled = false;
          g.translate(12, 12);
          g.rotate((k / 16) * Math.PI * 2);
          g.drawImage(base, -12, -12);
          FRAMES.push(f);
          // drop shadow version
          const s = document.createElement('canvas');
          s.width = 24; s.height = 24;
          const sg = s.getContext('2d');
          sg.imageSmoothingEnabled = false;
          sg.translate(12, 12);
          sg.rotate((k / 16) * Math.PI * 2);
          sg.globalCompositeOperation = 'source-over';
          sg.fillStyle = '#000';
          // cheap silhouette: draw black behind
          sg.drawImage(base, -10, -9); // offset 1,1
          SHADOW.push(s);
        }
      }
      const ship = { x: W / 2, y: H * 0.55, vx: 0, vy: 0, ang: -Math.PI / 2, thrust: false };

      // ---- asteroids: irregular tumbling rocks, wrap, split ------------------
      function makeRock(x, y, r) {
        const verts = [];
        const n = 8 + (R() * 4 | 0);
        for (let i = 0; i < n; i++) verts.push(0.72 + R() * 0.5);
        const a = R() * Math.PI * 2, sp = 10 + R() * 14;
        return {
          x, y, r, verts,
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          rot: R() * 7, rotV: (R() - 0.5) * 1.6,
          craters: [{ a: R() * 7, d: 0.3 }, { a: R() * 7, d: 0.55 }],
        };
      }
      const rocks = [];
      for (let i = 0; i < 6; i++) rocks.push(makeRock(R() * W, R() * H * 0.6, 8 + R() * 4));

      const bullets = [];
      const parts = [];
      let fireT = 0, lastT = 0, score = 12400;

      function burst(x, y, n) {
        for (let i = 0; i < n; i++) {
          const a = R() * Math.PI * 2, v = 20 + R() * 40;
          parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, life: 0.3 + R() * 0.3, red: i % 3 === 0 });
        }
      }
      function wrap(o, m) {
        if (o.x < -m) o.x += W + 2 * m; else if (o.x > W + m) o.x -= W + 2 * m;
        if (o.y < -m) o.y += H + 2 * m; else if (o.y > H + m) o.y -= H + 2 * m;
      }

      // ---- window grids --------------------------------------------------------
      function windows(b, topY, baseY, litLevel, nightF) {
        const wr = rng(b.winSeed);
        const y0 = Math.max(topY + 4, 16);
        for (let wy = y0; wy < Math.min(baseY - 5, H); wy += 5) {
          for (let wx = b.x + 2; wx < b.x + b.w - 3; wx += 4) {
            const r = wr();
            if (r < litLevel * 0.72) {                     // red-lit
              ctx.fillStyle = r < litLevel * 0.25 ? RED_HI : (r < litLevel * 0.5 ? RED : RED_LO);
              ctx.fillRect(wx, wy, 2, 2);
            } else if (r > 0.975 && nightF > 0.3) {        // rare white
              ctx.fillStyle = '#BFBFBF';
              ctx.fillRect(wx, wy, 2, 2);
            }
          }
        }
      }

      // ---- landmarks -----------------------------------------------------------
      function rim(a) {                                     // sunset backlight helper
        if (a <= 0) return;
        ctx.fillStyle = RED;
        ctx.globalAlpha = a * 0.75;
      }
      function empire(x, baseY, litLevel, nightF, rimA) {
        const topY = baseY - 310;
        ctx.fillStyle = mix('#1E0C14', '#262626', nightF);
        ctx.fillRect(x, topY + 120, 26, 190);              // base
        ctx.fillRect(x + 3, topY + 60, 20, 60);            // setback 1
        ctx.fillRect(x + 6, topY + 22, 14, 38);            // setback 2
        ctx.fillRect(x + 9, topY, 8, 22);                  // crown
        ctx.fillRect(x + 12, topY - 12, 2, 12);            // spire
        rim(rimA);                                          // hot top edges
        ctx.fillRect(x, topY + 120, 26, 1);
        ctx.fillRect(x + 3, topY + 60, 20, 1);
        ctx.fillRect(x + 6, topY + 22, 14, 1);
        ctx.fillRect(x + 9, topY, 8, 1);
        ctx.globalAlpha = 1;
        windows({ x, w: 26, winSeed: 4242 }, topY + 120, baseY, litLevel, nightF);
        windows({ x: x + 3, w: 20, winSeed: 4343 }, topY + 60, topY + 120, litLevel, nightF);
        windows({ x: x + 6, w: 14, winSeed: 4444 }, topY + 22, topY + 60, litLevel, nightF);
        if (nightF > 0.2 || litLevel > 0.4) {               // crown floodlit red
          ctx.fillStyle = RED;
          ctx.globalAlpha = Math.max(nightF, litLevel - 0.3) * 0.9;
          ctx.fillRect(x + 9, topY, 8, 3);
          ctx.fillRect(x + 12, topY - 12, 2, 3);
          ctx.globalAlpha = 1;
        }
        if (Math.sin(performance.now() / 1000 * 2.4) > 0.2) {
          ctx.fillStyle = RED_HI;
          ctx.fillRect(x + 12, topY - 14, 2, 2);
        }
      }
      function chrysler(x, baseY, litLevel, nightF, rimA) {
        const topY = baseY - 285;
        ctx.fillStyle = mix('#1E0C14', '#262626', nightF);
        ctx.fillRect(x, topY + 40, 20, 245);
        // tiered crown: shrinking arches
        for (let i = 0; i < 4; i++) {
          const cw = 18 - i * 4;
          ctx.fillRect(x + 1 + i * 2, topY + 32 - i * 8, cw, 8);
        }
        ctx.fillRect(x + 9, topY - 14, 2, 22);             // spire
        rim(rimA);
        ctx.fillRect(x, topY + 40, 20, 1);
        for (let i = 0; i < 4; i++) ctx.fillRect(x + 1 + i * 2, topY + 32 - i * 8, 18 - i * 4, 1);
        ctx.globalAlpha = 1;
        windows({ x, w: 20, winSeed: 5151 }, topY + 40, baseY, litLevel, nightF);
        if (nightF > 0.2 || litLevel > 0.4) {               // crown triangles glow
          ctx.fillStyle = '#EDEDED';
          ctx.globalAlpha = Math.max(nightF, litLevel - 0.3) * 0.85;
          for (let i = 0; i < 4; i++) ctx.fillRect(x + 3 + i * 2, topY + 34 - i * 8, 2, 2);
          ctx.fillStyle = RED;
          ctx.fillRect(x + 9, topY - 12, 2, 4);
          ctx.globalAlpha = 1;
        }
      }
      function wtc(x, baseY, litLevel, nightF, rimA) {
        const topY = baseY - 335;
        ctx.fillStyle = mix('#1E0C14', '#222222', nightF);
        ctx.fillRect(x, topY, 20, 335);
        ctx.fillRect(x + 9, topY - 18, 2, 18);             // antenna
        rim(rimA);
        ctx.fillRect(x, topY, 20, 1);
        ctx.globalAlpha = 1;
        // vertical stripe windows
        const wr = rng(6161);
        for (let wx = x + 2; wx < x + 18; wx += 4) {
          for (let wy = Math.max(topY + 6, 16); wy < Math.min(baseY - 6, H); wy += 8) {
            if (wr() < litLevel * 0.5) {
              ctx.fillStyle = wr() < 0.3 ? RED : RED_LO;
              ctx.fillRect(wx, wy, 1, 3);
            }
          }
        }
        if (Math.sin(performance.now() / 1000 * 2.2 + 2) > 0.2) {
          ctx.fillStyle = RED_HI;
          ctx.fillRect(x + 9, topY - 20, 2, 2);
        }
      }

      function bridge(baseY, a, nightF) {
        ctx.globalAlpha = a;
        const col = mix('#3A1018', '#1A1A1A', nightF);
        ctx.strokeStyle = col;
        ctx.fillStyle = col;
        const y = baseY - 26;
        for (const tx of [30, 150]) {                       // two towers
          ctx.fillRect(tx, y - 22, 3, 48);
          ctx.fillRect(tx + 10, y - 22, 3, 48);
          ctx.fillRect(tx - 1, y - 24, 15, 3);
          ctx.fillStyle = RED;                              // tower-top beacons
          ctx.fillRect(tx + 5, y - 26, 2, 2);
          ctx.fillStyle = col;
        }
        ctx.beginPath();                                    // deck
        ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        ctx.beginPath();                                    // main cables
        ctx.moveTo(0, y - 12);
        ctx.quadraticCurveTo(88, y + 14, W, y - 10);
        ctx.stroke();
        ctx.fillStyle = RED;                                // deck lights
        for (let lx = 6; lx < W; lx += 10) ctx.fillRect(lx, y - 2, 1, 1);
        ctx.globalAlpha = 1;
      }

      // ---- main render ---------------------------------------------------------
      function render(t, alt) {
        const dt = Math.min(0.05, t - lastT || 0.016);
        lastT = t;
        const scroll = alt * (H + 200);
        const nightF = smooth(0.12, 0.55, alt);            // 0 = dusk, 1 = night
        const litLevel = 0.30 + nightF * 0.70;             // windows turn on

        // sky crossfade
        ctx.drawImage(SKY_DUSK, 0, 0, W, H);
        ctx.globalAlpha = nightF;
        ctx.drawImage(SKY_NIGHT, 0, 0, W, H);
        ctx.globalAlpha = 1;

        // striped retro sun + radial glow, sinking as night falls
        const sunA = 1 - smooth(0.28, 0.5, alt);
        if (sunA > 0) {
          const sunY = lerp(H * 0.5, H * 0.78, smooth(0.05, 0.45, alt));
          const sunX = W * 0.46;
          const sr = 26;
          const glow = ctx.createRadialGradient(sunX, sunY, sr * 0.5, sunX, sunY, 110);
          glow.addColorStop(0, 'rgba(216,31,38,' + (0.4 * sunA).toFixed(2) + ')');
          glow.addColorStop(1, 'rgba(216,31,38,0)');
          ctx.fillStyle = glow;
          ctx.fillRect(0, 0, W, H);
          ctx.globalAlpha = sunA;
          for (let dy = -sr; dy <= sr; dy++) {
            if (dy > 2 && ((dy / 3) | 0) % 2 === 0) continue;   // stripe gaps, lower half
            const hw = Math.sqrt(sr * sr - dy * dy) | 0;
            ctx.fillStyle = dy < -8 ? RED_HI : RED;
            ctx.fillRect(sunX - hw, sunY + dy, hw * 2, 1);
          }
          ctx.globalAlpha = 1;
        }

        // stars come out at night
        const starA = smooth(0.3, 0.6, alt);
        if (starA > 0) {
          ctx.fillStyle = '#BFBFBF';
          ctx.globalAlpha = starA;
          for (const s of stars) if (Math.sin(t * 1.5 + s.p) > -0.4) ctx.fillRect(s.x | 0, s.y | 0, 1, 1);
          ctx.globalAlpha = 1;
        }

        // clouds: sunset-lit at dusk, dark at night
        for (const c of clouds) {
          const cx = ((c.x + t * c.v) % (W + c.w)) - c.w;
          ctx.fillStyle = mix('#4A1420', '#0D1224', nightF);
          ctx.fillRect(cx, c.y, c.w, 5);
          ctx.fillRect(cx + 8, c.y - 4, c.w - 18, 4);
          ctx.fillRect(cx + 5, c.y + 5, c.w - 10, 3);
          if (nightF < 0.7) {                                // hot rim toward the sun
            ctx.fillStyle = RED_HI;
            ctx.globalAlpha = (0.7 - nightF) * 0.8;
            ctx.fillRect(cx + 8, c.y - 4, c.w - 18, 1);
            ctx.fillRect(cx + 10, c.y - 3, c.w - 22, 1);
            ctx.globalAlpha = 1;
          }
        }

        // city
        const cityA = 1 - smooth(0.86, 1.0, alt);
        if (cityA > 0) {
          ctx.globalAlpha = cityA;
          // suspension bridge first — it's the far background
          if (alt < 0.3) bridge(H + scroll * 0.35, (1 - alt / 0.3) * cityA, nightF);
          for (const layer of layers) {
            const baseY = H + scroll * layer.par;
            const fill = mix(layer.dusk, layer.night, nightF);
            for (const b of layer.buildings) {
              const topY = baseY - b.h;
              if (topY > H || baseY < -40) continue;
              ctx.fillStyle = fill;   // per building: windows() clobbers fillStyle
              ctx.fillRect(b.x, topY, b.w, b.h);
              if (layer.par === 1) windows(b, topY, baseY, litLevel, nightF);
              if (topY > 12 && topY < H) {
                if (b.waterTower && layer.par === 1) {
                  ctx.fillStyle = mix('#0D060A', '#3D3D3D', nightF);
                  const tx = b.x + b.w / 2 - 4;
                  ctx.fillRect(tx, topY - 10, 8, 6);
                  ctx.fillRect(tx + 1, topY - 12, 6, 2);
                  ctx.fillRect(tx + 1, topY - 4, 1, 4);
                  ctx.fillRect(tx + 6, topY - 4, 1, 4);
                  ctx.fillStyle = mix(layer.dusk, layer.night, nightF);
                }
                if (b.antenna) {
                  ctx.fillStyle = '#7A7A7A';
                  ctx.fillRect(b.x + 3, topY - 10, 1, 10);
                }
                if (b.beacon && Math.sin(t * 2.4 + b.x) > 0.2) {
                  ctx.fillStyle = RED;
                  ctx.fillRect(b.x + b.w - 4, topY - 2, 2, 2);
                }
                if (b.billboard) {
                  const bx = b.x + b.w / 2 - 8, by = topY + b.billboard.y;
                  if (by < H - 14) {
                    ctx.fillStyle = '#0A0A0A';
                    ctx.fillRect(bx, by, 16, 10);
                    ctx.fillStyle = RED;
                    if (b.billboard.kind === 0) {
                      ctx.fillRect(bx + 5, by + 3, 2, 2); ctx.fillRect(bx + 9, by + 3, 2, 2);
                      ctx.fillRect(bx + 4, by + 4, 8, 2); ctx.fillRect(bx + 6, by + 6, 4, 2);
                    } else if (b.billboard.kind === 1) {
                      ctx.font = '5px "JetBrains Mono", monospace';
                      ctx.fillText('NY', bx + 4, by + 7);
                    } else {
                      ctx.fillRect(bx + 3, by + 3, 10, 1); ctx.fillRect(bx + 3, by + 5, 10, 1); ctx.fillRect(bx + 3, by + 7, 6, 1);
                    }
                  }
                }
              }
            }
          }
          // landmarks on the near layer — lights come on at dusk (litLevel 0.55+)
          const baseY = H + scroll;
          const lmLit = 0.55 + nightF * 0.45;
          const rimA = 1 - smooth(0.28, 0.5, alt);
          empire(landmarks[1].x, baseY, lmLit, nightF, rimA);
          chrysler(landmarks[0].x, baseY, lmLit, nightF, rimA);
          wtc(landmarks[2].x, baseY, lmLit, nightF, rimA);
          ctx.globalAlpha = 1;
        }

        // street life
        if (alt < 0.22) {
          const a = 1 - alt / 0.22;
          const baseY = H + scroll;
          ctx.globalAlpha = a;
          for (const cab of cabs) {
            cab.x += cab.v * cab.dir * dt;
            if (cab.x > W + 12) cab.x = -12;
            if (cab.x < -12) cab.x = W + 12;
            ctx.fillStyle = '#BFBFBF';
            ctx.fillRect(cab.x, baseY - 6, 10, 4);
            ctx.fillStyle = '#000';
            ctx.fillRect(cab.x + 2, baseY - 5, 2, 2); ctx.fillRect(cab.x + 6, baseY - 5, 2, 2);
            ctx.fillStyle = RED;
            ctx.fillRect(cab.dir > 0 ? cab.x : cab.x + 9, baseY - 5, 1, 2);
          }
          ctx.fillStyle = '#BFBFBF';
          for (const v of vents) {
            for (let p = 0; p < 3; p++) {
              const rise = ((t * 10 + p * 9) % 26);
              const py = baseY - 8 - rise;
              const br = 0.5 * (1 - rise / 28) * a;
              if (br <= 0.05) continue;
              for (let dy = 0; dy < 5; dy++) for (let dx = 0; dx < 7; dx++) {
                if (ditherOn((v.x + dx) | 0, (py + dy) | 0, br, BAYER8)) ctx.fillRect(v.x + dx, py + dy, 1, 1);
              }
            }
          }
          ctx.globalAlpha = 1;
        }

        // high cloud band
        const cloudA = Math.max(0, 1 - Math.abs(alt - 0.83) / 0.14);
        if (cloudA > 0) {
          ctx.fillStyle = '#0D1224';
          for (let i = 0; i < 6; i++) {
            const cx = ((i * 89 + t * 5) % (W + 50)) - 25;
            const cy = (60 + i * 47) % (H - 60);
            ctx.globalAlpha = 0.9 * cloudA;
            ctx.fillRect(cx, cy, 30, 4);
            ctx.fillRect(cx + 6, cy - 3, 18, 3);
          }
          ctx.globalAlpha = 1;
        }

        // Earth at orbit
        const earthA = smooth(0.88, 1.0, alt);
        if (earthA > 0) {
          const cy = H + 300 - earthA * 262;
          const r = 300;
          ctx.fillStyle = '#05070F';
          ctx.beginPath(); ctx.arc(W / 2, cy, r, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#7A7A7A';
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(W / 2, cy, r, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
          ctx.lineWidth = 1;
          const cl = rng(555);
          for (let i = 0; i < 40; i++) {
            const lx = cl() * W, dx = lx - W / 2;
            if (Math.abs(dx) >= r - 6) continue;
            const rimY = cy - Math.sqrt(r * r - dx * dx);
            ctx.fillStyle = cl() < 0.35 ? RED : '#BFBFBF';
            ctx.fillRect(lx | 0, (rimY + 3 + cl() * 24) | 0, 1, 1);
          }
        }

        // ---- ASTEROIDS gameplay ------------------------------------------------
        // autopilot: hunt nearest rock, rotate, thrust, fire
        let target = null, best = 1e9;
        for (const rk of rocks) {
          const d = (rk.x - ship.x) ** 2 + (rk.y - ship.y) ** 2;
          if (d < best) { best = d; target = rk; }
        }
        if (target) {
          let want = Math.atan2(target.y - ship.y, target.x - ship.x);
          let diff = ((want - ship.ang + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
          ship.ang += clamp(diff, -2.6 * dt, 2.6 * dt);
          ship.thrust = Math.abs(diff) < 0.6 && best > 55 * 55;
          if (Math.abs(diff) < 0.12 && fireT <= 0) {
            bullets.push({ x: ship.x + Math.cos(ship.ang) * 8, y: ship.y + Math.sin(ship.ang) * 8, vx: Math.cos(ship.ang) * 150, vy: Math.sin(ship.ang) * 150, t: 0 });
            fireT = 0.32;
          }
        }
        fireT -= dt;
        if (ship.thrust) {
          ship.vx += Math.cos(ship.ang) * 60 * dt;
          ship.vy += Math.sin(ship.ang) * 60 * dt;
        }
        ship.vx *= 0.995; ship.vy *= 0.995;
        ship.x += ship.vx * dt; ship.y += ship.vy * dt;
        wrap(ship, 12);

        // rocks
        for (const rk of rocks) {
          rk.x += rk.vx * dt; rk.y += rk.vy * dt;
          rk.rot += rk.rotV * dt;
          wrap(rk, 18);
        }
        if (rocks.length < 4) {
          const edge = (R() * 4) | 0;
          const ex = edge === 0 ? -14 : edge === 1 ? W + 14 : R() * W;
          const ey = edge === 2 ? -14 : edge === 3 ? H + 14 : R() * H;
          rocks.push(makeRock(ex, ey, 9 + R() * 3));
        }

        // bullets + collisions (split!)
        for (let i = bullets.length - 1; i >= 0; i--) {
          const b = bullets[i];
          b.x += b.vx * dt; b.y += b.vy * dt;
          b.t += dt;
          if (b.t > 1.3) { bullets.splice(i, 1); continue; }
          for (let j = rocks.length - 1; j >= 0; j--) {
            const rk = rocks[j];
            if ((b.x - rk.x) ** 2 + (b.y - rk.y) ** 2 < rk.r * rk.r) {
              bullets.splice(i, 1);
              rocks.splice(j, 1);
              burst(rk.x, rk.y, 12);
              score += rk.r > 10 ? 100 : rk.r > 6 ? 50 : 25;
              if (rk.r > 6) {
                rocks.push(makeRock(rk.x, rk.y, rk.r * 0.55), makeRock(rk.x, rk.y, rk.r * 0.5));
              }
              break;
            }
          }
        }

        // draw rocks
        for (const rk of rocks) {
          ctx.save();
          ctx.translate(rk.x, rk.y);
          ctx.rotate(rk.rot);
          ctx.beginPath();
          for (let i = 0; i < rk.verts.length; i++) {
            const a = (i / rk.verts.length) * Math.PI * 2;
            const rr = rk.r * rk.verts[i];
            if (i === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
            else ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
          }
          ctx.closePath();
          ctx.fillStyle = '#3D3D3D';
          ctx.fill();
          ctx.strokeStyle = '#7A7A7A';
          ctx.stroke();
          ctx.fillStyle = '#2B2B2B';
          for (const c of rk.craters) {
            ctx.fillRect(Math.cos(c.a) * rk.r * c.d - 1, Math.sin(c.a) * rk.r * c.d - 1, 2, 2);
          }
          ctx.restore();
        }

        // particles
        for (let i = parts.length - 1; i >= 0; i--) {
          const p = parts[i];
          p.t += dt;
          if (p.t >= p.life) { parts.splice(i, 1); continue; }
          p.x += p.vx * dt; p.y += p.vy * dt;
          ctx.globalAlpha = 1 - p.t / p.life;
          ctx.fillStyle = p.red ? RED : '#7A7A7A';
          ctx.fillRect(p.x | 0, p.y | 0, 1, 1);
        }
        ctx.globalAlpha = 1;

        // bullets
        ctx.fillStyle = RED;
        for (const b of bullets) ctx.fillRect(b.x - 1, b.y - 1, 2, 2);

        // ship (pre-rotated frame) + thruster + shadow
        const fIdx = ((Math.round(ship.ang / (Math.PI * 2) * 16) % 16) + 16) % 16;
        ctx.globalAlpha = 0.7;
        ctx.drawImage(SHADOW[fIdx], ship.x - 12, ship.y - 12);
        ctx.globalAlpha = 1;
        ctx.drawImage(FRAMES[fIdx], ship.x - 12, ship.y - 12);
        if (ship.thrust) {
          const flick = 2 + rng((t * 55) | 0) * 3;
          ctx.save();
          ctx.translate(ship.x, ship.y);
          ctx.rotate(ship.ang + Math.PI / 2);
          ctx.fillStyle = RED;
          ctx.fillRect(-1, 6, 2, flick);
          ctx.restore();
        }

        // HUD
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, W, 14);
        ctx.fillStyle = '#2B2B2B'; ctx.fillRect(0, 14, W, 1);
        ctx.fillStyle = '#BFBFBF'; ctx.font = '6px "JetBrains Mono", monospace';
        ctx.fillText('SCORE ' + String(score).padStart(6, '0'), 4, 9);
        ctx.fillText('ALT', W - 42, 9);
        ctx.fillStyle = RED;
        ctx.fillText(String(Math.round(alt * 1000)).padStart(3, '0') + 'M', W - 26, 9);
      }

      return { render };
    },
  });
})();
