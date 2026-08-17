import { describe, it, expect } from "vitest";
import {
  drawFortune, drawOmikuji, canDraw, fortuneQuest,
  FORTUNE_BUFF, BUFF_LABEL, QUEST_LABEL, FORTUNE_LABEL, FORTUNE_POEM,
  type OmikujiFortune, type DailyBuff, type DailyQuestId,
} from "./omikuji";

const FORTUNES: OmikujiFortune[] = ["大吉", "中吉", "小吉", "末吉", "凶"];
const BUFFS: DailyBuff[] = ["xp_boost", "easy_questions", "extra_encounter", "rare_spawn", "bonus_xp"];
const QUESTS: DailyQuestId[] = ["catch_3", "correct_10", "combo_3", "win_2", "bloom_find"];
const now = new Date("2026-08-16T10:00:00Z").getTime();

describe("drawFortune", () => {
  it("always returns one of the 5 valid fortunes", () => {
    for (let i = 0; i < 50; i++) {
      expect(FORTUNES).toContain(drawFortune());
    }
  });

  it("deterministic with a fixed rng — rng=0 → 大吉 (first weight bucket)", () => {
    // rng returns 0 → n = 0 → immediately falls into 大吉 bucket (weight 17)
    expect(drawFortune(() => 0)).toBe("大吉");
  });

  it("rng near 1 → 凶 (last weight bucket)", () => {
    // Total weight = 100. rng=0.999 → n≈99.9 → exhausts all buckets → 凶
    expect(drawFortune(() => 0.9999)).toBe("凶");
  });

  it("all 5 fortunes can occur over 500 draws", () => {
    const seen = new Set<OmikujiFortune>();
    for (let i = 0; i < 500; i++) seen.add(drawFortune());
    expect(seen.size).toBe(5);
  });
});

describe("FORTUNE_BUFF", () => {
  it("every fortune maps to a valid buff", () => {
    for (const f of FORTUNES) {
      expect(BUFFS).toContain(FORTUNE_BUFF[f]);
    }
  });

  it("凶 maps to bonus_xp (never a penalty — always gentle)", () => {
    expect(FORTUNE_BUFF["凶"]).toBe("bonus_xp");
  });

  it("大吉 maps to xp_boost", () => {
    expect(FORTUNE_BUFF["大吉"]).toBe("xp_boost");
  });
});

describe("fortuneQuest", () => {
  it("returns a valid quest for every fortune × parity combo", () => {
    for (const f of FORTUNES) {
      expect(QUESTS).toContain(fortuneQuest(f, 0));
      expect(QUESTS).toContain(fortuneQuest(f, 1));
    }
  });

  it("alternates between two quests with day index parity", () => {
    const q0 = fortuneQuest("大吉", 0);
    const q1 = fortuneQuest("大吉", 1);
    const q2 = fortuneQuest("大吉", 2);
    expect(q0).toBe(q2); // same parity
    expect(q0).not.toBe(q1);
  });
});

describe("canDraw", () => {
  it("true when never drawn (undefined)", () => {
    expect(canDraw(undefined, now)).toBe(true);
  });

  it("true when last drawn on a different day", () => {
    expect(canDraw("2026-08-15", now)).toBe(true);
  });

  it("false when already drawn today", () => {
    expect(canDraw("2026-08-16", now)).toBe(false);
  });
});

describe("drawOmikuji", () => {
  it("returns a complete, valid result", () => {
    const r = drawOmikuji(now);
    expect(FORTUNES).toContain(r.fortune);
    expect(BUFFS).toContain(r.buff);
    expect(QUESTS).toContain(r.questId);
    expect(r.drawnAt).toBe("2026-08-16");
  });

  it("buff matches FORTUNE_BUFF mapping", () => {
    const r = drawOmikuji(now, () => 0); // forced 大吉
    expect(r.fortune).toBe("大吉");
    expect(r.buff).toBe("xp_boost");
  });
});

describe("label completeness", () => {
  it("every fortune has a label and poem", () => {
    for (const f of FORTUNES) {
      expect(FORTUNE_LABEL[f]).toBeTruthy();
      expect(FORTUNE_POEM[f]).toBeTruthy();
    }
  });

  it("every buff has a label", () => {
    for (const b of BUFFS) expect(BUFF_LABEL[b]).toBeTruthy();
  });

  it("every quest has a label", () => {
    for (const q of QUESTS) expect(QUEST_LABEL[q]).toBeTruthy();
  });
});
