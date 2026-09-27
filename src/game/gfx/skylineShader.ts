/* GPU version of the dusk -> night regrade (same ramps and timings as the
 * CPU renderSkyline in backgroundEvolution.ts, which stays as the fallback).
 * Needed for HD: regrading 2M pixels per frame in JS is too slow.
 *
 * Inputs: uSrc = painted skyline, uMask = buildMaskCanvas() output,
 * uT = 0 (dusk) .. 1 (night), uTime in ms, uArt = art size in pixels,
 * uMoon = moon center/radius in art pixels. */
export const SKYLINE_FRAG = `
precision highp float;

uniform sampler2D uSrc;
uniform sampler2D uMask;
uniform float uT;
uniform float uTime;
uniform vec2 uArt;
uniform vec3 uMoon; // center x, y and radius, in art pixels (picked by analyzeSkyline)

varying vec2 outTexCoord;

float smoothT (float a, float b, float v) { return smoothstep(a, b, v); }

vec3 hex (float r, float g, float b) { return vec3(r, g, b) / 255.0; }

vec3 skyRamp (float v) {
    float i = floor(clamp(v, 0.0, 0.999) * 8.0);
    if (i < 1.0) return hex(3.0, 4.0, 12.0);
    if (i < 2.0) return hex(6.0, 10.0, 26.0);
    if (i < 3.0) return hex(10.0, 16.0, 40.0);
    if (i < 4.0) return hex(14.0, 22.0, 54.0);
    if (i < 5.0) return hex(19.0, 29.0, 70.0);
    if (i < 6.0) return hex(26.0, 38.0, 86.0);
    if (i < 7.0) return hex(34.0, 48.0, 104.0);
    return hex(44.0, 60.0, 124.0);
}

vec3 bldRamp (float v) {
    float i = floor(clamp(v, 0.0, 0.999) * 5.0);
    if (i < 1.0) return hex(4.0, 5.0, 12.0);
    if (i < 2.0) return hex(8.0, 10.0, 24.0);
    if (i < 3.0) return hex(12.0, 16.0, 36.0);
    if (i < 4.0) return hex(18.0, 24.0, 52.0);
    return hex(26.0, 34.0, 72.0);
}

vec3 winRamp (float v) {
    float i = floor(clamp(v, 0.0, 0.999) * 3.0);
    if (i < 1.0) return hex(122.0, 16.0, 24.0);
    if (i < 2.0) return hex(216.0, 31.0, 38.0);
    return hex(255.0, 90.0, 74.0);
}

float hash (vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

void main () {
    // Phaser's quad texcoords already match how textures are uploaded
    // (verified in the browser: flipping v rendered the city upside down).
    vec2 uv = outTexCoord;
    vec3 src = texture2D(uSrc, uv).rgb;
    // tame the painting's very saturated dusk (same values as DUSK_SAT /
    // DUSK_BRIGHT in backgroundEvolution.ts, used by the CPU fallback)
    float gray = dot(src, vec3(0.2126, 0.7152, 0.0722));
    src = mix(vec3(gray), src, 0.72) * 0.88;
    vec4 m = texture2D(uMask, uv);
    float code = floor(m.r * 255.0 + 0.5);
    float cls = code >= 3.0 ? 0.0 : code;
    float star = code >= 3.0 ? 1.0 : 0.0;

    float tSky = smoothT(0.0, 0.75, uT);
    float tBld = smoothT(0.1, 0.85, uT);

    vec3 col;
    if (cls < 0.5) {
        col = mix(src, skyRamp(m.b), tSky);
    } else if (cls < 1.5) {
        col = mix(src, bldRamp(m.b), tBld);
    } else {
        // each window flips gold -> red at its own moment; ~28% switch off
        float rnd = m.g;
        float start = 0.22 + rnd * 0.45;
        float k = smoothT(start, start + 0.12, uT);
        vec3 night = rnd < 0.28 ? hex(10.0, 13.0, 30.0) : winRamp(m.b);
        if (rnd > 0.94 && k > 0.99 && sin(uTime * 0.004 + rnd * 40.0) > 0.6) night *= 0.45;
        col = mix(src, night, k);
    }

    // art-pixel coordinates (y down, like the analysis), so stars and moon
    // stay on the painting's grid; texcoord v is 0 at the bottom in WebGL
    vec2 p = floor(vec2(uv.x, 1.0 - uv.y) * uArt);

    if (star > 0.5) {
        float sa = smoothT(0.55, 0.95, uT);
        float a = sa * (0.45 + 0.55 * abs(sin(uTime * 0.0012 + hash(p) * 6.28)));
        col = mix(col, hex(220.0, 232.0, 255.0), a);
    }

    float ma = smoothT(0.5, 0.9, uT);
    if (ma > 0.0 && cls < 0.5) {
        float R = uMoon.z;
        vec2 mc = vec2(uMoon.x, floor(uMoon.y + (1.0 - ma) * R)); // rises slightly as it fades in
        vec2 dlt = p - mc;
        float dist = length(dlt);
        if (dist <= R) {
            vec3 mcol = (dlt.x + dlt.y > R * 0.4) ? hex(185.0, 198.0, 238.0) : hex(232.0, 238.0, 255.0);
            col = mix(col, mcol, ma);
        } else if (dist <= R + max(2.0, R * 0.35)) {
            col = mix(col, hex(58.0, 74.0, 140.0), ma * 0.45);
        }
    }

    gl_FragColor = vec4(col, 1.0);
}
`;
