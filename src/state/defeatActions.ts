import { useBattleStore } from "./battleStore";
import { db } from "../data/db";
import { createCard, reviewCard } from "../learning/srs";
import { eventBus } from "./eventBus";

/**
 * S.3 Defeat state — fog penalty (Part A).
 *
 * Pure slice — reads/writes battleStore externally (CLAUDE.md §4).
 * Idempotent: no-ops if defeatedVocabIds already populated.
 */

export async function applyDefeatPenalty(): Promise<void> {
  const st = useBattleStore.getState();

  // Guard: only apply once per battle
  if (st.defeatedVocabIds.length > 0) return;

  const { party } = st;
  if (party.length === 0) return;

  // Fog picks 1 Kotodama — prefer ones the player encountered this battle
  const engaged = party.filter((k) => k.encounterCount > 0);
  const pool = engaged.length > 0 ? engaged : party;
  const picked = pool[Math.floor(Math.random() * pool.length)];
  if (!picked) return;

  const vocabId = picked.vocabEntry.id;

  // Degrade SRS card (Rating.Again → due tomorrow)
  const existing = await db.srsCards.get(vocabId);
  const base = existing ?? { ...createCard(vocabId), vocabId };
  const updated = reviewCard(base, "incorrect");
  await db.srsCards.put({ ...updated, vocabId });

  const affectedIds = [vocabId];
  useBattleStore.setState({ defeatedVocabIds: affectedIds });
  eventBus.emit("battle:defeat", { affectedIds });
}

export function retryBattle(): void {
  const st = useBattleStore.getState();
  const pool = st.party.map((k) => k.vocabEntry);
  st.startBattle(st.enemyId, pool, st.l1, st.bossGimmick, st.enemyMaxHp);
}
