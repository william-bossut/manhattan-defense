# Style Guide

Source of truth: the "Nothing"-inspired design language shared by
`open-island-linux` and the OpenBand Android app. This is **not** classic
neon-pixel cyberpunk out of the box — it's black/white/grey with exactly one
red accent, monospace type, and dot-matrix (round dot) art rather than square
pixels. For this game we deliberately hybridize it with square pixel-art and
glow/scanlines (see `decisions.md`), while keeping the palette and typography
rules strict.

## Palette (locked — do not introduce other hues)
```
--red:          #D81F26   /* the only accent — danger, UI highlight, neon */
--red-hover:    #B81920   /* pressed/hover state of the accent */
--surface-0:    #000000   /* pure black background */
--surface-1:    #0A0A0A   /* panel background */
--surface-2:    #121212
--surface-3:    #1F1F1F
--surface-4:    #2B2B2B   /* dividers */
--text-primary:   #FFFFFF
--text-secondary: #BFBFBF
--text-tertiary:  #7A7A7A
--text-disabled:  #3D3D3D
```
Sources: `open-island-linux/src/App.svelte:578-596`,
`openband-android/.../ui/theme/Color.kt:6-22`.

## Typography
- Monospace everywhere (JetBrains Mono as the practical stand-in for the
  unavailable Ndot-57/NType 82). Labels UPPERCASE with wide letter-spacing
  (0.04–0.1em) — matches both source projects exactly.
- Game-specific pixel fonts (new for this project, CC0/OFL):
  - **m5x7** (Daniel Linssen, CC0) — HUD numbers, in-game text.
  - **Press Start 2P** (OFL, via `@fontsource/press-start-2p`) — title screen only.

## Effects (new for this project — not present in the source apps)
Open Island/OpenBand have *no* scanlines, glow or CRT effects — those are
added here deliberately for arcade atmosphere, kept strictly to the red
accent so the game still reads as "on brand":
- Scanline overlay (toggle-able in Options).
- Red glow/bloom only on: player bullets, enemy eyes/lights, danger UI, thruster flame.
- Screen shake + hit-stop on impacts (borrowed rhythm from Open Island's
  single easing curve `cubic-bezier(0.2, 0, 0, 1)` — no springy motion).

## Reused patterns from the source projects
- **Dot-grid background** (`radial-gradient` texture, 14px cells) — used in
  the "Dot-Matrix HUD" variation for menu backgrounds.
- **Red pulsing ring** keyframes (`oi-ring`, `App.svelte:613-616`) — reused
  for "low health" / "incoming" warnings.
- **Grid-string sprite format** (`#`/`.` or `1`/`2` grids) and the
  `dotGlyph()` renderer (`App.svelte:287-297`) — reused for HUD icons in the
  Dot-Matrix variation, and optionally for one enemy type as a nod to
  OpenBand's RobotBuddy.
- **Button/tag/pill shapes**: solid red primary button, 18–10px corner radii,
  1px `#2B2B2B` dividers, translucent red tag backgrounds
  (`rgba(216,31,38,0.18)`).

## Four variations under review
See `../design/index.html`. All four use the palette above; they differ in
how far they lean into pixel/glow vs. dot-matrix minimalism vs. line-art:
- **A — Red Noir**: pure black, dense towers, strongest scanlines, most
  faithful to "only red exists."
- **B — Night Glow**: dark blue-grey night atmosphere, soft red bloom/fog —
  most "cyberpunk," least strict on the black-only rule (uses a near-black
  navy for depth).
- **C — Dot-Matrix HUD**: square-pixel game world, but all UI/menu chrome
  uses the literal dot-matrix system from Open Island/OpenBand — closest to
  "this looks like William's other apps."
- **D — Wireframe Noir**: added after William shared a reference game,
  *Visiophobia* (itch.io, by Intelligent_Leg8526) — a monochrome
  white-line-art-on-black platformer: no fills, thin glowing outline
  architecture, hazard hatch-marks, hanging chains, jagged silhouettes,
  sparse dust/stars. Here the city is drawn the same way (outline only,
  glowing white strokes, hatch/chain details on buildings) and red is pushed
  down to a rare, tiny accent (bullets, thruster, danger) rather than the
  dominant color — closest to "the universe" William pointed at, applied to
  our skyline-climb concept rather than copying its game.
