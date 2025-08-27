import { useEffect, useMemo, useState } from 'react';
import * as M from '../audio/metronome';
import * as Tone from 'tone';

export default function Metronome() {
  const [bpm, setBpm] = useState(100);
  const [beats, setBeats] = useState(4);
  const [running, setRunning] = useState(false);
  const [beatInBar, setBeatInBar] = useState(0);

  useEffect(() => {
    const s = M.getState();
    setBpm(s.bpm);
    setBeats(s.beatsPerBar);
    setRunning(s.isRunning);
    M.onTick((beatIdx) => setBeatInBar(beatIdx));
    return () => M.onTick(null);
  }, []);

  const indicators = useMemo(() => {
    return new Array(beats).fill(0).map((_, i) => i);
  }, [beats]);

  return (
    <div className="w-full mx-auto space-y-3">
      <div className="flex items-center gap-3">
        <button
          onClick={async () => {
            await M.toggle();
            const s = M.getState();
            setRunning(s.isRunning);
          }}
          className={'px-3 py-2 rounded text-sm font-medium ' + (running ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500')}
        >
          {running ? 'Stop' : 'Start'}
        </button>
        <label className="text-sm text-gray-300">BPM</label>
        <input
          type="number"
          value={bpm}
          min={30}
          max={300}
          onChange={e => {
            const v = Math.max(30, Math.min(300, Number(e.target.value) || 0));
            setBpm(v);
            M.setBpm(v);
          }}
          className="w-20 bg-transparent border border-gray-700 rounded px-2 py-1 text-sm"
        />
        <input
          type="range"
          min={40}
          max={220}
          value={bpm}
          onChange={e => {
            const v = Number(e.target.value);
            setBpm(v);
            M.setBpm(v);
          }}
          className="flex-1"
        />
        <label className="text-sm text-gray-300">Beats</label>
        <select
          value={beats}
          onChange={e => {
            const v = Number(e.target.value);
            setBeats(v);
            M.setBeatsPerBar(v);
          }}
          className="bg-transparent border border-gray-700 rounded px-2 py-1 text-sm"
        >
          {[2,3,4,6].map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        {indicators.map(i => (
          <div
            key={i}
            className={'h-3 flex-1 rounded ' + (i === beatInBar ? 'bg-indigo-500' : 'bg-gray-700')}
          />
        ))}
      </div>
    </div>
  );
}

