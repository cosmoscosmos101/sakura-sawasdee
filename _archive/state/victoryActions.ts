import { useBattleStore } from "./battleStore";

/**
 * S.3 Defeat state Part B — battle reward display.
 *
 * Does NOT write to Dexie — questStore.addExp() handles persistence
 * when it receives the battle:end event from endBattle().
 * This function only sets battleStore state for EndCard to render.
 *
 * XP formula (mirrors endBattle() computation):
 *   base  = enemyMaxHp / 2
 *   bonus = base × (comboMultiplier − 1)  if a valid combo was fired
 *   total = max(1, base + bonus)
 */
export function applyVictoryRewards(): void {
  const st = useBattleStore.getState();
  if (st.rewardedXp > 0) return;

  const baseXp = Math.round(st.enemyMaxHp / 2);
  const comboBonus = st.comboResult?.valid
    ? Math.round(baseXp * (st.comboResult.multiplier - 1))
    : 0;
  const totalXp = Math.max(1, baseXp + comboBonus);

  const upgradedVocabIds = st.party
    .filter((k) => k.encounterCount > 0)
    .map((k) => k.vocabEntry.id);

  useBattleStore.setState({ rewardedXp: totalXp, upgradedVocabIds });
}
