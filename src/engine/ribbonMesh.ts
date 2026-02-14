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
// Geometry builder — triangle strip + semicircle caps
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

function buildRibbonGeometry(
  points: Point[],
  halfWidth: number,
  capSegments = 24,
): GeoData {
  const n = points.length;
  if (n < 2) return EMPTY_GEO;

  // Accumulated distances for UV.u
  const dists: number[] = [0];
  for (let i = 1; i < n; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    dists.push(dists[i - 1] + Math.sqrt(dx * dx + dy * dy));
  }
  const totalLen = dists[n - 1] || 1;

  // Tangent + normal per point
  const tang: { tx: number; ty: number; angle: number }[] = [];
  for (let i = 0; i < n; i++) {
    let tx: number;
    let ty: number;
    if (i === 0) {
      tx = points[1].x - points[0].x;
      ty = points[1].y - points[0].y;
    } else if (i === n - 1) {
      tx = points[n - 1].x - points[n - 2].x;
      ty = points[n - 1].y - points[n - 2].y;
    } else {
      tx = points[i + 1].x - points[i - 1].x;
      ty = points[i + 1].y - points[i - 1].y;
    }
    const l = Math.sqrt(tx * tx + ty * ty) || 1;
    tx /= l;
    ty /= l;
    tang.push({ tx, ty, angle: Math.atan2(ty, tx) });
  }

  const pos: number[] = [];
  const uv: number[] = [];
  const ta: number[] = [];
  const idx: number[] = [];

  // ---- Main ribbon strip (built first so caps can reference its vertices) ----
  const stripBase = 0;
  for (let i = 0; i < n; i++) {
    const nx = -tang[i].ty;
    const ny = tang[i].tx;
    const u = dists[i] / totalLen;

    // Left vertex v=0
    pos.push(points[i].x + nx * halfWidth, points[i].y + ny * halfWidth);
    uv.push(u, 0);
    ta.push(tang[i].angle);

    // Right vertex v=1
    pos.push(points[i].x - nx * halfWidth, points[i].y - ny * halfWidth);
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

  // Strip edge vertex indices for cap stitching
  const firstLeft = stripBase;                     // v=0
  const firstRight = stripBase + 1;                // v=1
  const lastLeft = stripBase + (n - 1) * 2;        // v=0
  const lastRight = stripBase + (n - 1) * 2 + 1;   // v=1

  // ---- Start cap (semicircle fan stitched to strip) ----
  // Arc goes from left edge (v=0) → back → right edge (v=1).
  // First and last arc vertices REUSE strip vertices for zero-gap seam.
  // Alpha is always 1.0 now — 3D lighting handles edge darkening.
  const capCenter0 = vi;
  pos.push(points[0].x, points[0].y);
  uv.push(0, 0.5);
  ta.push(tang[0].angle);
  vi++;

  // Interior arc vertices (s=1..capSegments-1) with proper v mapping
  const startArcBase = vi;
  const startArcCount = capSegments - 1;
  for (let s = 1; s < capSegments; s++) {
    const frac = s / capSegments;
    const a = tang[0].angle + Math.PI / 2 + Math.PI * frac;
    pos.push(
      points[0].x + Math.cos(a) * halfWidth,
      points[0].y + Math.sin(a) * halfWidth,
    );
    // v goes from 0 (left) through 0.5 (back) to 1 (right) for proper 3D shading
    uv.push(0, 1 - frac);
    ta.push(tang[0].angle);
    vi++;
  }
  // Fan triangles: firstLeft → interior arcs → firstRight
  if (startArcCount > 0) {
    idx.push(capCenter0, firstLeft, startArcBase);
    for (let s = 0; s < startArcCount - 1; s++) {
      idx.push(capCenter0, startArcBase + s, startArcBase + s + 1);
    }
    idx.push(capCenter0, startArcBase + startArcCount - 1, firstRight);
  } else {
    idx.push(capCenter0, firstLeft, firstRight);
  }

  // ---- End cap (semicircle fan stitched to strip) ----
  const capCenterN = vi;
  pos.push(points[n - 1].x, points[n - 1].y);
  uv.push(1, 0.5);
  ta.push(tang[n - 1].angle);
  vi++;

  // Interior arc vertices
  const endArcBase = vi;
  const endArcCount = capSegments - 1;
  for (let s = 1; s < capSegments; s++) {
    const frac = s / capSegments;
    const a = tang[n - 1].angle - Math.PI / 2 + Math.PI * frac;
    pos.push(
      points[n - 1].x + Math.cos(a) * halfWidth,
      points[n - 1].y + Math.sin(a) * halfWidth,
    );
    uv.push(1, frac);
    ta.push(tang[n - 1].angle);
    vi++;
  }
  // Fan triangles: lastRight → interior arcs → lastLeft
  if (endArcCount > 0) {
    idx.push(capCenterN, lastRight, endArcBase);
    for (let s = 0; s < endArcCount - 1; s++) {
      idx.push(capCenterN, endArcBase + s, endArcBase + s + 1);
    }
    idx.push(capCenterN, endArcBase + endArcCount - 1, lastLeft);
  } else {
    idx.push(capCenterN, lastRight, lastLeft);
  }

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
// Commit — create a standalone mesh for strokeLayer
// ---------------------------------------------------------------------------

export function commitRibbonToContainer(
  points: Point[],
  palette: string[],
  brushSize: number,
  gradientOffset: number,
): PIXI.Container {
  const container = new PIXI.Container();
  if (points.length < 2) return container;

  // Bake gradient texture for this committed stroke
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

  return container;
}
