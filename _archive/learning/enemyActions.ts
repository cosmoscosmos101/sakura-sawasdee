export type BattleEffectKind =
  | "fog_surge" | "veil" | "muffle" | "hurry"
  | "whisper"   | "reweave" | "steal" | "drain";

export interface EnemyAction {
  id: string;
  nameKey: string;
  telegraphKey: string;
  weight: number;
  cooldown: number;
  effect: { kind: BattleEffectKind };
}

export interface ActiveEffects {
  veilTurnsLeft: number;
  hurryTurnsLeft: number;
  muffleActive: boolean;
  stolenSlots: number[];
  stolenTurnsLeft: number;
  whisperedIndex: number | null;
}

export const INITIAL_EFFECTS: ActiveEffects = {
  veilTurnsLeft: 0,
  hurryTurnsLeft: 0,
  muffleActive: false,
  stolenSlots: [],
  stolenTurnsLeft: 0,
  whisperedIndex: null,
};

export const ENEMY_ACTIONS: readonly EnemyAction[] = [
  { id: "fog_surge", nameKey: "enemy.action.fog_surge.name", telegraphKey: "enemy.action.fog_surge.telegraph", weight: 15, cooldown: 2, effect: { kind: "fog_surge" } },
  { id: "veil",      nameKey: "enemy.action.veil.name",      telegraphKey: "enemy.action.veil.telegraph",      weight: 12, cooldown: 3, effect: { kind: "veil" } },
  { id: "muffle",    nameKey: "enemy.action.muffle.name",    telegraphKey: "enemy.action.muffle.telegraph",    weight: 10, cooldown: 2, effect: { kind: "muffle" } },
  { id: "hurry",     nameKey: "enemy.action.hurry.name",     telegraphKey: "enemy.action.hurry.telegraph",     weight: 12, cooldown: 3, effect: { kind: "hurry" } },
  { id: "whisper",   nameKey: "enemy.action.whisper.name",   telegraphKey: "enemy.action.whisper.telegraph",   weight:  8, cooldown: 3, effect: { kind: "whisper" } },
  { id: "reweave",   nameKey: "enemy.action.reweave.name",   telegraphKey: "enemy.action.reweave.telegraph",   weight: 10, cooldown: 2, effect: { kind: "reweave" } },
  { id: "steal",     nameKey: "enemy.action.steal.name",     telegraphKey: "enemy.action.steal.telegraph",     weight:  6, cooldown: 4, effect: { kind: "steal" } },
  { id: "drain",     nameKey: "enemy.action.drain.name",     telegraphKey: "enemy.action.drain.telegraph",     weight: 10, cooldown: 2, effect: { kind: "drain" } },
];

export interface EnemyEffectContext {
  playerHp: number;
  playerMaxHp: number;
  partySize: number;
  activeEffects: ActiveEffects;
}

export interface EnemyEffectResult {
  playerHp: number;
  effects: ActiveEffects;
  stolenIndex: number | null;
}

export function applyEnemyEffect(
  action: EnemyAction,
  ctx: EnemyEffectContext,
  rng: () => number,
): EnemyEffectResult {
  const { playerHp, playerMaxHp, partySize, activeEffects } = ctx;
  let newHp = playerHp;
  const eff: ActiveEffects = { ...activeEffects, stolenSlots: [...activeEffects.stolenSlots] };
  let stolenIndex: number | null = null;

  switch (action.effect.kind) {
    case "veil":    eff.veilTurnsLeft = 2; break;
    case "muffle":  eff.muffleActive = true; break;
    case "hurry":   eff.hurryTurnsLeft = 2; break;
    case "whisper": eff.whisperedIndex = Math.floor(rng() * partySize); break;
    case "steal": {
      const free = Array.from({ length: partySize }, (_, i) => i)
        .filter((i) => !eff.stolenSlots.includes(i));
      if (free.length > 0) {
        stolenIndex = free[Math.floor(rng() * free.length)] ?? 0;
        eff.stolenSlots.push(stolenIndex);
        eff.stolenTurnsLeft = 2;
      }
      break;
    }
    case "drain": {
      const floor = Math.ceil(playerMaxHp * 0.25);
      if (playerHp > floor)
        newHp = Math.max(floor, playerHp - Math.ceil(playerMaxHp * 0.05));
      break;
    }
    default: break; // fog_surge, reweave: visual only
  }

  return { playerHp: newHp, effects: eff, stolenIndex };
}

export function tickActiveEffects(e: ActiveEffects): ActiveEffects {
  const n: ActiveEffects = { ...e, stolenSlots: [...e.stolenSlots] };
  if (n.veilTurnsLeft > 0) n.veilTurnsLeft--;
  if (n.hurryTurnsLeft > 0) n.hurryTurnsLeft--;
  if (n.muffleActive) n.muffleActive = false;
  if (n.stolenTurnsLeft > 0) {
    n.stolenTurnsLeft--;
    if (n.stolenTurnsLeft === 0) n.stolenSlots = [];
  }
  return n;
}

export function tickCooldowns(cd: Record<string, number>): Record<string, number> {
  return Object.fromEntries(Object.entries(cd).map(([k, v]) => [k, Math.max(0, v - 1)]));
}

export function withCooldown(cd: Record<string, number>, action: EnemyAction): Record<string, number> {
  return { ...cd, [action.id]: action.cooldown };
}
