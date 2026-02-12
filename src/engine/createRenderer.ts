import * as PIXI from 'pixi.js';
import { drawStroke, type Point } from './strokeSystem';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RenderContext {
  app: PIXI.Application;
  activeGfx: PIXI.Graphics;
  /** Container that holds committed stroke Graphics — children persist forever. */
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

  // --- committed strokes live here as Graphics children (never removed) ---
  const strokeLayer = new PIXI.Container();

  // --- live drawing (displacement applied only here) ---
  const activeGfx = new PIXI.Graphics();
  activeGfx.blendMode = PIXI.BLEND_MODES.ADD;

  const fxContainer = new PIXI.Container();
  fxContainer.addChild(activeGfx);

  // --- scene graph ---
  const mainContainer = new PIXI.Container();
  mainContainer.addChild(strokeLayer);
  mainContainer.addChild(fxContainer);

  // Fix bloom clipping: force filter area to cover the full screen so the
  // glow is never clipped at stroke bounding-box edges.
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
    activeGfx,
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
 * Commit the current stroke: clone it into a permanent Graphics child
 * inside strokeLayer. No render-to-texture — the Graphics stays in the
 * scene graph forever (until Clear is pressed).
 */
export function commitActiveStroke(
  ctx: RenderContext,
  points: Point[],
  palette: string[],
  brushSize: number,
  hardness: number,
  gradientOffset: number,
): void {
  if (points.length < 2) {
    ctx.activeGfx.clear();
    return;
  }

  // Create a new Graphics that lives permanently in strokeLayer
  const committed = new PIXI.Graphics();
  drawStroke(committed, points, palette, brushSize, hardness, gradientOffset);
  ctx.strokeLayer.addChild(committed);

  // Clear the live drawing graphics
  ctx.activeGfx.clear();
}

/** Remove all committed strokes */
export function clearCanvas(ctx: RenderContext): void {
  ctx.strokeLayer.removeChildren().forEach((c) => c.destroy());
}

/** Handle window resize */
export function handleResize(ctx: RenderContext): void {
  ctx.displacementSprite.width = ctx.app.screen.width;
  ctx.displacementSprite.height = ctx.app.screen.height;

  // Keep filter area in sync so bloom is never clipped
  ctx.mainContainer.filterArea = new PIXI.Rectangle(
    0, 0, ctx.app.screen.width, ctx.app.screen.height,
  );
}

/** Destroy the renderer and free resources */
export function destroyRenderer(ctx: RenderContext): void {
  ctx.app.destroy(true, { children: true, texture: true, baseTexture: true });
}
