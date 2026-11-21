import Phaser from 'phaser';
import { createSun } from '../art/sky';
import { isMuted, onMutedChange, sfx, toggleMuted } from '../audio/sound';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { loadProgress, type LevelInfo } from '../game/progress';
import { PixelText } from '../ui/PixelText';

/** Title and level select for the current world. Progress comes from localStorage. */
export class MenuScene extends Phaser.Scene {
  private static readonly PER_ROW = 5;
  private selected = 0;
  private tiles: { box: Phaser.GameObjects.Rectangle; locked: boolean }[] = [];
  private levels: LevelInfo[] = [];
  private clouds: Phaser.GameObjects.TileSprite[] = [];

  constructor() {
    super('menu');
  }

  create(): void {
    this.levels = (this.registry.get('levels') as LevelInfo[] | undefined) ?? [];
    const progress = loadProgress();
    this.tiles = [];

    this.add.image(0, 0, 'bg-sky').setOrigin(0);
    createSun(this, 30, 32, 1);
    this.clouds = [
      this.add.tileSprite(0, 0, GAME_WIDTH, 110, 'bg-clouds-far').setOrigin(0),
      this.add.tileSprite(0, 0, GAME_WIDTH, 110, 'bg-clouds').setOrigin(0),
    ];
    this.add.image(0, 0, 'bg-far').setOrigin(0);
    this.add.image(0, 0, 'bg-mid').setOrigin(0);
    for (let x = 0; x < GAME_WIDTH; x += 16) {
      this.add.image(x, 208, 'tiles', 'sand').setOrigin(0);
      for (let r = 1; r < 4; r++) this.add.image(x, 208 + r * 16, 'tiles', 'stone').setOrigin(0);
    }
    this.add.image(70, 208 - 17, 'hero-a').setScale(1);
    this.add.image(GAME_WIDTH - 60, 208 - 23, 'gate');

    new PixelText(this, GAME_WIDTH / 2, 34, 'Matěj a Zlatá poušť', { size: 16, color: '#ffe9b0' }).setOrigin(0.5);
    new PixelText(this, GAME_WIDTH / 2, 56, `Kraj 1 · ${String(this.registry.get('world') ?? 'Zlaté duny')}`, { size: 8 }).setOrigin(0.5);
    this.add.sprite(GAME_WIDTH / 2 - 76, 194, 'coin', '0').play('coin-spin');
    new PixelText(this, GAME_WIDTH / 2 - 66, 194, `Mince celkem: ${progress.totalCoins}`, { size: 8 }).setOrigin(0, 0.5);

    // Bottom-left buttons: intro replay and sound on/off.
    const introBtn = new PixelText(this, 8, GAME_HEIGHT - 8, 'Intro (I)', { size: 8, color: '#3b2a10', shadow: null, background: '#e9dfc4', padding: 4 })
      .setOrigin(0, 1).setInteractive({ useHandCursor: true });
    introBtn.on('pointerdown', () => this.playIntro());
    const sound = this.add.image(GAME_WIDTH - 22, 6, isMuted() ? 'icon-sound-off' : 'icon-sound-on').setOrigin(0);
    this.add.zone(GAME_WIDTH - 16, 12, 22, 22).setInteractive({ useHandCursor: true }).on('pointerdown', () => { toggleMuted(); sfx.click(); });
    const off = onMutedChange((m) => sound.setTexture(m ? 'icon-sound-off' : 'icon-sound-on'));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, off);

    // Level tiles in rows of five.
    const n = this.levels.length;
    const w = 64, h = 40, gap = 12, perRow = MenuScene.PER_ROW;
    const x0 = GAME_WIDTH / 2 - ((perRow * w + (perRow - 1) * gap) / 2) + w / 2;
    this.levels.forEach((l, i) => {
      const locked = i >= progress.unlocked;
      const x = x0 + (i % perRow) * (w + gap), y = 94 + Math.floor(i / perRow) * (h + 8);
      const box = this.add.rectangle(x, y, w, h, locked ? 0x6f6f6f : 0xd3cbb5).setStrokeStyle(3, 0x3b2a10);
      new PixelText(this, x, y - 7, String(i + 1), { size: 16, color: locked ? '#bdbdbd' : '#3b2a10', shadow: null }).setOrigin(0.5);
      const best = progress.best[l.key];
      if (!locked && best !== undefined) {
        this.add.image(x - 12, y + 12, 'coin', '0');
        new PixelText(this, x - 5, y + 12, String(best), { size: 8, color: '#6d5c43', shadow: null }).setOrigin(0, 0.5);
      } else {
        new PixelText(this, x, y + 12, locked ? 'zamčeno' : 'nový', { size: 8, color: locked ? '#d0d0d0' : '#6d5c43', shadow: null }).setOrigin(0.5);
      }
      if (!locked) {
        box.setInteractive({ useHandCursor: true });
        box.on('pointerdown', () => this.startLevel(i));
        box.on('pointerover', () => { this.selected = i; this.highlight(); });
      }
      this.tiles.push({ box, locked });
    });
    this.selected = Math.min(progress.unlocked, n) - 1;
    this.highlight();

    new PixelText(this, GAME_WIDTH / 2, 178, 'Šipky + Enter, nebo klepni', { size: 8 }).setOrigin(0.5);
    new PixelText(this, GAME_WIDTH - 4, GAME_HEIGHT - 4, `verze ${__APP_VERSION__}`, { size: 8, color: '#3b2a10', shadow: null }).setOrigin(1);

    const kb = this.input.keyboard;
    kb?.on('keydown-LEFT', () => this.move(-1));
    kb?.on('keydown-RIGHT', () => this.move(1));
    kb?.on('keydown-UP', () => this.move(-MenuScene.PER_ROW));
    kb?.on('keydown-DOWN', () => this.move(MenuScene.PER_ROW));
    kb?.on('keydown-ENTER', () => this.startLevel(this.selected));
    kb?.on('keydown-SPACE', () => this.startLevel(this.selected));
    kb?.on('keydown-I', () => this.playIntro());
    kb?.on('keydown-M', () => toggleMuted());
  }

  update(time: number): void {
    this.clouds.forEach((c, i) => { c.tilePositionX = Math.round((time / 1000) * (i ? 5 : 2)); });
  }

  private playIntro(): void {
    this.scene.start('intro');
  }

  private move(d: number): void {
    const next = this.selected + d;
    if (next < 0 || next >= this.tiles.length || this.tiles[next].locked) return;
    this.selected = next;
    this.highlight();
  }

  private highlight(): void {
    this.tiles.forEach((t, i) => t.box.setStrokeStyle(3, i === this.selected ? 0xffffff : 0x3b2a10));
  }

  private startLevel(i: number): void {
    const l = this.levels[i];
    if (!l || this.tiles[i]?.locked) return;
    sfx.click();
    this.scene.start('game', { level: l.key });
  }
}
