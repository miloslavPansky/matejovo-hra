import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { loadProgress, type LevelInfo } from '../game/progress';
import { PixelText } from '../ui/PixelText';

/** Title and level select for the current world. Progress comes from localStorage. */
export class MenuScene extends Phaser.Scene {
  private selected = 0;
  private tiles: { box: Phaser.GameObjects.Rectangle; locked: boolean }[] = [];
  private levels: LevelInfo[] = [];

  constructor() {
    super('menu');
  }

  create(): void {
    this.levels = (this.registry.get('levels') as LevelInfo[] | undefined) ?? [];
    const progress = loadProgress();
    this.tiles = [];

    this.add.image(0, 0, 'bg-sky').setOrigin(0);
    this.add.image(0, 0, 'bg-far').setOrigin(0);
    this.add.image(0, 0, 'bg-mid').setOrigin(0);
    for (let x = 0; x < GAME_WIDTH; x += 16) {
      this.add.image(x, 208, 'tiles', 'sand').setOrigin(0);
      for (let r = 1; r < 4; r++) this.add.image(x, 208 + r * 16, 'tiles', 'stone').setOrigin(0);
    }
    this.add.image(70, 208 - 17, 'hero-a').setScale(1);
    this.add.image(GAME_WIDTH - 60, 208 - 23, 'gate');

    new PixelText(this, GAME_WIDTH / 2, 34, 'Matěj a Zlatá poušť', { size: 16, color: '#ffe9b0' }).setOrigin(0.5);
    new PixelText(this, GAME_WIDTH / 2, 62, `Kraj 1 · ${String(this.registry.get('world') ?? 'Zlaté duny')}`, { size: 8 }).setOrigin(0.5);

    const n = this.levels.length;
    const w = 64, gap = 12, x0 = GAME_WIDTH / 2 - ((n * w + (n - 1) * gap) / 2) + w / 2;
    this.levels.forEach((l, i) => {
      const locked = i >= progress.unlocked;
      const x = x0 + i * (w + gap), y = 120;
      const box = this.add.rectangle(x, y, w, 58, locked ? 0x6f6f6f : 0xd3cbb5).setStrokeStyle(3, 0x3b2a10);
      new PixelText(this, x, y - 10, String(i + 1), { size: 16, color: locked ? '#bdbdbd' : '#3b2a10', shadow: null }).setOrigin(0.5);
      const best = progress.best[l.key];
      const label = locked ? 'zamčeno' : best !== undefined ? `mince ${best}` : 'nový';
      new PixelText(this, x, y + 16, label, { size: 8, color: locked ? '#d0d0d0' : '#6d5c43', shadow: null }).setOrigin(0.5);
      if (!locked) {
        box.setInteractive({ useHandCursor: true });
        box.on('pointerdown', () => this.startLevel(i));
        box.on('pointerover', () => { this.selected = i; this.highlight(); });
      }
      this.tiles.push({ box, locked });
    });
    this.selected = Math.min(progress.unlocked, n) - 1;
    this.highlight();

    new PixelText(this, GAME_WIDTH / 2, 166, 'Vyber level šipkami a Enterem, nebo na něj klepni.', { size: 8 }).setOrigin(0.5);
    new PixelText(this, GAME_WIDTH - 4, GAME_HEIGHT - 4, `verze ${__APP_VERSION__}`, { size: 8, color: '#3b2a10', shadow: null }).setOrigin(1);

    const kb = this.input.keyboard;
    kb?.on('keydown-LEFT', () => this.move(-1));
    kb?.on('keydown-RIGHT', () => this.move(1));
    kb?.on('keydown-ENTER', () => this.startLevel(this.selected));
    kb?.on('keydown-SPACE', () => this.startLevel(this.selected));
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
    this.scene.start('game', { level: l.key });
  }
}
