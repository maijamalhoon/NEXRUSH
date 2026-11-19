import { CARS } from "../../data/cars";
import type { CarSimState, CarSpec, InputFrame, RaceConfig, RaceSimState } from "./types";
import { FIXED_TIMESTEP, stepVehiclePhysics } from "./vehicle";
import { TrackSpline } from "./track";
import { resolveCarCollisions, resolveTrackBarriers } from "./collision";

export class RaceSimulation {
  public state: RaceSimState;
  public readonly track: TrackSpline;
  public readonly carSpecs: Map<string, CarSpec> = new Map();
  private prevLapProgress: Map<string, number> = new Map();
  private nextCheckpoint: Map<string, number> = new Map();

  constructor(track: TrackSpline, config: RaceConfig) {
    this.track = track;
    this.state = {
      tick: 0,
      time: 0,
      phase: "COUNTDOWN",
      countdownRemaining: 3.0,
      cars: {},
      standings: [],
      lapsTotal: config.laps || 3,
    };
  }

  public addCar(carState: CarSimState, spec: CarSpec): void {
    this.state.cars[carState.id] = carState;
    this.carSpecs.set(carState.id, spec);
    const startingProgress = this.track.findNearest(carState.position.x, carState.position.z).progress;
    carState.lapProgress = startingProgress;
    carState.totalProgress = startingProgress;
    this.prevLapProgress.set(carState.id, startingProgress);
    // Grid slots start just before the line; do not count that crossing as a lap.
    this.nextCheckpoint.set(carState.id, 1);
    carState.checkpointIndex = 0;
    if (!this.state.standings.includes(carState.id)) {
      this.state.standings.push(carState.id);
    }
  }

