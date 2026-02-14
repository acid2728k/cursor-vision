export type RenderMode = 'neon' | 'ribbon3d';

export interface Preset {
  name: string;
  renderMode: RenderMode;
  palette: string[];
  brushSize: number;
  hardness: number;
  glow: number;
  blurRadius: number;
  bloomThreshold: number;
  bloomStrength: number;
  trail: number;
  distortion: number;
  noiseScale: number;
  gradientSpeed: number;
  chromaAberration: number;
  background: string;
}

export const presets: Preset[] = [
  // 1 — Flowing aurora borealis: medium brush, rich 6-color gradient, gentle glow
  {
    name: 'Aurora Ribbon',
    renderMode: 'neon',
    palette: ['#00FFD5', '#7C4DFF', '#FF3D9A', '#00E5FF', '#FFAB40', '#76FF03'],
    brushSize: 28,
    hardness: 0.45,
    glow: 1.6,
    blurRadius: 14,
    bloomThreshold: 0.3,
    bloomStrength: 1.2,
    trail: 0.92,
    distortion: 0.35,
    noiseScale: 1.5,
    gradientSpeed: 0.35,
    chromaAberration: 0.12,
    background: '#06061a',
  },

  // 2 — Aggressive hot plasma: punchy reds/yellows, extreme bloom, strong distortion
  {
    name: 'Plasma Core',
    renderMode: 'neon',
    palette: ['#FF1744', '#FFEA00', '#FF6D00', '#00E5FF', '#FF4081', '#FFFFFF'],
    brushSize: 36,
    hardness: 0.7,
    glow: 2.8,
    blurRadius: 22,
    bloomThreshold: 0.15,
    bloomStrength: 2.5,
    trail: 0.85,
    distortion: 0.75,
    noiseScale: 1.0,
    gradientSpeed: 0.5,
    chromaAberration: 0.35,
    background: '#0a0205',
  },

  // 3 — Heavy liquid distortion: organic, melting colors, big noise
  {
    name: 'Liquid Neon',
    renderMode: 'neon',
    palette: ['#00FF8A', '#00B0FF', '#FF00E5', '#FFFF00', '#00FFEA', '#D500F9'],
    brushSize: 32,
    hardness: 0.3,
    glow: 1.8,
    blurRadius: 16,
    bloomThreshold: 0.28,
    bloomStrength: 1.4,
    trail: 0.9,
    distortion: 1.6,
    noiseScale: 3.2,
    gradientSpeed: 0.2,
    chromaAberration: 0.18,
    background: '#03080f',
  },

  // 4 — Ethereal smoke: huge soft brush, heavy chroma aberration, almost no glow
  {
    name: 'Chromatic Smoke',
    renderMode: 'neon',
    palette: ['#B2FF59', '#18FFFF', '#FF4081', '#E040FB', '#69F0AE', '#FFAB40'],
    brushSize: 70,
    hardness: 0.1,
    glow: 0.4,
    blurRadius: 4,
    bloomThreshold: 0.55,
    bloomStrength: 0.3,
    trail: 0.96,
    distortion: 0.2,
    noiseScale: 0.6,
    gradientSpeed: 0.08,
    chromaAberration: 0.8,
    background: '#080810',
  },

  // 5 — Laser-sharp thin lines: high hardness, fast gradient, warm palette
  {
    name: 'Electric Sunset',
    renderMode: 'neon',
    palette: ['#FF6B00', '#FF00A8', '#5A00FF', '#FFD600', '#F50057', '#AA00FF'],
    brushSize: 8,
    hardness: 0.92,
    glow: 1.4,
    blurRadius: 10,
    bloomThreshold: 0.35,
    bloomStrength: 1.0,
    trail: 0.88,
    distortion: 0.05,
    noiseScale: 0.3,
    gradientSpeed: 0.75,
    chromaAberration: 0.05,
    background: '#0a0508',
  },

  // 6 — Deep ocean: cold monochrome blues/teals, massive glow halo, very slow
  {
    name: 'Deep Sea Biolume',
    renderMode: 'neon',
    palette: ['#00E5FF', '#00FFB0', '#0047FF', '#1DE9B6', '#00B8D4', '#80D8FF'],
    brushSize: 24,
    hardness: 0.4,
    glow: 3.0,
    blurRadius: 38,
    bloomThreshold: 0.12,
    bloomStrength: 2.0,
    trail: 0.97,
    distortion: 0.25,
    noiseScale: 1.8,
    gradientSpeed: 0.06,
    chromaAberration: 0.04,
    background: '#010610',
  },

  // 7 — Hologram wireframe: ultra-thin, razor-sharp, zero distortion, cool palette
  {
    name: 'Hologram Wire',
    renderMode: 'neon',
    palette: ['#00FFEA', '#FFFFFF', '#7CFF00', '#40C4FF', '#B2FF59', '#E0E0E0'],
    brushSize: 6,
    hardness: 0.95,
    glow: 0.8,
    blurRadius: 3,
    bloomThreshold: 0.5,
    bloomStrength: 0.5,
    trail: 0.8,
    distortion: 0.0,
    noiseScale: 0.2,
    gradientSpeed: 0.4,
    chromaAberration: 0.0,
    background: '#040a0f',
  },

  // 8 — Hyperdrive speed lines: extreme bloom explosion, high energy
  {
    name: 'Hyperdrive Trails',
    renderMode: 'neon',
    palette: ['#FFD600', '#00E5FF', '#FF1744', '#76FF03', '#E040FB', '#FFFFFF'],
    brushSize: 18,
    hardness: 0.65,
    glow: 3.0,
    blurRadius: 30,
    bloomThreshold: 0.1,
    bloomStrength: 2.8,
    trail: 0.98,
    distortion: 0.4,
    noiseScale: 1.0,
    gradientSpeed: 0.6,
    chromaAberration: 0.3,
    background: '#050510',
  },

  // 9 — Ink in water: extremely soft, huge brush, heavy organic distortion
  {
    name: 'Ink in Water',
    renderMode: 'neon',
    palette: ['#7C4DFF', '#00E5FF', '#00FF8A', '#EA80FC', '#84FFFF', '#B388FF'],
    brushSize: 80,
    hardness: 0.08,
    glow: 1.0,
    blurRadius: 8,
    bloomThreshold: 0.4,
    bloomStrength: 0.6,
    trail: 0.95,
    distortion: 1.8,
    noiseScale: 4.0,
    gradientSpeed: 0.1,
    chromaAberration: 0.1,
    background: '#050510',
  },

  // 10 — Dark moody pulse: purples/pinks, moderate brush, pulsing gradient animation
  {
    name: 'Obsidian Pulse',
    renderMode: 'neon',
    palette: ['#9C27B0', '#00BCD4', '#E91E63', '#311B92', '#F06292', '#4DD0E1'],
    brushSize: 26,
    hardness: 0.55,
    glow: 2.2,
    blurRadius: 18,
    bloomThreshold: 0.18,
    bloomStrength: 1.8,
    trail: 0.91,
    distortion: 0.55,
    noiseScale: 1.6,
    gradientSpeed: 0.45,
    chromaAberration: 0.25,
    background: '#08030e',
  },

  // ======================= 3D Ribbon presets =======================

  // 11 — Warm sunset tube: glossy with warm oranges/pinks
  {
    name: 'Sunset Tube',
    renderMode: 'ribbon3d',
    palette: ['#FFD54F', '#FF8A65', '#EF5350', '#F06292', '#FFB74D', '#FFCC80'],
    brushSize: 40,
    hardness: 0.5,
    glow: 0.3,
    blurRadius: 3,
    bloomThreshold: 0.7,
    bloomStrength: 0.2,
    trail: 0.9,
    distortion: 0.0,
    noiseScale: 0.3,
    gradientSpeed: 0.15,
    chromaAberration: 0.0,
    background: '#0c0a18',
  },

  // 12 — Pastel candy plastic
  {
    name: 'Candy Ribbon',
    renderMode: 'ribbon3d',
    palette: ['#80DEEA', '#CE93D8', '#F48FB1', '#A5D6A7', '#FFF59D', '#90CAF9'],
    brushSize: 48,
    hardness: 0.4,
    glow: 0.2,
    blurRadius: 2,
    bloomThreshold: 0.8,
    bloomStrength: 0.15,
    trail: 0.92,
    distortion: 0.0,
    noiseScale: 0.2,
    gradientSpeed: 0.1,
    chromaAberration: 0.0,
    background: '#0a0a1a',
  },

  // 13 — Neon glow tube: vivid neon colors with strong bloom halo
  {
    name: 'Neon Glow Tube',
    renderMode: 'ribbon3d',
    palette: ['#00FF87', '#00E5FF', '#FF00E5', '#FFEA00', '#7C4DFF', '#76FF03'],
    brushSize: 32,
    hardness: 0.5,
    glow: 1.8,
    blurRadius: 18,
    bloomThreshold: 0.15,
    bloomStrength: 1.6,
    trail: 0.9,
    distortion: 0.0,
    noiseScale: 0.3,
    gradientSpeed: 0.3,
    chromaAberration: 0.08,
    background: '#04041a',
  },

  // 14 — Lava flow: deep reds/oranges with fiery glow
  {
    name: 'Lava Flow',
    renderMode: 'ribbon3d',
    palette: ['#FF1744', '#FF6D00', '#FFD600', '#BF360C', '#FF3D00', '#FFAB00'],
    brushSize: 44,
    hardness: 0.6,
    glow: 1.4,
    blurRadius: 14,
    bloomThreshold: 0.2,
    bloomStrength: 1.2,
    trail: 0.88,
    distortion: 0.0,
    noiseScale: 0.4,
    gradientSpeed: 0.2,
    chromaAberration: 0.0,
    background: '#0a0204',
  },

  // 15 — Deep ocean tube: bioluminescent cold blues/teals with heavy bloom
  {
    name: 'Biolume Tube',
    renderMode: 'ribbon3d',
    palette: ['#00E5FF', '#00BFA5', '#18FFFF', '#0047FF', '#00B8D4', '#80D8FF'],
    brushSize: 28,
    hardness: 0.4,
    glow: 2.4,
    blurRadius: 28,
    bloomThreshold: 0.12,
    bloomStrength: 2.0,
    trail: 0.95,
    distortion: 0.0,
    noiseScale: 0.5,
    gradientSpeed: 0.08,
    chromaAberration: 0.04,
    background: '#010810',
  },

  // 16 — Chrome pipe: metallic silver/gold reflections, minimal bloom
  {
    name: 'Chrome Pipe',
    renderMode: 'ribbon3d',
    palette: ['#E0E0E0', '#BDBDBD', '#FFD54F', '#B0BEC5', '#FFF9C4', '#ECEFF1'],
    brushSize: 36,
    hardness: 0.7,
    glow: 0.15,
    blurRadius: 2,
    bloomThreshold: 0.85,
    bloomStrength: 0.1,
    trail: 0.9,
    distortion: 0.0,
    noiseScale: 0.2,
    gradientSpeed: 0.05,
    chromaAberration: 0.0,
    background: '#0a0a14',
  },

  // 17 — Plasma tube: electric pinks/purples with intense glow halo
  {
    name: 'Plasma Tube',
    renderMode: 'ribbon3d',
    palette: ['#E040FB', '#FF4081', '#D500F9', '#AA00FF', '#F50057', '#EA80FC'],
    brushSize: 30,
    hardness: 0.55,
    glow: 2.2,
    blurRadius: 22,
    bloomThreshold: 0.15,
    bloomStrength: 1.8,
    trail: 0.9,
    distortion: 0.0,
    noiseScale: 0.3,
    gradientSpeed: 0.4,
    chromaAberration: 0.15,
    background: '#08020e',
  },

  // 18 — Emerald glass: rich greens with soft glow
  {
    name: 'Emerald Glass',
    renderMode: 'ribbon3d',
    palette: ['#00E676', '#69F0AE', '#1B5E20', '#00C853', '#A5D6A7', '#B9F6CA'],
    brushSize: 38,
    hardness: 0.45,
    glow: 1.0,
    blurRadius: 10,
    bloomThreshold: 0.35,
    bloomStrength: 0.8,
    trail: 0.92,
    distortion: 0.0,
    noiseScale: 0.3,
    gradientSpeed: 0.12,
    chromaAberration: 0.0,
    background: '#040e08',
  },

  // 19 — Holographic ribbon: rainbow with chromatic aberration glow
  {
    name: 'Holographic',
    renderMode: 'ribbon3d',
    palette: ['#FF1744', '#FFEA00', '#00E676', '#00B0FF', '#D500F9', '#FF6D00'],
    brushSize: 34,
    hardness: 0.5,
    glow: 1.6,
    blurRadius: 16,
    bloomThreshold: 0.2,
    bloomStrength: 1.4,
    trail: 0.9,
    distortion: 0.0,
    noiseScale: 0.3,
    gradientSpeed: 0.5,
    chromaAberration: 0.2,
    background: '#06061a',
  },

  // 20 — Ice crystal: frozen blues/whites with crisp glow
  {
    name: 'Ice Crystal',
    renderMode: 'ribbon3d',
    palette: ['#E1F5FE', '#B3E5FC', '#4FC3F7', '#0288D1', '#FFFFFF', '#81D4FA'],
    brushSize: 26,
    hardness: 0.65,
    glow: 1.2,
    blurRadius: 12,
    bloomThreshold: 0.3,
    bloomStrength: 1.0,
    trail: 0.88,
    distortion: 0.0,
    noiseScale: 0.2,
    gradientSpeed: 0.06,
    chromaAberration: 0.0,
    background: '#060a14',
  },

  // 21 — Solar flare: extreme bloom, white-hot center, yellows/reds
  {
    name: 'Solar Flare',
    renderMode: 'ribbon3d',
    palette: ['#FFFFFF', '#FFEE58', '#FF6F00', '#FF1744', '#FFD600', '#FFF9C4'],
    brushSize: 24,
    hardness: 0.6,
    glow: 2.8,
    blurRadius: 32,
    bloomThreshold: 0.1,
    bloomStrength: 2.4,
    trail: 0.85,
    distortion: 0.0,
    noiseScale: 0.4,
    gradientSpeed: 0.55,
    chromaAberration: 0.25,
    background: '#0a0504',
  },

  // 22 — Thin wire glow: ultra-thin tube with sharp concentrated glow
  {
    name: 'Glow Wire',
    renderMode: 'ribbon3d',
    palette: ['#00FFEA', '#FFFFFF', '#40C4FF', '#B2FF59', '#00E5FF', '#E0F7FA'],
    brushSize: 10,
    hardness: 0.85,
    glow: 2.0,
    blurRadius: 20,
    bloomThreshold: 0.18,
    bloomStrength: 1.6,
    trail: 0.85,
    distortion: 0.0,
    noiseScale: 0.2,
    gradientSpeed: 0.35,
    chromaAberration: 0.0,
    background: '#040a10',
  },
];
