import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { buildShip, buildAsteroid, buildBullet, buildGlow, buildSaucer, buildPickup } from '../gfx/pixelSprites';
import { analyzeSkyline, buildMaskCanvas } from '../gfx/backgroundEvolution';

export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
    }

    create ()
    {
        // Ship + bullet, built as real pixel-grid sprites (round-4 designs).
        this.textures.addCanvas('ship', buildShip('#D81F26'));
        this.textures.addCanvas('bullet', buildBullet('#FF3B3B'));
        this.textures.addCanvas('enemy-bullet', buildBullet('#FF8A3D'));
        // "marsians": the classic Asteroids flying saucers, appear once you survive a while
        this.textures.addCanvas('saucer-big', buildSaucer(true));
        this.textures.addCanvas('saucer-small', buildSaucer(false));

        // rare loot: rapid fire, temporary shield, extra life
        this.textures.addCanvas('pickup-rapid', buildPickup('rapid'));
        this.textures.addCanvas('pickup-shield', buildPickup('shield'));
        this.textures.addCanvas('pickup-life', buildPickup('life'));
        // smooth gradient: override the global pixelArt nearest filtering
        this.textures.addCanvas('ship-glow', buildGlow())!.setFilter(Phaser.Textures.FilterMode.LINEAR);

        // A few random-look variants per asteroid tier, so a wave doesn't
        // look like the same rock copy-pasted everywhere.
        const tiers: Array<[string, number, number]> = [
            ['large', 22, 1000],
            ['medium', 14, 2000],
            ['small', 9, 3000],
        ];
        for (const [name, size, seedBase] of tiers) {
            for (let i = 0; i < 3; i++) {
                this.textures.addCanvas(`asteroid-${name}-${i}`, buildAsteroid(seedBase + i * 77, size));
            }
        }

        // Analyze the painted skyline once; the Game scene regrades it
        // live from these classified pixels as the round progresses.
        const img = this.textures.get('skyline-src').getSourceImage() as HTMLImageElement;
        const analysis = analyzeSkyline(img);
        this.game.registry.set('skylineAnalysis', analysis);
        // the same analysis, packed into a texture for the GPU regrade
        this.textures.addCanvas('skyline-mask', buildMaskCanvas(analysis));

        this.scene.start('MainMenu');
    }
}
