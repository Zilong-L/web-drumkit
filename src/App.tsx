import { useMemo, useRef, useState } from 'react';
import { DrumPadGrid, Pad } from './components/DrumPadGrid';
import { MockEngine } from './engine/AudioEngine';
import { useKeyboardPads, KeyMap } from './hooks/useKeyboardPads';

function App() {
  const engineRef = useRef(new MockEngine());
  const [lastHit, setLastHit] = useState<string | null>(null);

  const pads: Pad[] = useMemo(
    () => [
      { id: 'kick', label: 'Kick', note: 'C1', key: 'a' },
      { id: 'snare', label: 'Snare', note: 'D1', key: 's' },
      { id: 'hihat', label: 'Hi-Hat', note: 'F#1', key: 'd' },
    ],
    []
  );

  const keyMap: KeyMap = useMemo(
    () => ({ a: { note: 'C1' }, s: { note: 'D1' }, d: { note: 'F#1' } }),
    []
  );

  useKeyboardPads(keyMap, {
    onTrigger: (note, velocity) => {
      engineRef.current.play(note, { velocity });
      setLastHit(note);
      // Reset highlight shortly after
      setTimeout(() => setLastHit((n) => (n === note ? null : n)), 80);
    },
    onRelease: (note) => engineRef.current.stop(note),
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 gap-6">
      <h1 className="text-4xl font-bold tracking-tight">Web Drumkit</h1>
      <p className="text-gray-400">A minimal pad UI with keyboard mapping</p>
      <DrumPadGrid
        pads={pads}
        activeNote={lastHit || undefined}
        onTrigger={(n, v) => engineRef.current.play(n, { velocity: v })}
        onStop={(n) => engineRef.current.stop(n)}
      />
      <p className="text-xs text-gray-500">Hotkeys: A (Kick), S (Snare), D (Hi-Hat). Hold Shift for accent.</p>
    </div>
  );
}

export default App;
