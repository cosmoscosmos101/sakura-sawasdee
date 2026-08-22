import type { VocabEntry } from "../content/schema";
import {
  generateMeaningMatch,
  type Question,
  type L1,
} from "./questionGenerator";

// ── Internal helpers (duplicated locally to keep this file self-contained) ────

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

function pickDistractors(pool: VocabEntry[], excludeId: string, n: number): VocabEntry[] {
  const candidates = pool.filter((e) => e.id !== excludeId);
  shuffleInPlace(candidates);
  return candidates.slice(0, n);
}

function buildOptions(
  correctText: string,
  distractorTexts: string[],
): { options: { text: string }[]; correctIndex: number } {
  const all = [
    { text: correctText },
    ...distractorTexts.slice(0, 3).map((t) => ({ text: t })),
  ];
  shuffleInPlace(all);
  const correctIndex = all.findIndex((o) => o.text === correctText);
  return { options: all, correctIndex: correctIndex === -1 ? 0 : correctIndex };
}

// ── Advanced question generators ─────────────────────────────────────────────

/**
 * cloze — show an example sentence with the target word blanked out.
 * Player picks the correct word from 4 options.
 * Falls back to meaning_match if the entry has no example sentence.
 */
export function generateCloze(
  entry: VocabEntry,
  pool: VocabEntry[],
  l1: L1,
): Question {
  const example = entry.examples.at(0);
  if (!example) return generateMeaningMatch(entry, pool, l1);

  const blank = "___";
  const clozePrompt = example.sentence.replaceAll(entry.written, blank);
  if (!clozePrompt.includes(blank)) return generateMeaningMatch(entry, pool, l1);

  const distractors = pickDistractors(pool, entry.id, 3).map((d) => d.written);
  const { options, correctIndex } = buildOptions(entry.written, distractors);

  return {
    type: "cloze",
    vocabId: entry.id,
    prompt: clozePrompt,
    promptSub: example.reading.replaceAll(entry.reading, blank),
    options,
    correctIndex,
    timeLimitMs: 10000,
  };
}

/**
 * context_choice — show a usage context description (from the example's context
 * field or the entry's tags), pick the word that fits.
 * Good for distinguishing near-synonyms in practice situations.
 */
export function generateContextChoice(
  entry: VocabEntry,
  pool: VocabEntry[],
  l1: L1,
): Question {
  const example = entry.examples.at(0);
  const context = example?.context ?? entry.tags.join(", ");
  const l1Meaning = entry.meaning[l1] ?? entry.meaning["en"] ?? entry.written;

  const prompt = `${context} — "${l1Meaning}"`;
  const distractors = pickDistractors(pool, entry.id, 3).map((d) => d.written);
  const { options, correctIndex } = buildOptions(entry.written, distractors);

  return {
    type: "context_choice",
    vocabId: entry.id,
    prompt,
    options,
    correctIndex,
    timeLimitMs: 10000,
  };
}

/**
 * counter_word (Japanese-specific) — show a number + noun, pick the correct
 * counter word (匹, 本, 枚, etc.).
 * Falls back to meaning_match for entries without a counterWord field.
 */
export function generateCounterWord(
  entry: VocabEntry,
  pool: VocabEntry[],
  _l1: L1,
): Question {
  const counter = entry.counterWord;
  if (!counter) return generateMeaningMatch(entry, pool, _l1);

  const counterPool = pool
    .filter((e) => e.counterWord && e.id !== entry.id)
    .map((e) => e.counterWord as string);
  shuffleInPlace(counterPool);
  const distractors = counterPool.slice(0, 3);

  if (distractors.length < 3) return generateMeaningMatch(entry, pool, _l1);

  const { options, correctIndex } = buildOptions(counter, distractors);

  return {
    type: "counter_word",
    vocabId: entry.id,
    prompt: `3 + ${entry.written} =`,
    promptSub: `3 + ${entry.reading}`,
    options,
    correctIndex,
    timeLimitMs: 8000,
  };
}

/**
 * politeness_register — show a casual sentence, pick the correct polite (です/ます) form.
 * The example sentence is the polite form; distractors are phonetically similar.
 * Falls back to meaning_match when no examples exist.
 */
export function generatePolitenessRegister(
  entry: VocabEntry,
  pool: VocabEntry[],
  l1: L1,
): Question {
  const example = entry.examples.at(0);
  if (!example) return generateMeaningMatch(entry, pool, l1);

  const distractors = pickDistractors(pool, entry.id, 3)
    .map((d) => d.examples.at(0)?.sentence ?? d.written);
  const { options, correctIndex } = buildOptions(example.sentence, distractors);

  return {
    type: "politeness_register",
    vocabId: entry.id,
    prompt: entry.meaning[l1] ?? entry.meaning["en"] ?? entry.written,
    promptSub: "— pick the polite form",
    options,
    correctIndex,
    timeLimitMs: 10000,
  };
}

// ── Thai-specific ─────────────────────────────────────────────────────────────

const TONE_LABELS: Record<number, string> = {
  0: "mid (สามัญ)",
  1: "low (เอก)",
  2: "falling (โท)",
  3: "high (ตรี)",
  4: "rising (จัตวา)",
};

/**
 * tone_match (Thai) — show the Thai word, pick its tone.
 * Uses the `tone` field (0–4) from the vocab entry.
 * Falls back to meaning_match if no tone is set.
 */
export function generateToneMatch(
  entry: VocabEntry,
  pool: VocabEntry[],
  l1: L1,
): Question {
  if (entry.tone === undefined) return generateMeaningMatch(entry, pool, l1);

  const correctLabel = TONE_LABELS[entry.tone] ?? String(entry.tone);
  const usedTones = new Set([entry.tone]);
  const distractors: string[] = [];

  for (let t = 0; t <= 4 && distractors.length < 3; t++) {
    if (!usedTones.has(t)) {
      distractors.push(TONE_LABELS[t] ?? String(t));
      usedTones.add(t);
    }
  }

  const { options, correctIndex } = buildOptions(correctLabel, distractors);

  return {
    type: "tone_match",
    vocabId: entry.id,
    prompt: entry.written,
    promptSub: entry.romanization,
    options,
    correctIndex,
    timeLimitMs: 8000,
  };
}

// ── Japanese-specific ─────────────────────────────────────────────────────────

/**
 * pitch_match (Japanese) — show a word, pick its pitch accent pattern (0–N).
 * Uses the `pitchAccent` field. Falls back to meaning_match if not present.
 *
 * Pitch accent numbers: 0=heiban (flat), 1=atamadaka, 2+= odaka/nakadaka.
 * Players see the mora number, not a linguist label — kept concrete and learnable.
 */
export function generatePitchMatch(
  entry: VocabEntry,
  pool: VocabEntry[],
  l1: L1,
): Question {
  if (entry.pitchAccent === undefined) return generateMeaningMatch(entry, pool, l1);

  const correct = String(entry.pitchAccent);
  const moraCount = entry.reading.length;
  const allPatterns = Array.from({ length: Math.min(moraCount + 1, 5) }, (_, i) => String(i));
  const distractors = allPatterns.filter((p) => p !== correct).slice(0, 3);

  if (distractors.length < 2) return generateMeaningMatch(entry, pool, l1);

  const { options, correctIndex } = buildOptions(correct, distractors);

  return {
    type: "pitch_match",
    vocabId: entry.id,
    prompt: entry.written,
    promptSub: entry.reading,
    options,
    correctIndex,
    timeLimitMs: 8000,
  };
}
