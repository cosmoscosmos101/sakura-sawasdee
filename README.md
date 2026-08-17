# 🌸 Sakura & Sawasdee

A pastel pixel-art browser RPG that teaches Japanese and Thai.
Every vocabulary word is a **Kotodama** — a word spirit you find, befriend and look after.

- **Design document:** [`docs/01_GDD.md`](docs/01_GDD.md)
- **Build prompts:** [`docs/02_Prompt_Pack.md`](docs/02_Prompt_Pack.md)
- **Project rules (read this first):** [`CLAUDE.md`](CLAUDE.md)

---

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
```

Other scripts:

```bash
npm run typecheck   # tsc --noEmit
npm run test        # vitest
npm run build       # typecheck + production build
npm run lint
npm run format
```

> **Note:** `package.json` pins Phaser `^4.1.0`, React `^19`, Tailwind `^4` and Vite `^6`.
> If `npm install` reports a peer conflict, run `npm install --legacy-peer-deps` and
> report which package conflicted.

---

## What's in the box (Phase 0)

This is the **foundation scaffold** described in the Prompt Pack's Phase 0. It gives you:

- Vite + React 19 + TypeScript 5.7 in strict mode
- Phaser 4 rendering at 480×270 with **integer-only** scaling (no blurry half-pixels)
- A React UI overlay above the canvas — all text is HTML, because pixel fonts
  cover neither Thai nor kanji
- A typed event bus (`src/state/eventBus.ts`) as the only Phaser ↔ React channel
- A working **sakura particle system** with 3 parallax layers and sine-wave wind
- The 48-colour master palette, in code and locked
- Zod content schemas + 3 real sample vocabulary entries
- The **Sentence Combo validator** with 14 passing unit tests

### Placeholder assets

Every sprite and tile is **generated in code** in `BootScene.makePlaceholderTextures()`.
There is no real art yet. Prompt **P1.1** replaces this with real spritesheets and
a Tiled tilemap. The placeholders exist so the systems around them can be built and
tested first.

---

## Architecture

```
src/
├── game/       Phaser only — never imports React
├── ui/         React only — never imports Phaser at runtime
├── learning/   pure logic — never imports either; fully unit-tested
├── content/    pure JSON + Zod schemas
├── state/      Zustand stores + the event bus
├── data/       Dexie (IndexedDB) layer
└── i18n/       UI strings
```

These boundaries are enforced by ESLint (`eslint.config.js`), not just convention.
They exist because keeping the three layers separate is what makes the codebase
safe to hand to an AI agent for a long autonomous run.

---

## What to do next

Open [`docs/02_Prompt_Pack.md`](docs/02_Prompt_Pack.md) and run prompt **P1.1**
(overworld movement) with Claude Fable 5.

Then P1.2 → P1.3 → P1.4. After P1.4, **stop** and have five people play the first
15 minutes before touching Phase 2.

---

## Licence and attribution notes

Planned content sources carry obligations that must be honoured before any
commercial release:

| Source | Licence |
|---|---|
| JMdict / KANJIDIC2 | CC BY-SA — attribution required, share-alike may affect commercial use |
| Tatoeba | CC BY 2.0 FR |
| ts-fsrs | MIT |

Verify these terms with a lawyer before launching commercially.
