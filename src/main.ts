import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, GRAVITY } from './config';
import { unlockAudio } from './audio/sound';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { IntroScene } from './scenes/IntroScene';
import { MenuScene } from './scenes/MenuScene';
import { UIScene } from './scenes/UIScene';

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
    scene: [BootScene, IntroScene, MenuScene, GameScene, UIScene],
    // Our own Web Audio synth handles sound; Phaser's audio system is not needed.
    audio: { noAudio: true },
  });
  // Browsers allow audio only after a user gesture: unlock on the first tap or key press.
  const unlock = () => unlockAudio();
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);
  // Handy for debugging in the browser console during development.
  if (import.meta.env.DEV) (window as unknown as { __game: Phaser.Game }).__game = game;
});
