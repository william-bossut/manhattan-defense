import { Scene } from 'phaser';
import { worldScale, FONT_TITLE, FONT_UI } from '../config';
import { SkylineBackground } from '../gfx/SkylineBackground';
import { drawScrim, outline } from '../gfx/ui';
import { getPilotName, bestScore, formatTime } from '../storage';

export class MainMenu extends Scene
{
    private bg!: SkylineBackground;
    private topShade!: Phaser.GameObjects.Graphics;
    private bottomShade!: Phaser.GameObjects.Graphics;
    private title!: Phaser.GameObjects.Text;
    private subtitle!: Phaser.GameObjects.Text;
    private prompt!: Phaser.GameObjects.Text;
    private help!: Phaser.GameObjects.Text;
    private pilot!: Phaser.GameObjects.Text;

    constructor () { super('MainMenu'); }

    create ()
    {
        this.bg = new SkylineBackground(this, 'skyline-menu');
        this.bg.t = 0;

        this.topShade = this.add.graphics();
        this.bottomShade = this.add.graphics();

        this.title = this.add.text(0, 0, 'MANHATTAN DEFENSE', { fontFamily: FONT_TITLE, color: '#ffffff' }).setOrigin(0.5);
        this.subtitle = this.add.text(0, 0, 'THE ASCENT', { fontFamily: FONT_TITLE, color: '#FF3B3B' }).setOrigin(0.5);
        this.prompt = this.add.text(0, 0, 'PRESS SPACE TO PLAY', { fontFamily: FONT_TITLE, color: '#ffffff' }).setOrigin(0.5);
        this.help = this.add.text(0, 0, 'ARROWS / WASD  MOVE    •    SPACE  SHOOT', { fontFamily: FONT_UI, color: '#e8dcf0' }).setOrigin(0.5);

        // returning pilots are recognised from this browser's local storage
        const name = getPilotName();
        const best = name ? bestScore(name) : undefined;
        const pilotLine = name
            ? `PILOT ${name}` + (best ? `   •   BEST ${best.score}  (${formatTime(best.timeMs)})` : '')
            : '';
        this.pilot = this.add.text(0, 0, pilotLine, { fontFamily: FONT_UI, color: '#ffffff' }).setOrigin(0.5);

        this.layout();
        this.scale.on('resize', this.layout, this);
        this.events.once('shutdown', () => this.scale.off('resize', this.layout, this));

        const start = () => this.scene.start('Game');
        this.input.keyboard!.once('keydown-SPACE', start);
        this.input.once('pointerdown', start);
    }

    private layout ()
    {
        const { width: W, height: H } = this.scale;
        const k = worldScale(this);
        // keep the title inside the screen on narrow windows
        const titleSize = Math.min(Math.round(15 * k), Math.floor(W / 20));
        const subSize = Math.round(titleSize * 0.45);
        const promptSize = Math.round(titleSize * 0.5);
        const smallSize = Math.round(7 * k);

        const titleY = H * 0.2;
        this.title.setFontSize(titleSize).setPosition(W / 2, titleY);
        this.subtitle.setFontSize(subSize).setPosition(W / 2, titleY + titleSize * 1.4);
        this.pilot.setFontSize(smallSize).setPosition(W / 2, titleY + titleSize * 2.5);
        drawScrim(this.topShade, W, titleY - titleSize * 1.6, titleY + titleSize * 3.6, 0.65);

        const promptY = H * 0.84;
        this.prompt.setFontSize(promptSize).setPosition(W / 2, promptY);
        this.help.setFontSize(smallSize).setPosition(W / 2, promptY + titleSize * 1.3);
        drawScrim(this.bottomShade, W, promptY - titleSize * 1.4, H + titleSize, 0.7);

        outline(this.title, titleSize);
        outline(this.subtitle, subSize);
        outline(this.prompt, promptSize);
        outline(this.help, smallSize);
        outline(this.pilot, smallSize);
    }

    update (time: number)
    {
        this.bg.update(time);
        this.prompt.setAlpha(0.55 + 0.45 * Math.abs(Math.sin(time * 0.003)));
    }
}
