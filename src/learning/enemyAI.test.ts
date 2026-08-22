import { describe, it, expect } from "vitest";
import { chooseAction } from "./enemyAI";
import { ENEMY_ACTIONS, withCooldown, applyEnemyEffect, tickActiveEffects, tickCooldowns, INITIAL_EFFECTS } from "./enemyActions";

// Mulberry32 seeded PRNG — deterministic across runs
function mkRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ENEMY = { hp: 30, maxHp: 30 };

function snap(over: Partial<{ cooldowns: Record<string, number>; lastActionId: string | null; playerHp: number; playerMaxHp: number }> = {}) {
  return { cooldowns: {}, lastActionId: null, playerHp: 40, playerMaxHp: 40, ...over };
}

// ── chooseAction ──────────────────────────────────────────────────────────────

describe("chooseAction — null/hesitate", () => {
  it("returns null ~15% of the time over 1000 trials", () => {
    const rng = mkRng(42);
    let nulls = 0;
    for (let i = 0; i < 1000; i++) if (chooseAction(ENEMY, snap(), rng) === null) nulls++;
    expect(nulls).toBeGreaterThan(100);
    expect(nulls).toBeLessThan(250);
  });

  it("returns null when all actions are on cooldown (even if 15% check fails)", () => {
    const cd: Record<string, number> = {};
    for (const a of ENEMY_ACTIONS) cd[a.id] = 99;
    const neverNull = () => 0.5;
    expect(chooseAction(ENEMY, snap({ cooldowns: cd }), neverNull)).toBeNull();
  });

  it("returns null when the only available action equals lastActionId", () => {
    const cd: Record<string, number> = {};
    for (const a of ENEMY_ACTIONS) if (a.id !== "fog_surge") cd[a.id] = 99;
    const neverNull = () => 0.5;
    expect(chooseAction(ENEMY, snap({ cooldowns: cd, lastActionId: "fog_surge" }), neverNull)).toBeNull();
  });
});

describe("chooseAction — cooldowns", () => {
  it("never selects an action with cooldown > 0", () => {
    const rng = mkRng(7);
    const cd = { fog_surge: 5 };
    for (let i = 0; i < 500; i++) {
      const a = chooseAction(ENEMY, snap({ cooldowns: cd }), rng);
      if (a !== null) expect(a.id).not.toBe("fog_surge");
    }
  });

  it("selects fog_surge when cooldown reaches 0", () => {
    const cd: Record<string, number> = {};
    for (const a of ENEMY_ACTIONS) if (a.id !== "fog_surge") cd[a.id] = 99;
    const rng = mkRng(200);
    let found = false;
    for (let i = 0; i < 200; i++) {
      const a = chooseAction(ENEMY, snap({ cooldowns: cd }), rng);
      if (a?.id === "fog_surge") { found = true; break; }
    }
    expect(found).toBe(true);
  });

  it("withCooldown sets the correct cooldown value on chosen action", () => {
    const action = ENEMY_ACTIONS.find((a) => a.id === "fog_surge")!;
    expect(withCooldown({}, action)["fog_surge"]).toBe(action.cooldown);
  });

  it("withCooldown preserves unrelated cooldowns", () => {
    const action = ENEMY_ACTIONS.find((a) => a.id === "fog_surge")!;
    const result = withCooldown({ veil: 2, steal: 1 }, action);
    expect(result["veil"]).toBe(2);
    expect(result["steal"]).toBe(1);
    expect(result["fog_surge"]).toBe(action.cooldown);
  });

  it("tickCooldowns decrements each value by 1 (min 0)", () => {
    const after = tickCooldowns({ fog_surge: 2, veil: 1, steal: 0 });
    expect(after["fog_surge"]).toBe(1);
    expect(after["veil"]).toBe(0);
    expect(after["steal"]).toBe(0);
  });
});

