import { Scene } from 'phaser';

export class Boot extends Scene
{
    constructor ()
    {
        super('Boot');
    }

    preload ()
    {
        // Our own skyline (generated with the prompt in docs/research.md).
        // Painted at dusk; SkylineBackground regrades it to night live.
        this.load.image('skyline-src', 'assets/art/skyline.png');
    }

    create ()
    {
        this.scene.start('Preloader');
    }
}
