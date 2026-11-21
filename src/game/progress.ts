// Progress and settings are stored only in this browser (localStorage, not cookies).
// GitHub Pages serves all of the owner's projects from one origin, so every key has a prefix.

export interface LevelInfo {
  key: string;
  file: string;
  name: string;
}

export interface SaveData {
  /** Number of unlocked levels (at least 1). */
  unlocked: number;
  /** Best coin count per level key. */
  best: Record<string, number>;
  /** All coins collected in finished levels so far (the wallet for the future shop). */
  totalCoins: number;
  introSeen: boolean;
  muted: boolean;
}

const STORAGE_KEY = 'matejovo-hra:postup:v1';
const DEFAULTS: SaveData = { unlocked: 1, best: {}, totalCoins: 0, introSeen: false, muted: false };

export function loadProgress(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const d = JSON.parse(raw) as Partial<SaveData>;
      return {
        unlocked: Math.max(1, Number(d.unlocked) || 1),
        best: d.best && typeof d.best === 'object' ? d.best : {},
        totalCoins: Math.max(0, Number(d.totalCoins) || 0),
        introSeen: d.introSeen === true,
        muted: d.muted === true,
      };
    }
  } catch {
    // Storage may be unavailable (private mode); play without saving.
  }
  return { ...DEFAULTS, best: {} };
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

/** Records a finished level: unlocks the next one, keeps the best score and adds coins to the wallet. */
export function recordCompletion(levels: LevelInfo[], key: string, coins: number): SaveData {
  const d = loadProgress();
  const idx = levels.findIndex((l) => l.key === key);
  if (idx >= 0) d.unlocked = Math.min(levels.length, Math.max(d.unlocked, idx + 2));
  d.best[key] = Math.max(d.best[key] ?? 0, coins);
  d.totalCoins += coins;
  return save(d);
}
