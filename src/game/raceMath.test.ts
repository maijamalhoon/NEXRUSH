import { describe, expect, it } from "vitest";
import { applyGrassDrag, countdownNumber, crossedStartFinish, driftAngleDegrees, getRacePhase, positiveAngle, TAU, updateBestLap } from "./raceMath";

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

describe("race session timing", () => {
  it("shows a three-second countdown, then GO, then racing", () => {
    expect(countdownNumber(3)).toBe(3);
    expect(countdownNumber(2.01)).toBe(3);
    expect(countdownNumber(1.99)).toBe(2);
    expect(countdownNumber(0)).toBe(1);
    expect(getRacePhase(false, 0)).toBe("COUNTDOWN");
    expect(getRacePhase(true, 0.2)).toBe("GO");
    expect(getRacePhase(true, 0)).toBe("RACING");
  });

  it("keeps the fastest valid completed lap as the best lap", () => {
    expect(updateBestLap(92.4, 0)).toBe(92.4);
    expect(updateBestLap(95.2, 92.4)).toBe(92.4);
    expect(updateBestLap(88.7, 92.4)).toBe(88.7);
    expect(updateBestLap(0, 92.4)).toBe(92.4);
    expect(updateBestLap(Number.NaN, 92.4)).toBe(92.4);
  });
});
