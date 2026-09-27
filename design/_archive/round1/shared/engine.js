/* Manhattan Defense — shared mockup engine
 * Not the real game code. This drives 4 standalone HTML style mockups so
 * William can compare visual directions before any Phaser/TypeScript is
 * written. Renders a procedural, altitude-driven NYC skyline (street ->
 * towers -> rooftops -> clouds -> orbit) plus a tiny playable Asteroids-style
 * ship so the "feel" can be judged, not just a static image.
 *
 * Two render modes, selected by theme.mode:
 *   'filled'    - solid building silhouettes with lit/dim windows
 *   'wireframe' - thin glowing outline architecture, hatch/chain details,
 *                 no fills (reference: "Visiophobia" — monochrome white
 *                 line-art on black, red kept as a rare, tiny accent)
 */
(function (global) {
  'use strict';

  // Structural zone keyframes. Colors live in the per-page theme, not here.
  const ZONES = [
    { alt: 0,   name: 'STREET',   density: 0.55, hMin: 0.32, hMax: 0.58, winLit: 0.35, fog: 0.55, star: 0.05, cloud: 0.00, spawnMs: 2400 },
    { alt: 25,  name: 'TOWERS',   density: 0.88, hMin: 0.55, hMax: 0.95, winLit: 0.45, fog: 0.30, star: 0.15, cloud: 0.05, spawnMs: 1700 },
    { alt: 50,  name: 'ROOFTOPS', density: 0.55, hMin: 0.18, hMax: 0.48, winLit: 0.30, fog: 0.15, star: 0.35, cloud: 0.25, spawnMs: 1200 },
    { alt: 75,  name: 'CLOUDS',   density: 0.18, hMin: 0.05, hMax: 0.18, winLit: 0.15, fog: 0.05, star: 0.60, cloud: 0.65, spawnMs: 800  },
    { alt: 100, name: 'ORBIT',    density: 0.02, hMin: 0.00, hMax: 0.04, winLit: 0.00, fog: 0.00, star: 1.00, cloud: 0.00, spawnMs: 500  },
  ];

  function blendZones(altitude) {
    const alt = Math.max(0, Math.min(100, altitude));
    for (let i = 0; i < ZONES.length - 1; i++) {
      const a = ZONES[i], b = ZONES[i + 1];
      if (alt >= a.alt && alt <= b.alt) {
        const t = (alt - a.alt) / (b.alt - a.alt);
        const lerp = (k) => a[k] + (b[k] - a[k]) * t;
        return {
          name: t < 0.5 ? a.name : b.name,
          density: lerp('density'), hMin: lerp('hMin'), hMax: lerp('hMax'),
          winLit: lerp('winLit'), fog: lerp('fog'), star: lerp('star'),
          cloud: lerp('cloud'), spawnMs: lerp('spawnMs'),
        };
      }
    }
    return Object.assign({}, ZONES[ZONES.length - 1]);
  }

  function hash01(n) {
    const x = Math.sin(n * 127.1) * 43758.5453;
    return x - Math.floor(x);
  }

  function wrap(v, max) { return ((v % max) + max) % max; }
  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

  function genBuildings(n, seedBase) {
    const arr = [];
    for (let i = 0; i < n; i++) {
      const s = seedBase + i * 17;
      arr.push({
        xFrac: hash01(s), wFrac: 0.035 + hash01(s + 1) * 0.05, hSeed: hash01(s + 2),
        winSeed: Math.floor(hash01(s + 3) * 9973),
        winCols: 2 + Math.floor(hash01(s + 4) * 3), winRows: 4 + Math.floor(hash01(s + 5) * 6),
        jag: 3 + Math.floor(hash01(s + 6) * 4), chain: hash01(s + 7) < 0.3,
      });
    }
    arr.sort((a, b) => a.xFrac - b.xFrac);
    return arr;
  }

  function createGame(canvas, theme, hud, opts) {
    opts = opts || {};
    const interactive = opts.interactive !== false;
    const spawnEnemies = opts.spawnEnemies !== false;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;

    let running = false, rafId = null, lastTime = 0, nowMs = 0;
    let altitude = opts.startAltitude || 0;
    let autoClimb = opts.autoClimb !== false;
    let score = 0, lives = 3, lastShot = 0, lastSpawn = 0, lastAutoThrust = 0;

    const farB = genBuildings(24, 101);
    const nearB = genBuildings(15, 5051);
    let scrollFar = hash01(7) * 999, scrollNear = hash01(11) * 999;

    const ship = { x: W / 2, y: H / 2, vx: 0, vy: 0, angle: -Math.PI / 2, thrust: false, lastInput: -9999 };
    let bullets = [], enemies = [], particles = [];
    const keys = {};

    function onKey(down) {
      return function (e) {
        if (!interactive) return;
        const k = e.key.toLowerCase();
        if (['arrowleft', 'arrowright', 'arrowup', ' ', 'a', 'd', 'w'].includes(k)) e.preventDefault();
        if (k === 'arrowleft' || k === 'a') keys.left = down;
        if (k === 'arrowright' || k === 'd') keys.right = down;
        if (k === 'arrowup' || k === 'w') keys.up = down;
        if (k === ' ') keys.space = down;
      };
    }
    const keydown = onKey(true), keyup = onKey(false);
    if (interactive) {
      window.addEventListener('keydown', keydown);
      window.addEventListener('keyup', keyup);
    }

    function burst(x, y, color, count) {
      count = count || 12;
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2, s = 20 + Math.random() * 70;
        particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.3 + Math.random() * 0.4, maxLife: 0.7, color });
      }
    }

    function spawnEnemy() {
      const side = Math.floor(Math.random() * 4);
      let x, y;
      if (side === 0) { x = Math.random() * W; y = -10; }
      else if (side === 1) { x = W + 10; y = Math.random() * H; }
      else if (side === 2) { x = Math.random() * W; y = H + 10; }
      else { x = -10; y = Math.random() * H; }
      const angleToCenter = Math.atan2(H / 2 - y, W / 2 - x) + (Math.random() - 0.5) * 1.4;
      const speed = 20 + Math.random() * 24;
      const r = 7 + Math.random() * 8;
      const pts = 6 + Math.floor(Math.random() * 3);
      const poly = [];
      for (let i = 0; i < pts; i++) poly.push({ a: (i / pts) * Math.PI * 2, r: r * (0.7 + Math.random() * 0.5) });
      enemies.push({ x, y, vx: Math.cos(angleToCenter) * speed, vy: Math.sin(angleToCenter) * speed, r, rot: 0, vr: (Math.random() - 0.5) * 1.5, poly });
    }

    function update(dt) {
      if (autoClimb) altitude = Math.min(100, altitude + dt * 2.6);
      const zone = blendZones(altitude);

      if (keys.left) ship.angle -= 3.2 * dt;
      if (keys.right) ship.angle += 3.2 * dt;
      ship.thrust = false;
      if (keys.up) { ship.vx += Math.cos(ship.angle) * 130 * dt; ship.vy += Math.sin(ship.angle) * 130 * dt; ship.thrust = true; }
      if (keys.left || keys.right || keys.up || keys.space) ship.lastInput = nowMs;
      if (nowMs - ship.lastInput > 2600 && nowMs - lastAutoThrust > 1500) {
        ship.vx += Math.cos(ship.angle) * 46 * dt; ship.vy += Math.sin(ship.angle) * 46 * dt;
        ship.thrust = true; lastAutoThrust = nowMs; ship.angle += (Math.random() - 0.5) * 0.7;
      }
      ship.vx *= 0.992; ship.vy *= 0.992;
      ship.x = wrap(ship.x + ship.vx * dt, W); ship.y = wrap(ship.y + ship.vy * dt, H);

      if (keys.space && nowMs - lastShot > 220) {
        bullets.push({
          x: ship.x + Math.cos(ship.angle) * 10, y: ship.y + Math.sin(ship.angle) * 10,
          vx: Math.cos(ship.angle) * 230 + ship.vx, vy: Math.sin(ship.angle) * 230 + ship.vy, life: 1.0,
        });
        lastShot = nowMs;
      }
      bullets.forEach((b) => { b.x = wrap(b.x + b.vx * dt, W); b.y = wrap(b.y + b.vy * dt, H); b.life -= dt; });
      bullets = bullets.filter((b) => b.life > 0);

      if (spawnEnemies) {
        if (nowMs - lastSpawn > zone.spawnMs && enemies.length < 14) { spawnEnemy(); lastSpawn = nowMs; }
        enemies.forEach((e) => { e.x = wrap(e.x + e.vx * dt, W); e.y = wrap(e.y + e.vy * dt, H); e.rot += e.vr * dt; });

        for (let bi = bullets.length - 1; bi >= 0; bi--) {
          for (let ei = enemies.length - 1; ei >= 0; ei--) {
            const b = bullets[bi], e = enemies[ei];
            if (dist(b, e) < e.r) {
              burst(e.x, e.y, theme.colors.red);
              enemies.splice(ei, 1); bullets.splice(bi, 1);
              score += 10 + Math.round(altitude);
              break;
            }
          }
        }
        for (let ei = enemies.length - 1; ei >= 0; ei--) {
          const e = enemies[ei];
          if (dist(ship, e) < e.r + 5) {
            burst(ship.x, ship.y, theme.colors.line || theme.colors.text);
            enemies.splice(ei, 1);
            lives = lives - 1; if (lives <= 0) lives = 3;
            ship.x = W / 2; ship.y = H / 2; ship.vx = 0; ship.vy = 0;
          }
        }
      }

      particles.forEach((p) => { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.96; p.vy *= 0.96; p.life -= dt; });
      particles = particles.filter((p) => p.life > 0);

      score += dt * 2;
      scrollFar += dt * 4; scrollNear += dt * 10;

      draw(zone);
      if (hud) hud.update({ score: Math.round(score), altitude, lives, zoneName: zone.name });
    }

    function drawBuildingLayerFilled(list, scroll, zone, alphaMul) {
      ctx.globalAlpha = alphaMul;
      list.forEach((b, i) => {
        if (hash01(i * 3 + (alphaMul > 0.9 ? 500 : 900)) > zone.density) return;
        const span = W * 1.4;
        let x = ((b.xFrac * span - scroll * (alphaMul > 0.9 ? 1 : 0.55)) % span + span) % span - W * 0.2;
        const w = b.wFrac * span;
        const hFrac = zone.hMin + (zone.hMax - zone.hMin) * b.hSeed;
        const h = hFrac * H, y = H - h;
        ctx.fillStyle = theme.colors.building;
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = theme.colors.buildingEdge;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, Math.max(0, w - 1), Math.max(0, h - 1));
        const cols = b.winCols, rows = b.winRows;
        const cw = w / (cols + 1), rh = h / (rows + 1);
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const wx = x + cw * (c + 0.7), wy = y + rh * (r + 0.7);
            const idx = b.winSeed + r * 13 + c * 7;
            const lit = hash01(idx) < zone.winLit;
            const ww = Math.max(1, cw * 0.5), wh = Math.max(1, rh * 0.42);
            if (lit) {
              const tw = 0.7 + 0.3 * Math.sin(nowMs * 0.0006 + idx);
              ctx.globalAlpha = alphaMul * tw;
              ctx.fillStyle = theme.colors.windowLit;
              if (theme.glow > 0) { ctx.shadowColor = theme.colors.windowLit; ctx.shadowBlur = theme.glow * 3; }
              ctx.fillRect(wx, wy, ww, wh);
              ctx.shadowBlur = 0;
              ctx.globalAlpha = alphaMul;
            } else {
              ctx.fillStyle = theme.colors.windowDim;
              ctx.fillRect(wx, wy, ww, wh);
            }
          }
        }
      });
      ctx.globalAlpha = 1;
    }

    function drawBuildingLayerWire(list, scroll, zone, alphaMul) {
      ctx.globalAlpha = alphaMul;
      ctx.strokeStyle = theme.colors.line;
      ctx.lineWidth = 1;
      ctx.shadowColor = theme.colors.line;
      ctx.shadowBlur = theme.glow * 3;
      list.forEach((b, i) => {
        if (hash01(i * 3 + (alphaMul > 0.9 ? 500 : 900)) > zone.density) return;
        const span = W * 1.4;
        let x = ((b.xFrac * span - scroll * (alphaMul > 0.9 ? 1 : 0.55)) % span + span) % span - W * 0.2;
        const w = b.wFrac * span;
        const hFrac = zone.hMin + (zone.hMax - zone.hMin) * b.hSeed;
        const h = hFrac * H, y = H - h;
        // jagged outline: left up, toothed top, right down
        ctx.beginPath();
        ctx.moveTo(x, H);
        ctx.lineTo(x, y);
        const teeth = b.jag;
        for (let t = 0; t <= teeth; t++) {
          const tx = x + (w * t) / teeth;
          const ty = y + (t % 2 === 0 ? 0 : hash01(b.winSeed + t) * h * 0.06);
          ctx.lineTo(tx, ty);
        }
        ctx.lineTo(x + w, H);
        ctx.stroke();
        // hazard hatch marks along the base
        const hatchN = 2 + (b.winSeed % 3);
        for (let k = 0; k < hatchN; k++) {
          const hx = x + w * (0.2 + 0.6 * hash01(b.winSeed + k * 5));
          const hy = H - h * (0.15 + 0.5 * hash01(b.winSeed + k * 9));
          ctx.beginPath();
          ctx.moveTo(hx - 3, hy - 3); ctx.lineTo(hx + 3, hy + 3);
          ctx.moveTo(hx + 3, hy - 3); ctx.lineTo(hx - 3, hy + 3);
          ctx.stroke();
        }
        // occasional hanging chain (dotted vertical line)
        if (b.chain) {
          const cx = x + w * 0.5;
          const len = h * (0.3 + 0.4 * hash01(b.winSeed));
          ctx.save();
          ctx.setLineDash([2, 3]);
          ctx.beginPath(); ctx.moveTo(cx, y); ctx.lineTo(cx, y + len); ctx.stroke();
          ctx.restore();
        }
      });
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }

    function drawClouds(intensity) {
      ctx.globalAlpha = Math.min(0.5, intensity * 0.6);
      ctx.fillStyle = theme.colors.cloud || '#ffffff';
      const n = Math.round(intensity * 9);
      for (let i = 0; i < n; i++) {
        const cx = ((hash01(i * 31 + 1) * W * 1.6 - scrollNear * 0.15) % (W * 1.6) + W * 1.6) % (W * 1.6) - W * 0.3;
        const cy = hash01(i * 17 + 2) * H * 0.5;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 16 + hash01(i) * 12, 5 + hash01(i + 5) * 3, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function drawShip() {
      ctx.save();
      ctx.translate(ship.x, ship.y);
      ctx.rotate(ship.angle);
      ctx.strokeStyle = theme.colors.line || theme.colors.text;
      ctx.lineWidth = 1.4;
      ctx.shadowColor = theme.colors.red;
      ctx.shadowBlur = theme.glow * 5;
      ctx.beginPath();
      ctx.moveTo(9, 0); ctx.lineTo(-7, 5); ctx.lineTo(-4, 0); ctx.lineTo(-7, -5); ctx.closePath();
      ctx.stroke();
      ctx.shadowBlur = 0;
      if (ship.thrust) {
        ctx.strokeStyle = theme.colors.red;
        ctx.beginPath();
        ctx.moveTo(-4, 0); ctx.lineTo(-7 - Math.random() * 5, 0);
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawEnemy(e) {
      ctx.save();
      ctx.translate(e.x, e.y); ctx.rotate(e.rot);
      ctx.strokeStyle = theme.colors.textSecondary || theme.colors.line;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      e.poly.forEach((pt, i) => {
        const px = Math.cos(pt.a) * pt.r, py = Math.sin(pt.a) * pt.r;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.closePath(); ctx.stroke();
      ctx.restore();
    }

    function draw(zone) {
      ctx.clearRect(0, 0, W, H);
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, theme.colors.bg0); g.addColorStop(1, theme.colors.bg1);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

      const starCount = Math.round(zone.star * 60);
      ctx.fillStyle = theme.colors.star;
      for (let i = 0; i < starCount; i++) {
        const sx = ((hash01(i * 13 + 1) * W + scrollFar * 0.04) % W + W) % W;
        const sy = hash01(i * 7 + 2) * H * 0.72;
        const tw = 0.35 + 0.65 * Math.abs(Math.sin(nowMs * 0.0011 + i));
        ctx.globalAlpha = tw * 0.9;
        ctx.fillRect(sx, sy, 1.4, 1.4);
      }
      ctx.globalAlpha = 1;

      if (theme.mode === 'wireframe') {
        drawBuildingLayerWire(farB, scrollFar, zone, 0.5);
        drawBuildingLayerWire(nearB, scrollNear, zone, 1.0);
      } else {
        drawBuildingLayerFilled(farB, scrollFar, zone, 0.55);
        drawBuildingLayerFilled(nearB, scrollNear, zone, 1.0);
      }

      if (zone.fog > 0.001) {
        const fg = ctx.createLinearGradient(0, H * 0.5, 0, H);
        fg.addColorStop(0, `rgba(${theme.colors.fog}, 0)`);
        fg.addColorStop(1, `rgba(${theme.colors.fog}, ${zone.fog})`);
        ctx.fillStyle = fg; ctx.fillRect(0, 0, W, H);
      }
      if (zone.cloud > 0.05) drawClouds(zone.cloud);

      particles.forEach((p) => {
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
      });
      ctx.globalAlpha = 1;

      if (spawnEnemies) enemies.forEach(drawEnemy);

      ctx.fillStyle = theme.colors.red;
      ctx.shadowColor = theme.colors.red;
      ctx.shadowBlur = theme.glow * 9;
      bullets.forEach((b) => ctx.fillRect(b.x - 1.5, b.y - 1.5, 3, 3));
      ctx.shadowBlur = 0;

      drawShip();

      if (theme.vignette > 0) {
        const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.75);
        vg.addColorStop(0, 'rgba(0,0,0,0)');
        vg.addColorStop(1, `rgba(0,0,0,${theme.vignette})`);
        ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
      }
    }

    function loop(t) {
      if (!running) return;
      nowMs = t;
      const dt = Math.min(0.033, (t - (lastTime || t)) / 1000);
      lastTime = t;
      update(dt);
      rafId = requestAnimationFrame(loop);
    }

    return {
      start() { if (running) return; running = true; lastTime = 0; rafId = requestAnimationFrame(loop); },
      stop() { running = false; if (rafId) cancelAnimationFrame(rafId); if (interactive) { window.removeEventListener('keydown', keydown); window.removeEventListener('keyup', keyup); } },
      setAltitude(v) { altitude = Math.max(0, Math.min(100, v)); },
      setAutoClimb(v) { autoClimb = !!v; },
      getAltitude() { return altitude; },
    };
  }

  global.MDEngine = { createGame, blendZones, ZONES };
})(window);
