# NEXRUSH manual playtest checklist

Run the automated checks first:

```bash
npm install
npm test
npm run build
npm run dev
```

## Race start and timing

- [ ] Wait for the 3–2–1 countdown and confirm the GO cue starts the race.
- [ ] Confirm session and lap timers begin after GO, not while the engine is loading or during countdown.
- [ ] Complete a full lap; lap increments once and last-lap/best-lap values are recorded.
- [ ] Complete a slower lap; best lap remains unchanged. Complete a faster lap; best lap updates.
- [ ] Press R during a lap; timers/records reset and a new countdown starts.

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

## v0.3 scene and adaptive quality

- [ ] Confirm the start gate, car lamps and neon skyline appear in Balanced/High.
- [ ] Switch to Performance; optional skyline buildings should hide while the road and HUD remain usable.
- [ ] Switch Performance → Auto: optional scenery should restore only after quality has recovered, not flicker every few seconds.
- [ ] Drive a full lap with scenery visible and disabled; check that no skyline objects cross into the road.
- [ ] Open the deployed build and confirm the page title, live HUD and reset control appear.

## Reporting results

Record the device/browser, quality setting, approximate FPS, visual glitches and exact steps that reproduce an issue. Do not mark a browser or device as supported until it has actually been tested.
