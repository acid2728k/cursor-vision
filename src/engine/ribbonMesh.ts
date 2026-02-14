import * as PIXI from 'pixi.js';
import type { Point } from './strokeSystem';

// ---------------------------------------------------------------------------
// GLSL sources
// ---------------------------------------------------------------------------

const VERTEX_SRC = `
attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;
attribute float aTangentAngle;

uniform mat3 translationMatrix;
uniform mat3 projectionMatrix;

varying vec2 vUv;
varying float vTangentAngle;

void main() {
  vUv = aTextureCoord;
  vTangentAngle = aTangentAngle;
  gl_Position = vec4(
    (projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy,
    0.0, 1.0
  );
}
`;

const FRAGMENT_SRC = `
precision highp float;

varying vec2 vUv;
varying float vTangentAngle;

uniform sampler2D uGradientTex;
uniform float uGradientOffset;

// Lighting
uniform vec2 uLightDir;      // normalised 2D light direction
uniform float uAmbient;       // 0.2 – 0.45
uniform float uSpecPower;     // 16 – 64
uniform float uSpecIntensity; // 0.3 – 0.9

void main() {
  float u = vUv.x;
  float v = vUv.y;

  // Base colour from gradient texture (animated offset)
  float gradT = fract(u + uGradientOffset);
  vec3 baseColor = texture2D(uGradientTex, vec2(gradT, 0.5)).rgb;

  // Cylindrical surface normal
  float x = (v - 0.5) * 2.0;          // -1 → 1
  float z = sqrt(max(0.0, 1.0 - x * x));
  vec3 N = normalize(vec3(x, 0.0, z));

  // Rotate light direction by local tangent angle
  float ca = cos(vTangentAngle);
  float sa = sin(vTangentAngle);
  vec3 L = normalize(vec3(
    uLightDir.x * ca + uLightDir.y * sa,
   -uLightDir.x * sa + uLightDir.y * ca,
    0.55
  ));

  // Diffuse
  float diff = max(dot(N, L), 0.0);
  float lighting = uAmbient + (1.0 - uAmbient) * diff;

  // Blinn-Phong specular
  vec3 V = vec3(0.0, 0.0, 1.0);
  vec3 H = normalize(L + V);
  float spec = pow(max(dot(N, H), 0.0), uSpecPower);

  // Rim darkening replaces transparency — the cylindrical normal already
  // makes edges dark; add a pow() rim term for extra falloff so edges
  // blend naturally into the dark background without any alpha tricks.
  float rim = pow(z, 0.4);  // z=1 at center, z→0 at edges

  vec3 color = baseColor * lighting * rim + vec3(1.0) * spec * uSpecIntensity;
  gl_FragColor = vec4(color, 1.0);
}
`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RibbonStroke {
  container: PIXI.Container;
  mesh: PIXI.Mesh<PIXI.Shader>;
  geometry: PIXI.Geometry;
  shader: PIXI.Shader;
  gradientCanvas: HTMLCanvasElement;
  gradientTexture: PIXI.Texture;
}

// ---------------------------------------------------------------------------
// Gradient texture helpers
// ---------------------------------------------------------------------------

function drawGradient(canvas: HTMLCanvasElement, palette: string[]): void {
  const ctx = canvas.getContext('2d')!;
  const w = canvas.width;
  const grad = ctx.createLinearGradient(0, 0, w, 0);
  for (let i = 0; i < palette.length; i++) {
    grad.addColorStop(i / Math.max(1, palette.length - 1), palette[i]);
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, 1);
}

// ---------------------------------------------------------------------------
// Geometry builder — triangle strip + hemisphere taper caps
// ---------------------------------------------------------------------------

interface GeoData {
  positions: Float32Array;
  uvs: Float32Array;
  tangentAngles: Float32Array;
  indices: Uint16Array;
}

const EMPTY_GEO: GeoData = {
  positions: new Float32Array([0, 0, 1, 0, 0, 1]),
  uvs: new Float32Array([0, 0, 0, 0, 0, 0]),
  tangentAngles: new Float32Array([0, 0, 0]),
  indices: new Uint16Array([0, 1, 2]),
};

