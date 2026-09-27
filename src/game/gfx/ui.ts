import * as Phaser from 'phaser';

const SHADE = 0x07040f; // near-black violet, blends with both dusk and night

/** Draws a horizontal dark band from y0 to y1 that fades out at the top and
 * bottom edges, so text on top stays readable over the busy painted sky
 * without a hard box. Call again on resize (it clears first). */
export function drawScrim (g: Phaser.GameObjects.Graphics, width: number, y0: number, y1: number, alpha = 0.6)
{
    g.clear();
    const mid = (y0 + y1) / 2;
    g.fillGradientStyle(SHADE, SHADE, SHADE, SHADE, 0, 0, alpha, alpha);
    g.fillRect(0, y0, width, mid - y0);
    g.fillGradientStyle(SHADE, SHADE, SHADE, SHADE, alpha, alpha, 0, 0);
    g.fillRect(0, mid, width, y1 - mid);
}

/** Dark outline around the letters, sized to the font. */
export function outline (text: Phaser.GameObjects.Text, fontSize: number)
{
    text.setStroke('#0b0612', Math.max(3, Math.round(fontSize * 0.18)));
}
