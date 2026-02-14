import * as PIXI from 'pixi.js';
import { AdvancedBloomFilter, RGBSplitFilter } from 'pixi-filters';
import type { RenderContext } from './createRenderer';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FilterContext {
  bloom: AdvancedBloomFilter;
  displacement: PIXI.DisplacementFilter;
  rgbSplit: RGBSplitFilter;
}

export interface FilterParams {
  renderMode: 'neon' | 'ribbon3d';
  glow: number;
  blurRadius: number;
  bloomThreshold: number;
  bloomStrength: number;
  distortion: number;
  noiseScale: number;
  chromaAberration: number;
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

export function setupFilters(ctx: RenderContext): FilterContext {
  const bloom = new AdvancedBloomFilter({
    threshold: 0.3,
    bloomScale: 1.5,
    brightness: 1.2,
    blur: 8,
    quality: 8,
  });
  bloom.padding = 40; // extra padding to prevent glow clipping at edges

  const displacement = new PIXI.DisplacementFilter(ctx.displacementSprite, 0);

  const rgbSplit = new RGBSplitFilter([0, 0], [0, 0], [0, 0]);

  // Bloom + chromatic aberration on the whole mainContainer (permanent + fx)
  ctx.mainContainer.filters = [bloom, rgbSplit];

  // Displacement ONLY on fxContainer (trail + active stroke) — permanent stays still
  ctx.fxContainer.filters = [displacement];

  return { bloom, displacement, rgbSplit };
}

// ---------------------------------------------------------------------------
// Update filter parameters from store state
// ---------------------------------------------------------------------------

export function updateFilters(fc: FilterContext, params: FilterParams): void {
  const isRibbon = params.renderMode === 'ribbon3d';

  // For ribbon3d: minimal/no post-processing to keep the clean 3D look
  const bloomMul = isRibbon ? 0.15 : 1;
  const chromaMul = isRibbon ? 0 : 1;
  const distMul = isRibbon ? 0.1 : 1;

  // Bloom / glow
  fc.bloom.threshold = isRibbon ? 0.85 : params.bloomThreshold;
  fc.bloom.bloomScale = params.bloomStrength * bloomMul;
  fc.bloom.blur = Math.max(1, params.blurRadius * bloomMul);
  fc.bloom.brightness = 1 + params.glow * 0.25 * bloomMul;

  // Displacement intensity (scaled up for visible effect)
  const scale = params.distortion * 30 * distMul;
  fc.displacement.scale.x = scale;
  fc.displacement.scale.y = scale;

  // Chromatic aberration
  const ca = params.chromaAberration * 6 * chromaMul;
  (fc.rgbSplit as any).red = [ca, 0];
  (fc.rgbSplit as any).green = [0, ca];
  (fc.rgbSplit as any).blue = [-ca, 0];
}

// ---------------------------------------------------------------------------
// Per-frame animation
// ---------------------------------------------------------------------------

export function animateFilters(
  ctx: RenderContext,
  time: number,
  noiseScale: number,
): void {
  // Slowly drift the displacement noise for a liquid feel
  ctx.displacementSprite.x = Math.sin(time * 0.25) * 30 * noiseScale + time * 4;
  ctx.displacementSprite.y = Math.cos(time * 0.35) * 30 * noiseScale + time * 3;
}
