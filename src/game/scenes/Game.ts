import * as Phaser from 'phaser';
const { Scene } = Phaser;
import { worldScale, spriteScale, FONT_UI, FONT_TITLE } from '../config';
import { SkylineBackground } from '../gfx/SkylineBackground';
import { formatTime } from '../storage';
import { outline } from '../gfx/ui';

// Gameplay tuned for a 216px-tall world; distances and speeds below are in
// those "base" units and multiplied by worldScale() (screen height / 216).
const TURN_SPEED = 3.6;        // rad/s
const THRUST = 130;            // base px/s^2
const DRAG = 0.60;             // exponential velocity decay per second
const MAX_SPEED = 160;         // base px/s
const BULLET_SPEED = 260;      // base px/s
const BULLET_LIFE = 1.05;      // s
// Default fire is press-and-release: one shot per press, no holding down.
// FIRE_COOLDOWN is just a safety floor between shots either way.
const FIRE_COOLDOWN = 0.22;    // s
const RAPID_FIRE_COOLDOWN = 0.09; // s, while the Rapid Fire pickup is active (holdable)
const RAPID_FIRE_DURATION = 8;    // s
const SHIELD_DURATION = 8;        // s, temporary invincibility pickup
const INVULN_TIME = 2.0;
const RESPAWN_DELAY = 1.2;
const SKY_CYCLE_MS = 240_000;  // dusk -> night -> dusk: one full loop every 4 minutes

// Endless mode: difficulty ramps with survival time instead of waves.
// "Mass" counts rocks in large-rock equivalents (a medium is half, a small a quarter).
const START_MASS = 6;            // large rocks on screen at the start
const MASS_STEP_S = 15;          // +1 large rock of pressure every 15s survived
const MAX_MASS = 16;
const SPEEDUP_S = 150;           // rocks are 1x faster at start, +1x per 150s
const MAX_SPEED_MUL = 2.2;

type Tier = 0 | 1 | 2; // 0 large, 1 medium, 2 small
const TIER_NAME = ['large', 'medium', 'small'] as const;
const TIER_RADIUS = [10, 6.5, 4];                              // base px, at sprite scale 1
const TIER_SPEED: [number, number][] = [[18, 34], [30, 50], [45, 68]]; // base px/s
const TIER_SCORE = [20, 50, 100];

// "Marsians": the classic Asteroids flying saucers. They only show up once
// you've survived a while, then keep coming more often the longer you last.
const UFO_START_S = 40;          // first saucer appears after 40s survived
const UFO_INTERVAL_START_S = 26; // gap between saucers, early on
const UFO_INTERVAL_MIN_S = 11;   // gap between saucers, late game
const UFO_RAMP_S = 220;          // seconds (after UFO_START_S) to reach the minimum gap
const UFO_SMALL_CHANCE_START = 0.15; // the accurate small saucer is rare at first...
const UFO_SMALL_CHANCE_MAX = 0.55;   // ...and common later
const UFO_SPEED: [number, number] = [45, 70];    // base px/s, crosses the screen
const UFO_SHOT_INTERVAL: [number, number] = [1100, 2000]; // ms between shots
const UFO_BULLET_SPEED = 190;    // base px/s
const UFO_BULLET_LIFE = 1.6;     // s
const UFO_RADIUS = { big: 9, small: 6 };         // base px
const UFO_SCORE = { big: 150, small: 400 };
const UFO_AIM_SPREAD = { big: 0.65, small: 0.06 }; // radians of random error when firing

// Rare loot, Mario-kart-item style: drops occasionally from destroyed
// enemies and drifts until collected or it times out. Kept rare on purpose,
// the extra life especially.
type PickupKind = 'rapid' | 'shield' | 'life';
const PICKUP_LIFE_MS = 14_000;
const PICKUP_DROP_CHANCE_ASTEROID = 0.05;
const PICKUP_DROP_CHANCE_SAUCER = 0.20;
const PICKUP_WEIGHTS: { kind: PickupKind; w: number }[] = [
    { kind: 'rapid', w: 60 }, { kind: 'shield', w: 30 }, { kind: 'life', w: 10 },
];
const LIFE_MIN_GAP_MS = 90_000; // a life can drop at most this often, whatever the RNG rolls
const PICKUP_COLOR: Record<PickupKind, number> = { rapid: 0xFFD23F, shield: 0x7CE8F2, life: 0xD81F26 };

