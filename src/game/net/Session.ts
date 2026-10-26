import type { InputFrame, RaceConfig, RaceSimState } from "../sim/types";

export interface RaceSession {
  readonly config: RaceConfig;
  init(): Promise<void>;
  start(): void;
  step(playerInput: InputFrame): RaceSimState;
  getState(): RaceSimState;
  onSnapshot(callback: (state: RaceSimState) => void): () => void;
  reset(): void;
  dispose(): void;
}
