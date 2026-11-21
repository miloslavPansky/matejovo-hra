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

export const CACTUS_PAL: Palette = { G: '#3f9b2f', g: '#2d7421', w: '#f3f0c0' };
export const CACTUS = [
  '...GG...', '..GgGGw.', '.wGGgG..', '..GgGG.G', 'G.GGgGwG', 'GwGgGGGG', 'GGGGgG..', '..GgGGw.',
  '.wGGgG..', '..GgGG..', '..GGgGw.', '.wGgGG..', '..GGgG..', '..GgGG..', '..GGGG..',
];

// HUD buttons, 13x13 with their own frame (k = border, B = panel, w = glyph, r = red cross)
export const ICON_PAL: Palette = { k: '#3b2a10', B: '#e9dfc4', w: '#3b2a10', r: '#c42b1c' };
export const ICON_MENU = [
  'kkkkkkkkkkkkk', 'kBBBBBBBBBBBk', 'kBBBBBBBBBBBk', 'kBBwwwwwwwBBk', 'kBBBBBBBBBBBk', 'kBBBBBBBBBBBk', 'kBBwwwwwwwBBk',
  'kBBBBBBBBBBBk', 'kBBBBBBBBBBBk', 'kBBwwwwwwwBBk', 'kBBBBBBBBBBBk', 'kBBBBBBBBBBBk', 'kkkkkkkkkkkkk',
];
export const ICON_SOUND_ON = [
  'kkkkkkkkkkkkk', 'kBBBBBBBBBBBk', 'kBBBBwBBBwBBk', 'kBBBwwBBBBwBk', 'kBwwwwBwBBwBk', 'kBwwwwBBwBwBk', 'kBwwwwBBwBwBk',
  'kBwwwwBwBBwBk', 'kBBBwwBBBBwBk', 'kBBBBwBBBwBBk', 'kBBBBBBBBBBBk', 'kBBBBBBBBBBBk', 'kkkkkkkkkkkkk',
];
export const ICON_SOUND_OFF = [
  'kkkkkkkkkkkkk', 'kBBBBBBBBBBBk', 'kBBBBwBBBBBBk', 'kBBBwwBBBBBBk', 'kBwwwwBrBBrBk', 'kBwwwwBBrrBBk', 'kBwwwwBBrrBBk',
  'kBwwwwBrBBrBk', 'kBBBwwBBBBBBk', 'kBBBBwBBBBBBk', 'kBBBBBBBBBBBk', 'kBBBBBBBBBBBk', 'kkkkkkkkkkkkk',
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

/** Level goal: the Sun Gate, a sandstone gateway filled with warm light. */
export const GATE = [
  '........YYYY........',
  '......YYyyyyYY......',
  '.....YyyWWWWyyY.....',
  'SSSSSSSSSSSSSSSSSSSS',
  'SsSSsSSsSSSSsSSsSSsS',
  'ssssssssssssssssssss',
  // light rays fall through the doorway: bright columns (l) on a warm glow (L)
  ...Array.from({ length: 14 }, (_, i) => (i % 2 ? '.SsSs' : '.SSSs') + 'LlLLlLLlLL' + (i % 2 ? 'SsSs.' : 'SSSs.')),
  'SSSSSsLlLLlLLlSSSSSs',
  'ssssssLlLLlLLlssssss',
];
export const GATE_PAL: Palette = { Y: '#ffd21a', y: '#e08a10', W: '#fff6c8', S: '#c99a5a', s: '#8e6634', L: '#ffb326', l: '#fff0a0' };