// velocities are stored in base units; positions in screen pixels
interface Asteroid { img: Phaser.GameObjects.Image; vx: number; vy: number; vr: number; tier: Tier; entered?: boolean; }
interface Bullet { img: Phaser.GameObjects.Image; vx: number; vy: number; life: number; }
interface Saucer { img: Phaser.GameObjects.Image; vx: number; vy: number; big: boolean; nextShotAt: number; }
interface Pickup { img: Phaser.GameObjects.Image; vx: number; vy: number; kind: PickupKind; expiresAt: number; }
interface Particle { img: Phaser.GameObjects.Rectangle; vx: number; vy: number; life: number; maxLife: number; }

export class Game extends Scene
{
    private bg!: SkylineBackground;
    private ship!: Phaser.GameObjects.Image;
    private shipGlow!: Phaser.GameObjects.Image;
    private shipVx = 0; private shipVy = 0; private shipAngle = 0;
    private shipAlive = true;
    private invulnUntil = 0;
    private lastShot = -999;

    private asteroids: Asteroid[] = [];
    private bullets: Bullet[] = [];
    private saucers: Saucer[] = [];
    private enemyBullets: Bullet[] = [];
    private pickups: Pickup[] = [];
    private particles: Particle[] = [];

    private rapidUntil = 0;
    private lastLifeDropAt = -Infinity;

    private respawnAt = -1;
    private nextSpawnAt = 0;
    private nextUfoAt = -1;
    private endTime = -1; // freezes the survival clock once the last life is lost

    private score = 0;
    private lives = 3;
    private startTime = 0;

    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private keyW!: Phaser.Input.Keyboard.Key;
    private keyA!: Phaser.Input.Keyboard.Key;
    private keyD!: Phaser.Input.Keyboard.Key;
    private keySpace!: Phaser.Input.Keyboard.Key;

    private scoreText!: Phaser.GameObjects.Text;
    private livesText!: Phaser.GameObjects.Text;
    private timeText!: Phaser.GameObjects.Text;
    private centerText!: Phaser.GameObjects.Text;
    private buffText!: Phaser.GameObjects.Text;

    constructor () { super('Game'); }

    create ()
    {
        // scenes are reused on restart: reset all run state
        this.asteroids = []; this.bullets = []; this.particles = [];
        this.saucers = []; this.enemyBullets = []; this.pickups = [];
        this.rapidUntil = 0; this.lastLifeDropAt = -Infinity;
        this.respawnAt = -1; this.nextSpawnAt = 0; this.nextUfoAt = -1; this.endTime = -1;
        this.score = 0; this.lives = 3; this.lastShot = -999;

        this.bg = new SkylineBackground(this, 'skyline-game');
        // anchored on the first update(): the scene clock reads 0 during
        // create() while update() gets the global game-loop time
        this.startTime = -1;

        const { width: W, height: H } = this.scale;
        this.shipGlow = this.add.image(W / 2, H / 2, 'ship-glow').setDepth(9);
        this.ship = this.add.image(W / 2, H / 2, 'ship').setOrigin(0.5).setDepth(10);
        this.shipVx = 0; this.shipVy = 0; this.shipAngle = 0;
        this.shipAlive = true;
        this.invulnUntil = -1; // set with startTime on the first frame

        this.cursors = this.input.keyboard!.createCursorKeys();
        this.keyW = this.input.keyboard!.addKey('W');
        this.keyA = this.input.keyboard!.addKey('A');
        this.keyD = this.input.keyboard!.addKey('D');
        this.keySpace = this.input.keyboard!.addKey('SPACE');

        this.scoreText = this.add.text(0, 0, 'SCORE 0', { fontFamily: FONT_UI, color: '#ffffff' }).setDepth(20);
        this.livesText = this.add.text(0, 0, '', { fontFamily: FONT_UI, color: '#D81F26' }).setOrigin(1, 0).setDepth(20);
        this.timeText = this.add.text(0, 0, '0:00', { fontFamily: FONT_UI, color: '#ffffff' }).setOrigin(0.5, 0).setDepth(20);
        this.centerText = this.add.text(0, 0, '', { fontFamily: FONT_TITLE, color: '#ffffff', align: 'center' })
            .setOrigin(0.5).setDepth(20);
        this.buffText = this.add.text(0, 0, '', { fontFamily: FONT_UI, color: '#ffffff', align: 'center' })
            .setOrigin(0.5, 0).setDepth(20);
        for (const t of [this.scoreText, this.livesText, this.timeText, this.centerText, this.buffText]) {
            t.setShadow(0, 2, '#000000', 4, true, true);
        }

        this.layout();
        this.scale.on('resize', this.layout, this);
        this.events.once('shutdown', () => this.scale.off('resize', this.layout, this));

        this.updateLivesText();
    }

