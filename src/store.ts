import { create } from 'zustand';
import { presets, type Preset } from './presets';

export interface PainterState extends Preset {
  activePresetIndex: number;
  uiVisible: boolean;

  applyPreset: (index: number) => void;
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

  toggleUI: () => set((s) => ({ uiVisible: !s.uiVisible })),

  randomize: () => {
    const idx = Math.floor(Math.random() * presets.length);
    const p = presets[idx];

    // Randomize parameters within sensible ranges around the preset values
    const vary = (base: number, range: number, min: number, max: number) =>
      Math.max(min, Math.min(max, base + (Math.random() - 0.5) * 2 * range));

    set({
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
    });
  },
}));
