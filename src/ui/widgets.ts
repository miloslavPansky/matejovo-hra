import Phaser from 'phaser';
import { createSun } from '../art/sky';
import { sfx } from '../audio/sound';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { PixelText } from './PixelText';

export const COLORS = {
  primary: 0x3c8527,
  secondary: 0x6f6f6f,
  danger: 0xb33a2a,
  panel: 0xe9dfc4,
  ink: 0x3b2a10,
  white: 0xffffff,
} as const;

/** A rectangular pixel button. Its label and colour can change later. */
export class Button extends Phaser.GameObjects.Container {
  private readonly bg: Phaser.GameObjects.Rectangle;
  private readonly label: PixelText;

  constructor(scene: Phaser.Scene, x: number, y: number, w: number, text: string, onClick: () => void, color: number = COLORS.secondary, h = 24) {
    super(scene, x, y);
    this.bg = scene.add.rectangle(0, 0, w, h, color).setStrokeStyle(2, 0x1b1b1b).setInteractive({ useHandCursor: true });
    this.bg.on('pointerdown', () => { sfx.click(); onClick(); });
    this.label = new PixelText(scene, 0, 0, text, { size: 8, shadow: '#1b1b1b' }).setOrigin(0.5);
    this.add([this.bg, this.label]);
    scene.add.existing(this);
  }

  setLabel(text: string): this {
    this.label.setText(text);
    return this;
  }

  setColor(color: number): this {
    this.bg.setFillStyle(color);
    return this;
  }

  setSelected(on: boolean): this {
    this.bg.setStrokeStyle(2, on ? COLORS.white : 0x1b1b1b);
    return this;
  }

  onHover(fn: () => void): this {
    this.bg.on('pointerover', fn);
    return this;
  }
}

export type DialogButton = [label: string, action: () => void, color?: number];

/**
 * A modal dialog over the whole screen: title, a few lines of text and buttons (one column, or two
 * columns for four buttons). The first button is the default for Enter, see `primary`.
 */
export function makeDialog(scene: Phaser.Scene, title: string, lines: string[], buttons: DialogButton[]): { container: Phaser.GameObjects.Container; primary: () => void } {
  const c = scene.add.container(0, 0).setDepth(100);
  c.add(scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x1b1206, 0.9).setOrigin(0).setInteractive());
  c.add(new PixelText(scene, GAME_WIDTH / 2, 46, title, { size: 16, color: '#ffd36a', shadow: '#000000' }).setOrigin(0.5));
  lines.forEach((l, i) => c.add(new PixelText(scene, GAME_WIDTH / 2, 76 + i * 14, l, { size: 8 }).setOrigin(0.5)));
  const twoCols = buttons.length === 4;
  const rows = twoCols ? Math.ceil(buttons.length / 2) : buttons.length;
  const top = Math.min(Math.max(76 + lines.length * 14 + 18, twoCols ? 170 : 146), GAME_HEIGHT - 24 - (rows - 1) * 28);
  buttons.forEach(([label, fn, color], i) => {
    const x = twoCols ? GAME_WIDTH / 2 + (i % 2 ? 84 : -84) : GAME_WIDTH / 2;
    const y = top + (twoCols ? Math.floor(i / 2) : i) * 28;
    c.add(new Button(scene, x, y, twoCols ? 156 : 176, label, fn, color ?? (i === 0 ? COLORS.primary : COLORS.secondary)));
  });
  c.add(new PixelText(scene, GAME_WIDTH - 4, GAME_HEIGHT - 4, `verze ${__APP_VERSION__}`, { size: 8, color: '#bfae86', shadow: null }).setOrigin(1));
  return { container: c, primary: buttons[0][1] };
}

/**
 * The calm desert behind the menus: sky, sun, drifting clouds, dunes and the ground at y 208.
 * Returns a function to call from the scene's update() to move the clouds.
 */
export function desertBackdrop(scene: Phaser.Scene): (time: number) => void {
  scene.add.image(0, 0, 'bg-sky').setOrigin(0);
  createSun(scene, 30, 32, 1);
  const clouds = [
    scene.add.tileSprite(0, 0, GAME_WIDTH, 110, 'bg-clouds-far').setOrigin(0),
    scene.add.tileSprite(0, 0, GAME_WIDTH, 110, 'bg-clouds').setOrigin(0),
  ];
  scene.add.image(0, 0, 'bg-far').setOrigin(0);
  scene.add.image(0, 0, 'bg-mid').setOrigin(0);
  for (let x = 0; x < GAME_WIDTH; x += 16) {
    scene.add.image(x, 208, 'tiles', 'sand').setOrigin(0);
    for (let r = 1; r < 4; r++) scene.add.image(x, 208 + r * 16, 'tiles', 'stone').setOrigin(0);
  }
  return (time) => clouds.forEach((c, i) => { c.tilePositionX = Math.round((time / 1000) * (i ? 5 : 2)); });
}

/** Coin icon with a number, right-aligned at (x, y). Returns the text so it can be updated. */
export function coinCounter(scene: Phaser.Scene, x: number, y: number, value: string): { set: (v: string) => void } {
  const text = new PixelText(scene, x, y, value, { size: 8 }).setOrigin(1, 0);
  const icon = scene.add.sprite(0, y - 1, 'coin', '0').setOrigin(0).play('coin-spin');
  const place = () => icon.setX(text.x - text.width - 12);
  place();
  return { set: (v) => { text.setText(v); place(); } };
}

// ---------- full screen ----------

export function canFullscreen(game: Phaser.Game): boolean {
  return game.scale.fullscreen.available;
}

/** Must run inside a user gesture (pointerup or a native key event). */
export function toggleFullscreen(game: Phaser.Game): void {
  if (!canFullscreen(game)) return;
  if (game.scale.isFullscreen) {
    game.scale.stopFullscreen();
    return;
  }
  game.scale.startFullscreen();
  // Phones: also keep landscape where the browser allows it (Android Chrome does, Safari does not).
  const orientation = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
  orientation?.lock?.('landscape').catch(() => undefined);
}

/** A 13x13 icon button with a 22x22 touch area. Use `up` for actions that need a user gesture. */
export function iconButton(scene: Phaser.Scene, x: number, y: number, key: string, fn: () => void, up = false): Phaser.GameObjects.Image {
  const img = scene.add.image(x, y, key).setOrigin(0);
  scene.add.zone(x + 6, y + 6, 22, 22).setInteractive({ useHandCursor: true }).on(up ? 'pointerup' : 'pointerdown', fn);
  return img;
}

/** Full-screen toggle icon that follows the real state (also when the player leaves with Esc). */
export function fullscreenButton(scene: Phaser.Scene, x: number, y: number): void {
  if (!canFullscreen(scene.game)) return;
  const icon = () => (scene.scale.isFullscreen ? 'icon-full-exit' : 'icon-full');
  const img = iconButton(scene, x, y, icon(), () => { sfx.click(); toggleFullscreen(scene.game); }, true);
  const sync = () => img.setTexture(icon());
  scene.scale.on(Phaser.Scale.Events.ENTER_FULLSCREEN, sync);
  scene.scale.on(Phaser.Scale.Events.LEAVE_FULLSCREEN, sync);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.scale.off(Phaser.Scale.Events.ENTER_FULLSCREEN, sync);
    scene.scale.off(Phaser.Scale.Events.LEAVE_FULLSCREEN, sync);
  });
}
