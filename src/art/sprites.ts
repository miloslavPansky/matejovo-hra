// Sprite maps from design v0.2. Each character is one pixel before refine() doubles it.
import type { Palette } from './pixel';

export const HERO_PAL: Palette = {
  R: '#c62828', r: '#8e1b1b', H: '#5a3a1e', S: '#f1c19a', s: '#d9a07a', W: '#ffffff', K: '#1d2a6b',
  m: '#9c4a3a', B: '#2f6fe0', b: '#1f4fb0', P: '#3b3b4f', O: '#6b4a2a',
};

export const HERO_A = [
  '..RRRRR...', '.RRRRRRR..', '.rrrrrrrrr', '.HHSSSSS..', '.HSSSSWK..', '.HSSSSSS..', '..SSSSmS..', '..ssssss..',
  '..BBBBBB..', '..BBbBBB..', '..BBbBBB..', '..BBSBBB..', '..PPPPPP..', '..PP..PP..', '.SS....SS.', '.OOO..OOO.',
];
export const HERO_B = [
  '..RRRRR...', '.RRRRRRR..', '.rrrrrrrrr', '.HHSSSSS..', '.HSSSSWK..', '.HSSSSSS..', '..SSSSmS..', '..ssssss..',
  '..BBBBBB..', '..BBBbBB..', '..BBBbBB..', '..BBBSBB..', '..PPPPPP..', '...PPPP...', '...SSSS...', '...OOOOO..',
];
/** Jump pose: arm up, legs tucked. */
export const HERO_JUMP = [
  '..RRRRR...', '.RRRRRRR..', '.rrrrrrrrr', '.HHSSSSS..', '.HSSSSWK..', '.HSSSSSS.S', '..SSSSmSbS', '..ssssssB.',
  '..BBBBBBB.', '..BBBBBB..', '..BBBBBB..', '..BBBBBB..', '..PPPPPP..', '.PP...PP..', '.SS...SS..', 'OOO...OOO.',
];

export const SCORP_PAL: Palette = { c: '#d99a2b', C: '#b0701c', b: '#a8641a', B: '#7c4510', E: '#111111', l: '#5a320c', K: '#3a1d05' };
export const SCORP_A = [
  '...........ccc..', '..........c...c.', '..........c...K.', '.CC.......c.....', 'C..C.bbbbbcc....', 'C.CcbbbbbbbbB...',
  '.CC.bEbbbbbbbB..', '....l.l.l.l.l...',
];
export const SCORP_B = [
  '...........ccc..', '..........c...c.', '..........c...K.', '.CC.......c.....', 'C..C.bbbbbcc....', 'C.CcbbbbbbbbB...',
  '.CC.bEbbbbbbbB..', '.....l.l.l.l.l..',
];

export const PLANT_PAL: Palette = { G: '#3f9b2f', g: '#2d7421', y: '#d6e04a', W: '#ffffff', R: '#c0262d', K: '#5a0e12', d: '#2f6d22', L: '#4fb33a' };
export const PLANT_OPEN = [
  '...GGGGGG...', '.GGyGGGyGGG.', 'GGgGGGGGGgGG', 'GWRWRWRWRWRG', 'GRRRRRRRRRRG', 'GRRRRKKRRRRG', 'GWRWRWRWRWRG',
  'GGgGGGGGGgGG', '.GGGyGGyGGG.', '.....dd.....', '..LL.dd.LL..', '.LLLLddLLLL.', '..L..dd..L..', '.....dd.....',
];
export const PLANT_CLOSED = [
  '............', '...GGGGGG...', '.GGyGGGyGGG.', 'GGgGGGGGGgGG', 'GGWWWWWWWWGG', 'GGgGGGGGGgGG', '.GGGyGGyGGG.',
  '..GGGGGGGG..', '............', '.....dd.....', '..LL.dd.LL..', '.LLLLddLLLL.', '..L..dd..L..', '.....dd.....',
];

export const COIN_PAL: Palette = { Y: '#ffd21a', y: '#e3a600', W: '#fff6b0', o: '#a86f00' };
export const COIN = [
  '..oooooo..', '.oYYYYYYo.', 'oYWWYYYYyo', 'oYWYYYYYyo', 'oYYYyyYYyo', 'oYYYyyYYyo', 'oYYYYYYYyo', 'oYYYYYYyyo', '.oyyyyyyo.', '..oooooo..',
];

export const HEART_PAL: Palette = { R: '#e02424', r: '#9b1515', W: '#ffb3b3', k: '#3a0a0a' };
export const HEART_EMPTY_PAL: Palette = { R: '#5a4a4a', r: '#3a2e2e', W: '#7a6a6a', k: '#1a1010' };
export const HEART = ['.kk...kk.', 'kRRk.kRRk', 'kRWRkRRrk', 'kRRRRRRrk', '.kRRRRrk.', '..kRRrk..', '...krk...', '....k....'];

export const FLAG = [
  '.pFFFFFF.', '.pFFFFFFF', '.pFFsFFFF', '.pFsssFFF', '.pFFsFFFF', '.pFFFFFFF', '.pfffffff', '.p.......', '.p.......',
  '.p.......', '.p.......', '.p.......', '.p.......', '.p.......', '.p.......', '.p.......', '.p.......', '.p.......',
  '.p.......', 'bbb......', 'bbb......',
];
export const FLAG_OFF_PAL: Palette = { p: '#5a4a3a', b: '#8a7a5a', F: '#a9a39a', f: '#7d776e', s: '#c9c3ba' };
export const FLAG_ON_PAL: Palette = { p: '#5a4a3a', b: '#8a7a5a', F: '#f2c230', f: '#c9952a', s: '#fff3a0' };

export const OBELISK = [
  '....Y....', '...YYY...', '..ssSSs..', '..sSSSs..', '..sSYSs..', '..sYYYs..', '..sSYSs..', '..sSSSs..', '..sSSSs..',
  '..sSSSs..', '..sSSSs..', '..sSSSs..', '.ssSSSss.', '.sSSSSSs.', '.sSSSSSs.', '.sSSSSSs.', '.sSSSSSs.', '.sSSSSSs.',
  'sssssssss', 'sSSSSSSSs', 'sssssssss',
];
export const OBELISK_PAL: Palette = { Y: '#f2c230', S: '#e8d3a0', s: '#c9a86a' };
