import * as PIXI from 'pixi.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Point {
  x: number;
  y: number;
}

export interface StrokeState {
  isDrawing: boolean;
  rawPoints: Point[];
  smoothedPoints: Point[];
}

/**
 * Two-layer drawing target: glow (with AlphaFilter for artifact-free
 * transparency) + body, wrapped in a Container.
 */
export interface StrokeGraphics {
  container: PIXI.Container;
  glowGfx: PIXI.Graphics;
  bodyGfx: PIXI.Graphics;
  /** Internal — uniform alpha applied to the entire glow layer */
  _glowAlpha: PIXI.AlphaFilter;
}

// ---------------------------------------------------------------------------
// State factory
// ---------------------------------------------------------------------------

const MIN_DISTANCE = 3;
const MAX_POINTS = 2000;

export function createStrokeState(): StrokeState {
  return {
    isDrawing: false,
    rawPoints: [],
    smoothedPoints: [],
  };
}

// ---------------------------------------------------------------------------
// StrokeGraphics factory
// ---------------------------------------------------------------------------

/**
 * Create a two-layer stroke target.  The glow layer has an AlphaFilter so
 * that segment overlaps are composited at full opacity first, then uniform
 * alpha is applied — eliminating the visible circle artefacts.
 */
export function createStrokeGraphics(
  blendMode: PIXI.BLEND_MODES = PIXI.BLEND_MODES.NORMAL,
): StrokeGraphics {
  const container = new PIXI.Container();

  const glowAlpha = new PIXI.AlphaFilter(1);
  const glowGfx = new PIXI.Graphics();
  glowGfx.blendMode = blendMode;
  glowGfx.filters = [glowAlpha];

  const bodyGfx = new PIXI.Graphics();
  bodyGfx.blendMode = blendMode;

  container.addChild(glowGfx, bodyGfx);

  return { container, glowGfx, bodyGfx, _glowAlpha: glowAlpha };
}

/** Clear both layers without destroying. */
export function clearStrokeGraphics(sg: StrokeGraphics): void {
  sg.glowGfx.clear();
  sg.bodyGfx.clear();
}

// ---------------------------------------------------------------------------
// Stroke lifecycle
// ---------------------------------------------------------------------------

export function startStroke(state: StrokeState, x: number, y: number): void {
  state.isDrawing = true;
  state.rawPoints = [{ x, y }];
  state.smoothedPoints = [{ x, y }];
}

export function addPoint(state: StrokeState, x: number, y: number): boolean {
  if (!state.isDrawing) return false;

  const last = state.rawPoints[state.rawPoints.length - 1];
  const dx = x - last.x;
  const dy = y - last.y;
  if (dx * dx + dy * dy < MIN_DISTANCE * MIN_DISTANCE) return false;

  if (state.rawPoints.length >= MAX_POINTS) {
    state.rawPoints.shift();
  }

  state.rawPoints.push({ x, y });
  state.smoothedPoints = smoothPoints(state.rawPoints);
  return true;
}

export function endStroke(state: StrokeState): void {
  state.isDrawing = false;
}

export function resetStroke(state: StrokeState): void {
  state.isDrawing = false;
  state.rawPoints = [];
  state.smoothedPoints = [];
}

// ---------------------------------------------------------------------------
// Catmull-Rom spline smoothing
// ---------------------------------------------------------------------------

export function smoothPoints(pts: Point[], segments = 3): Point[] {
  if (pts.length < 3) return [...pts];

  const out: Point[] = [];

  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];

    for (let t = 0; t < segments; t++) {
      const f = t / segments;
      const f2 = f * f;
      const f3 = f2 * f;

      out.push({
        x:
          0.5 *
          (2 * p1.x +
            (-p0.x + p2.x) * f +
            (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * f2 +
            (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * f3),
        y:
          0.5 *
          (2 * p1.y +
            (-p0.y + p2.y) * f +
            (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * f2 +
            (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * f3),
      });
    }
  }

  out.push(pts[pts.length - 1]);
  return out;
}

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

export function interpolateColor(palette: string[], t: number): number {
  t = ((t % 1) + 1) % 1;
  if (palette.length === 1) return parseInt(palette[0].replace('#', ''), 16);

  const seg = t * (palette.length - 1);
  const i = Math.min(Math.floor(seg), palette.length - 2);
  const f = seg - i;

  const c1 = hexToRgb(palette[i]);
  const c2 = hexToRgb(palette[i + 1]);

  const r = Math.round(c1[0] + (c2[0] - c1[0]) * f);
  const g = Math.round(c1[1] + (c2[1] - c1[1]) * f);
  const b = Math.round(c1[2] + (c2[2] - c1[2]) * f);

  return (r << 16) | (g << 8) | b;
}

// ---------------------------------------------------------------------------
// Draw stroke onto a StrokeGraphics (glow + body)
// ---------------------------------------------------------------------------

export function drawStroke(
  sg: StrokeGraphics,
  points: Point[],
  palette: string[],
  brushSize: number,
  hardness: number,
  gradientOffset: number = 0,
): void {
  sg.glowGfx.clear();
  sg.bodyGfx.clear();
  if (points.length < 2) return;

  const n = points.length;
  const colorSteps = Math.min(n - 1, 64);

  // helper: get start/end index for a color step
  const range = (c: number): [number, number] => {
    const from = Math.floor((c / colorSteps) * (n - 1));
    const to = Math.floor(((c + 1) / colorSteps) * (n - 1));
    return [from, to];
  };

  // ----- pass 1: soft outer glow -----
  // Drawn at FULL alpha onto glowGfx. The AlphaFilter on that Graphics
  // applies uniform transparency afterwards, so overlapping round-cap
  // circles don't produce visible artifacts.
  const glowMul = (1 - hardness) * 1.6;
  if (glowMul > 0.02) {
    const softW = brushSize * (1 + glowMul);
    const softA = 0.2 * (1 - hardness);
    sg._glowAlpha.alpha = softA;

    for (let c = 0; c < colorSteps; c++) {
      const t = ((c / Math.max(1, colorSteps - 1) + gradientOffset) % 1 + 1) % 1;
      const color = interpolateColor(palette, t);
      const [from, to] = range(c);
      if (to <= from) continue;

      sg.glowGfx.lineStyle({
        width: softW,
        color,
        alpha: 1, // full — AlphaFilter handles transparency
        cap: PIXI.LINE_CAP.ROUND,
        join: PIXI.LINE_JOIN.ROUND,
      });
      sg.glowGfx.moveTo(points[from].x, points[from].y);
      for (let i = from + 1; i <= to; i++) {
        sg.glowGfx.lineTo(points[i].x, points[i].y);
      }
    }
  } else {
    sg._glowAlpha.alpha = 0;
  }

  // ----- pass 2: main tube body -----
  for (let c = 0; c < colorSteps; c++) {
    const t = ((c / Math.max(1, colorSteps - 1) + gradientOffset) % 1 + 1) % 1;
    const color = interpolateColor(palette, t);
    const [from, to] = range(c);
    if (to <= from) continue;

    sg.bodyGfx.lineStyle({
      width: brushSize,
      color,
      alpha: 1,
      cap: PIXI.LINE_CAP.ROUND,
      join: PIXI.LINE_JOIN.ROUND,
    });
    sg.bodyGfx.moveTo(points[from].x, points[from].y);
    for (let i = from + 1; i <= to; i++) {
      sg.bodyGfx.lineTo(points[i].x, points[i].y);
    }
  }
}
