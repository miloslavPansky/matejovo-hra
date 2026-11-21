import Phaser from 'phaser';
import { isMuted, onMutedChange, sfx, toggleMuted } from '../audio/sound';
import { GAME_HEIGHT, GAME_WIDTH, LIVES } from '../config';
import { touch } from '../game/Controls';
import { badgeNews, type ItemId } from '../game/rules';
import { PixelText } from '../ui/PixelText';
import { coinCounter, fullscreenButton, iconButton, makeDialog, type DialogButton } from '../ui/widgets';
import { GAME_EVENTS, type CompleteResult, type HudState } from './GameScene';

type TouchKey = 'left' | 'right' | 'jump' | 'jet';

interface TouchButton {
  x: number;
  y: number;
  r: number;
  key: TouchKey;
  label?: string;
  gfx: Phaser.GameObjects.Graphics;
  text?: PixelText;
  hidden: boolean;
}

const ITEM_ICONS: [ItemId, string][] = [['jetpack', 'icon-jetpack'], ['armor', 'icon-armor'], ['magnet', 'icon-magnet'], ['map', 'icon-map']];

/** HUD (hearts, items, level, coins), sound/menu/full-screen buttons, touch controls, pause menu, toasts, level end. */
export class UIScene extends Phaser.Scene {
  private hearts: Phaser.GameObjects.Image[] = [];
  private itemIcons: Phaser.GameObjects.Image[] = [];
  private fuelBar!: Phaser.GameObjects.Graphics;
  private coins!: { set: (v: string) => void };
  private levelText!: PixelText;
  private toastText!: PixelText;
  private soundIcon!: Phaser.GameObjects.Image;
  private buttons: TouchButton[] = [];
  private touchUi!: Phaser.GameObjects.Container;
  private overlay: Phaser.GameObjects.Container | null = null;
  private touchEnabled = false;
  private primaryAction: (() => void) | null = null;
  private jetIconX = -1;

  constructor() {
    super('ui');
  }

