import type { EnemyAction } from "./enemyActions";
import { ENEMY_ACTIONS } from "./enemyActions";

export interface EnemySnapshot {
  hp: number;
  maxHp: number;
}

export interface BattleSnapshot {
  cooldowns: Record<string, number>;
  lastActionId: string | null;
  playerHp: number;
  playerMaxHp: number;
}

/**
 * Chooses the enemy's next action (or null if it hesitates).
 * Pure function: accepts an injected rng so tests can be deterministic.
 *
 * Rules:
 * - 15% chance of null ("hesitates") so pacing breathes
 * - Never same action twice in a row
 * - Respects per-action cooldowns
 * - drain self-suppresses at or below 25% player HP
 */
export function chooseAction(
  enemy: EnemySnapshot,
  battle: BattleSnapshot,
  rng: () => number,
): EnemyAction | null {
  void enemy; // reserved for future HP-adaptive selection
  if (rng() < 0.15) return null;

  const drainFloor = Math.ceil(battle.playerMaxHp * 0.25);

  const available = ENEMY_ACTIONS.filter((a) => {
    if ((battle.cooldowns[a.id] ?? 0) > 0) return false;
    if (a.id === battle.lastActionId) return false;
    if (a.effect.kind === "drain" && battle.playerHp <= drainFloor) return false;
    return true;
  });

  if (available.length === 0) return null;

  const totalWeight = available.reduce((s, a) => s + a.weight, 0);
  let roll = rng() * totalWeight;
  for (const action of available) {
    roll -= action.weight;
    if (roll <= 0) return action;
  }
  return available.at(-1) ?? null;
}
