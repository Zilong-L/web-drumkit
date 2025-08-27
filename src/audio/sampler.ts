import * as Tone from 'tone';

// Primary note names used by our sample set
type NoteName =
  | 'C2' // Kick
  | 'D2' // Snare 14
  | 'E2' // Snare 18 (alt)
  | 'D#2' // Side Stick
  | 'F#2' // HH Closed
  | 'A#2' // HH Open
  | 'C#3' // Crash
  | 'D#3' // Ride
  | 'C3' // Tom High
  | 'A2' // Tom Mid
  | 'F2'; // Tom Floor

// Semantic drum pads (avoid magic numbers in the app)
export enum DrumPad {
  Kick = 'Kick',
  Snare = 'Snare',
  SideStick = 'SideStick',
  HiHatClosed = 'HiHatClosed',
  HiHatOpen = 'HiHatOpen',
  Crash = 'Crash',
  Ride = 'Ride',
  TomHigh = 'TomHigh',
  TomMid = 'TomMid',
  TomFloor = 'TomFloor',
}

// GM standard note numbers (subset) for a basic drum kit
export enum MidiDrum {
  Kick = 36, // Bass Drum 1
  Snare = 38, // Acoustic Snare
  SideStick = 37, // Side Stick
  HiHatClosed = 42, // Closed Hi-Hat
  HiHatOpen = 46, // Open Hi-Hat
  Crash = 49, // Crash Cymbal 1
  Ride = 51, // Ride Cymbal 1
  TomHigh = 48, // High-Mid Tom
  TomMid = 45, // Low Tom
  TomFloor = 41, // Low Floor Tom
}

// One place to convert semantic pads <-> MIDI notes
const PAD_TO_MIDI: Record<DrumPad, MidiDrum> = {
  [DrumPad.Kick]: MidiDrum.Kick,
  [DrumPad.Snare]: MidiDrum.Snare,
  [DrumPad.SideStick]: MidiDrum.SideStick,
  [DrumPad.HiHatClosed]: MidiDrum.HiHatClosed,
  [DrumPad.HiHatOpen]: MidiDrum.HiHatOpen,
  [DrumPad.Crash]: MidiDrum.Crash,
  [DrumPad.Ride]: MidiDrum.Ride,
  [DrumPad.TomHigh]: MidiDrum.TomHigh,
  [DrumPad.TomMid]: MidiDrum.TomMid,
  [DrumPad.TomFloor]: MidiDrum.TomFloor,
};

const MIDI_TO_PAD: Record<number, DrumPad> = Object.fromEntries(
  Object.entries(PAD_TO_MIDI).map(([pad, midi]) => [midi as number, pad as unknown as DrumPad])
) as Record<number, DrumPad>;

// Basic kit mapping: pads -> sample note names
const BASIC_MAP_PAD: Record<DrumPad, NoteName> = {
  [DrumPad.Kick]: 'C2',
  [DrumPad.Snare]: 'D2',
  [DrumPad.SideStick]: 'D#2',
  [DrumPad.HiHatClosed]: 'F#2',
  [DrumPad.HiHatOpen]: 'A#2',
  [DrumPad.Crash]: 'C#3',
  [DrumPad.Ride]: 'D#3',
  [DrumPad.TomHigh]: 'C3',
  [DrumPad.TomMid]: 'A2',
  [DrumPad.TomFloor]: 'F2',
};

// Map some local samples to note names above
// Using Vite asset URLs so these files are bundled and served correctly.
// Brand-qualified paths under public/samples/<Brand>/
const BRAND = 'GSCW';
const base = `/samples/${BRAND}`;
const urls: Record<NoteName, string> = {
  C2: `${base}/kick.wav`,
  D2: `${base}/snare-14.wav`,
  E2: `${base}/snare-18.wav`,
  'D#2': `${base}/stick.wav`,
  'F#2': `${base}/hh-closed.wav`,
  'A#2': `${base}/hh-open.wav`,
  'C#3': `${base}/crash.wav`,
  'D#3': `${base}/ride.wav`,
  C3: `${base}/tom-high.wav`,
  A2: `${base}/tom-mid.wav`,
  F2: `${base}/tom-floor.wav`,
};

