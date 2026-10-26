export const TAU = Math.PI * 2;

export function positiveAngle(angle: number): number {
  return ((angle % TAU) + TAU) % TAU;
}

/** True only when the player crosses the start line forwards, not in reverse. */
export function crossedStartFinish(previousProgress: number, currentProgress: number, speedKmh: number): boolean {
  return speedKmh > 0 && previousProgress > TAU - 0.12 && currentProgress < 0.12;
}

/** Grass drag damps speed without ever reversing a car that has stopped. */
export function applyGrassDrag(speedKmh: number, deltaSeconds: number): number {
  return speedKmh * Math.exp(-2.5 * Math.max(0, deltaSeconds));
}

/** Signed slip angle in degrees, with a low-speed guard to avoid noisy readings. */
export function driftAngleDegrees(lateralVelocity: number, speedKmh: number): number {
  const forwardSpeed = Math.max(3, Math.abs(speedKmh) / 3.6);
  return Math.round(Math.atan2(lateralVelocity, forwardSpeed) * 180 / Math.PI);
}
