import Phaser from 'phaser';
import { generateTextures } from '../art/textures';
import { FONT, GAME_HEIGHT, GAME_WIDTH } from '../config';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload(): void {
    const label = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Načítám poušť…', { fontFamily: FONT, fontSize: '14px', color: '#ffe9b0' }).setOrigin(0.5);
    this.load.on('loaderror', (file: Phaser.Loader.File) => label.setText(`Nepodařilo se načíst ${file.key}`));
    this.load.tilemapTiledJSON('level-1-1', 'levels/level-1-1.json');
  }

  create(): void {
    generateTextures(this);
    this.scene.start('game', { level: 'level-1-1' });
  }
}