/**
 * Helper: add hemisphere taper rings to close one end of the ribbon.
 * Instead of a flat fan, we extrude concentric rings that follow a
 * hemisphere profile (cos/sin) — each ring is a narrow strip pair
 * that smoothly tapers from full width → 0, creating a dome.
 *
 * @param dir  +1 = extend forward (end cap), -1 = extend backward (start cap)
 */
function addTaperCap(
  origin: Point,
  tangent: { tx: number; ty: number; angle: number },
  halfW: number,
  capU: number, // u value for all cap vertices (0 or 1)
  dir: number,  // +1 end, -1 start
  taperSteps: number,
  prevLeft: number,
  prevRight: number,
  pos: number[],
  uvArr: number[],
  ta: number[],
  idx: number[],
  viStart: number,
): number {
  let vi = viStart;
  const nx = -tangent.ty;
  const ny = tangent.tx;

  let pL = prevLeft;
  let pR = prevRight;

  for (let k = 1; k <= taperSteps; k++) {
    const frac = k / taperSteps;
    const ang = frac * Math.PI / 2; // 0 → π/2
    const ringW = halfW * Math.cos(ang);    // full → 0
    const axial = halfW * Math.sin(ang);    // 0 → halfW

    const cx = origin.x + tangent.tx * axial * dir;
    const cy = origin.y + tangent.ty * axial * dir;

    if (k < taperSteps) {
      // Two vertices: left (v=0) and right (v=1)
      const lx = cx + nx * ringW;
      const ly = cy + ny * ringW;
      const rx = cx - nx * ringW;
      const ry = cy - ny * ringW;

      const curL = vi;
      pos.push(lx, ly);
      uvArr.push(capU, 0);
      ta.push(tangent.angle);
      vi++;

      const curR = vi;
      pos.push(rx, ry);
      uvArr.push(capU, 1);
      ta.push(tangent.angle);
      vi++;

      // Connect to previous ring pair
      idx.push(pL, pR, curL);
      idx.push(pR, curR, curL);
      pL = curL;
      pR = curR;
    } else {
      // Final pole vertex (v=0.5, center)
      const pole = vi;
      pos.push(cx, cy);
      uvArr.push(capU, 0.5);
      ta.push(tangent.angle);
      vi++;

      // Two triangles closing to the pole
      idx.push(pL, pR, pole);
    }
  }
  return vi;
}

