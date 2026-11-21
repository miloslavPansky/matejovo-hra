import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { addIntroTextures } from './intro';
import { ctx2d, makeCanvas, mix, refine, rng, sprite, texture16 } from './pixel';
import { addSkyTextures } from './sky';
import { outfitColors, type SaveData } from '../game/rules';
import * as S from './sprites';

/** Ground surface y (px) used when painting the background layers. */
const HORIZON = 208;

const BIOME = {
  sand: '#e8c872',
  stone: '#d1a95a',
  dune: '#f1d999',
  dune2: '#e9cd84',
  pyramid: '#e9cd84',
};

function addCanvas(scene: Phaser.Scene, key: string, canvas: HTMLCanvasElement): Phaser.Textures.CanvasTexture {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const t = scene.textures.addCanvas(key, canvas);
  if (!t) throw new Error(`Could not create texture ${key}`);
  return t;
}

/** A horizontal strip of equally sized frames named "0", "1", … */
function addStrip(scene: Phaser.Scene, key: string, frames: HTMLCanvasElement[]): void {
  const w = frames[0].width, h = frames[0].height;
  const c = makeCanvas(w * frames.length, h);
  const x = ctx2d(c);
  frames.forEach((f, i) => x.drawImage(f, i * w, 0));
  const t = addCanvas(scene, key, c);
  frames.forEach((_, i) => t.add(String(i), 0, i * w, 0, w, h));
}

/** Periodic dune height so layers tile seamlessly every GAME_WIDTH pixels. */
function duneHeight(x: number, amp: number, seed: number): number {
  const k = (2 * Math.PI) / GAME_WIDTH;
  return Math.round(((Math.sin(x * k * 2 + seed) * 0.5 + Math.sin(x * k * 5 + seed * 2) * 0.25 + 0.75) * amp) / 2) * 2;
}

function farCanvas(): HTMLCanvasElement {
  const c = makeCanvas(GAME_WIDTH, GAME_HEIGHT);
  const x = ctx2d(c);
  // stepped pyramid in the distance
  for (let s = 0; s < 7; s++) {
    x.fillStyle = s % 2 ? BIOME.pyramid : mix(BIOME.pyramid, '#ffffff', 0.12);
    x.fillRect(290 + s * 8, HORIZON - 30 - s * 8, 112 - s * 16, 8);
  }
  x.fillStyle = BIOME.dune;
  for (let i = 0; i < GAME_WIDTH; i += 2) {
    const h = duneHeight(i, 18, 3);
    x.fillRect(i, HORIZON - 22 - h, 2, GAME_HEIGHT);
  }
  return c;
}

function midCanvas(): HTMLCanvasElement {
  const c = makeCanvas(GAME_WIDTH, GAME_HEIGHT);
  const x = ctx2d(c);
  x.fillStyle = BIOME.dune2;
  for (let i = 0; i < GAME_WIDTH; i += 2) {
    const h = duneHeight(i, 12, 5);
    x.fillRect(i, HORIZON - 8 - h, 2, GAME_HEIGHT);
  }
  return c;
}

function decoCanvas(): HTMLCanvasElement {
  const w = GAME_WIDTH * 2;
  const c = makeCanvas(w, GAME_HEIGHT);
  const x = ctx2d(c);
  const cactus = texture16('#3f9b2f', 33, 'cactus');
  [60, 330, 610, 860].forEach((cx, n) => {
    const h = n % 2 ? 2 : 3;
    for (let j = 0; j < h; j++) x.drawImage(cactus, cx, HORIZON - 16 * (j + 1));
    if (h === 3) {
      x.drawImage(cactus, cx + 16, HORIZON - 32, 8, 8);
      x.drawImage(cactus, cx + 16, HORIZON - 40, 8, 8);
      x.drawImage(cactus, cx - 8, HORIZON - 24, 8, 8);
    }
  });
  // small rocks
  const R = rng(4);
  for (let k = 0; k < 10; k++) {
    const rx = Math.floor(R() * w), rw = 4 + Math.floor(R() * 6);
    x.fillStyle = '#b8955a';
    x.fillRect(rx, HORIZON - 3, rw, 3);
    x.fillStyle = '#d9b97a';
    x.fillRect(rx + 1, HORIZON - 3, rw - 2, 1);
  }
  return c;
}

function tilesetCanvas(): HTMLCanvasElement {
  const c = makeCanvas(80, 16);
  const x = ctx2d(c);
  x.drawImage(texture16(BIOME.sand, 11, 'top'), 0, 0);
  x.drawImage(texture16(BIOME.stone, 22, 'stone'), 16, 0);
  x.drawImage(texture16('#b9894a', 44, 'plank'), 32, 0);
  x.drawImage(texture16(BIOME.stone, 66, 'crack'), 48, 0);
  x.drawImage(texture16(BIOME.sand, 11, 'top'), 64, 0); // fake sand over a secret room: same look, no collision
  return c;
}

const HERO_POSES: [string, readonly string[]][] = [['hero-a', S.HERO_A], ['hero-b', S.HERO_B], ['hero-jump', S.HERO_JUMP]];

/**
 * Repaints Matěj in the chosen cap and shirt colours. The textures are redrawn in place, so
 * running animations and sprites keep working.
 */
