import { create } from 'zustand';
import { presets, type Preset, type RenderMode } from './presets';

export interface PainterState extends Preset {
  activePresetIndex: number;
  uiVisible: boolean;

  applyPreset: (index: number) => void;
  setRenderMode: (mode: RenderMode) => void;
  toggleUI: () => void;
  randomize: () => void;
}

function presetToState(p: Preset): Omit<Preset, 'name'> & { name: string } {
  return { ...p };
}

export const useStore = create<PainterState>((set) => ({
  ...presetToState(presets[0]),
  activePresetIndex: 0,
  uiVisible: true,

  applyPreset: (index: number) => {
    const p = presets[index];
    if (!p) return;
    set({ ...presetToState(p), activePresetIndex: index });
  },

  setRenderMode: (mode: RenderMode) => {
    // Apply the first preset of the target mode automatically
    const idx = presets.findIndex((p) => p.renderMode === mode);
    if (idx >= 0) {
      set({ ...presetToState(presets[idx]), activePresetIndex: idx });
    } else {
      set({ renderMode: mode, activePresetIndex: -1 });
    }
  },

  toggleUI: () => set((s) => ({ uiVisible: !s.uiVisible })),

  randomize: () =>
    set((s) => {
      // Only pick presets that match the current render mode
      const candidates = presets
        .map((p, i) => ({ p, i }))
        .filter(({ p }) => p.renderMode === s.renderMode);

      if (candidates.length === 0) return {};

      const { p, i: idx } = candidates[Math.floor(Math.random() * candidates.length)];

      // Randomize parameters within sensible ranges around the preset values
      const vary = (base: number, range: number, min: number, max: number) =>
        Math.max(min, Math.min(max, base + (Math.random() - 0.5) * 2 * range));

      return {
        ...presetToState(p),
        activePresetIndex: idx,
        brushSize: Math.round(vary(p.brushSize, 15, 4, 100)),
        glow: +vary(p.glow, 0.6, 0.2, 3).toFixed(2),
        blurRadius: Math.round(vary(p.blurRadius, 8, 2, 40)),
        bloomStrength: +vary(p.bloomStrength, 0.5, 0.2, 3).toFixed(2),
        trail: +vary(p.trail, 0.05, 0.5, 0.99).toFixed(2),
        distortion: +vary(p.distortion, 0.3, 0, 2).toFixed(2),
        noiseScale: +vary(p.noiseScale, 0.6, 0.1, 5).toFixed(1),
        gradientSpeed: +vary(p.gradientSpeed, 0.15, 0, 1).toFixed(2),
        chromaAberration: +vary(p.chromaAberration, 0.15, 0, 0.8).toFixed(2),
      };
    }),
}));
