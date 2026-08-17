import { fsrs, createEmptyCard, Rating, State, type Card, type Grade } from "ts-fsrs";

const f = fsrs({ request_retention: 0.9 });

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * In-game answer quality — maps to FSRS ratings.
 * These are the only terms the player sees (wrapped in game language by callers).
 */
export type AnswerOutcome = "critical" | "correct" | "assisted" | "incorrect";

/** Mirror of SrsCard in db.ts — keeps learning/ pure with no db import. */
export interface SrsCardData {
  vocabId: string;
  due: number;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  state: number;
  lastReview: number;
}

/**
 * FSRS retrievability → visible Kotodama memory state.
 * Never use the word "memory" or "SRS" in player-facing strings.
 */
export type KotodamaMemoryState =
  | "radiant"  // 90–100% — ATK +30%, combo-eligible
  | "bright"   // 60–89% — normal
  | "dazed"    // 30–59% — ATK −25%
  | "sleepy"   // 10–29% — unusable until woken
  | "fading";  //  0–9%  — at risk of returning to the wild

export interface SrsStats {
  due: number;
  newCards: number;
  learning: number;
  review: number;
  lapsed: number;
}

// ── Conversion helpers ────────────────────────────────────────────────────────

function toFsrs(card: SrsCardData): Card {
  const base = {
    due: new Date(card.due),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsedDays,
    scheduled_days: card.scheduledDays,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state as State,
  };
  if (card.lastReview) return { ...base, last_review: new Date(card.lastReview) };
  return base;
}

function fromFsrs(vocabId: string, card: Card): SrsCardData {
  return {
    vocabId,
    due: card.due.getTime(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsedDays: card.elapsed_days,
    scheduledDays: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    lastReview: card.last_review?.getTime() ?? 0,
  };
}

export function outcomeToRating(outcome: AnswerOutcome): Grade {
  switch (outcome) {
    case "critical":  return Rating.Easy;
    case "correct":   return Rating.Good;
    case "assisted":  return Rating.Hard;
    case "incorrect": return Rating.Again;
  }
}

// ── Core SRS functions ────────────────────────────────────────────────────────

/** Create a brand-new card for a vocab entry. */
export function createCard(vocabId: string, now = Date.now()): SrsCardData {
  const card = createEmptyCard(new Date(now));
  return fromFsrs(vocabId, card);
}

/**
 * Process a player's answer and return the next card state.
 * The returned card must be persisted by the caller (db layer).
 */
export function reviewCard(
  card: SrsCardData,
  outcome: AnswerOutcome,
  now = Date.now(),
): SrsCardData {
  const fsrsCard = toFsrs(card);
  const grade = outcomeToRating(outcome);
  const result = f.repeat(fsrsCard, new Date(now));
  const nextCard = result[grade].card;
  return fromFsrs(card.vocabId, nextCard);
}

/**
 * Cards whose `due` is at or before `now`.
 * Includes all non-New states (Learning, Review, Relearning).
 */
export function getDueCards(cards: SrsCardData[], now = Date.now()): SrsCardData[] {
  return cards.filter((c) => c.state !== State.New && c.due <= now);
}

/** Cards that have never been reviewed (State.New). */
export function getNewCards(cards: SrsCardData[]): SrsCardData[] {
  return cards.filter((c) => c.state === State.New);
}

/** Aggregate counts across all card states. */
export function getStats(cards: SrsCardData[], now = Date.now()): SrsStats {
  let due = 0;
  let newCards = 0;
  let learning = 0;
  let review = 0;
  let lapsed = 0;

  for (const c of cards) {
    if (c.state === State.New) { newCards++; continue; }
    if (c.due <= now) due++;
    if (c.state === State.Learning) learning++;
    else if (c.state === State.Review) review++;
    else if (c.state === State.Relearning) lapsed++;
  }

  return { due, newCards, learning, review, lapsed };
}

/** Retrievability as a 0–1 number (1 = perfectly remembered). */
export function getRetrievability(card: SrsCardData, now = Date.now()): number {
  if (card.state === State.New) return 1;
  const fsrsCard = toFsrs(card);
  return f.get_retrievability(fsrsCard, new Date(now), false);
}

/** Map retrievability to the Kotodama memory state the player sees. */
export function getMemoryState(card: SrsCardData, now = Date.now()): KotodamaMemoryState {
  const r = getRetrievability(card, now);
  if (r >= 0.90) return "radiant";
  if (r >= 0.60) return "bright";
  if (r >= 0.30) return "dazed";
  if (r >= 0.10) return "sleepy";
  return "fading";
}

/**
 * A Kotodama fading for 7+ consecutive days at <10% retrievability
 * should be treated as "returned to the wild" (must be recaught).
 *
 * `daysSinceDue` is the number of whole days past the due date.
 */
export function isLost(card: SrsCardData, now = Date.now()): boolean {
  if (card.state !== State.Review) return false;
  const r = getRetrievability(card, now);
  if (r >= 0.10) return false;
  const daysPast = Math.floor((now - card.due) / (86_400_000));
  return daysPast >= 7;
}
