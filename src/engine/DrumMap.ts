// General MIDI Percussion Key Map (subset)
// Values are MIDI note numbers on channel 10
export enum DrumNote {
  Kick = 36,
  SideStick = 37,
  Snare = 38,
  Clap = 39,
  ElectricSnare = 40,
  LowFloorTom = 41,
  ClosedHat = 42,
  HighFloorTom = 43,
  PedalHat = 44,
  LowTom = 45,
  OpenHat = 46,
  LowMidTom = 47,
  HiMidTom = 48,
  Crash1 = 49,
  HighTom = 50,
  Ride1 = 51,
  RideBell = 53,
}

export const DRUM_LABELS: Record<DrumNote, string> = {
  [DrumNote.Kick]: 'Kick',
  [DrumNote.SideStick]: 'Rim',
  [DrumNote.Snare]: 'Snare',
  [DrumNote.Clap]: 'Clap',
  [DrumNote.ElectricSnare]: 'E-Snare',
  [DrumNote.LowFloorTom]: 'Floor Tom L',
  [DrumNote.ClosedHat]: 'Hi-Hat (C)',
  [DrumNote.HighFloorTom]: 'Floor Tom H',
  [DrumNote.PedalHat]: 'Hi-Hat (P)',
  [DrumNote.LowTom]: 'Low Tom',
  [DrumNote.OpenHat]: 'Hi-Hat (O)',
  [DrumNote.LowMidTom]: 'Mid Tom L',
  [DrumNote.HiMidTom]: 'Mid Tom H',
  [DrumNote.Crash1]: 'Crash',
  [DrumNote.HighTom]: 'High Tom',
  [DrumNote.Ride1]: 'Ride',
  [DrumNote.RideBell]: 'Ride Bell',
};

export type MidiNumber = number;

