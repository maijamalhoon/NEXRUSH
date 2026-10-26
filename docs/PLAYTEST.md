# NEXRUSH manual playtest checklist

Run the automated checks first:

```bash
npm install
npm test
npm run build
npm run dev
```

## Driving loop

- [ ] Accelerate, coast, brake, reverse and steer in both directions.
- [ ] Turning at speed feels responsive without instantly snapping sideways.
- [ ] Handbrake + steering creates a temporary slip; the drift-angle HUD reacts and settles when released.
- [ ] Driving off the road reduces speed without making a stopped car roll backwards.
- [ ] Cross the start/finish line forwards and confirm the lap increments exactly once.
- [ ] Reverse across the line and confirm it does not increment the lap.
- [ ] Hit an AI car and confirm contact slows or nudges the player instead of freezing the game.
- [ ] Use **R** and the on-screen reset button; car, timer, lap and opponents return to their start positions.

## Devices and rendering

- [ ] Try Auto, Performance, Balanced and High quality settings.
- [ ] Resize the window while driving; the canvas and camera should remain usable.
- [ ] Switch tabs and return; the game should resume without a large simulation-time jump.
- [ ] Verify touch accelerate, brake, steering and handbrake on a physical phone.
- [ ] Check portrait and landscape layouts on a small screen.
- [ ] Check a desktop Chromium browser and at least one other browser engine.
- [ ] Test with hardware acceleration disabled and confirm the WebGL fallback message is readable.

## Reporting results

Record the device/browser, quality setting, approximate FPS, visual glitches and exact steps that reproduce an issue. Do not mark a browser or device as supported until it has actually been tested.
