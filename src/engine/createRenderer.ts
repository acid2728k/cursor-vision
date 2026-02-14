import * as PIXI from 'pixi.js';
import {
  createStrokeGraphics,
  clearStrokeGraphics,
  drawStroke,
  type Point,
  type StrokeGraphics,
} from './strokeSystem';
import {
  createRibbonStroke,
  updateRibbonStroke,
  clearRibbonStroke,
  commitRibbonToContainer,
  type RibbonStroke,
} from './ribbonMesh';
import type { RenderMode } from '../presets';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RenderContext {
  app: PIXI.Application;
  /** Neon circle-stamp active stroke. */
  activeStroke: StrokeGraphics;
  /** 3D ribbon active stroke. */
  activeRibbon: RibbonStroke;
  /** Container that holds committed stroke containers — children persist forever. */
  strokeLayer: PIXI.Container;
  /** Top-level container: bloom + chromatic aberration. */
  mainContainer: PIXI.Container;
  /** Sub-container for the live stroke — displacement applies only here. */
  fxContainer: PIXI.Container;
  displacementSprite: PIXI.Sprite;
}

// ---------------------------------------------------------------------------
// Noise texture generation (smooth value noise for displacement)
// ---------------------------------------------------------------------------

function generateNoiseTexture(size = 128): PIXI.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(size, size);

  const gs = 8;
  const grid: number[][] = [];
  for (let y = 0; y <= gs; y++) {
    grid[y] = [];
    for (let x = 0; x <= gs; x++) {
      grid[y][x] = Math.random();
    }
  }

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const gx = (px / size) * gs;
      const gy = (py / size) * gs;
      const x0 = Math.floor(gx);
      const y0 = Math.floor(gy);
      const x1 = Math.min(x0 + 1, gs);
      const y1 = Math.min(y0 + 1, gs);
      const fx = gx - x0;
      const fy = gy - y0;
      const sx = fx * fx * (3 - 2 * fx);
      const sy = fy * fy * (3 - 2 * fy);

      const v =
        (1 - sx) * (1 - sy) * grid[y0][x0] +
        sx * (1 - sy) * grid[y0][x1] +
        (1 - sx) * sy * grid[y1][x0] +
        sx * sy * grid[y1][x1];

      const val = Math.floor(v * 255);
      const idx = (py * size + px) * 4;
      img.data[idx] = val;
      img.data[idx + 1] = val;
      img.data[idx + 2] = val;
      img.data[idx + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
  return PIXI.Texture.from(canvas);
}

// ---------------------------------------------------------------------------
// Renderer factory
// ---------------------------------------------------------------------------

export function createRenderer(container: HTMLElement): RenderContext {
  const app = new PIXI.Application({
    resizeTo: window,
    backgroundColor: 0x0a0a1a,
    antialias: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    autoDensity: true,
  });

  const view = app.view as HTMLCanvasElement;
  view.style.touchAction = 'none';
  view.style.position = 'absolute';
  view.style.top = '0';
  view.style.left = '0';
  container.appendChild(view);

  // --- committed strokes live here as Container children (never removed) ---
  const strokeLayer = new PIXI.Container();

  // --- live drawing: neon mode ---
  const activeStroke = createStrokeGraphics(PIXI.BLEND_MODES.ADD);

  // --- live drawing: ribbon3d mode ---
  const activeRibbon = createRibbonStroke();

  const fxContainer = new PIXI.Container();
  fxContainer.addChild(activeStroke.container);
  fxContainer.addChild(activeRibbon.container);

  // --- scene graph ---
  const mainContainer = new PIXI.Container();
  mainContainer.addChild(strokeLayer);
  mainContainer.addChild(fxContainer);

  // Fix bloom clipping: force filter area to cover the full screen
  mainContainer.filterArea = new PIXI.Rectangle(
    0, 0, app.screen.width, app.screen.height,
  );

  // --- displacement sprite ---
  const noiseTexture = generateNoiseTexture(128);
  const displacementSprite = new PIXI.Sprite(noiseTexture);
  displacementSprite.texture.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;
  displacementSprite.width = app.screen.width;
  displacementSprite.height = app.screen.height;

  app.stage.addChild(displacementSprite);
  app.stage.addChild(mainContainer);

  return {
    app,
    activeStroke,
    activeRibbon,
    strokeLayer,
    mainContainer,
    fxContainer,
    displacementSprite,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse a CSS hex color string to a numeric color value */
export function hexToNum(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

/**
 * Commit the current neon stroke into strokeLayer.
 */
export function commitNeonStroke(
  ctx: RenderContext,
  points: Point[],
  palette: string[],
  brushSize: number,
  hardness: number,
  gradientOffset: number,
): void {
  if (points.length < 2) {
    clearStrokeGraphics(ctx.activeStroke);
    return;
  }

  const committed = createStrokeGraphics();
  drawStroke(committed, points, palette, brushSize, hardness, gradientOffset);
  ctx.strokeLayer.addChild(committed.container);
  clearStrokeGraphics(ctx.activeStroke);
}

/**
 * Commit the current ribbon stroke into strokeLayer.
 */
export function commitRibbonStroke(
  ctx: RenderContext,
  points: Point[],
  palette: string[],
  brushSize: number,
  gradientOffset: number,
): void {
  if (points.length < 2) {
    clearRibbonStroke(ctx.activeRibbon);
    return;
  }

  const committed = commitRibbonToContainer(points, palette, brushSize, gradientOffset);
  ctx.strokeLayer.addChild(committed);
  clearRibbonStroke(ctx.activeRibbon);
}

/**
 * Commit active stroke — dispatches to the correct mode.
 */
export function commitActiveStroke(
  ctx: RenderContext,
  renderMode: RenderMode,
  points: Point[],
  palette: string[],
  brushSize: number,
  hardness: number,
  gradientOffset: number,
): void {
  if (renderMode === 'ribbon3d') {
    commitRibbonStroke(ctx, points, palette, brushSize, gradientOffset);
  } else {
    commitNeonStroke(ctx, points, palette, brushSize, hardness, gradientOffset);
  }
}

/** Remove all committed strokes */
export function clearCanvas(ctx: RenderContext): void {
  ctx.strokeLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
}

/** Handle window resize */
export function handleResize(ctx: RenderContext): void {
  ctx.displacementSprite.width = ctx.app.screen.width;
  ctx.displacementSprite.height = ctx.app.screen.height;

  mainContainerResize(ctx);
}

function mainContainerResize(ctx: RenderContext): void {
  ctx.mainContainer.filterArea = new PIXI.Rectangle(
    0, 0, ctx.app.screen.width, ctx.app.screen.height,
  );
}

/** Destroy the renderer and free resources */
export function destroyRenderer(ctx: RenderContext): void {
  ctx.app.destroy(true, { children: true, texture: true, baseTexture: true });
}