    /** Position/size everything from the current screen size. */
    private layout ()
    {
        const { width: W, height: H } = this.scale;
        const k = worldScale(this), ss = spriteScale(this);
        const m = Math.round(8 * k);
        const ui = Math.round(9 * k);
        this.scoreText.setFontSize(ui).setPosition(m, m);
        this.livesText.setFontSize(ui).setPosition(W - m, m);
        this.timeText.setFontSize(ui).setPosition(W / 2, m);
        this.centerText.setFontSize(Math.round(10 * k)).setPosition(W / 2, H / 2 - 30 * k);
        this.buffText.setFontSize(Math.round(7 * k)).setPosition(W / 2, m + ui * 1.4);
        for (const t of [this.scoreText, this.livesText, this.timeText, this.buffText]) outline(t, ui);
        outline(this.centerText, Math.round(10 * k));
        this.ship.setScale(ss);
        this.shipGlow.setDisplaySize(26 * ss, 26 * ss);
        for (const a of this.asteroids) a.img.setScale(ss);
        for (const b of this.bullets) b.img.setScale(ss);
        for (const s of this.saucers) s.img.setScale(ss);
        for (const b of this.enemyBullets) b.img.setScale(ss);
        for (const p of this.pickups) p.img.setScale(ss);
    }

    private survivedMs (time: number) { return (this.endTime >= 0 ? this.endTime : time) - this.startTime; }

    private speedMul (time: number) { return Math.min(MAX_SPEED_MUL, 1 + this.survivedMs(time) / 1000 / SPEEDUP_S); }

    /** Keep the screen topped up with rocks; the target grows with survival time. */
    private spawnDirector (time: number)
    {
        if (time < this.nextSpawnAt) return;
        const s = this.survivedMs(time) / 1000;
        const target = Math.min(MAX_MASS, START_MASS + Math.floor(s / MASS_STEP_S));
        const mass = this.asteroids.reduce((m, a) => m + [1, 0.5, 0.25][a.tier], 0);
        if (mass < target) {
            this.spawnAsteroid(0, undefined, undefined, this.speedMul(time));
            // quick fill at the start, then new rocks arrive a bit more often as time goes on
            this.nextSpawnAt = time + (s < 2 ? 250 : Math.max(700, 2600 - s * 12));
        }
    }

    private spawnAsteroid (tier: Tier, x?: number, y?: number, speedMul = 1)
    {
        const { width: W, height: H } = this.scale;
        if (x === undefined || y === undefined) {
            // spawn just off an edge, so it drifts in rather than popping on top of the ship
            const side = Phaser.Math.Between(0, 3);
            const off = 12 * worldScale(this);
            if (side === 0) { x = Phaser.Math.Between(0, W); y = -off; }
            else if (side === 1) { x = W + off; y = Phaser.Math.Between(0, H); }
            else if (side === 2) { x = Phaser.Math.Between(0, W); y = H + off; }
            else { x = -off; y = Phaser.Math.Between(0, H); }
        }
        const variant = Phaser.Math.Between(0, 2);
        const img = this.add.image(x, y, `asteroid-${TIER_NAME[tier]}-${variant}`).setDepth(5).setScale(spriteScale(this));
        const [minS, maxS] = TIER_SPEED[tier];
        const speed = Phaser.Math.FloatBetween(minS, maxS) * speedMul;
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        this.asteroids.push({
            img, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
            vr: Phaser.Math.FloatBetween(-1.2, 1.2), tier,
        });
    }

    private radius (a: Asteroid) { return TIER_RADIUS[a.tier] * spriteScale(this); }

