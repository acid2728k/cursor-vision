# Neon Tubes Painter

An immersive WebGL drawing application where you paint glowing neon tubes on a dark canvas with real-time visual effects.

## Features

- **Neon tube drawing** with smooth Catmull-Rom spline interpolation
- **Gradient palettes** with animated color shifting along strokes
- **Post-processing effects**: bloom/glow, liquid displacement distortion, chromatic aberration
- **Trail persistence** — strokes fade over time at adjustable rates
- **10 curated presets** (Aurora Ribbon, Plasma Core, Liquid Neon, and more)
- **Randomize** button for instant creative inspiration
- **Fullscreen mode** & keyboard shortcuts (H/F/C/R)
- **PWA-ready** manifest for standalone mobile install

## Tech Stack

- **Vite + React + TypeScript** — fast dev & build
- **PixiJS 7** — WebGL rendering engine
- **pixi-filters** — AdvancedBloom, RGBSplit, Displacement
- **TailwindCSS** — dark minimal UI
- **Zustand** — lightweight state management

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser and start drawing.

## Keyboard Shortcuts

| Key | Action          |
| --- | --------------- |
| H   | Toggle UI panel |
| F   | Fullscreen      |
| C   | Clear canvas    |
| R   | Random preset   |

## Project Structure

```
src/
├── main.tsx              # React entry
├── App.tsx               # Root component, engine wiring
├── presets.ts            # 10 preset configurations
├── store.ts              # Zustand state management
├── engine/
│   ├── createRenderer.ts # PixiJS init, persistence texture
│   ├── strokeSystem.ts   # Point collection, smoothing, drawing
│   └── filters.ts        # Bloom, displacement, RGB split
└── ui/
    ├── ControlPanel.tsx   # Settings panel (Tailwind)
    └── PresetSelect.tsx   # Preset dropdown
```

## License

MIT
