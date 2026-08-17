import type { BossGimmick } from "../../state/battleStore";

export interface BossDef {
  id: string;
  displayName: string;
  maxHp: number;
  gimmick: BossGimmick;
  mapKey: string;
  col: number;
  row: number;
}

/** Boss encounters defined per map. Bosses replace normal Kotodama spots. */
const BOSS_DEFS: BossDef[] = [
  {
    id: "katakana_ghost",
    displayName: "カタカナゴースト",
    maxHp: 50,
    gimmick: "katakana_only",
    mapKey: "hanami_academy",
    col: 6,
    row: 7,
  },
  {
    id: "counter_golem",
    displayName: "数え魔",
    maxHp: 60,
    gimmick: "counter_only",
    mapKey: "shopping_street",
    col: 12,
    row: 6,
  },
  {
    id: "keigo_kaiju",
    displayName: "敬語怪獣",
    maxHp: 70,
    gimmick: "keigo_only",
    mapKey: "hanami_academy",
    col: 15,
    row: 8,
  },
];

export class BossSystem {
  private defs: BossDef[];

  constructor(mapKey: string) {
    this.defs = BOSS_DEFS.filter((b) => b.mapKey === mapKey);
  }

  /** Returns the BossDef if the player is standing on a boss tile, else null. */
  checkEncounter(col: number, row: number): BossDef | null {
    return this.defs.find((b) => b.col === col && b.row === row) ?? null;
  }

  destroy(): void {
    // Stateless — nothing to clean up.
  }
}