    /** Sends a saucer in once enough time has passed, more often the longer the run goes. */
    private ufoDirector (time: number)
    {
        const s = this.survivedMs(time) / 1000;
        if (s < UFO_START_S) return;
        if (this.nextUfoAt < 0) { this.nextUfoAt = time + Phaser.Math.Between(500, 4000); return; }
        if (time < this.nextUfoAt) return;

        const ramp = Phaser.Math.Clamp((s - UFO_START_S) / UFO_RAMP_S, 0, 1);
        const smallChance = UFO_SMALL_CHANCE_START + (UFO_SMALL_CHANCE_MAX - UFO_SMALL_CHANCE_START) * ramp;
        this.spawnSaucer(Math.random() < smallChance, time);
        const gapS = UFO_INTERVAL_START_S + (UFO_INTERVAL_MIN_S - UFO_INTERVAL_START_S) * ramp;
        this.nextUfoAt = time + gapS * 1000 * Phaser.Math.FloatBetween(0.8, 1.2);
    }

    private spawnSaucer (small: boolean, time: number)
    {
        const { width: W, height: H } = this.scale;
        const fromLeft = Math.random() < 0.5;
        const x = fromLeft ? -20 * worldScale(this) : W + 20 * worldScale(this);
        const y = Phaser.Math.FloatBetween(H * 0.12, H * 0.7);
        const speed = Phaser.Math.FloatBetween(...UFO_SPEED);
        const img = this.add.image(x, y, small ? 'saucer-small' : 'saucer-big').setDepth(6).setScale(spriteScale(this));
        this.saucers.push({
            img, vx: (fromLeft ? 1 : -1) * speed, vy: 0, big: !small,
            nextShotAt: time + Phaser.Math.Between(...UFO_SHOT_INTERVAL),
        });
    }

    private saucerFire (sc: Saucer)
    {
        if (!this.shipAlive) return;
        const dx = this.ship.x - sc.img.x, dy = this.ship.y - sc.img.y;
        const spread = sc.big ? UFO_AIM_SPREAD.big : UFO_AIM_SPREAD.small;
        const angle = Math.atan2(dy, dx) + Phaser.Math.FloatBetween(-spread, spread);
        const img = this.add.image(sc.img.x, sc.img.y, 'enemy-bullet').setDepth(7).setScale(spriteScale(this));
        this.enemyBullets.push({
            img, vx: Math.cos(angle) * UFO_BULLET_SPEED, vy: Math.sin(angle) * UFO_BULLET_SPEED, life: UFO_BULLET_LIFE,
        });
    }

    private updateLivesText () { this.livesText.setText('LIVES ' + '▲'.repeat(Math.max(0, this.lives))); }

    private pickWeightedKind (): PickupKind
    {
        const total = PICKUP_WEIGHTS.reduce((s, p) => s + p.w, 0);
        let r = Math.random() * total;
        for (const p of PICKUP_WEIGHTS) { if (r < p.w) return p.kind; r -= p.w; }
        return 'rapid';
    }

    /** Small chance for a destroyed enemy to leave loot behind. */
    private maybeDropPickup (x: number, y: number, chance: number, time: number)
    {
        if (Math.random() > chance) return;
        let kind = this.pickWeightedKind();
        // guarantee rarity for the extra life regardless of how lucky the roll was
        if (kind === 'life' && time - this.lastLifeDropAt < LIFE_MIN_GAP_MS) kind = Math.random() < 0.5 ? 'rapid' : 'shield';
        if (kind === 'life') this.lastLifeDropAt = time;

        const img = this.add.image(x, y, `pickup-${kind}`).setDepth(7).setScale(spriteScale(this));
        const a = Phaser.Math.FloatBetween(0, Math.PI * 2), s = Phaser.Math.FloatBetween(10, 26);
        this.pickups.push({ img, vx: Math.cos(a) * s, vy: Math.sin(a) * s, kind, expiresAt: time + PICKUP_LIFE_MS });
    }

    private updatePickups (dt: number, k: number, time: number)
    {
        for (let i = this.pickups.length - 1; i >= 0; i--) {
            const p = this.pickups[i];
            if (time >= p.expiresAt) { p.img.destroy(); this.pickups.splice(i, 1); continue; }
            p.img.x += p.vx * k * dt; p.img.y += p.vy * k * dt;
            this.wrap(p.img);
            // blink for the last ~2s before it disappears
            const left = p.expiresAt - time;
            p.img.setAlpha(left < 2000 ? (Math.sin(time * 0.02) > 0 ? 1 : 0.3) : 1);
        }
    }

