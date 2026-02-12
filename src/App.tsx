import { useEffect, useRef, useCallback } from 'react';
import { useStore } from './store';

import {
  createRenderer,
  commitActiveStroke,
  clearCanvas,
  handleResize,
  destroyRenderer,
  hexToNum,
  type RenderContext,
} from './engine/createRenderer';

import {
  createStrokeState,
  startStroke,
  addPoint,
  endStroke,
  resetStroke,
  drawStroke,
  type StrokeState,
} from './engine/strokeSystem';

import {
  setupFilters,
  updateFilters,
  animateFilters,
  type FilterContext,
} from './engine/filters';

import ControlPanel from './ui/ControlPanel';

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const ctxRef = useRef<RenderContext | null>(null);
  const strokeRef = useRef<StrokeState>(createStrokeState());
  const filterRef = useRef<FilterContext | null>(null);
  const timeRef = useRef(0);
  const lastSizeRef = useRef({ w: 0, h: 0 });

  const uiVisible = useStore((s) => s.uiVisible);

  // -----------------------------------------------------------------------
  // Clear handler (passed to UI)
  // -----------------------------------------------------------------------
  const handleClear = useCallback(() => {
    if (ctxRef.current) clearCanvas(ctxRef.current);
  }, []);

  // -----------------------------------------------------------------------
  // Initialize renderer, filters, events, ticker
  // -----------------------------------------------------------------------
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- Renderer ---
    const ctx = createRenderer(container);
    ctxRef.current = ctx;

    // --- Filters ---
    const fc = setupFilters(ctx);
    filterRef.current = fc;

    // Apply initial state
    const initState = useStore.getState();
    updateFilters(fc, initState);
    ctx.app.renderer.background.color = hexToNum(initState.background);

    // --- Subscribe to store for filter/parameter updates ---
    const unsub = useStore.subscribe((state) => {
      updateFilters(fc, state);
      ctx.app.renderer.background.color = hexToNum(state.background);
    });

    // --- Pointer events ---
    const canvas = ctx.app.view as HTMLCanvasElement;
    const stroke = strokeRef.current;

    const onPointerDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement) !== canvas) return;
      canvas.setPointerCapture(e.pointerId);
      startStroke(stroke, e.clientX, e.clientY);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!stroke.isDrawing) return;
      const events = (e as any).getCoalescedEvents?.() ?? [e];
      for (const ce of events) {
        addPoint(stroke, ce.clientX, ce.clientY);
      }
    };

    const onPointerUp = () => {
      if (!stroke.isDrawing) return;
      const state = useStore.getState();
      const gradientOffset = timeRef.current * state.gradientSpeed;
      commitActiveStroke(
        ctx,
        stroke.smoothedPoints,
        state.palette,
        state.brushSize,
        state.hardness,
        gradientOffset,
      );
      endStroke(stroke);
      resetStroke(stroke);
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);

    // --- Main render loop ---
    lastSizeRef.current = { w: ctx.app.screen.width, h: ctx.app.screen.height };

    ctx.app.ticker.add((delta) => {
      timeRef.current += delta / 60;
      const state = useStore.getState();

      // Check for resize
      const sw = ctx.app.screen.width;
      const sh = ctx.app.screen.height;
      if (sw !== lastSizeRef.current.w || sh !== lastSizeRef.current.h) {
        handleResize(ctx);
        lastSizeRef.current = { w: sw, h: sh };
      }

      // Redraw active stroke each frame (for animated gradient)
      if (stroke.isDrawing && stroke.smoothedPoints.length >= 2) {
        const gradientOffset = timeRef.current * state.gradientSpeed;
        drawStroke(
          ctx.activeStroke,
          stroke.smoothedPoints,
          state.palette,
          state.brushSize,
          state.hardness,
          gradientOffset,
        );
      }

      // Animate displacement
      animateFilters(ctx, timeRef.current, state.noiseScale);
    });

    // --- Cleanup ---
    return () => {
      unsub();
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      destroyRenderer(ctx);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -----------------------------------------------------------------------
  // Keyboard shortcuts
  // -----------------------------------------------------------------------
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

      switch (e.key.toLowerCase()) {
        case 'h':
          useStore.getState().toggleUI();
          break;
        case 'f':
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            document.documentElement.requestFullscreen().catch(() => {});
          }
          break;
        case 'c':
          if (ctxRef.current) clearCanvas(ctxRef.current);
          break;
        case 'r':
          useStore.getState().randomize();
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div className="w-full h-full relative overflow-hidden">
      <div ref={containerRef} className="absolute inset-0" />

      {!uiVisible && (
        <button
          onClick={() => useStore.getState().toggleUI()}
          className="fixed top-3 right-3 z-50 px-3 py-1.5 text-[11px] text-white/60 hover:text-white bg-black/40 hover:bg-black/60 backdrop-blur rounded border border-white/10 transition-all"
        >
          Show UI (H)
        </button>
      )}

      {uiVisible && <ControlPanel onClear={handleClear} />}
    </div>
  );
}
