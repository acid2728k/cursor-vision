# Neon Tubes Painter

An immersive WebGL drawing application where you paint glowing neon tubes and 3D ribbons on a dark canvas with real-time visual effects. Built with PixiJS and React.

## Features

### Two Render Modes

- **Neon Mode** — classic glowing neon tube strokes with post-processing effects
- **3D Ribbon Mode** — volumetric tubes with real-time 3D lighting, specular highlights, and hemisphere-capped ends

### Neon Mode

- **Circle-stamp rendering** — strokes drawn as densely overlapping filled circles (same technique as Procreate / Photoshop), producing perfectly smooth, render-quality tubes
- **Three-layer stroke architecture** — each stroke is composed of three independent Graphics layers:
  - **Glow** — wide, soft outer halo (AlphaFilter for artifact-free transparency)
  - **Edge** — intermediate soft-edge ring for a smooth plastic-like falloff
  - **Body** — solid opaque tube core

### 3D Ribbon Mode

- **Custom GLSL mesh shader** — triangle-strip geometry with per-vertex tangent angles
- **Cylindrical 3D lighting** — real-time diffuse + Blinn-Phong specular highlights computed from a virtual cylindrical surface normal
- **Rim darkening** — edges naturally blend into the dark background via `pow(z, 0.4)` falloff, no transparency needed
- **Hemisphere taper caps** — smooth dome-shaped ends built from concentric taper rings that follow a hemisphere profile (cos/sin), eliminating seam artifacts
- **Miter joins** — proper miter offset at interior vertices with a miter limit of 2.0, preventing self-intersection at sharp turns
- **Tangent angle unwrapping** — consecutive angles are unwrapped to avoid 2π jumps, ensuring smooth light interpolation across the mesh
- **Live-updating committed strokes** — palette changes, Random, and preset switches instantly recolor all already-drawn 3D ribbons

### Shared Features

- **Catmull-Rom spline smoothing** (5 sub-segments per interval) for silky-smooth curves
- **6-color gradient palettes** with animated color shifting along strokes
- **Post-processing effects**: AdvancedBloom (quality 8, full-screen filterArea), liquid displacement distortion, chromatic aberration (RGBSplit)
- **22 curated presets** — 10 neon + 12 ribbon3d — from ultra-thin holographic wires to massive glowing lava tubes
- **Mode-scoped Random** — the Random button and preset selector only show/pick presets matching the active render mode
- **Auto-apply on mode switch** — switching render mode auto-applies the first preset of that mode
- **Fullscreen mode** & keyboard shortcuts
- **PWA-ready** manifest for standalone mobile install

## Tech Stack

| Layer | Technology |
| --- | --- |
| Build & Dev | Vite 5, TypeScript 5 |
| UI | React 18, TailwindCSS 3 |
| Rendering | PixiJS 7 (WebGL), Custom GLSL shaders |
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
| R | Random preset (within current mode) |

## Rendering Pipeline

### Neon Mode

```
Pointer events
  → point decimation (MIN_DISTANCE = 3 px)
  → Catmull-Rom spline smoothing (5 segments)
  → StrokeGraphics (3 layers, circle-stamp technique)
      ├─ glowGfx   [AlphaFilter] → circle stamps (every 2nd pt, wide radius)
      ├─ edgeGfx   [AlphaFilter] → circle stamps (every pt, mid radius)
      └─ bodyGfx                 → circle stamps (every pt, brush radius)
```

### 3D Ribbon Mode

```
Pointer events
  → point decimation (MIN_DISTANCE = 3 px)
  → Catmull-Rom spline smoothing (5 segments)
  → buildRibbonGeometry
      ├─ Triangle strip (2 vertices per point, miter joins)
      ├─ Start cap (hemisphere taper, 14 concentric rings)
      └─ End cap   (hemisphere taper, 14 concentric rings)
  → PIXI.Mesh with custom GLSL shader
      ├─ Vertex:   project positions, pass UV + tangent angle
      └─ Fragment:  gradient texture sampling
                    → cylindrical normal (v → x,z)
                    → diffuse lighting (rotated light dir)
                    → Blinn-Phong specular
                    → rim darkening (pow(z, 0.4))
```

### Scene Graph

```
app.stage
  ├─ displacementSprite (animated noise texture)
  └─ mainContainer [AdvancedBloomFilter + RGBSplitFilter, filterArea = fullscreen]
      ├─ strokeLayer  (committed strokes — persistent Container children)
      │   ├─ StrokeGraphics containers (neon)
      │   └─ PIXI.Mesh containers (ribbon3d, live-updatable)
      └─ fxContainer  [DisplacementFilter — live stroke only]
          ├─ activeStroke.container  (neon)
          └─ activeRibbon.container  (ribbon3d)
```

## Project Structure

```
src/
├── main.tsx              # React entry point
├── App.tsx               # Root component — pointer events, render loop, shortcuts
├── index.css             # Tailwind imports, dark-theme input styling
├── presets.ts            # 22 preset configs (10 neon + 12 ribbon3d)
├── store.ts              # Zustand store (state + actions, mode-scoped randomize)
├── engine/
│   ├── createRenderer.ts # PixiJS app init, scene graph, commit/clear/resize,
│   │                     #   committed ribbon tracking
│   ├── strokeSystem.ts   # StrokeGraphics factory, circle-stamp drawStroke,
│   │                     #   Catmull-Rom smoothing, color interpolation
│   ├── ribbonMesh.ts     # 3D ribbon: GLSL shaders, geometry builder (miter joins,
│   │                     #   hemisphere taper caps), create/update/commit/clear
│   └── filters.ts        # Bloom, displacement, RGB split setup & animation,
│                         #   mode-aware parameter scaling
└── ui/
    ├── ControlPanel.tsx   # Settings panel (sliders, pickers, render mode toggle)
    └── PresetSelect.tsx   # Mode-filtered preset dropdown
```

## License

MIT
