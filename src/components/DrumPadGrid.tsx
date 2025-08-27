import React from 'react';
import { DrumPad } from './DrumPad';

export type Pad = {
  id: string;
  label: string;
  midi: number;
  key?: string; // keyboard hotkey (display)
};

type Props = {
  pads: Pad[];
  activeMidi?: number;
  onTrigger: (midi: number, velocity?: number) => void;
  onStop?: (midi: number) => void;
};

export const DrumPadGrid: React.FC<Props> = ({ pads, activeMidi, onTrigger, onStop }) => {
  return (
    <div className="grid grid-cols-4 gap-4">
      {pads.map((p) => (
        <DrumPad
          key={p.id}
          label={p.label}
          midi={p.midi}
          hotkey={p.key}
          active={activeMidi === p.midi}
          trigger={onTrigger}
          stop={onStop}
        />
      ))}
    </div>
  );
};