    private collectPickup (p: Pickup, time: number)
    {
        this.burst(p.img.x, p.img.y, PICKUP_COLOR[p.kind], 14);
        if (p.kind === 'rapid') {
            this.rapidUntil = Math.max(this.rapidUntil, time) + RAPID_FIRE_DURATION * 1000;
            this.flashCenter('RAPID FIRE!');
        } else if (p.kind === 'shield') {
            this.invulnUntil = Math.max(this.invulnUntil, time) + SHIELD_DURATION * 1000;
            this.flashCenter('SHIELD!');
        } else {
            this.lives += 1;
            this.updateLivesText();
            this.flashCenter('+1 LIFE!');
        }
    }

    private flashCenter (msg: string)
    {
        this.centerText.setText(msg);
        this.time.delayedCall(900, () => { if (this.centerText.text === msg) this.centerText.setText(''); });
    }

    /** Shows remaining time on active pickups, so "only for a period of time" is visible. */
    private updateBuffText (time: number)
    {
        const parts: string[] = [];
        if (time < this.rapidUntil) parts.push(`RAPID ${((this.rapidUntil - time) / 1000).toFixed(1)}s`);
        if (time < this.invulnUntil) parts.push(`SHIELD ${((this.invulnUntil - time) / 1000).toFixed(1)}s`);
        this.buffText.setText(parts.join('   '));
    }

    private burst (x: number, y: number, color: number, count = 10)
    {
        const k = worldScale(this), size = Math.max(2, Math.round(2 * k));
        for (let i = 0; i < count; i++) {
            const a = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const s = Phaser.Math.FloatBetween(30, 110);
            const img = this.add.rectangle(x, y, size, size, color).setDepth(15);
            this.particles.push({ img, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.5, maxLife: 0.5 });
        }
    }

    update (time: number, deltaMs: number)
    {
        const dt = Math.min(0.033, deltaMs / 1000);
        const k = worldScale(this);

        if (this.startTime < 0) { this.startTime = time; this.invulnUntil = time + INVULN_TIME * 1000; }
        // background loops dusk -> night -> dusk, slowly, for as long as the run lasts
        this.bg.t = 0.5 - 0.5 * Math.cos((2 * Math.PI * (time - this.startTime)) / SKY_CYCLE_MS);
        this.bg.update(time);

        this.updateShip(dt, time, k);
        this.shipGlow.setPosition(this.ship.x, this.ship.y).setVisible(this.ship.visible).setAlpha(this.ship.alpha);
        this.updateBullets(dt, k);
        this.updateAsteroids(dt, k);
        this.updateSaucers(dt, k, time);
        this.updateEnemyBullets(dt, k);
        this.updatePickups(dt, k, time);
        this.updateParticles(dt, k);
        this.checkCollisions(time);
        if (this.endTime < 0) { this.spawnDirector(time); this.ufoDirector(time); }
        this.timeText.setText(formatTime(this.survivedMs(time)));
        this.updateBuffText(time);
        if (this.respawnAt >= 0 && time >= this.respawnAt) {
            this.respawnAt = -1;
            this.respawnShip(time);
        }
    }

    private wrap (o: { x: number; y: number })
    {
        const { width: W, height: H } = this.scale;
        o.x = Phaser.Math.Wrap(o.x, 0, W);
        o.y = Phaser.Math.Wrap(o.y, 0, H);
    }

    private updateShip (dt: number, time: number, k: number)
    {
        if (!this.shipAlive) return;
        const left = this.cursors.left.isDown || this.keyA.isDown;
        const right = this.cursors.right.isDown || this.keyD.isDown;
        const thrust = this.cursors.up.isDown || this.keyW.isDown;

        if (left) this.shipAngle -= TURN_SPEED * dt;
        if (right) this.shipAngle += TURN_SPEED * dt;
        this.ship.rotation = this.shipAngle;

        if (thrust) {
            this.shipVx += Math.sin(this.shipAngle) * THRUST * dt;
            this.shipVy += -Math.cos(this.shipAngle) * THRUST * dt;
        }
        const decay = Math.exp(-DRAG * dt);
        this.shipVx *= decay; this.shipVy *= decay;
        const speed = Math.hypot(this.shipVx, this.shipVy);
        if (speed > MAX_SPEED) { this.shipVx *= MAX_SPEED / speed; this.shipVy *= MAX_SPEED / speed; }

        this.ship.x += this.shipVx * k * dt;
        this.ship.y += this.shipVy * k * dt;
        this.wrap(this.ship);

        const invuln = time < this.invulnUntil;
        this.ship.setAlpha(invuln ? (Math.sin(time * 0.02) > 0 ? 1 : 0.25) : 1);

        // Default is press-and-release: one shot per press. Holding the key
        // down only keeps firing while Rapid Fire is active.
        const rapidActive = time < this.rapidUntil;
        const wantsFire = rapidActive ? this.keySpace.isDown : Phaser.Input.Keyboard.JustDown(this.keySpace);
        const cooldownMs = (rapidActive ? RAPID_FIRE_COOLDOWN : FIRE_COOLDOWN) * 1000;
        if (wantsFire && time - this.lastShot > cooldownMs) {
            this.lastShot = time;
            const nose = 9 * spriteScale(this);
            const bx = this.ship.x + Math.sin(this.shipAngle) * nose;
            const by = this.ship.y - Math.cos(this.shipAngle) * nose;
            const img = this.add.image(bx, by, 'bullet').setDepth(8).setScale(spriteScale(this));
            this.bullets.push({
                img,
                vx: Math.sin(this.shipAngle) * BULLET_SPEED + this.shipVx * 0.3,
                vy: -Math.cos(this.shipAngle) * BULLET_SPEED + this.shipVy * 0.3,
                life: BULLET_LIFE,
            });
        }
    }

