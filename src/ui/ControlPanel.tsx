import React from 'react';
import { useStore, type PainterState } from '../store';
import PresetSelect from './PresetSelect';

// ---------------------------------------------------------------------------
// Small reusable components
// ---------------------------------------------------------------------------

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
        {title}
      </h3>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  storeKey,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  storeKey: keyof PainterState;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-[11px] text-gray-400 w-[88px] shrink-0 select-none">
        {label}
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) =>
          useStore.setState({
            [storeKey]: parseFloat(e.target.value),
            activePresetIndex: -1,
          } as Partial<PainterState>)
        }
        className="flex-1 cursor-pointer"
      />
      <span className="text-[10px] text-gray-500 w-9 text-right font-mono tabular-nums">
        {step < 1 ? value.toFixed(2) : Math.round(value)}
      </span>
    </div>
  );
}

function Btn({
  onClick,
  children,
  className = '',
}: {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-[11px] bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 rounded transition-colors select-none ${className}`}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------

interface ControlPanelProps {
  onClear: () => void;
}

export default function ControlPanel({ onClear }: ControlPanelProps) {
  const s = useStore();

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  return (
    <div className="fixed right-0 top-0 h-full w-[276px] bg-gray-950/90 backdrop-blur-xl border-l border-white/5 flex flex-col text-white z-50">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-white/5">
        <h1 className="text-xs font-bold tracking-widest text-cyan-400 uppercase">
          Neon Tubes Painter
        </h1>
      </div>

      {/* Scrollable controls */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
        {/* Preset selector */}
        <PresetSelect />

        {/* Palette */}
        <Section title="Palette">
          <div className="flex gap-2">
            {s.palette.map((color, i) => (
              <input
                key={i}
                type="color"
                value={color}
                onChange={(e) => {
                  const next = [...s.palette];
                  next[i] = e.target.value;
                  useStore.setState({ palette: next, activePresetIndex: -1 });
                }}
                className="w-8 h-8 rounded border border-white/10"
              />
            ))}
          </div>
        </Section>

        {/* Brush */}
        <Section title="Brush">
          <Slider label="Size" value={s.brushSize} min={1} max={120} step={1} storeKey="brushSize" />
          <Slider label="Hardness" value={s.hardness} min={0} max={1} step={0.01} storeKey="hardness" />
        </Section>

        {/* Glow & Bloom */}
        <Section title="Glow & Bloom">
          <Slider label="Glow" value={s.glow} min={0} max={3} step={0.1} storeKey="glow" />
          <Slider label="Blur Radius" value={s.blurRadius} min={1} max={40} step={1} storeKey="blurRadius" />
          <Slider label="Bloom Thr." value={s.bloomThreshold} min={0} max={1} step={0.01} storeKey="bloomThreshold" />
          <Slider label="Bloom Str." value={s.bloomStrength} min={0} max={3} step={0.1} storeKey="bloomStrength" />
        </Section>

        {/* Effects */}
        <Section title="Effects">
          <Slider label="Distortion" value={s.distortion} min={0} max={2} step={0.01} storeKey="distortion" />
          <Slider label="Noise Scale" value={s.noiseScale} min={0.1} max={5} step={0.1} storeKey="noiseScale" />
          <Slider label="Trail" value={s.trail} min={0} max={1} step={0.01} storeKey="trail" />
          <Slider label="Gradient Spd" value={s.gradientSpeed} min={0} max={1} step={0.01} storeKey="gradientSpeed" />
          <Slider label="Chroma Aberr." value={s.chromaAberration} min={0} max={1} step={0.01} storeKey="chromaAberration" />
        </Section>
      </div>

      {/* Footer actions */}
      <div className="px-4 py-3 border-t border-white/5 space-y-2">
        <div className="grid grid-cols-3 gap-1.5">
          <Btn onClick={s.randomize}>Random&nbsp;(R)</Btn>
          <Btn onClick={onClear}>Clear&nbsp;(C)</Btn>
          <Btn onClick={toggleFullscreen}>Full&nbsp;(F)</Btn>
        </div>
        <Btn onClick={s.toggleUI} className="w-full text-center">
          Hide UI&nbsp;&nbsp;(H)
        </Btn>
        <p className="text-[9px] text-gray-600 text-center leading-tight pt-0.5">
          For mobile fullscreen, install as PWA (Add to Home Screen)
        </p>
      </div>
    </div>
  );
}
