import type { CarSimState } from "./types";
import type { TrackSpline } from "./track";

export const CAR_RADIUS = 1.6; // collision circle radius in meters
export const CAR_MASS = 1300;

export interface CollisionEvent {
  carA: string;
  carB: string;
  intensity: number; // 0 to 1
  point: { x: number; z: number };
}

/**
 * Resolves car-to-car collisions with elastic impulse and position separation.
 */
export function resolveCarCollisions(
  cars: CarSimState[],
  onCollision?: (event: CollisionEvent) => void
): void {
  const n = cars.length;
  const minDist = CAR_RADIUS * 2;
  const minDistSq = minDist * minDist;

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = cars[i];
      const b = cars[j];

      const dx = b.position.x - a.position.x;
      const dz = b.position.z - a.position.z;
      const distSq = dx * dx + dz * dz;

      if (distSq < minDistSq && distSq > 0.0001) {
        const dist = Math.sqrt(distSq);
        const nx = dx / dist;
        const nz = dz / dist;

        // Position separation
        const overlap = minDist - dist;
        const sepX = nx * overlap * 0.5;
        const sepZ = nz * overlap * 0.5;

        a.position.x -= sepX;
        a.position.z -= sepZ;
        b.position.x += sepX;
        b.position.z += sepZ;

        // Relative velocity along collision normal
        const rvx = b.velocity.x - a.velocity.x;
        const rvz = b.velocity.z - a.velocity.z;
        const velAlongNormal = rvx * nx + rvz * nz;

        // Only resolve if velocities are separating
        if (velAlongNormal < 0) {
          const restitution = 0.35; // bounce factor (motorsport bumper contact)
          const impulseMag = -(1 + restitution) * velAlongNormal * 0.5;

          a.velocity.x -= impulseMag * nx;
          a.velocity.z -= impulseMag * nz;
          b.velocity.x += impulseMag * nx;
          b.velocity.z += impulseMag * nz;

          if (onCollision) {
            onCollision({
              carA: a.id,
              carB: b.id,
              intensity: Math.min(1.0, Math.abs(velAlongNormal) / 25),
              point: {
                x: a.position.x + nx * CAR_RADIUS,
                z: a.position.z + nz * CAR_RADIUS,
              },
            });
          }
        }
      }
    }
  }
}

/**
 * Keeps cars inside track barrier envelope.
 * Returns true if a barrier hit occurred.
 */
export function resolveTrackBarriers(car: CarSimState, track: TrackSpline): boolean {
  const info = track.findNearest(car.position.x, car.position.z, car.lapProgress);
  car.offTrack = info.isOffTrack;

  // Maximum outer barrier limit (track width / 2 + 3m run-off)
  const maxBarrierDist = track.defaultWidth * 0.5 + 3.2;

  if (Math.abs(info.signedDistance) > maxBarrierDist) {
    const pushBackDist = Math.abs(info.signedDistance) - maxBarrierDist;
    const sign = Math.sign(info.signedDistance);

    // Reposition car inside boundary
    const sample = track.getAtProgress(info.progress);
    car.position.x -= sample.normal.x * sign * pushBackDist;
    car.position.z -= sample.normal.z * sign * pushBackDist;

    // Dampen normal velocity & bounce
    const vn = car.velocity.x * sample.normal.x + car.velocity.z * sample.normal.z;
    if (vn * sign > 0) {
      car.velocity.x -= 1.35 * vn * sample.normal.x;
      car.velocity.z -= 1.35 * vn * sample.normal.z;
    }

    return true;
  }

  return false;
}
