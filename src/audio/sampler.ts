import * as Tone from 'tone';

// Primary note names used by our sample set
type NoteName = 'C2' | 'D2' | 'F#2' | 'A#2' | 'C#3' | 'D#3' | 'C3' | 'A2' | 'F2';

// GM standard note numbers (subset) for a basic drum kit
export enum MidiDrum {
  Kick = 36, // Bass Drum 1
  Snare = 38, // Acoustic Snare
  HiHatClosed = 42, // Closed Hi-Hat
  HiHatOpen = 46, // Open Hi-Hat
  Crash = 49, // Crash Cymbal 1
  Ride = 51, // Ride Cymbal 1
  TomHigh = 48, // High-Mid Tom
  TomMid = 45, // Low Tom
  TomFloor = 41, // Low Floor Tom
}

// Basic kit mapping only (no range fallbacks, no merges)
const BASIC_MAP: Record<MidiDrum, NoteName> = {
  [MidiDrum.Kick]: 'C2',
  [MidiDrum.Snare]: 'D2',
  [MidiDrum.HiHatClosed]: 'F#2',
  [MidiDrum.HiHatOpen]: 'A#2',
  [MidiDrum.Crash]: 'C#3',
  [MidiDrum.Ride]: 'D#3',
  [MidiDrum.TomHigh]: 'C3',
  [MidiDrum.TomMid]: 'A2',
  [MidiDrum.TomFloor]: 'F2',
};

// Map some local samples to note names above
// Using Vite asset URLs so these files are bundled and served correctly.
const urls: Record<NoteName, string> = {
  // Served from Vite's public/ directory: /samples/*.wav
  C2: '/samples/kick.wav',
  D2: '/samples/snare.wav',
  'F#2': '/samples/hh-closed.wav',
  'A#2': '/samples/hh-open.wav',
  'C#3': '/samples/crash.wav',
  'D#3': '/samples/ride.wav',
  C3: '/samples/tom-high.wav',
  A2: '/samples/tom-mid.wav',
  F2: '/samples/tom-floor.wav',
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

function mapMidi(noteNumber: number): NoteName | undefined {
  return BASIC_MAP[noteNumber as MidiDrum];
}

export async function triggerMidi(noteNumber: number, velocity: number) {
  const vel = Math.max(0, Math.min(1, velocity / 127));
  await ensureAudioStarted();
  await getDrumSampler();
  // If we hit Closed Hi-Hat, choke any ringing Open Hi-Hat first
  if (noteNumber === MidiDrum.HiHatClosed && vel > 0) {
    chokeOpenHiHat();
  }
  if (useSynthFallback) {
    const voice = mapMidiToVoice(noteNumber);
    const bus = ensureSynth();
    switch (voice) {
      case 'kick':
        bus.kick.triggerAttackRelease(50, '8n', Tone.now(), vel);
        break;
      case 'snare':
        bus.snare.triggerAttackRelease('16n', Tone.now(), vel);
        break;
      case 'hhOpen':
        // more decay for open
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
      default:
        break;
    }
    return;
  }
  const noteName = mapMidi(noteNumber);
  if (!noteName) return;
  // For one-shot drum samples let them ring naturally.
  sampler!.triggerAttack(noteName, Tone.now(), vel);
}

type Voice = 'kick' | 'snare' | 'hhClosed' | 'hhOpen' | 'crash' | 'ride' | 'tomHigh' | 'tomMid' | 'tomFloor';
function mapMidiToVoice(noteNumber: number): Voice {
  switch (noteNumber) {
    case MidiDrum.Kick:
      return 'kick';
    case MidiDrum.Snare:
      return 'snare';
    case MidiDrum.HiHatOpen:
      return 'hhOpen';
    case MidiDrum.HiHatClosed:
      return 'hhClosed';
    case MidiDrum.Crash:
      return 'crash';
    case MidiDrum.Ride:
      return 'ride';
    case MidiDrum.TomHigh:
      return 'tomHigh';
    case MidiDrum.TomMid:
      return 'tomMid';
    case MidiDrum.TomFloor:
      return 'tomFloor';
    default:
      // default to snare if unmapped (should not happen when BASIC_MAP is used)
      return 'snare';
  }
}

export function listMappedNotes() {
  const keys = Object.keys(BASIC_MAP)
    .map(k => Number(k))
    .sort((a, b) => a - b);
  return keys.map(k => ({ midi: k, note: BASIC_MAP[k as MidiDrum] }));
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
