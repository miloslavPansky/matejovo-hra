// Pure game rules: the save format, shop catalogue, prices and badges. No Phaser and no storage,
// so the module runs unchanged in Node tests (tests/rules.test.mjs).

export type ItemId = 'jetpack' | 'armor' | 'magnet' | 'map';
export type OutfitPart = 'cap' | 'shirt';

export interface SaveData {
  /** Number of unlocked levels (at least 1). */
  unlocked: number;
  /** Best coin count per finished level key (a key here means the level was finished). */
  best: Record<string, number>;
  /** Coins the player has now (earned minus spent). */
  wallet: number;
  /** All coins ever earned in finished levels. */
  earned: number;
  /** One-level items bought and not used up yet. */
  items: Record<ItemId, boolean>;
  /** Spring boots level 0–3 (permanent). */
  boots: number;
  /** Owned outfit colours and the ones Matěj wears. */
  outfits: string[];
  cap: string;
  shirt: string;
  badges: string[];
  /** Level keys whose secret room was found. */
  secrets: string[];
  stomps: { scorpion: number; plant: number };
  introSeen: boolean;
  muted: boolean;
}

export interface ShopItem {
  id: ItemId;
  name: string;
  info: string;
  price: number;
}

export const ITEMS: readonly ShopItem[] = [
  { id: 'jetpack', name: 'Raketový batoh', info: 'Let 3 s, Shift', price: 60 },
  { id: 'armor', name: 'Brnění', info: 'Vydrží 1 zásah', price: 40 },
  { id: 'magnet', name: 'Magnet', info: 'Přitahuje mince', price: 30 },
  { id: 'map', name: 'Mapa tajemství', info: 'Ukáže tajný vchod', price: 20 },
];

export const BOOTS = { name: 'Pružinové boty', info: 'Skok výš natrvalo', prices: [150, 300, 500], jumpBonus: 15 } as const;

export interface Outfit {
  id: string;
  part: OutfitPart;
  name: string;
  /** Main colour and its shade (the sprite palette letters R/r for the cap, B/b for the shirt). */
  colors: [string, string];
  price: number;
}

export const OUTFITS: readonly Outfit[] = [
  { id: 'cap-red', part: 'cap', name: 'červená', colors: ['#c62828', '#8e1b1b'], price: 0 },
  { id: 'cap-blue', part: 'cap', name: 'modrá', colors: ['#2f6fe0', '#1f4fb0'], price: 60 },
  { id: 'cap-green', part: 'cap', name: 'zelená', colors: ['#3f9b2f', '#2d7421'], price: 60 },
  { id: 'cap-yellow', part: 'cap', name: 'žlutá', colors: ['#f2c230', '#c9952a'], price: 60 },
  { id: 'cap-purple', part: 'cap', name: 'fialová', colors: ['#8a4fd0', '#5e3196'], price: 60 },
  { id: 'shirt-blue', part: 'shirt', name: 'modré', colors: ['#2f6fe0', '#1f4fb0'], price: 0 },
  { id: 'shirt-red', part: 'shirt', name: 'červené', colors: ['#d8432f', '#a02a1c'], price: 60 },
  { id: 'shirt-green', part: 'shirt', name: 'zelené', colors: ['#3f9b2f', '#2d7421'], price: 60 },
  { id: 'shirt-orange', part: 'shirt', name: 'oranžové', colors: ['#f08a24', '#b8601a'], price: 60 },
  { id: 'shirt-white', part: 'shirt', name: 'bílé', colors: ['#f4f1e6', '#c9c3b0'], price: 60 },
];

export const DEFAULT_CAP = 'cap-red';
export const DEFAULT_SHIRT = 'shirt-blue';
/** Each level of world 1 has one secret room. */
export const SECRET_TOTAL = 10;

export function defaultSave(): SaveData {
  return {
    unlocked: 1, best: {}, wallet: 0, earned: 0,
    items: { jetpack: false, armor: false, magnet: false, map: false },
    boots: 0, outfits: [DEFAULT_CAP, DEFAULT_SHIRT], cap: DEFAULT_CAP, shirt: DEFAULT_SHIRT,
    badges: [], secrets: [], stomps: { scorpion: 0, plant: 0 }, introSeen: false, muted: false,
  };
}

const num = (v: unknown, min = 0) => Math.max(min, Math.floor(Number(v)) || 0);
const strings = (v: unknown) => (Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : []);

