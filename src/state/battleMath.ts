import { db, type SrsCard } from "../data/db";
import { createCard, reviewCard as srsReview, type AnswerOutcome } from "../learning/srs";

export const BASE_DAMAGE = 10;
export const ENEMY_DAMAGE_PER_TURN = 4;
export const ENEMY_MAX_HP = 30;
export const PLAYER_MAX_HP = 40;
export const WRONG_ANSWER_HP_LOSS = 2; // 5% of 40 — Always Gentle

export type TimingTier = "critical" | "normal" | "slow";

export function timingTier(ms: number): TimingTier {
  if (ms <= 3000) return "critical";
  if (ms <= 8000) return "normal";
  return "slow";
}

export function timingMultiplier(tier: TimingTier): number {
  if (tier === "critical") return 2.0;
  if (tier === "slow") return 0.7;
  return 1.0;
}

export async function persistSrsReview(vocabId: string, outcome: AnswerOutcome): Promise<void> {
  const existing = await db.srsCards.get(vocabId);
  const card: SrsCard = existing ?? { ...createCard(vocabId), vocabId };
  const updated = srsReview(card, outcome);
  await db.srsCards.put({ ...updated, vocabId });
}

/** Held until the player leaves the result card, so a slip can still be forgiven. */
let pendingIncorrectReview: { vocabId: string; outcome: AnswerOutcome } | null = null;

export function queueIncorrectReview(vocabId: string, outcome: AnswerOutcome): void {
  pendingIncorrectReview = { vocabId, outcome };
}

export function takePendingIncorrectReview(): { vocabId: string; outcome: AnswerOutcome } | null {
  const next = pendingIncorrectReview;
  pendingIncorrectReview = null;
  return next;
}

export function clearPendingIncorrectReview(): void {
  pendingIncorrectReview = null;
}
