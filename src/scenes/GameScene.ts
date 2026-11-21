import Phaser from 'phaser';
import { createSun } from '../art/sky';
import { sfx } from '../audio/sound';
import { GAME_HEIGHT, GAME_WIDTH, LIVES, PLANT_CYCLE_MS, SCORPION_SPEED, TILES } from '../config';
import { Controls } from '../game/Controls';
import { Player } from '../game/Player';
import { loadProgress, recordCompletion, type LevelInfo } from '../game/progress';

type Sprite = Phaser.Physics.Arcade.Sprite;
type Body = Phaser.Physics.Arcade.Body;
type StaticBody = Phaser.Physics.Arcade.StaticBody;
type TiledObject = Phaser.Types.Tilemaps.TiledObject;

export interface HudState {
  hearts: number;
  /** Coins collected in this level. */
  coins: number;
  /** Coins collected in all finished levels plus this level so far. */
  wallet: number;
  /** 1-based level number and the number of levels in the world. */
  level: number;
  levelCount: number;
}

export interface CompleteResult {
  coins: number;
  total: number;
  wallet: number;
  level: string;
  next: string | null;
}

export const GAME_EVENTS = { hud: 'hud', toast: 'toast', complete: 'complete' } as const;

function numProp(o: TiledObject, name: string, fallback: number): number {
  const props = o.properties as { name: string; value: unknown }[] | undefined;
  const v = props?.find((p) => p.name === name)?.value;
  return typeof v === 'number' ? v : fallback;
}

export class GameScene extends Phaser.Scene {
  private levelKey = 'level-1-1';
  private player!: Player;
  private controls!: Controls;
  private ground!: Phaser.Tilemaps.TilemapLayer;
  private scorpions!: Phaser.Physics.Arcade.Group;
  private plants!: Phaser.Physics.Arcade.StaticGroup;
  private cacti!: Phaser.Physics.Arcade.StaticGroup;
  private coins!: Phaser.Physics.Arcade.StaticGroup;
  private parallax: { layer: Phaser.GameObjects.TileSprite; factor: number; drift: number }[] = [];
  private hearts = LIVES;
  private coinCount = 0;
  private coinTotal = 0;
  private walletBefore = 0;
  private spawn = new Phaser.Math.Vector2();
  private checkpointsReached = 0;
  private checkpointTotal = 0;
  private finished = false;
  private mapHeight = 0;

  constructor() {
    super('game');
  }

  init(data?: { level?: string }): void {
    if (data?.level) this.levelKey = data.level;
    this.hearts = LIVES;
    this.coinCount = 0;
    this.checkpointsReached = 0;
    this.finished = false;
    this.parallax = [];
    this.walletBefore = loadProgress().totalCoins;
  }

  private get levels(): LevelInfo[] {
    return (this.registry.get('levels') as LevelInfo[] | undefined) ?? [];
  }

