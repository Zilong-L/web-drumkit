import { useCallback, useEffect, useMemo, useState } from 'react';
import MidiDevicePicker from './MidiDevicePicker';
import { initMidiCcListenerForInput, initMidiListenerForInput } from '../midi/midi';
import { ensureAudioStarted, getDrumSampler, listDrumPads, triggerMidi, isUsingFallback, DrumPad, triggerPad, midiNoteToPad, MidiCC, setHiHatOpenByCC4 } from '../audio/sampler';
import * as Tone from 'tone';
import { useKeyboardPads, KeyMap } from '../hooks/useKeyboardPads';
import { KeyMappingEditor, MidiToKeys } from './KeyMappingEditor';

export default function MidiSampler() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [last, setLast] = useState<{ note?: number; velocity?: number }>({});
  const [flashMidi, setFlashMidi] = useState<number | null>(null);
  const [audioReady, setAudioReady] = useState<boolean>(Tone.getContext().state === 'running');
  const [engine, setEngine] = useState<'samples' | 'synth'>(() => (isUsingFallback() ? 'synth' : 'samples'));
  // no crash/snare variant toggles for now

  useEffect(() => {
    let disposed = false;
    let disposer: { dispose: () => void } | null = null;
    let ccDisposer: { dispose: () => void } | null = null;
    if (!selectedId) return () => {};
    (async () => {
      try {
        const d = await initMidiListenerForInput(selectedId, async (note, vel) => {
          if (disposed) return;
          setLast({ note, velocity: vel });
          if (vel > 0) {
            setFlashMidi(note);
            setTimeout(() => setFlashMidi(prev => (prev === note ? null : prev)), 80);
          }
          if (vel > 0) await triggerMidi(note, vel);
        });
        disposer = d;
        ccDisposer = await initMidiCcListenerForInput(selectedId, (cc, val) => {
          if (disposed) return;
          if (cc === MidiCC.FootController) setHiHatOpenByCC4(val);
        });
      } catch (e: any) {
        setError(e?.message || String(e));
      }
    })();
    return () => {
      disposed = true;
      try {
        disposer?.dispose();
      } catch {}
      try {
        ccDisposer?.dispose();
      } catch {}
    };
  }, [selectedId]);

  const pads = useMemo(() => listDrumPads(), []);

  const handlePad = useCallback(async (pad: DrumPad) => {
    const all = listDrumPads();
    const hit = all.find(p => p.pad === pad);
    if (hit) {
      setFlashMidi(hit.midi);
      setTimeout(() => setFlashMidi(prev => (prev === hit.midi ? null : prev)), 80);
    }
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

  // Keyboard mapping: multiple keys per drum with persistence
  const STORAGE_KEY = 'drum_keymap_v1';
  const [midiToKeys, setMidiToKeys] = useState<MidiToKeys>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    // Default mapping across common pads
    const defaults: Array<[string, number]> = [];
    const orderKeys = ['a','s','d','f','g','h','j','k','u','i','l',';'];
    pads.slice(0, orderKeys.length).forEach((p, idx) => defaults.push([orderKeys[idx], p.midi]));
    const init: MidiToKeys = {};
    defaults.forEach(([k, m]) => {
      init[m] = [...(init[m] || []), k];
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
    onTrigger: async (midi, velocity = 100) => {
      try {
        setFlashMidi(midi);
        setTimeout(() => setFlashMidi(prev => (prev === midi ? null : prev)), 80);
        await ensureAudioStarted();
        await getDrumSampler();
        await triggerMidi(midi, velocity);
      } catch (e: any) {
        setError(e?.message || String(e));
      }
    },
  });

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
          <span className="text-xs px-2 py-1 rounded border border-green-700 text-green-400">Audio: {engine === 'samples' ? 'Samples' : 'Synth fallback'}</span>
        )}
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {pads.map(p => {
          const active = flashMidi === p.midi;
          return (
            <button
              key={p.pad}
              onClick={() => handlePad(p.pad)}
              className={
                'px-3 py-4 rounded border text-gray-200 transition ' +
                (active
                  ? 'border-indigo-400 bg-indigo-600/20 scale-[0.98]'
                  : 'border-gray-700 hover:border-indigo-500 hover:text-white')
              }
            >
              <div className="text-lg font-semibold">{p.label}</div>
            </button>
          );
        })}
      </div>
      <KeyMappingEditor pads={pads.map(p => ({ id: String(p.midi), label: p.label, midi: p.midi }))} value={midiToKeys} onChange={persistMapping} />
      {/* Debug line removed per request: hide note/velocity numbers */}
      {error && <div className="text-sm text-red-400">{error}</div>}
    </div>
  );
}
