// Pixel-art toolkit: every texture in the game is drawn from code at startup (style of design v0.2).

export type Palette = Record<string, string>;

/** Deterministic PRNG (mulberry32) so generated textures look the same on every run. */
export function rng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

export function ctx2d(c: HTMLCanvasElement): CanvasRenderingContext2D {
  const x = c.getContext('2d', { willReadFrequently: true });
  if (!x) throw new Error('Canvas 2D context is not available');
  x.imageSmoothingEnabled = false;
  return x;
}

function toRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
}
const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
const toHex = (r: number, g: number, b: number) =>
  '#' + ((1 << 24) | (clamp(r) << 16) | (clamp(g) << 8) | clamp(b)).toString(16).slice(1);

export function shade(hex: string, f: number): string {
  const [r, g, b] = toRgb(hex);
  return toHex(r * f, g * f, b * f);
}

export function mix(a: string, b: string, f: number): string {
  const A = toRgb(a), B = toRgb(b);
  return toHex(A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f, A[2] + (B[2] - A[2]) * f);
}

/** Pixel-exact filled ellipse (no anti-aliasing). */
export function fillEllipse(x: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, col: string): void {
  x.fillStyle = col;
  for (let j = Math.floor(-ry); j <= Math.ceil(ry); j++) {
    for (let i = Math.floor(-rx); i <= Math.ceil(rx); i++) {
      if ((i * i) / (rx * rx) + (j * j) / (ry * ry) <= 1.02) x.fillRect(Math.round(cx + i), Math.round(cy + j), 1, 1);
    }
  }
}

/** Ordered 4x4 Bayer dithering threshold in [0, 1). */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
export function dither(i: number, j: number, f: number): boolean {
  return f * 16 > BAYER[(i & 3) + ((j & 3) << 2)] + 0.5;
}

/** Draws a sprite from rows of palette characters ('.' = transparent). */
export function sprite(rows: readonly string[], pal: Palette): HTMLCanvasElement {
  const w = Math.max(...rows.map((r) => r.length));
  const c = makeCanvas(w, rows.length);
  const x = ctx2d(c);
  rows.forEach((row, y) => {
    [...row].forEach((ch, i) => {
      const col = pal[ch];
      if (ch !== '.' && col) {
        x.fillStyle = col;
        x.fillRect(i, y, 1, 1);
      }
    });
  });
  return c;
}

/**
 * The v0.2 "refined" look: 2x upscale, rounded outer corners, light top edges,
 * darker bottom edges and a dark outline tinted by the neighbouring colour.
 */
export function refine(src: HTMLCanvasElement): HTMLCanvasElement {
  const W = src.width * 2 + 2, H = src.height * 2 + 2;
  const c = makeCanvas(W, H);
  const x = ctx2d(c);
  x.drawImage(src, 1, 1, src.width * 2, src.height * 2);
  const im = x.getImageData(0, 0, W, H);
  const d = im.data;
  const A = (a: Uint8ClampedArray, i: number, j: number) => (i < 0 || j < 0 || i >= W || j >= H ? 0 : a[(j * W + i) * 4 + 3]);

  const r1 = new Uint8ClampedArray(d);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    if (!A(d, i, j)) continue;
    const t = !A(d, i, j - 1), b = !A(d, i, j + 1), l = !A(d, i - 1, j), r = !A(d, i + 1, j);
    const big = (dx: number, dy: number) => A(d, i + 2 * dx, j) && A(d, i, j + 2 * dy) && A(d, i + dx, j + dy);
    if ((t && l && big(1, 1)) || (t && r && big(-1, 1)) || (b && l && big(1, -1)) || (b && r && big(-1, -1))) r1[(j * W + i) * 4 + 3] = 0;
  }

  const r2 = new Uint8ClampedArray(r1);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const k = (j * W + i) * 4;
    if (!r1[k + 3]) continue;
    let f = 1;
    if (!A(r1, i, j - 1)) f = 1.14;
    else if (!A(r1, i, j + 1) || !A(r1, i, j + 2)) f = 0.82;
    else if (!A(r1, i + 1, j)) f = 0.9;
    else {
      const k2 = ((j + 1) * W + i) * 4;
      if (Math.abs(r1[k2] - r1[k]) + Math.abs(r1[k2 + 1] - r1[k + 1]) + Math.abs(r1[k2 + 2] - r1[k + 2]) > 60) f = 0.9;
    }
    r2[k] = Math.min(255, r1[k] * f);
    r2[k + 1] = Math.min(255, r1[k + 1] * f);
    r2[k + 2] = Math.min(255, r1[k + 2] * f);
  }

  const r3 = new Uint8ClampedArray(r2);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const k = (j * W + i) * 4;
    if (r2[k + 3]) continue;
    for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]] as const) {
      if (A(r2, i + dx, j + dy)) {
        const n = ((j + dy) * W + i + dx) * 4;
        r3[k] = r2[n] * 0.3;
        r3[k + 1] = r2[n + 1] * 0.28;
        r3[k + 2] = r2[n + 2] * 0.3;
        r3[k + 3] = 255;
        break;
      }
    }
  }
  im.data.set(r3);
  x.putImageData(im, 0, 0);
  return c;
}

export type TexKind = 'plain' | 'top' | 'stone' | 'cactus' | 'plank' | 'crack';

/** 16x16 noisy block texture in the Minecraft-like style of v0.2. */
export function texture16(base: string, seed: number, kind: TexKind): HTMLCanvasElement {
  const c = makeCanvas(16, 16);
  const x = ctx2d(c);
  const R = rng(seed);
  for (let y = 0; y < 16; y++) for (let i = 0; i < 16; i++) {
    let f = 0.92 + R() * 0.16;
    if (kind === 'stone') { if (y % 5 === 0) f *= 0.84; if (y % 5 === 1) f *= 1.07; }
    if (kind === 'top') { if (y < 3) f *= 1.08; if (y === 15) f *= 0.9; }
    if (kind === 'cactus') { if (i % 4 === 0) f *= 0.78; if (i === 0 || i === 15) f *= 0.7; }
    if (kind === 'plank') { if (y % 4 === 3) f *= 0.7; if ((i + (y >> 2) * 5) % 8 === 0) f *= 0.78; if (y === 0) f *= 1.15; }
    if (kind === 'crack') {
      if ((i === 5 && y > 3 && y < 9) || (y === 8 && i > 4 && i < 11) || (i === 10 && y > 7)) f *= 0.62;
      if (y % 5 === 0) f *= 0.86;
    }
    x.fillStyle = shade(base, f);
    x.fillRect(i, y, 1, 1);
  }
  return c;
}