  create(): void {
    this.physics.resume(); // completeLevel() pauses the world; a restart must start it again
    const map = this.make.tilemap({ key: this.levelKey });
    const tileset = map.addTilesetImage('poust', 'tiles');
    if (!tileset) throw new Error('Tileset "poust" is missing in the level file');

    this.createBackground();

    const layer = map.createLayer('teren', tileset, 0, 0);
    if (!layer) throw new Error('Layer "teren" is missing in the level file');
    this.ground = layer;
    layer.setCollision([TILES.sand, TILES.stone, TILES.stone2, TILES.plank]);
    layer.forEachTile((t) => {
      if (t.index === TILES.plank) t.setCollision(false, false, true, false); // one-way platform
    });

    const W = map.widthInPixels;
    this.mapHeight = map.heightInPixels;
    this.physics.world.setBounds(0, 0, W, this.mapHeight + 200);
    this.physics.world.setBoundsCollision(true, true, false, false);

    this.scorpions = this.physics.add.group({ allowGravity: true });
    this.plants = this.physics.add.staticGroup();
    this.cacti = this.physics.add.staticGroup();
    this.coins = this.physics.add.staticGroup();
    const checkpoints = this.physics.add.staticGroup();
    let finish: Phaser.Physics.Arcade.Image | null = null;

    const objects = map.getObjectLayer('objekty')?.objects ?? [];
    for (const o of objects) {
      const x = o.x ?? 0, y = o.y ?? 0;
      switch (o.type) {
        case 'start':
          this.spawn.set(x, y - 18);
          break;
        case 'coin': {
          const c = this.coins.create(x, y, 'coin', '0') as Sprite;
          c.play({ key: 'coin-spin', startFrame: Phaser.Math.Between(0, 3) });
          break;
        }
        case 'scorpion': {
          const s = this.scorpions.create(x, y - 9, 'scorp-a') as Sprite;
          const range = numProp(o, 'range', 48);
          s.setData({ min: x - range, max: x + range, dir: -1 });
          (s.body as Body).setSize(26, 12).setOffset(4, 6);
          s.play('scorp-walk');
          break;
        }
        case 'plant': {
          const p = this.plants.create(x, y - 15, 'plant-open') as Sprite;
          (p.body as StaticBody).setSize(14, 22).setOffset(5, 7);
          const timer = this.time.addEvent({
            delay: PLANT_CYCLE_MS, startAt: Phaser.Math.Between(0, PLANT_CYCLE_MS), loop: true,
            callback: () => p.setTexture(p.texture.key === 'plant-open' ? 'plant-closed' : 'plant-open'),
          });
          p.setData('timer', timer);
          break;
        }
        case 'cactus': {
          const k = this.cacti.create(x, y - 16, 'cactus') as Sprite;
          (k.body as StaticBody).setSize(12, 27).setOffset(3, 4);
          break;
        }
        case 'checkpoint':
          checkpoints.create(x, y - 21, 'flag-off');
          break;
        case 'finish':
          finish = this.physics.add.staticImage(x, y - 23, 'gate');
          finish.setDepth(-1);
          (finish.body as StaticBody).setSize(30, 40).setOffset(6, 6);
          break;
      }
    }
    this.coinTotal = this.coins.getLength();
    this.checkpointTotal = checkpoints.getLength();

    this.player = new Player(this, this.spawn.x, this.spawn.y);
    this.controls = new Controls(this);

    this.physics.add.collider(this.player, layer);
    this.physics.add.collider(this.scorpions, layer);
    this.physics.add.overlap(this.player, this.coins, (_p, c) => this.collectCoin(c as Sprite));
    this.physics.add.overlap(this.player, this.scorpions, (_p, s) => this.touchEnemy(s as Sprite));
    this.physics.add.overlap(this.player, this.plants, (_p, plant) => this.touchEnemy(plant as Sprite));
    this.physics.add.overlap(this.player, this.cacti, (_p, k) => this.hurt((k as Sprite).x));
    this.physics.add.overlap(this.player, checkpoints, (_p, f) => this.reachCheckpoint(f as Sprite));
    if (finish) this.physics.add.overlap(this.player, finish, () => this.completeLevel());

    const cam = this.cameras.main;
    cam.setBounds(0, 0, W, Math.max(GAME_HEIGHT, this.mapHeight));
    cam.startFollow(this.player, true, 0.12, 0.12);
    cam.setDeadzone(48, 80);
    cam.setRoundPixels(true);

    if (!this.scene.isActive('ui')) this.scene.launch('ui');
    this.emitHud();
    const title = (map.properties as { name: string; value: unknown }[] | undefined)?.find((p) => p.name === 'nazev')?.value;
    this.time.delayedCall(50, () => this.game.events.emit(GAME_EVENTS.toast, typeof title === 'string' ? title : 'Level'));
  }

  private createBackground(): void {
    this.add.image(0, 0, 'bg-sky').setOrigin(0).setScrollFactor(0).setDepth(-20);
    createSun(this, 360, 58, -19.5);
    const layers: [string, number, number][] = [['bg-clouds-far', 0.03, 2], ['bg-clouds', 0.07, 5], ['bg-far', 0.15, 0], ['bg-mid', 0.4, 0], ['bg-deco', 0.75, 0]];
    layers.forEach(([key, factor, drift], i) => {
      const tex = this.textures.get(key).getSourceImage();
      const layer = this.add.tileSprite(0, 0, GAME_WIDTH, tex.height, key).setOrigin(0).setScrollFactor(0).setDepth(-19 + i);
      this.parallax.push({ layer, factor, drift });
    });
  }

  update(time: number, delta: number): void {
    const cam = this.cameras.main;
    for (const p of this.parallax) p.layer.tilePositionX = Math.round(cam.scrollX * p.factor + (time / 1000) * p.drift);
    if (this.finished) return;

    if (this.player.step(this.controls.read(), time, delta)) sfx.jump();

    for (const obj of this.scorpions.getChildren()) {
      const s = obj as Sprite;
      const b = s.body as Body | null;
      if (!s.active || !b || !b.enable) continue;
      let dir = s.getData('dir') as number;
      const min = s.getData('min') as number, max = s.getData('max') as number;
      const groundAhead = this.ground.getTileAtWorldXY(s.x + dir * 14, b.bottom + 4);
      if (s.x <= min) dir = 1;
      else if (s.x >= max) dir = -1;
      else if (b.blocked.down && (!groundAhead || !groundAhead.collides || b.blocked.left || b.blocked.right)) dir = -dir;
      s.setData('dir', dir);
      b.setVelocityX(dir * SCORPION_SPEED);
      s.setFlipX(dir > 0);
    }

    if (this.player.y > this.mapHeight + 24) this.fellIntoGap();
  }

