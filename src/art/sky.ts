// Sky, clouds and the friendly sun with rays that smiles and blinks now and then.
import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { ctx2d, dither, fillEllipse, makeCanvas, mix, rng } from './pixel';

const HORIZON = 208;
const SKY_STOPS: [number, string][] = [[0, '#3d86d8'], [0.45, '#6fb4ee'], [0.8, '#aedcf6'], [1, '#e9f4f1']];

function skyColorAt(t: number): string {
  for (let i = 1; i < SKY_STOPS.length; i++) {
    const [p1, c1] = SKY_STOPS[i];
    const [p0, c0] = SKY_STOPS[i - 1];
    if (t <= p1) return mix(c0, c1, (t - p0) / (p1 - p0));
  }
  return SKY_STOPS[SKY_STOPS.length - 1][1];
}

/** Smooth vertical gradient: one colour per row, dithered between rows so no bands show. */
export function skyCanvas(): HTMLCanvasElement {
  const c = makeCanvas(GAME_WIDTH, GAME_HEIGHT);
  const x = ctx2d(c);
  const rows: string[] = [];
  for (let j = 0; j <= HORIZON; j++) rows.push(skyColorAt(j / HORIZON));
  for (let j = 0; j < GAME_HEIGHT; j++) {
    const a = rows[Math.min(j, HORIZON)], b = rows[Math.min(j + 1, HORIZON)];
    for (let i = 0; i < GAME_WIDTH; i++) {
      x.fillStyle = dither(i, j, 0.5) ? b : a;
      x.fillRect(i, j, 1, 1);
    }
  }
  return c;
}

/** One fluffy cloud: overlapping ellipses with a shaded belly and a bright top. */
function cloud(w: number, seed: number): HTMLCanvasElement {
  const h = Math.round(w * 0.42);
  const c = makeCanvas(w, h);
  const x = ctx2d(c);
  const R = rng(seed);
  const blobs: [number, number, number][] = [];
  const n = 3 + Math.floor(w / 22);
  for (let i = 0; i < n; i++) {
    const r = w * (0.13 + R() * 0.09);
    blobs.push([r + 2 + (i / (n - 1)) * (w - 2 * r - 4), h - r * 0.75 - 2 - R() * h * 0.2, r]);
  }
  blobs.forEach(([cx, cy, r]) => fillEllipse(x, cx, cy + 2, r, r * 0.72, '#c9d9ec'));
  blobs.forEach(([cx, cy, r]) => fillEllipse(x, cx, cy, r, r * 0.72, '#f4f8fc'));
  blobs.forEach(([cx, cy, r]) => fillEllipse(x, cx - r * 0.2, cy - r * 0.3, r * 0.55, r * 0.35, '#ffffff'));
  x.fillStyle = '#b9cde3';
  x.fillRect(Math.round(w * 0.12), h - 2, Math.round(w * 0.76), 1);
  return c;
}

/** A tileable strip (2 x screen width) of clouds. */
export function cloudsCanvas(seed: number, sizes: number[], ys: number[]): HTMLCanvasElement {
  const W = GAME_WIDTH * 2;
  const c = makeCanvas(W, 110);
  const x = ctx2d(c);
  sizes.forEach((w, i) => {
    const s = cloud(w, seed + i);
    const cx = Math.round((i + 0.5) * (W / sizes.length) - w / 2);
    x.drawImage(s, cx, ys[i % ys.length]);
  });
  return c;
}

const SUN = { r: 15, body: '#ffd21a', rim: '#f2a900', light: '#fff2a6', ray: '#ffe066', rayCore: '#fff6c2', face: '#8a4b00', cheek: '#ff9b5a' };

function sunRays(offset: number): HTMLCanvasElement {
  const S = 80, c = makeCanvas(S, S), x = ctx2d(c);
  const cx = S / 2, cy = S / 2;
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2 + offset;
    const long = k % 2 === 0;
    const r0 = SUN.r + 3, r1 = long ? SUN.r + 20 : SUN.r + 13;
    for (let r = r0; r <= r1; r += 0.5) {
      const px = Math.round(cx + Math.cos(a) * r), py = Math.round(cy + Math.sin(a) * r);
      const thick = r < r1 - 4 ? 2 : 1;
      x.fillStyle = r < r0 + 4 ? SUN.rayCore : SUN.ray;
      x.fillRect(px - (thick >> 1), py - (thick >> 1), thick, thick);
    }
  }
  return c;
}

