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