  private emitHud(): void {
    const idx = this.levels.findIndex((l) => l.key === this.levelKey);
    const state: HudState = {
      hearts: this.hearts, coins: this.coinCount, wallet: this.walletBefore + this.coinCount,
      level: idx + 1, levelCount: this.levels.length,
    };
    this.game.events.emit(GAME_EVENTS.hud, state);
  }

  private sparkle(x: number, y: number, tint: number): void {
    const e = this.add.particles(x, y, 'spark', {
      speed: { min: 30, max: 80 }, angle: { min: 200, max: 340 }, lifespan: 350, quantity: 8, scale: { start: 1, end: 0 }, tint, emitting: false,
    });
    e.setDepth(20);
    e.explode(8);
    this.time.delayedCall(500, () => e.destroy());
  }

  private collectCoin(c: Sprite): void {
    const body = c.body as StaticBody | null;
    if (!c.active || !body || !body.enable) return;
    body.enable = false;
    this.coinCount++;
    sfx.coin();
    this.sparkle(c.x, c.y, 0xffd21a);
    this.tweens.add({ targets: c, y: c.y - 14, alpha: 0, duration: 250, onComplete: () => c.destroy() });
    this.emitHud();
  }

  /** Scorpions and plants: landing on top defeats them, any other touch hurts. */
  private touchEnemy(e: Sprite): void {
    const pb = this.player.arcadeBody;
    const eb = e.body as Body | StaticBody | null;
    if (!eb || !eb.enable) return;
    if (pb.velocity.y > 0 && pb.bottom <= eb.top + 10) {
      eb.enable = false;
      (e.getData('timer') as Phaser.Time.TimerEvent | undefined)?.remove();
      this.player.bounce();
      sfx.stomp();
      this.sparkle(e.x, e.y, 0xffffff);
      this.tweens.add({ targets: e, scaleY: 0.2, alpha: 0, y: e.y + e.height * 0.35, duration: 300, onComplete: () => e.destroy() });
    } else {
      this.hurt(e.x);
    }
  }

  private hurt(fromX: number): void {
    const now = this.time.now;
    if (this.finished || this.player.isInvulnerable(now)) return;
    this.hearts--;
    sfx.hurt();
    this.cameras.main.shake(120, 0.004);
    if (this.hearts <= 0) {
      this.outOfHearts();
    } else {
      this.player.hit(fromX, now);
      this.emitHud();
    }
  }

  private fellIntoGap(): void {
    this.hearts--;
    sfx.fall();
    if (this.hearts <= 0) {
      this.outOfHearts();
      return;
    }
    this.player.respawnAt(this.spawn.x, this.spawn.y, this.time.now);
    this.controls.reset();
    this.emitHud();
  }

  /** Rule from the design: after losing all three hearts, return to the last checkpoint with full hearts. */
  private outOfHearts(): void {
    this.hearts = LIVES;
    this.player.respawnAt(this.spawn.x, this.spawn.y, this.time.now);
    this.controls.reset();
    this.game.events.emit(GAME_EVENTS.toast, this.checkpointsReached > 0 ? 'Zkus to znovu od vlajky' : 'Zkus to znovu');
    this.emitHud();
  }

  private reachCheckpoint(flag: Sprite): void {
    if (flag.getData('on')) return;
    flag.setData('on', true);
    flag.setTexture('flag-on');
    this.checkpointsReached++;
    // Respawn at the furthest flag reached, even if an earlier one is touched later.
    if (flag.x > this.spawn.x) this.spawn.set(flag.x, flag.y - 4);
    sfx.checkpoint();
    this.sparkle(flag.x + 6, flag.y - 14, 0xf2c230);
    this.game.events.emit(GAME_EVENTS.toast, `Checkpoint ${this.checkpointsReached}/${this.checkpointTotal}`);
  }

  private completeLevel(): void {
    if (this.finished) return;
    this.finished = true;
    this.physics.pause();
    this.player.anims.stop();
    this.player.setTexture('hero-a').setAlpha(1);
    sfx.complete();
    this.sparkle(this.player.x, this.player.y - 10, 0xf2c230);
    const levels = this.levels;
    const saved = recordCompletion(levels, this.levelKey, this.coinCount);
    const idx = levels.findIndex((l) => l.key === this.levelKey);
    const result: CompleteResult = {
      coins: this.coinCount, total: this.coinTotal, wallet: saved.totalCoins, level: this.levelKey, next: levels[idx + 1]?.key ?? null,
    };
    this.game.events.emit(GAME_EVENTS.complete, result);
  }
}
