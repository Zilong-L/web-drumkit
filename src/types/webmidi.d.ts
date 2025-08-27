// Minimal Web MIDI type definitions for TypeScript
// Enough for basic input listening; extend as needed.

declare namespace WebMidi {
  interface MIDIAccess {
    inputs: Map<string, MIDIInput> | MIDIInputMap;
    outputs: Map<string, MIDIOutput> | MIDIOutputMap;
    onstatechange: ((e: MIDIConnectionEvent) => void) | null;
  }

  // Older browsers expose dedicated map-like objects
  interface MIDIInputMap {
    size: number;
    values(): IterableIterator<MIDIInput>;
    forEach(callback: (value: MIDIInput, key: string) => void): void;
  }
  interface MIDIOutputMap {
    size: number;
    values(): IterableIterator<MIDIOutput>;
    forEach(callback: (value: MIDIOutput, key: string) => void): void;
  }

  interface MIDIPort {
    id: string;
    manufacturer?: string;
    name?: string;
    type: 'input' | 'output';
    state: 'connected' | 'disconnected';
    connection: 'open' | 'closed' | 'pending';
  }

  interface MIDIInput extends MIDIPort {
    onmidimessage: ((e: MIDIMessageEvent) => void) | null;
  }
  interface MIDIOutput extends MIDIPort {}

  interface MIDIMessageEvent extends Event {
    data: Uint8Array;
    receivedTime: number;
    target: MIDIInput;
  }

  interface MIDIConnectionEvent extends Event {
    port: MIDIPort;
  }
}

interface Navigator {
  requestMIDIAccess(options?: { sysex?: boolean }): Promise<WebMidi.MIDIAccess>;
}

