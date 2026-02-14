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

  // ---------- 3D Ribbon presets ----------

  // 11 — Warm sunset 3D ribbon: glossy tube with warm oranges/pinks
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

  // 12 — Cool candy 3D ribbon: pastel plastic look
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
];
