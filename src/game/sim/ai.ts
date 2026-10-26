import type { DifficultyConfig } from "../../data/difficulty";
import type { CarSimState, CarSpec, InputFrame } from "./types";
import type { TrackSpline } from "./track";
import { SeededRng } from "./rng";

export interface BotDriver {
  id: string;
  name: string;
  country: string;
  color: string;
  carId: string;
  racingLineOffset: number; // ideal lateral offset (-3m to +3m from center)
  rng: SeededRng;
}

export function computeBotInput(
  bot: BotDriver,
  state: CarSimState,
  spec: CarSpec,
  track: TrackSpline,
  difficulty: DifficultyConfig,
  allCars: CarSimState[],
  tick: number
): InputFrame {
  // Find current position on track
  const info = track.findNearest(state.position.x, state.position.z, state.lapProgress);

  // Lookahead distance scales with speed (approx 0.8s ahead)
  const currentSpeedMs = Math.max(3, state.speedKmh / 3.6);
  const lookaheadDist = Math.max(12, currentSpeedMs * 0.75);
  const lookaheadProgress = (info.progress + lookaheadDist / track.totalLength) % 1;

  const targetSample = track.getAtProgress(lookaheadProgress);

  // Racing line target point with lateral offset
  let targetOffset = bot.racingLineOffset;

  // Collision avoidance / overtaking: check if there's a car right ahead
  for (const other of allCars) {
    if (other.id === bot.id) continue;
    const dx = other.position.x - state.position.x;
    const dz = other.position.z - state.position.z;
    const distSq = dx * dx + dz * dz;

    if (distSq < 15 * 15) {
      // Car is close: calculate if it is ahead in our heading
      const forwardX = Math.cos(state.heading);
      const forwardZ = Math.sin(state.heading);
      const dot = dx * forwardX + dz * forwardZ;

      if (dot > 0 && dot < 14) {
        // Car is directly ahead: dodge to opposite side
        const rightX = -Math.sin(state.heading);
        const rightZ = Math.cos(state.heading);
        const latDot = dx * rightX + dz * rightZ;
        targetOffset = latDot > 0 ? -2.8 : 2.8;
      }
    }
  }

  const targetX = targetSample.position.x + targetSample.normal.x * targetOffset;
  const targetZ = targetSample.position.z + targetSample.normal.z * targetOffset;

  // Steering angle towards target
  const toTargetX = targetX - state.position.x;
  const toTargetZ = targetZ - state.position.z;
  const desiredHeading = Math.atan2(toTargetZ, toTargetX);

  let angleDiff = desiredHeading - state.heading;
  while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
  while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

  const steer = Math.max(-1.0, Math.min(1.0, angleDiff * 2.8));

  // Corner curvature analysis for braking point
  const sampleFar = track.getAtProgress((lookaheadProgress + 0.03) % 1);
  const curvature = Math.abs(
    targetSample.tangent.x * sampleFar.tangent.z - targetSample.tangent.z * sampleFar.tangent.x
  );

  // Target corner speed (m/s)
  const maxCornerSpeedKmh = Math.max(
    55,
    spec.topSpeedKmh * (1.0 - curvature * 3.5) * difficulty.corneringGrip
  );

  let throttle: number;
  let brake: number;

  if (state.speedKmh < maxCornerSpeedKmh * difficulty.speedScale) {
    throttle = 1.0;
    brake = 0.0;
  } else if (state.speedKmh > maxCornerSpeedKmh * 1.15) {
    throttle = 0.0;
    brake = Math.min(1.0, (state.speedKmh - maxCornerSpeedKmh) / 25);
  } else {
    throttle = 0.4;
    brake = 0.0;
  }

  // AI boost usage: use boost on straights when curvature is low and meter is high
  const boost = curvature < 0.05 && state.rushMeter > 40 && Math.abs(steer) < 0.2;

  return {
    steer,
    throttle,
    brake,
    handbrake: false,
    boost,
    tick,
  };
}
