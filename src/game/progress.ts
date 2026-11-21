// Progress is stored only in this browser (localStorage); no server is involved.

export interface LevelInfo {
  key: string;
  file: string;
  name: string;
}

interface SaveData {
  /** Number of unlocked levels (at least 1). */
  unlocked: number;
  /** Best coin count per level key. */
  best: Record<string, number>;
}

const STORAGE_KEY = 'matejovo-hra:postup:v1';

export function loadProgress(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const d = JSON.parse(raw) as Partial<SaveData>;
      return { unlocked: Math.max(1, Number(d.unlocked) || 1), best: d.best && typeof d.best === 'object' ? d.best : {} };
    }
  } catch {
    // Storage may be unavailable (private mode); play without saving.
  }
  return { unlocked: 1, best: {} };
}

/** Records a finished level and unlocks the next one. Returns the updated data. */
export function recordCompletion(levels: LevelInfo[], key: string, coins: number): SaveData {
  const d = loadProgress();
  const idx = levels.findIndex((l) => l.key === key);
  if (idx >= 0) d.unlocked = Math.min(levels.length, Math.max(d.unlocked, idx + 2));
  d.best[key] = Math.max(d.best[key] ?? 0, coins);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  } catch {
    // ignore
  }
  return d;
}
