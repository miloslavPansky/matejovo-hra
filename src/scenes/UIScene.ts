import Phaser from 'phaser';
import { FONT, GAME_HEIGHT, GAME_WIDTH, LIVES } from '../config';
import { touch } from '../game/Controls';
import { GAME_EVENTS, type HudState } from './GameScene';

interface TouchButton {
  x: number;
  y: number;
  r: number;
  key: 'left' | 'right' | 'jump';
  gfx: Phaser.GameObjects.Graphics;
}

const TEXT = { fontFamily: FONT, color: '#ffffff' };

/** HUD (hearts, coins), touch controls, pause menu, toasts and the level-complete screen. */
export class UIScene extends Phaser.Scene {
  private hearts: Phaser.GameObjects.Image[] = [];
  private coinText!: Phaser.GameObjects.Text;
  private toastText!: Phaser.GameObjects.Text;
  private buttons: TouchButton[] = [];
  private touchUi!: Phaser.GameObjects.Container;
  private overlay: Phaser.GameObjects.Container | null = null;
  private touchEnabled = false;

  constructor() {
    super('ui');
  }

  create(): void {
    this.input.addPointer(3);
    for (let i = 0; i < LIVES; i++) this.hearts.push(this.add.image(8 + i * 13, 8, 'heart').setOrigin(0).setScale(1));
    this.add.sprite(GAME_WIDTH - 54, 8, 'coin', '0').setOrigin(0).play('coin-spin');
    this.coinText = this.add.text(GAME_WIDTH - 40, 6, '0', { ...TEXT, fontSize: '12px' }).setShadow(1, 1, '#3b2a10', 0, false, true);
    this.toastText = this.add.text(GAME_WIDTH / 2, 56, '', { ...TEXT, fontSize: '16px', color: '#ffe9b0' })
      .setOrigin(0.5).setShadow(1, 1, '#3b2a10', 0, false, true).setAlpha(0);

    const pause = this.add.text(GAME_WIDTH / 2, 4, 'II', { ...TEXT, fontSize: '12px', backgroundColor: '#00000055', padding: { x: 6, y: 2 } })
      .setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
    pause.on('pointerdown', () => this.togglePause());

    this.createTouchControls();
    this.touchEnabled = this.sys.game.device.input.touch;
    this.touchUi.setVisible(this.touchEnabled);
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.wasTouch && !this.touchEnabled) {
        this.touchEnabled = true;
        this.touchUi.setVisible(true);
      }
    });

    this.input.keyboard?.on('keydown-ESC', () => this.togglePause());
    this.input.keyboard?.on('keydown-P', () => this.togglePause());
    this.input.keyboard?.on('keydown-ENTER', () => { if (this.overlay) this.restartLevel(); });

    const ev = this.game.events;
    ev.on(GAME_EVENTS.hud, this.onHud, this);
    ev.on(GAME_EVENTS.toast, this.showToast, this);
    ev.on(GAME_EVENTS.complete, this.onComplete, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      ev.off(GAME_EVENTS.hud, this.onHud, this);
      ev.off(GAME_EVENTS.toast, this.showToast, this);
      ev.off(GAME_EVENTS.complete, this.onComplete, this);
    });
  }

  private createTouchControls(): void {
    this.touchUi = this.add.container(0, 0);
    const defs: Omit<TouchButton, 'gfx'>[] = [
      { key: 'left', x: 36, y: GAME_HEIGHT - 36, r: 24 },
      { key: 'right', x: 94, y: GAME_HEIGHT - 36, r: 24 },
      { key: 'jump', x: GAME_WIDTH - 42, y: GAME_HEIGHT - 42, r: 30 },
    ];
    for (const d of defs) {
      const gfx = this.add.graphics();
      this.touchUi.add(gfx);
      this.buttons.push({ ...d, gfx });
      if (d.key === 'jump') this.touchUi.add(this.add.text(d.x, d.y, 'SKOK', { ...TEXT, fontSize: '12px' }).setOrigin(0.5));
    }
    this.drawButtons();
  }

  private drawButtons(): void {
    for (const b of this.buttons) {
      const down = touch[b.key];
      b.gfx.clear();
      b.gfx.fillStyle(0x3c3c3c, down ? 0.7 : 0.4).fillCircle(b.x, b.y, b.r);
      b.gfx.lineStyle(2, 0xffffff, down ? 1 : 0.7).strokeCircle(b.x, b.y, b.r);
      if (b.key !== 'jump') {
        const s = b.key === 'left' ? -1 : 1;
        b.gfx.fillStyle(0xffffff, 0.9).fillTriangle(b.x + s * 9, b.y, b.x - s * 6, b.y - 9, b.x - s * 6, b.y + 9);
      }
    }
  }

  update(): void {
    let left = false, right = false, jump = false;
    if (this.touchEnabled && !this.overlay) {
      for (const p of this.input.manager.pointers) {
        if (!p.isDown || !p.wasTouch) continue;
        for (const b of this.buttons) {
          if (Phaser.Math.Distance.Between(p.x, p.y, b.x, b.y) <= b.r + 12) {
            if (b.key === 'left') left = true;
            else if (b.key === 'right') right = true;
            else jump = true;
          }
        }
      }
    }
    if (left !== touch.left || right !== touch.right || jump !== touch.jump) {
      touch.left = left;
      touch.right = right;
      touch.jump = jump;
      this.drawButtons();
    }
  }

  private onHud(s: HudState): void {
    this.hearts.forEach((h, i) => h.setTexture(i < s.hearts ? 'heart' : 'heart-empty'));
    this.coinText.setText(`${s.coins}/${s.total}`);
  }

  private showToast(text: string): void {
    this.tweens.killTweensOf(this.toastText);
    this.toastText.setText(text).setAlpha(1).setScale(0.8);
    this.tweens.add({ targets: this.toastText, scale: 1, duration: 150 });
    this.tweens.add({ targets: this.toastText, alpha: 0, delay: 1500, duration: 400 });
  }

  private makeOverlay(title: string, lines: string[], buttons: [string, () => void][]): void {
    this.closeOverlay();
    const c = this.add.container(0, 0).setDepth(100);
    c.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x1b1206, 0.72).setOrigin(0).setInteractive());
    c.add(this.add.text(GAME_WIDTH / 2, 62, title, { ...TEXT, fontSize: '24px', color: '#ffd36a' }).setOrigin(0.5).setShadow(2, 2, '#000000', 0, false, true));
    lines.forEach((l, i) => c.add(this.add.text(GAME_WIDTH / 2, 98 + i * 16, l, { ...TEXT, fontSize: '12px' }).setOrigin(0.5)));
    buttons.forEach(([label, fn], i) => {
      const y = 150 + i * 34;
      const bg = this.add.rectangle(GAME_WIDTH / 2, y, 150, 26, i === 0 ? 0x3c8527 : 0x6f6f6f).setStrokeStyle(2, 0x1b1b1b).setInteractive({ useHandCursor: true });
      bg.on('pointerdown', fn);
      c.add(bg);
      c.add(this.add.text(GAME_WIDTH / 2, y, label, { ...TEXT, fontSize: '13px' }).setOrigin(0.5));
    });
    c.add(this.add.text(GAME_WIDTH - 4, GAME_HEIGHT - 4, `verze ${__APP_VERSION__}`, { ...TEXT, fontSize: '8px', color: '#bfae86' }).setOrigin(1));
    this.overlay = c;
    touch.left = touch.right = touch.jump = false;
    this.drawButtons();
  }

  private closeOverlay(): void {
    this.overlay?.destroy();
    this.overlay = null;
  }

  private togglePause(): void {
    const game = this.scene.get('game');
    if (this.overlay) {
      if (game.scene.isPaused()) {
        this.closeOverlay();
        this.scene.resume('game');
      }
      return;
    }
    this.scene.pause('game');
    this.makeOverlay('Pauza', ['Šipky nebo A/D běh, mezerník nebo šipka nahoru skok.'], [
      ['Pokračovat', () => this.togglePause()],
      ['Hrát znovu', () => this.restartLevel()],
    ]);
  }

  private onComplete(r: { coins: number; total: number }): void {
    this.makeOverlay('Level dokončen!', [`Mince: ${r.coins} z ${r.total}`, r.coins === r.total ? 'Všechny mince! Bedřich bude mít radost.' : 'Někde ještě nějaké mince zůstaly.'], [
      ['Hrát znovu', () => this.restartLevel()],
    ]);
  }

  private restartLevel(): void {
    this.closeOverlay();
    const game = this.scene.get('game');
    game.scene.restart();
  }
}
