export type TrackId = "neon-city" | "dune-canyon" | "harbor-run";
export type Difficulty = "easy" | "medium" | "hard";

export interface TrackConfig {
  id: TrackId;
  name: string;
  tagline: string;
  environment: string;
  length: string;
  rx: number;
  rz: number;
  roadHalfWidth: number;
  sky: string;
  ground: string;
  road: string;
  primary: string;
  secondary: string;
  unlockPrice: number;
}

export const TRACKS: TrackConfig[] = [
  {
    id: "neon-city", name: "NEON CITY", tagline: "Own the skyline.", environment: "NIGHT • URBAN",
    length: "3.2 km", rx: 34, rz: 22, roadHalfWidth: 7.5,
    sky: "#070b20", ground: "#101a29", road: "#252b39", primary: "#27ddff", secondary: "#f3448a", unlockPrice: 0
  },
  {
    id: "dune-canyon", name: "DUNE CANYON", tagline: "No room for mistakes.", environment: "GOLDEN HOUR • DESERT",
    length: "4.6 km", rx: 40, rz: 18, roadHalfWidth: 7.1,
    sky: "#24132a", ground: "#49301f", road: "#5c514b", primary: "#ffb84a", secondary: "#ff6b43", unlockPrice: 0
  },
  {
    id: "harbor-run", name: "HARBOR RUN", tagline: "Fast lines. Cold water.", environment: "BLUE HOUR • COASTAL",
    length: "3.8 km", rx: 29, rz: 26, roadHalfWidth: 8.2,
    sky: "#051a2c", ground: "#0b2935", road: "#293944", primary: "#43f3bd", secondary: "#4d85ff", unlockPrice: 0
  }
];

export interface CarConfig {
  id: string;
  name: string;
  model: string;
  description: string;
  price: number;
  topSpeed: number;
  acceleration: number;
  handling: number;
  durability: number;
  color: string;
  accent: string;
  shape: "gt" | "sport" | "muscle" | "hyper" | "rally";
}

export const CARS: CarConfig[] = [
  { id: "vortex", name: "VORTEX R", model: "STREET / GT", description: "The balanced first ride. Learn the racing line.", price: 0, topSpeed: 220, acceleration: 30, handling: 1.0, durability: 100, color: "#f52d5b", accent: "#24d9f4", shape: "gt" },
  { id: "phantom", name: "PHANTOM X", model: "HYPER / AWD", description: "A high-speed build made for long straights.", price: 900, topSpeed: 258, acceleration: 34, handling: 0.94, durability: 90, color: "#6b72ff", accent: "#babaff", shape: "hyper" },
  { id: "tempest", name: "TEMPEST GT", model: "SPORT / RWD", description: "Sharp turn-in and a playful rear end.", price: 1300, topSpeed: 235, acceleration: 33, handling: 1.22, durability: 86, color: "#ff9a37", accent: "#ffe0a4", shape: "sport" },
  { id: "bulldog", name: "BULLDOG 9", model: "MUSCLE / V8", description: "Heavy, stable, and built to survive contact.", price: 1700, topSpeed: 228, acceleration: 32, handling: 0.88, durability: 145, color: "#40d59a", accent: "#c2ffe2", shape: "muscle" },
  { id: "apex-zero", name: "APEX ZERO", model: "PROTOTYPE / X", description: "The late-game weapon. Earn it, then own the grid.", price: 2600, topSpeed: 278, acceleration: 38, handling: 1.15, durability: 110, color: "#e8f4ff", accent: "#3e9fff", shape: "hyper" }
];

export const SKINS = [
  { id: "signal-red", name: "SIGNAL RED", color: "#f52d5b", price: 0 },
  { id: "ion-cyan", name: "ION CYAN", color: "#27ddff", price: 120 },
  { id: "solar-gold", name: "SOLAR GOLD", color: "#ffbd43", price: 180 },
  { id: "ultraviolet", name: "ULTRAVIOLET", color: "#9164ff", price: 220 },
  { id: "toxic-lime", name: "TOXIC LIME", color: "#92ef45", price: 260 },
  { id: "ceramic-white", name: "CERAMIC WHITE", color: "#e7f4ff", price: 300 }
] as const;

export type UpgradeId = "engine" | "handling" | "nitro" | "armor";
export const UPGRADES: { id: UpgradeId; name: string; description: string; icon: string; basePrice: number }[] = [
  { id: "engine", name: "ENGINE MAP", description: "More acceleration and top speed.", icon: "↗", basePrice: 260 },
  { id: "handling", name: "RACE SUSPENSION", description: "More responsive steering and drift control.", icon: "⌁", basePrice: 220 },
  { id: "nitro", name: "NITRO CELL", description: "Longer boost and faster recharge.", icon: "ϟ", basePrice: 240 },
  { id: "armor", name: "REINFORCED CHASSIS", description: "Survive more aggressive car-to-car contact.", icon: "◈", basePrice: 280 }
];

export interface RaceSetup {
  track: TrackConfig;
  car: CarConfig;
  difficulty: Difficulty;
  paint: string;
  upgrades: Record<UpgradeId, number>;
}
