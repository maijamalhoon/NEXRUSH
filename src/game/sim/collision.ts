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

export interface TakedownEvent {
  victimId: string;
  victimName: string;
  attackerId: string;
  attackerName: string;
  isPlayerAttacker: boolean;
  isPlayerVictim: boolean;
}

/**
 * Resolves car-to-car collisions with elastic impulse, vehicular combat damage, and takedowns.
 */
export function resolveCarCollisions(
  cars: CarSimState[],
  onCollision?: (event: CollisionEvent) => void,
  onTakedown?: (event: TakedownEvent) => void
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

        // Only resolve if velocities are closing towards each other
        if (velAlongNormal < 0) {
          const restitution = 0.40;
          const impulseMag = -(1 + restitution) * velAlongNormal * 0.5;

          a.velocity.x -= impulseMag * nx;
          a.velocity.z -= impulseMag * nz;
          b.velocity.x += impulseMag * nx;
          b.velocity.z += impulseMag * nz;

          // Combat Damage Calculation
          const relSpeed = Math.abs(velAlongNormal);
          if (relSpeed > 2.5) {
            let dmgA = (relSpeed - 2.5) * 4.5;
            let dmgB = (relSpeed - 2.5) * 4.5;

            // Nitro Ram multiplier
            if (a.isBoosting && !b.isBoosting) {
              dmgB *= 2.4;
              dmgA *= 0.3; // Attacker has ramming shield
            } else if (b.isBoosting && !a.isBoosting) {
              dmgA *= 2.4;
              dmgB *= 0.3;
            }

            if (!a.isWrecked) a.health = Math.max(0, a.health - dmgA);
            if (!b.isWrecked) b.health = Math.max(0, b.health - dmgB);

            // Check for Takedown on car B
            if (b.health <= 0 && !b.isWrecked) {
              b.isWrecked = true;
              b.wreckTimer = 4.0;
              b.angularVelocity += (nx > 0 ? 6.5 : -6.5);
              b.velocity.x += nx * 12;
              b.velocity.z += nz * 12;
              if (onTakedown) {
                onTakedown({
                  victimId: b.id,
                  victimName: b.name,
                  attackerId: a.id,
                  attackerName: a.name,
                  isPlayerAttacker: a.isPlayer,
                  isPlayerVictim: b.isPlayer,
                });
              }
              if (a.isPlayer) {
                a.takedowns++;
                a.rushMeter = 100; // 100% full Nitro refill reward!
              }
            }

            // Check for Takedown on car A
            if (a.health <= 0 && !a.isWrecked) {
              a.isWrecked = true;
              a.wreckTimer = 4.0;
              a.angularVelocity += (nx > 0 ? -6.5 : 6.5);
              a.velocity.x -= nx * 12;
              a.velocity.z -= nz * 12;
              if (onTakedown) {
                onTakedown({
                  victimId: a.id,
                  victimName: a.name,
                  attackerId: b.id,
                  attackerName: b.name,
                  isPlayerAttacker: b.isPlayer,
                  isPlayerVictim: a.isPlayer,
                });
              }
              if (b.isPlayer) {
                b.takedowns++;
                b.rushMeter = 100;
              }
            }
          }

          if (onCollision) {
            onCollision({
              carA: a.id,
              carB: b.id,
              intensity: Math.min(1.0, Math.abs(velAlongNormal) / 22),
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
 * Keeps cars inside track barrier envelope and handles high-speed wall damage.
 */
export function resolveTrackBarriers(car: CarSimState, track: TrackSpline): boolean {
  const info = track.findNearest(car.position.x, car.position.z, car.lapProgress);
  car.offTrack = info.isOffTrack;

  // Maximum outer barrier limit (track width / 2 + 3.2m run-off)
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

      // Barrier impact damage if high speed
      if (Math.abs(vn) > 10 && !car.isWrecked) {
        car.health = Math.max(0, car.health - (Math.abs(vn) - 10) * 3.5);
        if (car.health <= 0) {
          car.isWrecked = true;
          car.wreckTimer = 3.5;
        }
      }
    }

    return true;
  }

  return false;
}
