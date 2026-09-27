/* Pixel sprites, ported from design/gallery/sprites.js (the designs William
 * approved in round 4) so the real game uses the exact same look instead of
 * placeholder shapes. Each builder returns an HTMLCanvasElement; the caller
 * registers it as a Phaser texture with `textures.addCanvas(key, canvas)`. */

function px(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
}

// Deterministic PRNG (mulberry32) so a given seed always draws the same rock.
function rng(seed: number) {
    let s = seed >>> 0;
    return function () {
        s |= 0; s = (s + 0x6D2B79F5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// 13-wide grid, nose pointing up (-Y). Same profile as the round-4 "Racer".
export function buildShip(accent = '#D81F26'): HTMLCanvasElement {
    const W = 13, H = 18;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d')!;
    const half = [0, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 2, 2, 2];
    const center = 6;
    for (let r = 0; r < H; r++) {
        const hw = half[r];
        for (let c = center - hw; c <= center + hw; c++) {
            if (c < 0 || c >= W) continue;
            px(ctx, c, r, '#2A2E3A');
        }
        if (hw >= 2) px(ctx, center - hw + 1, r, '#4A5066');
        if (hw >= 1) { px(ctx, center - hw, r, '#14151C'); px(ctx, center + hw, r, '#14151C'); }
    }
    px(ctx, 1, 13, '#14151C'); px(ctx, 0, 14, '#14151C'); px(ctx, 1, 14, '#14151C');
    px(ctx, 11, 13, '#14151C'); px(ctx, 12, 14, '#14151C'); px(ctx, 11, 14, '#14151C');
    for (let r = 6; r <= 8; r++) for (let c = 5; c <= 7; c++) px(ctx, c, r, '#7CE8F2');
    px(ctx, 6, 7, '#DFFBFF');
    for (let r = 15; r <= 16; r++) for (let c = 5; c <= 7; c++) px(ctx, c, r, '#1A1B22');
    [2, 3, 4, 5, 10, 11].forEach((r) => { if (half[r] > 0) px(ctx, center, r, accent); });
    return cv;
}


export function buildAsteroid(seed: number, size: number): HTMLCanvasElement {
    const r = rng(seed);
    const cv = document.createElement('canvas'); cv.width = size; cv.height = size;
    const ctx = cv.getContext('2d')!;
    const c = size / 2;
    const pts = 9 + Math.floor(r() * 3);
    const radii: number[] = [];
    for (let i = 0; i < pts; i++) radii.push(size * 0.28 + r() * size * 0.16);
    ctx.beginPath();
    for (let i = 0; i <= pts; i++) {
        const a = (i / pts) * Math.PI * 2, rr = radii[i % pts];
        const x = c + Math.cos(a) * rr, y = c + Math.sin(a) * rr;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    const grad = ctx.createRadialGradient(c - size * 0.18, c - size * 0.18, 2, c, c, size * 0.55);
    grad.addColorStop(0, '#9A9AA0'); grad.addColorStop(0.6, '#5A5A62'); grad.addColorStop(1, '#2E2E34');
    ctx.fillStyle = grad; ctx.fill();
    ctx.strokeStyle = '#15151A'; ctx.lineWidth = 1; ctx.stroke();
    const craters = 3 + Math.floor(r() * 3);
    for (let i = 0; i < craters; i++) {
        const a = r() * Math.PI * 2, rr = r() * size * 0.28;
        const x = c + Math.cos(a) * rr, y = c + Math.sin(a) * rr;
        const cr = 1.2 + r() * size * 0.06;
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        ctx.beginPath(); ctx.arc(x, y, cr, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.10)';
        ctx.beginPath(); ctx.arc(x - cr * 0.3, y - cr * 0.3, cr * 0.4, 0, Math.PI * 2); ctx.fill();
    }
    return cv;
}

// Classic Asteroids flying saucer, pixel-grid like the ship: a wide hull
// with a domed cockpit on top. `big` is the common, dumb-fire saucer;
// the small one (built narrower) is the rare, sharp-shooting one.
export function buildSaucer(big: boolean, accent = '#D81F26'): HTMLCanvasElement {
    const W = big ? 21 : 15, H = big ? 11 : 8;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d')!;
    const cx = (W - 1) / 2;
    // hull: wide flat hexagon-ish saucer body, per-row half-width
    const hullRow = big ? [3, 6, 9, 9, 7, 3] : [2, 4, 6, 6, 4, 2];
    const hullY0 = H - hullRow.length;
    hullRow.forEach((hw, i) => {
        const y = hullY0 + i;
        for (let x = Math.round(cx - hw); x <= Math.round(cx + hw); x++) px(ctx, x, y, '#3A3E4C');
        px(ctx, Math.round(cx - hw), y, '#14151C');
        px(ctx, Math.round(cx + hw), y, '#14151C');
    });
    // dome cockpit
    const domeRow = big ? [1, 3, 4] : [1, 2];
    domeRow.forEach((hw, i) => {
        const y = hullY0 - domeRow.length + i;
        for (let x = Math.round(cx - hw); x <= Math.round(cx + hw); x++) px(ctx, x, y, '#7CE8F2');
        px(ctx, Math.round(cx - hw), y, '#14151C');
        px(ctx, Math.round(cx + hw), y, '#14151C');
    });
    // accent lights along the widest row
    const wide = Math.max(...hullRow);
    const lightsY = hullY0 + hullRow.indexOf(wide);
    for (let x = Math.round(cx - wide) + 1; x <= Math.round(cx + wide) - 1; x += 2) px(ctx, x, lightsY, accent);
    return cv;
}

export function buildBullet(color = '#FF3B3B'): HTMLCanvasElement {
    const cv = document.createElement('canvas'); cv.width = 3; cv.height = 3;
    const ctx = cv.getContext('2d')!;
    ctx.fillStyle = color; ctx.fillRect(0, 0, 3, 3);
    return cv;
}

/** Power-up capsule: a flat colored square with a dark outline and a small
 * symbol, kept rare and readable at tiny size. */
export function buildPickup(kind: 'rapid' | 'shield' | 'life'): HTMLCanvasElement {
    const S = 13;
    const cv = document.createElement('canvas'); cv.width = S; cv.height = S;
    const ctx = cv.getContext('2d')!;
    const base = kind === 'rapid' ? '#FFD23F' : kind === 'shield' ? '#7CE8F2' : '#D81F26';
    const dark = '#14151C';
    const round = (x: number, y: number, w: number, h: number, r: number) => {
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
    };
    round(0, 0, S, S, 3); ctx.fillStyle = dark; ctx.fill();
    round(1, 1, S - 2, S - 2, 2); ctx.fillStyle = base; ctx.fill();
    ctx.fillStyle = dark;
    if (kind === 'rapid') {
        // two small forward chevrons: ">>"
        [2, 6.4].forEach((ox) => {
            ctx.beginPath();
            ctx.moveTo(ox, 3); ctx.lineTo(ox + 3, 6.5); ctx.lineTo(ox, 10); ctx.lineTo(ox + 1.5, 6.5);
            ctx.closePath(); ctx.fill();
        });
    } else if (kind === 'shield') {
        ctx.lineWidth = 1.6; ctx.strokeStyle = dark;
        ctx.beginPath(); ctx.arc(S / 2, S / 2, 3.6, 0, Math.PI * 2); ctx.stroke();
    } else { // life: a small heart
        const cx = S / 2, cy = S / 2;
        ctx.beginPath();
        ctx.arc(cx - 1.7, cy - 1, 1.9, 0, Math.PI * 2);
        ctx.arc(cx + 1.7, cy - 1, 1.9, 0, Math.PI * 2);
        ctx.moveTo(cx - 3.4, cy - 0.3);
        ctx.lineTo(cx, cy + 3.8);
        ctx.lineTo(cx + 3.4, cy - 0.3);
        ctx.closePath(); ctx.fill();
    }
    return cv;
}

/** Soft round glow placed behind the ship (never rotated, so no jagged
 * pixels) to keep the dark hull readable against the night sky. */
export function buildGlow(size = 64, color = [201, 212, 255]): HTMLCanvasElement {
    const cv = document.createElement('canvas'); cv.width = size; cv.height = size;
    const ctx = cv.getContext('2d')!;
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    const [r, gg, b] = color;
    g.addColorStop(0, `rgba(${r},${gg},${b},0.55)`);
    g.addColorStop(0.45, `rgba(${r},${gg},${b},0.18)`);
    g.addColorStop(1, `rgba(${r},${gg},${b},0)`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
    return cv;
}
