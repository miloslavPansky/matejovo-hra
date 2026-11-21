import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, GRAVITY } from './config';
import { unlockAudio } from './audio/sound';
import { BadgesScene } from './scenes/BadgesScene';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { IntroScene } from './scenes/IntroScene';
import { MenuScene } from './scenes/MenuScene';
import { ShopScene } from './scenes/ShopScene';
import { UIScene } from './scenes/UIScene';
import { toggleFullscreen } from './ui/widgets';

async function waitForFont(): Promise<void> {
  try {
    await Promise.race([document.fonts.load('8px "Press Start 2P"', 'Matěj ŽŠČŘ'), new Promise((r) => setTimeout(r, 2500))]);
  } catch {
    // Font is optional; the game falls back to a monospace font.
  }
}

waitForFont().then(() => {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#5fb2ff',
    pixelArt: true,
    roundPixels: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    physics: { default: 'arcade', arcade: { gravity: { x: 0, y: GRAVITY }, debug: false } },
    input: { activePointers: 4 }, // mouse/primary + 3 more fingers for run + jump at once
    scene: [BootScene, IntroScene, MenuScene, ShopScene, BadgesScene, GameScene, UIScene],
    // Our own Web Audio synth handles sound; Phaser's audio system is not needed.
    audio: { noAudio: true },
  });
  // Browsers allow audio only after a user gesture: unlock on the first tap or key press.
  const unlock = () => unlockAudio();
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);
  // F toggles full screen. A native listener keeps the key press a user gesture, which browsers require.
  window.addEventListener('keydown', (e) => { if (e.code === 'KeyF' && !e.repeat) toggleFullscreen(game); });
  // Handy for debugging in the browser console during development.
  if (import.meta.env.DEV) (window as unknown as { __game: Phaser.Game }).__game = game;
});