  create(): void {
    // The scene instance is reused when it is launched again, so reset per-run state.
    this.hearts = [];
    this.itemIcons = [];
    this.buttons = [];
    this.overlay = null;
    this.primaryAction = null;
    if (this.input.manager.pointersTotal < 4) this.input.addPointer(4 - this.input.manager.pointersTotal);

    for (let i = 0; i < LIVES; i++) this.hearts.push(this.add.image(8 + i * 13, 8, 'heart').setOrigin(0));
    this.fuelBar = this.add.graphics();
    this.levelText = new PixelText(this, GAME_WIDTH / 2, 6, 'Level', { size: 8 }).setOrigin(0.5, 0);

    // Top right: coins "this level / wallet", below them the menu, sound and full-screen buttons.
    this.coins = coinCounter(this, GAME_WIDTH - 6, 8, '0/0');
    iconButton(this, GAME_WIDTH - 19, 22, 'icon-menu', () => this.togglePause());
    this.soundIcon = iconButton(this, GAME_WIDTH - 36, 22, isMuted() ? 'icon-sound-off' : 'icon-sound-on', () => { toggleMuted(); sfx.click(); });
    fullscreenButton(this, GAME_WIDTH - 53, 22);
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
    ev.on(GAME_EVENTS.fuel, this.drawFuel, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      ev.off(GAME_EVENTS.hud, this.onHud, this);
      ev.off(GAME_EVENTS.toast, this.showToast, this);
      ev.off(GAME_EVENTS.complete, this.onComplete, this);
      ev.off(GAME_EVENTS.fuel, this.drawFuel, this);
      off();
    });
  }

  private createTouchControls(): void {
    this.touchUi = this.add.container(0, 0);
    const defs: Omit<TouchButton, 'gfx' | 'hidden'>[] = [
      { key: 'left', x: 36, y: GAME_HEIGHT - 36, r: 24 },
      { key: 'right', x: 94, y: GAME_HEIGHT - 36, r: 24 },
      { key: 'jump', x: GAME_WIDTH - 42, y: GAME_HEIGHT - 42, r: 30, label: 'SKOK' },
      { key: 'jet', x: GAME_WIDTH - 108, y: GAME_HEIGHT - 30, r: 24, label: 'BATOH' },
    ];
    for (const d of defs) {
      const gfx = this.add.graphics();
      this.touchUi.add(gfx);
      const b: TouchButton = { ...d, gfx, hidden: d.key === 'jet' };
      if (d.label) {
        b.text = new PixelText(this, d.x, d.y, d.label, { size: 8 }).setOrigin(0.5).setVisible(!b.hidden);
        this.touchUi.add(b.text);
      }
      this.buttons.push(b);
    }
    this.drawButtons();
  }

  private drawButtons(): void {
    for (const b of this.buttons) {
      b.gfx.clear();
      if (b.hidden) continue;
      const down = touch[b.key];
      b.gfx.fillStyle(b.key === 'jet' ? 0x7a3a10 : 0x3c3c3c, down ? 0.7 : 0.4).fillCircle(b.x, b.y, b.r);
      b.gfx.lineStyle(2, 0xffffff, down ? 1 : 0.7).strokeCircle(b.x, b.y, b.r);
      if (b.key === 'left' || b.key === 'right') {
        const s = b.key === 'left' ? -1 : 1;
        b.gfx.fillStyle(0xffffff, 0.9).fillTriangle(b.x + s * 9, b.y, b.x - s * 6, b.y - 9, b.x - s * 6, b.y + 9);
      }
    }
  }

  update(): void {
    const held: Record<TouchKey, boolean> = { left: false, right: false, jump: false, jet: false };
    if (this.touchEnabled && !this.overlay) {
      for (const p of this.input.manager.pointers) {
        if (!p.isDown || !p.wasTouch) continue;
        for (const b of this.buttons) {
          if (!b.hidden && Phaser.Math.Distance.Between(p.x, p.y, b.x, b.y) <= b.r + 10) held[b.key] = true;
        }
      }
    }
    if ((Object.keys(held) as TouchKey[]).some((k) => held[k] !== touch[k])) {
      Object.assign(touch, held);
      this.drawButtons();
    }
  }

  private onHud(s: HudState): void {
    this.hearts.forEach((h, i) => h.setTexture(i < s.hearts ? 'heart' : 'heart-empty'));
    this.coins.set(`${s.coins}/${s.wallet}`);
    this.levelText.setText(s.levelCount > 0 ? `Level ${s.level}/${s.levelCount}` : 'Level');

    // Active shop items as small icons under the hearts.
    this.itemIcons.forEach((i) => i.destroy());
    this.itemIcons = [];
    this.jetIconX = -1;
    ITEM_ICONS.filter(([id]) => s.items[id]).forEach(([id, key], i) => {
      const x = 8 + i * 15;
      this.itemIcons.push(this.add.image(x, 20, key).setOrigin(0));
      if (id === 'jetpack') this.jetIconX = x;
    });
    const jet = this.buttons.find((b) => b.key === 'jet');
    if (jet && jet.hidden === s.items.jetpack) {
      jet.hidden = !s.items.jetpack;
      jet.text?.setVisible(s.items.jetpack);
      this.drawButtons();
    }
    if (this.jetIconX < 0) this.fuelBar.clear();
  }

  /** Backpack fuel as a small bar under its icon. */
  private drawFuel(fuel: number): void {
    const g = this.fuelBar.clear();
    if (this.jetIconX < 0) return;
    g.fillStyle(0x1b1b1b, 0.8).fillRect(this.jetIconX, 35, 13, 4);
    g.fillStyle(fuel > 0.25 ? 0xffd21a : 0xe0501c, 1).fillRect(this.jetIconX + 1, 36, Math.round(11 * fuel), 2);
  }

  private showToast(text: string): void {
    this.tweens.killTweensOf(this.toastText);
    this.toastText.setText(text).setAlpha(1);
    this.tweens.add({ targets: this.toastText, alpha: 0, delay: 1500, duration: 400 });
  }

  private makeOverlay(title: string, lines: string[], buttons: DialogButton[]): void {
    this.closeOverlay();
    const d = makeDialog(this, title, lines, buttons);
    this.overlay = d.container;
    this.primaryAction = d.primary;
    Object.assign(touch, { left: false, right: false, jump: false, jet: false });
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
      'Shift raketový batoh. Na štíra i rostlinu skoč shora.',
      'M zvuk, F celá obrazovka, Esc pauza.',
    ], [
      ['Pokračovat', () => this.togglePause()],
      ['Hrát znovu', () => this.restartLevel()],
      ['Výběr levelu', () => this.toMenu()],
    ]);
  }

  private onComplete(r: CompleteResult): void {
    const lines = [
      `Mince v levelu: ${r.coins} z ${r.total}`,
      `Mince u sebe: ${r.wallet}`,
      r.coins === r.total ? 'Všechny mince! Bedřich bude mít radost.' : 'Někde ještě nějaké mince zůstaly.',
    ];
    if (r.badges.length) lines.push(badgeNews(r.badges));
    const next = r.next;
    if (next) {
      this.makeOverlay('Level dokončen!', lines, [
        ['Další level', () => this.startLevel(next)],
        ['Obchod', () => this.toShop(next)],
        ['Hrát znovu', () => this.restartLevel()],
        ['Výběr levelu', () => this.toMenu()],
      ]);
    } else {
      this.makeOverlay('Kraj 1 dokončen!', [...lines, 'Další kraj se teprve staví.'], [
        ['Výběr levelu', () => this.toMenu()],
        ['Obchod', () => this.toShop(null)],
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

  private toShop(next: string | null): void {
    this.closeOverlay();
    this.scene.stop('game');
    this.scene.start('shop', { next });
  }
}
