import React, { useEffect, useState } from 'react';
import { Pad } from './DrumPadGrid';

export type MidiToKeys = Record<number, string[]>;

type Props = {
  pads: Pad[];
  value: MidiToKeys;
  onChange: (next: MidiToKeys) => void;
};

export const KeyMappingEditor: React.FC<Props> = ({ pads, value, onChange }) => {
  const [listeningFor, setListeningFor] = useState<number | null>(null);

  useEffect(() => {
    if (listeningFor == null) return;
    const handler = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      e.preventDefault();
      // Move key from any existing midi to the requested one, then add
      const next: MidiToKeys = Object.fromEntries(
        Object.entries(value).map(([m, keys]) => [m, keys.filter((k) => k !== key)])
      );
      next[listeningFor] = Array.from(new Set([...(next[listeningFor] || []), key]));
      onChange(next);
      setListeningFor(null);
    };
    window.addEventListener('keydown', handler, { once: true });
    return () => window.removeEventListener('keydown', handler);
  }, [listeningFor, value, onChange]);

  const removeKey = (midi: number, key: string) => {
    const list = value[midi] || [];
    const next = { ...value, [midi]: list.filter((k) => k !== key) };
    onChange(next);
  };

  return (
    <div className="w-full max-w-3xl rounded border border-slate-600 p-4 bg-slate-900/50">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold">Key Mapping</h2>
        {listeningFor != null && (
          <div className="text-xs text-amber-300">Press any key to map…</div>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {pads.map((p) => (
          <div key={p.id} className="rounded border border-slate-700 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">{p.label}</div>
              <button
                className="text-xs px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500"
                onClick={() => setListeningFor(p.midi)}
              >
                {listeningFor === p.midi ? 'Listening…' : 'Add key'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(value[p.midi] || []).map((k) => (
                <span key={k} className="text-xs bg-slate-800 border border-slate-600 rounded px-2 py-0.5 inline-flex items-center gap-1">
                  {k.toUpperCase()}
                  <button
                    aria-label="Remove"
                    className="ml-1 opacity-70 hover:opacity-100"
                    onClick={() => removeKey(p.midi, k)}
                  >
                    ×
                  </button>
                </span>
              ))}
              {value[p.midi]?.length ? null : (
                <span className="text-xs text-slate-400">No keys mapped</span>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="text-[11px] text-slate-400 mt-3">
        Tip: You can map multiple keys to the same drum to play faster. Mapping a key moves it from any other drum.
      </div>
    </div>
  );
};

