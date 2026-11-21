export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 270;
export const TILE = 16;
export const GRAVITY = 900;
export const LIVES = 3;
export const FONT = '"Pixelify Sans", "Courier New", monospace';

/** Tile ids in the Tiled tileset "poust" (gid with firstgid 1). Keep in sync with scripts/gen-level.mjs. */
export const TILES = { sand: 1, stone: 2, plank: 3, stone2: 4 } as const;

export const PLAYER = {
  runSpeed: 115,
  accel: 900,
  drag: 1100,
  jumpVelocity: 330,
  /** Velocity multiplier when the jump button is released early (variable jump height). */
  jumpCut: 0.45,
  coyoteMs: 100,
  jumpBufferMs: 120,
  stompBounce: 230,
  invulnMs: 1400,
  stunMs: 250,
  maxFall: 520,
} as const;

export const SCORPION_SPEED = 32;
export const PLANT_CYCLE_MS = 1200;

declare global {
  const __APP_VERSION__: string;
}
