import React from 'react';
import { DrumPad } from './DrumPad';

export type Pad = {
  id: string;
  label: string;
  note: string; // matches engine note name
  key?: string; // keyboard hotkey
};

type Props = {
  pads: Pad[];
  activeNote?: string;
  onTrigger: (note: string, velocity?: number) => void;
  onStop?: (note: string) => void;
};

export const DrumPadGrid: React.FC<Props> = ({ pads, activeNote, onTrigger, onStop }) => {
  return (
    <div className="grid grid-cols-3 gap-4">
      {pads.map((p) => (
        <DrumPad
          key={p.id}
          label={p.label}
          note={p.note}
          hotkey={p.key}
          active={activeNote === p.note}
          trigger={onTrigger}
          stop={onStop}
        />
      ))}
    </div>
  );
};

