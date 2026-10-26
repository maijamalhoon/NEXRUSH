# NEXRUSH

**A performance-first 3D browser arcade racer.** NEXRUSH is a browser game prototype built with React, TypeScript, Vite and Babylon.js. The current milestone adds a complete front-end loop around the 3D race: track selection, a five-car garage, unlockable paint, performance upgrades, difficulty modes, nitro, drift controls, takedown credits and a three-lap finish.

## Live preview

Production preview: https://nexrush.vercel.app/

## Run locally

Use Node.js 22 or a current supported LTS release and a modern browser with WebGL:

```bash
npm install
npm run dev
```

Run the test suite and optimized build:

```bash
npm test
npm run build
```

## Current game loop

1. The landing hub leads to track selection.
2. Choose Neon City, Dune Canyon or Harbor Run, then choose a vehicle in the garage.
3. Five original fictional cars have individual stats and unlock prices. The Vortex R is the starter vehicle.
4. Equip paint skins and upgrade engine mapping, suspension/handling, nitro capacity or chassis armor using in-game credits.
5. Race against three AI rivals on Easy, Medium or Hard. High-speed contact can take down rivals and reward credits.
6. Complete three laps to finish a race. Race completion grants a position/difficulty reward, and best times are stored per track.
7. Coins, vehicle ownership, unlocked paint, equipped colors, upgrades, takedown total and best times are saved in the browser's local storage on the current device.

## Controls

| Action | Keyboard | Mobile |
|---|---|---|
| Accelerate | W / Up Arrow | GAS button |
| Brake / reverse | S / Down Arrow | BRAKE button |
| Steer | A / D or Left / Right | Left / right buttons |
| Nitro boost | Space | BOOST button |
| Drift / handbrake | Shift | DRIFT button |
| Reset race | R | Reset icon |
| Show controls | ? | ? |

## Performance and architecture

- Babylon.js is dynamically imported so the engine is not included in the first UI chunk.
- Adaptive rendering scales the render resolution based on observed frame rate; Performance, Balanced and High modes are also available.
- The game uses low-poly procedural vehicle meshes and instanced city scenery instead of loading a heavyweight asset pack at startup.
- Track presets adjust the circuit dimensions, road materials and color palette. Each preset currently shares the same core closed-loop driving model; bespoke spline layouts and unique large environmental asset sets remain a planned graphics milestone.
- The browser save is local to one device/profile. There is no cross-device account sync, cloud economy or online multiplayer yet.
- No physical mobile-device compatibility or frame-rate guarantee is claimed until real-device testing is completed.

## Current limitations / next milestones

NEXRUSH is still a prototype, not an Asphalt Legends replacement. AI opponents follow a simple racing line; damage/takedowns and collision geometry are arcade approximations. Distinct hand-authored spline tracks, fully unique 3D environments, richer car models/animation, sound, controller support, detailed results/leaderboards, cloud accounts and real-time multiplayer need further work. Image/video generation can help establish art direction and create promotional visuals, but interactive vehicles and tracks still need optimized 3D models, textures, collision and gameplay logic.

## Manual testing

Use [docs/PLAYTEST.md](docs/PLAYTEST.md) for the browser/device checklist. Do not mark a device or browser as supported until it has actually been tested.