/** Turns whatever is in storage (older versions, damaged data) into a valid save. */
export function normalizeSave(raw: unknown): SaveData {
  const d = defaultSave();
  if (!raw || typeof raw !== 'object') return d;
  const r = raw as Record<string, unknown>;
  // Versions up to 0.4 had only totalCoins: it was both the wallet and everything earned.
  const legacy = num(r.totalCoins);
  const items = (r.items ?? {}) as Record<string, unknown>;
  const stomps = (r.stomps ?? {}) as Record<string, unknown>;
  const outfits = [...new Set([DEFAULT_CAP, DEFAULT_SHIRT, ...strings(r.outfits).filter((id) => OUTFITS.some((o) => o.id === id))])];
  const wear = (v: unknown, part: OutfitPart, fallback: string) =>
    typeof v === 'string' && outfits.includes(v) && v.startsWith(part) ? v : fallback;
  return {
    unlocked: num(r.unlocked, 1),
    best: r.best && typeof r.best === 'object' ? { ...(r.best as Record<string, number>) } : {},
    wallet: r.wallet === undefined ? legacy : num(r.wallet),
    earned: r.earned === undefined ? legacy : num(r.earned),
    items: { jetpack: items.jetpack === true, armor: items.armor === true, magnet: items.magnet === true, map: items.map === true },
    boots: Math.min(BOOTS.prices.length, num(r.boots)),
    outfits,
    cap: wear(r.cap, 'cap', DEFAULT_CAP),
    shirt: wear(r.shirt, 'shirt', DEFAULT_SHIRT),
    badges: [...new Set(strings(r.badges))],
    secrets: [...new Set(strings(r.secrets))],
    stomps: { scorpion: num(stomps.scorpion), plant: num(stomps.plant) },
    introSeen: r.introSeen === true,
    muted: r.muted === true,
  };
}

/** Restart of the whole game: everything goes, only the sound setting and the seen intro stay. */
export function resetSave(d: SaveData): SaveData {
  return { ...defaultSave(), introSeen: d.introSeen, muted: d.muted };
}

export function jumpVelocity(base: number, boots: number): number {
  return base + boots * BOOTS.jumpBonus;
}

export function outfitColors(id: string): [string, string] {
  return (OUTFITS.find((o) => o.id === id) ?? OUTFITS[0]).colors;
}

// ---------- shop ----------

export type BuyResult = { ok: true; save: SaveData } | { ok: false; reason: 'owned' | 'coins' | 'max' | 'unknown' };

function pay(d: SaveData, price: number, change: (n: SaveData) => void): BuyResult {
  if (d.wallet < price) return { ok: false, reason: 'coins' };
  const n = normalizeSave(d);
  n.wallet -= price;
  change(n);
  return { ok: true, save: n };
}

export function buyItem(d: SaveData, id: ItemId): BuyResult {
  const item = ITEMS.find((i) => i.id === id);
  if (!item) return { ok: false, reason: 'unknown' };
  if (d.items[id]) return { ok: false, reason: 'owned' };
  return pay(d, item.price, (n) => { n.items[id] = true; });
}

export function nextBootsPrice(d: SaveData): number | null {
  return BOOTS.prices[d.boots] ?? null;
}

export function buyBoots(d: SaveData): BuyResult {
  const price = nextBootsPrice(d);
  if (price === null) return { ok: false, reason: 'max' };
  return pay(d, price, (n) => { n.boots++; });
}

/** Buys the outfit if needed and puts it on. Wearing an owned outfit is free. */
export function wearOutfit(d: SaveData, id: string): BuyResult {
  const o = OUTFITS.find((x) => x.id === id);
  if (!o) return { ok: false, reason: 'unknown' };
  const owned = d.outfits.includes(id);
  return pay(d, owned ? 0 : o.price, (n) => {
    if (!owned) n.outfits.push(id);
    n[o.part] = id;
  });
}

// ---------- levels ----------

export interface LevelResult {
  key: string;
  coins: number;
  /** All coins in the level, secret room included. */
  coinTotal: number;
  /** Hits taken and falls into gaps (armor-absorbed hits count too). */
  hits: number;
  stomps: { scorpion: number; plant: number };
}

