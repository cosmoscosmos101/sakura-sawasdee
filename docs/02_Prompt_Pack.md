# 🎯 PROMPT ENGINEERING PACK
### For building **SAKURA & SAWASDEE** with Claude Fable 5 / Opus 5

> Use alongside `01_GDD.md`
> How to use: copy one block at a time, run it phase by phase. **Do not skip ahead.**

---

## 📋 Contents

| Part | Contents |
|---|---|
| **A** | Picking the right model for the job |
| **B** | Eight prompt-writing principles |
| **C** | ⭐ CLAUDE.md — the project constitution (create this first) |
| **D** | Phase 0–7 build prompts |
| **E** | Content generation prompts (vocab / dialogue / Kotodama) |
| **F** | AI pixel art prompts |
| **G** | Debugging and refinement prompts |
| **H** | End-of-phase checklist |

---

# A. Picking the Right Model

| Job | Recommended model | Why |
|---|---|---|
| **Building an entire phase (2–8 hour autonomous run)** | **Claude Fable 5** | The model that works independently for longest — it plans across stages, delegates to sub-agents and checks its own work. Ideal for implementing a whole phase in one go. |
| Architecture design / weighing options | **Opus 5** | Faster to respond and strong at design analysis — good for back-and-forth |
| NPC dialogue / narrative writing | **Opus 5** | Creative work needing a specific voice |
| Small bug fixes / single-file refactors | **Sonnet 5** | Fast and economical |
| Generating large volumes of vocabulary data | **Fable 5** in agent mode | Long repetitive work at volume |

**Recommended rhythm:**
```
Opus 5   → discuss the design, produce a plan
   ↓
Fable 5  → implement the whole phase (let it run long)
   ↓
Sonnet 5 → clean up, fix small bugs
```

---

# B. Eight Prompt-Writing Principles

### 1. Give permanent context once (CLAUDE.md)
Don't re-explain the game every time → put it in `CLAUDE.md` and Claude reads it automatically.

### 2. Ask for "a unit that actually works," not "a file"
❌ "Write Player.ts"
✅ "Make the character walk the map with the arrow keys, with 4-direction animation and camera follow — when it's done I should be able to run `npm run dev` and see it working immediately."

### 3. Always state acceptance criteria
Define "done" in testable terms.

### 4. Force self-verification
End every prompt with:
> "When you're finished, run `npm run build` and `npx tsc --noEmit` to confirm there are no errors, then report back."

### 5. Forbid silent mocks and placeholders
> "If there's anything you don't have enough information for, **stop and ask me.** Never write a TODO or fake data."

### 6. Show the input/output shape you want
Especially for JSON — always paste one real example.

### 7. Constrain the file scope
> "You may only edit files in `src/game/`. Do not touch `src/learning/` or `src/content/`."

### 8. Ask for small, revertible commits
> "Split commits by unit of work. Write commit messages in English using conventional commits."

---

# C. ⭐ CLAUDE.md — Create This First

> **The very first prompt to run:**

```
Create a new project called sakura-sawasdee and create a CLAUDE.md file at the
project root containing exactly the following content (copy it verbatim):

[paste everything below]
```

---

### 📄 `CLAUDE.md` contents

````markdown
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

## 3. Folder structure (mandatory)

```
src/
├── game/       Phaser only — scenes/, entities/, systems/
├── ui/         React only — screens/, battle/, components/, hooks/
├── learning/   pure learning logic — srs, questionGenerator, comboValidator
├── content/    pure JSON + schema.ts (Zod)
├── state/      Zustand stores
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
````

---

# D. Phase 0–7 Build Prompts

---

## 🔧 Phase 0 — Foundation

```
[ROLE]
You are the Lead Game Engineer on SAKURA & SAWASDEE.
Read CLAUDE.md before starting and follow its rules strictly.

[TASK]
Set up the project foundation so development can begin.

[WHAT TO DO]
1. Set up Vite + React 19 + TypeScript 5.7 (strict: true)
2. Install and configure: phaser@^4.1, tailwindcss@^4, zustand, ts-fsrs, zod,
   dexie, howler, framer-motion, vitest
3. Create the full folder structure from CLAUDE.md §3
   (.gitkeep files in empty folders)
4. Configure Phaser to render at 480×270 with:
   - pixelArt: true, antialias: false, roundPixels: true
   - Scale.FIT + autoCenter, integer scaling only
   - window resize support
5. Build a layout with the Phaser canvas underneath and a React UI overlay above
   (absolute positioning, pointer-events handled correctly)
6. Create src/state/eventBus.ts — a typed event emitter for Phaser ↔ React
   Events: 'battle:start', 'battle:end', 'dialogue:open', 'dialogue:close',
   'kotodama:encounter', 'map:change'
