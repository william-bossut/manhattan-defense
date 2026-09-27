/* Manhattan Defense — style gallery, shared low-level helpers only.
 * Each style file owns its own drawing code; this file deliberately does
 * NOT contain a skyline/ship/enemy renderer, so styles can't collapse into
 * reskins of one engine (that's what went wrong in round 1). */
(function (global) {
  'use strict';

  const styles = [];

  function registerStyle(def) {
    styles.push(def);
  }

  // Deterministic PRNG so a style's layout is stable across re-renders.
  function rng(seed) {
    let s = seed >>> 0;
    return function () {
      s |= 0; s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // 4x4 and 8x8 Bayer ordered-dither matrices, normalized to [0,1).
  const BAYER4_RAW = [
    [0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5],
  ];
  const BAYER8_RAW = [
    [0, 32, 8, 40, 2, 34, 10, 42], [48, 16, 56, 24, 50, 18, 58, 26],
    [12, 44, 4, 36, 14, 46, 6, 38], [60, 28, 52, 20, 62, 30, 54, 22],
    [3, 35, 11, 43, 1, 33, 9, 41], [51, 19, 59, 27, 49, 17, 57, 25],
    [15, 47, 7, 39, 13, 45, 5, 37], [63, 31, 55, 23, 61, 29, 53, 21],
  ];
  function normalizeMatrix(m) {
    const n = m.length * m[0].length;
    return m.map((row) => row.map((v) => (v + 0.5) / n));
  }
  const BAYER4 = normalizeMatrix(BAYER4_RAW);
  const BAYER8 = normalizeMatrix(BAYER8_RAW);

  // brightness in [0,1]; returns true if this pixel should be "on" (lit/ink)
  function ditherOn(x, y, brightness, matrix) {
    matrix = matrix || BAYER8;
    const m = matrix[y % matrix.length][x % matrix[0].length];
    return brightness > m;
  }

  // Fill a rect with an ordered-dither wash at a given brightness (0..1),
  // using two colors (bg already painted, this draws "on" pixels as `color`).
  function ditherRect(ctx, x0, y0, w, h, brightness, color, matrix) {
    ctx.fillStyle = color;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (ditherOn(x0 + x, y0 + y, brightness, matrix)) ctx.fillRect(x0 + x, y0 + y, 1, 1);
      }
    }
  }

  function setupCanvas(canvas, w, h) {
    canvas.width = w;
    canvas.height = h;
    canvas.style.imageRendering = 'pixelated';
    return canvas.getContext('2d');
  }

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  // Wires a grid of style thumbnails + a fullscreen animated overlay with
  // keyboard nav. Shared by gallery.html and round3.html so the click/open/
  // flip logic only lives in one place.
  function mountGallery(opts) {
    const { gridEl, styleList, overlay, bigCanvas, bigTitle, bigNote, bigRefs, bigIndex, closeBtn } = opts;
    styleList.forEach((s, i) => {
      const card = document.createElement('div');
      card.className = 'card';
      const canvas = document.createElement('canvas');
      const ctx = setupCanvas(canvas, s.res[0], s.res[1]);
      s.draw(ctx, s.res[0], s.res[1], 0);
      const refsHtml = s.refs.length
        ? s.refs.map((r) => `<a href="${r.url}" target="_blank" rel="noopener">${r.label}</a>`).join(' &middot; ')
        : 'no direct reference — original idea';
      const swatch = s.palette.map((c) => `<span style="background:${c}"></span>`).join('');
      card.innerHTML = `
        <h2><span class="idx">${String(i + 1).padStart(2, '0')}.</span> ${s.name}</h2>
        <p class="note">${s.note}</p>
        <p class="refs">${refsHtml}</p>
        <div class="swatch">${swatch}</div>
      `;
      card.querySelector('h2').after(canvas);
      card.addEventListener('click', () => open(i));
      gridEl.appendChild(card);
    });

    let current = 0, rafId = null;
    function open(i) {
      current = i;
      overlay.classList.add('open');
      render();
    }
    function close() {
      overlay.classList.remove('open');
      if (rafId) cancelAnimationFrame(rafId);
    }
    function render() {
      const s = styleList[current];
      const ctx = setupCanvas(bigCanvas, s.res[0], s.res[1]);
      bigTitle.textContent = `${String(current + 1).padStart(2, '0')}. ${s.name}`;
      bigTitle.style.fontFamily = s.titleFont || 'inherit';
      bigNote.textContent = s.note;
      bigRefs.innerHTML = s.refs.length
        ? s.refs.map((r) => `<a href="${r.url}" target="_blank" rel="noopener">${r.label}</a>`).join(' &middot; ')
        : 'no direct reference — original idea';
      bigIndex.textContent = `${current + 1} / ${styleList.length}`;
      if (rafId) cancelAnimationFrame(rafId);
      function loop(t) { s.draw(ctx, s.res[0], s.res[1], t); rafId = requestAnimationFrame(loop); }
      rafId = requestAnimationFrame(loop);
    }
    function step(delta) { current = (current + delta + styleList.length) % styleList.length; render(); }
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    window.addEventListener('keydown', (e) => {
      if (!overlay.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
      const n = parseInt(e.key, 10);
      if (!isNaN(n) && n >= 1 && n <= 9 && styleList[n - 1]) { current = n - 1; render(); }
    });
    return { open, close };
  }

  global.MDLib = { registerStyle, styles, rng, BAYER4, BAYER8, ditherOn, ditherRect, setupCanvas, lerp, clamp, mountGallery };
})(window);
