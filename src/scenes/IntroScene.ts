import Phaser from 'phaser';
import { SANDBOX } from '../art/intro';
import { createSun } from '../art/sky';
import { sfx, unlockAudio } from '../audio/sound';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { updateProgress } from '../game/progress';
import { PixelText } from '../ui/PixelText';

interface Bit { x: number; y: number; vx: number; vy: number; life: number }
interface SwirlBit { a: number; r: number; speed: number; lift: number; col: number }
interface Streak { x: number; y: number; len: number; speed: number; col: number }

const SAND_COLS = [0xecd48c, 0xe2c271, 0xf6e3a8, 0xc9a656];

/**
 * Story intro (about 20 s): Matěj digs in the sandbox, finds the golden sun stone, the sand
 * swirls, he falls through a sandy tunnel and lands in the Golden Desert.
 */
export class IntroScene extends Phaser.Scene {
  private hero!: Phaser.GameObjects.Sprite;
  private caption!: PixelText;
  private fx!: Phaser.GameObjects.Graphics;
  private bits: Bit[] = [];
  private swirl: SwirlBit[] = [];
  private streaks: Streak[] = [];
  private phase: 'card' | 'garden' | 'tunnel' | 'desert' = 'card';
  private done = false;

  constructor() {
    super('intro');
  }

  create(data?: { showCard?: boolean }): void {
    this.bits = [];
    this.swirl = [];
    this.streaks = [];
    this.done = false;
    this.fx = this.add.graphics().setDepth(50);

    const skip = new PixelText(this, GAME_WIDTH - 6, 6, 'Přeskočit »', { size: 8, color: '#3b2a10', shadow: null, background: '#e9dfc4', padding: 3 })
      .setOrigin(1, 0).setDepth(200).setInteractive({ useHandCursor: true });
    skip.on('pointerdown', () => this.finish());
    this.input.keyboard?.on('keydown-ESC', () => this.finish());

    if (data?.showCard) this.showCard();
    else this.startStory();
  }

  /** First launch: a title card; the tap also unlocks audio so the intro can have sound. */
  private showCard(): void {
    this.phase = 'card';
    const card = this.add.container(0, 0);
    card.add(this.add.image(0, 0, 'bg-sky').setOrigin(0));
    card.add(new PixelText(this, GAME_WIDTH / 2, 100, 'Matěj a Zlatá poušť', { size: 16, color: '#ffe9b0' }).setOrigin(0.5));
    const hint = new PixelText(this, GAME_WIDTH / 2, 150, 'Klepni nebo stiskni klávesu', { size: 8 }).setOrigin(0.5);
    card.add(hint);
    this.tweens.add({ targets: hint, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });
    const go = () => {
      if (this.phase !== 'card') return;
      unlockAudio();
      card.destroy();
      this.startStory();
    };
    this.input.once('pointerdown', go);
    this.input.keyboard?.once('keydown', (e: KeyboardEvent) => { if (e.key !== 'Escape') go(); });
  }

  private startStory(): void {
    this.phase = 'garden';
    const garden = this.add.container(0, 0);
    garden.add(this.add.image(0, 0, 'intro-garden').setOrigin(0));
    const sun = createSun(this, 404, 44, 1);
    garden.add(sun);
    const clouds = this.add.tileSprite(0, 0, GAME_WIDTH, 110, 'bg-clouds').setOrigin(0);
    garden.add(clouds);
    this.tweens.add({ targets: clouds, tilePositionX: 200, duration: 40000 });

    const groundY = SANDBOX.top;
    this.hero = this.add.sprite(300, groundY - 16, 'hero-a').setDepth(10);
    const shovel = this.add.image(314, groundY - 8, 'intro-shovel').setOrigin(0.2, 0.2).setDepth(11);
    const stone = this.add.image(332, groundY + 3, 'intro-stone').setDepth(9).setScale(0);

    const box = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 20, GAME_WIDTH - 24, 26, 0x1b1206, 0.82).setStrokeStyle(2, 0xf2d79a).setDepth(150);
    this.caption = new PixelText(this, GAME_WIDTH / 2, GAME_HEIGHT - 20, ' ', { size: 8, color: '#ffffff' }).setOrigin(0.5).setDepth(151);
    void box;