type Face = 'open' | 'smile' | 'blink';
function sunFace(face: Face): HTMLCanvasElement {
  const S = 40, c = makeCanvas(S, S), x = ctx2d(c);
  const cx = S / 2, cy = S / 2;
  fillEllipse(x, cx, cy, SUN.r + 1, SUN.r + 1, SUN.rim);
  fillEllipse(x, cx, cy, SUN.r, SUN.r, SUN.body);
  fillEllipse(x, cx - 5, cy - 6, 6, 4, SUN.light);
  x.fillStyle = SUN.face;
  if (face === 'blink') {
    x.fillRect(cx - 7, cy - 2, 4, 1);
    x.fillRect(cx + 3, cy - 2, 4, 1);
  } else {
    x.fillRect(cx - 6, cy - 4, 2, 3);
    x.fillRect(cx + 4, cy - 4, 2, 3);
  }
  x.fillStyle = SUN.cheek;
  x.fillRect(cx - 10, cy + 2, 3, 2);
  x.fillRect(cx + 7, cy + 2, 3, 2);
  x.fillStyle = SUN.face;
  if (face === 'smile') {
    // big open smile
    x.fillRect(cx - 5, cy + 3, 10, 1);
    x.fillRect(cx - 4, cy + 4, 8, 1);
    x.fillStyle = '#c4452a';
    x.fillRect(cx - 3, cy + 5, 6, 1);
    x.fillStyle = SUN.face;
    x.fillRect(cx - 2, cy + 6, 4, 1);
  } else {
    x.fillRect(cx - 4, cy + 4, 1, 1);
    x.fillRect(cx - 3, cy + 5, 6, 1);
    x.fillRect(cx + 3, cy + 4, 1, 1);
  }
  return c;
}

export function addSkyTextures(scene: Phaser.Scene, add: (key: string, c: HTMLCanvasElement) => void): void {
  add('bg-sky', skyCanvas());
  add('bg-clouds', cloudsCanvas(10, [96, 64, 120, 80], [30, 12, 44, 20]));
  add('bg-clouds-far', cloudsCanvas(30, [40, 52, 36, 48, 44], [58, 70, 50, 66, 62]));
  add('sun-rays-a', sunRays(0));
  add('sun-rays-b', sunRays(Math.PI / 12));
  add('sun-open', sunFace('open'));
  add('sun-smile', sunFace('smile'));
  add('sun-blink', sunFace('blink'));
  void scene;
}

/** Places the sun (fixed on screen). Rays shimmer; at random moments the sun blinks or smiles. */
export function createSun(scene: Phaser.Scene, x: number, y: number, depth = -18): Phaser.GameObjects.Container {
  const rays = scene.add.image(0, 0, 'sun-rays-a');
  const face = scene.add.image(0, 0, 'sun-open');
  const sun = scene.add.container(x, y, [rays, face]).setScrollFactor(0).setDepth(depth);
  scene.time.addEvent({ delay: 550, loop: true, callback: () => rays.setTexture(rays.texture.key === 'sun-rays-a' ? 'sun-rays-b' : 'sun-rays-a') });
  const next = () => {
    scene.time.delayedCall(Phaser.Math.Between(2500, 7000), () => {
      if (!face.active) return;
      if (Math.random() < 0.55) {
        face.setTexture('sun-blink');
        scene.time.delayedCall(140, () => face.active && face.setTexture('sun-open'));
        if (Math.random() < 0.3) scene.time.delayedCall(300, () => { if (face.active) { face.setTexture('sun-blink'); scene.time.delayedCall(120, () => face.active && face.setTexture('sun-open')); } });
      } else {
        face.setTexture('sun-smile');
        scene.time.delayedCall(Phaser.Math.Between(1200, 2200), () => face.active && face.setTexture('sun-open'));
      }
      next();
    });
  };
  next();
  return sun;
}
