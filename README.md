# NEXRUSH

**A performance-first 3D browser racing prototype.** The current milestone is a playable closed circuit with three computer-controlled rivals. Real-time multiplayer is planned for a later milestone.

## Run locally

Requirements: Node.js 22 or a current supported LTS release, plus a modern browser with WebGL enabled.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Create an optimized production bundle with `npm run build`; preview it locally with `npm run preview`.

## Controls

| Action | Keyboard | Mobile |
|---|---|---|
| Accelerate | W / Up Arrow | ▲ |
| Brake / reverse | S / Down Arrow | ▼ |
| Steer | A / D or Left / Right | ◀ / ▶ |
| Handbrake | Space | ✦ |
| Help | Select the ? button | Select the ? button |

## Current prototype

- Babylon.js 3D scene with a closed oval circuit, neon track edges, lane markers and a chase camera.
- Three lightweight AI rivals following the circuit at different target speeds.
- Arcade acceleration, braking, steering, handbrake drag, off-road speed penalty and simple opponent contact response.
- Live speed, RPM, gear, elapsed time, lap, position and off-road HUD indicators.
- Auto, Performance, Balanced and High rendering quality settings. Auto mode adjusts render resolution in response to frame-rate samples.
- Responsive desktop/mobile HUD and touch controls.
- GitHub Actions workflow for TypeScript checking and production builds on pushes and pull requests to `main`.

## Current limitations

This is an early arcade prototype, not a finished racing simulator. The AI currently follows a fixed racing line and speed; tire physics, polished drift behaviour, full collision geometry, lap timing/results, sound, car selection, accessibility testing, and real-time multiplayer are not implemented yet. Browser/device performance and the CI production build still need to be verified on real targets before calling the prototype release-ready.

## Development direction

1. Verify and stabilize the production build.
2. Improve vehicle handling, track boundaries and collision behaviour.
3. Add race starts, checkpoints, lap records and opponent difficulty.
4. Profile desktop and lower-end mobile devices; tune automatic quality from measured results.
5. Add audio, car/track selection and a deployment preview.
6. Design multiplayer architecture only after the solo race loop is reliable.
