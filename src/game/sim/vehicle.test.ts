import { describe, expect, it } from "vitest";
import { CARS } from "../../data/cars";
import { createInitialCarSimState, stepVehiclePhysics } from "./vehicle";
import type { InputFrame } from "./types";

describe("Vehicle Physics", () => {
  it("accelerates forward when throttle is pressed", () => {
    const spec = CARS[0];
    let state = createInitialCarSimState("test", "TestCar", true);
    const input: InputFrame = {
      steer: 0,
      throttle: 1.0,
      brake: 0,
      handbrake: false,
      boost: false,
      tick: 1,
    };

    for (let i = 0; i < 60; i++) {
      state = stepVehiclePhysics(state, input, spec);
    }

    expect(state.speedKmh).toBeGreaterThan(25);
    expect(state.position.x).toBeGreaterThan(0);
    expect(state.rpm).toBeGreaterThan(1500);
  });

  it("brakes effectively when moving forward", () => {
    const spec = CARS[0];
    let state = createInitialCarSimState("test", "TestCar", true);
    const accelInput: InputFrame = {
      steer: 0,
      throttle: 1.0,
      brake: 0,
      handbrake: false,
      boost: false,
      tick: 1,
    };

    for (let i = 0; i < 60; i++) {
      state = stepVehiclePhysics(state, accelInput, spec);
    }
    const speedBeforeBraking = state.speedKmh;

    const brakeInput: InputFrame = {
      steer: 0,
      throttle: 0,
      brake: 1.0,
      handbrake: false,
      boost: false,
      tick: 61,
    };
    for (let i = 0; i < 30; i++) {
      state = stepVehiclePhysics(state, brakeInput, spec);
    }

    expect(state.speedKmh).toBeLessThan(speedBeforeBraking);
  });

  it("accumulates Rush meter when drifting at speed", () => {
    const spec = CARS[2]; // Spectre drift car
    let state = createInitialCarSimState("test", "TestCar", true);
    state.rushMeter = 10;

    // First build forward speed
    const accelInput: InputFrame = {
      steer: 0,
      throttle: 1.0,
      brake: 0,
      handbrake: false,
      boost: false,
      tick: 1,
    };
    for (let i = 0; i < 90; i++) {
      state = stepVehiclePhysics(state, accelInput, spec);
    }

    // Now turn hard with handbrake to induce drift
    const driftInput: InputFrame = {
      steer: 0.8,
      throttle: 0.8,
      brake: 0,
      handbrake: true,
      boost: false,
      tick: 91,
    };
    for (let i = 0; i < 30; i++) {
      state = stepVehiclePhysics(state, driftInput, spec);
    }

    expect(Math.abs(state.driftAngle)).toBeGreaterThan(8);
    expect(state.rushMeter).toBeGreaterThan(10);
  });
});
