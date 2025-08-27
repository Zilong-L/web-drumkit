import React from 'react';

type Props = {
  label: string;
  midi: number;
  trigger: (midi: number, velocity?: number) => void;
  stop?: (midi: number) => void;
  hotkey?: string; // display only
  active?: boolean;
};

export const DrumPad: React.FC<Props> = ({ label, midi, trigger, stop, hotkey, active }) => {
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const accent = e.shiftKey ? 120 : 100;
    trigger(midi, accent);
  };
  const onMouseUp = () => stop?.(midi);

  return (
    <button
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      className={
        `relative aspect-square w-24 rounded-lg border transition select-none ` +
        (active ? 'bg-indigo-600 border-indigo-400 scale-95' : 'bg-slate-800 border-slate-600 hover:bg-slate-700')
      }
    >
      <span className="block text-sm font-semibold">{label}</span>
      {hotkey && (
        <span className="absolute bottom-1 right-2 text-xs text-slate-300 opacity-80">
          {hotkey.toUpperCase()}
        </span>
      )}
    </button>
  );
};
