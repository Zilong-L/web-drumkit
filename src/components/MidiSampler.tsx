import { useCallback, useEffect, useMemo, useState } from 'react';
import MidiDevicePicker from './MidiDevicePicker';
import { initMidiListenerForInput } from '../midi/midi';
import { ensureAudioStarted, getDrumSampler, listDrumPads, triggerMidi, isUsingFallback, DrumPad, triggerPad, midiNoteToPad, getCrashVariant, setCrashVariant } from '../audio/sampler';
import * as Tone from 'tone';

export default function MidiSampler() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [last, setLast] = useState<{ note?: number; velocity?: number }>({});
  const [audioReady, setAudioReady] = useState<boolean>(Tone.getContext().state === 'running');
  const [engine, setEngine] = useState<'samples' | 'synth'>(() => (isUsingFallback() ? 'synth' : 'samples'));
  const [crashVariant, setCrashVar] = useState<'14' | '18'>(getCrashVariant());

  useEffect(() => {
    let disposed = false;
    let disposer: { dispose: () => void } | null = null;
    if (!selectedId) return () => {};
    (async () => {
      try {
        const d = await initMidiListenerForInput(selectedId, async (note, vel) => {
          if (disposed) return;
          setLast({ note, velocity: vel });
          if (vel > 0) await triggerMidi(note, vel);
        });
        disposer = d;
      } catch (e: any) {
        setError(e?.message || String(e));
      }
    })();
    return () => {
      disposed = true;
      try {
        disposer?.dispose();
      } catch {}
    };
  }, [selectedId]);

  const pads = useMemo(() => listDrumPads(), []);

  const handlePad = useCallback(async (pad: DrumPad) => {
    await triggerPad(pad, 100);
  }, []);

  const enableAudio = useCallback(async () => {
    try {
      await ensureAudioStarted();
      await getDrumSampler(); // preload samples or init synth fallback
      setEngine(isUsingFallback() ? 'synth' : 'samples');
      setAudioReady(true);
    } catch (e: any) {
      setError(e?.message || String(e));
    }
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <h2 className="text-2xl font-semibold">MIDI Sampler (Tone.js)</h2>
      <p className="text-sm text-gray-400">
        Select a MIDI device and hit pads/notes to hear samples.
      </p>
      <div className="flex items-center justify-between gap-3">
        <MidiDevicePicker
          onSelect={(id) => {
          setSelectedId(id || null);
        }}
        />
        {!audioReady ? (
          <button
            onClick={enableAudio}
            className="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 transition text-sm"
            title="Unlock browser audio and preload samples"
          >
            Enable Audio
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded border border-green-700 text-green-400">Audio: {engine === 'samples' ? 'Samples' : 'Synth fallback'}</span>
            <label className="text-xs text-gray-400">Crash</label>
            <select
              className="text-xs bg-transparent border border-gray-700 rounded px-2 py-1"
              value={crashVariant}
              onChange={e => {
                const v = (e.target.value as '14' | '18');
                setCrashVar(v);
                setCrashVariant(v);
              }}
            >
              <option value="14">14</option>
              <option value="18">18</option>
            </select>
          </div>
        )}
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {pads.map(p => (
          <button
            key={p.pad}
            onClick={() => handlePad(p.pad)}
            className="px-3 py-4 rounded border border-gray-700 text-gray-200 hover:border-indigo-500 hover:text-white active:scale-95 transition"
          >
            <div className="text-lg font-semibold">{p.label}</div>
            <div className="text-xs text-gray-400">{p.midi}</div>
          </button>
        ))}
      </div>
      <div className="text-sm text-gray-400">
        Last: note {last.note ?? '-'} vel {last.velocity ?? '-'}
      </div>
      {error && <div className="text-sm text-red-400">{error}</div>}
    </div>
  );
}
