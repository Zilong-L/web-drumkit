import { useEffect } from 'react';

export type KeyMap = Record<string, { note: string; velocity?: number }>;

type Options = {
  onTrigger: (note: string, velocity?: number) => void;
  onRelease?: (note: string) => void;
};

export function useKeyboardPads(map: KeyMap, opts: Options) {
  useEffect(() => {
    const down = new Set<string>();
    const handleDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (down.has(k)) return;
      const m = map[k];
      if (m) {
        e.preventDefault();
        down.add(k);
        const vel = typeof m.velocity === 'number' ? m.velocity : e.shiftKey ? 120 : 100;
        opts.onTrigger(m.note, vel);
      }
    };
    const handleUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const m = map[k];
      if (m) {
        e.preventDefault();
        down.delete(k);
        opts.onRelease?.(m.note);
      }
    };
    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);
    return () => {
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleUp);
    };
  }, [map, opts]);
}