describe("chooseAction — no-repeat", () => {
  it("never selects the same action twice in a row", () => {
    const rng = mkRng(13);
    let prev: string | null = null;
    for (let i = 0; i < 500; i++) {
      const a = chooseAction(ENEMY, snap({ lastActionId: prev }), rng);
      if (a !== null && prev !== null) expect(a.id).not.toBe(prev);
      prev = a?.id ?? null;
    }
  });

  it("no-repeat applies even when cooldown on that action is 0", () => {
    const rng = mkRng(77);
    for (let i = 0; i < 300; i++) {
      const a = chooseAction(ENEMY, snap({ lastActionId: "drain" }), rng);
      if (a !== null) expect(a.id).not.toBe("drain");
    }
  });
});

describe("chooseAction — drain suppression", () => {
  it("drain never fires at exactly 25% HP", () => {
    const hp25 = Math.ceil(40 * 0.25);
    const rng = mkRng(3);
    for (let i = 0; i < 500; i++) {
      const a = chooseAction(ENEMY, snap({ playerHp: hp25, playerMaxHp: 40 }), rng);
      if (a !== null) expect(a.id).not.toBe("drain");
    }
  });

  it("drain never fires below 25% HP", () => {
    const rng = mkRng(9);
    for (let i = 0; i < 500; i++) {
      const a = chooseAction(ENEMY, snap({ playerHp: 5, playerMaxHp: 40 }), rng);
      if (a !== null) expect(a.id).not.toBe("drain");
    }
  });

  it("drain can fire when HP is just above 25%", () => {
    const cd: Record<string, number> = {};
    for (const a of ENEMY_ACTIONS) if (a.id !== "drain") cd[a.id] = 99;
    const rng = mkRng(50);
    let found = false;
    for (let i = 0; i < 200; i++) {
      const a = chooseAction(ENEMY, snap({ cooldowns: cd, playerHp: 11, playerMaxHp: 40 }), rng);
      if (a?.id === "drain") { found = true; break; }
    }
    expect(found).toBe(true);
  });
});

describe("chooseAction — determinism & coverage", () => {
  it("is fully deterministic under the same seed", () => {
    const r1 = mkRng(100); const r2 = mkRng(100);
    const seq1: Array<string | null> = [];
    const seq2: Array<string | null> = [];
    for (let i = 0; i < 30; i++) {
      seq1.push(chooseAction(ENEMY, snap(), r1)?.id ?? null);
      seq2.push(chooseAction(ENEMY, snap(), r2)?.id ?? null);
    }
    expect(seq1).toEqual(seq2);
  });

  it("selects all 8 actions over enough trials", () => {
    const rng = mkRng(42);
    const seen = new Set<string>();
    for (let i = 0; i < 3000; i++) {
      const a = chooseAction(ENEMY, snap(), rng);
      if (a) seen.add(a.id);
    }
    expect(seen.size).toBe(8);
  });

  it("higher-weight actions are selected more often than lower-weight ones", () => {
    const rng = mkRng(42);
    const counts: Record<string, number> = {};
    for (let i = 0; i < 5000; i++) {
      const a = chooseAction(ENEMY, snap(), rng);
      if (a) counts[a.id] = (counts[a.id] ?? 0) + 1;
    }
    expect(counts["fog_surge"] ?? 0).toBeGreaterThan(counts["steal"] ?? 0);
  });
});

// ── applyEnemyEffect ──────────────────────────────────────────────────────────

