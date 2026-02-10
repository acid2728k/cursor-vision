import { useStore } from '../store';
import { presets } from '../presets';

export default function PresetSelect() {
  const activePresetIndex = useStore((s) => s.activePresetIndex);
  const applyPreset = useStore((s) => s.applyPreset);

  return (
    <div>
      <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
        Preset
      </h3>
      <select
        value={activePresetIndex}
        onChange={(e) => {
          const idx = parseInt(e.target.value, 10);
          if (idx >= 0) applyPreset(idx);
        }}
        className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-white cursor-pointer outline-none focus:border-cyan-500/50 transition-colors"
      >
        {activePresetIndex === -1 && (
          <option value={-1}>— Custom —</option>
        )}
        {presets.map((p, i) => (
          <option key={i} value={i}>
            {p.name}
          </option>
        ))}
      </select>
    </div>
  );
}