  /**
   * Deterministic 60Hz tick of the entire race simulation.
   */
  public step(inputs: Record<string, InputFrame>, dt: number = FIXED_TIMESTEP): RaceSimState {
    this.state.tick++;
    this.state.time += dt;

    // Phase management
    if (this.state.phase === "COUNTDOWN") {
      this.state.countdownRemaining -= dt;
      if (this.state.countdownRemaining <= 0) {
        this.state.phase = "GO";
      }
    } else if (this.state.phase === "GO") {
      this.state.countdownRemaining -= dt;
      if (this.state.countdownRemaining <= -0.6) {
        this.state.phase = "RACING";
      }
    }

    const canDrive = this.state.phase === "GO" || this.state.phase === "RACING";
    const carList = Object.values(this.state.cars);

    // Step physics for each car
    for (const car of carList) {
      if (car.finished) continue;

      const spec = this.carSpecs.get(car.id) || CARS[0];
      const emptyInput: InputFrame = {
        steer: 0,
        throttle: 0,
        brake: 0,
        handbrake: false,
        boost: false,
        tick: this.state.tick,
      };
      const rawInput = inputs[car.id] || emptyInput;
      const input = canDrive ? rawInput : { ...rawInput, throttle: 0, boost: false };

      // Step vehicle mechanics
      const updated = stepVehiclePhysics(car, input, spec, dt);

      // Track barriers
      resolveTrackBarriers(updated, this.track);

      // Progress and checkpoints
      const trackInfo = this.track.findNearest(
        updated.position.x,
        updated.position.z,
        updated.lapProgress
      );
      const prevProgress = this.prevLapProgress.get(car.id) ?? trackInfo.progress;
      updated.lapProgress = trackInfo.progress;

      // Track lap timer
      if (canDrive) {
        updated.lapTime += dt;
      }

      // Checkpoints must be visited in order before a lap can count.
      // This prevents start-grid crossings and finish-line shortcuts.
      const count = this.track.checkpointCount;
      const checkpoint = Math.min(count - 1, Math.floor(updated.lapProgress * count));
      let expected = this.nextCheckpoint.get(car.id) ?? 1;
      const forwardDelta = (updated.lapProgress - prevProgress + 1) % 1;
      const forwardMovement = forwardDelta > 0 && forwardDelta < 0.1 &&
        updated.velocity.x * trackInfo.tangent.x + updated.velocity.z * trackInfo.tangent.z > 0;
      if (canDrive && forwardMovement && checkpoint === expected) {
        updated.checkpointIndex = checkpoint;
        expected++;
        this.nextCheckpoint.set(car.id, expected);
      }
      const crossedLine = prevProgress > 0.85 && updated.lapProgress < 0.15;
      if (canDrive && crossedLine && forwardMovement && expected === count && updated.speedKmh > 0) {
        this.nextCheckpoint.set(car.id, 1);
        updated.checkpointIndex = 0;
        // Valid lap completed!
        updated.lastLapTime = updated.lapTime;
        if (updated.bestLapTime <= 0 || updated.lapTime < updated.bestLapTime) {
          updated.bestLapTime = updated.lapTime;
        }
        updated.lapTime = 0;
        updated.lap++;

        if (updated.lap > this.state.lapsTotal) {
          updated.finished = true;
          updated.finishTime = this.state.time;
        }
      }

      updated.totalProgress = updated.lap - 1 + updated.lapProgress;
      this.prevLapProgress.set(car.id, updated.lapProgress);
      this.state.cars[car.id] = updated;
    }

    // Resolve car-to-car collisions
    resolveCarCollisions(
      carList,
      (col) => {
        if (col.carA === "player" || col.carB === "player") {
          this.state.impactShake = Math.max(this.state.impactShake || 0, col.intensity * 0.6);
        }
      },
      (takedown) => {
        if (takedown.isPlayerAttacker) {
          this.state.lastTakedownMessage = "TAKEDOWN!";
          this.state.impactShake = 0.9;
        } else if (takedown.isPlayerVictim) {
          this.state.lastTakedownMessage = "CRASHED!";
          this.state.impactShake = 1.0;
        }
      }
    );

    // Auto-respawn wrecked cars on track
    for (const car of carList) {
      if (car.isWrecked && car.wreckTimer <= 0) {
        car.isWrecked = false;
        car.health = car.maxHealth;
        const sample = this.track.getAtProgress(car.lapProgress);
        car.position.x = sample.position.x;
        car.position.z = sample.position.z;
        car.heading = Math.atan2(sample.tangent.x, sample.tangent.z);
        car.velocity.x = sample.tangent.x * 16;
        car.velocity.z = sample.tangent.z * 16;
        car.angularVelocity = 0;
      }
    }

    // Update standings (sorted by totalProgress descending)
    this.state.standings = carList
      .slice()
      .sort((a, b) => {
        if (a.finished && b.finished) return a.finishTime - b.finishTime;
        if (a.finished) return -1;
        if (b.finished) return 1;
        return b.totalProgress - a.totalProgress;
      })
      .map((c) => c.id);

    // Check if race has finished
    const playerCar = carList.find((c) => c.isPlayer);
    if (playerCar?.finished) {
      this.state.phase = "FINISHED";
    }

    return this.state;
  }

  /**
   * Serializes current state to JSON string (for replays, ghosts, multiplayer).
   */
  public serialize(): string {
    return JSON.stringify(this.state);
  }

  /**
   * Deserializes and restores state from JSON.
   */
  public deserialize(json: string): void {
    const restored = JSON.parse(json) as RaceSimState;
    if (!restored || !restored.cars || !Number.isFinite(restored.tick)) {
      throw new Error("Invalid race snapshot");
    }
    this.state = restored;
    this.prevLapProgress.clear();
    this.nextCheckpoint.clear();
    for (const car of Object.values(restored.cars)) {
      this.prevLapProgress.set(car.id, car.lapProgress);
      const index = Number.isInteger(car.checkpointIndex) ? car.checkpointIndex : 0;
      this.nextCheckpoint.set(car.id, Math.max(1, Math.min(this.track.checkpointCount, index + 1)));
    }
  }
}
