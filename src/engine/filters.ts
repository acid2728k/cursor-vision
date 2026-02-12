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
  // Bloom / glow
  fc.bloom.threshold = params.bloomThreshold;
  fc.bloom.bloomScale = params.bloomStrength;
  fc.bloom.blur = Math.max(1, params.blurRadius);
  fc.bloom.brightness = 1 + params.glow * 0.25;

  // Displacement intensity (scaled up for visible effect)
  const scale = params.distortion * 30;
  fc.displacement.scale.x = scale;
  fc.displacement.scale.y = scale;

  // Chromatic aberration
  const ca = params.chromaAberration * 6;
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
