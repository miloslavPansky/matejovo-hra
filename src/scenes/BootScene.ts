import Phaser from 'phaser';
import { dressHero, generateTextures } from '../art/textures';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { loadProgress, type LevelInfo } from '../game/progress';
import { PixelText } from '../ui/PixelText';

interface LevelIndex {
  world: string;
  levels: LevelInfo[];
}

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload(): void {
    const label = new PixelText(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Načítám poušť…', { size: 16, color: '#ffe9b0', shadow: null }).setOrigin(0.5);
    this.load.on('loaderror', (file: Phaser.Loader.File) => label.setText(`Nepodařilo se načíst ${file.key}`));
    this.load.once('filecomplete-json-levels-index', (_key: string, _type: string, data: LevelIndex) => {
      this.registry.set('levels', data.levels);
      this.registry.set('world', data.world);
      for (const l of data.levels) this.load.tilemapTiledJSON(l.key, l.file);
    });
    this.load.json('levels-index', 'levels/index.json');
  }

  create(): void {
    generateTextures(this);
    dressHero(this, loadProgress());
    // First visit: play the story intro (with a "tap to start" card that also unlocks audio).
    if (loadProgress().introSeen) this.scene.start('menu');
    else this.scene.start('intro', { showCard: true });
  }
}
