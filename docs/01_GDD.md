# 🌸 SAKURA & SAWASDEE
### *The Word Spirit Chronicles* — Game Design Document v1.0

> **One line:** A pastel pixel-art browser RPG where every vocabulary word is a Word Spirit you hunt, befriend and care for — while travelling between a Japanese school under falling cherry blossoms and a Thai riverside market.

---

## Table of Contents

| # | Section |
|---|---|
| 1 | Vision & Core Concept |
| 2 | Audience & the Two-Way System |
| 3 | Five Design Pillars |
| 4 | The Four-Layer Core Loop |
| 5 | The Kotodama System (the heart of the game) |
| 6 | Combat — Sentence Combat |
| 7 | Learning Systems & SRS |
| 8 | Overworld & Exploration |
| 9 | World & Maps — Japan |
| 10 | World & Maps — Thailand |
| 11 | Characters |
| 12 | Art Direction (pixel art spec) |
| 13 | Audio Direction |
| 14 | 24 Anti-Boredom Features |
| 15 | Light Social Systems |
| 16 | Monetization |
| 17 | Technical Architecture |
| 18 | Content Data Schema |
| 19 | 8-Phase Roadmap |
| 20 | KPIs & Risks |

---

## 1. Vision & Core Concept

### 1.1 High Concept

The world is being swallowed by **The Silence** (無言霧 / หมอกไร้เสียง) — shop signs go blank, people can't finish sentences, and the memory of words disappears one at a time.

The player is a **Word Wanderer** — one of the few who can still hear the voice of words. The mission: travel out and recover **Kotodama (word spirits)** one by one, to give the towns their language back.

### 1.2 Why This Concept Matters

This is not "a game with exercises bolted on." It's a game where **the game mechanics ARE the learning mechanics**, inseparably:

| Game mechanic | What it actually is, pedagogically |
|---|---|
| Catching a Kotodama | First encounter with a new word |
| A Kotodama getting drowsy | The forgetting curve doing its work |
| Waking a Kotodama | Active recall / SRS review |
| Sentence Combo | Syntax production — building your own sentences |
| Elements & weaknesses | Word-class relationships (noun–particle–verb) |
| Your personal sakura tree | Streak / habit formation |
| Unlocking map regions | Curriculum progression |

**This is the advantage Duolingo doesn't have.** Duolingo is exercises with XP attached. This is an RPG that *happens* to teach a language.

### 1.3 Elevator Pitch

> "Pokémon meets Duolingo in a pastel world — a browser RPG where Thai speakers learn Japanese and foreigners learn Thai without realising they're studying, because every vocabulary word is a creature you have to look after."

---

## 2. Audience & the Two-Way System

### 2.1 Target Audience (two-way, as chosen)

| Group | Native (L1) | Learning (L2) | Market size | Priority |
|---|---|---|---|---|
| **A — primary** | Thai | Japanese | ~30,000+ Thai JLPT candidates/year | Launch |
| **B — primary** | English | Thai | Tourists / expats / digital nomads | Launch |
| C — expansion | Japanese | Thai | ~80,000 Japanese residents in Thailand | Phase 5 |
| D — expansion | English | Japanese | Largest market, fiercest competition | Phase 6 |

### 2.2 The Most Important Two-Way Design Principle

**Don't build two games — build one game with two lenses.**

```
LocalePair = { l1: "th" | "en" | "ja", l2: "ja" | "th" }
```

- **Same world, same maps.** Every player visits both Japan and Thailand.
- **What differs is which region is "familiar" and which is "foreign":**
  - Thai learner of Japanese → starts at the riverside market (familiar, tutorial), then takes the ferry/train to Hanami-chō (the main study region)
  - English learner of Thai → starts at Hanami-chō (exotic but familiar through pop culture), then travels to Thailand (the main study region)
- **NPCs always speak the language you're learning.** UI and explanations are in your L1.
- **Your native-language region is a rest zone** where you get to feel competent and do easy quests for items — this matters enormously for retention.

### 2.3 v1 Content Scope

| Language | v1 scope | Words | Kotodama |
|---|---|---|---|
| Japanese | Hiragana → Katakana → JLPT N5 → partial N4 | ~1,200 | 1,200 |
| Thai | 44 consonants + vowels + tones → A1 → A2 | ~1,000 | 1,000 |

---

## 3. Five Design Pillars

Every decision must pass these five. If a feature supports none of them, cut it.

### 🌸 Pillar 1 — "Always Gentle"
Wrong answers carry no painful punishment. No harsh buzzer. No red "WRONG!"
A wrong answer means your Kotodama *couldn't remember* — it looks sad, and you help it remember again.
**Target feeling: wanting to take care of something, not fearing failure.**

### ⚔️ Pillar 2 — "Every Mechanic Teaches"
No filler minigames. If a minigame teaches nothing, cut it.
Example: fishing at the pier catches *words*, not fish — and the words it catches are exactly the ones due for review.

### 🎨 Pillar 3 — "Living Pastel"
The world must feel warm and always in motion. Falling petals, drifting snow, steam from a noodle pot, temple incense, dawn and dusk light.
**If the player stands still for 10 seconds and the screen is completely static, we've failed.**

### 📖 Pillar 4 — "Comprehensible from Day One"
NPC dialogue adapts to the words the player already knows (i+1). In the first hour, the player must be able to genuinely *read* one real sentence.

### 🇹🇭🇯🇵 Pillar 5 — "Culture as Mechanic, Not Wallpaper"
- Thai politeness (ครับ/ค่ะ, the wai) is a real stat system (Politeness Meter)
- Japanese keigo is a high-level unlock that changes how NPCs respond
- Songkran / Loy Krathong / hanami / matsuri are events on the real calendar

---

## 4. The Four-Layer Core Loop

### 4.1 Moment Loop (5–30 seconds)
```
Explore → encounter a Fog Word / NPC / wild Kotodama
    → enter battle or conversation
    → answer (recall)
    → instant feedback + a charming effect
    → gain XP / a new word / an item
```

### 4.2 Session Loop (5–15 minutes) — "One Sakura Round"
```
Open the game → check your sakura tree (streak) → draw a fortune (daily buff)
    → 12 drowsy Kotodama are waiting (= the SRS due queue)
    → wake them via Wake Battles
    → one main quest (5–8 new words)
    → one small fog boss
    → return to your room, arrange your display case, read a letter from an NPC
    → close the game
```
**Goal:** end the session wanting more, not feeling drained. Cut it off while it's still fun.

### 4.3 Daily Loop
- 🌅 Morning: shrine fortune / temple alms → daily buff
- ☀️ Midday: main quest + new words
- 🌙 Night: night market (Thailand) / after-hours school (Japan) — harder content, better rewards
- 💤 Before bed: "Echo Radio" — passive listening mode, no input required

### 4.4 Weekly / Seasonal Loop
- **Monday:** new league starts (groups of 10)
- **Wednesday:** floating market opens (special map)
- **Friday:** weekly Fog Lord boss
- **Weekend:** double XP + friend quests
- **On the real calendar:** hanami (Mar–Apr), Songkran (Apr), Tanabata (Jul), summer matsuri (Aug), momiji (Nov), Loy Krathong (Nov), first snow (Dec), New Year (Jan)

---

## 5. The Kotodama System — Heart of the Game

### 5.1 What a Kotodama Is

**One Kotodama = one vocabulary word**, embodied as an adorable pastel creature.

| Word | Kotodama | Appearance |
|---|---|---|
| 猫 (neko) cat | **Nekoko** | Cream pastel kitten, tail curls into the shape of 猫 |
| 雨 (ame) rain | **Amemi** | A raindrop with eyes, wearing a tiny umbrella hat |
| ข้าว (khâao) rice | **Khao-chan** | A plump rice grain in a farmer's hat |
| ตุ๊กตุ๊ก (tuk-tuk) | **Tuk-Tuk-Kun** | A tiny living tuk-tuk, exhaust puffs shaped like hearts |
| น้ำ (náam) water | **Naamnoi** | A clear blue droplet swimming through the air |
| 桜 (sakura) | **Sakurara** | A five-petal blossom with a face, drifting on the breeze |

