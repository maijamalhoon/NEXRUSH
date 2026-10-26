export interface InputFrame {
  steer: number; // -1.0 (full left) to 1.0 (full right)
  throttle: number; // 0.0 to 1.0
  brake: number; // 0.0 to 1.0
  handbrake: boolean;
  boost: boolean; // RUSH activation
  tick: number;
}

export interface Vector2D {
  x: number;
  z: number;
}

export interface CarSpec {
  id: string;
  name: string;
  class: string;
  mass: number; // kg, e.g. 1200
  topSpeedKmh: number; // e.g. 240
  acceleration: number; // 0 to 100 rating or m/s^2 factor
  handling: number; // 0 to 100 rating
  driftFactor: number; // ease of breaking traction (0.6 - 1.2)
  downforce: number; // high-speed grip enhancement
  gearRatios: number[]; // transmission gears
  driveType: "RWD" | "AWD" | "FWD";
  colors: string[]; // available paint hex codes
  stats: {
    topSpeed: number; // 1-100 for UI stat bar
    accel: number; // 1-100 for UI stat bar
    handling: number; // 1-100 for UI stat bar
    rushRate: number; // 1-100 for UI stat bar
  };
}

export interface CarSimState {
  id: string;
  name: string;
  isPlayer: boolean;
  color?: string;
  position: Vector2D;
  velocity: Vector2D;
  heading: number; // yaw angle in radians (0 = +Z, PI/2 = +X)
  angularVelocity: number;
  speedKmh: number;
  lateralVelocity: number;
  driftAngle: number; // degrees
  rpm: number;
  gear: number;
  rushMeter: number; // 0 to 100
  isBoosting: boolean;
  offTrack: boolean;
  lap: number;
  lapProgress: number; // 0.0 to 1.0
  totalProgress: number; // lap - 1 + lapProgress
  lapTime: number;
  lastLapTime: number;
  bestLapTime: number;
  checkpointIndex: number;
  finished: boolean;
  finishTime: number;
  penaltyTime: number;
  health: number; // 0 to 100
  maxHealth: number;
  isWrecked: boolean;
  wreckTimer: number;
  takedowns: number;
}

export type RacePhase = "COUNTDOWN" | "GO" | "RACING" | "FINISHED";

export interface RaceSimState {
  tick: number;
  time: number;
  phase: RacePhase;
  countdownRemaining: number;
  cars: Record<string, CarSimState>;
  standings: string[]; // car IDs sorted P1, P2, ...
  lapsTotal: number;
  lastTakedownMessage?: string;
  impactShake?: number; // 0 to 1 for camera hit shake
}

export interface TrackPoint {
  x: number;
  y: number;
  z: number;
  width?: number;
}

export interface TrackData {
  id: string;
  name: string;
  subtitle: string;
  difficulty: "Easy" | "Medium" | "Hard";
  lengthMeters: number;
  defaultLaps: number;
  points: TrackPoint[];
  theme: "city_night" | "coastal_sunset" | "desert_industrial";
  weather?: "sunny_clouds" | "sunset" | "overcast_rain";
  ambientColor: string;
  skyGradient: [string, string];
  fogColor: string;
  roadWidth: number;
}

export interface RaceConfig {
  trackId: string;
  laps: number;
  difficulty: "easy" | "normal" | "hard";
  playerCarId: string;
  playerColor?: string;
  opponentsCount: number;
  seed?: number;
}
