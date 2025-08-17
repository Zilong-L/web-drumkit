## Web Drumkit

Vite + React + TypeScript + TailwindCSS scaffold ready to build a browser drum machine.

### Stack

- Vite 5
- React 18 (TS)
- TailwindCSS 3
- ESLint (TS + React hooks + react-refresh rules)

### Getting Started

Install dependencies and start the dev server:

```bash
pnpm install # or npm install / yarn install
pnpm dev     # starts on http://localhost:5173
```

Build production bundle:

```bash
pnpm build
```

Preview the production build locally:

```bash
pnpm preview
```

### Tailwind
Utility classes are available via `@tailwind` directives in `src/index.css`. The config is in `tailwind.config.js`.

### Next Steps

1. Implement drum pad components (map keys -> audio samples).
2. Add audio loading & playback with Web Audio API.
3. Visual feedback (animations) on key press / click.
4. Recording / loop feature (optional).

---

Happy hacking!

### Drum Samples Submodule

This project includes the excellent open-source sample library from `gregharvey/drum-samples` as a git submodule located at `drum-samples/`.

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
2. Convert to compressed formats (e.g. 44.1kHz 16-bit WAV or even OGG) during a build step.
3. Lazy-load on first pad hit instead of preloading everything.

---
