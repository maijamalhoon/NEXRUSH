import { describe, expect, it, beforeEach } from "vitest";
import { StorageManager } from "./storage";

describe("StorageManager", () => {
  beforeEach(() => {
    StorageManager.clear();
  });

  it("loads default storage when nothing is saved", () => {
    const data = StorageManager.load();
    expect(data.version).toBe(1);
    expect(data.settings.soundVolume).toBe(80);
    expect(data.unlockedCars.length).toBeGreaterThanOrEqual(3);
  });

  it("records best lap time and victories correctly", () => {
    StorageManager.recordRace("neon_metropolis", "apex_gt", 88.5, true);
    let data = StorageManager.load();
    expect(data.totalRaces).toBe(1);
    expect(data.victories).toBe(1);
    expect(data.bestLaps["neon_metropolis_apex_gt"]).toBe(88.5);

    // Slower lap should not overwrite best lap
    StorageManager.recordRace("neon_metropolis", "apex_gt", 94.2, false);
    data = StorageManager.load();
    expect(data.bestLaps["neon_metropolis_apex_gt"]).toBe(88.5);
    expect(data.totalRaces).toBe(2);
    expect(data.victories).toBe(1);

    // Faster lap should overwrite
    StorageManager.recordRace("neon_metropolis", "apex_gt", 82.1, true);
    data = StorageManager.load();
    expect(data.bestLaps["neon_metropolis_apex_gt"]).toBe(82.1);
    expect(data.victories).toBe(2);
  });
});
