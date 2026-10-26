# NEXRUSH — Design System & Visual Identity

## 1. Design Philosophy
NEXRUSH is styled with a **dark, confident motorsport broadcast aesthetic** inspired by modern endurance GT racing and Formula 1 timing screens:
- **60 / 30 / 10 Discipline**: 60% deep obsidian background (`#0B0D12`), 30% carbon graphite surfaces (`#12151C`, `#1A1F2A`), and 10% high-visibility telemetry accents (`#D4FF2A` Volt Lime, `#4FD8FF` Ice Blue, `#FF4D2E` Signal Red).
- **Fewer Words, More Meaning**: Every UI label is 1–2 words. Icons, numbers, and colors communicate state instantly without cognitive load.
- **Strict Geometric Consistency**: Uniform 8–10px rounded corners and 1px crisp borders. Zero arbitrary clip-path corners or cluttered neon glows.

---

## 2. Design Tokens (`src/ui/tokens.css`)

### Color Palette

| Token | Hex | Role | Usage |
|---|---|---|---|
| `--bg-root` | `#0B0D12` | Foundation | Canvas background, letterbox borders |
| `--surface-base` | `#12151C` | Cards & Modals | Main dialogue panels, results container |
| `--surface-raised` | `#1A1F2A` | Elevated UI | Button default, carousel cards |
| `--border-subtle` | `#262C3A` | Dividers | 1px borders, table dividers |
| `--text-primary` | `#F4F6FA` | Primary Text | Headings, driver names, speedometer |
| `--text-muted` | `#8B94A7` | Secondary Text | Unit labels (`KM/H`, `LAP`), subtitles |
| `--accent-primary` | `#D4FF2A` | Hero / Brand / P1 | Primary CTAs, 1st place badge, player car |
| `--accent-rush` | `#4FD8FF` | RUSH Energy | Boost meter, draft indicator, high-speed effects |
| `--accent-danger` | `#FF4D2E` | Alerts & Brakes | Brake pedal, off-track warning, barrier impact |
| `--accent-success` | `#3DDC97` | Records | New lap records, offline indicator |

### Typography
- **Display / Numerals**: `"Chakra Petch", "Saira Condensed", "Barlow Condensed", "Impact", sans-serif`
  - High-impact, condensed, tabular numbers for speedometers and lap clocks.
- **UI & Controls**: `"Inter", system-ui, -apple-system, sans-serif`
  - Highly legible, high x-height for badges, button text, and settings labels.

---

## 3. UI Component Catalog

1. **Brand Mark (`Logo.tsx`)**: Geometric aerodynamic shield with dual forward chevrons in Volt Lime and Ice Blue.
2. **Action Buttons (`Button.tsx`)**:
   - `primary`: Volt lime fill, bold black text, 48px+ touch budget.
   - `secondary`: Dark surface raised with 1px border.
   - `danger`: Signal red fill for emergency / reset actions.
   - `ghost`: Transparent with subtle hover effect.
3. **Telemetry HUD (`RaceHud.tsx`)**:
   - Big numerical speed display (`KM/H`) with active gear indicator.
   - Position & Lap badge counters (`POS 1/4`, `LAP 2/3`).
   - RUSH meter bar showing accumulated boost energy.
   - Live SVG dynamic minimap with player & rival blips.
   - Touch zones configured with 52px+ pads positioned for natural thumb resting angles.
4. **Garage & Circuit Carousels (`CarSelectScreen.tsx`, `TrackSelectScreen.tsx`)**:
   - High-contrast stat bars for Top Speed, Acceleration, Handling, and Rush Efficiency.
   - Color swatch selectors for vehicle liveries.
5. **Standings Modal (`ResultsScreen.tsx`)**:
   - Ranked driver finishes with best lap comparisons.
