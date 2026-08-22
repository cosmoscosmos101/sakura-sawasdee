import type { QuestionType } from "./questionGenerator";

/**
 * Difficulty balancer — tracks success rate over a rolling window of the last
 * 20 answers and adjusts question difficulty to target 85–90% correct.
 *
 * Pure logic: no state stored here. Callers persist the window via the db layer.
 */

const WINDOW_SIZE = 20;
const TARGET_MIN = 0.85;
const TARGET_MAX = 0.90;

export interface AnswerRecord {
  correct: boolean;
  questionType: QuestionType;
  timestampMs: number;
}

export interface DifficultyAdjustment {
  /** 0-1: current success rate over the window. */
  successRate: number;
  /** Suggested new words per session (lower when struggling). */
  newWordsPerSession: number;
  /** Whether to add harder question types to the mix this session. */
  includeHardTypes: boolean;
  /** Human-readable reason (never shown to player — for debug). */
  reason: string;
}

/** Keep only the last WINDOW_SIZE answers in the history. */
export function appendAnswer(
  history: AnswerRecord[],
  record: AnswerRecord,
): AnswerRecord[] {
  const next = [...history, record];
  return next.length > WINDOW_SIZE ? next.slice(next.length - WINDOW_SIZE) : next;
}

/** Compute success rate over the provided history window. */
export function successRate(history: AnswerRecord[]): number {
  if (history.length === 0) return 1;
  const correct = history.filter((r) => r.correct).length;
  return correct / history.length;
}

/**
 * Recommend difficulty adjustments based on the rolling window.
 *
 * - Above 90%: introduce harder question types and more new words.
 * - 85–90%: maintain the current balance (golden zone).
 * - Below 85%: reduce new words, favour easier question types.
 */
export function computeAdjustment(history: AnswerRecord[]): DifficultyAdjustment {
  const rate = successRate(history);

  if (rate > TARGET_MAX) {
    return {
      successRate: rate,
      newWordsPerSession: 10,
      includeHardTypes: true,
      reason: `${pct(rate)} correct — above target, increasing challenge`,
    };
  }

  if (rate >= TARGET_MIN) {
    return {
      successRate: rate,
      newWordsPerSession: 7,
      includeHardTypes: false,
      reason: `${pct(rate)} correct — in target range, maintaining balance`,
    };
  }

  return {
    successRate: rate,
    newWordsPerSession: Math.max(3, Math.floor(7 * (rate / TARGET_MIN))),
    includeHardTypes: false,
    reason: `${pct(rate)} correct — below target, reducing new words`,
  };
}

/**
 * Question types ordered from easiest (recognition) to hardest (production).
 * The balancer picks a slice from the front when struggling.
 */
const EASY_TYPES: QuestionType[] = [
  "meaning_match",
  "listening",
  "script_reading",
];
const HARD_TYPES: QuestionType[] = [
  "sentence_build",
  "cloze",
  "reverse_recall",
  "context_choice",
  "counter_word",
  "politeness_register",
  "tone_match",
  "pitch_match",
];

/**
 * Return the recommended pool of question types for the current session.
 * When struggling, only easy types are returned.
 * When exceeding target, the full set (including hard types) is offered.
 */
export function recommendedQuestionTypes(history: AnswerRecord[]): QuestionType[] {
  const { includeHardTypes } = computeAdjustment(history);
  return includeHardTypes ? [...EASY_TYPES, ...HARD_TYPES] : EASY_TYPES;
}

/**
 * Identify the weakest question type in recent history (most incorrect answers).
 * Returns null when the window is too small to determine.
 */
export function weakestQuestionType(history: AnswerRecord[]): QuestionType | null {
  if (history.length < 5) return null;

  const counts: Partial<Record<QuestionType, { correct: number; total: number }>> = {};

  for (const r of history) {
    const entry = counts[r.questionType] ?? { correct: 0, total: 0 };
    entry.total++;
    if (r.correct) entry.correct++;
    counts[r.questionType] = entry;
  }

  let worst: QuestionType | null = null;
  let worstRate = 1;

  for (const [type, data] of Object.entries(counts) as [QuestionType, { correct: number; total: number }][]) {
    if (data.total < 2) continue;
    const rate = data.correct / data.total;
    if (rate < worstRate) {
      worstRate = rate;
      worst = type;
    }
  }

  return worst;
}

function pct(r: number): string {
  return `${Math.round(r * 100)}%`;
}
