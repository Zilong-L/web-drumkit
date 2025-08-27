export type NoteName = string; // e.g., "C1", "D1", "F#1"
export type MidiNumber = number; // e.g., 36 (Kick), 38 (Snare)

export type PlayOptions = {
  velocity?: number; // 0-127
  time?: number; // AudioContext time or performance.now ms depending on engine
};

export interface AudioEngine {
  init(): Promise<void> | void;
  play(note: NoteName | MidiNumber, options?: PlayOptions): void;
  stop(note: NoteName | MidiNumber): void;
  isReady?: () => boolean;
}

export class MockEngine implements AudioEngine {
  private ready = true;
  init() {}
  play(note: NoteName | MidiNumber, options: PlayOptions = {}) {
    const { velocity = 100 } = options;
    // eslint-disable-next-line no-console
    console.log(`[MockEngine] play ${note} vel=${velocity}`);
  }
  stop(note: NoteName | MidiNumber) {
    // eslint-disable-next-line no-console
    console.log(`[MockEngine] stop ${note}`);
  }
  isReady = () => this.ready;
}