let loaded: Promise<Tone.Sampler> | null = null;
let sampler: Tone.Sampler | null = null;
let useSynthFallback = false;
let synthBus: {
  gain: Tone.Gain;
  kick: Tone.MembraneSynth;
  snare: Tone.NoiseSynth;
  hat: Tone.MetalSynth;
  cym: Tone.MetalSynth;
  tomHigh: Tone.MembraneSynth;
  tomMid: Tone.MembraneSynth;
  tomFloor: Tone.MembraneSynth;
} | null = null;

export async function ensureAudioStarted() {
  if (Tone.getContext().state !== 'running') {
    try {
      await Tone.start();
    } catch {}
  }
}

function ensureSynth() {
  if (synthBus) return synthBus;
  const gain = new Tone.Gain(0.9).toDestination();
  const kick = new Tone.MembraneSynth({ octaves: 2, pitchDecay: 0.01, envelope: { attack: 0.001, decay: 0.3, sustain: 0 } }).connect(gain);
  const snare = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.2, sustain: 0 } }).connect(gain);
  const hat = new Tone.MetalSynth({ envelope: { attack: 0.001, decay: 0.08, release: 0.01 }, harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5 }).connect(gain);
  const cym = new Tone.MetalSynth({ envelope: { attack: 0.001, decay: 1.8, release: 0.5 }, harmonicity: 5.1, modulationIndex: 16, resonance: 2000, octaves: 2.5 }).connect(gain);
  // set frequencies after construction to satisfy Tone types
  hat.frequency.value = 400;
  cym.frequency.value = 300;
  const tomHigh = new Tone.MembraneSynth({ octaves: 1, envelope: { attack: 0.001, decay: 0.3, sustain: 0 } }).connect(gain);
  const tomMid = new Tone.MembraneSynth({ octaves: 1, envelope: { attack: 0.001, decay: 0.35, sustain: 0 } }).connect(gain);
  const tomFloor = new Tone.MembraneSynth({ octaves: 1, envelope: { attack: 0.001, decay: 0.45, sustain: 0 } }).connect(gain);
  synthBus = { gain, kick, snare, hat, cym, tomHigh, tomMid, tomFloor };
  return synthBus;
}

export function isUsingFallback() {
  return useSynthFallback;
}

export async function getDrumSampler() {
  if (useSynthFallback) {
    ensureSynth();
    // Return a dummy promise to keep callers simple
    return Promise.resolve(null as unknown as Tone.Sampler);
  }
  if (!loaded) {
    loaded = new Promise<Tone.Sampler>((resolve, reject) => {
      const gain = new Tone.Gain(1).toDestination();
      try {
        sampler = new Tone.Sampler({ urls, onload: () => resolve(sampler!), onerror: (e) => reject(e) }).connect(gain);
      } catch (e) {
        reject(e);
      }
    }).catch(e => {
      // Switch to synth fallback if sample decoding fails
      console.warn('Sampler load failed; falling back to synth. Error:', e);
      useSynthFallback = true;
      ensureSynth();
      // Return a resolved dummy to keep flow
      return null as unknown as Tone.Sampler;
    });
  }
  return loaded;
}

function padToNoteName(pad: DrumPad): NoteName {
  if (pad === DrumPad.Snare) {
    return currentSnareVariant === '18' ? 'E2' : 'D2';
  }
  return BASIC_MAP_PAD[pad];
}

export function midiNoteToPad(noteNumber: number): DrumPad | null {
  return MIDI_TO_PAD[noteNumber] ?? null;
}

