# Concept — "The Ascent"

## One-liner
An endless Asteroids-style arcade game: pilot a ship with drift/inertia
controls, survive waves of drones and debris, and slowly climb a red-lit,
pixel-art Manhattan from the street up into orbit. No levels — everything
scales continuously with how long you survive.

## Core loop
1. Rotate + thrust the ship (inertia, screen-wrap, classic Asteroids feel).
2. Shoot enemies before they hit you; some split into smaller pieces.
3. **Altitude** rises automatically over time (plus a small bonus per kill).
4. Altitude drives two things at once:
   - **Difficulty**: the spawn "director" gets a bigger danger budget and
     unlocks new enemy types the higher you go.
   - **Background**: the skyline blends smoothly between zones (street →
     towers → rooftops → clouds → orbit) — never a hard cut.
5. Die → enter initials if it's a high score → try again. Every run is
   different because spawns are randomized, not scripted levels.

## Why no levels
William wants difficulty and scenery to emerge from survival time, not from
hand-authored stages — closer to a "climb as high as you can" roguelite pace
than a level-select arcade game. It also means the game never "ends" with a
win screen; the hook is beating your own altitude/score.

## Enemy pool (unlocks progressively with altitude)
| Zone | Enemy | Behavior |
|---|---|---|
| Street | Debris drone | Drifts, splits in two on hit (the classic asteroid) |
| Towers | Security drone | Slow homing shots |
| Rooftops | Chopper-drone | Slow homing movement |
| Clouds | Blimp | Drops mines |
| Orbit | Asteroid + satellite | Fast, callback to the original game |

## Pickups (rare, random)
Shield, triple-shot, slow-mo — keep runs varied without adding complexity to
the core loop.

## Reference
Full write-up of style, tech and decisions: [`style-guide.md`](style-guide.md),
[`research.md`](research.md), [`decisions.md`](decisions.md).
