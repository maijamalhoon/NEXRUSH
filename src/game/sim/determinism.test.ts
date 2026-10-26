import { describe, expect, it } from "vitest";
import { LocalSession } from "../net/LocalSession";
import type { InputFrame } from "./types";

describe("Simulation Determinism", () => {
  it("produces byte-for-byte identical state given the same seed and input sequence", async () => {
    const config = {
      trackId: "neon_metropolis",
      laps: 3,
      difficulty: "normal" as const,
      playerCarId: "apex_gt",
      opponentsCount: 3,
      seed: 987654,
    };

    const sessionA = new LocalSession(config);
    const sessionB = new LocalSession(config);

    await sessionA.init();
    await sessionB.init();

    // Generate a fixed pseudo-random series of 120 input frames (steering, braking, throttle)
    const frames: InputFrame[] = [];
    for (let i = 0; i < 180; i++) {
      frames.push({
        tick: i,
        throttle: i > 20 ? 1.0 : 0.0,
        brake: i > 140 && i < 160 ? 0.7 : 0.0,
        steer: Math.sin(i * 0.08) * 0.5,
        handbrake: i > 150 && i < 155,
        boost: i > 80 && i < 110,
      });
    }

    // Step both sessions independently
    for (let i = 0; i < frames.length; i++) {
      sessionA.step(frames[i]);
      sessionB.step(frames[i]);
    }

    const stateA = sessionA.getState();
    const stateB = sessionB.getState();

    // Verify player car state is 100% identical
    const playerA = stateA.cars["player"];
    const playerB = stateB.cars["player"];

    expect(playerA.position.x).toBe(playerB.position.x);
    expect(playerA.position.z).toBe(playerB.position.z);
    expect(playerA.heading).toBe(playerB.heading);
    expect(playerA.speedKmh).toBe(playerB.speedKmh);
    expect(playerA.rpm).toBe(playerB.rpm);
    expect(playerA.driftAngle).toBe(playerB.driftAngle);
    expect(playerA.rushMeter).toBe(playerB.rushMeter);

    // Verify bot car positions match
    expect(stateA.cars["bot_1"].position.x).toBe(stateB.cars["bot_1"].position.x);
    expect(stateA.cars["bot_2"].position.z).toBe(stateB.cars["bot_2"].position.z);

    // Verify full serialized state matches exactly
    expect(sessionA.sim.serialize()).toBe(sessionB.sim.serialize());
  });
});
