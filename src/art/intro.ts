// Art for the intro: the back garden with the sandbox, the shovel and the golden sun stone.
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { ctx2d, fillEllipse, makeCanvas, refine, rng, shade, sprite } from './pixel';
import { skyCanvas } from './sky';

/** Surface of the sand inside the sandbox (Matěj stands on it). */
export const SANDBOX = { x0: 196, x1: 372, top: 204, bottom: 226 };
export const GRASS_TOP = 214;

function noiseRect(x: CanvasRenderingContext2D, x0: number, y0: number, w: number, h: number, base: string, seed: number, amp = 0.08): void {
  const R = rng(seed);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    x.fillStyle = shade(base, 1 - amp + R() * amp * 2);
    x.fillRect(x0 + i, y0 + j, 1, 1);
  }
}

function gardenCanvas(): HTMLCanvasElement {
  const c = makeCanvas(GAME_WIDTH, GAME_HEIGHT);
  const x = ctx2d(c);
  x.drawImage(skyCanvas(), 0, 0);

  // trees behind the fence
  const R = rng(7);
  for (let i = 0; i < 14; i++) {
    const cx = 120 + i * 28 + R() * 10, cy = 150 + R() * 14, r = 16 + R() * 10;
    fillEllipse(x, cx, cy + 3, r, r * 0.8, '#3f7f32');
    fillEllipse(x, cx - 3, cy, r * 0.85, r * 0.7, '#57a043');
    fillEllipse(x, cx - 6, cy - 5, r * 0.4, r * 0.3, '#78bd5a');
  }

  // wooden fence
  for (let px = 112; px < GAME_WIDTH; px += 12) {
    x.fillStyle = '#c89a5a';
    x.fillRect(px, 160, 10, 56);
    x.fillRect(px + 2, 157, 6, 3);
    x.fillRect(px + 4, 155, 2, 2);
    x.fillStyle = '#e0b878';
    x.fillRect(px + 1, 160, 2, 54);
    x.fillStyle = '#9c7038';
    x.fillRect(px + 8, 160, 2, 56);
  }
  x.fillStyle = '#a87a40';
  x.fillRect(112, 172, GAME_WIDTH - 112, 4);
  x.fillRect(112, 198, GAME_WIDTH - 112, 4);

  // house on the left: wall, roof, window, door
  noiseRect(x, 0, 78, 112, 138, '#efe2c4', 3, 0.04);
  x.fillStyle = '#d9c8a4';
  for (let y = 86; y < 214; y += 8) x.fillRect(0, y, 112, 1);
  for (let s = 0; s < 6; s++) {
    x.fillStyle = s % 2 ? '#b5452f' : '#c4523a';
    x.fillRect(-6 + s * 4, 40 + s * 7, 128 - s * 8, 7);
  }
  x.fillStyle = '#8e3424';
  x.fillRect(-6, 78, 128, 4);
  x.fillStyle = '#ffffff';
  x.fillRect(22, 104, 40, 34);
  x.fillStyle = '#9fd3f0';
  x.fillRect(25, 107, 16, 13);
  x.fillRect(43, 107, 16, 13);
  x.fillRect(25, 122, 16, 13);
  x.fillRect(43, 122, 16, 13);
  x.fillStyle = '#d4eefa';
  x.fillRect(26, 108, 5, 2);
  x.fillRect(44, 108, 5, 2);
  x.fillStyle = '#c0392b';
  x.fillRect(20, 139, 44, 4);
  x.fillStyle = '#7a4a24';
  x.fillRect(78, 150, 26, 66);
  x.fillStyle = '#5e3818';
  x.fillRect(80, 152, 22, 2);
  x.fillRect(80, 180, 22, 2);
  x.fillStyle = '#f2c230';
  x.fillRect(98, 184, 3, 3);

  // grass
  noiseRect(x, 0, GRASS_TOP, GAME_WIDTH, GAME_HEIGHT - GRASS_TOP, '#6fbf4a', 9, 0.1);
  const G = rng(11);
  for (let i = 0; i < 220; i++) {
    const gx = Math.floor(G() * GAME_WIDTH), gy = GRASS_TOP + Math.floor(G() * (GAME_HEIGHT - GRASS_TOP));
    x.fillStyle = G() < 0.5 ? '#4f9a35' : '#8fd468';
    x.fillRect(gx, gy, 1, 2);
  }
  x.fillStyle = '#5aa83a';
  x.fillRect(0, GRASS_TOP, GAME_WIDTH, 1);

  // sandbox: wooden frame and sand
  const { x0, x1, top, bottom } = SANDBOX;
  noiseRect(x, x0, top, x1 - x0, bottom - top, '#ecd48c', 21, 0.07);
  x.fillStyle = '#f6e3a8';
  x.fillRect(x0, top, x1 - x0, 1);
  const plank = (px: number, py: number, w: number, h: number) => {
    x.fillStyle = '#b07a3e'; x.fillRect(px, py, w, h);
    x.fillStyle = '#d29a58'; x.fillRect(px, py, w, 1);
    x.fillStyle = '#7e5226'; x.fillRect(px, py + h - 1, w, 1);
  };
  plank(x0 - 6, top - 4, 6, bottom - top + 10);
  plank(x1, top - 4, 6, bottom - top + 10);
  plank(x0 - 6, bottom, x1 - x0 + 12, 6);
  plank(x0 - 6, top - 4, x1 - x0 + 12, 4);

  // sand castle on the left side of the sandbox
  const sand = '#e2c271', sandD = '#c9a656';
  x.fillStyle = sand;
  x.fillRect(212, 186, 34, 18);
  x.fillRect(208, 176, 10, 28);
  x.fillRect(240, 176, 10, 28);
  x.fillRect(222, 170, 14, 16);
  for (const tx of [208, 212, 216, 240, 244, 248, 222, 226, 230, 234]) x.fillRect(tx, tx < 220 || tx > 238 ? 173 : 167, 2, 3);
  x.fillStyle = sandD;
  x.fillRect(226, 194, 6, 10);
  x.fillRect(214, 182, 2, 3);
  x.fillRect(244, 182, 2, 3);
  x.fillStyle = '#d23a2a';
  x.fillRect(229, 158, 1, 12);
  x.fillRect(230, 158, 5, 3);
  // bucket
  x.fillStyle = '#3b7be8';
  x.fillRect(350, 192, 12, 12);
  x.fillStyle = '#2655b8';
  x.fillRect(350, 192, 12, 2);
  x.fillStyle = '#ffffff';
  x.fillRect(352, 196, 2, 6);
  return c;
}

const SHOVEL = ['....r', '...r.', '..r..', '.r...', 'gg...', 'gg...', 'g....'];
const SHOVEL_PAL = { r: '#c62828', g: '#9aa3ad' };
const STONE = ['..YYYY..', '.YyWWyY.', 'YyYWWYyY', 'YWWYYWWY', 'YyYWWYyY', '.YyWWyY.', '..YYYY..'];
const STONE_PAL = { Y: '#f2c230', y: '#d99a1a', W: '#fff3a0' };

export function addIntroTextures(add: (key: string, c: HTMLCanvasElement) => void): void {
  add('intro-garden', gardenCanvas());
  add('intro-shovel', refine(sprite(SHOVEL, SHOVEL_PAL)));
  add('intro-stone', refine(sprite(STONE, STONE_PAL)));
}
