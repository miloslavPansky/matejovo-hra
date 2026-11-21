import Phaser from 'phaser';
import { isMuted, onMutedChange, sfx, toggleMuted } from '../audio/sound';
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

/** HUD (hearts, level, coins), sound and menu buttons, touch controls, pause menu, toasts, level end. */
export class UIScene extends Phaser.Scene {
  private hearts: Phaser.GameObjects.Image[] = [];
  private coinIcon!: Phaser.GameObjects.Sprite;
  private coinText!: PixelText;
  private levelText!: PixelText;
  private toastText!: PixelText;
  private soundIcon!: Phaser.GameObjects.Image;
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

    for (let i = 0; i < LIVES; i++) this.hearts.push(this.add.image(8 + i * 13, 8, 'heart').setOrigin(0));
    this.levelText = new PixelText(this, GAME_WIDTH / 2, 6, 'Level', { size: 8 }).setOrigin(0.5, 0);

    // Top right: coins "this level / all so far", below it the sound and menu buttons.
    this.coinText = new PixelText(this, GAME_WIDTH - 6, 8, '0/0', { size: 8 }).setOrigin(1, 0);
    this.coinIcon = this.add.sprite(0, 7, 'coin', '0').setOrigin(0).play('coin-spin');
    this.placeCoinIcon();
    const menuIcon = this.iconButton(GAME_WIDTH - 19, 22, 'icon-menu', () => this.togglePause());
    this.soundIcon = this.iconButton(GAME_WIDTH - 36, 22, isMuted() ? 'icon-sound-off' : 'icon-sound-on', () => { toggleMuted(); sfx.click(); });
    void menuIcon;
    const off = onMutedChange((m) => this.soundIcon.setTexture(m ? 'icon-sound-off' : 'icon-sound-on'));

    this.toastText = new PixelText(this, GAME_WIDTH / 2, 56, ' ', { size: 16, color: '#ffe9b0' }).setOrigin(0.5).setAlpha(0);

    this.createTouchControls();
    this.touchEnabled = this.sys.game.device.input.touch;
    this.touchUi.setVisible(this.touchEnabled);
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.wasTouch && !this.touchEnabled) {
        this.touchEnabled = true;
        this.touchUi.setVisible(true);
      }
    });

    const kb = this.input.keyboard;
    kb?.on('keydown-ESC', () => this.togglePause());
    kb?.on('keydown-P', () => this.togglePause());
    kb?.on('keydown-M', () => toggleMuted());
    kb?.on('keydown-ENTER', () => { if (this.overlay) this.primaryAction?.(); });

    const ev = this.game.events;
    ev.on(GAME_EVENTS.hud, this.onHud, this);
    ev.on(GAME_EVENTS.toast, this.showToast, this);
    ev.on(GAME_EVENTS.complete, this.onComplete, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      ev.off(GAME_EVENTS.hud, this.onHud, this);
      ev.off(GAME_EVENTS.toast, this.showToast, this);
      ev.off(GAME_EVENTS.complete, this.onComplete, this);
      off();
    });
  }

  /** A 13x13 pixel icon with a larger invisible touch area. */
  private iconButton(x: number, y: number, key: string, fn: () => void): Phaser.GameObjects.Image {
    const img = this.add.image(x, y, key).setOrigin(0);
    const zone = this.add.zone(x + 6, y + 6, 22, 22).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', fn);
    return img;
  }

  private placeCoinIcon(): void {
    this.coinIcon.setX(this.coinText.x - this.coinText.width - 12);
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
    this.coinText.setText(`${s.coins}/${s.wallet}`);
    this.placeCoinIcon();
    this.levelText.setText(s.levelCount > 0 ? `Level ${s.level}/${s.levelCount}` : 'Level');
  }

  private showToast(text: string): void {
    this.tweens.killTweensOf(this.toastText);
    this.toastText.setText(text).setAlpha(1);
    this.tweens.add({ targets: this.toastText, alpha: 0, delay: 1500, duration: 400 });
  }

  private makeOverlay(title: string, lines: string[], buttons: [string, () => void][]): void {
    this.closeOverlay();
    const c = this.add.container(0, 0).setDepth(100);
    c.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x1b1206, 0.75).setOrigin(0).setInteractive());
    c.add(new PixelText(this, GAME_WIDTH / 2, 52, title, { size: 16, color: '#ffd36a', shadow: '#000000' }).setOrigin(0.5));
    lines.forEach((l, i) => c.add(new PixelText(this, GAME_WIDTH / 2, 84 + i * 14, l, { size: 8 }).setOrigin(0.5)));
    buttons.forEach(([label, fn], i) => {
      if (i === 0) this.primaryAction = fn;
      const y = 150 + i * 32;
      const bg = this.add.rectangle(GAME_WIDTH / 2, y, 160, 24, i === 0 ? 0x3c8527 : 0x6f6f6f).setStrokeStyle(2, 0x1b1b1b).setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => { sfx.click(); fn(); });
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
    this.makeOverlay('Pauza', [
      'Šipky nebo A/D běh, mezerník nebo šipka nahoru skok.',
      'Na štíra i rostlinu se dá skočit shora.',
      'M zapne nebo vypne zvuk, Esc pauza.',
    ], [
      ['Pokračovat', () => this.togglePause()],
      ['Hrát znovu', () => this.restartLevel()],
      ['Výběr levelu', () => this.toMenu()],
    ]);
  }

  private onComplete(r: CompleteResult): void {
    const lines = [
      `Mince v levelu: ${r.coins} z ${r.total}`,
      `Mince celkem: ${r.wallet}`,
      r.coins === r.total ? 'Všechny mince! Bedřich bude mít radost.' : 'Někde ještě nějaké mince zůstaly.',
    ];
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
