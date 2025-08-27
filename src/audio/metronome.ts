import * as Tone from 'tone';
import { ensureAudioStarted } from './sampler';

type Subscriber = (beatIndex: number, barIndex: number) => void;

let initialized = false;
let sub: Subscriber | null = null;
let beatsPerBar = 4;
let bpm = 100;
let isRunning = false;
let currentBeat = 0;
let currentBar = 0;

let loop: Tone.Loop | null = null;
let clickHigh: Tone.MembraneSynth | null = null;
let clickLow: Tone.MembraneSynth | null = null;
let out: Tone.Gain | null = null;

function init() {
  if (initialized) return;
  out = new Tone.Gain(0.9).toDestination();
  clickHigh = new Tone.MembraneSynth({ octaves: 2, pitchDecay: 0.005, envelope: { attack: 0.001, decay: 0.08, sustain: 0 } }).connect(out);
  clickLow = new Tone.MembraneSynth({ octaves: 2, pitchDecay: 0.008, envelope: { attack: 0.001, decay: 0.12, sustain: 0 } }).connect(out);
  Tone.Transport.bpm.value = bpm;
  Tone.Transport.timeSignature = beatsPerBar;
  loop = new Tone.Loop(time => {
    const beatInBar = currentBeat % beatsPerBar;
    if (beatInBar === 0) {
      clickHigh!.triggerAttackRelease(1200, '16n', time, 0.9);
      currentBar++;
    } else {
      clickLow!.triggerAttackRelease(800, '16n', time, 0.6);
    }
    sub?.(beatInBar, currentBar);
    currentBeat++;
  }, '4n');
  initialized = true;
}

export async function start() {
  init();
  await ensureAudioStarted();
  currentBeat = 0;
  currentBar = 0;
  loop!.start(0);
  await Tone.start();
  Tone.Transport.start();
  isRunning = true;
}

export function stop() {
  if (!initialized) return;
  loop!.stop();
  Tone.Transport.stop();
  isRunning = false;
}

export async function toggle() {
  if (isRunning) stop(); else await start();
}

export function setBpm(next: number) {
  bpm = Math.max(30, Math.min(300, Math.round(next)));
  Tone.Transport.bpm.rampTo(bpm, 0.05);
}

export function setBeatsPerBar(next: number) {
  beatsPerBar = Math.max(1, Math.min(12, Math.floor(next)));
  Tone.Transport.timeSignature = beatsPerBar;
}

export function onTick(fn: Subscriber | null) {
  sub = fn;
}

export function getState() {
  return { bpm, beatsPerBar, isRunning };
}

