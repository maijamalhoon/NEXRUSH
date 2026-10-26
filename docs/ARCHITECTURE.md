# NEXRUSH — System Architecture

## 1. High-Level Principles

NEXRUSH is architected as a clean, decoupled browser racing game designed for offline single-player today and real-time multiplayer tomorrow:

- **Strict Separation of Simulation and Rendering**: The physics engine and race state machine run in pure TypeScript with **zero** Babylon.js or DOM dependencies.
- **Fixed-Timestep Determinism (60 Hz)**: The simulation advances by a fixed `dt = 1/60s`. Given identical seeds and identical sequences of `InputFrame`s, the simulation produces byte-for-byte identical outcomes across all platforms.
- **Render Interpolation**: The Babylon.js rendering engine runs decoupled (at display refresh rate, 60–144 Hz) and smoothly interpolates car positions and headings between fixed simulation ticks.
- **Multiplayer-Ready Session Contract**: The UI and render loop talk exclusively to a `RaceSession` interface.

```
                      +-------------------+
                      |   React UI / HUD  |
                      +---------+---------+
                                |
                                v
+-------------------+     +-------------+     +--------------------+
|  Unified Input    | --> | RaceSession | <-- |  Audio Controller  |
| Keyboard/Touch/GP |     |  Interface  |     |  WebAudio Synth    |
+-------------------+     +------+------+     +--------------------+
                                 |
                 +---------------+---------------+
                 |                               |
                 v                               v
        +------------------+           +--------------------+
        |   LocalSession   |           |  OnlineSession     |
        | (Player + Bots)  |           | (Future WS/Coly)   |
        +--------+---------+           +--------------------+
                 |
                 v
        +----------------------------------------+
        | Pure Simulation (60 Hz)                |
        | - vehicle.ts (Tire slip, inertia, RPM) |
        | - track.ts (Spline, checkpoints, bounds)|
        | - collision.ts (Impulse, barriers)     |
        | - ai.ts (Racing line & overtaking)     |
        | - rng.ts (Mulberry32 seeded PRNG)      |
        +-------------------+--------------------+
                            | State Snapshot
                            v
        +----------------------------------------+
        | Babylon.js 8 Render Layer              |
        | - Interpolated meshes & wheels         |
        | - Ribbon track, curbs, barriers        |
        | - Post-processing, particles, bloom    |
        +----------------------------------------+
```

---

## 2. RaceSession Interface

Defined in `src/game/net/Session.ts`:

```typescript
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
```

### Implementations:
1. `LocalSession`:
   - Runs client-side `RaceSimulation`.
   - Generates bot inputs on each tick using `computeBotInput()`.
   - Advances vehicle physics, collisions, and lap detection.
2. `OnlineSession` (Future plug-in):
   - Transmits local `InputFrame`s over WebSocket / WebRTC to a dedicated game server or room authority (Colyseus, Agones, Supabase Realtime).
   - Receives server-authoritative state snapshots and performs client-side prediction and server reconciliation.
   - Zero changes required to React UI, HUD, or simulation math.

---

## 3. Input Model

Input is abstracted into a serializable `InputFrame`:

```typescript
export interface InputFrame {
  steer: number;      // -1.0 (full left) to 1.0 (full right)
  throttle: number;   // 0.0 to 1.0
  brake: number;      // 0.0 to 1.0
  handbrake: boolean; // slide / drift initiation
  boost: boolean;     // RUSH burn
  tick: number;       // integer frame index
}
```

All human controllers (Keyboard, Gamepad API, Touch thumbsticks/buttons, Gyro tilt) emit standard `InputFrame`s. AI bot drivers also output standard `InputFrame`s.

---

## 4. Vehicle Physics Model

The physics engine balances responsive arcade accessibility with motorsport realism:
- **Kinematic & Dynamic Forces**: 2D body-frame projection of longitudinal drive/brake forces and lateral tire friction forces.
- **Tire Slip & Drift**: When lateral force exceeds grip or the handbrake is engaged, tires slip dynamically, establishing realistic slip angles.
- **Rush Energy Harvest**: Sustained controlled drifts at speed > 40 km/h with slip angle > 10° accumulate Rush energy.
- **Powertrain Simulation**: Engine torque curve with simulated multi-gear ratios, RPM limits, and automated up/down-shifts.
- **Surface Grip**: Transitions off-track reduce tire friction by ~58% and introduce grass/sand rolling resistance.

---

## 5. Spline Track System

Tracks are authored as sparse 3D control points with road width parameters:
- **Catmull-Rom Interpolation**: Continuous curvature with smooth first derivatives.
- **Spatial Subdivision**: Fast binary search and localized window queries for $O(1)$ nearest-point and off-track evaluations.
- **Mesh Generation**: Babylon.js procedural ribbon geometry with normal extrusion, alternating curb vertices, and safety guardrails.
- **Checkpoints**: Monotonically advancing checkpoints to prevent track cutting and guarantee fair lap timing.
