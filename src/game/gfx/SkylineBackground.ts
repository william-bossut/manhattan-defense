import * as Phaser from 'phaser';
import { SkylineAnalysis, renderSkyline } from './backgroundEvolution';
import { SKYLINE_FRAG } from './skylineShader';

/** Displays the painted skyline, regraded live from dusk (t=0) to night
 * (t=1). Covers the whole screen without distortion (like CSS
 * background-size: cover) and re-fits on resize. Uses a GPU shader when
 * WebGL is available; falls back to the CPU regrade otherwise. */
export class SkylineBackground
{
    t = 0;
    private scene: Phaser.Scene;
    private analysis: SkylineAnalysis;
    private shader?: Phaser.GameObjects.Shader;
    private cpu?: { image: Phaser.GameObjects.Image; tex: Phaser.Textures.CanvasTexture };
    private timeMs = 0;

    constructor (scene: Phaser.Scene, key: string)
    {
        this.scene = scene;
        this.analysis = scene.game.registry.get('skylineAnalysis') as SkylineAnalysis;
        const { W, H } = this.analysis;

        if (scene.game.renderer.type === Phaser.WEBGL) {
            this.shader = scene.add.shader({
                name: 'skyline-evolution',
                fragmentSource: SKYLINE_FRAG,
                setupUniforms: (setUniform: (name: string, value: unknown) => void) => {
                    setUniform('uSrc', 0);
                    setUniform('uMask', 1);
                    setUniform('uT', this.t);
                    setUniform('uTime', this.timeMs);
                    setUniform('uArt', [W, H]);
                    setUniform('uMoon', [this.analysis.moon.x, this.analysis.moon.y, this.analysis.moon.r]);
                },
            }, 0, 0, W, H, ['skyline-src', 'skyline-mask']);
            this.shader.setDepth(-100);
        } else {
            const tex = scene.textures.createCanvas(key, W, H)!;
            const image = scene.add.image(0, 0, key).setDepth(-100);
            this.cpu = { image, tex };
        }

        this.fit();
        scene.scale.on('resize', this.fit, this);
        scene.events.once('shutdown', () => scene.scale.off('resize', this.fit, this));
    }

    private fit ()
    {
        const { W, H } = this.analysis;
        const sw = this.scene.scale.width, sh = this.scene.scale.height;
        const s = Math.max(sw / W, sh / H);
        const target = this.shader ?? this.cpu!.image;
        target.setPosition(sw / 2, sh / 2);
        if (this.shader) this.shader.setSize(W, H).setOrigin(0.5).setScale(s);
        else this.cpu!.image.setOrigin(0.5).setScale(s);
    }

    update (timeMs: number)
    {
        this.timeMs = timeMs;
        if (this.cpu) {
            renderSkyline(this.cpu.tex.context, this.analysis, this.t, timeMs);
            this.cpu.tex.refresh();
        }
    }
}
