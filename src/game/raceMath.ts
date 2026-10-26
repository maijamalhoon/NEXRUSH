export const TAU = Math.PI * 2;
export const TOTAL_LAPS = 3;

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

export type RacePhase = "COUNTDOWN" | "GO" | "RACING" | "FINISHED";

/** Converts race timers into a stable HUD phase. */
export function getRacePhase(raceStarted: boolean, goFlashRemaining: number, raceFinished = false): RacePhase {
  if (!raceStarted) return "COUNTDOWN";
  if (raceFinished) return "FINISHED";
  return goFlashRemaining > 0 ? "GO" : "RACING";
}

/** The player finishes once the current numbered lap is completed. */
export function isFinalLap(currentLap: number, totalLaps = TOTAL_LAPS): boolean {
  return totalLaps > 0 && currentLap >= totalLaps;
}

/** Converts remaining countdown seconds to the visible 3, 2, 1 sequence. */
export function countdownNumber(remainingSeconds: number): number {
  return Math.max(1, Math.ceil(Math.max(0, remainingSeconds)));
}

/** Records a completed lap without letting a slower lap replace the best. */
export function updateBestLap(lapSeconds: number, bestSeconds: number): number {
  if (!Number.isFinite(lapSeconds) || lapSeconds <= 0) return bestSeconds;
  if (!Number.isFinite(bestSeconds) || bestSeconds <= 0 || lapSeconds < bestSeconds) return lapSeconds;
  return bestSeconds;
}
