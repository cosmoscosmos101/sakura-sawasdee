/**
 * Thai script classification engine.
 * Pure functions — no UI or Phaser dependencies.
 *
 * The three consonant classes determine the "baseline" tone of every syllable.
 * When a tone mark is added the mark overrides the baseline according to a
 * fixed table that differs by class. Teaching this as a "recipe" — class +
 * vowel length + live/dead + mark = tone — is the core of the Tone Kitchen.
 */

export type ConsonantClass = "mid" | "high" | "low";
export type Tone = 0 | 1 | 2 | 3 | 4; // 0=mid 1=low 2=falling 3=high 4=rising
export type ToneMark = "none" | "mai_ek" | "mai_tho" | "mai_tri" | "mai_jattawa";
export type VowelLength = "short" | "long";
export type SyllableType = "live" | "dead";

export const TONE_NAMES: Record<Tone, string> = {
  0: "mid",
  1: "low",
  2: "falling",
  3: "high",
  4: "rising",
};

export const TONE_MARK_CHAR: Record<ToneMark, string> = {
  none:         "–",
  mai_ek:       "่",
  mai_tho:      "้",
  mai_tri:      "๊",
  mai_jattawa:  "๋",
};

// ── Consonant tables ──────────────────────────────────────────────────────────

const MID_CLASS = new Set(["ก", "จ", "ฎ", "ฏ", "ด", "ต", "บ", "ป", "อ"]);
const HIGH_CLASS = new Set(["ข", "ฃ", "ฉ", "ฐ", "ถ", "ผ", "ฝ", "ศ", "ษ", "ส", "ห"]);

export function getConsonantClass(letter: string): ConsonantClass {
  if (MID_CLASS.has(letter))  return "mid";
  if (HIGH_CLASS.has(letter)) return "high";
  return "low";
}

export function getMidClassConsonants(): string[] {
  return [...MID_CLASS];
}
export function getHighClassConsonants(): string[] {
  return [...HIGH_CLASS];
}
export function getLowClassConsonants(): string[] {
  return ALL_CONSONANTS.filter((c) => !MID_CLASS.has(c) && !HIGH_CLASS.has(c));
}

export const ALL_CONSONANTS = [
  "ก","ข","ฃ","ค","ฅ","ฆ","ง",
  "จ","ฉ","ช","ซ","ฌ","ญ",
  "ฎ","ฏ","ฐ","ฑ","ฒ","ณ",
  "ด","ต","ถ","ท","ธ","น",
  "บ","ป","ผ","ฝ","พ","ฟ","ภ","ม",
  "ย","ร","ล","ว",
  "ศ","ษ","ส","ห","ฬ","อ","ฮ",
];

// ── Tone determination table ──────────────────────────────────────────────────
//
// Rows: consonant class + live/dead (mid-live, mid-dead-short, mid-dead-long, …)
// Columns: tone marks (none, mai_ek, mai_tho, mai_tri, mai_jattawa)
//
// "dead" syllable = ends in a short stop consonant (k/p/t) or short vowel only
// "live" syllable = ends in a sonorant consonant, long vowel, or nasal

type ToneKey = `${ConsonantClass}_${"live" | "dead_short" | "dead_long"}`;

const TONE_TABLE: Record<ToneKey, Record<ToneMark, Tone>> = {
  mid_live:       { none: 0, mai_ek: 1, mai_tho: 2, mai_tri: 3, mai_jattawa: 4 },
  mid_dead_short: { none: 1, mai_ek: 1, mai_tho: 2, mai_tri: 3, mai_jattawa: 4 },
  mid_dead_long:  { none: 1, mai_ek: 1, mai_tho: 2, mai_tri: 3, mai_jattawa: 4 },
  high_live:      { none: 4, mai_ek: 1, mai_tho: 2, mai_tri: 3, mai_jattawa: 4 },
  high_dead_short:{ none: 1, mai_ek: 1, mai_tho: 2, mai_tri: 3, mai_jattawa: 4 },
  high_dead_long: { none: 1, mai_ek: 1, mai_tho: 2, mai_tri: 3, mai_jattawa: 4 },
  low_live:       { none: 0, mai_ek: 2, mai_tho: 3, mai_tri: 3, mai_jattawa: 4 },
  low_dead_short: { none: 3, mai_ek: 2, mai_tho: 3, mai_tri: 3, mai_jattawa: 4 },
  low_dead_long:  { none: 2, mai_ek: 2, mai_tho: 3, mai_tri: 3, mai_jattawa: 4 },
};