### 5.2 Six Elements = Word Classes

| Element | Icon | Word class | Pastel colour |
|---|---|---|---|
| **Bloom** 花 | 🌸 | Noun | Pink #F7A8C4 |
| **Spark** 雷 | ⚡ | Verb | Yellow #FFE08A |
| **Flow** 水 | 💧 | Adjective | Blue #9FD8E8 |
| **Echo** 風 | 🌙 | Particle / grammar | Purple #C9B8F0 |
| **Stone** 石 | ⛰️ | Character (kanji / Thai letter) | Sand #D9BFA0 |
| **Light** 光 | ✨ | Phrase / idiom | Cream-gold #FFF0C4 |

### 5.3 Element Relationships = Real Grammar

**This is the clever part:** the strength/weakness chart isn't arbitrary — it's derived from actual sentence structure.

```
Echo (particle) empowers → Spark (verb)      [を + 食べる = stronger verb]
Bloom (noun) empowers    → Echo (particle)   [パン + を = the particle can function]
Flow (adjective) empowers → Bloom (noun)     [おいしい + パン]
Stone (characters) is the foundation for all [know the kanji, read everything]
Light (phrases) hits hard but has limited uses [set expressions]
```

The player learns "a particle must precede the verb" **without memorising a rule**, because the game forces that team composition to win.

### 5.4 Memory State — Visible SRS

Every Kotodama has a **Memory Strength** that decays in real time (driven by FSRS).

| State | Strength | Look | In-game effect |
|---|---|---|---|
| ✨ **Radiant** | 90–100% | Sparkling eyes, aura | ATK +30%, combo-eligible |
| 😊 **Bright** | 60–89% | Normal, smiling | Normal ATK |
| 😐 **Dazed** | 30–59% | Half-lidded eyes, faded colour | ATK −25% |
| 😴 **Sleepy** | 10–29% | Asleep, sleep bubble | Unusable — must be woken |
| 🌫️ **Fading** | 0–9% | Translucent, nearly gone | At risk of being taken by the fog |

**After 7 days at "Fading," a Kotodama doesn't die — it "returns to the wild."** You have to go find it again.
→ This is a forgetting curve with **emotion**. The player feels guilty for leaving Nekoko asleep.

### 5.5 Party & Team Building

- Carry 6, swap at the "Kotodama Cabinet" in your bedroom
- The Dex holds unlimited entries, presented as a **picture book (絵本)** you turn page by page
- **Bond system** — frequently used Kotodama grow close to you, unlocking a second form (Evolution)
  - Nekoko → Nekomaru (a grown cat) after using 猫 correctly in 20 sentences
  - Evolution isn't just that word — it covers compounds: 猫 → 子猫 → 招き猫

---

## 6. Combat — Sentence Combat

### 6.1 View & Feel

