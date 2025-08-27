import { useEffect, useMemo, useState } from 'react';
import * as M from '../audio/metronome';
import * as Tone from 'tone';
import BeatVolumeBar from './BeatVolumeBar';

// BeatVolumeBar moved to its own file

export default function Metronome() {
  const [bpm, setBpm] = useState(100);
  const [beats, setBeats] = useState(4);
  const [running, setRunning] = useState(false);
  const [beatInBar, setBeatInBar] = useState(0);
  const [accents, setAccents] = useState<boolean[]>([]);
  const [volumes, setVolumes] = useState<number[]>([]); // 0..1 per beat
  useEffect(() => {
    const s = M.getState();
    setBpm(s.bpm);
    setBeats(s.beatsPerBar);
    setRunning(s.isRunning);
    if (Array.isArray((s as any).accents)) setAccents((s as any).accents as boolean[]);
    else setAccents(new Array(s.beatsPerBar).fill(false).map((_, i) => i === 0));
    if (Array.isArray((s as any).volumes)) setVolumes((s as any).volumes as number[]);
    else setVolumes(new Array(s.beatsPerBar).fill(1));
    M.onTick((beatIdx) => setBeatInBar(beatIdx));
    return () => M.onTick(null);
  }, []);

  const indicators = useMemo(() => new Array(beats).fill(0).map((_, i) => i), [beats]);
  const minBpm = 30;
  const maxBpm = 300;
  const pct = Math.round(((bpm - minBpm) / (maxBpm - minBpm)) * 100);

  // no global drag handlers; children handle their own pointer events

  return (
    <div className="w-full mx-auto rounded border border-gray-700/60 bg-black/20 p-6 space-y-5">
      {/* Header: Large BPM display (top-left) + Play/Stop icon button (top-right) */}
      <div className="flex items-center justify-between">
        <div className="text-left">
          <div className="text-4xl font-semibold tracking-tight text-white">{bpm} <span className="text-gray-300 text-2xl align-baseline">BPM</span></div>
        </div>
        <button
          onClick={async () => {
            await M.toggle();
            const s = M.getState();
            setRunning(s.isRunning);
          }}
          aria-label={running ? 'Stop' : 'Play'}
          className={(running
            ? 'bg-red-600 hover:bg-red-500'
            : 'bg-green-600 hover:bg-green-500') +
            ' rounded-full w-12 h-12 flex items-center justify-center shadow'}
        >
          {running ? (
            // Stop icon
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-white">
              <rect x="5" y="5" width="10" height="10" rx="1" />
            </svg>
          ) : (
            // Play icon
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-white">
              <path d="M6 4.5v11l10-5.5-10-5.5z" />
            </svg>
          )}
        </button>
      </div>

      {/* Controls: slider with - / +, and beats selector */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 flex-1">
          <button
            onClick={() => {
              const v = Math.max(minBpm, Math.min(maxBpm, bpm - 1));
              setBpm(v);
              M.setBpm(v);
            }}
            aria-label="Decrease BPM"
            className="px-3 py-2 rounded-md bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white"
          >
            −
          </button>
          <input
            type="range"
            min={minBpm}
            max={maxBpm}
            step={1}
            value={bpm}
            aria-label="BPM"
            onChange={e => {
              const v = Number(e.target.value);
              setBpm(v);
              M.setBpm(v);
            }}
            className="slider flex-1"
            style={{ ["--val" as any]: `${pct}%` }}
          />
          <button
            onClick={() => {
              const v = Math.max(minBpm, Math.min(maxBpm, bpm + 1));
              setBpm(v);
              M.setBpm(v);
            }}
            aria-label="Increase BPM"
            className="px-3 py-2 rounded-md bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white"
          >
            +
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-300">Beats</label>
          <select
            value={beats}
            onChange={e => {
              const v = Number(e.target.value);
              setBeats(v);
              // Resize accents locally, preserving values
              const nextAcc = new Array(v).fill(false);
              for (let i = 0; i < Math.min(accents.length, v); i++) nextAcc[i] = accents[i];
              setAccents(nextAcc);
              const nextVols = new Array(v).fill(1);
              for (let i = 0; i < Math.min(volumes.length, v); i++) nextVols[i] = volumes[i];
              setVolumes(nextVols);
              M.setBeatsPerBar(v);
              M.setAccents(nextAcc);
              M.setVolumes(nextVols);
            }}
            className="bg-transparent border border-gray-700 rounded px-2 py-2 text-sm text-white hover:bg-gray-800"
          >
            {[2,3,4,6].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Beat volume bars (tall + thin, draggable, debounced commit) */}
      <div className="flex items-end gap-3 pt-2" style={{ height: 140 }}>
        {indicators.map(i => (
          <BeatVolumeBar
            key={`bar-${i}`}
            value={volumes[i] ?? 1}
            current={i === beatInBar}
            onChange={(v) => {
              const next = [...volumes];
              next[i] = v;
              setVolumes(next);
              M.setVolumeForBeat(i, v);
            }}
          />
        ))}
      </div>

      {/* Per-beat accent toggle buttons under each beat */}
      <div className="flex gap-2">
        {indicators.map(i => (
          <div className="flex-1 flex justify-center" key={`accent-${i}`}>
            <button
              onClick={() => {
                const next = [...accents];
                next[i] = !next[i];
                setAccents(next);
                M.setAccentForBeat(i, next[i]);
              }}
              className={
                'h-7 w-7 rounded-full border transition ' +
                (accents[i]
                  ? 'bg-indigo-500 border-indigo-400 shadow'
                  : 'bg-gray-800 border-gray-700 hover:bg-gray-700')
              }
              aria-label={`Toggle hard beat ${i + 1}`}
              title={`Toggle hard beat: ${i + 1}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