function buildRibbonGeometry(
  points: Point[],
  halfWidth: number,
): GeoData {
  const n = points.length;
  if (n < 2) return EMPTY_GEO;

  const TAPER_STEPS = 14;

  // Accumulated distances for UV.u
  const dists: number[] = [0];
  for (let i = 1; i < n; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    dists.push(dists[i - 1] + Math.sqrt(dx * dx + dy * dy));
  }
  const totalLen = dists[n - 1] || 1;

  // Per-segment direction and normal (for miter calculation)
  const segDir: { dx: number; dy: number; nx: number; ny: number }[] = [];
  for (let i = 0; i < n - 1; i++) {
    let dx = points[i + 1].x - points[i].x;
    let dy = points[i + 1].y - points[i].y;
    const l = Math.sqrt(dx * dx + dy * dy) || 1;
    dx /= l;
    dy /= l;
    segDir.push({ dx, dy, nx: -dy, ny: dx });
  }

  // Tangent per point (averaged) — used for shader lighting angle
  const tang: { tx: number; ty: number; angle: number }[] = [];
  for (let i = 0; i < n; i++) {
    let tx: number;
    let ty: number;
    if (i === 0) {
      tx = segDir[0].dx;
      ty = segDir[0].dy;
    } else if (i === n - 1) {
      tx = segDir[n - 2].dx;
      ty = segDir[n - 2].dy;
    } else {
      tx = segDir[i - 1].dx + segDir[i].dx;
      ty = segDir[i - 1].dy + segDir[i].dy;
      const l = Math.sqrt(tx * tx + ty * ty) || 1;
      tx /= l;
      ty /= l;
    }
    tang.push({ tx, ty, angle: Math.atan2(ty, tx) });
  }

  // Unwrap tangent angles so consecutive values don't jump by ~2π.
  // This prevents the shader's light-rotation interpolation from glitching.
  for (let i = 1; i < n; i++) {
    while (tang[i].angle - tang[i - 1].angle > Math.PI) tang[i].angle -= 2 * Math.PI;
    while (tang[i].angle - tang[i - 1].angle < -Math.PI) tang[i].angle += 2 * Math.PI;
  }

  const pos: number[] = [];
  const uv: number[] = [];
  const ta: number[] = [];
  const idx: number[] = [];

  const MITER_LIMIT = 2.0; // max miter scale before clamping

  // ---- Main ribbon strip with miter joins ----
  const stripBase = 0;
  for (let i = 0; i < n; i++) {
    const u = dists[i] / totalLen;

    let offx: number;
    let offy: number;

    if (i === 0) {
      // First point: perpendicular to first segment
      offx = segDir[0].nx * halfWidth;
      offy = segDir[0].ny * halfWidth;
    } else if (i === n - 1) {
      // Last point: perpendicular to last segment
      offx = segDir[n - 2].nx * halfWidth;
      offy = segDir[n - 2].ny * halfWidth;
    } else {
      // Interior point: proper miter join
      const n1x = segDir[i - 1].nx;
      const n1y = segDir[i - 1].ny;
      const n2x = segDir[i].nx;
      const n2y = segDir[i].ny;

      // Miter direction = bisector of the two segment normals
      let mx = n1x + n2x;
      let my = n1y + n2y;
      const ml = Math.sqrt(mx * mx + my * my);

      if (ml < 1e-6) {
        // ~180° turn — normals cancel; just use first segment normal
        offx = n1x * halfWidth;
        offy = n1y * halfWidth;
      } else {
        mx /= ml;
        my /= ml;

        // Miter length = halfWidth / cos(halfAngle)
        const dot = mx * n1x + my * n1y;
        const scale = Math.min(1 / Math.max(dot, 0.01), MITER_LIMIT);

        offx = mx * halfWidth * scale;
        offy = my * halfWidth * scale;
      }
    }

    // Left vertex v=0
    pos.push(points[i].x + offx, points[i].y + offy);
    uv.push(u, 0);
    ta.push(tang[i].angle);

    // Right vertex v=1
    pos.push(points[i].x - offx, points[i].y - offy);
    uv.push(u, 1);
    ta.push(tang[i].angle);

    if (i > 0) {
      const c = stripBase + i * 2;
      const p = c - 2;
      idx.push(p, p + 1, c);
      idx.push(p + 1, c + 1, c);
    }
  }
  let vi = n * 2;

  // ---- Start cap (hemisphere taper, extends backward) ----
  const firstLeft = stripBase;
  const firstRight = stripBase + 1;
  vi = addTaperCap(
    points[0], tang[0], halfWidth,
    0, -1, TAPER_STEPS,
    firstLeft, firstRight,
    pos, uv, ta, idx, vi,
  );

  // ---- End cap (hemisphere taper, extends forward) ----
  const lastLeft = stripBase + (n - 1) * 2;
  const lastRight = stripBase + (n - 1) * 2 + 1;
  vi = addTaperCap(
    points[n - 1], tang[n - 1], halfWidth,
    1, +1, TAPER_STEPS,
    lastLeft, lastRight,
    pos, uv, ta, idx, vi,
  );

  return {
    positions: new Float32Array(pos),
    uvs: new Float32Array(uv),
    tangentAngles: new Float32Array(ta),
    indices: new Uint16Array(idx),
  };
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createRibbonStroke(): RibbonStroke {
  const container = new PIXI.Container();

  const gradientCanvas = document.createElement('canvas');
  gradientCanvas.width = 512;
  gradientCanvas.height = 1;
  // Fill with white default
  const tCtx = gradientCanvas.getContext('2d')!;
  tCtx.fillStyle = '#fff';
  tCtx.fillRect(0, 0, 512, 1);

  const gradientTexture = PIXI.Texture.from(gradientCanvas);
  gradientTexture.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;

  const shader = PIXI.Shader.from(VERTEX_SRC, FRAGMENT_SRC, {
    uGradientTex: gradientTexture,
    uGradientOffset: 0,
    uLightDir: [0.5, -0.7],
    uAmbient: 0.3,
    uSpecPower: 32.0,
    uSpecIntensity: 0.55,
  });

  // Placeholder geometry (will be replaced on first update)
  const geometry = new PIXI.Geometry()
    .addAttribute('aVertexPosition', EMPTY_GEO.positions as any, 2)
    .addAttribute('aTextureCoord', EMPTY_GEO.uvs as any, 2)
    .addAttribute('aTangentAngle', EMPTY_GEO.tangentAngles as any, 1)
    .addIndex(Array.from(EMPTY_GEO.indices));

  const mesh = new PIXI.Mesh(geometry, shader as any);
  mesh.visible = false;
  container.addChild(mesh);

  return { container, mesh, geometry, shader, gradientCanvas, gradientTexture };
}

// ---------------------------------------------------------------------------
// Per-frame update (active stroke)
// ---------------------------------------------------------------------------

export function updateRibbonStroke(
  ribbon: RibbonStroke,
  points: Point[],
  palette: string[],
  brushSize: number,
  gradientOffset: number,
): void {
  if (points.length < 2) {
    ribbon.mesh.visible = false;
    return;
  }

  // Update gradient texture
  drawGradient(ribbon.gradientCanvas, palette);
  ribbon.gradientTexture.baseTexture.update();

  // Update shader uniforms
  ribbon.shader.uniforms.uGradientOffset = gradientOffset;

  // Build geometry
  const geo = buildRibbonGeometry(points, brushSize / 2);

  // Update GPU buffers in-place
  const posBuf = ribbon.geometry.getBuffer('aVertexPosition');
  (posBuf as any).data = geo.positions;
  posBuf.update();

  const uvBuf = ribbon.geometry.getBuffer('aTextureCoord');
  (uvBuf as any).data = geo.uvs;
  uvBuf.update();

  const taBuf = ribbon.geometry.getBuffer('aTangentAngle');
  (taBuf as any).data = geo.tangentAngles;
  taBuf.update();

  const idxBuf = ribbon.geometry.getIndex();
  (idxBuf as any).data = geo.indices;
  idxBuf.update();

  ribbon.mesh.visible = true;
}

// ---------------------------------------------------------------------------
// Clear (hide)
// ---------------------------------------------------------------------------

export function clearRibbonStroke(ribbon: RibbonStroke): void {
  ribbon.mesh.visible = false;
}

// ---------------------------------------------------------------------------
// Committed ribbon data — kept alive so we can update palette / offset later
// ---------------------------------------------------------------------------

export interface CommittedRibbonData {
  canvas: HTMLCanvasElement;
  texture: PIXI.Texture;
  shader: PIXI.Shader;
}

// ---------------------------------------------------------------------------
// Commit — create a standalone mesh for strokeLayer
// ---------------------------------------------------------------------------

export function commitRibbonToContainer(
  points: Point[],
  palette: string[],
  brushSize: number,
  gradientOffset: number,
): { container: PIXI.Container; data: CommittedRibbonData | null } {
  const container = new PIXI.Container();
  if (points.length < 2) return { container, data: null };

  // Gradient texture for this committed stroke
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1;
  drawGradient(canvas, palette);
  const texture = PIXI.Texture.from(canvas);
  texture.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;

  // Build geometry
  const geo = buildRibbonGeometry(points, brushSize / 2);

  const geometry = new PIXI.Geometry()
    .addAttribute('aVertexPosition', geo.positions as any, 2)
    .addAttribute('aTextureCoord', geo.uvs as any, 2)
    .addAttribute('aTangentAngle', geo.tangentAngles as any, 1)
    .addIndex(Array.from(geo.indices));

  const shader = PIXI.Shader.from(VERTEX_SRC, FRAGMENT_SRC, {
    uGradientTex: texture,
    uGradientOffset: gradientOffset,
    uLightDir: [0.5, -0.7],
    uAmbient: 0.3,
    uSpecPower: 32.0,
    uSpecIntensity: 0.55,
  });

  const mesh = new PIXI.Mesh(geometry, shader as any);
  container.addChild(mesh);

  return { container, data: { canvas, texture, shader } };
}

// ---------------------------------------------------------------------------
// Update all committed ribbons — call every frame or on palette change
// ---------------------------------------------------------------------------

export function updateCommittedRibbons(
  ribbons: CommittedRibbonData[],
  palette: string[],
  gradientOffset: number,
): void {
  for (const r of ribbons) {
    drawGradient(r.canvas, palette);
    r.texture.baseTexture.update();
    r.shader.uniforms.uGradientOffset = gradientOffset;
  }
}