Dragon Quest style — **first-person view** with the enemy directly ahead, over a pastel painted backdrop of the current location.
Your Kotodama party floats along the bottom of the screen (unlike DQ, where allies are invisible — here we must see them, because they're *your words*).

### 6.2 Enemies — "Fog Words"

Enemies are words the fog has swallowed. Their armour is **a sentence with gaps.**

```
┌─────────────────────────────────┐
│    🌫️  FOG WORD  Lv.3          │
│    ███████░░░  HP 70/100        │
│                                  │
│    Sentence armour:              │
│    「わたし ___ すし ___ たべます」  │
└─────────────────────────────────┘
```

The player sends the correct Kotodama in to fill the gaps.

### 6.3 Turn Commands

| Command | Detail |
|---|---|
| **⚔️ Send** | Pick a Kotodama → answer the question → deal damage |
| **🔗 Combo** | Send several in order to form a sentence |
| **🎒 Item** | Wake-up sweets, holy water, smelling salts (reduce cooldown) |
| **👂 Listen** | Make the enemy repeat the audio (costs half a turn) |
| **🏃 Flee** | Always succeeds, no penalty — **Pillar 1: Always Gentle** |

### 6.4 Question Types (rotated so nothing gets stale)

| # | Type | Example | Skill tested |
|---|---|---|---|
| 1 | **Meaning Match** | 猫 = ? → [cat] [dog] [bird] | Recognition |
| 2 | **Reverse Recall** | "cat" = ? → type/select 猫 | Production |
| 3 | **Listening** | 🔊 "ねこ" → pick the word | Listening |
| 4 | **Script Reading** | How is ねこ read? | Decoding |
| 5 | **Sentence Build** | Drag word cards into order | Syntax |
| 6 | **Cloze** | わたし__すしを食べます | Grammar |
| 7 | **Tone Match** (Thai) | 🔊 Hear it, pick the correct tone | Tonal perception |
| 8 | **Pitch Match** (Japanese) | はし (bridge/chopsticks) — pick the meaning from the pitch | Pitch accent |
| 9 | **Speaking** (mic, optional) | Repeat after the audio → compare | Production |
| 10 | **Context Choice** | You're at a temple. What should you say? | Pragmatics |
| 11 | **Counter Word** (Japanese) | 3 cats = 3___ → 匹 | Counters |
| 12 | **Politeness Register** | Speaking to a monk — which form? | Register |

### 6.5 ⭐ Sentence Combo — The Signature Mechanic

**This is the standout feature. Invest more here than anywhere else.**

Sending Kotodama in a grammatically valid order builds a **Combo Chain**.

```
Japanese example:
  [わたし 🌸] → [は 🌙] → [すし 🌸] → [を 🌙] → [たべます ⚡]
   Bloom      Echo      Bloom     Echo      Spark

   → 5-CHAIN "SENTENCE STRIKE"! ×3.5 damage
   → Cutscene: all five Kotodama link hands into a rainbow that pierces the fog
   → The sentence you built rises as golden characters, then detonates the fog
```

```
Thai example:
  [ฉัน 🌸] → [กิน ⚡] → [ข้าว 🌸] → [ที่ 🌙] → [ตลาด 🌸]

   → 5-CHAIN! + bonus for adding [ครับ/ค่ะ ✨] = POLITE FINISHER ×4.0
```

**Combo rules:**
- 2 chain = ×1.5 | 3 = ×2.0 | 4 = ×2.8 | 5 = ×3.5 | 6+ = ×4.5 + "PERFECT"
- A grammatically invalid order breaks the chain but deals no damage to you — **Always Gentle**
- Every successful combo is logged into the player's **Sentence Album** → concrete visible progress

### 6.6 Timing & Criticals

- A soft curved timing bar (not a stressful stopwatch)
- Answer within 3s = ⚡ **CRITICAL ×2** (means you genuinely knew it, weren't guessing)
- 3–8s = normal
- Over 8s = ×0.7 damage, still counts as correct
- **Response time is also fed into FSRS** → slow answers signal weak memory → shorter next interval

### 6.7 Bosses — "Fog Lords"

Chapter bosses with gimmicks that force use of the skill just taught.

| Boss | Location | Gimmick | Forces practice of |
|---|---|---|---|
| **Katakana Ghost** | School classroom | All questions in katakana only | Katakana |
| **The Counter Golem** | Shopping street | Must give the correct counter (匹/枚/本) | Counters |
| **Keigo Kaiju** | Principal's office | Casual answers deal 0 damage | Keigo |
| **The Tone Yaksha** | Temple steps | Must distinguish all 5 Thai tones | Thai tones |
| **The Shadow Vendor** | Fresh market | Must bargain to the right number | Numbers / bargaining |
| **The Pier Naga** | Pier | Read Thai signs with no word spacing | Thai word segmentation |
| **The Silence** (final) | Clock tower in the fog | 3 phases, uses everything you've learned | Everything |

---

## 7. Learning Systems & SRS

### 7.1 Algorithm — FSRS (not SM-2)

Use **ts-fsrs** (open source, TypeScript, MIT) — a modern scheduler that outperforms Anki's legacy SM-2.

```typescript
// Mapping in-game outcomes to FSRS ratings
Critical (correct in <3s)          → Rating.Easy   (4)
Correct, normal speed              → Rating.Good   (3)
Correct but slow / used "Listen"   → Rating.Hard   (2)
Incorrect                          → Rating.Again  (1)
```

FSRS runs entirely on-device → the MVP needs no backend at all.

### 7.2 Turning the SRS Queue Into a Game

**Never show the queue as an Anki-style list.** Translate it into world events:

| SRS state | How it appears in game |
|---|---|
| 20 cards due | "20 Kotodama are asleep in the garden. Let's go wake them!" |
| 5 lapsed cards | "The fog has taken 5 Kotodama! Hurry!" |
| 8 new cards | "8 wild Kotodama have appeared at the market" |
| Long overdue | "Your sakura tree is wilting — the words you've forgotten are falling" |

### 7.3 Learning Path — Japanese

```
Ch 0: Hiragana (46 + dakuten)            — 5 days
   ↳ Stroke-tracing calligraphy minigame
   ↳ 46 Stone Kotodama = living characters
Ch 1: Katakana + loanwords                — 5 days
Ch 2: N5 vocab set 1 (objects, people, places) + です/ます
Ch 3: N5 particles は/を/に/で/と/も + verb groups
Ch 4: 100 N5 kanji + counters
Ch 5: て-form / past / negative
Ch 6: Entering N4 — plain form, conjunctions
Ch 7: Basic keigo (for teacher and shop scenes)
```

### 7.4 Learning Path — Thai (for foreigners)

**Thai-specific challenges requiring special design:**

| Problem | In-game solution |
|---|---|
| **No spaces between words** | "Word cutting" minigame — draw lines to split shop signs (the Naga boss) |
| **Five tones** | Karaoke/rhythm minigame + visual pitch-contour graphs |
| **44 letters with duplicate sounds** | Group them into three "families" (high/mid/low class) as differently coloured Kotodama |
| **Complex tone rules** | A "Tone Kitchen" crafting system: letter class + vowel + tone mark = resulting tone |
| **ครับ/ค่ะ and registers** | Politeness Meter — NPCs genuinely respond differently |

```
Ch 0: 9 mid-class consonants + basic vowels    — 4 days
Ch 1: 11 high-class consonants + 2 tones
Ch 2: 24 low-class consonants + all 5 tones
Ch 3: Survival vocab (market, food, numbers)
Ch 4: Final consonants + clusters
Ch 5: Basic sentences + Thai classifiers
Ch 6: Reading real signs (word segmentation)
Ch 7: Polite / temple / market registers
```

### 7.5 Comprehensible Input Engine (i+1)

The system tracks which words the player knows and selects NPC dialogue containing 90–95% known words plus 5–10% new.

```typescript
function selectDialogue(npcId, knownWords: Set<string>): Dialogue {
  const pool = dialoguePool[npcId];
  return pool
    .map(d => ({ d, ratio: d.tokens.filter(t => knownWords.has(t)).length / d.tokens.length }))
    .filter(x => x.ratio >= 0.85 && x.ratio <= 0.97)
    .sort(byNoveltyThenPriority)[0];
}
```

**Unknown words render in a distinct colour with ruby/romanisation.** Tap to see the meaning → the word is added to "encountered" but not yet marked as learned.

### 7.6 Pedagogical Principles to Hold To

1. **Recognition before production** — encounter → can select → can type → can use in a sentence
2. **Interleaving** — mix topics; never 10 questions in a row on one theme
3. **Contextual encoding** — words learned at the market get tested in market scenes (context-dependent memory)
4. **Desirable difficulty** — hard enough to require thought, not hard enough to quit (target success rate 85–90%)
5. **Spacing > cramming** — 15 min/day beats 2 hours/week; every system should push toward that

---

## 8. Overworld & Exploration

### 8.1 View & Controls

- **Top-down 3/4 view** (Pokémon Gen 3–5 / Stardew Valley)
- Grid-based movement (32px) with smooth interpolation — never janky
- **Keyboard:** WASD/arrows to move, Space/Z to interact, Shift to run, Tab for menu, Q for the Kotodama book
- **Mobile:** virtual joystick bottom-left + A button bottom-right (mobile support from day one — Thai and Asian players are mobile-first)

### 8.2 Encountering Wild Kotodama

**Not random encounters that snap you into a battle** (annoying and dated).

Instead, **visible overworld encounters:**
- Wild Kotodama wander the map in plain sight — the player chooses to approach or avoid
- **Sakura grass / lemongrass patches** = high-density spawn spots with rustling animation
- **Kotodama due for review glow gold** → at a glance the player knows which to seek
- Each area has species matched to word categories (market = food words, school = study words, temple = abstract nouns)

### 8.3 Catching

```
Meet a wild Kotodama → enter a "Getting Acquainted" scene (not a battle!)
  1. It introduces itself: audio + written form + meaning
  2. Three short mini-rounds:
     - hear it, pick the picture
     - see the picture, pick the word
     - fill it into a sentence
  3. 3/3 → it joins you ✨
     2/3 → it asks for more time (try again tomorrow)
```
**Important:** no capture balls, no random success chance — success comes purely from understanding.

### 8.4 Travel

- **Train (Japan)** — Hanami Station ↔ other stops, tickets bought with in-game money
- **Tuk-tuk (Thailand)** — hailable anywhere, but you must **bargain the fare in Thai** (minigame)
- **Long-tail boat** — connects pier ↔ floating market ↔ temple
- **International:** the "Kotodama Ferry" airport/harbour — a pretty cutscene that masks the region load

---

## 9. World & Maps — Japan 🌸

### The town of 花見町 **HANAMI-CHŌ** (Blossom-Viewing Town)

A small riverside town with a school on the hill, ringed by cherry trees. Mood: *Your Name* + *A Silent Voice* + *Animal Crossing*.

#### 9.1 🚉 Sakura Gate Station (桜ヶ丘駅)
**Mood:** old wooden platform, white sign with sky-blue trim, petals drifting onto the tracks, faint train announcements.
- Starting point / travel hub
- Glowing vending machine (teaches katakana through drink names: コーヒー、ジュース)
- Timetable board = numbers and time practice
- Coin lockers = storage

#### 9.2 🏫 Hanami Academy (花見学園) — Main Hub
**Mood:** three-storey cream-and-pale-blue building, tall windows, polished wooden corridors, afternoon light streaming in.

| Room | Function |
|---|---|
| **Shoe lockers (下駄箱)** | Entrance — secret letters and gifts from NPCs |
| **Classroom 1-A** | Core grammar lessons (Yuki-sensei) |
| **Library (図書室)** | Kanji archive + Kanji-Ojii + kanji quests |
| **Language club room (部室)** | Conversation practice with classmates |
| **Cafeteria (食堂)** | Food vocab + cooking system |
| **Courtyard (中庭)** | The great sakura tree = **your Streak Tree** |
| **Rooftop (屋上)** | Key story beats + a boss |
| **Infirmary (保健室)** | Restore Fading Kotodama |
| **Music room (音楽室)** | Karaoke minigame / pitch accent |

#### 9.3 🌸 Riverside Sakura Path (桜並木の道)
**Mood:** ⭐ The signature scene.
A riverside walk lined with cherry trees, **petals streaming across the screen on the wind at all times**, soft pink light on the water, wooden benches, stone lanterns.
- Densest Kotodama zone
- Key NPC conversations happen here (it must be screenshot-worthy)
- Seasonal shifts: green leaves (summer) → red leaves (autumn) → bare branches + snow (winter)

#### 9.4 🏮 Shopping Street (花見商店街)
**Mood:** striped awnings, pale orange paper lanterns, steam from the ramen shop, noren curtains, a cat asleep by a doorway.
- Ramen shop (ordering food + numbers)
- Bookshop (buy "textbooks" = unlock word categories)
- Wagashi sweet shop (recovery items)
- Clothing shop (costumes)
- Gachapon machine (random Kotodama eggs)

#### 9.5 ⛩️ Shrine Steps (花見神社)
**Mood:** long stone stairway up the hill, pastel vermilion torii (not harsh red), bamboo groves either side, rows of hanging ema, thin incense smoke.
- **Omikuji fortune = the daily system** — random buff + daily quest
- Write an ema = set a study goal
- Komainu stone lions = NPCs who speak in kanji riddles

#### 9.6 ❄️ Winter Courtyard (雪の中庭)
**Mood:** ⭐ The second signature scene.
Light drifting snow (not deep — the ground reads as soft blue-white), visible breath, snow caps on stone lanterns, warm yellow lamplight against a blue-violet sky.
- Unlocks in Chapter 5, or December–February on the real calendar
- Snowman-building minigame
- Winter and weather vocabulary

#### 9.7 🎆 Summer Festival Grounds (夏祭り会場)
**Mood:** night, pastel red-orange-yellow paper lanterns, yatai stalls, yukata, fireworks against a deep indigo sky.
- Seasonal event (Jul–Aug)
- Minigames: goldfish scooping (金魚すくい), cork gun shooting, taiyaki
- Every minigame embeds language questions

#### 9.8 🍁 Autumn Hill (紅葉の丘)
Maple leaves in warm pastel red-orange-yellow, a stone path, a wooden pavilion — nature, colour and emotion vocabulary.

---

## 10. World & Maps — Thailand 🇹🇭

### The town of **TALAT RIM KHLONG** (Riverside Market)

A canal-side town blended with an old quarter — pastel-faded shophouses, rain trees, bright sun rendered in soft tones. Mood: *Amphawa + Yaowarat + Banglamphu*.

#### 10.1 🛺 Tuk-tuk Terminal
**Mood:** a concrete lot under a huge tree, pink/blue/yellow tuk-tuks parked in a row, drivers playing checkers, a radio playing luk thung softly, jasmine garlands hanging from mirrors.
- Thai starting point
- **Bargaining minigame** — haggle the fare in Thai
- **Tuk-Tuk Racing** — drive a route, reading signs fast enough to turn correctly (reading speed)
- Tuk-tuks come in different colours and are collectible like mounts

#### 10.2 🥬 Fresh Market — Main Thai Hub
**Mood:** ⭐ The Thai signature scene.
Bright umbrellas (rendered pastel), fruit stacked in pyramids, crushed ice and fish, steam off the noodle pot, spinning fans, a cat asleep on a rice sack, wet floor catching the light.

| Stall | Teaches |
|---|---|
| Fruit stall | Fruit names + classifiers (ลูก/ใบ/kilo) |
| Pork & fish stall | Food words + quantities |
| Flower stall | Colours + adjectives |
| Noodle cart | Ordering (less spicy / no vegetables) |
| Pa Somsri (boss) | **Bargaining** = numbers + politeness |

#### 10.3 🛕 Temple (Wat Rim Khlong)
**Mood:** soft-gold chedi, ornate roof finials, mural paintings, incense smoke, falling bodhi leaves, monks on alms round, a great bell, fortune sticks.
- **The Thai script centre** — Luang Phor Somdet teaches consonants and tones
- **Thai handwriting minigame** (trace from the head-loop)
- **Murals are stories** — read simplified Jataka tales (graded reading)
- Morning alms = daily ritual (Thailand's counterpart to the omikuji)
- Thai fortune sticks (เซียมซี) = daily buff

#### 10.4 🚤 Pier
**Mood:** a wooden pier over the canal, long-tail boats on their ropes, drifting water hyacinth, rippling reflections, warm orange evening light, kids jumping in.
- **Fishing minigame** — relaxed mode, catches *words* (low-pressure review)
- Feed the catfish
- Long-tail boat to the floating market
- **Loy Krathong** (Nov) — the big event: build a krathong out of the words you learned all year and float it away, a ritual summary of your knowledge

#### 10.5 🏚️ Old Town Shophouses
**Mood:** Sino-Portuguese shophouses in faded pastel yellow/blue/pink, wooden louvred shutters, weathered Thai signage, tangles of overhead wires, potted plants by the doors.
- NPC homes — family quests, kinship terms (ป้า/น้า/อา/ลุง — a system that baffles foreigners, i.e. excellent content)
- Old-style coffee shop (oliang) = rest and save point
- Bicycle repair shop, barber = occupation vocabulary

#### 10.6 🌾 Rice Field Countryside
**Mood:** green paddy to the horizon, a wide sky with big clouds, a field hut, a water buffalo, egrets, orange evening light.
- Nature/animal/Thai-season vocabulary (hot / rainy / cool)
- Help-the-farmer quests
- **Songkran** (Apr) — water-splashing event + pouring water over elders' hands (teaches respect registers)

#### 10.7 🌃 Night Market
**Mood:** warm LED strings, hanging bulbs, smoke off the grills, music, red plastic stools, neon reflecting off wet ground.
- **Open 18:00–02:00 by the device's real clock**
- Harder content, better rewards (rare Kotodama)
- Colloquial speech, slang, informal register

#### 10.8 🛶 Floating Market — weekends only
Paddle boats selling goods, conical hats, fruit heaped in boats, coloured umbrellas — a weekend event with special rewards.

---

## 11. Characters

### 11.1 The Player

**Word Wanderer** — customisable: hair colour (8 pastels), hairstyle (12), skin tone (6), eyes (8)
- In Japan: navy-and-white sailor/gakuran school uniform
- In Thailand: Thai school uniform (white/navy) or casual wear; floral shirt during Songkran
- Collectible costumes: yukata, Thai traditional dress, sportswear, soap-opera outfits, etc.

### 11.2 Main Cast

#### 🌸 **Momo (モモ)** — your companion
- Your first Kotodama: a pastel-pink cat-rabbit that floats, with long ears and huge round eyes
- Handles tutorials and hints
- Speaks in short, sweet lines ending in 「〜だよ！」
- **Emotional role:** the one you don't want to let down → drives retention

#### ❄️ **Yuki-sensei (雪先生)** — the Japanese teacher
- Young woman, long white hair, thin-framed glasses, pale blue shawl
- Calm, cool, quietly kind. Speaks slowly and clearly (ideal for TTS)
- Teaches grammar — her lessons are a real, structured classroom
- Arc: she once lost some of her own words to the fog

#### 📚 **Kanji-Ojii (漢字じい)** — the library elder
- Old man, white whiskers, round glasses, checked shawl, buried in book stacks
- Teaches kanji through etymology stories (the most powerful mnemonic there is)
- Gives "find the lost kanji" quests
- Comic relief: keeps dozing off mid-sentence

#### 🛺 **Pim (พิม)** — your Thai guide
- Thai girl with twin braids, yellow t-shirt, shorts, flip-flops
- The tuk-tuk driver's daughter. Boundless energy, talks fast, loves teasing you
- **The deliberate contrast to Yuki-sensei** — Yuki teaches systematically, Pim teaches "just use it"
- Teaches colloquial Thai, market speech, slang

#### 🙏 **Luang Phor Somdet** — the temple monk
- Elderly monk in brick-orange robes, gentle smile, walking staff
- Teaches **Thai script and tones** through Buddhist analogies (tone as water — rising, falling, still)
- The calm character — his scenes have no timers and no pressure
- **Must be written respectfully.** Never comic relief. Never fights.

#### 🥭 **Pa Somsri** — the market vendor
- Middle-aged woman, floral apron, hair tied back, loud voice, warm heart
- **The bargaining boss** — haggle well for a discount; fail and you pay full price (but she throws in a freebie anyway)
- Teaches numbers, transactions, polite forms

#### ⚡ **Kenta (ケンタ)** — the rival
- Schoolboy, fluffy brown hair, sports jacket, confident grin
- Periodically challenges you to Speed Challenges
- **Not a villain** — he just wants to be good, and cheers when you win
- Arc: he studies himself into burnout → the game's lesson about sustainable learning

#### 🌫️ **The Silence (無言)** — the antagonist
- No fixed form: grey-violet fog that slowly gathers into the shadow of a mouthless person
- **Concept:** it isn't evil. It is *the fear of speaking incorrectly*, grown until it swallowed language itself
- The game's resolution: you don't kill it. You *talk to it* until it can speak again
- **This is the whole theme:** what kills language learning is the fear of getting it wrong

### 11.3 Supporting NPCs (~30)
Ramen shop owner, librarian, five classmates, the tuk-tuk driver, temple boy, boatman, farmer, sweet-seller, station attendant, etc.
**Every one needs:** a name, a one-sentence personality, the word category they teach, and five dialogue tiers keyed to player progress.

---

## 12. Art Direction (Pixel Art Spec)

### 12.1 Technical Spec

| Item | Value |
|---|---|
| **Base resolution** | 480 × 270 px (16:9) |
| **Scaling** | ×2, ×3, ×4 — nearest neighbour, integer scaling only |
| **Tile size** | 32 × 32 px |
| **Characters** | 32 × 48 px (2-head-tall chibi) |
| **Kotodama** | 32 × 32 px (base) / 48 × 48 px (evolved) |
| **Directions** | 4 (down/up/left/right) — left/right can be mirrored |
| **Walk frames** | 4 (idle, step1, idle, step2) @ 8fps |
| **Idle frames** | 2 breathing frames @ 2fps (essential — characters must never be fully static) |
| **Master palette** | 48 colours |
| **Game font** | Pixel font with Thai + Japanese support (see 12.5) |

### 12.2 Master Palette (48 colours)

```
── OUTLINES (never pure black) ────────────
INK_DARK      #4A3F55   primary outline (dark violet-grey)
INK_MID       #6B5F78   secondary outline
INK_SOFT      #9188A0   light outline

── SAKURA / JAPANESE SPRING ───────────────
SAKURA_1      #FFF0F5   brightest petal
SAKURA_2      #FFD9E8   main petal ⭐
SAKURA_3      #F7A8C4   petal shadow
SAKURA_4      #D97FA5   deep shadow
BRANCH_1      #A88A7D   branches
BRANCH_2      #7D6459   branch shadow

── SKY / WATER ────────────────────────────
SKY_DAY       #BDE3FF   daytime sky ⭐
SKY_DAWN      #FFD4C4   dawn
SKY_DUSK      #C9A8D9   dusk
SKY_NIGHT     #5A5A8C   night
WATER_1       #C8ECF5   bright water
WATER_2       #7FC4E0   main water
WATER_3       #4E93B5   deep water

── MINT / FOLIAGE ─────────────────────────
MINT_1        #E0FAF0
MINT_2        #C8F2E0   ⭐
LEAF_1        #A8DDB5   bright leaf
LEAF_2        #7BB88F   main leaf
LEAF_3        #4E7D5E   leaf shadow

── CREAM / LIGHT ──────────────────────────
CREAM_1       #FFFBF0   brightest
CREAM_2       #FFF6E5   ⭐ UI background
CREAM_3       #F5E3C8   sand / light wood
GOLD_1        #FFE08A   golden light
GOLD_2        #F2C879   temple gold

── VIOLET / MAGIC ─────────────────────────
LAVENDER_1    #F0EAFF
LAVENDER_2    #E0D7FF   ⭐
LAVENDER_3    #C9B8F0   Echo element
FOG_1         #D8D4E0   light fog
FOG_2         #A9A3B8   main fog ⭐ enemies
FOG_3         #6E6880   deep fog

── THAILAND: WARM / MARKET ────────────────
MANGO         #FFE3A3   ⭐ mango yellow
TEAK_1        #C9A27E   teak wood
TEAK_2        #9B7B5C   teak shadow
TERRACOTTA    #E09B7D   clay / monk's robe
TEMPLE_GOLD   #F2C879   temple gold
RIVER_TEAL    #9FD8CE   ⭐ canal water
CHILI         #F08D8D   chilli red (pastel)
TUKTUK_PINK   #F5A3C7   pink tuk-tuk
TUKTUK_BLUE   #A3C7F5   blue tuk-tuk
BANANA_LEAF   #8FBF7A   banana leaf

── SNOW / WINTER ──────────────────────────
SNOW_1        #FFFFFF
SNOW_2        #F0F4FA   ⭐
SNOW_SHADOW   #D4DCE8

── AUTUMN ─────────────────────────────────
MOMIJI_1      #FFB39B
MOMIJI_2      #F08A6E
AUTUMN_GOLD   #E8C87A

── SKIN (6 tones) ─────────────────────────
SKIN_1 #FFE8D6  SKIN_2 #F5D0B0  SKIN_3 #E0B088
SKIN_4 #C08E62  SKIN_5 #9B6B45  SKIN_6 #6E4830
```

### 12.3 Ten Art Rules (enforced on every asset)

1. **No pure black (#000000) or pure white (#FFFFFF)** — snow and tiny highlights excepted
2. **Outlines use a darker shade of the object's own colour, never black** (selective outlining)
3. **Light always comes from the upper left at 45°**
4. **Shadows are violet/blue-tinted, never grey** (real shadows are blue)
5. **Saturation never exceeds 60% (HSL)** — this is the core of the pastel look
6. **Lightness never below 45%** — nothing may read as murky
7. **Every object gets exactly 3 shades: base + highlight + shadow** — no more
8. **No heavy dithering** — permitted only in sky gradients
9. **Characters are 2 heads tall**, large eyes, no nose (or a single dot)
10. **Every scene must contain at least one always-moving element** (petals, smoke, water, flags, a cat)

### 12.4 Ambient Layer — Critical

This is what separates this game from generic pixel games. **Build it as a particle system layered over the map.**

| Effect | Technical detail |
|---|---|
| 🌸 **Falling sakura** | 40–60 particles, 3 parallax depths, rotating as they fall, 15–40 px/s, wind as a sine wave every 4s |
| ❄️ **Light snow** | 30–50 particles, 10–25 px/s, side-to-side sway, 1–3px, opacity 0.6–1.0 |
| 🍁 **Falling maple** | 20–30 particles, slower rotation than sakura, zigzag descent |
| 💨 **Smoke (food stalls / incense)** | 8–12 particles rising, fading, scaling up |
| ☀️ **Sunbeams** | Warm gold overlay at 0.15 opacity, 30° tilt, very slow drift |
| 🌧️ **Rain (Thai rainy season)** | Diagonal streaks + ground ripples + rain audio |
| 🐟 **Water ripples** | 4-frame shader/sprite animation on the surface |
| ✨ **Kotodama sparkle** | Around any Kotodama at high memory strength |
| 🌫️ **The Silence** | Uncleared areas get a slow-moving grey-violet overlay |
| 🔥 **Lantern glow** | Warm radial gradient with a gentle flicker at night |

### 12.5 Fonts (solve this early — it's a real trap)

**Most pixel fonts support neither Thai nor kanji.**

**Recommended solution:**
| Used where | Font | Reason |
|---|---|---|
| UI / menus / numbers (Latin) | Free pixel fonts, e.g. *Press Start 2P*, *Silkscreen* | Retro game feel |
| Japanese text | **Misaki Gothic** (8px, free, JIS-1 kanji coverage) or **PixelMplus** (10/12px, free) | True pixel fonts with kanji |
| Thai text | ⚠️ No good Thai pixel font exists → **use a crisp small-size Thai font** such as *IBM Plex Sans Thai* or *Noto Sans Thai*, rendered at 1:1 with no scaling | Legibility beats retro purity |

**Principle:** it's fine for the text layer not to be pixel-perfect if that buys legibility — **if the player can't read it, they can't learn.**
Render the UI in React/HTML over the canvas → you get crisp text and full multilingual support for free.

### 12.6 UI Style

- Dialogue frame: rounded box, cream fill `#FFF6E5`, 3px border `#4A3F55`, soft drop shadow
- Buttons: rounded, 2px bottom shadow, depress on press
- Icons: 16×16 px
- Health bars: rounded, pink→orange gradient
- Text: typewriter effect at 30 chars/sec with a soft blip
- **Every window animates open/closed over 150ms** (scale + fade)

---

## 13. Audio Direction

### 13.1 Music (BGM)

| Track | Style | Instruments |
|---|---|---|
| Main menu | Slow, warm piano | Piano + light strings |
| Hanami-chō (day) | Lo-fi + koto | Koto, shakuhachi, soft beat |
| School | Bright piano, 90 BPM | Piano, glockenspiel |
| Sakura path | ⭐ Warm ambient with a touch of melancholy | Piano + strings + wind |
| Snow | Music box + light strings | Music box, celesta |
| Matsuri | Taiko + flute, joyful | Taiko, shinobue |
| Fresh market | ⭐ Lo-fi luk thung | Ranat, khim, drums, bass |
| Temple | Deeply calm | Ranat ek, bells, distant chanting |
| Pier | Relaxed | Khlui flute, acoustic guitar, water |
| Night market | Chill funk | Bass, keys, percussion |
| Normal battle | Exciting but not stressful, 120 BPM | Chiptune + local instruments |
| Boss | Driving, 140 BPM | Chiptune orchestra |
| The Silence | Eerie and sad | Reversed audio, detuned piano |

### 13.2 Ambient SFX (crucial for atmosphere)

- **Japan:** cicadas (summer), wind chimes (furin), train announcements, bicycle bells, footsteps on wood, sliding doors, crows
- **Thailand:** market chatter, passing motorbikes, the tuk-tuk's "tuk-tuk-tuk", lapping water, fans, distant chanting, temple bells, dogs, frying sounds, luk thung from a stall radio

### 13.3 Voice — the single most important audio system

**Two-layer architecture:**

```
Layer 1 (primary): pre-generated MP3/OGG files
  → produced with high-quality TTS (ElevenLabs / Murf / Google Cloud TTS)
  → every vocabulary word + every key sentence
  → hosted on CDN, lazy-loaded by region
  → ✅ consistent quality ✅ free at runtime ✅ works offline

Layer 2 (fallback): Web Speech API (SpeechSynthesis)
  → used when no file exists (e.g. player-composed sentences)
  → quality depends on browser/OS
```

**Do not rely on the Web Speech API alone** — Thai and Japanese voice quality varies enormously by OS, and some machines have no voice at all.

**Speech recognition:** use the Web Speech API's `SpeechRecognition` as an **optional, opt-in feature only** — coverage is patchy and it must never block a player.

---

## 14. 24 Anti-Boredom Features

Ranked by retention impact ÷ development cost.

### 🥇 Tier S — required for MVP

**1. 🌸 Your Personal Sakura Tree (Streak Tree)**
The tree in the school courtyard *is* your streak. Play daily and more blossoms open; miss a day and petals fall; miss three and leaves yellow.
> 💡 Cap **"winter wraps" (streak freezes) at 2** — research indicates two is optimal; more forgiveness erodes the habit.

**2. 🎋 Omikuji / Fortune Sticks (Daily Draw)**
Draw a fortune at the shrine (Japan) or the temple (Thailand) once per day → a random buff + one daily quest.
> 💡 A variable reward that makes you want to open the game each morning, **with genuine cultural meaning.**

**3. 🔗 Sentence Combo** *(see 6.5)*

**4. 📔 Sentence Album**
Every sentence you successfully build is saved with its date and location, browsable forever.
> 💡 Far more powerful proof of progress than an XP number.

**5. 📖 Kotodama Dex (picture book)**
A page-turning picture book of every Kotodama seen/caught/evolved, with completion percentage.
> 💡 The completionist drive that has sold Pokémon for 30 years.

**6. 🌦️ A World That Lives on Real Time**
Seasons follow the real calendar, time of day follows the device clock, weather is randomised.
> 💡 Cheap to build (tint + tileset variants), enormous payoff — players return to see how the world changed.

**7. 🏠 My Room**
A Japanese dorm room and a Thai canal-side house, decorated with quest-earned furniture, plus a display case for your favourite Kotodama.
> 💡 Endowment effect — people don't abandon what they built.

**8. 🏆 Passport Stamps**
Achievements are stamps in a passport book, each designed around its location's theme.
> 💡 Thematically perfect for a game about crossing borders, and pretty enough to show off.

### 🥈 Tier A — Phase 2–3

**9. 🎣 Pier Fishing**
Relaxed mode, no timer. You catch *words* due for review — for days when you don't want to think hard.
> 💡 The "tired day" mode — prevents streak loss through exhaustion.

**10. 🎤 Karaoke / Rhythm Game**
Sing along to rhythm; practises Thai tones and Japanese pitch accent.
> 💡 **A feature no competitor has**, and the only real way to teach Thai tones.

**11. ✍️ Calligraphy Tracing**
Trace kanji stroke order / Thai letters from the head-loop, with a soft brush sound.
> 💡 Motor memory beats passive viewing for character retention by a wide margin.

**12. 🍜 Cooking**
Combine "ingredient words" into dishes that grant buffs (ramen, pad kra pao, tom yum).
> 💡 Teaches food nouns + cooking verbs + recipes-as-reading-practice.

**13. 💌 Pen Pal Letters**
NPCs write to you in the target language; you reply by assembling words → they send gifts back.
> 💡 Asynchronous social warmth with no real players required.

**14. 🛺 Tuk-Tuk Racing**
Drive a route, reading signs fast enough to turn correctly → trains reading fluency.
> 💡 Fun, and drills a skill traditional study neglects.

**15. 💰 Market Bargaining**
A conversational minigame: propose prices in Thai using polite forms → the better you are, the cheaper you get it.
> 💡 A skill you'd genuinely use on day one in Thailand.

**16. 📸 Photo Mode**
Freeze the scene, adjust the angle, add filters/stickers/captions in the target language → save to an album and share.
> 💡 Free UGC = free marketing. The sakura, snow and market scenes are pretty enough that people will post them.

### 🥉 Tier B — later phases

**17. 🏅 Weekly leagues (groups of 10)** — opt-in, never forced (some people hate competition)
**18. 👥 Visit a friend's room/tree** — leave gifts behind
**19. 📻 Echo Radio** — background listening mode for doing something else / before bed
**20. 🥚 Kotodama eggs** — login rewards / gachapon for rare Kotodama (cosmetic only, never pay-to-learn)
**21. 👘 Costume & tuk-tuk collections** — yukata, Thai dress, Songkran shirts, tuk-tuk paint jobs
**22. 🎭 New Game+ "Silent Mode"** — entire UI in the target language, no translations
**23. 🗺️ Region-locked rare Kotodama** — some appear only in rain, only at 3am, only on your birthday
**24. 🎬 Chapter cutscenes** — illustrated stills + text (far cheaper than animation, nearly as emotive)

---

## 15. Light Social Systems

**Principle:** this is fundamentally single-player, but it must *feel* like others exist.

| Feature | Complexity |
|---|---|
| Weekly league of 10 (XP leaderboard) | Low — just a table |
| Visit a friend's room/tree via friend code | Medium |
| Send gifts / winter wraps to friends | Low |
| "Ghosts" of other players — see their shadows walk past (no interaction) | Medium — but feels wonderful |
| Sentence Wall — post a sentence you composed in town for others to heart | Medium + needs moderation |
| Speed Duel vs a friend (async — compare records, not real-time) | Medium |

⚠️ **Avoid real-time multiplayer in v1** — high cost, low return.

---

## 16. Monetization

**Iron rule: no pay-to-learn.** All learning content is 100% free.

| Type | Detail | Suggested price |
|---|---|---|
| **Free** | Entire story, all vocabulary, all maps, full SRS | Free |
| **Supporter Pass** (monthly) | Exclusive costumes/furniture, UI themes, special sakura varieties, no ads, cloud sync | ฿99–149 / $2.99–3.99 |
| **Cosmetic shop** | Outfits, furniture, tuk-tuk paint, photo frames | ฿39–99 each |
| **Seasonal pass** | Seasonal event + cosmetic rewards | ฿199/season |
| **Optional ads** | Watch an ad for one extra winter wrap | — |
| **B2B (future)** | Licence to schools/language institutes + teacher dashboard | Negotiated |

---

## 17. Technical Architecture

### 17.1 Recommended Stack (tuned for "let AI write nearly all the code")

```
┌─ FRONTEND ─────────────────────────────────────┐
│  Vite 6 + React 19 + TypeScript 5.7            │
│  ├─ Phaser 4.1  → overworld, tilemap, sprites  │
│  ├─ React       → all UI (menus, quiz, dex)    │
│  ├─ Tailwind 4  → styling                      │
│  ├─ Zustand     → global state                 │
│  └─ Framer Motion → UI animation               │
├─ LEARNING ENGINE ──────────────────────────────┤
│  ts-fsrs        → SRS scheduling               │
│  Zod            → validate content JSON        │
├─ DATA ─────────────────────────────────────────┤
│  Dexie (IndexedDB) → local save (MVP)          │
│  Supabase          → cloud sync (Phase 4+)     │
├─ AUDIO ────────────────────────────────────────┤
│  Howler.js      → BGM/SFX/voice playback       │
│  Web Speech API → TTS fallback                 │
├─ DEPLOY ───────────────────────────────────────┤
│  Vercel / Netlify + Cloudflare R2 (assets)     │
└────────────────────────────────────────────────┘
```

### 17.2 Why These Choices (this matters for AI-assisted development)

| Choice | Reason |
|---|---|
| **Phaser 4 and React kept separate** | AI writes both very well *when responsibilities are clean* — Phaser owns "the world," React owns "the screen," never both |
| **TypeScript** | AI debugs dramatically better when types express intent — **non-negotiable for AI-heavy development** |
| **Zod** | Malformed content errors immediately with a precise message instead of failing silently |
| **ts-fsrs** | Don't hand-roll an SRS algorithm — it's hard and easy to get subtly wrong |
| **IndexedDB first, Supabase later** | The MVP needs no backend at all → fast, free, easy to test |
| **No ECS framework** | Overkill at this scale, and AI frequently implements ECS incorrectly |

### 17.3 Folder Structure (AI must follow this strictly)

```
sakura-sawasdee/
├── public/
│   └── assets/
│       ├── tilesets/        japan_spring.png, thai_market.png ...
│       ├── sprites/         player/, kotodama/, npc/
│       ├── audio/
│       │   ├── bgm/
│       │   ├── sfx/
│       │   ├── voice/ja/    n5_neko.mp3 ...
│       │   └── voice/th/    a1_khao.mp3 ...
│       ├── ui/
│       └── maps/            hanami_school.json (Tiled format)
├── src/
│   ├── game/                    ← Phaser only
│   │   ├── scenes/              BootScene, WorldScene, BattleScene
│   │   ├── entities/            Player.ts, NPC.ts, WildKotodama.ts
│   │   ├── systems/             MovementSystem, EncounterSystem, WeatherSystem
│   │   └── config.ts
│   ├── ui/                      ← React only
│   │   ├── screens/             MainMenu, DexScreen, RoomScreen
│   │   ├── battle/              BattleHUD, QuestionCard, ComboBar
│   │   ├── components/          DialogueBox, Button, KotodamaCard
│   │   └── hooks/
│   ├── learning/                ← pure learning logic (never mixed with UI/Phaser)
│   │   ├── srs.ts               ts-fsrs wrapper
│   │   ├── questionGenerator.ts 12 question types
│   │   ├── comboValidator.ts    grammatical combo validation
│   │   ├── comprehensibleInput.ts
│   │   └── progressTracker.ts
│   ├── content/                 ← pure JSON, no logic
│   │   ├── ja/  vocab.json, grammar.json, dialogue.json, kotodama.json
│   │   ├── th/  vocab.json, grammar.json, dialogue.json, kotodama.json
│   │   └── schema.ts            Zod schemas
│   ├── state/                   Zustand stores
│   │   ├── playerStore.ts
│   │   ├── kotodamaStore.ts
│   │   └── worldStore.ts
│   ├── data/                    Dexie DB
│   └── i18n/                    th.json, en.json, ja.json (UI strings)
├── CLAUDE.md                    ⭐ project constitution (see Prompt Pack)
└── docs/01_GDD.md
```

### 17.4 Six Architecture Rules (stops AI from tangling the codebase)

1. **`src/learning/` may not import from `src/game/` or `src/ui/`** — pure logic, independently testable
2. **`src/game/` may not import React** — it talks to the UI only through Zustand and the event bus
3. **`src/ui/` may not import Phaser** — same rule in reverse
4. **`src/content/` is pure JSON**, no logic, Zod-validated on load
5. **All persistent state goes through `src/data/`** — never call IndexedDB directly from elsewhere
6. **No file exceeds 300 lines** — split it. AI edits small files far more accurately.

### 17.5 Performance Budget

| Item | Target |
|---|---|
| First load (gzipped) | < 3 MB |
| Time to interactive | < 3s on 4G |
| FPS | 60 desktop, 30+ mid-range mobile |
| Memory | < 250 MB |
| Assets per region | < 800 KB (lazy-loaded) |

---

## 18. Content Data Schema

### 18.1 Vocabulary Entry Schema

```typescript
// src/content/schema.ts
import { z } from "zod";

export const VocabEntry = z.object({
  id: z.string(),                        // "ja_n5_0042"
  lang: z.enum(["ja", "th"]),

  // Writing
  written: z.string(),                   // "猫" | "ข้าว"
  reading: z.string(),                   // "ねこ" | "khâao"
  romanization: z.string(),              // "neko" | "khao"

  // Meaning (per native language)
  meaning: z.record(z.string(), z.string()),
  // { th: "แมว", en: "cat", ja: "猫" }

  // Classification
  pos: z.enum(["noun","verb","adjective","particle","phrase","character","counter","adverb"]),
  element: z.enum(["bloom","spark","flow","echo","stone","light"]),
  level: z.string(),                     // "N5" | "A1"
  chapter: z.number(),
  tags: z.array(z.string()),             // ["food","market","daily"]
  frequency: z.number(),                 // real-world frequency rank

  // Audio
  audio: z.string(),                     // "voice/ja/n5_0042.mp3"
  pitchAccent: z.number().optional(),    // JA: 0=heiban 1=atamadaka ...
  tone: z.number().optional(),           // TH: 0=mid 1=low 2=falling 3=high 4=rising

  // Grammar (used by the combo validator)
  conjugationGroup: z.string().optional(),  // "godan" | "ichidan" | "irregular"
  particleAffinity: z.array(z.string()).optional(), // ["を","が"]
  counterWord: z.string().optional(),       // "匹"

  // Example sentences
  examples: z.array(z.object({
    sentence: z.string(),
    reading: z.string(),
    translation: z.record(z.string(), z.string()),
    audio: z.string().optional(),
    context: z.string(),                    // "market" | "school"
  })).min(1),

  // Kotodama
  kotodama: z.object({
    name: z.string(),                       // "Nekoko"
    sprite: z.string(),                     // "kotodama/nekoko.png"
    spriteEvolved: z.string().optional(),
    description: z.record(z.string(), z.string()),
    rarity: z.enum(["common","uncommon","rare","legendary"]),
    habitat: z.array(z.string()),           // ["school_yard","shopping_street"]
    evolveFrom: z.string().optional(),
    evolveCondition: z.object({
      type: z.enum(["combo_count","review_streak","chapter"]),
      value: z.number(),
    }).optional(),
  }),

  // Mnemonics (especially for kanji / Thai letters)
  mnemonic: z.record(z.string(), z.string()).optional(),
  strokeOrder: z.array(z.string()).optional(),  // SVG paths
});
```

### 18.2 Real Data Example

```json
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
    "habitat": ["school_yard", "shopping_street", "riverside"],
    "evolveCondition": { "type": "combo_count", "value": 20 }
  },
  "mnemonic": {
    "en": "犭(beast radical) + 苗(seedling) → the small creature hiding among the seedlings"
  }
}
```

### 18.3 Starter Data Sources (saves enormous time)

| Data | Source | Licence |
|---|---|---|
| Japanese dictionary | **JMdict** (200,000+ entries) | CC BY-SA (attribution required) |
| Kanji + stroke order | **KANJIDIC2**, KanjiVG | CC BY-SA |
| JLPT levels | JLPT Vocab API / jlpt-vocab tags | Free |
| Example sentences | **Tatoeba** | CC BY 2.0 FR |
| SRS algorithm | **ts-fsrs** | MIT |
| Thai vocabulary | ⚠️ Largely must be authored; Thai National Corpus + PyThaiNLP as a base | Verify licensing |

> ⚠️ **Important:** read the licence terms carefully and attribute correctly, especially CC BY-SA, which can affect commercial use. Consult a lawyer before a commercial launch.

---

## 19. 8-Phase Roadmap

### 🔧 Phase 0 — Foundation (Week 1)
- [ ] Set up Vite + React + TS + Phaser 4 + Tailwind
- [ ] Write `CLAUDE.md` (project constitution)
- [ ] Zod schemas + 20 sample word entries
- [ ] Movement on one test map + camera follow
- **✅ Milestone: character walks a map at 60fps**

### 🌸 Phase 1 — Vertical Slice (Weeks 2–3) ⭐ most important
Build **"a perfect first 15 minutes"** — get this right before anything else.
- [ ] Sakura Gate Station + sakura path maps (with falling petals)
- [ ] Momo + tutorial
- [ ] Catch the first 7 Kotodama = hiragana は な み が く え ん
      (together they spell 「はなみがくえん」 — the closing moment)
- [ ] Full battle loop + 3 question types
- [ ] Basic Sentence Combo (2–3 chain)
- [ ] Save to IndexedDB
- **✅ Milestone: a stranger plays 15 minutes and wants to keep going**

### 📚 Phase 2 — Learning Engine (Weeks 4–5)
- [ ] Full ts-fsrs integration
- [ ] All 12 question types
- [ ] Kotodama memory states (drowsy/asleep/fading)
- [ ] Comprehensible input engine
- [ ] Japanese content: hiragana + katakana + first 200 N5 words
- **✅ Milestone: 7 days of continuous play and the review scheduling is correct**

### 🏫 Phase 3 — Full Japanese World (Weeks 6–8)
- [ ] All 8 Japanese regions
- [ ] Season + real-time + weather systems
- [ ] 15 NPCs + quests
- [ ] 3 bosses
- [ ] Streak tree + omikuji + Dex + My Room
- **✅ Milestone: ~10 hours of content**

### 🛺 Phase 4 — Thai World (Weeks 9–11)
- [ ] All 8 Thai regions
- [ ] Thai script + tone teaching system + karaoke minigame
- [ ] EN→TH locale pair
- [ ] Tuk-tuk, bargaining and fishing minigames
- [ ] 500 Thai words
- **✅ Milestone: both languages fully playable**

### 🎨 Phase 5 — Polish (Weeks 12–13)
- [ ] Music and SFX in every scene
- [ ] Pre-generated voice for every word
- [ ] Story cutscenes
- [ ] Mobile optimisation
- [ ] Accessibility (font scaling, reduced motion, colourblind mode)
- **✅ Milestone: ready for outside players**

### 🧪 Phase 6 — Beta (Weeks 14–16)
- [ ] Closed beta with 50 people (25 TH→JA, 25 foreign→TH)
- [ ] Analytics: drop-off points, anomalously hard questions
- [ ] Difficulty balancing (target 85–90% success rate)
- [ ] Bug fixing
- **✅ Milestone: D7 retention > 30%**

### 🚀 Phase 7 — Launch & Beyond
- [ ] Public launch
- [ ] Supabase cloud sync + accounts
- [ ] Leagues + social features
- [ ] First seasonal event
- [ ] Additional locale pairs (JA→TH, EN→JA)
- [ ] PWA / mobile packaging (Capacitor)

---

## 20. KPIs & Risks

### 20.1 Metrics

| Category | Metric | Target |
|---|---|---|
| **Retention** | D1 / D7 / D30 | 50% / 30% / 15% |
| | Average streak | > 8 days |
| **Engagement** | Session length | 12–18 min |
| | Sessions per day | 1.4 |
| **Learning** ⭐ | Words retained at 30 days | > 70% |
| | Lapse rate | < 15% |
| | New words per week | 30–50 |
| | Sentence Combo usage | > 60% of battles |
| **Quality** | Question success rate | 85–90% |
| | Crash-free sessions | > 99.5% |
| **Business** | Supporter conversion | 3–5% |

> ⭐ **The most important metric is "words retained at 30 days," not DAU.** If people play a lot but don't acquire the language, the game has failed its purpose.

### 20.2 Risks & Mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| **Enormous content cost** (1,200 words × Kotodama × audio × examples) | 🔴 Highest | AI drafts, native speakers verify + build on JMdict/Tatoeba + ship chapter by chapter |
| **AI pixel art inconsistency** (especially animation frames and seamless tilesets) | 🔴 High | Use AI for single still frames only, then hand-fix in Aseprite + lock the 48-colour palette + use specialised tools (PixelLab for 8-direction/tilesets) |
| **Teaching Thai tones through a game is genuinely hard** | 🟠 Medium | Invest in the rhythm minigame + pitch-contour visuals + high-quality audio (no cheap TTS) |
| **No good Thai pixel font exists** | 🟠 Medium | Render text via React/HTML instead (accept non-pixel text) |
| **Scope creep** | 🔴 High | Hold the line on the vertical slice — never touch Phase 3 before Phase 1 is genuinely good |
| **CC BY-SA licensing may affect commercial use** | 🟠 Medium | Verify terms, attribute fully, consult a lawyer |
| **Cultural misrepresentation** (especially monks and religion) | 🟠 Medium | Have native cultural reviewers from both sides sign off before release |
| **Gamification producing shallow learning** (research shows streak-motivated learners churn faster than interest-motivated ones) | 🟠 Medium | Build intrinsic motivation — story, characters worth caring about, curiosity about the culture — not just numbers |
| **Insufficient mobile performance** | 🟡 Low | Set the performance budget from day one and test on mid/low-end devices every phase |

---

## 📌 Summary: The Five Things to Get Right

1. **Sentence Combo** — nobody else does this; it's the reason people will tell their friends
2. **Kotodama with emotional weight** — SRS the player *feels* rather than reads as a number
3. **The first 15 minutes** — beautiful, warm, and containing the moment the player genuinely reads something for the first time
4. **A living atmosphere** — falling petals, noodle-pot steam, thin snow, the sound of a tuk-tuk
5. **Always gentle** — being wrong must not hurt, because the real enemy of language learning is the fear of getting it wrong

---

*Version 1.0 — revise after each completed phase.*
