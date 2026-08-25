import { useBattleStore } from "./battleStore";
import {
  WRONG_ANSWER_HP_LOSS,
  clearPendingIncorrectReview,
} from "./battleMath";

/**
 * HFS battle-drill affordances: skip a prompt you don't know yet,
 * and forgive a slip before it is written into the Kotodama's memory.
 */

export function skipQuestion(): void {
  const { phase, currentQuestion, submitAnswer } = useBattleStore.getState();
  if (phase !== "question" || !currentQuestion) return;
  submitAnswer(-1, 8_001);
}

export function forgiveLastMistake(): void {
  const { phase, lastResult, playerHp, playerMaxHp } = useBattleStore.getState();
  if (phase !== "result" || !lastResult) return;
  if (lastResult.correct || lastResult.forgiven || lastResult.skipped) return;

  clearPendingIncorrectReview();
  const restored = Math.min(playerMaxHp, playerHp + WRONG_ANSWER_HP_LOSS);
  useBattleStore.setState({
    playerHp: restored,
    lastResult: { ...lastResult, forgiven: true },
  });
}
