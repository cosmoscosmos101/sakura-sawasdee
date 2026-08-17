import type { VocabEntry } from "../content/schema";

/**
 * Pure question generation — no Phaser or React imports. (CLAUDE.md §4)
 *
 * Five question types map to distinct memory pathways:
 *   meaning_match   L2 → L1  (recognition)
 *   reverse_recall  L1 → L2  (production)
 *   script_reading  written → reading (decoding)
 *   listening       audio → L1 meaning (aural recognition)
 *   sentence_build  scrambled words → correct sentence (grammar)
 */

export type QuestionType =
  | "meaning_match"
  | "reverse_recall"
  | "script_reading"
  | "listening"
  | "sentence_build"
  | "cloze"
  | "context_choice"
  | "counter_word"
  | "politeness_register"
  | "tone_match"
  | "pitch_match";

export type L1 = "th" | "en";

export interface QuestionOption {
  text: string;
}

export interface Question {
  type: QuestionType;
  vocabId: string;
  /** Main visible prompt. */
  prompt: string;
  /** Secondary prompt line — reading / romanisation shown below the main prompt. */
  promptSub?: string;
  /** Always exactly 4 options. */
  options: QuestionOption[];
  /** Index into options[] for the correct answer. */
  correctIndex: number;
  /** Total time the player has. Critical window = 0–3000 ms, over-time = 8000+ ms. */
  timeLimitMs: number;
}

// ── Internal helpers ─────────────────────────────────────────────────────────

/** Fisher-Yates shuffle — mutates arr in place. */
function shuffleInPlace<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i];
    const other = arr[j];
    if (tmp !== undefined && other !== undefined) {
      arr[i] = other;
      arr[j] = tmp;
    }
  }
}

/**
 * Pick `n` vocab entries from the pool that are NOT the target entry.
 * Prefers entries from the same chapter and pos, then falls back to any.
 */
function pickDistractors(pool: VocabEntry[], excludeId: string, n: number): VocabEntry[] {
  const candidates = pool.filter((e) => e.id !== excludeId);
  shuffleInPlace(candidates);
  return candidates.slice(0, n);
}

/**
 * Build a shuffled 4-option array and return the new index of the correct answer.
 * correctOption is placed into a random position among the distractors.
 */
function buildOptions(
  correctText: string,
  distractorTexts: string[],
): { options: QuestionOption[]; correctIndex: number } {
  const all: QuestionOption[] = [
    { text: correctText },
    ...distractorTexts.slice(0, 3).map((t) => ({ text: t })),
  ];
  shuffleInPlace(all);
  const correctIndex = all.findIndex((o) => o.text === correctText);
  return { options: all, correctIndex: correctIndex === -1 ? 0 : correctIndex };
}

/** Safe access: returns the value or throws a clear error. */
function require<T>(value: T | undefined, label: string): T {
  if (value === undefined) throw new Error(`questionGenerator: missing ${label}`);
  return value;
}

// ── Question generators ──────────────────────────────────────────────────────

/**
 * meaning_match — show the L2 written word, pick the L1 meaning.
 * Tests recognition: seeing the word → knowing what it means.
 */
export function generateMeaningMatch(
  entry: VocabEntry,
  pool: VocabEntry[],
  l1: L1,
): Question {
  const correctMeaning = entry.meaning[l1] ?? require(entry.meaning["en"], "meaning.en");
  const distractors = pickDistractors(pool, entry.id, 3);
  const distTexts = distractors.map((d) => d.meaning[l1] ?? d.meaning["en"] ?? d.written);
  const { options, correctIndex } = buildOptions(correctMeaning, distTexts);

  return {
    type: "meaning_match",
    vocabId: entry.id,
    prompt: entry.written,
    promptSub: entry.reading,
    options,
    correctIndex,
    timeLimitMs: 8000,
  };
}

/**
 * reverse_recall — show the L1 meaning, pick the L2 written word.
 * Tests production: seeing the meaning → finding the target word.
 */
