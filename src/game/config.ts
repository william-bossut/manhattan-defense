// The game now fills the whole window at its native pixel density (see
// main.ts), so there is no fixed game resolution anymore. Gameplay values
// were tuned for a 216px-tall world; everything is scaled from the current
// screen height relative to that.
export const BASE_H = 216;

// Render at the screen's real pixel density (capped at 2x for perf) so text
// and sprites are drawn natively instead of being stretched by the browser.
export const DPR = Math.min(window.devicePixelRatio || 1, 2);

/** Continuous scale for speeds, radii, font sizes. */
export function worldScale (scene: Phaser.Scene): number
{
    return scene.scale.height / BASE_H;
}

/** Integer scale for pixel-art sprites, so every art pixel maps to a whole
 * number of screen pixels and sprites stay perfectly crisp. */
export function spriteScale (scene: Phaser.Scene): number
{
    return Math.max(1, Math.round(scene.scale.height / BASE_H));
}

export const FONT_TITLE = '"Press Start 2P", monospace';
export const FONT_UI = '"JetBrains Mono", monospace';
