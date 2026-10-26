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

  public addCar(
    carState: CarSimState,
    spec: CarSpec
  ): void {
    this.state.cars[carState.id] = carState;
    this.carSpecs.set(carState.id, spec);
    this.prevLapProgress.set(carState.id, carState.lapProgress);
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
      const emptyInput: InputFrame = { steer: 0, throttle: 0, brake: 0, handbrake: false, boost: false, tick: this.state.tick };
      const rawInput = inputs[car.id] || emptyInput;
      const input = canDrive ? rawInput : { ...rawInput, throttle: 0, boost: false };

      // Step vehicle mechanics
      const updated = stepVehiclePhysics(car, input, spec, dt);

      // Track barriers
      resolveTrackBarriers(updated, this.track);

      // Progress and checkpoints
      const trackInfo = this.track.findNearest(updated.position.x, updated.position.z, updated.lapProgress);
      const prevProgress = this.prevLapProgress.get(car.id) ?? trackInfo.progress;
      updated.lapProgress = trackInfo.progress;

      // Track lap timer
      if (canDrive) {
        updated.lapTime += dt;
      }

      // Checkpoint and lap completion logic
      // Completed a lap if crossed from >0.85 to <0.15 forward
      if (prevProgress > 0.85 && updated.lapProgress < 0.15 && updated.speedKmh > 0) {
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

      updated.totalProgress = (updated.lap - 1) + updated.lapProgress;
      this.prevLapProgress.set(car.id, updated.lapProgress);
      this.state.cars[car.id] = updated;
    }

    // Resolve car-to-car collisions
    resolveCarCollisions(carList);

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
    this.state = JSON.parse(json);
  }
}
