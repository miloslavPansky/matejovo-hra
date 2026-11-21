import Phaser from 'phaser';
import { sfx } from '../audio/sound';
import { GAME_WIDTH } from '../config';
import { loadProgress } from '../game/progress';
import { BADGES } from '../game/rules';
import { PixelText } from '../ui/PixelText';
import { Button, desertBackdrop } from '../ui/widgets';

/** Overview of all badges: gold medals for the earned ones, grey for the rest. */
export class BadgesScene extends Phaser.Scene {
  private static readonly PER_ROW = 5;
  private cards: Phaser.GameObjects.Rectangle[] = [];
  private info!: PixelText;
  private selected = 0;
  private moveClouds: (time: number) => void = () => undefined;

  constructor() {
    super('badges');
  }

  create(): void {
    const earned = new Set(loadProgress().badges);
    this.cards = [];
    this.selected = 0;
    this.moveClouds = desertBackdrop(this);
    new PixelText(this, GAME_WIDTH / 2, 16, 'Odznaky', { size: 16, color: '#ffe9b0' }).setOrigin(0.5);
    new PixelText(this, GAME_WIDTH / 2, 36, `Máš ${earned.size} z ${BADGES.length}`, { size: 8 }).setOrigin(0.5);

    const w = 88, h = 46, gap = 4, perRow = BadgesScene.PER_ROW;
    const x0 = GAME_WIDTH / 2 - (perRow * w + (perRow - 1) * gap) / 2 + w / 2;
    BADGES.forEach((b, i) => {
      const got = earned.has(b.id);
      const x = x0 + (i % perRow) * (w + gap), y = 76 + Math.floor(i / perRow) * (h + 6);
      const card = this.add.rectangle(x, y, w, h, got ? 0xe9dfc4 : 0x8a8478).setStrokeStyle(2, 0x3b2a10).setInteractive({ useHandCursor: true });
      card.on('pointerdown', () => this.select(i));
      card.on('pointerover', () => this.select(i));
      this.add.image(x, y - 6, got ? 'medal' : 'medal-locked').setScale(2);
      new PixelText(this, x, y + 14, b.name, { size: 8, color: got ? '#3b2a10' : '#d6d0c4', shadow: null }).setOrigin(0.5);
      this.cards.push(card);
    });

    this.info = new PixelText(this, GAME_WIDTH / 2, 226, ' ', { size: 8, color: '#3b2a10', shadow: null, background: '#fff6dc', padding: 4 }).setOrigin(0.5);
    new Button(this, 66, 252, 116, 'Zpět (Esc)', () => this.leave());

    const kb = this.input.keyboard;
    kb?.on('keydown-ESC', () => this.leave());
    kb?.on('keydown-ENTER', () => this.leave());
    kb?.on('keydown-LEFT', () => this.select(this.selected - 1));
    kb?.on('keydown-RIGHT', () => this.select(this.selected + 1));
    kb?.on('keydown-UP', () => this.select(this.selected - perRow));
    kb?.on('keydown-DOWN', () => this.select(this.selected + perRow));
    this.select(0);
  }

  update(time: number): void {
    this.moveClouds(time);
  }

  private select(i: number): void {
    if (i < 0 || i >= BADGES.length) return;
    this.selected = i;
    this.cards.forEach((c, k) => c.setStrokeStyle(k === i ? 3 : 2, k === i ? 0xffffff : 0x3b2a10));
    this.info.setText(BADGES[i].info);
  }

  private leave(): void {
    sfx.click();
    this.scene.start('menu');
  }
}