    const at = (ms: number, fn: () => void) => this.time.delayedCall(ms, () => { if (!this.done) fn(); });

    // 1. digging
    this.say('Matěj si hraje na pískovišti za domem.');
    let dig = false;
    const digTimer = this.time.addEvent({
      delay: 280, loop: true, startAt: 0, paused: true,
      callback: () => {
        dig = !dig;
        this.hero.setTexture(dig ? 'hero-jump' : 'hero-a');
        shovel.setAngle(dig ? -35 : 25).setPosition(dig ? 312 : 316, dig ? groundY - 14 : groundY - 6);
        if (!dig) {
          sfx.dig();
          for (let i = 0; i < 4; i++) this.bits.push({ x: 322, y: groundY, vx: 20 + Math.random() * 50, vy: -60 - Math.random() * 50, life: 0.7 });
        }
      },
    });
    at(600, () => { digTimer.paused = false; });

    // 2. the golden stone
    at(4200, () => {
      digTimer.remove();
      this.hero.setTexture('hero-jump');
      this.tweens.add({ targets: this.hero, y: this.hero.y - 10, duration: 160, yoyo: true, onComplete: () => this.hero.setTexture('hero-a') });
      this.tweens.add({ targets: stone, scale: 1, y: groundY - 4, duration: 400, ease: 'Back.Out' });
      sfx.shimmer();
      this.say('Lopatka narazila na zlatý kámen se sluncem!');
      this.time.addEvent({ delay: 350, repeat: 6, callback: () => this.sparkle(stone.x + Phaser.Math.Between(-8, 8), stone.y + Phaser.Math.Between(-8, 6), 0xfff3a0) });
    });

    // 3. the sand starts to swirl
    at(6800, () => {
      this.say('Písek se začal točit…');
      sfx.whoosh();
      this.cameras.main.shake(2600, 0.004);
      for (let i = 0; i < 90; i++) {
        this.swirl.push({ a: Math.random() * Math.PI * 2, r: 30 + Math.random() * 60, speed: 3 + Math.random() * 3, lift: Math.random() * 30, col: SAND_COLS[i % SAND_COLS.length] });
      }
    });

    // 4. Matěj sinks into the sand
    at(8400, () => {
      const maskShape = this.make.graphics({}, false).fillRect(0, 0, GAME_WIDTH, groundY + 1);
      this.hero.setMask(maskShape.createGeometryMask());
      this.hero.setTexture('hero-jump');
      this.tweens.add({ targets: this.hero, y: this.hero.y + 42, angle: 20, duration: 1000, ease: 'Quad.In' });
      this.tweens.add({ targets: [shovel, stone], alpha: 0, duration: 600 });
    });
    at(9500, () => this.cameras.main.fadeOut(350, 0, 0, 0));

    // 5. falling through the tunnel
    at(9900, () => {
      this.phase = 'tunnel';
      garden.setVisible(false);
      shovel.setVisible(false);
      stone.setVisible(false);
      this.swirl = [];
      this.hero.clearMask(true);
      this.hero.setPosition(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 10).setScale(2).setAngle(0);
      for (let i = 0; i < 46; i++) this.streaks.push(this.newStreak(Math.random() * GAME_HEIGHT));
      this.say('Padá… a padá…');
      sfx.fall();
      this.cameras.main.fadeIn(300, 0, 0, 0);
    });