export async function triggerPad(pad: DrumPad, velocity: number) {
  const vel = Math.max(0, Math.min(1, velocity / 127));
  await ensureAudioStarted();
  await getDrumSampler();
  if (pad === DrumPad.HiHatClosed && vel > 0) {
    chokeOpenHiHat();
  }
  if (useSynthFallback) {
    const voice = padToVoice(pad);
    const bus = ensureSynth();
    switch (voice) {
      case 'kick':
        bus.kick.triggerAttackRelease(50, '8n', Tone.now(), vel);
        break;
      case 'snare':
        bus.snare.triggerAttackRelease('16n', Tone.now(), vel);
        break;
      case 'hhOpen':
        bus.hat.envelope.decay = 0.3;
        bus.hat.triggerAttackRelease('8n', Tone.now(), 0.5 + vel * 0.5);
        break;
      case 'hhClosed':
        bus.hat.envelope.decay = 0.07;
        bus.hat.triggerAttackRelease('32n', Tone.now(), 0.4 + vel * 0.6);
        break;
      case 'crash':
        bus.cym.envelope.decay = 1.6;
        bus.cym.triggerAttackRelease('2n', Tone.now(), 0.4 + vel * 0.6);
        break;
      case 'ride':
        bus.cym.envelope.decay = 0.6;
        bus.cym.triggerAttackRelease('8n', Tone.now(), 0.4 + vel * 0.6);
        break;
      case 'tomHigh':
        bus.tomHigh.triggerAttackRelease(220, '8n', Tone.now(), vel);
        break;
      case 'tomMid':
        bus.tomMid.triggerAttackRelease(180, '8n', Tone.now(), vel);
        break;
      case 'tomFloor':
        bus.tomFloor.triggerAttackRelease(140, '8n', Tone.now(), vel);
        break;
    }
    return;
  }
  const noteName = padToNoteName(pad);
  sampler!.triggerAttack(noteName, Tone.now(), vel);
}

// Back-compat thin adapter for raw MIDI input
export async function triggerMidi(noteNumber: number, velocity: number) {
  const pad = midiNoteToPad(noteNumber);
  if (!pad) return;
  return triggerPad(pad, velocity);
}

type Voice = 'kick' | 'snare' | 'hhClosed' | 'hhOpen' | 'crash' | 'ride' | 'tomHigh' | 'tomMid' | 'tomFloor';
function padToVoice(pad: DrumPad): Voice {
  switch (pad) {
    case DrumPad.Kick:
      return 'kick';
    case DrumPad.Snare:
      return 'snare';
    case DrumPad.HiHatOpen:
      return 'hhOpen';
    case DrumPad.HiHatClosed:
      return 'hhClosed';
    case DrumPad.Crash:
      return 'crash';
    case DrumPad.Ride:
      return 'ride';
    case DrumPad.TomHigh:
      return 'tomHigh';
    case DrumPad.TomMid:
      return 'tomMid';
    case DrumPad.TomFloor:
      return 'tomFloor';
    case DrumPad.SideStick:
      return 'snare';
  }
  return 'snare';
}

export function listDrumPads() {
  const pads: DrumPad[] = [
    DrumPad.Kick,
    DrumPad.Snare,
    DrumPad.SideStick,
    DrumPad.HiHatClosed,
    DrumPad.HiHatOpen,
    DrumPad.Crash,
    DrumPad.Ride,
    DrumPad.TomHigh,
    DrumPad.TomMid,
    DrumPad.TomFloor,
  ];
  return pads.map(p => ({ pad: p, midi: PAD_TO_MIDI[p] as number, label: p }));
}

// Snare variant control
let currentSnareVariant: '14' | '18' = '14';
export function setSnareVariant(v: '14' | '18') {
  currentSnareVariant = v;
}
export function getSnareVariant() {
  return currentSnareVariant;
}

function chokeOpenHiHat() {
  if (useSynthFallback) {
    try {
      const bus = ensureSynth();
      bus.hat.triggerRelease(Tone.now());
    } catch {}
    return;
  }
  // Samples engine: release the Open Hi-Hat note ('A#2')
  try {
    if (sampler) sampler.triggerRelease('A#2', Tone.now());
  } catch {}
}
