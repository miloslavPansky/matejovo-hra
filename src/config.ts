export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 270;
export const TILE = 16;
export const GRAVITY = 900;
export const LIVES = 3;
/** Pixel font designed on an 8px grid: use sizes 8 or 16 only, otherwise glyphs distort. */
export const FONT = '"Press Start 2P", "Courier New", monospace';

/** Tile ids in the Tiled tileset "poust" (gid with firstgid 1). Keep in sync with scripts/gen-level.mjs. */
export const TILES = { sand: 1, stone: 2, plank: 3, stone2: 4, fake: 5 } as const;

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

/** Rocket backpack from the shop: 3 s of thrust, refilled while standing on the ground. */
export const JETPACK = {
  fuelMs: 3000,
  /** Upward acceleration against gravity (px/s²) and the fastest climb (px/s). */
  thrust: 1900,
  maxRise: 150,
  /** Fuel refilled per ms on the ground: a full tank in half a second. */
  refill: 6,
} as const;

/** Coin magnet from the shop. */
export const MAGNET = { radius: 80, speed: 240 } as const;

export const SCORPION_SPEED = 32;
export const PLANT_CYCLE_MS = 1200;

declare global {
  const __APP_VERSION__: string;
}
