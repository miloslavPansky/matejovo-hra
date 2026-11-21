// Progress and settings are stored only in this browser (localStorage, not cookies).
// GitHub Pages serves all of the owner's projects from one origin, so every key has a prefix.
// The rules (what a purchase or a finished level changes) live in rules.ts.
import {
  awardBadges, buyBoots, buyItem, completeLevel, normalizeSave, resetSave, wearOutfit,
  type Badge, type BuyResult, type ItemId, type LevelResult, type SaveData,
} from './rules';

export type { SaveData } from './rules';

export interface LevelInfo {
  key: string;
  file: string;
  name: string;
}

const STORAGE_KEY = 'matejovo-hra:postup:v1';

export function loadProgress(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return normalizeSave(JSON.parse(raw));
  } catch {
    // Storage may be unavailable (private mode) or damaged; play without saving.
  }
  return normalizeSave(null);
}

function save(d: SaveData): SaveData {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  } catch {
    // ignore
  }
  return d;
}

export function updateProgress(patch: Partial<SaveData>): SaveData {
  return save({ ...loadProgress(), ...patch });
}

/** Records a finished level and returns the save plus any badges earned. */
export function recordCompletion(levels: LevelInfo[], result: LevelResult): { save: SaveData; earned: Badge[] } {
  const r = awardBadges(completeLevel(loadProgress(), levels.map((l) => l.key), result), result);
  save(r.save);
  return r;
}

export function recordSecret(key: string): void {
  const d = loadProgress();
  if (!d.secrets.includes(key)) save({ ...d, secrets: [...d.secrets, key] });
}

export function useUpItem(id: ItemId): void {
  const d = loadProgress();
  save({ ...d, items: { ...d.items, [id]: false } });
}

export type Purchase = { kind: 'item'; id: ItemId } | { kind: 'boots' } | { kind: 'outfit'; id: string };

/** Buys in the shop. On success the save is stored and new badges (e.g. "Zákazník") are returned. */
export function purchase(p: Purchase): (BuyResult & { earned: Badge[] }) {
  const d = loadProgress();
  const r = p.kind === 'item' ? buyItem(d, p.id) : p.kind === 'boots' ? buyBoots(d) : wearOutfit(d, p.id);
  if (!r.ok) return { ...r, earned: [] };
  const a = awardBadges(r.save);
  save(a.save);
  return { ok: true, save: a.save, earned: a.earned };
}

export function resetProgress(): SaveData {
  return save(resetSave(loadProgress()));
}
