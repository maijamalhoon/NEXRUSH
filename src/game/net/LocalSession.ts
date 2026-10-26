import { CARS, getCarById } from "../../data/cars";
import { getTrackById } from "../../data/tracks";
import { DIFFICULTY_PRESETS } from "../../data/difficulty";
import { computeBotInput, type BotDriver } from "../sim/ai";
import { RaceSimulation } from "../sim/race";
import { TrackSpline } from "../sim/track";
import { createInitialCarSimState } from "../sim/vehicle";
import { SeededRng } from "../sim/rng";
import type { InputFrame, RaceConfig, RaceSimState } from "../sim/types";
import type { RaceSession } from "./Session";

const BOT_NAMES = [
  { name: "V. Rossi", country: "IT", color: "#FF4D2E", carId: "venom_r" },
  { name: "S. Tanaka", country: "JP", color: "#4FD8FF", carId: "spectre" },
  { name: "M. Hansen", country: "DK", color: "#E63946", carId: "titan_rs" },
  { name: "K. Al-Mansoor", country: "AE", color: "#3DDC97", carId: "mirage_e" },
  { name: "A. Silva", country: "BR", color: "#FFB703", carId: "apex_gt" },
];

export class LocalSession implements RaceSession {
  public readonly config: RaceConfig;
  public track: TrackSpline;
  public sim: RaceSimulation;
  private bots: BotDriver[] = [];
  private listeners: Set<(state: RaceSimState) => void> = new Set();
  private rng: SeededRng;

  constructor(config: RaceConfig) {
    this.config = config;
    this.rng = new SeededRng(config.seed ?? 42);
    const trackData = getTrackById(config.trackId);
    this.track = new TrackSpline(trackData);
    this.sim = new RaceSimulation(this.track, config);
  }

  public async init(): Promise<void> {
    const playerSpec = getCarById(this.config.playerCarId);
    const playerSlot = this.track.getGridSlot(0);
    const playerState = createInitialCarSimState(
      "player",
      "YOU",
      true,
      playerSlot.position.x,
      playerSlot.position.z,
      playerSlot.heading,
      this.config.playerColor || "#D4FF2A"
    );
    this.sim.addCar(playerState, playerSpec);

    // Initialize AI opponents
    const count = Math.min(BOT_NAMES.length, this.config.opponentsCount ?? 3);
    this.bots = [];

    for (let i = 0; i < count; i++) {
      const template = BOT_NAMES[i];
      const botId = `bot_${i + 1}`;
      const botSpec = getCarById(template.carId);
      const slot = this.track.getGridSlot(i + 1);

      const botState = createInitialCarSimState(
        botId,
        template.name,
        false,
        slot.position.x,
        slot.position.z,
        slot.heading,
        template.color
      );
      this.sim.addCar(botState, botSpec);

      this.bots.push({
        id: botId,
        name: template.name,
        country: template.country,
        color: template.color,
        carId: template.carId,
        racingLineOffset: (this.rng.next() - 0.5) * 2.5, // slight variation in line
        rng: new SeededRng(this.rng.rangeInt(1, 100000)),
      });
    }
  }

  public start(): void {
    // Session is started and ticking
  }

  public step(playerInput: InputFrame): RaceSimState {
    const inputs: Record<string, InputFrame> = {
      player: playerInput,
    };

    const diff = DIFFICULTY_PRESETS[this.config.difficulty || "normal"];
    const allCars = Object.values(this.sim.state.cars);

    // Calculate bot inputs
    for (const bot of this.bots) {
      const car = this.sim.state.cars[bot.id];
      if (!car) continue;
      const spec = this.sim.carSpecs.get(bot.id) || CARS[0];
      inputs[bot.id] = computeBotInput(
        bot,
        car,
        spec,
        this.track,
        diff,
        allCars,
        this.sim.state.tick
      );
    }

    const nextState = this.sim.step(inputs);
    for (const listener of this.listeners) {
      listener(nextState);
    }
    return nextState;
  }

  public getState(): RaceSimState {
    return this.sim.state;
  }

  public onSnapshot(callback: (state: RaceSimState) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  public reset(): void {
    void this.init();
  }

  public dispose(): void {
    this.listeners.clear();
  }
}
