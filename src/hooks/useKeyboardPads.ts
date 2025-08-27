import { useEffect } from 'react';

export type KeyMap = Record<string, { midi: number; velocity?: number }>;

type Options = {
  onTrigger: (midi: number, velocity?: number) => void;
  onRelease?: (midi: number) => void;
};

export function useKeyboardPads(map: KeyMap, opts: Options) {
  useEffect(() => {
    const down = new Set<string>();
    const handleDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (e.repeat) return; // ignore auto-repeat
      if (down.has(k)) return;
      const m = map[k];
      if (m) {
        e.preventDefault();
        down.add(k);
        const vel = typeof m.velocity === 'number' ? m.velocity : e.shiftKey ? 120 : 100;
        opts.onTrigger(m.midi, vel);
      }
    };
    const handleUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const m = map[k];
      if (m) {
        e.preventDefault();
        down.delete(k);
        opts.onRelease?.(m.midi);
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