describe("applyEnemyEffect", () => {
  const ctx = { playerHp: 40, playerMaxHp: 40, partySize: 4, activeEffects: INITIAL_EFFECTS };

  it("veil sets veilTurnsLeft = 2", () => {
    const action = ENEMY_ACTIONS.find((a) => a.id === "veil")!;
    const { effects } = applyEnemyEffect(action, ctx, mkRng(1));
    expect(effects.veilTurnsLeft).toBe(2);
  });

  it("muffle sets muffleActive = true", () => {
    const action = ENEMY_ACTIONS.find((a) => a.id === "muffle")!;
    const { effects } = applyEnemyEffect(action, ctx, mkRng(1));
    expect(effects.muffleActive).toBe(true);
  });

  it("hurry sets hurryTurnsLeft = 2", () => {
    const action = ENEMY_ACTIONS.find((a) => a.id === "hurry")!;
    const { effects } = applyEnemyEffect(action, ctx, mkRng(1));
    expect(effects.hurryTurnsLeft).toBe(2);
  });

  it("drain reduces HP by 5% but never below 25% floor", () => {
    const action = ENEMY_ACTIONS.find((a) => a.id === "drain")!;
    const { playerHp } = applyEnemyEffect(action, ctx, mkRng(1));
    const floor = Math.ceil(40 * 0.25);
    expect(playerHp).toBeLessThan(40);
    expect(playerHp).toBeGreaterThanOrEqual(floor);
  });

  it("drain does not fire when HP is already at the floor", () => {
    const action = ENEMY_ACTIONS.find((a) => a.id === "drain")!;
    const floor = Math.ceil(40 * 0.25);
    const lowCtx = { ...ctx, playerHp: floor };
    const { playerHp } = applyEnemyEffect(action, lowCtx, mkRng(1));
    expect(playerHp).toBe(floor);
  });

  it("whisper picks a valid party index", () => {
    const action = ENEMY_ACTIONS.find((a) => a.id === "whisper")!;
    const { effects } = applyEnemyEffect(action, ctx, mkRng(5));
    expect(effects.whisperedIndex).not.toBeNull();
    expect(effects.whisperedIndex!).toBeGreaterThanOrEqual(0);
    expect(effects.whisperedIndex!).toBeLessThan(ctx.partySize);
  });

  it("steal adds a slot to stolenSlots and sets stolenTurnsLeft = 2", () => {
    const action = ENEMY_ACTIONS.find((a) => a.id === "steal")!;
    const { effects, stolenIndex } = applyEnemyEffect(action, ctx, mkRng(2));
    expect(stolenIndex).not.toBeNull();
    expect(effects.stolenSlots).toContain(stolenIndex);
    expect(effects.stolenTurnsLeft).toBe(2);
  });

  it("fog_surge and reweave do not change HP or effects", () => {
    for (const id of ["fog_surge", "reweave"] as const) {
      const action = ENEMY_ACTIONS.find((a) => a.id === id)!;
      const { playerHp, effects } = applyEnemyEffect(action, ctx, mkRng(1));
      expect(playerHp).toBe(40);
      expect(effects).toEqual(INITIAL_EFFECTS);
    }
  });

  it("effects are NOT written to FSRS (applyEnemyEffect returns no card data)", () => {
    const action = ENEMY_ACTIONS.find((a) => a.id === "whisper")!;
    const result = applyEnemyEffect(action, ctx, mkRng(1));
    expect(Object.keys(result)).toEqual(["playerHp", "effects", "stolenIndex"]);
  });
});

// ── tickActiveEffects ─────────────────────────────────────────────────────────

describe("tickActiveEffects", () => {
  it("decrements veilTurnsLeft and hurryTurnsLeft by 1", () => {
    const e = { ...INITIAL_EFFECTS, veilTurnsLeft: 2, hurryTurnsLeft: 1 };
    const n = tickActiveEffects(e);
    expect(n.veilTurnsLeft).toBe(1);
    expect(n.hurryTurnsLeft).toBe(0);
  });

  it("clears muffle after one tick", () => {
    const e = { ...INITIAL_EFFECTS, muffleActive: true };
    expect(tickActiveEffects(e).muffleActive).toBe(false);
  });

  it("clears stolenSlots when stolenTurnsLeft reaches 0", () => {
    const e = { ...INITIAL_EFFECTS, stolenSlots: [1, 2], stolenTurnsLeft: 1 };
    const n = tickActiveEffects(e);
    expect(n.stolenSlots).toHaveLength(0);
    expect(n.stolenTurnsLeft).toBe(0);
  });

  it("does not mutate the original effects object", () => {
    const e = { ...INITIAL_EFFECTS, veilTurnsLeft: 2 };
    tickActiveEffects(e);
    expect(e.veilTurnsLeft).toBe(2);
  });
});
