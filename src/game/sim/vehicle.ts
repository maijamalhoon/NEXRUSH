import type { CarSimState, CarSpec, InputFrame } from "./types";

export const FIXED_TIMESTEP = 1 / 60; // 60 Hz simulation rate
export const IDLE_RPM = 900;
export const MAX_RPM = 7500;
export const SHIFT_UP_RPM = 6800;
export const SHIFT_DOWN_RPM = 3200;

export interface VehiclePhysicsConfig {
  steeringAssist?: boolean;
}

export function createInitialCarSimState(
  id: string,
  name: string,
  isPlayer: boolean,
  x = 0,
  z = 0,
  heading = 0,
  color?: string
): CarSimState {
  return {
    id,
    name,
    isPlayer,
    color,
    position: { x, z },
    velocity: { x: 0, z: 0 },
    heading,
    angularVelocity: 0,
    speedKmh: 0,
    lateralVelocity: 0,
    driftAngle: 0,
    rpm: IDLE_RPM,
    gear: 1,
    rushMeter: 20, // initial starting boost
    isBoosting: false,
    offTrack: false,
    lap: 1,
    lapProgress: 0,
    totalProgress: 0,
    lapTime: 0,
    lastLapTime: 0,
    bestLapTime: 0,
    checkpointIndex: 0,
    finished: false,
    finishTime: 0,
    penaltyTime: 0,
  };
}

/**
 * Pure deterministic vehicle physics step using 2D inertia and tire slip.
 */
