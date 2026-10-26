import { describe, expect, it } from "vitest";
import { applyGrassDrag, crossedStartFinish, driftAngleDegrees, positiveAngle, TAU } from "./raceMath";

describe("race math", () => {
  it("normalizes negative angles into one lap", () => {
    expect(positiveAngle(-Math.PI)).toBeCloseTo(Math.PI);
    expect(positiveAngle(TAU)).toBeCloseTo(0);
    expect(positiveAngle(TAU + 0.5)).toBeCloseTo(0.5);
  });

  it("counts a forward finish-line crossing", () => {
    expect(crossedStartFinish(TAU - 0.04, 0.03, 45)).toBe(true);
  });

  it("does not count a reverse or stationary finish-line crossing", () => {
    expect(crossedStartFinish(TAU - 0.04, 0.03, -5)).toBe(false);
    expect(crossedStartFinish(TAU - 0.04, 0.03, 0)).toBe(false);
  });

  it("does not invent a lap when no wrap happened", () => {
    expect(crossedStartFinish(1.5, 1.7, 60)).toBe(false);
  });

  it("grass drag slows a car without changing its direction", () => {
    expect(applyGrassDrag(100, 0.5)).toBeGreaterThan(0);
    expect(applyGrassDrag(100, 0.5)).toBeLessThan(100);
    expect(applyGrassDrag(-20, 0.5)).toBeLessThan(0);
    expect(applyGrassDrag(0, 0.5)).toBe(0);
  });

  it("reports a signed drift angle and stays neutral when there is no slip", () => {
    expect(driftAngleDegrees(0, 90)).toBe(0);
    expect(driftAngleDegrees(8, 90)).toBeGreaterThan(0);
    expect(driftAngleDegrees(-8, 90)).toBeLessThan(0);
  });
});
