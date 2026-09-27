import { Scene } from 'phaser';
import { worldScale, FONT_TITLE, FONT_UI } from '../config';
import { SkylineBackground } from '../gfx/SkylineBackground';
import { drawScrim, outline } from '../gfx/ui';
import { getPilotName, setPilotName, addScore, getScores, formatTime, MAX_NAME_LEN } from '../storage';

type Phase = 'name' | 'board';

export class GameOver extends Scene
{
    private bg!: SkylineBackground;
    private shade!: Phaser.GameObjects.Graphics;
    private title!: Phaser.GameObjects.Text;
    private result!: Phaser.GameObjects.Text;
    private label!: Phaser.GameObjects.Text;
    private nameText!: Phaser.GameObjects.Text;
    private hint!: Phaser.GameObjects.Text;
    private rows: Phaser.GameObjects.Text[] = [];

    private phase: Phase = 'name';
    private name = '';
    private score = 0;
    private timeMs = 0;
    private rank = -1;

    constructor () { super('GameOver'); }

    create ()
    {
        this.phase = 'name';
        this.rows = [];
        this.rank = -1;
        this.score = this.registry.get('finalScore') ?? 0;
        this.timeMs = this.registry.get('finalTimeMs') ?? 0;
        // remembered from last time on this browser; Enter keeps it, typing changes it
        this.name = getPilotName();

        this.bg = new SkylineBackground(this, 'skyline-gameover');
        this.bg.t = 1;
        this.shade = this.add.graphics();

        this.title = this.add.text(0, 0, 'GAME OVER', { fontFamily: FONT_TITLE, color: '#FF3B3B' }).setOrigin(0.5);
        this.result = this.add.text(0, 0, `SCORE ${this.score}     TIME ${formatTime(this.timeMs)}`,
            { fontFamily: FONT_TITLE, color: '#ffffff' }).setOrigin(0.5);
        this.label = this.add.text(0, 0, 'YOUR NAME', { fontFamily: FONT_UI, color: '#c9bfd6' }).setOrigin(0.5);
        this.nameText = this.add.text(0, 0, '', { fontFamily: FONT_TITLE, color: '#ffffff' }).setOrigin(0.5);
        this.hint = this.add.text(0, 0, 'TYPE YOUR NAME  •  ENTER TO SAVE', { fontFamily: FONT_UI, color: '#e8dcf0' }).setOrigin(0.5);

        this.input.keyboard!.on('keydown', this.onKey, this);
        this.input.on('pointerdown', () => { if (this.phase === 'board') this.scene.start('Game'); });

        this.layout();
        this.scale.on('resize', this.layout, this);
        this.events.once('shutdown', () => {
            this.scale.off('resize', this.layout, this);
            this.input.keyboard!.off('keydown', this.onKey, this);
        });
    }

    private onKey (e: KeyboardEvent)
    {
        if (this.phase === 'board') {
            if (e.code === 'Space' || e.key === 'Enter') this.scene.start('Game');
            return;
        }
        if (e.key === 'Enter') { this.save(); return; }
        if (e.key === 'Backspace') { this.name = this.name.slice(0, -1); return; }
        if (/^[a-zA-Z0-9_.-]$/.test(e.key) && this.name.length < MAX_NAME_LEN) this.name += e.key.toUpperCase();
    }

    private save ()
    {
        const name = this.name.trim() || 'PILOT';
        this.name = name;
        setPilotName(name);
        this.rank = addScore({ name, score: this.score, timeMs: this.timeMs, date: Date.now() });
        this.phase = 'board';
        this.label.setVisible(false);
        this.nameText.setVisible(false);
        this.hint.setText('SPACE TO PLAY AGAIN');
        this.buildBoard();
        this.layout();
    }

    private buildBoard ()
    {
        const scores = getScores();
        this.rows.forEach((r) => r.destroy());
        this.rows = [];
        const header = this.add.text(0, 0, `${'#'.padEnd(4)}${'PILOT'.padEnd(MAX_NAME_LEN + 2)}${'SCORE'.padStart(7)}${'TIME'.padStart(8)}`,
            { fontFamily: FONT_UI, color: '#9a8fae' }).setOrigin(0.5);
        this.rows.push(header);
        scores.forEach((e, i) => {
            const line = `${String(i + 1).padEnd(4)}${e.name.padEnd(MAX_NAME_LEN + 2)}${String(e.score).padStart(7)}${formatTime(e.timeMs).padStart(8)}`;
            this.rows.push(this.add.text(0, 0, line, { fontFamily: FONT_UI, color: i === this.rank ? '#FF3B3B' : '#ffffff' }).setOrigin(0.5));
        });
        if (this.rank < 0) {
            this.rows.push(this.add.text(0, 0, `${this.name}: ${this.score} — not in the top ${scores.length} this time`,
                { fontFamily: FONT_UI, color: '#c9bfd6' }).setOrigin(0.5));
        }
    }

    private layout ()
    {
        const { width: W, height: H } = this.scale;
        const k = worldScale(this);
        const big = Math.min(Math.round(15 * k), Math.floor(W / 12));
        const mid = Math.min(Math.round(7 * k), Math.floor(W / 34));
        const small = Math.round(6.5 * k);

        drawScrim(this.shade, W, -H * 0.2, H * 1.2, 0.72);

        this.title.setFontSize(big).setPosition(W / 2, H * 0.14);
        this.result.setFontSize(mid).setPosition(W / 2, H * 0.14 + big * 1.4);
        this.label.setFontSize(small).setPosition(W / 2, H * 0.45);
        this.nameText.setFontSize(mid * 1.2).setPosition(W / 2, H * 0.45 + small * 2.4);
        this.hint.setFontSize(small).setPosition(W / 2, H * 0.9);

        const rowH = small * 1.7;
        const top = H * 0.36;
        this.rows.forEach((r, i) => r.setFontSize(small).setPosition(W / 2, top + i * rowH));

        for (const t of [this.title, this.result, this.label, this.nameText, this.hint, ...this.rows]) {
            outline(t, Number(t.style.fontSize.toString().replace('px', '')));
        }
    }

    update (time: number)
    {
        this.bg.update(time);
        if (this.phase === 'name') {
            const cursor = Math.floor(time / 450) % 2 === 0 ? '_' : ' ';
            this.nameText.setText(this.name + (this.name.length < MAX_NAME_LEN ? cursor : ''));
        }
        this.hint.setAlpha(0.6 + 0.4 * Math.abs(Math.sin(time * 0.003)));
    }
}
