import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, LIVES } from '../config';
import { touch } from '../game/Controls';
import { PixelText } from '../ui/PixelText';
import { GAME_EVENTS, type CompleteResult, type HudState } from './GameScene';

interface TouchButton {
  x: number;
  y: number;
  r: number;
  key: 'left' | 'right' | 'jump';
  gfx: Phaser.GameObjects.Graphics;
}

/** HUD (hearts, coins), touch controls, pause menu, toasts and the level-complete screen. */
export class UIScene extends Phaser.Scene {
  private hearts: Phaser.GameObjects.Image[] = [];
  private coinText!: PixelText;
  private toastText!: PixelText;
  private buttons: TouchButton[] = [];
  private touchUi!: Phaser.GameObjects.Container;
  private overlay: Phaser.GameObjects.Container | null = null;
  private touchEnabled = false;
  private primaryAction: (() => void) | null = null;

  constructor() {
    super('ui');
  }

  create(): void {
    // The scene instance is reused when it is launched again, so reset per-run state.
    this.hearts = [];
    this.buttons = [];
    this.overlay = null;
    this.primaryAction = null;
    if (this.input.manager.pointersTotal < 4) this.input.addPointer(4 - this.input.manager.pointersTotal);
    for (let i = 0; i < LIVES; i++) this.hearts.push(this.add.image(8 + i * 13, 8, 'heart').setOrigin(0).setScale(1));
    this.add.sprite(GAME_WIDTH - 54, 8, 'coin', '0').setOrigin(0).play('coin-spin');
    this.coinText = new PixelText(this, GAME_WIDTH - 41, 9, '0', { size: 8 }).setOrigin(0);
    this.toastText = new PixelText(this, GAME_WIDTH / 2, 56, ' ', { size: 16, color: '#ffe9b0' }).setOrigin(0.5).setAlpha(0);

    const pause = new PixelText(this, GAME_WIDTH / 2, 3, 'II', { size: 8, shadow: null, background: '#4a3a22', padding: 4 })
      .setOrigin(0.5, 0).setAlpha(0.85).setInteractive({ useHandCursor: true });
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
    this.input.keyboard?.on('keydown-ENTER', () => { if (this.overlay) this.primaryAction?.(); });

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
      if (d.key === 'jump') this.touchUi.add(new PixelText(this, d.x, d.y, 'SKOK', { size: 8 }).setOrigin(0.5));
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
    this.toastText.setText(text).setAlpha(1);
    this.tweens.add({ targets: this.toastText, alpha: 0, delay: 1500, duration: 400 });
  }

  private makeOverlay(title: string, lines: string[], buttons: [string, () => void][]): void {
    this.closeOverlay();
    const c = this.add.container(0, 0).setDepth(100);
    c.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x1b1206, 0.72).setOrigin(0).setInteractive());
    c.add(new PixelText(this, GAME_WIDTH / 2, 62, title, { size: 16, color: '#ffd36a', shadow: '#000000' }).setOrigin(0.5));
    lines.forEach((l, i) => c.add(new PixelText(this, GAME_WIDTH / 2, 98 + i * 14, l, { size: 8 }).setOrigin(0.5)));
    buttons.forEach(([label, fn], i) => {
      if (i === 0) this.primaryAction = fn;
      const y = 150 + i * 34;
      const bg = this.add.rectangle(GAME_WIDTH / 2, y, 150, 26, i === 0 ? 0x3c8527 : 0x6f6f6f).setStrokeStyle(2, 0x1b1b1b).setInteractive({ useHandCursor: true });
      bg.on('pointerdown', fn);
      c.add(bg);
      c.add(new PixelText(this, GAME_WIDTH / 2, y, label, { size: 8, shadow: '#1b1b1b' }).setOrigin(0.5));
    });
    c.add(new PixelText(this, GAME_WIDTH - 4, GAME_HEIGHT - 4, `verze ${__APP_VERSION__}`, { size: 8, color: '#bfae86', shadow: null }).setOrigin(1));
    this.overlay = c;
    touch.left = touch.right = touch.jump = false;
    this.drawButtons();
  }

  private closeOverlay(): void {
    this.overlay?.destroy();
    this.overlay = null;
    this.primaryAction = null;
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
    this.makeOverlay('Pauza', ['Šipky nebo A/D běh, mezerník nebo šipka nahoru skok.', 'Na štíra i rostlinu se dá skočit shora.'], [
      ['Pokračovat', () => this.togglePause()],
      ['Hrát znovu', () => this.restartLevel()],
      ['Výběr levelu', () => this.toMenu()],
    ]);
  }

  private onComplete(r: CompleteResult): void {
    const lines = [`Mince: ${r.coins} z ${r.total}`, r.coins === r.total ? 'Všechny mince! Bedřich bude mít radost.' : 'Někde ještě nějaké mince zůstaly.'];
    const next = r.next;
    if (next) {
      this.makeOverlay('Level dokončen!', lines, [
        ['Další level', () => this.startLevel(next)],
        ['Hrát znovu', () => this.restartLevel()],
        ['Výběr levelu', () => this.toMenu()],
      ]);
    } else {
      this.makeOverlay('Kraj 1 dokončen!', [...lines, 'Další kraj se teprve staví.'], [
        ['Výběr levelu', () => this.toMenu()],
        ['Hrát znovu', () => this.restartLevel()],
      ]);
    }
  }

  private restartLevel(): void {
    this.closeOverlay();
    this.scene.get('game').scene.restart();
  }

  private startLevel(key: string): void {
    this.closeOverlay();
    this.scene.get('game').scene.restart({ level: key });
  }

  private toMenu(): void {
    this.closeOverlay();
    this.scene.stop('game');
    this.scene.start('menu');
  }
}
