/* Dusk -> night background evolution, ported from design/evolution/evolution.js
 * (validated with William there before this port). Classifies every pixel of
 * a painted skyline image once (sky / building / window), then regrades the
 * same pixels continuously as `t` (0 = dusk, 1 = night) increases. See that
 * file's header comment for the full rationale. */

const DARK = 0.30;

// The painted dusk is very saturated; both render paths tone it down a bit
// before grading toward night (keep in sync with skylineShader.ts).
const DUSK_SAT = 0.72;
const DUSK_BRIGHT = 0.88;

const SKY_NIGHT = ['#03040C', '#060A1A', '#0A1028', '#0E1636', '#131D46', '#1A2656', '#223068', '#2C3C7C'];
const BLD_NIGHT = ['#04050C', '#080A18', '#0C1024', '#121834', '#1A2248'];
const WIN_NIGHT = ['#7A1018', '#D81F26', '#FF5A4A'];
const WIN_OFF: [number, number, number] = [10, 13, 30];

function hex(h: string): [number, number, number] {
    const n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const SKY_N = SKY_NIGHT.map(hex), BLD_N = BLD_NIGHT.map(hex), WIN_N = WIN_NIGHT.map(hex);

function lum(r: number, g: number, b: number) { return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; }
function smooth(a: number, b: number, v: number) { const x = Math.min(1, Math.max(0, (v - a) / (b - a))); return x * x * (3 - 2 * x); }
function hash(n: number) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
function band(ramp: [number, number, number][], v: number) { return ramp[Math.min(ramp.length - 1, Math.max(0, Math.floor(v * ramp.length)))]; }
function norm(v: number, a: number, b: number) { return b > a ? (v - a) / (b - a) : 0; }

export interface SkylineAnalysis {
    W: number; H: number;
    src: Uint8ClampedArray;
    L: Float32Array;
    cls: Uint8Array; // 0 sky, 1 building, 2 window
    comp: Int32Array;
    compRand: Float32Array;
    sMin: number; sMax: number; bMin: number; bMax: number; wMin: number; wMax: number;
    skyV: Float32Array;
    stars: { i: number; p: number; big: boolean }[];
    /** moon center + radius in art pixels, placed on the clearest patch of sky */
    moon: { x: number; y: number; r: number };
    out?: ImageData;
}

export function analyzeSkyline(img: HTMLImageElement): SkylineAnalysis {
    const W = img.naturalWidth, H = img.naturalHeight;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const cx = c.getContext('2d')!;
    cx.drawImage(img, 0, 0);
    const src = cx.getImageData(0, 0, W, H).data;
    const N = W * H;
    const L = new Float32Array(N);
    const cls = new Uint8Array(N);
    for (let i = 0; i < N; i++) L[i] = lum(src[i * 4], src[i * 4 + 1], src[i * 4 + 2]);

    const isSky = new Uint8Array(N);
    const stack: number[] = [];
    for (let x = 0; x < W; x++) if (L[x] >= DARK) { isSky[x] = 1; stack.push(x); }
    while (stack.length) {
        const i = stack.pop()!; const x = i % W; const y = (i / W) | 0;
        const nb = [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1];
        for (const j of nb) if (j >= 0 && !isSky[j] && L[j] >= DARK) { isSky[j] = 1; stack.push(j); }
    }
    for (let i = 0; i < N; i++) cls[i] = isSky[i] ? 0 : (L[i] < DARK ? 1 : 2);

    const comp = new Int32Array(N).fill(-1);
    let nComp = 0;
    for (let i = 0; i < N; i++) {
        if (cls[i] !== 2 || comp[i] >= 0) continue;
        const q = [i]; comp[i] = nComp;
        while (q.length) {
            const k = q.pop()!; const x = k % W; const y = (k / W) | 0;
            const nb = [x > 0 ? k - 1 : -1, x < W - 1 ? k + 1 : -1, y > 0 ? k - W : -1, y < H - 1 ? k + W : -1];
            for (const j of nb) if (j >= 0 && cls[j] === 2 && comp[j] < 0) { comp[j] = nComp; q.push(j); }
        }
        nComp++;
    }
    // Real windows are small. A huge enclosed bright region is something
    // else (e.g. sunlit river water boxed in by a bridge and trees), so it
    // is treated as sky and follows the sky/horizon ramp instead of
    // flipping to a giant red "window".
    const compSize = new Int32Array(nComp);
    for (let i = 0; i < N; i++) if (comp[i] >= 0) compSize[comp[i]]++;
    const maxWin = N * 0.0015;
    for (let i = 0; i < N; i++) {
        if (comp[i] >= 0 && compSize[comp[i]] > maxWin) { cls[i] = 0; comp[i] = -1; }
    }

    const compRand = new Float32Array(nComp);
    for (let k = 0; k < nComp; k++) compRand[k] = hash(k + 1);

    let sMin = 1, sMax = 0, bMin = 1, bMax = 0, wMin = 1, wMax = 0;
    for (let i = 0; i < N; i++) {
        const l = L[i];
        if (cls[i] === 0) { sMin = Math.min(sMin, l); sMax = Math.max(sMax, l); }
        else if (cls[i] === 1) { bMin = Math.min(bMin, l); bMax = Math.max(bMax, l); }
        else { wMin = Math.min(wMin, l); wMax = Math.max(wMax, l); }
    }

    const skyV = new Float32Array(N);
    for (let i = 0; i < N; i++) {
        if (cls[i] !== 0) continue;
        const yf = Math.min(1, ((i / W) | 0) / (H * 0.8));
        skyV[i] = Math.min(0.999, Math.max(0, 0.4 * norm(L[i], sMin, sMax) + 0.6 * yf));
    }

    const stars: { i: number; p: number; big: boolean }[] = [];
    const top = Math.floor(H * 0.45);
    // the 0.011 per-pixel rate was tuned on a 266x178 image; keep the same
    // stars-per-screen density on bigger art instead of 30x more stars
    const starP = Math.min(0.011, 0.011 * 2 * (266 * 178) / N);
    for (let y = 1; y < top; y++) {
        const row: number[] = [];
        for (let x = 0; x < W; x++) if (cls[y * W + x] === 0) row.push(L[y * W + x]);
        row.sort((a, b) => a - b);
        const med = row.length ? row[row.length >> 1] : 0;
        for (let x = 0; x < W; x++) {
            const i = y * W + x;
            if (cls[i] === 0 && skyV[i] < 0.32 && Math.abs(L[i] - med) < 0.025 && hash(i * 7.3) < starP) {
                stars.push({ i, p: hash(i) * 6.28, big: hash(i * 3.1) < 0.15 });
            }
        }
    }

    // moon: the candidate disc (upper 35% of the image) covering the most
    // plain sky, so it never ends up hidden behind dark clouds or towers;
    // mild preference for the left side, away from the usual tall spires
    const r = Math.max(4, Math.floor(W * 0.019));
    let moon = { x: Math.floor(W * 0.2), y: Math.floor(H * 0.16), r }, best = -Infinity;
    // start below the top ~12%: cover-fitting 3:2 art on a 16:9 screen crops ~8% off the top
    for (let cy = Math.max(r + 2, Math.floor(H * 0.12) + r); cy < H * 0.35; cy += Math.max(2, r >> 1)) {
        for (let cx2 = r + 2; cx2 < W - r - 2; cx2 += Math.max(2, r >> 1)) {
            let sky = 0, tot = 0;
            for (let dy = -r; dy <= r; dy += 2) for (let dx = -r; dx <= r; dx += 2) {
                if (dx * dx + dy * dy > r * r) continue;
                tot++;
                if (cls[(cy + dy) * W + cx2 + dx] === 0) sky++;
            }
            const score = sky / tot - 0.15 * Math.abs(cx2 / W - 0.2);
            if (score > best) { best = score; moon = { x: cx2, y: cy, r }; }
        }
    }

    return { W, H, src, L, cls, comp, compRand, sMin, sMax, bMin, bMax, wMin, wMax, skyV, stars, moon };
}

/** Encode the per-pixel analysis into an RGBA canvas for the GPU regrade
 * (see skylineShader.ts). Alpha stays 255: canvas premultiplies alpha, which
 * would corrupt the data. Channels:
 *   R = class (0 sky, 1 building, 2 window, 3 star-on-sky)
 *   G = window's random switch value (windows only)
 *   B = normalized level: night-sky value (sky), luminance (building/window) */
export function buildMaskCanvas (A: SkylineAnalysis): HTMLCanvasElement
{
    const { W, H, L, cls, comp, compRand } = A;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const ctx = c.getContext('2d')!;
    const img = ctx.createImageData(W, H);
    const d = img.data;
    const isStar = new Uint8Array(W * H);
    for (const s of A.stars) isStar[s.i] = 1;
    for (let i = 0; i < W * H; i++) {
        const o = i * 4, k = cls[i];
        let b: number;
        if (k === 0) b = A.skyV[i];
        else if (k === 1) b = norm(L[i], A.bMin, A.bMax);
        else b = norm(L[i], A.wMin, A.wMax);
        d[o] = k === 0 && isStar[i] ? 3 : k;
        d[o + 1] = k === 2 ? Math.round(compRand[comp[i]] * 255) : 0;
        d[o + 2] = Math.round(Math.min(1, Math.max(0, b)) * 255);
        d[o + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return c;
}

function putPix(out: Uint8ClampedArray, W: number, H: number, x: number, y: number, col: number[], a: number, cls: Uint8Array) {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = y * W + x;
    if (cls[i] !== 0) return;
    const o = i * 4;
    out[o] += (col[0] - out[o]) * a;
    out[o + 1] += (col[1] - out[o + 1]) * a;
    out[o + 2] += (col[2] - out[o + 2]) * a;
}

export function renderSkyline(ctx: CanvasRenderingContext2D, A: SkylineAnalysis, t: number, time: number) {
    const { W, H, src, L, cls, comp, compRand } = A;
    if (!A.out) A.out = ctx.createImageData(W, H);
    const out = A.out.data;
    const tSky = smooth(0.0, 0.75, t);
    const tBld = smooth(0.1, 0.85, t);

    for (let i = 0; i < W * H; i++) {
        const o = i * 4;
        const gray0 = 0.2126 * src[o] + 0.7152 * src[o + 1] + 0.0722 * src[o + 2];
        const r0 = (gray0 + (src[o] - gray0) * DUSK_SAT) * DUSK_BRIGHT;
        const g0 = (gray0 + (src[o + 1] - gray0) * DUSK_SAT) * DUSK_BRIGHT;
        const b0 = (gray0 + (src[o + 2] - gray0) * DUSK_SAT) * DUSK_BRIGHT;
        const k = cls[i];
        let n: number[], m: number;
        if (k === 0) {
            n = band(SKY_N, A.skyV[i]); m = tSky;
        } else if (k === 1) {
            n = band(BLD_N, norm(L[i], A.bMin, A.bMax) * 0.999); m = tBld;
        } else {
            const rnd = compRand[comp[i]];
            const start = 0.22 + rnd * 0.45;
            m = smooth(start, start + 0.12, t);
            if (rnd < 0.28) n = WIN_OFF;
            else {
                n = band(WIN_N, norm(L[i], A.wMin, A.wMax) * 0.999);
                if (rnd > 0.94 && m > 0.99) {
                    const f = Math.sin(time * 0.004 + rnd * 40) > 0.6 ? 0.45 : 1;
                    n = [n[0] * f, n[1] * f, n[2] * f];
                }
            }
        }
        out[o] = r0 + (n[0] - r0) * m;
        out[o + 1] = g0 + (n[1] - g0) * m;
        out[o + 2] = b0 + (n[2] - b0) * m;
        out[o + 3] = 255;
    }

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
    const ma = smooth(0.5, 0.9, t);
    if (ma > 0) {
        const R = A.moon.r, mx = A.moon.x, my = Math.round(A.moon.y + (1 - ma) * R);
        for (let dy = -R - 2; dy <= R + 2; dy++) {
            for (let dx = -R - 2; dx <= R + 2; dx++) {
                const d = Math.sqrt(dx * dx + dy * dy);
                let col: number[] | null = null, a = ma;
                if (d <= R) col = (dx + dy > 2) ? [185, 198, 238] : [232, 238, 255];
                else if (d <= R + 2) { col = [58, 74, 140]; a = ma * 0.45; }
                if (col) putPix(out, W, H, mx + dx, my + dy, col, a, cls);
            }
        }
    }
    ctx.putImageData(A.out, 0, 0);
}
