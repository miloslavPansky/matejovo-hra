import Phaser from 'phaser';
import { FONT } from '../config';

export interface PixelTextStyle {
  /** Font size in game pixels: 8 (body text) or 16 (headings), the font's native grid. */
  size?: 8 | 16;
  color?: string;
  /** 1px drop shadow colour; null = none. */
  shadow?: string | null;
  /** Optional solid background with padding (for small buttons). */
  background?: string;
  padding?: number;
}

let counter = 0;

/**
 * Text drawn as hard pixels (no anti-aliasing), so it stays sharp when the 480x270 game is
 * scaled up. Phaser's normal Text is anti-aliased and looks blurry after scaling.
 */
export class PixelText extends Phaser.GameObjects.Image {
  private readonly texKey: string;
  private value = '';
  private readonly style: Required<Omit<PixelTextStyle, 'background'>> & { background?: string };

  constructor(scene: Phaser.Scene, x: number, y: number, text: string, style: PixelTextStyle = {}) {
    const key = `pixel-text-${counter++}`;
    super(scene, x, y, '__DEFAULT');
    this.texKey = key;
    this.style = { size: 8, color: '#ffffff', shadow: '#3b2a10', padding: 0, ...style };
    scene.add.existing(this);
    this.setText(text);
    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      if (scene.textures.exists(key)) scene.textures.remove(key);
    });
  }

  get text(): string {
    return this.value;
  }

  setText(text: string): this {
    if (text === this.value && this.scene.textures.exists(this.texKey)) return this;
    this.value = text;
    const canvas = renderPixelText(text, this.style);
    if (this.scene.textures.exists(this.texKey)) this.scene.textures.remove(this.texKey);
    this.scene.textures.addCanvas(this.texKey, canvas);
    this.setTexture(this.texKey);
    this.setSize(canvas.width, canvas.height);
    return this;
  }
}

function renderPixelText(text: string, s: PixelTextStyle & { size: number; color: string; padding: number }): HTMLCanvasElement {
  const font = `${s.size}px ${FONT}`;
  const lines = text.split('\n');
  const measure = document.createElement('canvas').getContext('2d');
  if (!measure) throw new Error('Canvas 2D context is not available');
  measure.font = font;
  const lineH = Math.round(s.size * 1.75);
  const pad = s.padding;
  // Even sizes keep centred text (origin 0.5) on whole pixels.
  const evenUp = (v: number) => v + (v % 2);
  const w = evenUp(Math.max(1, ...lines.map((l) => Math.ceil(measure.measureText(l).width))) + 2 + pad * 2);
  const h = evenUp(lineH * lines.length + 2 + pad * 2);

  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true });
  if (!x) throw new Error('Canvas 2D context is not available');
  x.font = font;
  x.textBaseline = 'alphabetic';
  x.fillStyle = '#000';
  // Glyphs sit in the em box above the baseline; accents on capitals (Ž, Š, Č) need extra room on top.
  const ascent = s.size + Math.round(s.size * 0.375);
  lines.forEach((l, i) => x.fillText(l, pad, pad + ascent + i * lineH));

  // Threshold the anti-aliased glyphs into hard pixels, then add the shadow and background.
  const img = x.getImageData(0, 0, w, h);
  const d = img.data;
  const on = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) on[i] = d[i * 4 + 3] >= 110 ? 1 : 0;
  const fg = hexToRgb(s.color);
  const sh = s.shadow ? hexToRgb(s.shadow) : null;
  const bg = s.background ? hexToRgb(s.background) : null;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const k = j * w + i, p = k * 4;
    let col: [number, number, number] | null = null;
    if (on[k]) col = fg;
    else if (sh && i > 0 && j > 0 && on[k - w - 1]) col = sh;
    else if (bg) col = bg;
    if (col) { d[p] = col[0]; d[p + 1] = col[1]; d[p + 2] = col[2]; d[p + 3] = 255; } else d[p + 3] = 0;
  }
  x.putImageData(img, 0, 0);
  return c;
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', '').slice(0, 6), 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
}
