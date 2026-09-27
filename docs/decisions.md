# Decision Log

| Date | Decision | Why |
|---|---|---|
| 2026-09-27 | Engine: Phaser 4 + TS + Vite | Best template ecosystem, pixel-art scale mode, most AI familiarity. |
| 2026-09-27 | No levels — endless, altitude-driven difficulty & background | User wants difficulty/scenery to emerge from survival time, not authored stages. |
| 2026-09-27 | Style: hybrid (square pixels + glow/scanlines, red-only accent) over pure dot-matrix or full pixel-cyberpunk | User picked "Hybrid" explicitly; keeps brand link (palette/type) while allowing genre-appropriate pixel-art juice. |
| 2026-09-27 | Genre: Asteroids controls + vertical climb ("The Ascent"), not Missile Command or Defender | User wants something simple to start, open to iterating on decor as it goes — this keeps the fun core loop but makes the skyline meaningful. |
| 2026-09-27 | Backgrounds procedurally generated, not traced from Warped City assets | Avoids license/attribution overhead, works infinitely for a continuous vertical climb, easier to recolor to the red-only accent rule. |
| 2026-09-27 | Design validation gate: 3 static HTML mockups before any Phaser code | User asked to see and correct the visual direction first; avoids building the wrong look in the real engine. |
| 2026-09-27 | Project folder: `~/Documents/vs code/manhattan-defense/` | Keeps it alongside other VS Code projects (incl. OpenBand) per user request. |
| 2026-09-27 | Added 4th mockup "Wireframe Noir" | User shared a Reddit post (r/indiegames) showing *Visiophobia* — monochrome white line-art on black — and asked for that "universe" applied to a different game. Added as a 4th variation rather than replacing A/B/C, since it changes how much red is used (rare accent vs. dominant). |
| 2026-09-27 | Round 1 (A–D) rejected — "horrible", too similar | All 4 shared one skyline/ship engine and layout, only colors differed. Moved to `_archive/round1/`, not deleted. |
| 2026-09-27 | **Stop drawing the art in code.** Backgrounds are painted pixel art (image generator / artist / asset pack); code only animates them | 6 rounds of canvas-primitive skylines never approached William's reference images — the gap is medium (illustration vs. rectangles), not tuning. |
| 2026-09-27 | Dusk → night = per-pixel regrade of the *same* painted image (sky / building / window classification), driven by altitude | Keeps painted quality, stays perfectly aligned, no need to paint two matching versions. Validated on the reference in `design/evolution/`. |
| 2026-09-27 | No parallax / moving buildings | Was added unasked (copied from the other session); William doesn't want it. The city stays still, the scene evolves. |
| 2026-09-27 | Switched to a 15-style stills gallery, no shared engine, no gameplay | Each direction researched from a real modern pixel-art game and given its own standalone renderer, so looks can't collapse into reskins of each other. User explicitly said not to build playable gameplay at this stage — iterate on stills fast instead. |
| 2026-09-27 | Difficulty: classic wave-based (more/faster asteroids each cleared wave), superseding the earlier "no levels, altitude-driven Director" design | William explicitly asked to "do like the original game with progressive difficulty" once art was approved. Background dusk→night still ties to survival *time*, kept separate from wave number. |
| 2026-09-27 | Moved from design-only to the real Phaser build; ported approved art (sprites + background regrade) directly from the design/ prototypes rather than rewriting it | Green light from William after the evolution concept landed. Reusing the exact validated code avoids re-introducing the quality regressions from earlier rounds. |
