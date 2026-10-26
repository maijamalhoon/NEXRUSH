import type { SettingsState } from "../ui/screens/SettingsModal";

export interface StorageData {
  version: number;
  settings: SettingsState;
  bestLaps: Record<string, number>; // key: `${trackId}_${carId}`
  unlockedCars: string[];
  unlockedTracks: string[];
  totalRaces: number;
  victories: number;
}

const STORAGE_KEY = "nexrush_saved_profile_v1";

const DEFAULT_STORAGE: StorageData = {
  version: 1,
  settings: {
    quality: "auto",
    soundVolume: 80,
    musicVolume: 60,
    steeringAssist: true,
    steeringSensitivity: 1.0,
    showFps: false,
  },
  bestLaps: {},
  unlockedCars: ["apex_gt", "spectre", "titan_rs", "venom_r", "mirage_e"],
  unlockedTracks: ["neon_metropolis", "sunset_coast", "red_rock"],
  totalRaces: 0,
  victories: 0,
};

// Memory fallback for headless Node/test environments
const memoryStorage = new Map<string, string>();

export class StorageManager {
  private static getStorage():
    | Storage
    | {
        getItem: (k: string) => string | null;
        setItem: (k: string, v: string) => void;
        clear: () => void;
      } {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage;
    }
    return {
      getItem: (k: string) => memoryStorage.get(k) ?? null,
      setItem: (k: string, v: string) => memoryStorage.set(k, v),
      clear: () => memoryStorage.clear(),
    };
  }

  public static load(): StorageData {
    try {
      const storage = this.getStorage();
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_STORAGE;

      const parsed = JSON.parse(raw) as Partial<StorageData>;
      return {
        ...DEFAULT_STORAGE,
        ...parsed,
        settings: { ...DEFAULT_STORAGE.settings, ...(parsed.settings || {}) },
        bestLaps: { ...DEFAULT_STORAGE.bestLaps, ...(parsed.bestLaps || {}) },
      };
    } catch {
      return DEFAULT_STORAGE;
    }
  }

  public static save(data: StorageData): void {
    try {
      const storage = this.getStorage();
      storage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Storage full or quota exceeded
    }
  }

  public static clear(): void {
    try {
      this.getStorage().clear();
    } catch {
      // Ignore
    }
  }

  public static recordRace(
    trackId: string,
    carId: string,
    bestLap: number,
    isWinner: boolean
  ): StorageData {
    const data = this.load();
    data.totalRaces++;
    if (isWinner) data.victories++;

    const key = `${trackId}_${carId}`;
    const prevBest = data.bestLaps[key];
    if (bestLap > 0 && (!prevBest || bestLap < prevBest)) {
      data.bestLaps[key] = bestLap;
    }

    this.save(data);
    return data;
  }
}