export function stepVehiclePhysics(
  state: CarSimState,
  input: InputFrame,
  spec: CarSpec,
  dt: number = FIXED_TIMESTEP,
  config: VehiclePhysicsConfig = { steeringAssist: true }
): CarSimState {
  const next = { ...state, position: { ...state.position }, velocity: { ...state.velocity } };

  // Heading unit vectors in 3D Babylon coordinates (heading 0 = +Z forward, +X right)
  const forwardX = Math.sin(next.heading);
  const forwardZ = Math.cos(next.heading);
  const rightX = Math.cos(next.heading);
  const rightZ = -Math.sin(next.heading);

  // Velocity components in local car coordinates
  const vf = next.velocity.x * forwardX + next.velocity.z * forwardZ; // forward (m/s)
  const vl = next.velocity.x * rightX + next.velocity.z * rightZ; // lateral (m/s)

  // Surface grip multiplier
  const surfaceGrip = next.offTrack ? 0.42 : 1.0;
  const rollingResistance = next.offTrack ? 1.6 : 0.08;

  // Handle RUSH boost
  const wantsBoost = input.boost && next.rushMeter > 0;
  next.isBoosting = wantsBoost;
  if (wantsBoost) {
    next.rushMeter = Math.max(0, next.rushMeter - 30 * dt);
  }

  // Engine Drive Force
  const topSpeedMs = (spec.topSpeedKmh / 3.6) * (wantsBoost ? 1.25 : 1.0);
  const accelFactor = (spec.acceleration / 100) * 12.0 * (wantsBoost ? 1.6 : 1.0);

  // Gears & RPM
  const gearRatio =
    spec.gearRatios[Math.max(0, Math.min(spec.gearRatios.length - 1, next.gear - 1))] || 3.0;
  const wheelRpm = (Math.abs(vf) / (2 * Math.PI * 0.33)) * 60;
  let targetRpm = Math.max(IDLE_RPM, wheelRpm * gearRatio * 3.6);
  if (input.throttle > 0 && Math.abs(vf) < 1.0) {
    targetRpm = Math.max(targetRpm, 3500 * input.throttle);
  }
  next.rpm = Math.min(MAX_RPM, targetRpm);

  // Auto Gear Shift
  if (vf >= 0) {
    if (next.rpm > SHIFT_UP_RPM && next.gear < spec.gearRatios.length) {
      next.gear++;
    } else if (next.rpm < SHIFT_DOWN_RPM && next.gear > 1) {
      next.gear--;
    }
  } else {
    next.gear = 1;
  }

  // Drive acceleration
  let driveAcc = 0;
  if (input.throttle > 0 && vf < topSpeedMs) {
    const torqueCurve = Math.max(0.45, 1.0 - (vf / topSpeedMs) * 0.65);
    driveAcc = input.throttle * accelFactor * torqueCurve * surfaceGrip;
  }

  // Braking & Reverse
  let brakeAcc = 0;
  if (input.brake > 0) {
    if (vf > 0.5) {
      brakeAcc = -input.brake * 14.5 * surfaceGrip;
    } else if (vf < 0.1 && vf > -15.0) {
      driveAcc = -input.brake * 5.0 * surfaceGrip;
    }
  }

  // Handbrake
  if (input.handbrake) {
    brakeAcc = -Math.sign(vf) * Math.min(Math.abs(vf), 8.5 * surfaceGrip);
  }

  // Air drag & rolling resistance
  const dragAcc = -0.0028 * vf * Math.abs(vf) - rollingResistance * vf;
  const totalLongitudinalAcc = driveAcc + brakeAcc + dragAcc;

  // Steering & Yaw Rate
  const speedRatio = Math.min(1.0, Math.abs(vf) / 45);
  const maxSteerAngle = (0.75 - speedRatio * 0.45) * (spec.handling / 80);
  let steerInput = input.steer;

  if (
    config.steeringAssist &&
    Math.abs(next.angularVelocity) > 1.2 &&
    Math.sign(steerInput) !== Math.sign(next.angularVelocity)
  ) {
    steerInput *= 1.15;
  }

  const steerAngle = steerInput * maxSteerAngle;

  // Kinematic turning & drift kick
  const wheelbase = 2.7;
  let targetYawRate = (vf / wheelbase) * Math.sin(steerAngle);

  if (input.handbrake && Math.abs(vf) > 4) {
    targetYawRate += Math.sign(steerAngle || 1) * 2.2 * (spec.driftFactor || 1.0);
  }

  next.angularVelocity += (targetYawRate - next.angularVelocity) * Math.min(1.0, 16 * dt);
  next.heading += next.angularVelocity * dt;

  // Wrap heading to [-PI, PI]
  while (next.heading > Math.PI) next.heading -= Math.PI * 2;
  while (next.heading < -Math.PI) next.heading += Math.PI * 2;

  // Tire Lateral Grip
  const baseTireGrip = (spec.stats.handling / 100) * 14.0 * surfaceGrip;
  const tireGrip = input.handbrake ? baseTireGrip * 0.22 : baseTireGrip;
  const lateralAcc = -vl * tireGrip;

  // Update world velocity using body-frame forces
  // World acceleration: F_long * forward + F_lat * right
  const ax = totalLongitudinalAcc * forwardX + lateralAcc * rightX;
  const az = totalLongitudinalAcc * forwardZ + lateralAcc * rightZ;

  next.velocity.x += ax * dt;
  next.velocity.z += az * dt;

  // Position update
  next.position.x += next.velocity.x * dt;
  next.position.z += next.velocity.z * dt;

  // Re-calculate slip metrics with updated heading and velocity
  const updatedForwardX = Math.sin(next.heading);
  const updatedForwardZ = Math.cos(next.heading);
  const updatedRightX = Math.cos(next.heading);
  const updatedRightZ = -Math.sin(next.heading);

  const newVf = next.velocity.x * updatedForwardX + next.velocity.z * updatedForwardZ;
  const newVl = next.velocity.x * updatedRightX + next.velocity.z * updatedRightZ;

  const forwardThreshold = Math.max(2.0, Math.abs(newVf));
  next.driftAngle = Math.round(Math.atan2(newVl, forwardThreshold) * (180 / Math.PI));
  next.lateralVelocity = newVl;
  next.speedKmh = Math.round(Math.sqrt(next.velocity.x ** 2 + next.velocity.z ** 2) * 3.6);

  // Build Rush meter while drifting cleanly at decent speed
  if (Math.abs(next.driftAngle) > 10 && Math.abs(newVf) > 8 && !next.isBoosting) {
    const rushEarned = (Math.abs(next.driftAngle) / 40) * 16 * dt * (spec.stats.rushRate / 70);
    next.rushMeter = Math.min(100, next.rushMeter + rushEarned);
  }

  return next;
}
