# NEXRUSH manual playtest checklist

Run the automated checks first:

```bash
npm install
npm test
npm run build
npm run dev
```

## Main menu and saved garage
- [ ] Landing page fits desktop, tablet, phone portrait and phone landscape.
- [ ] Track selection shows all three presets and highlights the selected one.
- [ ] Garage switches between all five cars and correctly shows owned/locked status.
- [ ] Unlocking a car deducts credits exactly once; unaffordable purchases are rejected.
- [ ] Paint can be bought/equipped, with owned paint remaining available.
- [ ] Engine, handling, nitro and armor upgrades charge the expected price and stop at level five.
- [ ] Reload the browser and confirm credits, ownership, paint, upgrades and best times persist.
- [ ] Corrupted or blocked local storage does not prevent the game from opening.

## Race controls and handling
- [ ] Wait for the 3–2–1 countdown and GO cue; controls remain inactive before the race starts.
- [ ] Accelerate, coast, brake, reverse and steer in both directions.
- [ ] Space activates nitro, depletes/recharges the meter, shows exhaust flames and speed-line feedback, and adjusts the chase camera.
- [ ] Shift plus steering produces a drift without Space acting as the handbrake.
- [ ] A valid drift adds combo points; releasing the drift stops the combo state and the score remains visible for the race.
- [ ] Steering visibly turns the front wheels and rolls the body subtly without excessive wobble.
- [ ] Low-speed contact nudges the car; high-speed takedowns produce a brief impact response.
- [ ] Easy / Medium / Hard AI pace feels distinct, rivals are competitive at speed, and their racing lines vary without leaving the road.
- [ ] Mobile gas, brake, steer, boost and drift buttons work with pointer cancel/leave.
- [ ] Driving off the road slows the car without reversing a stopped car.
- [ ] Contact at lower speed slows/nudges the player; a high-speed hit can take down an AI rival and add credits once.
- [ ] Easy / Medium / Hard adjust opponent target speeds.
- [ ] Reset restarts the countdown, resets opponents and clears current-race takedowns.

## Three-lap finish
- [ ] Crossing the start line forwards increments a lap exactly once.
- [ ] Reverse crossing does not increment a lap.
- [ ] Last-lap and best-lap records work; a slower lap cannot replace the best lap.
- [ ] The race ends after three full laps, freezes the timer and shows final position/reward.
- [ ] Finish reward is added only once.
- [ ] Race again starts a fresh countdown; selecting another track takes effect in the next race.

## Rendering, performance and compatibility
- [ ] Try Auto, Performance, Balanced and High quality settings.
- [ ] Resize the window while driving; canvas and camera remain usable.
- [ ] Switch tabs and return; the simulation avoids a large hidden-tab time jump.
- [ ] Check portrait and landscape layouts on a physical phone.
- [ ] Test a desktop Chromium browser and at least one other browser engine.
- [ ] Check hardware acceleration/WebGL failure messaging.
- [ ] Record device, browser, selected quality, approximate FPS, visual glitches and reproducible steps.
- [ ] Do not claim a frame-rate target is met until it is measured on physical devices.
