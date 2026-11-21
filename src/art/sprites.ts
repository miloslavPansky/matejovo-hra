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

// HUD buttons and item icons, 13x13 with their own frame (k = border, B = panel, w = glyph, r = red cross)
export const ICON_PAL: Palette = {
  k: '#3b2a10', B: '#e9dfc4', w: '#3b2a10', r: '#c42b1c',
  s: '#6d7681', S: '#c9d1d9', y: '#ffd21a', o: '#b8860b', p: '#f1d999', R: '#c62828', f: '#e0701c',
};
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

// ---------- 0.5: shop, items, badges ----------

/** Bedřich, the merchant camel with a red fez and a blue saddle blanket. Faces left. */
export const BEDRICH_PAL: Palette = {
  C: '#d9a663', c: '#b07a3c', d: '#6b4423', E: '#111111', N: '#3b2a10',
  F: '#c62828', f: '#8e1b1b', T: '#ffd21a', Y: '#ffd21a', G: '#3f7fbf', g: '#2a5a8f',
};
export const BEDRICH = [
  '.FFF....................',
  '.FFFT...................',
  '.ffffT..................',
  '.CCCC...................',
  'CCECCC..................',
  'CCCCCC.........cc.......',
  'NCCCCC........cCCc......',
  '.cCCCC.......cCCCCc.....',
  '...CCC......cCCCCCCc....',
  '...CCC.....cCCCCCCCCc...',
  '...CCCCCCCCCCCCCCCCCCc..',
  '...cCCCCCYYYYYYYCCCCCCc.',
  '....CCCCCYGGgGGYCCCCCCCc',
  '....cCCCCYGgGgGYCCCCCc.c',
  '.....cCCCYYYYYYYCCCCc...',
  '......ccCCCCCCCCCCcc....',
  '......CC.CC....CC.CC....',
  '......CC.CC....CC.CC....',
  '......Cc.Cc....Cc.Cc....',
  '......Cc.Cc....Cc.Cc....',
  '.....ddd.ddd..ddd.ddd...',
];


export const ICON_ARMOR = [
  'kkkkkkkkkkkkk', 'kBBBBBBBBBBBk', 'kBBsssssssBBk', 'kBsSSSSSSSsBk', 'kBsSSSySSSsBk', 'kBsSSyyySSsBk', 'kBsSSSySSSsBk',
  'kBBsSSSSSsBBk', 'kBBsSSSSSsBBk', 'kBBBsSSSsBBBk', 'kBBBBsssBBBBk', 'kBBBBBBBBBBBk', 'kkkkkkkkkkkkk',
];
export const ICON_MAGNET = [
  'kkkkkkkkkkkkk', 'kBBBBBBBBBBBk', 'kBBRRRRRRRBBk', 'kBRRRRRRRRRBk', 'kBRRRBBBRRRBk', 'kBRRBBBBBRRBk', 'kBRRBBBBBRRBk',
  'kBRRBBBBBRRBk', 'kBSSBBBBBSSBk', 'kBSSBBBBBSSBk', 'kBBBBBBBBBBBk', 'kBBBBBBBBBBBk', 'kkkkkkkkkkkkk',
];
export const ICON_MAP = [
  'kkkkkkkkkkkkk', 'kBBBBBBBBBBBk', 'kBoooooooooBk', 'kBopppRpRpoBk', 'kBoppppRppoBk', 'kBopppRpRpoBk', 'kBoppwppppoBk',
  'kBopwpppppoBk', 'kBoppwppppoBk', 'kBowppppppoBk', 'kBoooooooooBk', 'kBBBBBBBBBBBk', 'kkkkkkkkkkkkk',
];
export const ICON_JET = [
  'kkkkkkkkkkkkk', 'kBBBBBBBBBBBk', 'kBBBsssssBBBk', 'kBBsSSSSSsBBk', 'kBBsSRRRSsBBk', 'kBBsSSSSSsBBk', 'kBBsSSSSSsBBk',
  'kBBsSSSSSsBBk', 'kBBBssBssBBBk', 'kBBBfyBfyBBBk', 'kBBBByBByBBBk', 'kBBBBBBBBBBBk', 'kkkkkkkkkkkkk',
];
export const ICON_BOOTS = [
  'kkkkkkkkkkkkk', 'kBBBBBBBBBBBk', 'kBBBRRRBBBBBk', 'kBBBRRRBBBBBk', 'kBBBRRRBBBBBk', 'kBBBRRRRRRBBk', 'kBBBRRRRRRRBk',
  'kBBBsssssssBk', 'kBBBBsBsBsBBk', 'kBBBsBsBsBBBk', 'kBBBBsBsBsBBk', 'kBBBBBBBBBBBk', 'kkkkkkkkkkkkk',
];
export const ICON_FULL = [
  'kkkkkkkkkkkkk', 'kBBBBBBBBBBBk', 'kBwwwBBBwwwBk', 'kBwBBBBBBBwBk', 'kBwBBBBBBBwBk', 'kBBBBBBBBBBBk', 'kBBBBBBBBBBBk',
  'kBBBBBBBBBBBk', 'kBwBBBBBBBwBk', 'kBwBBBBBBBwBk', 'kBwwwBBBwwwBk', 'kBBBBBBBBBBBk', 'kkkkkkkkkkkkk',
];
export const ICON_FULL_EXIT = [
  'kkkkkkkkkkkkk', 'kBBBBBBBBBBBk', 'kBBBwBBBwBBBk', 'kBBBwBBBwBBBk', 'kBwwwBBBwwwBk', 'kBBBBBBBBBBBk', 'kBBBBBBBBBBBk',
  'kBBBBBBBBBBBk', 'kBwwwBBBwwwBk', 'kBBBwBBBwBBBk', 'kBBBwBBBwBBBk', 'kBBBBBBBBBBBk', 'kkkkkkkkkkkkk',
];

/** Badge medal: gold when earned, grey while locked. */
export const MEDAL = [
  '.RRb...bRR.', '..RRb.bRR..', '...RRbRR...', '....RbR....', '...YYYYY...', '..YWWYYYy..', '.YWYYWYYYy.',
  '.YYYWWWYYy.', '.YYYYWYYYy.', '.YYYWYWYyy.', '..YYYYYyy..', '...yyyyy...',
];
export const MEDAL_PAL: Palette = { R: '#c62828', b: '#2f6fe0', Y: '#ffd21a', y: '#c98a00', W: '#fff6b0' };
export const MEDAL_LOCKED_PAL: Palette = { R: '#6f6a62', b: '#57534d', Y: '#9a948a', y: '#6f6a62', W: '#b8b2a8' };

/** Rocket backpack worn on Matěj's back. */
export const JETPACK = ['.ss.', 'sSSs', 'sRRs', 'sSSs', 'sSSs', 'sSSs', '.ff.'];
export const JETPACK_PAL: Palette = { s: '#6d7681', S: '#c9d1d9', R: '#c62828', f: '#e0701c' };

/** Golden arrow above a secret entrance (shown with the secret map). */
export const ARROW = ['..YYY..', '..YYY..', '..YYY..', 'YYYYYYY', '.YYYYY.', '..YYY..', '...Y...'];
export const ARROW_PAL: Palette = { Y: '#ffd21a' };
