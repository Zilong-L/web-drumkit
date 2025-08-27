## Web Drumkit — Browser Drum Machine, Metronome, and MIDI Sampler

Play a responsive drum machine in the browser with your keyboard or a MIDI controller. Includes a flexible metronome (per‑beat accents and volumes), a sample‑based drum kit powered by Tone.js, and a clean React UI.

Built with Vite + React + TypeScript + Tailwind CSS. Uses the Web Audio and Web MIDI APIs under the hood.

### Features

- Drum machine: trigger pads by click, keyboard, or MIDI.
- MIDI input: pick devices via Web MIDI and play in real time.
- Metronome: adjustable BPM and beats per bar, per‑beat volume, and accents. Zero‑accent patterns are supported.
- Keyboard mapping: multiple keys per drum, editable and persisted.
- Low‑latency audio: Tone.Transport scheduling and sample caching.
- Modern stack: React 18, Vite 5, TypeScript, Tailwind CSS.

### Quick Start

Requirements: Node.js 18+ recommended.

```bash
# install deps
npm install   # or pnpm install / yarn install

# start dev server
npm run dev   # opens on http://localhost:5173

# build for production
npm run build

# preview built app locally
npm run preview
```

### Usage Tips

- Allow audio playback: first user gesture may be required by the browser before sound starts.
- Web MIDI: works in Chromium‑based browsers in secure contexts (https). Use a local HTTPS dev cert or run the production preview for best results.
- Metronome: toggle per‑beat accents below the bars; drag the vertical bars to set per‑beat volume.
- Keyboard: open the mapping editor to bind multiple keys to any drum for faster rolls.

### Project Structure Highlights

- `src/components/Metronome.tsx`: metronome UI with per‑beat accents/volumes.
- `src/audio/metronome.ts`: transport, scheduling, and click synthesis.
- `src/audio/sampler.ts`: drum sampler, pad→MIDI mapping, and Tone.js voices.
- `src/components/MidiSampler.tsx`: pads grid with MIDI + keyboard input.
- `src/hooks/useKeyboardPads.ts`: keyboard mapping + key down/up handling.

### Drum Samples Submodule

This project includes the excellent open‑source sample library from `gregharvey/drum-samples` as a git submodule located at `drum-samples/`.

Contents (examples):
- 808 / 909 kits
- Acoustic kits
- FX / Percussion

#### Clone with Submodule

If you haven't cloned the repo yet, clone recursively so the samples are fetched in one step (note: ~200MB download):

```bash
git clone --recurse-submodules <your-fork-or-this-repo-url>
```

If you've already cloned without submodules:

```bash
git submodule update --init --recursive
```

#### Updating Samples

To pull in any upstream changes to the samples:

```bash
git submodule update --remote --merge drum-samples
```

#### Using Samples in Code

During development you can reference samples by relative path. For example, to load a kick sample:

```ts
// Example (ensure proper user gesture before audio playback in browsers)
const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
async function loadSample(path: string) {
  const res = await fetch(path);
  const arrayBuf = await res.arrayBuffer();
  return audioCtx.decodeAudioData(arrayBuf);
}

loadSample('/drum-samples/Drum Kits/808/Kick/KICK 808 01.wav').then(buffer => {
  const src = audioCtx.createBufferSource();
  src.buffer = buffer;
  src.connect(audioCtx.destination);
  src.start();
});
```

You may want to build a small manifest (scan the folder at build time) to map logical pad names to file paths for faster lookups.

#### Production Considerations

Bundling hundreds of large WAV files will bloat your production build. Options:
1. Copy only the subset of samples you use into `public/samples/`.
2. Convert to compressed formats (e.g. 44.1kHz 16‑bit WAV or OGG) during a build step.
3. Lazy‑load on first pad hit instead of preloading everything.

### Tech Stack

- Vite 5
- React 18 + TypeScript
- Tailwind CSS 3
- Tone.js (Web Audio)
- Web MIDI API

Keywords: web drum kit, browser drum machine, online metronome, MIDI drum sampler, React drum machine, Tone.js, Web Audio, Web MIDI.
