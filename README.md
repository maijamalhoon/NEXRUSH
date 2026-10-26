# NEXRUSH — Racing Division

> **Studio-grade next-generation browser racing game built with Babylon.js 8, React 19, Vite 6, and TypeScript.**

[![CI](https://github.com/organization/nexrush/actions/workflows/ci.yml/badge.svg)](https://github.com/organization/nexrush/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

NEXRUSH is an installable, high-performance offline PWA racing title engineered for modern mobile and desktop browsers with 60 FPS deterministic physics, procedural audio synthesis, and motorsport visual identity.

---

## ⚡ Key Features

- **Signature RUSH Mechanic**: Drifting and overtaking fill the Ice Blue RUSH meter; burn it on straights for a warp speed burst and dynamic FOV expansion.
- **Deterministic 60 Hz Simulation**: Decoupled pure TypeScript physics model (`dt = 1/60s`) separated from rendering. Guaranteed cross-platform determinism proven via Vitest.
- **Multiplayer-Ready Architecture**: Decoupled `RaceSession` abstraction ready for seamless `OnlineSession` (WebSocket / Colyseus) integration without refactoring UI or physics.
- **3 Spline Circuits**:
  - **Neon Metropolis**: Technical night GP street circuit with chicanes and skyscrapers.
  - **Sunset Coast**: Sweeping coastal curves with warm evening ocean reflections.
  - **Red Rock**: Rugged desert canyon with sharp hairpins and dirt shoulders.
- **5 High-Performance Cars**:
  - `Apex GT` (Sport Coupe — balanced handling and speed)
  - `Venom R` (AWD Supercar — brutal top speed and grip)
  - `Spectre` (Tuner Specialist — extreme drift authority)
  - `Titan RS` (Muscle — heavyweight acceleration)
  - `Mirage EV` (Hypercar — instant electric torque and downforce)
- **Competitive AI Drivers**: Line-following bots with apex braking points, overtaking evasion, and 3 difficulty tiers (`Rookie`, `Pro`, `Legend`).
- **Procedural WebAudio Synthesizer**: Harmonic RPM engine tone with automatic transmission gear shifts, tire slip squeal, boost whoosh, and countdown chimes.
- **Installable Offline PWA**: Web Manifest, Workbox precaching, Screen Wake Lock, and touch controls formatted to 48px+ touch budgets.

---

## 🎮 Controls

### Desktop (Keyboard)
| Action | Key |
|---|---|
| **Accelerate** | `W` or `↑` |
| **Brake / Reverse** | `S` or `↓` |
| **Steer Left / Right** | `A` / `D` or `←` / `→` |
| **Handbrake (Drift)** | `Space` |
| **RUSH Boost** | `Shift` or `E` |
| **Reset Car** | `R` |
| **Pause** | `Esc` or `P` |

### Gamepad API
- **Steer**: Left Analog Stick
- **Throttle / Brake**: Right Trigger (`RT`) / Left Trigger (`LT`)
- **Handbrake**: Button `B` / `Circle` / `X`
- **RUSH Boost**: Button `A` / `Cross`
- **Pause**: Start Button

### Mobile Touch
- **Left Thumb**: Left (`◀`) and Right (`▶`) steering pads.
- **Right Thumb**: Throttle (`▲`), Brake (`▼`), Drift, and RUSH buttons.
- Supports touch haptic feedback (`navigator.vibrate`).

---

## 🛠️ Development & Tooling

```bash
# Install dependencies
npm install

# Start local dev server (0.0.0.0)
npm run dev

# Run Vitest test suite
npm test

# Run TypeScript type check
npm run typecheck

# Run ESLint validation
npm run lint

# Format code with Prettier
npm run format

# Production build
npm run build

# Preview production build locally
npm run preview
```

---

## 📐 Architecture & Documentation

- [System Architecture](docs/ARCHITECTURE.md): Timestep loop, simulation layers, and multiplayer session contracts.
- [Design System & Tokens](docs/DESIGN.md): 60/30/10 motorsport palette, typography, and UI component catalog.
- [Playtest Checklist](docs/PLAYTEST.md): Verification gates for driving physics, mobile touch, and PWA installation.

---

## 📄 License

MIT License. Designed and engineered for the open web.
