# NEXRUSH — Legend Upgrade: Audit and Delivery Gates

## Verified baseline (repository inspection, 2026-11-19)
- React 19, Babylon.js 8, Vite 6, TypeScript, Vitest, Playwright.
- README documents 3 circuits, 5 cars, AI difficulties, RUSH, PWA and touch/gamepad support.
- Documentation is not proof of gameplay behavior or frame-rate performance; validate on real devices.
- README CI badge references a placeholder `organization/nexrush` path; correct it separately.

## Gameplay priorities
1. **Feel first:** steering response, drift initiation/recovery, collisions, speed readability, camera smoothing, consistent controller input.
2. **Competitive loop:** accurate lap checkpoints, penalties, time trial, medal targets, persistent personal bests, replay/ghost (later).
3. **AI:** reproducible lap times, fair starts, difficulty calibration, overtaking and recovery.
4. **Visual polish:** readable road edges, distinct silhouettes, weather/lighting without sacrificing FPS.
5. **Accessibility and mobile:** safe-area controls, touch latency, reduced motion, adjustable quality, pause/resume.
6. **Reliability:** race-state transitions, context loss, offline assets, load time, deterministic physics regression tests.

## First implementation
`src/gameplay/timeTrial.ts` supplies pure scoring, track penalties, medals, and personal-best comparison. `tests/timeTrial.test.ts` covers boundaries and invalid input. This is a **foundation module, not wired to the race UI yet**.

## Integration checklist
- Inspect actual race state machine, lap timing and checkpoint validation.
- Call `evaluateTimeTrial` only when a validated race finishes.
- Set track-specific medal targets from measured clean reference laps, not guessed values.
- Save best valid time keyed by track, car, physics version, and ruleset.
- Show final time, penalties, medal, and personal best on results screen.
- Add end-to-end tests for finish, restart, pause and corrupted storage.
- Run `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:e2e`.
- Playtest low-end Android and desktop before any claims of 60 FPS.
