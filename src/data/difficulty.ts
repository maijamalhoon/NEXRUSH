export interface DifficultyConfig {
  name: string;
  speedScale: number; // speed multiplier on straights
  corneringGrip: number; // grip confidence in turns
  aggression: number; // desire to overtake / defend
  mistakeFrequency: number; // probability of overshooting a braking zone
  rubberBanding: boolean; // subtle catch-up logic
  maxRubberBandCatchup: number;
}

export const DIFFICULTY_PRESETS: Record<"easy" | "normal" | "hard", DifficultyConfig> = {
  easy: {
    name: "ROOKIE",
    speedScale: 0.82,
    corneringGrip: 0.78,
    aggression: 0.3,
    mistakeFrequency: 0.15,
    rubberBanding: true,
    maxRubberBandCatchup: 1.1,
  },
  normal: {
    name: "PRO",
    speedScale: 0.94,
    corneringGrip: 0.92,
    aggression: 0.65,
    mistakeFrequency: 0.05,
    rubberBanding: true,
    maxRubberBandCatchup: 1.05,
  },
  hard: {
    name: "LEGEND",
    speedScale: 1.02,
    corneringGrip: 1.0,
    aggression: 0.95,
    mistakeFrequency: 0.01,
    rubberBanding: false,
    maxRubberBandCatchup: 1.0,
  },
};
