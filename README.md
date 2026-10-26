# NEXRUSH

**A performance-first 3D browser racing prototype.** The current milestone is a playable closed circuit with three computer-controlled rivals. Real-time multiplayer is planned for a later milestone.

## Run locally

Requirements: Node.js 22 or a current supported LTS release, plus a modern browser with WebGL enabled.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Run the racing logic tests with `npm test`. Create an optimized production bundle with `npm run build`; preview it locally with `npm run preview`.

## Controls

| Action | Keyboard | Mobile |
|---|---|---|
| Accelerate | W / Up Arrow | ▲ |
| Brake / reverse | S / Down Arrow | ▼ |
| Steer | A / D or Left / Right | ◀ / ▶ |
| Handbrake | Space | ✦ |
| Reset car | R | ↻ reset button |
| Help | Select the ? button | Select the ? button |

## Current prototype

- Babylon.js 3D scene with a closed oval circuit, neon track edges, lane markers and a chase camera.
- Three lightweight AI rivals following the circuit at different target speeds.
- Arcade acceleration, braking, handbrake and lateral-momentum drift model, grass slowdown, simple opponent contact response, and reset-to-grid control.
- Live speed, RPM, gear, elapsed time, lap, position and off-road HUD indicators.
- Auto, Performance, Balanced and High rendering quality settings. Auto mode adjusts render resolution in response to frame-rate samples.
- Responsive desktop/mobile HUD and touch controls.
- Unit tests for deterministic lap-crossing, off-road drag and drift-angle math.
- GitHub Actions workflow for unit tests, TypeScript checking and production builds on pushes and pull requests to `main`.

## Current limitations

This is an early arcade prototype, not a finished racing simulator. The AI currently follows a fixed racing line and speed; tire physics, polished drift behaviour, full collision geometry, lap timing/results, sound, car selection, accessibility testing, and real-time multiplayer are not implemented yet. The CI TypeScript check and production build have passed. Real browser/device compatibility and frame-rate performance still need hands-on testing before calling the prototype release-ready.

## Development direction

1. Verify and stabilize the production build.
2. Improve vehicle handling, track boundaries and collision behaviour.
3. Add race starts, checkpoints, lap records and opponent difficulty.
4. Profile desktop and lower-end mobile devices; tune automatic quality from measured results.
5. Add audio, car/track selection and a deployment preview.
6. Design multiplayer architecture only after the solo race loop is reliable.