export interface ToneRecipe {
  consonantClass: ConsonantClass;
  vowelLength: VowelLength;
  syllableType: SyllableType;
  toneMark: ToneMark;
}

export interface ToneResult {
  tone: Tone;
  toneName: string;
  rule: string;
}

export function computeTone(recipe: ToneRecipe): ToneResult {
  const { consonantClass, vowelLength, syllableType, toneMark } = recipe;
  const key: ToneKey =
    syllableType === "live"
      ? `${consonantClass}_live`
      : vowelLength === "short"
        ? `${consonantClass}_dead_short`
        : `${consonantClass}_dead_long`;

  const tone = TONE_TABLE[key][toneMark];
  const toneName = TONE_NAMES[tone];
  const rule = buildRuleExplanation(consonantClass, vowelLength, syllableType, toneMark, tone);
  return { tone, toneName, rule };
}

function buildRuleExplanation(
  cls: ConsonantClass,
  len: VowelLength,
  syl: SyllableType,
  mark: ToneMark,
  tone: Tone,
): string {
  const markStr = mark === "none" ? "no tone mark" : `mai ${mark.replace("mai_", "").replace("_", " ")}`;
  const deadStr = syl === "dead" ? ` + ${len} dead syllable` : " + live syllable";
  return `${cls}-class consonant${deadStr} + ${markStr} → ${TONE_NAMES[tone]} tone`;
}

// ── Tone mark detection ───────────────────────────────────────────────────────

const TONE_MARK_CODEPOINTS: Record<string, ToneMark> = {
  "่": "mai_ek",
  "้": "mai_tho",
  "๊": "mai_tri",
  "๋": "mai_jattawa",
};

export function detectToneMark(syllable: string): ToneMark {
  for (const char of syllable) {
    const mark = TONE_MARK_CODEPOINTS[char];
    if (mark) return mark;
  }
  return "none";
}

// ── Colour coding for Tone Kitchen UI ────────────────────────────────────────

export const TONE_COLOUR: Record<Tone, string> = {
  0: "#7FC4E0", // mid    → WATER_2 (flat)
  1: "#9188A0", // low    → INK_SOFT (muted)
  2: "#F7A8C4", // falling → SAKURA_3 (dramatic)
  3: "#FFE08A", // high   → GOLD_1 (bright)
  4: "#C9B8F0", // rising → LAVENDER_3 (lift)
};

export const CLASS_COLOUR: Record<ConsonantClass, string> = {
  mid:  "#FFE08A", // GOLD_2 — central, neutral
  high: "#7FC4E0", // WATER_2 — elevated
  low:  "#F7A8C4", // SAKURA_3 — gentle
};

// ── Tone Kitchen: validate a player's ingredient guess ───────────────────────

export interface ToneKitchenGuess {
  recipe: ToneRecipe;
  guessedTone: Tone;
}

export interface ToneKitchenResult {
  correct: boolean;
  actual: ToneResult;
  explanation: string;
}

export function evaluateToneKitchenGuess(guess: ToneKitchenGuess): ToneKitchenResult {
  const actual = computeTone(guess.recipe);
  const correct = guess.guessedTone === actual.tone;
  const explanation = correct
    ? `Correct! ${actual.rule}`
    : `The result is ${actual.toneName} tone. ${actual.rule}`;
  return { correct, actual, explanation };
}
