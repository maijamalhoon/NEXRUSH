# NEXRUSH — Quality & Playtest Protocol

Run automated regression suite first:
```bash
npm test
npm run typecheck
npm run lint
npm run build
```

---

## 1. Flow & Screen Navigation
- [ ] **Splash Screen**: Logo animates smoothly, "Start Engine" unlocks WebAudio context without console errors.
- [ ] **Main Menu**: Live 3D showcase in background. "Race", "Garage", and "Settings" open their respective screens. "Multiplayer" displays "Soon" badge and remains disabled.
- [ ] **Circuit Select**: Arrow keys or touch navigation switches between **Neon Metropolis**, **Sunset Coast**, and **Red Rock**. Length, difficulty badge, and 3D preview update.
- [ ] **Garage**: Carousel switches between all 5 cars (**Apex GT**, **Venom R**, **Spectre**, **Titan RS**, **Mirage EV**). Stat bars update accurately. Color swatches update car body paint.
- [ ] **Pause Modal**: Pressing Esc, P, or tapping the pause icon halts simulation. "Resume", "Restart", "Settings", and "Main Menu" perform immediate responsive state transitions.
- [ ] **Results Screen**: Crossing finish line after 3 laps presents podium standings, driver best laps, and "Again" / "Next Track" buttons.

---

## 2. Vehicle Dynamics & Signature RUSH Mechanic
- [ ] **Throttle & Shifting**: Engine accelerates forward, shifting up through gears automatically with corresponding RPM engine pitch changes.
- [ ] **Braking & Reverse**: Holding S / Down Arrow brakes firmly to a stop and engages reverse after stopping.
- [ ] **Drifting**: Engaging Handbrake (Space / touch Drift) while turning initiates controlled slip. Drift angle is calculated accurately.
- [ ] **RUSH Accumulation**: Clean drifting at speed builds the Ice Blue RUSH energy meter.
- [ ] **RUSH Activation**: Pressing Boost (Shift / touch RUSH) with energy available grants immediate speed boost, increases FOV, and expends RUSH meter.
- [ ] **Off-track Surface**: Leaving track boundaries onto grass/sand reduces grip by ~58% and applies rolling resistance.

---

## 3. Spline Tracks & Collision Boundaries
- [ ] **Track Generation**: 3D asphalt ribbon, red/white curbs, and guardrails form continuous, closed loops with smooth Catmull-Rom curvature.
- [ ] **Barrier Containment**: Crashing into outer walls pushes vehicle back onto circuit without falling into void.
- [ ] **AI Opponents**: 3 rival bots follow racing lines, brake for sharp corners, avoid rear-ending the player, and contest race positions.
- [ ] **Collision Response**: Car-to-car bumper contact applies elastic impulse and separates positions without overlapping or freezing.

---

## 4. Audio & Game Feel
- [ ] **Synthesized Engine Sound**: RPM changes seamlessly modulate procedural dual-oscillator pitch and filter cutoff.
- [ ] **Tire Squeal**: High lateral slip angle triggers band-pass filtered squeal.
- [ ] **Countdown Chimes**: 3..2..1 produce 440 Hz tones; GO produces an 880 Hz chime.
- [ ] **Haptics**: Collisions and boost activation trigger subtle vibration on supported Android devices.

---

## 5. PWA & Offline Readiness
- [ ] **Installation**: Browser recognizes Web Manifest and displays install icon in address bar or custom Install button.
- [ ] **Offline Execution**: Disconnect network in DevTools (Offline mode) and reload; entire game boots and plays without network calls.
- [ ] **Mobile Safe Area**: On mobile viewports, touch controls respect notch insets and thumb resting zones.