/** A finished level: unlock the next one, best score, coins, stomps; one-level items are used up. */
export function completeLevel(d: SaveData, levelKeys: readonly string[], r: LevelResult): SaveData {
  const n = normalizeSave(d);
  const idx = levelKeys.indexOf(r.key);
  if (idx >= 0) n.unlocked = Math.min(levelKeys.length, Math.max(n.unlocked, idx + 2));
  n.best[r.key] = Math.max(n.best[r.key] ?? 0, r.coins);
  n.wallet += r.coins;
  n.earned += r.coins;
  n.stomps.scorpion += r.stomps.scorpion;
  n.stomps.plant += r.stomps.plant;
  n.items = { jetpack: false, armor: false, magnet: false, map: false };
  return n;
}

// ---------- badges ----------

export interface Badge {
  id: string;
  name: string;
  info: string;
}

interface BadgeRule extends Badge {
  /** Checked against the save; `level` is set right after a level was finished. */
  test: (d: SaveData, level?: LevelResult) => boolean;
}

const worldDone = (d: SaveData, world: number, count: number) =>
  Object.keys(d.best).filter((k) => k.startsWith(`level-${world}-`)).length >= count;

const RULES: readonly BadgeRule[] = [
  { id: 'first-level', name: 'První krok', info: 'Dokonči první level.', test: (d) => Object.keys(d.best).length > 0 },
  { id: 'no-hit', name: 'Bez zásahu', info: 'Dokonči level bez jediného zásahu.', test: (_d, l) => !!l && l.hits === 0 },
  { id: 'all-coins', name: 'Sběratel', info: 'Seber v levelu všechny mince i v tajné místnosti.', test: (_d, l) => !!l && l.coinTotal > 0 && l.coins >= l.coinTotal },
  { id: 'secret-1', name: 'Průzkumník', info: 'Najdi tajnou místnost.', test: (d) => d.secrets.length >= 1 },
  { id: 'secret-5', name: 'Lovec tajů', info: 'Najdi 5 tajných místností.', test: (d) => d.secrets.length >= 5 },
  { id: 'secret-all', name: 'Mistr tajů', info: `Najdi všech ${SECRET_TOTAL} tajných místností.`, test: (d) => d.secrets.length >= SECRET_TOTAL },
  { id: 'coins-500', name: 'Kapsička', info: 'Nasbírej celkem 500 mincí.', test: (d) => d.earned >= 500 },
  { id: 'coins-1000', name: 'Pokladnice', info: 'Nasbírej celkem 1000 mincí.', test: (d) => d.earned >= 1000 },
  { id: 'coins-2000', name: 'Boháč', info: 'Nasbírej celkem 2000 mincí.', test: (d) => d.earned >= 2000 },
  { id: 'scorpions', name: 'Krotitel', info: 'Skoč na 25 štírů.', test: (d) => d.stomps.scorpion >= 25 },
  { id: 'plants', name: 'Zahradník', info: 'Skoč na 25 masožravých rostlin.', test: (d) => d.stomps.plant >= 25 },
  { id: 'customer', name: 'Zákazník', info: 'Kup něco u velblouda Bedřicha.', test: (d) => d.boots > 0 || d.outfits.length > 2 || Object.values(d.items).some(Boolean) },
  { id: 'outfit', name: 'Fešák', info: 'Kup si novou kšiltovku nebo tričko.', test: (d) => d.outfits.length > 2 },
  { id: 'boots-max', name: 'Skokan', info: 'Kup pružinové boty úrovně III.', test: (d) => d.boots >= BOOTS.prices.length },
  { id: 'world-1', name: 'Pán dun', info: 'Dokonči všech 10 levelů kraje Zlaté duny.', test: (d) => worldDone(d, 1, 10) },
];

export const BADGES: readonly Badge[] = RULES.map(({ id, name, info }) => ({ id, name, info }));

/** Adds every badge whose condition is met now. Returns the new save and the newly earned badges. */
export function awardBadges(d: SaveData, level?: LevelResult): { save: SaveData; earned: Badge[] } {
  const earned = RULES.filter((b) => !d.badges.includes(b.id) && b.test(d, level));
  if (!earned.length) return { save: d, earned: [] };
  return { save: { ...d, badges: [...d.badges, ...earned.map((b) => b.id)] }, earned: earned.map(({ id, name, info }) => ({ id, name, info })) };
}

/** Short Czech news about new badges: "Nový odznak: Fešák!", "3 nové odznaky!", "5 nových odznaků!" */
export function badgeNews(b: readonly Badge[]): string {
  if (b.length === 1) return `Nový odznak: ${b[0].name}!`;
  return b.length < 5 ? `${b.length} nové odznaky!` : `${b.length} nových odznaků!`;
}
