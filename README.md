# Neon Tubes Painter

An immersive WebGL drawing application where you paint glowing neon tubes on a dark canvas with real-time visual effects. Built with PixiJS and React.

## Features

- **Circle-stamp rendering** — strokes are drawn as densely overlapping filled circles (same technique as Procreate / Photoshop), producing perfectly smooth, render-quality tubes with no visible seams or artifacts
- **Three-layer stroke architecture** — each stroke is composed of three independent Graphics layers:
  - **Glow** — wide, soft outer halo (AlphaFilter for artifact-free transparency)
  - **Edge** — intermediate soft-edge ring for a smooth plastic-like falloff
  - **Body** — solid opaque tube core
- **Catmull-Rom spline smoothing** (5 sub-segments per interval) for silky-smooth curves
- **6-color gradient palettes** with animated color shifting along strokes
- **Post-processing effects**: AdvancedBloom (quality 8, full-screen filterArea), liquid displacement distortion, chromatic aberration (RGBSplit)
- **10 curated presets** with highly varied parameters — from ultra-thin holographic wires to massive soft ink-in-water blobs
- **Randomize** button for instant creative inspiration
- **Fullscreen mode** & keyboard shortcuts
- **PWA-ready** manifest for standalone mobile install

## Tech Stack

| Layer | Technology |
| --- | --- |
| Build & Dev | Vite 5, TypeScript 5 |
| UI | React 18, TailwindCSS 3 |
| Rendering | PixiJS 7 (WebGL) |
| Filters | pixi-filters (AdvancedBloom, RGBSplit, Displacement) |
| State | Zustand 4 |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser and start drawing.

## Keyboard Shortcuts

| Key | Action |
| --- | --- |
| H | Toggle UI panel |
| F | Fullscreen |
| C | Clear canvas |
| R | Random preset |

## Rendering Pipeline

```
Pointer events
  → point decimation (MIN_DISTANCE = 3 px)
  → Catmull-Rom spline smoothing (5 segments)
  → StrokeGraphics (3 layers)
      ├─ glowGfx   [AlphaFilter] → circle stamps (every 2nd pt, wide radius)
      ├─ edgeGfx   [AlphaFilter] → circle stamps (every pt, mid radius)
      └─ bodyGfx                 → circle stamps (every pt, brush radius)
  → PixiJS scene graph
      ├─ mainContainer [AdvancedBloomFilter + RGBSplitFilter, filterArea = fullscreen]
      │   ├─ strokeLayer  (committed strokes — persistent Container children)
      │   └─ fxContainer  [DisplacementFilter — live stroke only]
      │       └─ activeStroke.container
      └─ displacementSprite (animated noise texture)
```

## Project Structure

```
src/
├── main.tsx              # React entry point
├── App.tsx               # Root component — pointer events, render loop, shortcuts
├── index.css             # Tailwind imports, dark-theme input styling
├── presets.ts            # 10 preset configs (6-color palettes, varied params)
├── store.ts              # Zustand store (state + actions)
├── engine/
│   ├── createRenderer.ts # PixiJS app init, scene graph, commit/clear/resize
│   ├── strokeSystem.ts   # StrokeGraphics factory, circle-stamp drawStroke,
│   │                     #   Catmull-Rom smoothing, color interpolation
│   └── filters.ts        # Bloom, displacement, RGB split setup & animation
└── ui/
    ├── ControlPanel.tsx   # Settings panel (sliders, pickers, buttons)
    └── PresetSelect.tsx   # Preset dropdown
```

## License

MIT