    private updateBullets (dt: number, k: number)
    {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.life -= dt;
            if (b.life <= 0) { b.img.destroy(); this.bullets.splice(i, 1); continue; }
            b.img.x += b.vx * k * dt;
            b.img.y += b.vy * k * dt;
            this.wrap(b.img);
        }
    }

    private updateAsteroids (dt: number, k: number)
    {
        const { width: W, height: H } = this.scale;
        for (const a of this.asteroids) {
            a.img.x += a.vx * k * dt;
            a.img.y += a.vy * k * dt;
            // freshly spawned rocks start just outside the screen; only wrap
            // once they've drifted in, so they don't teleport to the far side
            const inside = a.img.x >= 0 && a.img.x <= W && a.img.y >= 0 && a.img.y <= H;
            if (inside || a.entered) {
                a.entered = true;
                this.wrap(a.img);
            }
            a.img.rotation += a.vr * dt;
        }
    }

    private updateSaucers (dt: number, k: number, time: number)
    {
        const { width: W } = this.scale;
        for (let i = this.saucers.length - 1; i >= 0; i--) {
            const sc = this.saucers[i];
            sc.img.x += sc.vx * k * dt;
            sc.img.y += sc.vy * k * dt + Math.sin(time * 0.003 + i) * 6 * k * dt;
            // saucers fly across and leave, rather than looping the screen forever
            if (sc.img.x < -30 * k || sc.img.x > W + 30 * k) { sc.img.destroy(); this.saucers.splice(i, 1); continue; }
            if (this.shipAlive && time >= sc.nextShotAt) {
                this.saucerFire(sc);
                sc.nextShotAt = time + Phaser.Math.Between(...UFO_SHOT_INTERVAL);
            }
        }
    }

    private updateEnemyBullets (dt: number, k: number)
    {
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const b = this.enemyBullets[i];
            b.life -= dt;
            if (b.life <= 0) { b.img.destroy(); this.enemyBullets.splice(i, 1); continue; }
            b.img.x += b.vx * k * dt;
            b.img.y += b.vy * k * dt;
            this.wrap(b.img);
        }
    }

    private destroySaucer (index: number, time: number)
    {
        const sc = this.saucers[index];
        this.score += UFO_SCORE[sc.big ? 'big' : 'small'];
        this.scoreText.setText('SCORE ' + this.score);
        this.burst(sc.img.x, sc.img.y, 0xFF8A3D, 14);
        this.maybeDropPickup(sc.img.x, sc.img.y, PICKUP_DROP_CHANCE_SAUCER, time);
        sc.img.destroy();
        this.saucers.splice(index, 1);
    }

    private updateParticles (dt: number, k: number)
    {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt;
            if (p.life <= 0) { p.img.destroy(); this.particles.splice(i, 1); continue; }
            p.img.x += p.vx * k * dt; p.img.y += p.vy * k * dt;
            p.vx *= 0.94; p.vy *= 0.94;
            p.img.setAlpha(p.life / p.maxLife);
        }
    }

    private destroyAsteroid (index: number, time: number)
    {
        const a = this.asteroids[index];
        this.score += TIER_SCORE[a.tier];
        this.scoreText.setText('SCORE ' + this.score);
        this.burst(a.img.x, a.img.y, 0xD81F26, a.tier === 0 ? 16 : 10);
        this.maybeDropPickup(a.img.x, a.img.y, PICKUP_DROP_CHANCE_ASTEROID, time);

        if (a.tier < 2) {
            for (let i = 0; i < 2; i++) {
                this.spawnAsteroid((a.tier + 1) as Tier, a.img.x, a.img.y, this.speedMul(time));
                this.asteroids[this.asteroids.length - 1].entered = true;
            }
        }
        a.img.destroy();
        this.asteroids.splice(this.asteroids.indexOf(a), 1);
    }

    private checkCollisions (time: number)
    {
        const ss = spriteScale(this);
        for (let ai = this.asteroids.length - 1; ai >= 0; ai--) {
            const a = this.asteroids[ai];
            const r = this.radius(a);
            for (let bi = this.bullets.length - 1; bi >= 0; bi--) {
                const b = this.bullets[bi];
                if (Phaser.Math.Distance.Between(a.img.x, a.img.y, b.img.x, b.img.y) < r + 1.5 * ss) {
                    b.img.destroy(); this.bullets.splice(bi, 1);
                    this.destroyAsteroid(ai, time);
                    break;
                }
            }
        }
        for (let si = this.saucers.length - 1; si >= 0; si--) {
            const sc = this.saucers[si];
            const r = (sc.big ? UFO_RADIUS.big : UFO_RADIUS.small) * ss;
            for (let bi = this.bullets.length - 1; bi >= 0; bi--) {
                const b = this.bullets[bi];
                if (Phaser.Math.Distance.Between(sc.img.x, sc.img.y, b.img.x, b.img.y) < r + 1.5 * ss) {
                    b.img.destroy(); this.bullets.splice(bi, 1);
                    this.destroySaucer(si, time);
                    break;
                }
            }
        }

        if (this.shipAlive && time > this.invulnUntil) {
            for (const a of this.asteroids) {
                if (Phaser.Math.Distance.Between(a.img.x, a.img.y, this.ship.x, this.ship.y) < this.radius(a) + 5 * ss) {
                    this.killShip(time);
                    break;
                }
            }
            for (const sc of this.saucers) {
                const r = (sc.big ? UFO_RADIUS.big : UFO_RADIUS.small) * ss;
                if (Phaser.Math.Distance.Between(sc.img.x, sc.img.y, this.ship.x, this.ship.y) < r + 5 * ss) {
                    this.killShip(time);
                    break;
                }
            }
            for (let bi = this.enemyBullets.length - 1; bi >= 0; bi--) {
                const b = this.enemyBullets[bi];
                if (Phaser.Math.Distance.Between(b.img.x, b.img.y, this.ship.x, this.ship.y) < 4 * ss) {
                    b.img.destroy(); this.enemyBullets.splice(bi, 1);
                    this.killShip(time);
                    break;
                }
            }
        }
        // pickups can be collected even while invulnerable/respawning
        if (this.shipAlive) {
            for (let pi = this.pickups.length - 1; pi >= 0; pi--) {
                const p = this.pickups[pi];
                if (Phaser.Math.Distance.Between(p.img.x, p.img.y, this.ship.x, this.ship.y) < 7 * ss) {
                    this.collectPickup(p, time);
                    p.img.destroy(); this.pickups.splice(pi, 1);
                }
            }
        }
    }

    private killShip (time: number)
    {
        this.shipAlive = false;
        this.burst(this.ship.x, this.ship.y, 0xffffff, 20);
        this.ship.setVisible(false);
        this.lives -= 1;
        this.updateLivesText();
        this.cameras.main.shake(180, 0.006);

        if (this.lives <= 0) {
            this.endTime = time;
            this.centerText.setText('');
            this.time.delayedCall(900, () => {
                this.registry.set('finalScore', this.score);
                this.registry.set('finalTimeMs', this.survivedMs(time));
                this.scene.start('GameOver');
            });
        } else {
            this.centerText.setText('SHIP LOST');
            this.respawnAt = time + RESPAWN_DELAY * 1000;
        }
    }

    private respawnShip (time: number)
    {
        const { width: W, height: H } = this.scale;
        this.ship.setPosition(W / 2, H / 2);
        this.shipVx = 0; this.shipVy = 0; this.shipAngle = 0;
        this.ship.rotation = 0; this.ship.setVisible(true);
        this.shipAlive = true;
        this.invulnUntil = time + INVULN_TIME * 1000;
        this.centerText.setText('');
    }
}
