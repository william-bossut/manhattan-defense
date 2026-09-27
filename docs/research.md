# Research (2026-09-27)

## Engine comparison
| Engine | Stars | License | Fit |
|---|---|---|---|
| **Phaser 4** | 40.4k | MIT | **Chosen.** Scenes, tweens, Arcade physics, particles, camera shake, bitmap fonts, pixel-art scale mode, best Claude/AI familiarity. |
| Kaplay | 1.8k | MIT | Quick prototyping, weaker menu/UI ecosystem. |
| Excalibur.js | 2.3k | BSD-2 | Clean TS API, smaller community/less AI familiarity. |
| PixiJS | 48.2k | MIT | Renderer only — too much plumbing for scope. |
| LittleJS | 4.2k | MIT | Tiny, has `LittleJS-AI` Claude Code plugin; minimal UI support. |
| Godot 4 | 117.8k | MIT | Excellent engine but GDScript/editor-centric, awkward Tauri path. |

## Starter templates
- **`phaserjs/template-vite-ts`** (194★, MIT) — official, Phaser 4.0, has
  Boot → Preloader → MainMenu → Game → GameOver. No pause/options/high-scores
  — we add those ourselves (small job, see roadmap).
- Phaser PixUI (MIT) — pixel-art UI library (buttons, panels, layout).
- Asteroids clones on GitHub (`ourcade/asteroids-template-phaser`,
  `robbyrenz/asteroids-phaser`) — too small/unfinished to fork; core
  Asteroids logic is ~300 lines, faster to write fresh.

## Free assets (CC0/permissive)
- **Warped City** (Ansimuz, itch.io, CC0) — cyberpunk parallax city, 16×16
  tileset; purple/teal, would need recoloring toward red. Used as visual
  reference; MVP background is procedurally generated in code instead
  (no license risk, infinitely tileable/zoomable for the altitude climb).
- OpenGameArt CC0 space-shooter packs (ships, explosions).
- Fonts: **m5x7** (CC0), **Press Start 2P** (OFL).
- Sound: **ZzFX** (MIT) or **jsfxr** (Unlicense) — code-generated, no audio
  asset files needed.

## Genre comparison (why not classic Asteroids as-is)
| Genre | Fun factor | Complexity | Fit with NY skyline |
|---|---|---|---|
| Asteroids as-is | Skill-based drift/wrap | Lowest | Weak — skyline is just backdrop |
| Missile Command | Tense, clear stakes | Low | Excellent — skyline *is* the playfield |
| Defender side-scroll | Fast, radar/rescue | Medium | Very good |
| Horizontal shmup | Patterns, power-ups | Medium | Very good |
| **Hybrid (chosen)** | Asteroids feel + climbing skyline as world | Low–medium | Very good — skyline scrolls past as you climb |

Decision: keep Asteroids' moment-to-moment feel (it's the fun part) but
replace "levels" with continuous altitude-driven difficulty/scenery, so the
skyline isn't just decoration — it's the thing you're climbing through.

## Visual references (round 2, 2026-09-27)
After round 1's 4 mockups were rejected as too similar, researched 15 distinct
modern pixel-art directions, each tied to a real reference game, now built as
standalone stills in `../design/gallery.html`:

1. **Line-Art Noir** — *Visiophobia* (itch.io): white line-art on black.
2. **Hot 1-Bit + Red** — *Downwell*, *Lorelei and the Laser Eyes*: black/white + one hot red.
3. **Ordered Dither** — *Return of the Obra Dinn*, *Mars After Midnight*: 8x8 Bayer dither, 2 colors.
4. **Manga Ink / Retro OS** — *WORLD OF HORROR*: ink + screentone in an old-OS window.
5. **ASCII / Text-Mode** — *Stone Story RPG*: the whole scene built from characters.
6. **Rim-Light Silhouettes** — *Animal Well*: near-black, banded rim light only.
7. **Pixel + Real Lighting** — *The Last Night*, *REPLACED*: low-res sprites, high-res god rays/fog.
8. **Painterly Dusk** — *NORCO*, Waneella: flat color bands, no outlines, low sun.
9. **Game Boy Grid** — *Void Stranger*: strict 16px tiles, 4 greys, mostly black.
10. **Vector CRT Phosphor** — *Duskers*, Vector Arcade: glowing green wireframe, persistence trails.
11. **Neon Geometric Bloom** — *Geometry Wars 3*, *Sayonara Wild Hearts*: additive primitives, warping grid.
12. **Voxel Isometric** — *Cloudpunk*: painter's-algorithm voxel towers, emissive windows.
13. **Psychedelic Flat** — *Ultros*, *Hotline Miami*: clashing flat colors, thick outlines, hue-cycling.
14. **Transit Map** — *Mini Metro*: NYC subway-diagram abstraction, altitude zones as stations.
15. **Blueprint** — original idea (no direct reference): cyanotype technical drawing.

Full recipes (palette hex, technique, composition) are in each style's source
file under `../design/gallery/styles/`.

## Art pipeline (2026-09-27)
- `tools/prep_pixel_art.py IN OUT --factor N --colors 32 [--js OUT.js --name key]`
  turns an upscaled/compressed pixel-art image back into its native grid
  (box downscale + palette snap). `--js` embeds it as a data URL because
  Chrome blocks `getImageData` on `file://` images.
- `design/evolution/evolution.js` classifies pixels (sky = non-dark and
  reachable from the top edge; building = dark; window = non-dark enclosed
  by building) and regrades them from dusk to night.
- Art must be: a single flat image, no text, no watermark, lit windows
  clearly brighter than building walls (so the classifier can find them).

### Prompts for our own skyline (Retro Diffusion / ChatGPT image / Midjourney)
> pixel art, New York City skyline at dusk seen from across the river, Empire
> State Building and Chrysler Building clearly recognizable, Brooklyn Bridge
> in the lower right, warm orange-to-purple banded sky with pixel clouds and a
> low sun, buildings as dark purple silhouettes with many tiny 1-pixel warm
> yellow lit windows, hazy lighter distant skyline behind, dark treeline
> silhouette along the bottom, 16:9, limited palette, crisp pixels, no
> anti-aliasing, no text, no watermark, retro game background, 320x180

Variants: swap "Empire State and Chrysler" for "One World Trade Center" for
a downtown view; add "wide empty sky in the top half" to leave room for gameplay.

## Sources
- github.com/phaserjs/phaser, /template-vite-ts, /kaplayjs/kaplay,
  /excaliburjs/Excalibur, /pixijs/pixijs, /KilledByAPixel/LittleJS,
  /KilledByAPixel/ZzFX, /chr15m/jsfxr
- ansimuz.itch.io/warped-city, opengameart.org/content/cc0-space-shooter
- managore.itch.io/m5x7, fontlibrary.org (Pixel Operator, Press Start 2P)