export function paintHero(scene: Phaser.Scene, cap: [string, string], shirt: [string, string]): void {
  const pal = { ...S.HERO_PAL, R: cap[0], r: cap[1], B: shirt[0], b: shirt[1] };
  for (const [key, rows] of HERO_POSES) {
    const tex = scene.textures.get(key) as Phaser.Textures.CanvasTexture;
    const img = refine(sprite(rows, pal));
    tex.context.clearRect(0, 0, tex.width, tex.height);
    tex.context.drawImage(img, 0, 0);
    tex.refresh();
  }
}

/** Generates every texture and animation the game needs. Call once from the boot scene. */
export function generateTextures(scene: Phaser.Scene): void {
  for (const [key, rows] of HERO_POSES) addCanvas(scene, key, refine(sprite(rows, S.HERO_PAL)));
  addCanvas(scene, 'scorp-a', refine(sprite(S.SCORP_A, S.SCORP_PAL)));
  addCanvas(scene, 'scorp-b', refine(sprite(S.SCORP_B, S.SCORP_PAL)));
  addCanvas(scene, 'plant-open', refine(sprite(S.PLANT_OPEN, S.PLANT_PAL)));
  addCanvas(scene, 'plant-closed', refine(sprite(S.PLANT_CLOSED, S.PLANT_PAL)));
  addCanvas(scene, 'cactus', refine(sprite(S.CACTUS, S.CACTUS_PAL)));
  addCanvas(scene, 'flag-off', refine(sprite(S.FLAG, S.FLAG_OFF_PAL)));
  addCanvas(scene, 'flag-on', refine(sprite(S.FLAG, S.FLAG_ON_PAL)));
  addCanvas(scene, 'gate', refine(sprite(S.GATE, S.GATE_PAL)));
  addCanvas(scene, 'heart', sprite(S.HEART, S.HEART_PAL));
  addCanvas(scene, 'heart-empty', sprite(S.HEART, S.HEART_EMPTY_PAL));
  addCanvas(scene, 'bedrich', refine(sprite(S.BEDRICH, S.BEDRICH_PAL)));
  addCanvas(scene, 'medal', sprite(S.MEDAL, S.MEDAL_PAL));
  addCanvas(scene, 'medal-locked', sprite(S.MEDAL, S.MEDAL_LOCKED_PAL));
  addCanvas(scene, 'jetpack', refine(sprite(S.JETPACK, S.JETPACK_PAL)));
  addCanvas(scene, 'arrow', refine(sprite(S.ARROW, S.ARROW_PAL)));

  const coin = sprite(S.COIN, S.COIN_PAL);
  addStrip(scene, 'coin', [10, 7, 3, 7].map((w) => {
    const f = makeCanvas(10, 10);
    ctx2d(f).drawImage(coin, (10 - w) / 2, 0, w, 10);
    return f;
  }));

  const spark = makeCanvas(2, 2);
  const sx = ctx2d(spark);
  sx.fillStyle = '#ffffff';
  sx.fillRect(0, 0, 2, 2);
  addCanvas(scene, 'spark', spark);

  const tiles = addCanvas(scene, 'tiles', tilesetCanvas());
  tiles.add('sand', 0, 0, 0, 16, 16);
  tiles.add('stone', 0, 16, 0, 16, 16);
  const add = (key: string, c: HTMLCanvasElement) => { addCanvas(scene, key, c); };
  addSkyTextures(scene, add);
  addIntroTextures(add);
  add('icon-menu', sprite(S.ICON_MENU, S.ICON_PAL));
  add('icon-sound-on', sprite(S.ICON_SOUND_ON, S.ICON_PAL));
  add('icon-sound-off', sprite(S.ICON_SOUND_OFF, S.ICON_PAL));
  const icons: [string, readonly string[]][] = [
    ['icon-armor', S.ICON_ARMOR], ['icon-magnet', S.ICON_MAGNET], ['icon-map', S.ICON_MAP], ['icon-jetpack', S.ICON_JET],
    ['icon-boots', S.ICON_BOOTS], ['icon-full', S.ICON_FULL], ['icon-full-exit', S.ICON_FULL_EXIT],
  ];
  for (const [key, rows] of icons) add(key, sprite(rows, S.ICON_PAL));
  addCanvas(scene, 'bg-far', farCanvas());
  addCanvas(scene, 'bg-mid', midCanvas());
  addCanvas(scene, 'bg-deco', decoCanvas());

  const anims = scene.anims;
  if (!anims.exists('hero-walk')) anims.create({ key: 'hero-walk', frames: [{ key: 'hero-a' }, { key: 'hero-b' }], frameRate: 8, repeat: -1 });
  if (!anims.exists('scorp-walk')) anims.create({ key: 'scorp-walk', frames: [{ key: 'scorp-a' }, { key: 'scorp-b' }], frameRate: 6, repeat: -1 });
  if (!anims.exists('coin-spin')) anims.create({ key: 'coin-spin', frames: anims.generateFrameNames('coin', { start: 0, end: 3 }), frameRate: 8, repeat: -1 });
}

/** Dresses Matěj in the cap and shirt stored in the save. */
export function dressHero(scene: Phaser.Scene, d: Pick<SaveData, 'cap' | 'shirt'>): void {
  paintHero(scene, outfitColors(d.cap), outfitColors(d.shirt));
}
