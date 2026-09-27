# Devlog

## 2026-09-27 (later) — Round 2 style gallery
- William wasn't satisfied with round 1 and asked for modern pixel-game
  references worth emulating. GitHub sweep findings (stars checked via API):
  best on-brief open-source references are **a327ex/BYTEPATH** (1.5k★,
  Asteroids-like juice), **a327ex/SNKRX** (2k★), **TerryCavanagh/VVVVVV**
  (8k★, flat + one accent), **taisei-project/taisei** (1.6k★, bullet
  hierarchy). Best non-OSS visual references: **Downwell** (black/white/red,
  vertical — the palette twin), **ZeroRanger** (one-accent shmup),
  **Katana ZERO** & **The Last Night** (neo-noir city + red neon),
  **eBoy / 1041uuu** (pixel city art).
- Built `design/gallery/` round 2: `index.html` + 4 self-contained renderers
  in `styles/` (deliberately no shared scene renderer — round 1's failure).
  - **A Downwell NY** — 1-bit filled silhouettes + Bayer dither, red only on
    bullets/cores/beacons/thruster. Orbit = black Earth, white rim, red city
    lights.
  - **B Neon Noir** — navy near-black, dim window grids, red neon with
    shadowBlur bloom, rain, wet-street smear. Breaks the black-only rule
    deliberately (the "atmosphere" option).
  - **C eBoy Diorama** — 4 greys, max detail: water towers, fire escapes,
    billboards (red heart / NY / cola stripes), steam vents, taxis.
  - **D BYTEPATH Vector** — outline-rect city, all juice: glow, particles,
    hit-flash, live bullet/enemy collisions.
- Verified with headless Brave screenshots at street/towers/rooftops/orbit.
  Fixed two bugs found that way: eboy float coords crashing `ditherOn`
  (killed the shared rAF loop → black panel D), and a ctx.save/restore
  imbalance in bytepath's screen shake.
- **Note**: a second agent session concurrently wrote 15 more styles
  (`styles/01-*.js … 15-*.js`) using a *different* contract
  (`draw(ctx,w,h,t)`, 384×216 landscape, no altitude; several off-palette —
  magenta/cyan/yellow). They are NOT loaded by `gallery/index.html`; if that
  session writes its own `index.html` it will overwrite ours.

## 2026-09-27 (later still) — Rework style C per feedback
- User picked **style C** (eBoy Diorama) but asked for:
  1. Better ship + asteroids.
  2. More obviously NY (landmarks).
  3. Dusk → dark-blue-night sky transition, windows turning red as night falls
     (inspired by the two downloaded sunset-city references).
  4. Confirm real **Asteroids** feel: ship with inertia/rotation/screen-wrap,
     rocks coming from every direction, splitting on hit.
- Reworked `design/gallery/styles/eboy.js`:
  - Sky: crepuscule gradient at street with a striped sun + radial glow, fading
    to dark blue night as altitude rises.
  - Added recognizable NYC landmarks: Empire State (setbacks + red crown),
    Chrysler (tiered crown), One WTC (antenna + beacon), suspension bridge
    with red deck/tower lights.
  - Windows now light up red as night falls; crown/spire lights are on at dusk.
  - Hot red top rims on landmarks at sunset (matches reference images).
  - New 11×11 pixel ship sprite with black drop-shadow, red cockpit, red
    thruster, pre-rotated 16 frames.
  - New asteroids: irregular vertex jitter, tumbling, wrap from all edges,
    live collision + split into smaller rocks + particle bursts + score tally.
  - Ship autopilot hunts rocks and fires, demonstrating the gameplay loop.
- Verified with headless screenshots at 40M (street/dusk), 550M (rooftops/night).

## 2026-09-27 — Kickoff & design validation
- Explored Open Island / OpenBand for shared visual language: it's a
  "Nothing"-inspired dot-matrix system (black/white/grey + one red accent
  `#D81F26`), not pixel art or cyberpunk-neon out of the box.
- Researched engines/templates/assets on GitHub: chose Phaser 4 + Vite + TS,
  starting from `phaserjs/template-vite-ts`.
- Landed on concept "The Ascent": Asteroids-style controls, no levels,
  endless altitude-driven difficulty and a progressively-changing skyline
  background (street → towers → rooftops → clouds → orbit).
- Set up project folder at `~/Documents/vs code/manhattan-defense/` with
  `docs/` (this log + concept/style-guide/research/decisions/roadmap).
- Built 3 standalone HTML mockups (`design/`) for William to compare before
  any Phaser code is written: Red Noir, Night Glow, Dot-Matrix HUD. Each has
  a title menu, a live gameplay scene, and an altitude slider to preview the
  skyline progression.
- Verified all 4 pages render correctly (served locally, checked in
  Chrome): palette, skyline, ship, glow/scanlines per variant all look
  right. One false alarm while testing: the on-screen score/altitude
  counters looked frozen, traced to the automation browser tab not being
  focused (Chrome throttles `requestAnimationFrame` for background tabs) —
  not a real bug; confirmed the sim (spawns, movement, collisions) was
  still advancing on the frames that did run. Not an issue in a normal,
  focused browser tab.
- **Round 1 rejected**: William called it "horrible" and correctly identified
  why — all 4 mockups shared one engine/layout and only swapped colors, and
  I'd wasted effort making them playable when he only wanted to compare
  looks. Archived to `design/_archive/round1/` (not deleted).
- **Round 2**: researched 15 modern pixel-art directions (each tied to a real
  reference game — Downwell, Obra Dinn, Animal Well, The Last Night,
  Duskers, Cloudpunk, Mini Metro, etc.), each given its **own standalone
  renderer** (no shared skyline/ship engine this time) so the looks can't
  collapse into reskins of each other. Built as static/lightly-animated key
  art stills only — no gameplay, no controls, per William's explicit ask.
  Delivered as `design/gallery.html`: a grid of all 15, click-to-fullscreen,
  arrow keys to flip through. Verified all 15 render with no console errors
  and read as genuinely different techniques (line-art, 1-bit, dither,
  ASCII, rim-light, isometric voxel, transit-map diagram, etc.).
- William's verdict on round 2: still rough/ugly as *execution*, but picked
  **#7 "Pixel + Real Lighting"** as the direction to develop. Asked for more
  variations within it, more developed, and for the ship and asteroids to
  actually be designed rather than placeholder triangles/polygons.
- **Round 3** (`design/round3.html`): built real pixel sprites —
  `gallery/sprites.js` (a rocket with cockpit/fins/red or cyan accent stripe,
  built from a half-width profile so it's a clean symmetric silhouette, plus
  2 asteroid sizes with radial-gradient shading and craters, for the
  split-in-two mechanic). Factored the recipe from #7 into `gallery/round3/
  base.js` (city/god-rays/reflection/stars/rain helpers) so 7 mood variations
  could reuse it instead of copy-pasting: Cinematic Base, Sodium Dawn, Neon
  Deep Night, Storm & Rain (animated rain + lightning), Canyon Close-Up
  (low-altitude, tight framing), High Orbit Approach (far end of the climb),
  Red Alert (danger state, red pushed to dominant). Verified all 7 render
  with no console errors and the sprites read clearly at both thumbnail and
  fullscreen zoom.
- William's read on round 3: liked **Red Alert**, but the sky was too red
  (wanted dark blue back) and asked for more ship/asteroid variety plus a
  properly developed, recognizable NYC skyline — not "just towers" —
  reusable in the real game later.
- **Round 4** (`design/round4.html`):
  - `gallery/sprites.js` extended with 3 more ship silhouettes (Gunship,
    Scout, Interceptor, alongside the existing Racer) and 2 more
    debris/hazard types (angular metal debris with a blink beacon, a
    glowing faceted crystal hazard), all shown zoomed in a sprite showcase
    at the top of the page.
  - `gallery/round4/landmarks.js`: hand-authored (not procedural) NYC
    landmarks meant to be reused as-is — Empire State (setback tiers +
    mooring-mast tip light), Chrysler (terraced art-deco crown with
    sunburst windows + spire beacon), One World Trade (tapering glass
    obelisk + antenna), Flatiron (wedge silhouette), Brooklyn Bridge
    (Gothic-arch towers cut with `destination-out`, sagging cable
    quadratics) in the extreme foreground. `drawSkyline()` composes all of
    it plus dimmer filler buildings with the odd rooftop water tower.
  - Rebuilt Red Alert with a navy sky (`s2-red-alert-navy.js`) — red is now
    a sweeping beacon glow + pulse overlay + HUD text, not the sky itself —
    plus 2 more mood variants using the same real skyline (Cinematic,
    Neon Deep Night) so it can be judged under different lighting.
  - First render: Empire State/One WTC blended into the filler skyline
    (near-identical navy tones). Fixed by lightening the landmark body/edge
    colors so they read as distinct focal structures; re-verified via
    zoomed screenshot — Chrysler, Empire State and One WTC are now clearly
    legible, Flatiron is still the weakest link at a distance.
- **Coordination note**: a second Claude Code session has been working on
  this same project concurrently and built its own, differently-structured
  "round 2" at `design/gallery/index.html` (4 styles: Downwell NY, Neon
  Noir, eBoy Diorama, BYTEPATH Vector — different draw contract, own
  research in this same devlog above). It does not overwrite this session's
  files (different filenames throughout), but the two `design/gallery*`
  entry points now coexist and could confuse whoever opens the folder next.
  Flagged to William; not resolved by this session.
- William's read on round 4: ships/asteroids are good, keep them as-is; the
  backgrounds themselves were still bad ("really sucks"). Told me to look at
  the other session's 4 styles for the perspective work, and dropped 2 AI-
  generated pixel-art NYC reference images in `~/Downloads/` — bold dark
  outlines on every silhouette, dense tall lit-window columns (not scattered
  dots), banded pixel sky, a hero setback tower — asked for that quality
  bar, but dark-blue/night instead of their sunset, and red windows instead
  of yellow.
- **Round 5** (`design/round5.html`): rebuilt the skyline renderer from
  scratch against those 2 references (copied into `gallery/round5/refs/`
  and shown at the top of the page for direct comparison):
  - `gallery/round5/skyline2.js` — bold 1px ink outline on every silhouette,
    `windowColumns()` (tall red-lit rectangle columns with mullion gaps,
    replacing the old scattered-dot windows), a banded (not smooth-gradient)
    night sky with a glowing moon and flat pixel clouds, a hero setback
    tower + 2 flanking towers (one Chrysler-lite pointed cap, one plain
    antenna), a suspension bridge in the foreground (pylons + converging
    cables), a foreground treeline silhouette.
  - Kept round 4's ship/asteroid sprites completely unchanged, per William.
  - 3 mood variants (Manhattan, Close-Up, Deep Blue) at 320×208, all dark
    navy sky / red windows.
  - **Self-caught bug before showing him**: first render, the hero tower
    read as a flat white triangle (a flanking decorative cap was more
    visually prominent than the actual setback tower, whose tiers were too
    fine to read at the original 240×156 resolution and used the same body
    color as the surrounding filler buildings). Fixed by simplifying to 4
    bolder tiers, bumping canvas res to 320×208, giving the hero tower its
    own lighter `heroColor`, and shrinking the flanking towers so they don't
    upstage it. Also caught the ship blending invisibly into the dark sky
    and added a soft radial halo behind it. Re-verified via zoomed
    screenshot before delivering.
- **Note**: this round only builds one hero tower + 2 flanking towers (not
  round 4's 4 named landmarks + bridge) — a scope trade-off to hit the
  reference's density/quality bar quickly. If William wants Empire
  State/Chrysler/One WTC all recognizable at once, that's a follow-up, not
  done yet.
- William's read on round 5: still frustrated — "the towers are still
  awful," wanted the parallax "perspective" effect he saw in the other
  session's 4 styles, and asked for a continuous dusk (gold windows) → dark
  blue night (red windows) transition instead of a single static mood.
- Re-read the other session's `bytepath.js`/`neon-noir.js`/`eboy.js`:
  their "perspective" is 3 building layers with different parallax speeds
  (`par: 0.4/0.7/1.0`) scrolling at different rates — not a literal vanishing
  point. Re-examined reference image 2 closely: the hero tower is a
  **slender, mostly-uniform shaft** with *one* subtle setback near the top
  and a small crown — nothing like round 5's 4 fat pyramid tiers, which is
  almost certainly what read as "awful."
- **Round 6** (`design/round6.html`):
  - `gallery/round6/skyline3.js`: redesigned hero tower (uniform shaft,
    pilaster lines, one setback into a small crown, thin mast) at a proper
    slender aspect ratio, fine dense `windowGrid()` (small near-square
    cells) replacing round 5's wide bar-columns; 3 parallax layers now
    drift horizontally at independent speeds; a `climb` value (looping via
    `sin`) crossfades every color — sky bands, window color (gold→red),
    moon/sun disc, clouds — between full `dusk` and `night` palettes.
  - Ships/asteroids still untouched.
  - **Bug caught before showing him**: passing `cycleSpeed: 0` to pin a
    state fell back to the default speed anyway, because `opts.cycleSpeed
    || 0.00014` treats `0` as falsy — so the "pinned" dusk/night snapshots
    silently drifted through the cycle instead of holding still. Fixed with
    an explicit `!= null` check; re-verified by holding the night-pinned
    view open for 6+ real seconds and confirming the colors no longer
    moved.
- William's read on round 6: "why is there a tower who moves and not the
  others," and flagged a specific screenshot of the flanking tower's cap
  looking like "a weird grey thing." Both were real bugs, not taste:
  - Only the far/mid filler layers were ever wired into the parallax
    scroll — the hero tower, its flanking towers, and the foreground filler
    buildings were drawn through a separate code path with no offset at
    all, so the background silently slid while the whole foreground sat
    frozen. Fixed by giving that group its own motion too (a bounded
    side-to-side sway, since the hero is a unique set piece rather than a
    repeating filler that can wrap-scroll) — nothing on screen is static
    now.
  - The flank tower's pointed cap was hardcoded to a fixed cool blue-grey
    (`#8A93B8`) regardless of the dusk/night crossfade, so in the warm dusk
    scene it read as an undefined, mismatched grey blob. Added `cap` to
    both the `DUSK` and `NIGHT` palettes (warm stone tan vs. pale slate)
    and lerp it like every other color.
  - Re-verified both in the browser: watched the fullscreen loop for
    several seconds and confirmed the hero composition visibly shifts
    position now, and the cap color now tracks the current dusk/night mix
    instead of clashing.
- William: "it's not a question of color, it's just awful" — asked for a
  real step back.
- **Strategy change** (see decisions.md): stop drawing art in code. Painted
  pixel art + a code regrade for the dusk → night evolution. Dropped parallax.
- **`design/evolution/`** prototype on reference image 2 (Dreamstime stock,
  watermarked → local test only, never shipped):
  - `tools/prep_pixel_art.py` recovered the native grid (factor 3 →
    266×178, 32 colors). Tuned the dark threshold in Python first (0.30
    separates buildings cleanly; 0.22 broke towers apart).
  - `evolution.js`: sky flood-filled from the top edge, windows = enclosed
    bright pixels grouped into components that each flip gold → red at
    their own moment (~28% switch off, a few flicker), buildings cool to
    navy, stars + pixel moon fade in. Slider = altitude, auto-play loop,
    a "show pixel classes" debug toggle.
  - First night render had the top of the sky lighter than the middle and
    too many stars; fixed by mixing height into the sky ramp (top darkest,
    horizon glow) and restricting stars to dark, plain sky. Verified at
    0 / 0.48 / 1 in the browser, no console errors.
- William: "that's way better can you develop that game? do like the
  original game with progressive difficulty." Green light to move from
  design validation into the actual Phaser build.

## 2026-09-27 (later) — First playable build
- Scaffolded the real game at the project root via `npx degit
  phaserjs/template-vite-ts .` (Phaser 4.0.0 + Vite 6 + TS, matching the
  round-1 engine decision). `npm install`, clean `tsc --noEmit`.
- Ported the approved art straight from the design prototypes instead of
  redrawing it:
  - `src/game/gfx/pixelSprites.ts` — the round-4 ship/asteroid pixel-grid
    builders, verbatim from `design/gallery/sprites.js`.
  - `src/game/gfx/backgroundEvolution.ts` + `SkylineBackground.ts` — the
    dusk→night per-pixel regrade from `design/evolution/evolution.js`,
    wrapped as a Phaser `CanvasTexture` that any scene can own.
  - Background source: `public/assets/art/skyline-PLACEHOLDER-do-not-ship.png`
    (the same watermarked test image) — **still needs replacing** with our
    own generated art before this leaves local dev; filename says so on purpose.
- `src/game/scenes/Game.ts`: full classic Asteroids loop — rotate/thrust/
  drag/wrap ship, cooldown-limited shooting, 3-tier asteroids that split
  large→medium→small on hit (destroyed at small), particle bursts, 3 lives
  with a blink-invulnerability respawn, score, and **wave-based progressive
  difficulty** (each cleared wave spawns `min(3+wave, 11)` asteroids at a
  rising speed multiplier — the classic-Asteroids mechanic William asked
  for). The skyline's dusk→night blend is tied to survival time this run
  (`NIGHT_FULL_MS` = 90s), independent of wave number.
  MainMenu and GameOver reuse the same `SkylineBackground` pinned at
  dusk/night respectively.
- **3 bugs found and fixed by actually running it, not just reading the
  code**:
  1. Circular import: `main.ts` imported the scenes, and the scenes
     imported `GAME_WIDTH`/`GAME_HEIGHT` back from `main.ts` — under ES
     module evaluation order this threw `Cannot access 'GAME_WIDTH' before
     initialization`. Fixed by moving those constants to their own
     `src/game/config.ts` with no back-reference.
  2. `main.ts` used the bare `Phaser.AUTO` global without importing
     `Phaser` as a value (only named imports). Fixed by importing `AUTO`
     directly.
  3. Same class of bug in `Game.ts`, which calls `Phaser.Math.Between/
     Wrap/FloatBetween/Distance` at runtime. A default import
     (`import Phaser from 'phaser'`) failed too — Vite's pre-bundle of this
     particular CJS package (`module.exports = Phaser`) doesn't synthesize
     a `default` export, only named ones. Fixed with a namespace import
     (`import * as Phaser from 'phaser'`), which works with any CJS interop.
  - Verified end-to-end in the browser after each fix: menu loads, Play
    starts the game, arrow keys/WASD move the ship with real inertia,
    space fires, wave 1 spawns and renders, background visibly progresses
    from dusk to a starry red-lit night during play, HUD (score/wave/lives)
    updates, no console errors.
- Cleaned up `package.json` (was still the Phaser template's name/repo).
- **Not done yet**: this isn't a git repo (no commits made — will ask before
  init'ing/committing). No sound. No game-over → high-score persistence.
  Menus are placeholder monospace text, not styled to the brand yet.
- **Next**: William play-tests it himself (`npm run dev`); then decide on
  sound, menu polish, and swapping in real generated skyline art.

## 2026-09-27 (evening) — Full screen, HD, real art
- William's screenshot: black bands left/right, soft low resolution, and the
  "dreamstime" watermark visible (the stock placeholder at full res).
- **Real art**: William generated our own skyline in ChatGPT image from the
  research.md prompt (1536×1024, no watermark, Empire State + Chrysler +
  bridge). Installed as `public/assets/art/skyline.png`; the watermarked
  placeholder is deleted from the game.
- **Full screen, native resolution**: `Scale.NONE` sized to the window ×
  devicePixelRatio (capped 2) and zoomed back by 1/DPR, re-sized on window
  resize — no letterbox, nothing stretched by the browser. Layout is now
  relative to the screen (`worldScale` = height/216 for speeds, fonts,
  radii; integer `spriteScale` so pixel sprites stay crisp). Background is
  cover-fitted (crops edges instead of bands). Fonts (Press Start 2P,
  JetBrains Mono) loaded before the game starts.
- **Dusk→night moved to the GPU**: `analyzeSkyline` still runs once in JS;
  `buildMaskCanvas` packs class / window random / level into a texture and
  `skylineShader.ts` does the regrade per pixel. 0.24 ms per frame at
  1862×1019 (CPU path kept as fallback for non-WebGL).
- Classifier on the new art: a sunlit river patch boxed in by the bridge and
  trees was one giant "window" → components larger than 0.15% of the image
  are now treated as sky/water.
- Bugs found by testing, all fixed:
  - image upside down in the shader (texcoord flip went the wrong way);
  - moon invisible: art-pixel coords in the shader were y-up (WebGL v=0 at
    bottom) so the moon was drawn behind the buildings; also it's now placed
    automatically on the clearest patch of sky (dark dusk clouds count as
    "building" in the classifier and hid it);
  - 30× too many stars on HD art (density was per pixel) → scaled to image
    size;
  - background didn't start at dusk: run start time came from the scene
    clock (0 in create) vs. the game-loop clock in update → anchored on the
    first update frame;
  - dark ship invisible against the night sky → 1px light outline on the
    ship sprite.
- Testing note: the automation browser tab throttles requestAnimationFrame,
  so time-based checks were done by stepping `game.step()` manually through
  a dev-only `window.__game` handle.
- Follow-up from William: dusk colors "too aggressive", and "weird things
  around the ship". The 1px ship outline broke into jagged dashes whenever
  the ship rotated (nearest-neighbour rotation of a thin line) → removed;
  replaced by a soft round glow under the ship (smooth-filtered, never
  rotated). Dusk toned down in both render paths: saturation ×0.72,
  brightness ×0.88 before grading to night (`DUSK_SAT`/`DUSK_BRIGHT`).
  Checked at dusk and night with the ship rotated.
- Next round of feedback, all done:
  - **Sky loops** dusk → night → dusk forever, slower: 4-minute full cycle
    (`SKY_CYCLE_MS`), full night at 2:00.
  - **No waves**: endless run with a survival clock (HUD: SCORE / TIME /
    LIVES). Difficulty ramps with time via `spawnDirector`: on-screen rock
    "mass" (large=1, medium=½, small=¼) targets 3 + 1 per 20 s (max 12),
    speed ×1 → ×2.2 over ~3 min, spawn gap shrinks. Checked: mass 3 at 8 s,
    6 at 68 s, speed ×1.45 at 68 s.
  - **Readable title**: soft dark gradient bands (`gfx/ui.ts` `drawScrim`)
    behind the title and prompt + dark stroke on all text (menu, HUD, game over).
  - **Death screen + local leaderboard**: score and survival time, name
    entry (letters/digits, max 12, Enter saves), top-10 table with the new
    run in red. Name + scores live in this browser's localStorage
    (`src/game/storage.ts`, keys `md.pilotName` / `md.scores`) — no account,
    nothing leaves the machine; the menu greets the returning pilot with
    their best score. Verified save → reload → menu recognises the pilot;
    test data then cleared.
- Follow-up: William wanted more asteroids at the start and the classic
  Asteroids flying saucers ("marsians") to show up the longer you survive.
  - Density: `START_MASS` 3→6, `MASS_STEP_S` 20→15, `MAX_MASS` 12→16.
  - Added saucers (`gfx/pixelSprites.ts buildSaucer`, big/small pixel-grid
    UFOs like the ship). They start appearing after 40s survived
    (`UFO_START_S`), fly in from an edge and leave (don't loop the screen),
    fire at the ship (big = wide random spread, small = tight aim, matching
    the original game), and the gap between spawns shrinks from 26s to 11s
    over the next ~220s. Destroying one scores 150 (big) / 400 (small).
    New enemy-bullet layer with its own collision against the ship.
  - Testing note: separate tool calls let real (throttled) rAF frames sneak
    in between manual `game.step()` calls, so elapsed time drifted from what
    was intended — timing assertions across multiple tool round-trips aren't
    reliable here. Verified the mechanics directly instead: force-spawned
    both saucer sizes, confirmed movement, confirmed each fires on its own
    timer, and confirmed a player bullet destroys one and awards the right
    score.
- Follow-up: rare Mario-style loot. Default fire is now press-and-release
  (one shot per key press, `Phaser.Input.Keyboard.JustDown`); holding down
  no longer spams shots. Added 3 pickups (`gfx/pixelSprites.ts buildPickup`,
  capsule sprites with a chevron/ring/heart symbol), dropped rarely from
  destroyed asteroids (5%) and saucers (20%), weighted rapid > shield > life
  (60/30/10) with the extra life additionally rate-limited to at most once
  per 90s regardless of RNG:
  - Rapid Fire: 8s window where holding space DOES fire continuously, at a
    faster cooldown; reverts to press-and-release the moment it expires,
    even mid-hold.
  - Shield: 8s of the same invulnerability the ship already gets on
    respawn (reused `invulnUntil`).
  - Life: +1, flashed on screen.
  A small HUD line under the score shows remaining time on active buffs.
- Testing note: manually driving `game.step()` repeatedly in one script
  gave a false negative (fired but no bullet appeared) that direct
  invocation of the real `updateShip()` method didn't reproduce — another
  quirk of this environment's manual clock harness, not a game bug.
  Verified all 4 changes (press-release, rapid-hold-window, shield, life)
  by calling the production methods directly with controlled time values
  and checking before/after state matched the exact constants.
