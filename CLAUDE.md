# SAKURA & SAWASDEE — Project Constitution

> Read this file before writing any code. Rules here override any conflicting instruction.

## 1. What this game is

A pastel pixel-art browser RPG that teaches Japanese and Thai.
Players collect "Kotodama" (word spirits) — one Kotodama = one vocabulary word.
They fight "The Silence" (a fog that eats language) by answering language
questions and building sentences (Sentence Combo).

**Reference points:** Pokémon Gen 4 (exploration/collection) + Dragon Quest
(turn-based combat) + Stardew Valley (warm atmosphere)

**Two-way audience:**
- Thai speakers (L1=th) learning Japanese (L2=ja)
- English speakers (L1=en) learning Thai (L2=th)

Full design details: `docs/01_GDD.md`
Build prompts: `docs/02_Prompt_Pack.md`

## 2. Tech stack (do not change without asking)

- Vite 6 + React 19 + TypeScript 5.7 (strict mode)
- Phaser 4.1 — overworld/tilemap/sprites only
- Tailwind CSS 4 — all styling
- Zustand — global state
- ts-fsrs — spaced repetition algorithm
- Zod — content validation
- Dexie — IndexedDB (local save)
- Howler.js — audio
- Framer Motion — UI animation
- Vitest — testing

## 3. Folder structure (mandatory)

```
src/
├── game/       Phaser only — scenes/, entities/, systems/
├── ui/         React only — screens/, battle/, components/, hooks/
├── learning/   pure learning logic — srs, questionGenerator, comboValidator
├── content/    pure JSON + schema.ts (Zod)
├── state/      Zustand stores + eventBus
├── data/       Dexie DB layer
└── i18n/       UI strings (th/en/ja)
```

## 4. Architecture rules (non-negotiable)

1. `src/learning/` must not import from `game/` or `ui/` — pure, independently testable functions
2. `src/game/` must not import React
3. `src/ui/` must not import Phaser
4. Phaser ↔ React communicate only via Zustand stores and the event bus (`src/state/eventBus.ts`)
5. `src/content/` is pure JSON, no logic, Zod-validated on load
6. All persistent state goes through `src/data/` only
7. **No file may exceed 300 lines** — split it
8. No `any`, no `@ts-ignore` — if you're stuck, ask

## 5. Art spec (mandatory for every asset)

- Base resolution: 480 × 270 px, integer scaling with nearest neighbour
- Tiles: 32×32 px | Characters: 32×48 px | Kotodama: 32×32 px
- Characters: 4 directions, walk 4 frames @8fps, idle 2 frames @2fps
- **Palette:** never use #000000 or #FFFFFF (snow excepted)
  Outlines use `#4A3F55` (INK_DARK) only
- Saturation ≤ 60%, Lightness ≥ 45% — always pastel
- Light source from the upper left at 45°, always
- Every scene must contain at least one always-moving element (petals/smoke/water)

### Master palette (use only these)

Defined in code at `src/game/palette.ts` — import from there, never hardcode hex.

```
INK_DARK #4A3F55  INK_MID #6B5F78   INK_SOFT #9188A0
SAKURA_1 #FFF0F5  SAKURA_2 #FFD9E8  SAKURA_3 #F7A8C4  SAKURA_4 #D97FA5
SKY_DAY #BDE3FF   SKY_DAWN #FFD4C4  SKY_DUSK #C9A8D9  SKY_NIGHT #5A5A8C
WATER_1 #C8ECF5   WATER_2 #7FC4E0   WATER_3 #4E93B5
MINT_2 #C8F2E0    LEAF_1 #A8DDB5    LEAF_2 #7BB88F    LEAF_3 #4E7D5E
CREAM_2 #FFF6E5   CREAM_3 #F5E3C8   GOLD_1 #FFE08A    GOLD_2 #F2C879
LAVENDER_2 #E0D7FF  LAVENDER_3 #C9B8F0
FOG_1 #D8D4E0     FOG_2 #A9A3B8     FOG_3 #6E6880
MANGO #FFE3A3     TEAK_1 #C9A27E    TERRACOTTA #E09B7D
RIVER_TEAL #9FD8CE  TUKTUK_PINK #F5A3C7  TUKTUK_BLUE #A3C7F5
SNOW_2 #F0F4FA    MOMIJI_1 #FFB39B  BRANCH_1 #A88A7D
```

## 6. Five design pillars (every feature must pass)

1. **Always gentle** — wrong answers must not punish harshly; fleeing a battle always works; no blood-red, no buzzers
2. **Every mechanic teaches** — no minigame unrelated to language
3. **Living pastel** — the world must always be in motion
4. **Comprehensible from day one** — dialogue adapts to known words (90–95% known)
5. **Culture as mechanic** — politeness/keigo/tones are real stat systems

## 7. Kotodama elements = word classes

| Element | Word class | Colour |
|---|---|---|
| bloom 🌸 | noun | SAKURA_3 #F7A8C4 |
| spark ⚡ | verb | GOLD_1 #FFE08A |
| flow 💧 | adjective | WATER_2 #7FC4E0 |
| echo 🌙 | particle/grammar | LAVENDER_3 #C9B8F0 |
| stone ⛰️ | character (kanji/Thai letter) | TEAK_1 #C9A27E |
| light ✨ | phrase/idiom | CREAM_2 #FFF6E5 |

**Grammatically valid combos:**
- Japanese: bloom → echo → bloom → echo → spark (私はすしを食べます)
- Thai: bloom → spark → bloom → echo → bloom (ฉันกินข้าวที่ตลาด)

Multipliers: 2=×1.5, 3=×2.0, 4=×2.8, 5=×3.5, 6+=×4.5

## 8. Coding conventions

- File naming: PascalCase for components/classes, camelCase for utilities
- Always use named exports, except React page components
- Every function in `src/learning/` needs a unit test (Vitest)
- Comments in English; all player-facing strings live in `src/i18n/` only
- Never hardcode Thai or Japanese text in code — it comes from content or i18n

## 9. Performance budget

- First load < 3 MB gzipped
- 60fps desktop / 30fps+ mobile
- Assets per region < 800 KB (lazy-loaded)
- Memory < 250 MB

## 10. How to work with me

- **If you're unsure, ask. Never guess.**
- **Never write TODOs, placeholders or mock data without telling me** — if unavoidable, list them at the end of your report
- After writing code, always run `npx tsc --noEmit` and `npm run build` and report the result
- Split commits by unit of work using English conventional commits
- Report concisely: what you did, which files, and what remains

## 11. Current status

**Phase 0 scaffold is in place.** Boot scene → World scene renders at 480×270 with a
React UI overlay and a working sakura particle system.

Next up: **Phase 1, prompt P1.1** in `docs/02_Prompt_Pack.md` — real tilemap loading,
grid movement with collision, and camera follow.
