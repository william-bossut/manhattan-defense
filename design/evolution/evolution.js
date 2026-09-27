/* Dusk -> night evolution on a PAINTED pixel-art image (not code-drawn art).
 *
 * analyze() classifies every pixel once:
 *   sky      = not dark AND reachable from the top edge through non-dark pixels
 *              (so gaps between towers count as sky, clouds and haze too)
 *   building = dark pixel
 *   window   = non-dark pixel enclosed by building (not reachable from the top)
 * Windows are grouped into connected components so each lit window switches
 * as a whole unit.
 *
 * render(t) regrades the same pixels for t in [0,1]:
 *   sky      -> banded dark-blue ramp chosen by the pixel's own brightness,
 *               so clouds / far haze / horizon glow keep their shapes
 *   building -> cool navy ramp
 *   window   -> gold windows flip to red one by one, some switch off
 *   + stars and a pixel moon fade in late. Every pixel stays on its grid. */
(function (global) {
  'use strict';

  const DARK = 0.30; // luminance under which a pixel counts as building

  const SKY_NIGHT = ['#03040C', '#060A1A', '#0A1028', '#0E1636', '#131D46', '#1A2656', '#223068', '#2C3C7C'];
  const BLD_NIGHT = ['#04050C', '#080A18', '#0C1024', '#121834', '#1A2248'];
  const WIN_NIGHT = ['#7A1018', '#D81F26', '#FF5A4A'];
  const WIN_OFF = [10, 13, 30];

  function hex(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  const SKY_N = SKY_NIGHT.map(hex), BLD_N = BLD_NIGHT.map(hex), WIN_N = WIN_NIGHT.map(hex);

  function lum(r, g, b) { return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; }
  function smooth(a, b, v) { const x = Math.min(1, Math.max(0, (v - a) / (b - a))); return x * x * (3 - 2 * x); }
  function hash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }

  function analyze(img) {
    const W = img.width, H = img.height;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const cx = c.getContext('2d');
    cx.drawImage(img, 0, 0);
    const src = cx.getImageData(0, 0, W, H).data;
    const N = W * H;
    const L = new Float32Array(N);
    const cls = new Uint8Array(N); // 0 sky, 1 building, 2 window
    for (let i = 0; i < N; i++) L[i] = lum(src[i * 4], src[i * 4 + 1], src[i * 4 + 2]);

    // flood fill "sky" from the top row through non-dark pixels
    const isSky = new Uint8Array(N);
    const stack = [];
    for (let x = 0; x < W; x++) if (L[x] >= DARK) { isSky[x] = 1; stack.push(x); }
    while (stack.length) {
      const i = stack.pop(), x = i % W, y = (i / W) | 0;
      const nb = [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1];
      for (const j of nb) if (j >= 0 && !isSky[j] && L[j] >= DARK) { isSky[j] = 1; stack.push(j); }
    }
    for (let i = 0; i < N; i++) cls[i] = isSky[i] ? 0 : (L[i] < DARK ? 1 : 2);

    // window components (4-connected), each gets its own random switch time
    const comp = new Int32Array(N).fill(-1);
    let nComp = 0;
    for (let i = 0; i < N; i++) {
      if (cls[i] !== 2 || comp[i] >= 0) continue;
      const q = [i]; comp[i] = nComp;
      while (q.length) {
        const k = q.pop(), x = k % W, y = (k / W) | 0;
        const nb = [x > 0 ? k - 1 : -1, x < W - 1 ? k + 1 : -1, y > 0 ? k - W : -1, y < H - 1 ? k + W : -1];
        for (const j of nb) if (j >= 0 && cls[j] === 2 && comp[j] < 0) { comp[j] = nComp; q.push(j); }
      }
      nComp++;
    }
    const compRand = new Float32Array(nComp);
    for (let k = 0; k < nComp; k++) compRand[k] = hash(k + 1);

    // normalization ranges so ramps use the full band count on any image
    let sMin = 1, sMax = 0, bMin = 1, bMax = 0, wMin = 1, wMax = 0;
    for (let i = 0; i < N; i++) {
      const l = L[i];
      if (cls[i] === 0) { sMin = Math.min(sMin, l); sMax = Math.max(sMax, l); }
      else if (cls[i] === 1) { bMin = Math.min(bMin, l); bMax = Math.max(bMax, l); }
      else { wMin = Math.min(wMin, l); wMax = Math.max(wMax, l); }
    }

    // night sky value per sky pixel: mostly height (top = darkest, horizon =
    // city glow), partly the pixel's own brightness so clouds and far haze
    // keep their shapes
    const skyV = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      if (cls[i] !== 0) continue;
      const yf = Math.min(1, ((i / W) | 0) / (H * 0.8));
      skyV[i] = Math.min(0.999, Math.max(0, 0.4 * norm(L[i], sMin, sMax) + 0.6 * yf));
    }

    // stars: sparse, only where the night sky is dark and plain (not on
    // clouds: pixels that stand out from their row's typical brightness)
    const stars = [];
    const top = Math.floor(H * 0.45);
    for (let y = 1; y < top; y++) {
      const row = [];
      for (let x = 0; x < W; x++) if (cls[y * W + x] === 0) row.push(L[y * W + x]);
      row.sort((a, b) => a - b);
      const med = row.length ? row[row.length >> 1] : 0;
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        if (cls[i] === 0 && skyV[i] < 0.32 && Math.abs(L[i] - med) < 0.025 && hash(i * 7.3) < 0.011) {
          stars.push({ i, p: hash(i) * 6.28, big: hash(i * 3.1) < 0.15 });
        }
      }
    }

    return { W, H, src, L, cls, comp, compRand, nComp, sMin, sMax, bMin, bMax, wMin, wMax, skyV, stars };
  }

  function band(ramp, v) { return ramp[Math.min(ramp.length - 1, Math.max(0, Math.floor(v * ramp.length)))]; }
  function norm(v, a, b) { return b > a ? (v - a) / (b - a) : 0; }

  function render(ctx, A, t, time, opts) {
    opts = opts || {};
    const { W, H, src, L, cls, comp, compRand } = A;
    if (!A.out) A.out = ctx.createImageData(W, H);
    const out = A.out.data;
    const tSky = smooth(0.0, 0.75, t);
    const tBld = smooth(0.1, 0.85, t);

    for (let i = 0; i < W * H; i++) {
      const o = i * 4;
      let r = src[o], g = src[o + 1], b = src[o + 2];
      const k = cls[i];
      if (opts.debug) {
        const d = k === 0 ? [40, 60, 140] : k === 1 ? [20, 20, 30] : [255, 60, 60];
        out[o] = d[0]; out[o + 1] = d[1]; out[o + 2] = d[2]; out[o + 3] = 255;
        continue;
      }
      let n, m;
      if (k === 0) {
        n = band(SKY_N, A.skyV[i]); m = tSky;
      } else if (k === 1) {
        n = band(BLD_N, norm(L[i], A.bMin, A.bMax) * 0.999); m = tBld;
      } else {
        // each window flips gold -> red at its own moment, ~28% go dark
        const rnd = compRand[comp[i]];
        const start = 0.22 + rnd * 0.45;
        m = smooth(start, start + 0.12, t);
        if (rnd < 0.28) n = WIN_OFF;
        else {
          n = band(WIN_N, norm(L[i], A.wMin, A.wMax) * 0.999);
          if (rnd > 0.94 && m > 0.99) { // a few flicker at night
            const f = Math.sin(time * 0.004 + rnd * 40) > 0.6 ? 0.45 : 1;
            n = [n[0] * f, n[1] * f, n[2] * f];
          }
        }
      }
      out[o] = r + (n[0] - r) * m;
      out[o + 1] = g + (n[1] - g) * m;
      out[o + 2] = b + (n[2] - b) * m;
      out[o + 3] = 255;
    }

    if (!opts.debug) {
      // stars
      const sa = smooth(0.55, 0.95, t);
      if (sa > 0) {
        for (const s of A.stars) {
          const a = sa * (0.45 + 0.55 * Math.abs(Math.sin(time * 0.0012 + s.p)));
          putPix(out, W, H, s.i % W, (s.i / W) | 0, [220, 232, 255], a, cls);
          if (s.big && a > 0.6) {
            const x = s.i % W, y = (s.i / W) | 0;
            [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => putPix(out, W, H, x + dx, y + dy, [150, 170, 230], a * 0.5, cls));
          }
        }
      }
      // pixel moon, rising a little as it fades in
      const ma = smooth(0.5, 0.9, t);
      if (ma > 0) {
        const mx = Math.round(W * (opts.moonX || 0.2)), my = Math.round(H * 0.16 + (1 - ma) * 6), R = 5;
        for (let dy = -R - 2; dy <= R + 2; dy++) {
          for (let dx = -R - 2; dx <= R + 2; dx++) {
            const d = Math.sqrt(dx * dx + dy * dy);
            let col = null, a = ma;
            if (d <= R) col = (dx + dy > 2) ? [185, 198, 238] : [232, 238, 255];
            else if (d <= R + 2) { col = [58, 74, 140]; a = ma * 0.45; }
            if (col) putPix(out, W, H, mx + dx, my + dy, col, a, cls);
          }
        }
      }
    }
    ctx.putImageData(A.out, 0, 0);
  }

  // blend a pixel, but only over sky so stars/moon never paint on buildings
  function putPix(out, W, H, x, y, col, a, cls) {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = y * W + x;
    if (cls[i] !== 0) return;
    const o = i * 4;
    out[o] += (col[0] - out[o]) * a;
    out[o + 1] += (col[1] - out[o + 1]) * a;
    out[o + 2] += (col[2] - out[o + 2]) * a;
  }

  global.MDEvolution = { analyze, render };
})(window);