export function generateReverseRecall(
  entry: VocabEntry,
  pool: VocabEntry[],
  l1: L1,
): Question {
  const prompt = entry.meaning[l1] ?? require(entry.meaning["en"], "meaning.en");
  const distractors = pickDistractors(pool, entry.id, 3);
  const distTexts = distractors.map((d) => d.written);
  const { options, correctIndex } = buildOptions(entry.written, distTexts);

  return {
    type: "reverse_recall",
    vocabId: entry.id,
    prompt,
    options,
    correctIndex,
    timeLimitMs: 8000,
  };
}

/**
 * script_reading — show the written form (kanji/script), pick the reading.
 * Targets script decoding, distinct from meaning recall.
 */
export function generateScriptReading(entry: VocabEntry, pool: VocabEntry[]): Question {
  const distractors = pickDistractors(pool, entry.id, 3);
  const distTexts = distractors.map((d) => d.reading);
  const { options, correctIndex } = buildOptions(entry.reading, distTexts);

  return {
    type: "script_reading",
    vocabId: entry.id,
    prompt: entry.written,
    options,
    correctIndex,
    timeLimitMs: 8000,
  };
}

/**
 * listening — audio prompt → pick the L1 meaning.
 * Structurally identical to meaning_match; the audio is played by the UI layer.
 * When no audio file is available the UI falls back to showing the reading.
 */
export function generateListening(
  entry: VocabEntry,
  pool: VocabEntry[],
  l1: L1,
): Question {
  const q = generateMeaningMatch(entry, pool, l1);
  return { ...q, type: "listening", prompt: entry.reading };
}

/**
 * sentence_build — pick the correctly ordered sentence from 4 options.
 * Uses example sentences from the vocab entry plus shuffled variants.
 *
 * This is a simplified vertical-slice version: recognise the correct word order.
 * A full drag-and-drop implementation comes in Phase 2.
 */
export function generateSentenceBuild(
  entry: VocabEntry,
  pool: VocabEntry[],
  l1: L1,
): Question {
  const example = entry.examples.at(0);
  if (!example) return generateMeaningMatch(entry, pool, l1);

  const correct = example.sentence;
  // Distractors: sentences from other entries' examples
  const distractors = pickDistractors(pool, entry.id, 3)
    .map((d) => d.examples.at(0)?.sentence ?? d.written)
    .slice(0, 3);

  const { options, correctIndex } = buildOptions(correct, distractors);

  return {
    type: "sentence_build",
    vocabId: entry.id,
    prompt: example.translation[l1] ?? example.translation["en"] ?? example.sentence,
    options,
    correctIndex,
    timeLimitMs: 12000, // more time — harder task
  };
}

// ── Public API ───────────────────────────────────────────────────────────────

const ORDERED_TYPES: QuestionType[] = [
  "meaning_match",
  "reverse_recall",
  "script_reading",
  "listening",
  "sentence_build",
];

/**
 * Generate a question of the given type.
 * Falls back to meaning_match when the pool is too small.
 * Advanced types (cloze, context_choice, etc.) are handled by
 * questionGeneratorAdvanced.ts — callers must import and call those directly.
 */
export function generateQuestion(
  type: QuestionType,
  entry: VocabEntry,
  pool: VocabEntry[],
  l1: L1,
): Question {
  if (pool.length < 4) return generateMeaningMatch(entry, pool, l1);
  switch (type) {
    case "meaning_match":   return generateMeaningMatch(entry, pool, l1);
    case "reverse_recall":  return generateReverseRecall(entry, pool, l1);
    case "script_reading":  return generateScriptReading(entry, pool);
    case "listening":       return generateListening(entry, pool, l1);
    case "sentence_build":  return generateSentenceBuild(entry, pool, l1);
    default:                return generateMeaningMatch(entry, pool, l1);
  }
}

/**
 * Pick the question type for the nth time an entry has been seen this session.
 * Early encounters favour easier types; later encounters push toward production.
 */
export function questionTypeForEncounter(encounterN: number): QuestionType {
  return ORDERED_TYPES[encounterN % ORDERED_TYPES.length] ?? "meaning_match";
}