7. Create a BootScene showing a logo + loading bar, then transitioning to WorldScene
8. Create a WorldScene showing a solid colour (#C8F2E0) with test text
9. Configure ESLint + Prettier
10. Write a short README.md explaining how to run it

[ACCEPTANCE CRITERIA]
- `npm run dev` shows the game filling the window, scaled without blur
- `npx tsc --noEmit` passes with no errors
- `npm run build` succeeds
- Resizing the window scales the canvas by whole integers with no distortion
- The React UI overlay renders test text on top of the canvas

[CONSTRAINTS]
- No `any`, no `@ts-ignore`
- Don't skip a step without telling me

[WHEN DONE]
Run tsc and build, report the results, list the files created,
and tell me any decisions you made on your own.
```

---

## 🌸 Phase 1 — Vertical Slice (the most important phase)

> **Use Claude Fable 5. Split into 4 sub-prompts and run them one at a time.**

### P1.1 — Overworld movement

```
[ROLE] Lead Game Engineer. Read CLAUDE.md first.

[TASK] Build a genuinely playable overworld exploration system.

[WHAT TO DO]
1. src/game/entities/Player.ts
   - 4-direction movement via WASD/arrows, run with Shift (×1.6)
   - Grid-based at 32px but smoothly interpolated (200ms per tile)
   - Animation: walk 4 frames @8fps, idle 2 frames @2fps
   - If real sprites don't exist yet, use coloured rectangles as placeholders
     but build the full animation system, and clearly comment where real
     sprites must be swapped in

2. src/game/systems/MovementSystem.ts — collision against the 'collision' tilemap layer

3. Load a Tiled tilemap (JSON) — create a 30×20 test map at
   public/assets/maps/test_map.json with layers:
   ground / decoration / collision / above_player
   (generate the JSON yourself, with a code-generated placeholder tileset)

4. Smooth camera follow (lerp 0.1) that never shows beyond the map edges

5. src/game/systems/WeatherSystem.ts — falling sakura particles
   - 50 particles across 3 parallax layers (differing speed/size/opacity)
   - falling 15–40 px/s with rotation
   - wind as a sine wave, 4s period, 20px amplitude
   - colours from the palette: SAKURA_1/2/3
   - API: WeatherSystem.setWeather('sakura' | 'snow' | 'rain' | 'clear')

6. Virtual joystick + A button for mobile (shown when a touch device is detected)

[ACCEPTANCE CRITERIA]
- Movement works in all 4 directions with correct directional animation
- Walls block movement, no clipping through
- Camera follows smoothly and never shows off-map
- Petals fall continuously, look natural, never stutter
- 60fps on desktop (measured with Phaser's FPS counter in dev mode)
- Playable on mobile via the joystick

[CONSTRAINTS]
- Do not touch src/learning/, src/content/, src/ui/
- No silent TODOs

[WHEN DONE] Run tsc + build, report back, and tell me the measured FPS.
```

### P1.2 — Dialogue system + NPCs

```
[ROLE] Lead Game Engineer. Read CLAUDE.md first.

[TASK] Build an NPC conversation system supporting multilingual text and tappable words.

[WHAT TO DO]
1. src/game/entities/NPC.ts — NPCs standing on the map with idle animation
   Press Space/Z when adjacent to talk; a floating "!" appears when they have a quest

2. src/ui/components/DialogueBox.tsx (React)
   - Rounded box, fill CREAM_2 #FFF6E5, 3px border INK_DARK #4A3F55
   - Typewriter effect at 30 chars/sec, skippable
   - Speaker name + portrait on the left
   - Open/close animation over 150ms (scale + fade) via Framer Motion

3. Support three simultaneous text layers:
   - Main line = the language being learned (L2)
   - Reading line (furigana/romanisation) — toggleable in settings
   - Translation line (L1) — toggleable

4. Words the player doesn't yet know render in a distinct colour (LAVENDER_3)
   and are tappable → a tooltip shows written form / reading / meaning / play-audio button

5. Branching dialogue — the player picks from 2–4 response options

6. Dialogue data format in src/content/ja/dialogue.json
   Define the Zod schema in src/content/schema.ts with 3 real example conversations

[ACCEPTANCE CRITERIA]
- Walking to an NPC and pressing Space opens the box with its animation
- Thai and Japanese text render correctly, no corruption, no overflow
- Tapping an unknown word shows a tooltip
- Choosing an option branches the conversation correctly
- Closing the box restores character control immediately

[IMPORTANT NOTE]
All text is rendered with React/HTML, not Phaser text objects,
because pixel fonts don't support Thai or kanji — use IBM Plex Sans Thai + Noto Sans JP

[WHEN DONE] Run tsc + build and report back.
```

### P1.3 — Combat (the heart of the game)

```
[ROLE] Lead Game Engineer. Read CLAUDE.md §6 and §7 carefully first.

[TASK] Build the complete Sentence Combat system.

[CONTEXT]
Combat is turn-based, first-person, Dragon Quest style.
Enemies are "Fog Words" whose armour is a sentence with gaps.
The player sends Kotodama (= vocabulary words) in to answer questions and deal damage.

[WHAT TO DO]

1. src/learning/questionGenerator.ts — pure functions, no UI/Phaser dependency
   Generate 5 question types in this phase from a VocabEntry:
   - meaning_match: show the L2 word → pick the L1 meaning (4 options)
   - reverse_recall: show the L1 meaning → pick the L2 word
   - listening: play audio → pick the word
   - script_reading: show the written form → pick the correct reading
   - sentence_build: given word cards → arrange them into a sentence

   Distractors must be intelligent: choose words that look similar, sound similar,
   or share a category — never random. Write unit tests for every type.

2. src/learning/comboValidator.ts — pure function
   input: the ordered Kotodama[] the player sent + the language
   output: { valid: boolean, chainLength: number, multiplier: number, reason?: string }

   Japanese rule: bloom→echo→bloom→echo→spark is valid
   Thai rule: bloom→spark→bloom→echo→bloom is valid
   Multipliers: 2=1.5, 3=2.0, 4=2.8, 5=3.5, 6+=4.5
   Write at least 12 unit test cases (valid and invalid).

3. src/game/scenes/BattleScene.ts (Phaser)
   - Pastel painted backdrop of the location (a placeholder gradient is fine initially)
   - Enemy sprite centred, with a floating idle animation
   - The 4-Kotodama party along the bottom
   - Effects: damage, critical, combo chain (a rainbow linking the Kotodama)
   - Gentle screen shake on being hit (not violent — Pillar 1, Always Gentle)

4. src/ui/battle/ (React) — overlaid on BattleScene
   - BattleHUD.tsx: enemy HP, player HP, sentence armour
   - QuestionCard.tsx: the question + options + a soft curved timing bar
   - ComboBar.tsx: current chain and multiplier
   - CommandMenu.tsx: Send / Combo / Item / Listen / Flee

5. Timing and criticals
   - Answer within 3s = CRITICAL ×2 (with a golden sparkle effect)
   - 3–8s = normal
   - Over 8s = ×0.7, still counts as correct
   - Record the response time to feed the SRS in the next phase

6. Wrong answers must not punish harshly
   - The Kotodama looks sad (different sprite frame)
   - The player loses a small amount of HP (5%)
   - Show the correct answer with a one-line explanation
   - No bright red, no buzzer — use a soft descending tone instead

7. Fleeing always succeeds, with no penalty

[ACCEPTANCE CRITERIA]
- Bump a wild Kotodama → battle → answer → win/lose → return to the map
- A 3+ Sentence Combo works with a clearly visible effect
- All comboValidator and questionGenerator unit tests pass
- Being wrong doesn't feel punishing — playtest it yourself and describe how it feels
- 60fps throughout the battle scene

[CONSTRAINTS]
- src/learning/ must import nothing from game/ or ui/, ever
- Never hardcode vocabulary in code — read it from the content JSON

[WHEN DONE]
Run tsc + build + vitest, report back, explain how the combo system works
and which cases you tested.
```

### P1.4 — Tutorial (first 15 minutes) + saving

```
[ROLE] Lead Game Engineer + Game Designer. Read CLAUDE.md first.

[TASK] Assemble everything into a complete, memorable first 15 minutes.

[SCENE CONTEXT]
The player (a Thai speaker learning Japanese) wakes on a train pulling into Sakura Gate.
Momo (a pink cat-rabbit Kotodama) appears and explains that words are disappearing.
The player walks out of the station, along the sakura path, up to the school.
Along the way they meet 7 hiragana Kotodama and 2 Fog Words.
It ends with the player reading the school sign 「はなみがくえん」 for the first time.

[WHAT TO DO]
1. Two maps: sakura_station.json and sakura_path.json
   (author the Tiled JSON yourself with code-generated placeholder tilesets)

2. Momo — follows the player, speaks at key trigger zones
   Personality: cheerful, caring, ends lines with 「〜だよ！」

3. Show-don't-tell tutorial — no long explanation boxes.
   Let the player try, then explain a little at a time.

4. Content taught: 7 hiragana = は な み が く え ん
   (together they spell はなみ (Hanami) + がくえん (Academy) exactly
    → at the end the player can read every character on the sign 「はなみがくえん」)
   Teach one per Kotodama, spread along the route.

5. The closing moment: the camera zooms to the school sign, each character
   lights up in turn, then the translation appears — with a musical peak.
   ⭐ This is the moment the player feels "I can read this!" Make it the best thing in the build.

6. src/data/db.ts — a Dexie schema storing:
   playerProfile, kotodamaCollection, srsCards, worldState, settings
   Autosave every 30 seconds and on every map change. Include schema versioning/migrations.

7. Start screen: choose native language (Thai/English) and target language
   (Japanese/Thai) + character customisation
   (hair colour 8, hairstyle 12, skin tone 6, eyes 8)

[ACCEPTANCE CRITERIA]
- Playable start-to-tutorial-end with no interruptions, taking 12–18 minutes
- Close the browser, reopen, and all data is intact
- The player can genuinely read はなみがくえん at the end
- Works on mobile

[QUESTIONS TO ANSWER BACK]
After it's built, playtest it yourself and tell me:
- Which stretch is the most boring
- Which stretch is confusing
- Whether the closing moment lands hard enough — and if not, what to change

[WHEN DONE] Run tsc + build + tests, and report back.
```

---

## 📚 Phase 2 — Learning Engine

```
[ROLE] Learning Systems Engineer. Read CLAUDE.md first.

[TASK] Build the learning engine that is the game's actual heart.

[WHAT TO DO]

1. src/learning/srs.ts — a wrapper around ts-fsrs
   - Map in-game outcomes to FSRS ratings:
     critical (correct <3s)      → Rating.Easy (4)
     correct, normal             → Rating.Good (3)
     correct but slow/assisted   → Rating.Hard (2)
     incorrect                   → Rating.Again (1)
   - Functions: reviewCard(), getDueCards(), getNewCards(), getStats()
   - Unit tests covering: on-time review / early review / late review / lapse

2. Convert FSRS retrievability into Kotodama memory states:
   90–100% = radiant (ATK +30%, combo-eligible)
   60–89%  = bright (normal)
   30–59%  = dazed (ATK −25%)
   10–29%  = sleepy (unusable, must be woken)
   0–9%    = fading (at risk of leaving the party)
   Below 9% for 7 consecutive days → the Kotodama returns to the wild and must be recaught

3. Expand to all 12 question types (5 exist from Phase 1):
   cloze, tone_match (Thai), pitch_match (Japanese), speaking (optional),
   context_choice, counter_word (Japanese), politeness_register

4. src/learning/comprehensibleInput.ts
   Select dialogue where 85–97% of words are already known, the rest new.
   If nothing qualifies, fall back to the closest ratio.

5. src/learning/difficultyBalancer.ts
   Track success rate over a rolling window of the last 20 questions.
   Target 85–90% — above that, raise the proportion of hard question types;
   below it, reduce new words per day and increase review.

6. Translate the SRS queue into game language (never an Anki-style list):
   - due cards → "N Kotodama are asleep in the garden. Let's go wake them!"
   - lapsed cards → "The fog has taken N Kotodama! Hurry!"
   - new cards → "N wild Kotodama have appeared at <location>"
   - Kotodama due for review glow gold on the overworld

7. Japanese content: 46 hiragana + 46 katakana + the first 200 N5 words
   Complete against the schema including Kotodama name/description/habitat
   (see Part E for generation)

[ACCEPTANCE CRITERIA]
- Unit tests cover srs.ts, questionGenerator.ts, comboValidator.ts,
  comprehensibleInput.ts and difficultyBalancer.ts, all passing
- A 30-day simulation produces a sensible review schedule
  → write tests/simulate30days.ts simulating a player answering 85% correctly,
    printing a chart of cards due per day
- Kotodama states change correctly over real time (test with fake timers)
- The words "review", "SRS" and "card" never appear anywhere the player can see

[WHEN DONE] Run all tests and report back with the 30-day simulation results.
```

---

## 🏫 Phase 3 — Full Japanese World

```
[ROLE] Lead Game Engineer. Read CLAUDE.md and GDD §9 first.

[TASK] Build all 8 regions of Hanami-chō plus the living-world systems.

[MAPS TO BUILD]
1. sakura_station    train station, wooden platform, vending machine, timetable
2. hanami_academy    school, 9 rooms (shoe lockers/classroom/library/club room/
                     cafeteria/courtyard/rooftop/infirmary/music room)
3. sakura_path       riverside walk ⭐ signature scene
4. shopping_street   awnings, paper lanterns, ramen shop, gachapon
5. shrine            stone steps, torii, bamboo, ema
6. winter_courtyard  ⭐ light snow, stone lanterns, visible breath
7. festival_grounds  night matsuri, yatai, fireworks
8. autumn_hill       maple leaves, wooden pavilion

[SYSTEMS TO BUILD]
1. src/game/systems/SeasonSystem.ts
   Seasons on the real calendar: spring(Mar–May) summer(Jun–Aug)
   autumn(Sep–Nov) winter(Dec–Feb)
   Changes: tileset variant, whole-scene colour tint, particles, BGM
   Players can view other seasons via a "Season Album" menu (so nobody misses content)

2. src/game/systems/TimeSystem.ts
   Uses the real device clock: dawn(5–7) day(7–17) dusk(17–19) night(19–5)
   Changes the colour overlay, toggles lanterns, removes some NPCs

3. src/game/systems/EncounterSystem.ts
   Visible encounters — wild Kotodama walk the map, never random pop-ins
   - Kotodama due for review glow gold
   - Each region has a habitat pool matched to word tags
   - Sakura grass = high-density spots with a rustle animation

4. Streak Tree system (src/ui/screens/StreakTree.tsx)
   The courtyard sakura tree = your streak
   - Daily play opens more blossoms (5 stages: bare → bud → bloom → full bloom → radiant)
   - Miss 1 day = petals fall; 3 days = yellowing leaves; 7 days = reset
   - "Winter wraps" (streak freezes), maximum of 2 held at once
   - Tap the tree for a 365-day heatmap of your history

5. Omikuji at the shrine — once per day
   Random result: 大吉/中吉/小吉/末吉/凶
   Grants a daily buff (XP ×1.5 / fewer hard questions / higher rare spawn rate)
   plus one daily quest

6. Kotodama Dex (src/ui/screens/DexScreen.tsx)
   A page-turning picture book with a page-flip animation
   Shows: sprite / name / word + reading + meaning / element / memory state /
   where found / example sentences / play-audio button
   Filters: element, level, memory state, caught/uncaught
   Displays completion percentage

7. My Room (src/ui/screens/RoomScreen.tsx)
   A Japanese dorm room with grid drag-and-drop furniture placement
   and a display case for 6 favourite Kotodama

8. 15 NPCs + 20 quests
   Every NPC has 5 dialogue tiers keyed to player progress

9. 3 bosses: Katakana Ghost, Counter Golem, Keigo Kaiju
   Each with the gimmick described in GDD §6.7

[ACCEPTANCE CRITERIA]
- Moving between all 8 regions is seamless and fast (<500ms per region)
- Changing the system date correctly changes season and time of day
- Streak counting is correct; winter wraps work; never more than 2
- Roughly 10 hours of playable content
- Assets per region < 800 KB, first load < 3 MB

[WHEN DONE] Report back with the measured bundle size.
```

---

## 🛺 Phase 4 — The Thai World

```
[ROLE] Lead Game Engineer. Read CLAUDE.md and GDD §10 first.

[TASK] Build all 8 regions of Talat Rim Khlong plus the Thai-specific teaching systems.

[MAPS]
1. tuktuk_terminal   concrete lot under a tree, pastel tuk-tuks in a row
2. fresh_market      ⭐ coloured umbrellas, fruit stacks, noodle-pot steam, spinning fans
3. temple            soft-gold chedi, murals, incense, falling bodhi leaves
4. pier              long-tail boats, water hyacinth, warm evening light
5. old_town          faded pastel shophouses, louvred shutters, tangled wires
6. rice_field        paddy fields, buffalo, egrets, wide sky
7. night_market      open 18:00–02:00 by the device clock
8. floating_market   weekends only

[THAI TEACHING SYSTEMS — the hardest and most important part]

1. src/learning/thai/scriptSystem.ts
   Teach the 44 consonants in three classes:
   - 9 mid-class (ก จ ฎ ฏ ด ต บ ป อ) = gold Kotodama GOLD_2
   - 11 high-class (ข ฃ ฉ ฐ ถ ผ ฝ ศ ษ ส ห) = blue WATER_2
   - 24 low-class = pink SAKURA_3
   Vowels and tone marks taught as separate layers

2. The "Tone Kitchen" — teaching tone rules
   Combine: consonant class + vowel length + final consonant (live/dead) + tone mark
   = the resulting tone
   Build it as a crafting minigame in Pa Somsri's kitchen, not a memorisation table.
   Rules must be shown visually, never as text.

3. Karaoke / rhythm minigame (src/game/scenes/KaraokeScene.ts)
   ⭐ The feature no competitor has — the only real way to teach tones
   - Lyrics scroll in time with the music
   - Show a "pitch contour" for each syllable
     (mid=flat, low=falling, falling=rise-then-fall, high=high, rising=fall-then-rise)
   - The player taps in time + (with mic enabled) real pitch is compared via
     the Web Audio API using autocorrelation to find the fundamental frequency
   - Mic-free mode: just pick the contour that matches what you heard

4. Word segmentation minigame — the Naga boss at the pier
   Show unspaced Thai signage; the player draws lines to split words
   e.g. "ก๋วยเตี๋ยวเรือรสเด็ด" → ก๋วยเตี๋ยว|เรือ|รส|เด็ด

5. Thai handwriting minigame — trace starting from the head-loop
   Use SVG paths and check the player's stroke stays within a tolerance
   With a soft brush/pen sound

6. Politeness Meter — a real stat system
   Correct use of ครับ/ค่ะ/นะคะ = NPCs respond better, give discounts and gifts
   Never using them = NPCs answer curtly and withhold extra information
   (not angry — just cool)

7. Bargaining minigame — Pa Somsri
   Requires correct Thai numbers + polite forms + not lowballing too hard

8. Tuk-tuk racing minigame — drive a route, read signs fast enough to turn correctly
   Measures reading fluency (words per minute)

9. Pier fishing minigame — relaxed mode, no timer
   Catches "words" due for review — for days when the player is tired

10. Full en→th locale pair support
    (English UI + Thai grammar explanations written for foreigners)

11. 500 Thai words, complete against the schema

[CULTURAL CAUTIONS]
- The monk character (Luang Phor Somdet) must be portrayed respectfully.
  He never fights, is never comic relief, and his scenes have no timers.
- The wai and alms-giving must follow real custom.
- If you're unsure whether something is culturally appropriate, stop and ask me.

[ACCEPTANCE CRITERIA]
- Travel between Japan and Thailand works via the airport/harbour
- The night market really is open only 18:00–02:00
- The floating market really is weekend-only
- All 6 minigames are playable, fun, and genuinely teach
- A foreigner learning Thai can play end-to-end from the start through Chapter 3

[WHEN DONE]
Report back and tell me which minigame you think is the most fun
and which is the most boring, and why.
```

---

## 🎨 Phase 5 — Polish | 🧪 Phase 6 — Beta | 🚀 Phase 7 — Launch

<details>
<summary>Expand Phase 5–7 prompts</summary>

### Phase 5 — Polish
```
[TASK] Get the game ready for outside players.

1. Audio — full Howler.js integration:
   - 13 BGM tracks with a 1.5s crossfade on region change
   - 40+ SFX
   - Looping ambient beds per region — cicadas/market/water/traffic
   - Vocabulary audio playback: load from public/assets/audio/voice/,
     falling back to the Web Speech API when no file exists
   - Separate volume controls: BGM / SFX / Voice / Ambient

2. Accessibility (important — do not skip):
   - 3 font size settings
   - Reduced motion mode (disables particles/screen shake)
   - Colourblind mode (element indicators become shapes, not just colours)
   - Full keyboard navigation
   - Screen reader support in the React UI (aria labels)
   - Typewriter effect can be turned off

3. Performance:
   - Lazy-load assets per region
   - Texture atlases for sprites
   - Object pooling for particles
   - Test on a mid-range phone (target 30fps+)

4. Seven story cutscenes (stills + text + music + fade transitions)

5. Complete settings screen + a learning stats screen
   (words known, streak, total playtime, progress graph)

[ACCEPTANCE] Lighthouse performance > 85; 30fps+ on iPhone SE / mid-range Android
```

### Phase 6 — Beta
```
[TASK] Prepare data collection and balancing.

1. Analytics (privacy-first, no personal data):
   - Track: where players quit, questions answered wrong >40% of the time,
     which minigames get skipped, session length, retention
   - A simple dashboard to view results

2. In-game bug report button on every screen

3. Balance pass:
   - Run a script analysing success rate per question
   - Questions wrong >40% of the time → flag for my review
   - Questions right >98% of the time → too easy

4. Write tests/playthrough.spec.ts — an E2E test that plays
   from the start through Chapter 2 automatically

[ACCEPTANCE] E2E test passes; no crashes across 100 simulated sessions
```

### Phase 7 — Launch
```
[TASK] Ship and extend.

1. Supabase: auth + cloud sync (conflict resolution: last-write-wins per card)
2. Weekly leagues of 10
3. Friends + room visits
4. PWA manifest + service worker (offline play)
5. Capacitor wrapper for iOS/Android
6. Additional locale pairs: ja→th, en→ja

[ACCEPTANCE] Installable as a PWA; cross-device sync correct; offline play works
```

</details>

---

# E. Content Generation Prompts

## E.1 — Vocabulary + Kotodama data (use Fable 5 in agent mode)

```
[ROLE]
You are a Content Designer and applied linguist fluent in both Japanese and Thai.

[TASK]
Generate 50 JLPT N5 Japanese vocabulary entries (set 1: food and shops)
as JSON matching the schema in src/content/schema.ts

[REQUIREMENTS]

1. Every entry must have every required field. Nothing blank, nothing null.

2. "meaning" must include both th and en.
   Thai translations must be what Thai people actually say, not stiff literal renderings.
   e.g. 美味しい → "อร่อย", not "มีรสชาติดี"

3. "kotodama" — design an adorable pastel creature for each word
   - name: a cute name derived from the word (e.g. 猫→Nekoko, パン→Panpan)
   - description: 1–2 sentences describing its form and personality,
     connected to the word's meaning to aid memory
   - rarity: common/uncommon/rare/legendary based on usage frequency
     (frequently used words should be common, so players meet them often)
   - habitat: choose from [sakura_station, hanami_academy, sakura_path,
     shopping_street, shrine, winter_courtyard, festival_grounds, autumn_hill]
     Choose sensibly (food words → shopping_street, festival_grounds)

4. "examples" — at least one sentence
   - Must be something genuinely used in daily life
   - Must use only N5-level grammar and vocabulary
   - "context" must match the habitat

5. "mnemonic" (for kanji) — a short memory story in English
   that decomposes the kanji's components into a narrative

6. "particleAffinity" — the particles most commonly used with this word
   (critical for the combo system)

7. "frequency" — its frequency rank in Japanese (lower = more common),
   estimated from your knowledge

[OUTPUT]
Write to src/content/ja/vocab_food_01.json as an array of objects
that validate against the Zod schema.
When finished, run the validation script to confirm it passes.

[EXEMPLAR — match this quality level]
{
  "id": "ja_n5_0042",
  "lang": "ja",
  "written": "猫",
  "reading": "ねこ",
  "romanization": "neko",
  "meaning": { "th": "แมว", "en": "cat" },
  "pos": "noun",
  "element": "bloom",
  "level": "N5",
  "chapter": 2,
  "tags": ["animal", "daily", "pet"],
  "frequency": 812,
  "audio": "voice/ja/n5_0042.mp3",
  "pitchAccent": 1,
  "particleAffinity": ["が", "を", "は"],
  "counterWord": "匹",
  "examples": [{
    "sentence": "猫が好きです。",
    "reading": "ねこがすきです。",
    "translation": { "th": "ชอบแมวครับ", "en": "I like cats." },
    "audio": "voice/ja/ex_n5_0042_1.mp3",
    "context": "school"
  }],
  "kotodama": {
    "name": "Nekoko",
    "sprite": "kotodama/nekoko.png",
    "spriteEvolved": "kotodama/nekomaru.png",
    "description": {
      "en": "A sleepy kitten that naps on the school roof. Its tail curls into the shape of 猫."
    },
    "rarity": "common",
    "habitat": ["hanami_academy", "shopping_street", "sakura_path"],
    "evolveCondition": { "type": "combo_count", "value": 20 }
  },
  "mnemonic": {
    "en": "犭(beast radical) + 苗(seedling) → the small creature hiding among the seedlings"
  }
}

[ABSOLUTE CONSTRAINTS]
- Never include a translation you're unsure of — mark it "needsReview": true instead
- Never write an example sentence that's ungrammatical or unnatural
- Never use kanji above N5 level in example sentences

[NOTE]
This data must be checked by a native speaker before real use.
List at the end which entries you're least confident about.
```

> 🔁 **Repeat this prompt for other categories:** school, family, numbers, time, weather, body, emotions, travel, daily verbs, adjectives

## E.2 — NPC dialogue

```
[ROLE] Narrative Designer who writes natural Japanese game dialogue.

[TASK] Write 10 dialogue scenes for the NPC "Yuki-sensei" (雪先生).

[CHARACTER]
A young woman with long white hair, thin-framed glasses, a pale blue shawl.
Calm, cool, but quietly kind. Speaks slowly and clearly, always politely
(です/ます) but never stiffly.
She once lost some of her own words to The Silence — there's hidden sadness there.
She believes "speaking incorrectly is part of learning to speak."

[REQUIREMENTS]
1. Use only vocabulary and grammar the player already knows, at 90–95%
   (I'll give you the known-word list)
2. Each scene is 3–5 lines, each line no more than 25 Japanese characters
3. Provide sentence / reading (all hiragana) / translation (th + en)
4. Scenes 3, 6 and 9 include 2–3 response options leading to different outcomes
5. Tone: warm but not saccharine; sparing with jokes
6. The content should gradually reveal her backstory
   (scene 1 = simple greeting; scene 10 = she begins to speak of what she lost)

[WORDS THE PLAYER KNOWS AT THIS POINT]
[paste the 200-word list from vocab.json where chapter <= 3]

[OUTPUT]
Write to src/content/ja/dialogue_yuki.json matching the Zod schema

[WHEN DONE]
Report how many words fall outside the list (should be 5–10%) and which ones.
```

## E.3 — Thai vocabulary for foreign learners

```
[ROLE] A Thai teacher for foreign learners who understands where they get confused.

[TASK] Generate 50 A1-level Thai vocabulary entries, market category.

[THAI-SPECIFIC REQUIREMENTS]

1. "romanization" — use a system that clearly marks tone,
   e.g. "khâao" (ข้าว, falling tone), not just "khao"
   State which system you're using and apply it consistently throughout the file.

2. "tone" — the tone as a number
   0=mid 1=low 2=falling 3=high 4=rising

3. Add a "toneRule" field explaining why the word carries that tone
   e.g. "high-class consonant (ข) + long vowel + mai ek → low tone"
   ⭐ This is the part that genuinely teaches foreigners.

4. Add a "minimalPairs" field — words similar enough in spelling or sound to confuse
   e.g. ข้าว(khâao) / ขาว(khǎao) / เขา(khǎo)
   Use these as question distractors and as standalone lessons.

5. Write the kotodama description in English (the audience is foreign learners).

6. habitat from [tuktuk_terminal, fresh_market, temple, pier,
   old_town, rice_field, night_market, floating_market]

7. ⚠️ Important: words carrying politeness implications must specify register.
   Add "register": "formal" | "polite" | "casual" | "monastic"
   and flag when using the word in the wrong setting would be rude.

[CAUTIONS]
- No vulgar words, and nothing that would lead a learner into social missteps
- Religious and institutional vocabulary must be precise and correctly registered
- If you're unsure about appropriateness, mark it needsReview

[WHEN DONE] Validate against the schema and list entries needing native review.
```

---

# F. AI Pixel Art Prompts

## ⚠️ Read This First

From a survey of 2026 tooling: **AI is good at single still frames but still weak at consistent animation frames and seamlessly tiling tilesets.**

**Recommended workflow:**
```
AI generates a single still frame (primary view)
   ↓
Hand-fix in Aseprite: lock to the 48-colour palette, clean outlines, build 4 directions
   ↓
Animation frames drawn by hand from the key frame (easier than it sounds — 2–3px of movement)
   ↓
Tilesets: use a specialised tool (PixelLab supports tilesets directly)
   or hand-draw from an AI-generated reference tile
```

**Recommended tools (surveyed Aug 2026):**
| Tool | Strength |
|---|---|
| **PixelLab.ai** | Most complete — 4/8 directions, tilesets, skeletal animation, Aseprite plugin |
| **Sprite AI** | Exact grid size control (32×32), free browser tools |
| **Flux 2 / Z Image Turbo + pixel art LoRA** | Fine style control if you know what you're doing |
| **Aseprite** (~$20) | Essential for hand-fixing — the best-value purchase here |

---

## F.1 — Mandatory prefix (prepend to every image prompt)

```
pixel art, 32x32 pixel grid, limited palette 48 colors, pastel color scheme,
soft cozy aesthetic, saturation below 60%, lightness above 45%,
outline color #4A3F55 (never pure black), no pure white except snow,
light source from upper left 45 degrees, blue-violet shadows not gray,
3 shades per object (base, highlight, shadow), no heavy dithering,
clean crisp pixels, no anti-aliasing, transparent background,
2-head-tall chibi proportions, large expressive eyes, no nose or single dot,
Pokemon Gen 4 meets Stardew Valley art style,
--
```

## F.2 — Player character

```
[PREFIX]

A cheerful student character sprite for a top-down 2D RPG, 32x48 pixels.
Wearing a Japanese school uniform: navy blazer with cream trim,
pleated skirt or trousers, white shirt, soft red ribbon tie.
Light brown hair in a short bob with a small sakura hair clip.
Standing pose, facing camera (front-facing, "down" direction).
Cheerful neutral expression, large round eyes.

Palette constraint — use ONLY these colors:
outline #4A3F55, skin #F5D0B0, hair #C9A27E and #9B7B5C,
uniform navy #5A5A8C and #4A3F55, shirt #FFF6E5,
ribbon #F7A8C4, shoes #6B5F78

Character occupies the full 32x48 canvas with 2px margin.
Transparent background. Single frame, standing idle.
```

> Then generate the other 3 directions separately, or draw them yourself from this frame (recommended — faster and more accurate).

## F.3 — Kotodama (word creatures)

```
[PREFIX]

A tiny adorable creature sprite, 32x32 pixels, for a language-learning RPG
where each creature represents a vocabulary word.

Creature: "Nekoko" — represents the Japanese word 猫 (cat)
Design: A round sleepy kitten, cream-colored fur with soft pink inner ears.
Its tail curls into the shape of a hook. Half-closed sleepy eyes.
Small floating sparkle above its head.
Sitting pose, facing camera.

Palette — use ONLY: outline #4A3F55, fur base #FFF6E5,
fur shadow #F5E3C8, inner ear #FFD9E8, eyes #6B5F78,
sparkle #FFE08A

Cute, soft, huggable. Transparent background. Single frame.
```

**Template for other Kotodama — change only 3 lines:**
```
Creature: "[name]" — represents the [language] word [word] ([meaning])
Design: [2–3 sentences tied to the word's meaning]
Palette — use ONLY: outline #4A3F55, [3–5 palette colours matching the element]
```

**Colours by element:**
- bloom (noun) → SAKURA_2 #FFD9E8, SAKURA_3 #F7A8C4
- spark (verb) → GOLD_1 #FFE08A, GOLD_2 #F2C879
- flow (adjective) → WATER_1 #C8ECF5, WATER_2 #7FC4E0
- echo (particle) → LAVENDER_2 #E0D7FF, LAVENDER_3 #C9B8F0
- stone (character) → TEAK_1 #C9A27E, CREAM_3 #F5E3C8
- light (phrase) → CREAM_2 #FFF6E5, GOLD_1 #FFE08A

## F.4 — Japanese tileset (spring)

```
[PREFIX]

A seamless tileset sheet for a top-down 2D RPG, 32x32 pixels per tile,
arranged in an 8x8 grid (256x256 total canvas).

Theme: Japanese town in spring, riverside sakura path.

Tiles needed (left to right, top to bottom):
Row 1: grass base, grass with clover, grass with small flowers,
       fallen sakura petals on grass, dirt path, dirt path edge,
       stone path, stone path edge
Row 2: cobblestone, wooden boardwalk, water shallow, water deep,
       water edge (4 variations for corners)
Row 3: sakura tree trunk, sakura tree canopy (4 tiles for 2x2 tree),
       bamboo, stone lantern base, stone lantern top
Row 4: wooden fence horizontal, wooden fence vertical, fence corner,
       hedge, bush, potted plant, wooden bench, sign post

Palette — use ONLY these colors:
outline #4A3F55, grass #A8DDB5 #7BB88F #4E7D5E,
dirt #C9A27E #9B7B5C, stone #D8D4E0 #A9A3B8,
water #C8ECF5 #7FC4E0 #4E93B5,
sakura #FFF0F5 #FFD9E8 #F7A8C4, wood #C9A27E #A88A7D

Tiles must tile seamlessly when repeated.
Tiles are edge to edge, no separator gaps.
Consistent lighting from upper-left across all tiles.
```

## F.5 — Thai tileset (riverside market)

```
[PREFIX]

A seamless tileset sheet for a top-down 2D RPG, 32x32 pixels per tile,
arranged in an 8x8 grid.

Theme: Thai riverside market town, warm tropical afternoon.

Tiles needed:
Row 1: concrete ground (wet), concrete dry, cracked concrete,
       wooden planks, wet wooden pier, dirt, grass tropical, mud
Row 2: canal water (murky teal), water with lotus, water ripple,
       water edge x4
Row 3: market umbrella top (red-pink pastel), umbrella top (blue pastel),
       market stall roof corrugated, wooden crate, fruit pile,
       plastic stool (red), banana leaf, ice bucket
Row 4: shophouse wall pastel yellow, shophouse wall pastel blue,
       shophouse window with wooden shutters, shophouse door,
       corrugated metal roof, hanging electric wires,
       potted plant tropical, banana tree base

Palette — use ONLY:
outline #4A3F55, concrete #D8D4E0 #A9A3B8,
wood teak #C9A27E #9B7B5C, water #9FD8CE #7FC4E0 #4E93B5,
umbrella pink #F5A3C7, umbrella blue #A3C7F5,
mango yellow #FFE3A3, banana leaf green #8FBF7A #7BB88F,
terracotta #E09B7D, chili red #F08D8D

Tiles must tile seamlessly. Warm afternoon lighting from upper-left.
```

## F.6 — Battle backdrop

```
[PREFIX] (note: this is a single image, not tiles)

A pixel art background for a turn-based RPG battle screen, 480x270 pixels.

Scene: A riverside sakura path at golden hour.
Rows of blooming cherry trees on both sides of a stone path.
A calm river reflecting soft pink and gold light on the left.
Distant hills and a wooden bridge in the background.
Petals drifting through the air (draw a few, the rest is particles in-engine).

Composition: horizon at 40% height. Empty space in the center
for an enemy sprite. Empty bottom 25% for the UI panel.

Mood: warm, nostalgic, slightly melancholic, peaceful.

Palette — pastel only, saturation below 60%:
sky #FFD4C4 to #FFD9E8 gradient,
sakura #FFF0F5 #FFD9E8 #F7A8C4 #D97FA5,
trunks #A88A7D #7D6459, grass #A8DDB5 #7BB88F,
water #C8ECF5 #7FC4E0, stone #D8D4E0,
outline #4A3F55

Painterly pixel art with visible pixels. No anti-aliasing.
```

## F.7 — UI elements

```
[PREFIX]

A pixel art UI element sheet for a cozy RPG, arranged on a 256x256 canvas.

Elements needed:
1. Dialogue box frame (9-slice, 48x48 with 16px corners),
   cream fill #FFF6E5, 3px border #4A3F55, subtle inner highlight
2. Button normal / hover / pressed (48x20 each), rounded corners,
   2px bottom shadow
3. Health bar frame (64x12) + fill gradient pink to orange
4. Six element icons (16x16): flower, lightning bolt, water drop,
   crescent moon, stone, sparkle
5. Menu tab (32x24) active and inactive
6. Small item slot frame (24x24)

Palette — outline #4A3F55, fill #FFF6E5 #F5E3C8,
accent #F7A8C4 #FFE08A #7FC4E0 #C9B8F0

Clean, soft, rounded. No harsh edges. Transparent background.
```

---

# G. Debugging and Refinement Prompts

## G.1 — Bug fix (standard template)

```
[CONTEXT]
SAKURA & SAWASDEE project — read CLAUDE.md first

[SYMPTOM]
[Describe in maximum detail: when it happens / what you were doing /
 what you see / what you expected]

[ERROR OUTPUT]
```
[paste the full stack trace]
```

[ALREADY TRIED]
[if applicable]

[TASK]
1. Find the actual root cause, not just the symptom
2. Explain to me what's causing it BEFORE fixing anything
3. Fix it in a way consistent with the architecture in CLAUDE.md
4. Write a test that would catch this bug if it returns
5. Check whether the same problem exists anywhere else in the codebase

[CONSTRAINTS]
- Never paper over a problem with try/catch
- No `any`, no `@ts-ignore`
- If the fix requires an architectural change, stop and ask me first
```

## G.2 — Improving game feel

```
[CONTEXT] Read CLAUDE.md — particularly §6, the five design pillars

[PROBLEM]
[e.g. "battles feel sluggish and unexciting"]

[TASK]
1. Playtest this section yourself first, then analyse what the real problem is
2. Propose 3 solutions with pros, cons and implementation cost
3. Wait for me to choose before implementing

[APPROACHES TO CONSIDER]
- Juice: screen shake, hit pause (60ms freeze on impact), particles,
  scale punch, layered audio
- Anticipation: every action needs a 100–150ms wind-up before its effect
- Feedback: every input needs a response within 100ms
- Curves: correct easing (ease-out for entrances, ease-in for exits)

[CONSTRAINT]
Must not conflict with Pillar 1, "Always Gentle" —
juice should feel charming and satisfying, never violent or pressuring
```

## G.3 — Self code review (run at the end of every phase)

```
[TASK] Audit the quality of the entire codebase.

Check the following and report as a table:

□ Where are the 8 architecture rules in CLAUDE.md violated?
□ Which files exceed 300 lines?
□ Where is `any` or `@ts-ignore` used?
□ Where are there leftover TODO / FIXME / placeholders / mock data?
□ Where is Thai or Japanese text hardcoded in code (should be in i18n/content)?
□ Which functions in src/learning/ still lack tests?
□ Where are colours outside the 48-colour palette being used?
□ What is the current bundle size — over the 3 MB budget?
□ Where are potential memory leaks (uncleaned event listeners,
  undestroyed Phaser objects)?
□ Where is duplicated code that should become a shared utility?

[REPORT FORMAT]
Table: | Issue | File | Severity (high/med/low) | Recommendation |
Sorted by severity. Do not fix anything until I say so.
```

---

# H. End-of-Phase Checklist

Copy this at the end of every phase:

```
[TASK] Pre-close audit for Phase [N]

Run and report every item:

## Technical
□ npx tsc --noEmit passes with no errors
□ npm run build succeeds
□ npm run test all passing
□ npm run lint no errors
□ Bundle size: ___ MB (budget: 3 MB)
□ Desktop FPS: ___ (target 60)
□ Mobile FPS: ___ (target 30+)

## Architecture
□ No file exceeds 300 lines
□ No `any` / `@ts-ignore`
□ No undisclosed TODOs
□ Import rules between game/ui/learning are unviolated

## Gameplay
□ Playable from the start to the current end with no crashes
□ Save and load work correctly
□ Playable on mobile
□ Every new feature passes the 5 pillars in CLAUDE.md

## Learning
□ The words "review/SRS/card" never appear to the player
□ Being wrong doesn't feel punishing
□ Success rate sits in the 85–90% range

## Report
Write a summary covering:
1. What you completed
2. What decisions you made on your own (and why)
3. What's still incomplete
4. Recommendations for the next phase
5. If you were the player, what's the most boring part right now?
```

---

## 🚦 Recommended Working Order

```
Day 1      → Create CLAUDE.md (Part C)
Day 1      → Run the Phase 0 prompt
Days 2–3   → Run P1.1 (overworld movement)
Day 4      → Run P1.2 (dialogue)
Days 5–7   → Run P1.3 (combat) ⭐ spend the most time here
Days 8–10  → Run P1.4 (tutorial)
           → 🛑 STOP. Have 5 people play 15 minutes. Collect feedback.
           → Fix based on that feedback before continuing.
Day 11+    → Phase 2 onward
```

**⚠️ Iron rule: do not start Phase 3 until the first 15 minutes are good enough that a stranger wants to keep playing.**

---

*Prompt Pack v1.0 — use alongside 01_GDD.md*
