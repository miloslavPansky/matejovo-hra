import Phaser from 'phaser';
import { dressHero } from '../art/textures';
import { isMuted, onMutedChange, sfx, toggleMuted } from '../audio/sound';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { loadProgress, resetProgress, type LevelInfo } from '../game/progress';
import { BADGES } from '../game/rules';
import { PixelText } from '../ui/PixelText';
import { Button, COLORS, canFullscreen, coinCounter, desertBackdrop, fullscreenButton, iconButton, makeDialog, toggleFullscreen } from '../ui/widgets';

/** Title, level select for the current world, shop, badges and settings. Progress comes from localStorage. */
export class MenuScene extends Phaser.Scene {
  private static readonly PER_ROW = 5;
  private selected = 0;
  private tiles: { box: Phaser.GameObjects.Rectangle; locked: boolean }[] = [];
  private levels: LevelInfo[] = [];
  private moveClouds: (time: number) => void = () => undefined;
  private overlay: { container: Phaser.GameObjects.Container; primary: () => void } | null = null;

  constructor() {
    super('menu');
  }

  create(): void {
    this.levels = (this.registry.get('levels') as LevelInfo[] | undefined) ?? [];
    const progress = loadProgress();
    this.tiles = [];
    this.overlay = null;

    this.moveClouds = desertBackdrop(this);
    this.add.image(70, 208 - 17, 'hero-a');
    this.add.image(GAME_WIDTH - 60, 208 - 23, 'gate');

    new PixelText(this, GAME_WIDTH / 2, 34, 'Matěj a Zlatá poušť', { size: 16, color: '#ffe9b0' }).setOrigin(0.5);
    new PixelText(this, GAME_WIDTH / 2, 56, `Kraj 1 · ${String(this.registry.get('world') ?? 'Zlaté duny')}`, { size: 8 }).setOrigin(0.5);
    coinCounter(this, GAME_WIDTH / 2 - 8, 190, `Mince: ${progress.wallet}`);
    new PixelText(this, GAME_WIDTH / 2 + 8, 190, `Odznaky: ${progress.badges.length}/${BADGES.length}`, { size: 8 }).setOrigin(0, 0);

    // Top right: sound and full screen.
    const sound = iconButton(this, GAME_WIDTH - 22, 6, isMuted() ? 'icon-sound-off' : 'icon-sound-on', () => { toggleMuted(); sfx.click(); });
    const off = onMutedChange((m) => sound.setTexture(m ? 'icon-sound-off' : 'icon-sound-on'));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, off);
    fullscreenButton(this, GAME_WIDTH - 39, 6);

    // Level tiles in rows of five.
    const n = this.levels.length;
    const w = 64, h = 40, gap = 12, perRow = MenuScene.PER_ROW;
    const x0 = GAME_WIDTH / 2 - ((perRow * w + (perRow - 1) * gap) / 2) + w / 2;
    this.levels.forEach((l, i) => {
      const locked = i >= progress.unlocked;
      const x = x0 + (i % perRow) * (w + gap), y = 90 + Math.floor(i / perRow) * (h + 8);
      const box = this.add.rectangle(x, y, w, h, locked ? 0x6f6f6f : 0xd3cbb5).setStrokeStyle(3, 0x3b2a10);
      new PixelText(this, x, y - 7, String(i + 1), { size: 16, color: locked ? '#bdbdbd' : '#3b2a10', shadow: null }).setOrigin(0.5);
      if (progress.secrets.includes(l.key)) this.add.image(x + 22, y - 12, 'arrow').setScale(0.5);
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

    new PixelText(this, GAME_WIDTH / 2, 172, 'Šipky + Enter, nebo klepni na level', { size: 8 }).setOrigin(0.5);

    // Bottom row: shop, badges, settings.
    new Button(this, GAME_WIDTH / 2 - 122, 236, 112, 'Obchod (O)', () => this.openShop(), COLORS.primary);
    new Button(this, GAME_WIDTH / 2, 236, 112, 'Odznaky (K)', () => this.openBadges());
    new Button(this, GAME_WIDTH / 2 + 122, 236, 120, 'Nastavení (N)', () => this.openSettings());
    new PixelText(this, GAME_WIDTH - 4, GAME_HEIGHT - 2, `verze ${__APP_VERSION__}`, { size: 8, color: '#e9dfc4', shadow: null }).setOrigin(1);

    const kb = this.input.keyboard;
    const menuKey = (key: string, fn: () => void) => kb?.on(`keydown-${key}`, () => { if (!this.overlay) fn(); });
    menuKey('LEFT', () => this.move(-1));
    menuKey('RIGHT', () => this.move(1));
    menuKey('UP', () => this.move(-MenuScene.PER_ROW));
    menuKey('DOWN', () => this.move(MenuScene.PER_ROW));
    menuKey('SPACE', () => this.startLevel(this.selected));
    menuKey('O', () => this.openShop());
    menuKey('K', () => this.openBadges());
    menuKey('N', () => this.openSettings());
    menuKey('I', () => this.playIntro());
    kb?.on('keydown-ENTER', () => (this.overlay ? this.overlay.primary() : this.startLevel(this.selected)));
    kb?.on('keydown-ESC', () => this.closeOverlay());
    kb?.on('keydown-M', () => toggleMuted());
  }

  update(time: number): void {
    this.moveClouds(time);
  }

  private playIntro(): void {
    this.scene.start('intro');
  }

  private openShop(): void {
    sfx.click();
    this.scene.start('shop', { next: null });
  }

  private openBadges(): void {
    sfx.click();
    this.scene.start('badges');
  }

  private showOverlay(title: string, lines: string[], buttons: Parameters<typeof makeDialog>[3]): void {
    this.closeOverlay();
    this.overlay = makeDialog(this, title, lines, buttons);
  }

  private closeOverlay(): void {
    this.overlay?.container.destroy();
    this.overlay = null;
  }

  private openSettings(): void {
    const fs = canFullscreen(this.game);
    this.showOverlay('Nastavení', [], [
      ['Zpět (Esc)', () => this.closeOverlay()],
      [isMuted() ? 'Zapnout zvuk (M)' : 'Vypnout zvuk (M)', () => { toggleMuted(); this.openSettings(); }],
      ...(fs ? [[this.scale.isFullscreen ? 'Zrušit celou obrazovku' : 'Celá obrazovka (F)', () => { toggleFullscreen(this.game); this.closeOverlay(); }] as [string, () => void]] : []),
      ['Intro znovu (I)', () => this.playIntro()],
      ['Restart celé hry', () => this.confirmReset(), COLORS.danger],
    ]);
  }

  private confirmReset(): void {
    // The safe choice is first, so Enter keeps the progress.
    this.showOverlay('Restart celé hry?', [
      'Smaže odemčené levely, mince, nákupy i odznaky.',
      'Zůstane jen nastavení zvuku. Vrátit to nejde.',
    ], [
      ['Ne, nechat postup', () => this.openSettings()],
      ['Ano, smazat vše', () => this.resetGame(), COLORS.danger],
    ]);
  }

  private resetGame(): void {
    const d = resetProgress();
    dressHero(this, d);
    sfx.whoosh();
    this.scene.restart();
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
