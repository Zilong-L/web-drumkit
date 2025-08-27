import { useEffect, useMemo, useState } from 'react';
import { getMIDIAccess, listMidiInputs } from '../midi/midi';

type Props = {
  onSelect: (id: string, device: WebMidi.MIDIInput | null) => void;
};

export default function MidiDevicePicker({ onSelect }: Props) {
  const [supported, setSupported] = useState<boolean>(
    typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator
  );
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<
    Array<{ id: string; name?: string; manufacturer?: string }>
  >([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;
    let access: WebMidi.MIDIAccess | null = null;
    (async () => {
      try {
        access = await getMIDIAccess();
        const refresh = async () => {
          const list = await listMidiInputs();
          if (disposed) return;
          setDevices(list);
          // If selected device disappeared, clear selection
          if (selectedId && !list.some(d => d.id === selectedId)) {
            setSelectedId(null);
            onSelect('', null);
          }
        };
        await refresh();
        access.onstatechange = () => {
          refresh();
        };
      } catch (e: any) {
        setError(e?.message || String(e));
        setSupported(false);
      }
    })();
    return () => {
      disposed = true;
      if (access && access.onstatechange) access.onstatechange = null;
    };
  }, [onSelect, selectedId]);

  const handleClick = async (id: string) => {
    // Toggle selection: clicking the selected device will deselect
    if (selectedId === id) {
      setSelectedId(null);
      onSelect('', null);
      return;
    }
    setSelectedId(id);
    try {
      const access = await getMIDIAccess();
      // find the actual device to pass up if needed
      let found: WebMidi.MIDIInput | null = null;
      const anyInputs: any = access.inputs as any;
      if (typeof anyInputs.values === 'function') {
        for (const input of anyInputs.values()) {
          if (input.id === id) {
            found = input as WebMidi.MIDIInput;
            break;
          }
        }
      }
      onSelect(id, found);
    } catch {
      onSelect(id, null);
    }
  };

  const content = useMemo(() => {
    if (!supported) return <p className="text-sm text-gray-500">Web MIDI not supported.</p>;
    if (error) return <p className="text-sm text-red-400">{error}</p>;
    if (!devices.length)
      return <p className="text-sm text-gray-500">No MIDI inputs found.</p>;
    return (
      <div className="flex flex-wrap gap-2">
        {devices.map(d => {
          const isSelected = d.id === selectedId;
          return (
            <button
              key={d.id}
              onClick={() => handleClick(d.id)}
              className={
                'px-3 py-2 rounded border text-sm transition ' +
                (isSelected
                  ? 'border-indigo-500 text-white bg-indigo-600/10'
                  : 'border-gray-700 text-gray-400 hover:text-gray-300 hover:border-gray-500')
              }
              title={d.manufacturer ? `${d.manufacturer} ${d.name ?? ''}` : d.name ?? d.id}
            >
              {d.name ?? d.id}
            </button>
          );
        })}
      </div>
    );
  }, [devices, error, selectedId, supported]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-medium">MIDI Devices</h3>
        <div className="flex items-center gap-2">
          {selectedId ? (
            <>
              <span className="text-xs text-indigo-400">Selected</span>
              <button
                className="text-xs px-2 py-1 rounded border border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white"
                onClick={() => {
                  setSelectedId(null);
                  onSelect('', null);
                }}
              >
                Clear
              </button>
            </>
          ) : (
            <span className="text-xs text-gray-500">Not selected</span>
          )}
        </div>
      </div>
      {content}
    </div>
  );
}
