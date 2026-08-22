import { useBattleStore } from "./battleStore";
import { chooseAction } from "../learning/enemyAI";
import {
  applyEnemyEffect, tickActiveEffects, tickCooldowns, withCooldown,
} from "../learning/enemyActions";
import { eventBus } from "./eventBus";

/**
 * Resolves the enemy's turn after the player's combo resolves.
 *
 * Sequence:
 * 1. Tick cooldowns from previous turn.
 * 2. Fire the action telegraphed last turn (if any).
 * 3. Tick active-effect counters (decrement turns-left).
 * 4. Choose the NEXT action to telegraph.
 * 5. Emit events for BattleScene to animate.
 * 6. Set phase to "enemy_turn" so React shows the EnemyTurnCard.
 */
export function beginEnemyTurn(): void {
  const st = useBattleStore.getState();
  const rng = () => Math.random();

  let cooldowns = tickCooldowns(st.enemyCooldowns);
  let playerHp = st.playerHp;
  let effects = st.activeEffects;
  let lastActionId = st.lastEnemyActionId;

  if (st.pendingEnemyAction) {
    const res = applyEnemyEffect(
      st.pendingEnemyAction,
      { playerHp, playerMaxHp: st.playerMaxHp, partySize: st.party.length, activeEffects: effects },
      rng,
    );
    playerHp = res.playerHp;
    effects = res.effects;
    cooldowns = withCooldown(cooldowns, st.pendingEnemyAction);
    lastActionId = st.pendingEnemyAction.id;
    eventBus.emit("battle:enemy_action", { actionId: st.pendingEnemyAction.id });
  }

  effects = tickActiveEffects(effects);

  const nextAction = chooseAction(
    { hp: st.enemyHp, maxHp: st.enemyMaxHp },
    { cooldowns, lastActionId, playerHp, playerMaxHp: st.playerMaxHp },
    rng,
  );

  if (nextAction) {
    eventBus.emit("battle:enemy_telegraph", { actionId: nextAction.id, telegraphKey: nextAction.telegraphKey });
  }

  // Drain can bring HP to the 25% floor — check for defeat
  if (playerHp <= 0) {
    useBattleStore.setState({ playerHp: 0, phase: "defeat", activeEffects: effects, enemyCooldowns: cooldowns, lastEnemyActionId: lastActionId });
    return;
  }

  useBattleStore.setState({
    phase: "enemy_turn",
    playerHp,
    activeEffects: effects,
    enemyCooldowns: cooldowns,
    pendingEnemyAction: nextAction,
    telegraphedAction: nextAction,
    lastEnemyActionId: lastActionId,
  });
}

/** Advances from enemy_turn phase to the next player command phase. */
export function advanceFromEnemyTurn(): void {
  const st = useBattleStore.getState();
  useBattleStore.setState({
    phase: "command",
    lastResult: null,
    comboResult: null,
    chain: [],
    party: st.party.map((k) => ({ ...k, sentThisTurn: false })),
  });
}