    // 6. landing in the desert
    at(12400, () => {
      this.phase = 'desert';
      this.streaks = [];
      this.cameras.main.flash(450, 255, 246, 200);
      const desert = this.add.container(0, 0).setDepth(-1);
      desert.add(this.add.image(0, 0, 'bg-sky').setOrigin(0));
      desert.add(createSun(this, 360, 58, 0));
      desert.add(this.add.image(0, 0, 'bg-clouds').setOrigin(0));
      desert.add(this.add.image(0, 0, 'bg-far').setOrigin(0));
      desert.add(this.add.image(0, 0, 'bg-mid').setOrigin(0));
      desert.add(this.add.image(-200, 0, 'bg-deco').setOrigin(0));
      for (let x = 0; x < GAME_WIDTH; x += 16) {
        desert.add(this.add.image(x, 208, 'tiles', 'sand').setOrigin(0));
        for (let r = 1; r < 4; r++) desert.add(this.add.image(x, 208 + r * 16, 'tiles', 'stone').setOrigin(0));
      }
      this.hero.setScale(1).setAngle(0).setTexture('hero-jump').setPosition(200, -30);
      this.tweens.add({
        targets: this.hero, y: 208 - 16, duration: 900, ease: 'Bounce.Out',
        onComplete: () => {
          sfx.land();
          this.hero.setTexture('hero-a');
          for (let i = 0; i < 10; i++) this.bits.push({ x: 200 + Phaser.Math.Between(-8, 8), y: 207, vx: Phaser.Math.Between(-60, 60), vy: -30 - Math.random() * 40, life: 0.6 });
        },
      });
      this.say('…a přistál uprostřed Zlaté pouště!');
    });

    at(15800, () => {
      this.say('Jak se teď Matěj dostane domů? Pomoz mu!');
      this.hero.play('hero-walk');
      this.tweens.add({ targets: this.hero, x: 290, duration: 2200, onComplete: () => { this.hero.stop(); this.hero.setTexture('hero-a'); } });
    });
    at(20000, () => this.finish());
  }

  private newStreak(y: number): Streak {
    return { x: Math.random() * GAME_WIDTH, y, len: 6 + Math.random() * 26, speed: 260 + Math.random() * 320, col: SAND_COLS[Math.floor(Math.random() * SAND_COLS.length)] };
  }

  private say(text: string): void {
    this.caption.setText(text);
  }

  private sparkle(x: number, y: number, tint: number): void {
    const e = this.add.particles(x, y, 'spark', { speed: { min: 20, max: 60 }, lifespan: 400, quantity: 6, scale: { start: 1, end: 0 }, tint, emitting: false }).setDepth(40);
    e.explode(6);
    this.time.delayedCall(500, () => e.destroy());
  }

  update(_time: number, delta: number): void {
    const dt = delta / 1000;
    const g = this.fx;
    g.clear();

    if (this.phase === 'tunnel') {
      g.fillStyle(0x24160a, 1).fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      g.fillStyle(0x3a2412, 1).fillRect(GAME_WIDTH / 2 - 90, 0, 180, GAME_HEIGHT);
      for (const s of this.streaks) {
        s.y -= s.speed * dt;
        if (s.y + s.len < 0) Object.assign(s, this.newStreak(GAME_HEIGHT + Math.random() * 40));
        g.fillStyle(s.col, 0.9).fillRect(Math.round(s.x), Math.round(s.y), 1, Math.round(s.len));
      }
      this.hero.setDepth(60);
      this.hero.angle += 180 * dt;
    }

    if (this.swirl.length) {
      const cx = 326, cy = SANDBOX.top + 2;
      for (const p of this.swirl) {
        p.a += p.speed * dt;
        p.r = Math.max(6, p.r - 18 * dt);
        p.lift = Math.max(0, p.lift - 8 * dt);
        g.fillStyle(p.col, 1).fillRect(Math.round(cx + Math.cos(p.a) * p.r), Math.round(cy + Math.sin(p.a) * p.r * 0.3 - p.lift), 2, 2);
      }
    }

    this.bits = this.bits.filter((b) => (b.life -= dt) > 0);
    for (const b of this.bits) {
      b.vy += 220 * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      g.fillStyle(0xe2c271, 1).fillRect(Math.round(b.x), Math.round(b.y), 2, 2);
    }
  }

  private finish(): void {
    if (this.done) return;
    this.done = true;
    updateProgress({ introSeen: true });
    unlockAudio();
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('menu'));
  }
}
