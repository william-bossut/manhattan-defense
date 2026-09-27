# Roadmap

## Done
- [x] Design exploration (rounds 1–6, see devlog) → landed on painted art +
      code-driven dusk→night regrade, ship/asteroid pixel sprites.
- [x] Phaser 4 scaffold (`phaserjs/template-vite-ts`).
- [x] Core loop: ship drift/thrust/wrap controls, shooting, 3-tier asteroids
      that split, particle bursts, lives, score.
- [x] Classic wave-based progressive difficulty (more/faster asteroids each
      cleared wave) — chosen over the earlier altitude-zone design per
      William's explicit "do like the original game" direction.
- [x] Background evolves dusk → night live during a run, tied to survival
      time (independent of wave number).
- [x] MainMenu / Game / GameOver scenes wired together.

## Now
- [ ] William play-tests `npm run dev` and gives feedback on feel (turn
      speed, thrust, fire rate, wave pacing).
- [x] Replace the watermarked placeholder skyline with our own generated
      art (`public/assets/art/skyline.png`).
- [x] Full screen at native resolution (no bands), GPU dusk→night regrade.
- [ ] git init + first commit (not done yet, ask before doing it).

## Next
- Sound: ZzFX or jsfxr for shoot/explosion/thrust, a thin music bed.
- Menu polish: brand type/palette instead of default monospace, pixel-art
  buttons (Phaser PixUI or hand-rolled to match `style-guide.md`).
- High score persistence (localStorage), initials entry on game over.
- Pause.
- Juice pass: screen shake tuning, hit-flash, thruster particles.

## Later ideas (not scoped yet)
- Pickups: shield, triple-shot, slow-mo.
- More/varied enemy types beyond plain asteroids (the round-4 metal-debris
  and crystal-hazard designs exist as sprites already).
- Tauri desktop wrapper (same pattern as Open Island).
- Gamepad support.
- Leaderboard sync (if ever online).
- Cosmetic ship skins tying into the OpenBand "buddy" characters.
