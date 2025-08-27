import { useMemo, useRef, useState } from 'react';
import { DrumPadGrid, Pad } from './components/DrumPadGrid';
import { MockEngine } from './engine/AudioEngine';
import { useKeyboardPads, KeyMap } from './hooks/useKeyboardPads';
import { DrumNote, DRUM_LABELS } from './engine/DrumMap';
import { KeyMappingEditor, MidiToKeys } from './components/KeyMappingEditor';

function App() {
  const engineRef = useRef(new MockEngine());
  const [lastHit, setLastHit] = useState<number | null>(null);

  const pads: Pad[] = useMemo(() => {
    const order: DrumNote[] = [
      DrumNote.Kick,
      DrumNote.Snare,
      DrumNote.ClosedHat,
      DrumNote.OpenHat,
      DrumNote.LowTom,
      DrumNote.LowMidTom,
      DrumNote.HiMidTom,
      DrumNote.HighTom,
      DrumNote.Crash1,
      DrumNote.Ride1,
      DrumNote.SideStick,
      DrumNote.Clap,
    ];
    const defaultKeys: Record<DrumNote, string | undefined> = {
      [DrumNote.Kick]: 'a',
      [DrumNote.Snare]: 's',
      [DrumNote.ClosedHat]: 'd',
      [DrumNote.OpenHat]: 'f',
      [DrumNote.LowTom]: 'g',
      [DrumNote.LowMidTom]: 'h',
      [DrumNote.HiMidTom]: 'j',
      [DrumNote.HighTom]: 'k',
      [DrumNote.Crash1]: 'u',
      [DrumNote.Ride1]: 'i',
      [DrumNote.SideStick]: 'l',
      [DrumNote.Clap]: ';',
      // Unused in grid but present in enum can be added later
      [DrumNote.ElectricSnare]: undefined,
      [DrumNote.LowFloorTom]: undefined,
      [DrumNote.HighFloorTom]: undefined,
      [DrumNote.PedalHat]: undefined,
      [DrumNote.RideBell]: undefined,
    } as any;
    return order.map((midi, idx) => ({
      id: `${midi}-${idx}`,
      label: DRUM_LABELS[midi],
      midi,
      key: defaultKeys[midi],
    }));
  }, []);

  const STORAGE_KEY = 'drum_keymap_v1';
  const [midiToKeys, setMidiToKeys] = useState<MidiToKeys>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    const init: MidiToKeys = {};
    pads.forEach((p) => {
      if (p.key) init[p.midi] = [p.key];
    });
    return init;
  });

  const keyMap: KeyMap = useMemo(() => {
    const entries: [string, { midi: number } ][] = [];
    Object.entries(midiToKeys).forEach(([midi, keys]) => {
      keys.forEach((k) => entries.push([k, { midi: Number(midi) }]));
    });
    return Object.fromEntries(entries);
  }, [midiToKeys]);

  const persistMapping = (next: MidiToKeys) => {
    setMidiToKeys(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  };

  useKeyboardPads(keyMap, {
    onTrigger: (midi, velocity) => {
      engineRef.current.play(midi, { velocity });
      setLastHit(midi);
      setTimeout(() => setLastHit((n) => (n === midi ? null : n)), 80);
    },
    onRelease: (midi) => engineRef.current.stop(midi),
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 gap-6">
      <h1 className="text-4xl font-bold tracking-tight">Web Drumkit</h1>
      <p className="text-gray-400">A minimal pad UI with keyboard mapping</p>
      <DrumPadGrid
        pads={pads}
        activeMidi={lastHit ?? undefined}
        onTrigger={(m, v) => engineRef.current.play(m, { velocity: v })}
        onStop={(m) => engineRef.current.stop(m)}
      />
      <p className="text-xs text-gray-500">Hold Shift for accent velocity. More pads mapped to GM drums.</p>
      <KeyMappingEditor pads={pads} value={midiToKeys} onChange={persistMapping} />
    </div>
  );
}

export default App;
