export type MidiCallback = (
  note: number,
  velocity: number,
  raw: WebMidi.MIDIMessageEvent
) => void;

function isIterableMap<T>(
  obj: Map<string, T> | { values: () => IterableIterator<T> }
): obj is Map<string, T> {
  return typeof (obj as Map<string, T>).values === 'function' && 'size' in obj;
}

function eachInput(
  inputs: WebMidi.MIDIAccess['inputs'],
  fn: (input: WebMidi.MIDIInput) => void
) {
  if (isIterableMap(inputs as any)) {
    for (const input of (inputs as Map<string, WebMidi.MIDIInput>).values()) {
      fn(input);
    }
  } else {
    for (const input of (inputs as WebMidi.MIDIInputMap).values()) {
      fn(input);
    }
  }
}

let midiAccessPromise: Promise<WebMidi.MIDIAccess> | null = null;
export function getMIDIAccess() {
  if (!('requestMIDIAccess' in navigator)) {
    return Promise.reject(
      new Error('Web MIDI API not supported in this browser')
    );
  }
  if (!midiAccessPromise) {
    midiAccessPromise = navigator.requestMIDIAccess({ sysex: false });
  }
  return midiAccessPromise;
}

export async function listMidiInputs() {
  const access = await getMIDIAccess();
  const results: Array<{
    id: string;
    name?: string;
    manufacturer?: string;
  }> = [];
  eachInput(access.inputs, input => {
    results.push({ id: input.id, name: input.name, manufacturer: input.manufacturer });
  });
  return results;
}

export async function initMidiListener(callback: MidiCallback) {
  const access = await getMIDIAccess();

  const handler = (e: WebMidi.MIDIMessageEvent) => {
    const data = e.data;
    if (!data || data.length < 3) return;
    const status = data[0];
    const command = status & 0xf0; // high nibble
    const note = data[1];
    const vel = data[2];

    // Note On (0x90-0x9F) and Note Off (0x80-0x8F) handling.
    if (command === 0x90) {
      // velocity 0 is treated as Note Off by many controllers
      callback(note, vel, e);
    } else if (command === 0x80) {
      callback(note, 0, e);
    }
  };

  const attachAll = () => eachInput(access.inputs, input => (input.onmidimessage = handler));
  const detachAll = () => eachInput(access.inputs, input => (input.onmidimessage = null));

  attachAll();

  const onStateChange = (_e: WebMidi.MIDIConnectionEvent) => {
    // Re-attach handlers in case devices were added/removed
    attachAll();
  };
  access.onstatechange = onStateChange;

  return {
    dispose() {
      detachAll();
      // Best-effort cleanup
      if (access.onstatechange === onStateChange) access.onstatechange = null;
    },
  };
}

export async function initMidiListenerForInput(
  inputId: string,
  callback: MidiCallback
) {
  const access = await getMIDIAccess();

  const handler = (e: WebMidi.MIDIMessageEvent) => {
    const data = e.data;
    if (!data || data.length < 3) return;
    const status = data[0];
    const command = status & 0xf0;
    const note = data[1];
    const vel = data[2];
    if (command === 0x90) {
      callback(note, vel, e);
    } else if (command === 0x80) {
      callback(note, 0, e);
    }
  };

  const attach = () => {
    let found = false;
    eachInput(access.inputs, input => {
      if (input.id === inputId) {
        input.onmidimessage = handler;
        found = true;
      } else {
        // Ensure others are not listening via this handle
        if (input.onmidimessage === handler) input.onmidimessage = null;
      }
    });
    return found;
  };
  const detach = () => {
    eachInput(access.inputs, input => {
      if (input.onmidimessage === handler) input.onmidimessage = null;
    });
  };

  attach();

  const onStateChange = () => {
    // Reattach to the same id after devices change
    attach();
  };
  const prev = access.onstatechange;
  access.onstatechange = e => {
    prev?.(e);
    onStateChange();
  };

  return {
    dispose() {
      detach();
      // do not clobber external listeners: we wrapped prev above
    },
  };
}
