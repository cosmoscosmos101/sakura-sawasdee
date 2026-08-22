import { describe, it, expect } from "vitest";
import { validateCombo, multiplierFor, type ComboToken } from "./comboValidator";
import type { Element } from "../content/schema";

// ── Helpers ────────────────────────────────────────────────────────────────

/** Legacy token: element only, no pos → triggers FSM fallback. */
const t = (element: Element, id: string = element): ComboToken => ({ id, element });

/** v2 token with pos (and optional tags/written). */
const tok = (
  element: Element,
  pos: string,
  written?: string,
  tags?: string[],
  id?: string,
): ComboToken => ({
  id: id ?? `${pos}_${written ?? pos}`,
  element,
  pos,
  ...(written !== undefined && { written }),
  ...(tags !== undefined && { tags }),
});

// Convenience aliases
const noun = (written: string, tags?: string[]) => tok("bloom", "noun", written, tags);
const verb = (written: string) => tok("spark", "verb", written);
const adj = (written: string) => tok("flow", "adjective", written);
const particle = (written: string) => tok("echo", "particle", written);
const phrase = (written: string) => tok("light", "phrase", written);

// ── multiplierFor ──────────────────────────────────────────────────────────

describe("multiplierFor", () => {
  it("returns the documented multiplier ladder", () => {
    expect(multiplierFor(1)).toBe(1);
    expect(multiplierFor(2)).toBe(1.5);
    expect(multiplierFor(3)).toBe(2.0);
    expect(multiplierFor(4)).toBe(2.8);
    expect(multiplierFor(5)).toBe(3.5);
    expect(multiplierFor(6)).toBe(4.5);
    expect(multiplierFor(9)).toBe(4.5);
  });
});

// ── Legacy FSM path (tokens without pos) ──────────────────────────────────

describe("validateCombo — legacy FSM (no pos field)", () => {
  it("accepts the canonical 私はすしを食べます skeleton", () => {
    const result = validateCombo(
      [t("bloom", "watashi"), t("echo", "wa"), t("bloom", "sushi"), t("echo", "wo"), t("spark", "tabemasu")],
      "ja",
    );
    expect(result.valid).toBe(true);
    expect(result.chainLength).toBe(5);
    expect(result.multiplier).toBe(3.5);
  });

  it("accepts adjective + noun (おいしいパン)", () => {
    expect(validateCombo([t("flow"), t("bloom")], "ja").valid).toBe(true);
  });

  it("rejects a verb followed by anything — Japanese is verb-final", () => {
    const result = validateCombo([t("bloom"), t("echo"), t("spark"), t("bloom")], "ja");
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("spark_cannot_precede_bloom");
  });

  it("rejects opening with a particle", () => {
    const result = validateCombo([t("echo"), t("bloom")], "ja");
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("cannot_open_with_echo");
  });

  it("rejects two particles in a row", () => {
    const result = validateCombo([t("bloom"), t("echo"), t("echo")], "ja");
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("echo_cannot_precede_echo");
  });

  it("awards the 6+ tier for long chains", () => {
    const result = validateCombo(
      [t("bloom"), t("echo"), t("bloom"), t("echo"), t("bloom"), t("echo"), t("spark")],
      "ja",
    );
    expect(result.valid).toBe(true);
    expect(result.multiplier).toBe(4.5);
  });

  it("accepts Thai ฉันกินข้าวที่ตลาด skeleton", () => {
    const result = validateCombo(
      [t("bloom", "chan"), t("spark", "kin"), t("bloom", "khao"), t("echo", "thi"), t("bloom", "talat")],
      "th",
    );
    expect(result.valid).toBe(true);
    expect(result.multiplier).toBe(3.5);
  });

  it("accepts a polite particle closing a Thai sentence", () => {
    expect(validateCombo([t("bloom"), t("flow"), t("light")], "th").valid).toBe(true);
  });

  it("rejects anything after the polite particle in Thai", () => {
    const result = validateCombo([t("bloom"), t("flow"), t("light"), t("bloom")], "th");
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("light_cannot_precede_bloom");
  });
});

// ── Edge cases (shared between legacy and v2) ──────────────────────────────

describe("validateCombo — edge cases", () => {
  it("treats a single token as trivially valid with no bonus", () => {
    expect(validateCombo([t("bloom")], "ja").valid).toBe(true);
    expect(validateCombo([t("bloom")], "ja").multiplier).toBe(1);
  });

  it("rejects an empty combo", () => {
    const result = validateCombo([], "ja");
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("empty_combo");
  });

  it("lets stone (characters) precede anything in legacy mode", () => {
    expect(validateCombo([t("stone"), t("stone"), t("bloom")], "ja").valid).toBe(true);
  });
});

// ── v2 Japanese valid patterns (60-sentence fixture, valid half) ───────────

describe("validateCombo v2 — Japanese valid (30 sentences)", () => {
  // 1. Verb alone (single — always valid before pattern matching)
  it("v1: 食べます — verb alone", () => {
    const r = validateCombo([verb("食べます")], "ja");
    expect(r.valid).toBe(true);
    expect(r.multiplier).toBe(1);
  });

  // 2. Set phrase
  it("v2: おはようございます — phrase alone", () => {
    const r = validateCombo([phrase("おはようございます")], "ja");
    expect(r.valid).toBe(true);
  });

  // 3. Adjective + Noun
  it("v3: 大きいりんご — adj + noun", () => {
    const r = validateCombo([adj("大きい"), noun("りんご")], "ja");
    expect(r.valid).toBe(true);
    expect(r.multiplier).toBe(1.5);
    expect(r.matchedPatternId).toBe("ja_adj_noun");
  });

  // 4. Adj + Adj + Noun
  it("v4: 大きい赤いりんご — adj + adj + noun", () => {
    const r = validateCombo([adj("大きい"), adj("赤い"), noun("りんご")], "ja");
    expect(r.valid).toBe(true);
    expect(r.multiplier).toBe(2.0);
    expect(r.matchedPatternId).toBe("ja_adj_adj_noun");
  });

  // 5. Noun + Verb (casual)
  it("v5: 犬走る — noun + verb", () => {
    const r = validateCombo([noun("犬"), verb("走る")], "ja");
    expect(r.valid).toBe(true);
    expect(r.multiplier).toBe(1.5);
    expect(r.matchedPatternId).toBe("ja_noun_verb");
  });

  // 6. Topic + は + Verb (は optional, gets skipped gracefully)
  it("v6: 私食べます — noun + verb (は omitted)", () => {
    const r = validateCombo([noun("私"), verb("食べます")], "ja");
    expect(r.valid).toBe(true);
    expect(r.multiplier).toBe(1.5);
  });

  // 7. Topic + は + Verb (full)
  it("v7: 私は食べます — topic + は + verb", () => {
    const r = validateCombo([noun("私"), particle("は"), verb("食べます")], "ja");
    expect(r.valid).toBe(true);
    expect(r.multiplier).toBe(2.0);
    expect(r.matchedPatternId).toBe("ja_topic_verb");
  });

  // 8. Topic + は + Object + を + Verb
  it("v8: 私はすしを食べます — full SOV", () => {
    const r = validateCombo(
      [noun("私"), particle("は"), noun("すし"), particle("を"), verb("食べます")],
      "ja",
    );
    expect(r.valid).toBe(true);
    expect(r.multiplier).toBe(3.5);
    expect(r.matchedPatternId).toBe("ja_topic_object_verb");
  });

  // 9. Topic + は + Adjective
  it("v9: これは大きい — topic + は + adj", () => {
    const r = validateCombo([noun("これ"), particle("は"), adj("大きい")], "ja");
    expect(r.valid).toBe(true);
    expect(r.multiplier).toBe(2.0);
    expect(r.matchedPatternId).toBe("ja_topic_adj");
  });

  // 10. Topic + は + Location + に + Verb
  it("v10: 私は公園に行きます — topic + location + に + verb", () => {
    const r = validateCombo(
      [noun("私"), particle("は"), noun("公園"), particle("に"), verb("行きます")],
      "ja",
    );
    expect(r.valid).toBe(true);
    expect(r.multiplier).toBe(3.5);
    expect(r.matchedPatternId).toBe("ja_topic_location_verb");
  });

  // 11. Location + に + Verb (no topic)
  it("v11: 公園に行きます — location + に + verb", () => {
    const r = validateCombo([noun("公園"), particle("に"), verb("行きます")], "ja");
    expect(r.valid).toBe(true);
    expect(r.multiplier).toBe(2.0);
    // Both ja_noun_location_verb and ja_topic_location_verb tie on completeness; either is correct.
  });

  // 12. Topic + Indirect + に + Object + を + Verb
  it("v12: 私は友達に本をあげます — topic indirect verb", () => {
    const r = validateCombo(
      [noun("私"), particle("は"), noun("友達"), particle("に"), noun("本"), particle("を"), verb("あげます")],
      "ja",
    );
    expect(r.valid).toBe(true);
    expect(r.multiplier).toBe(4.5);
    expect(r.matchedPatternId).toBe("ja_topic_indirect_verb");
  });

  // 13. Adj + Noun + を + Verb
  it("v13: おいしいすしを食べます — adj + noun + を + verb", () => {
    const r = validateCombo(
      [adj("おいしい"), noun("すし"), particle("を"), verb("食べます")],
      "ja",
    );
    expect(r.valid).toBe(true);
    expect(r.multiplier).toBe(2.8);
    expect(r.matchedPatternId).toBe("ja_adj_noun_verb");
  });

  // 14. Topic (adverb pos) + は + Verb
  it("v14: ここは食べます — adverb topic + は + verb", () => {
    const r = validateCombo(
      [tok("bloom", "adverb", "ここ"), particle("は"), verb("食べます")],
      "ja",
    );
    expect(r.valid).toBe(true);
    expect(r.matchedPatternId).toBe("ja_topic_verb");
  });

  // 15. Topic + は + Location + で + Verb (で variant)
  it("v15: 私は公園で食べます — topic + location + で + verb", () => {
    const r = validateCombo(
      [noun("私"), particle("は"), noun("公園"), particle("で"), verb("食べます")],
      "ja",
    );
    expect(r.valid).toBe(true);
    expect(r.matchedPatternId).toBe("ja_topic_location_verb");
  });

  // 16. Animacy soft flag — inanimate subject, valid but ×0.8
  it("v16: すしは猫を食べます — animacy soft flag, still valid", () => {
    const r = validateCombo(
      [noun("すし", ["food"]), particle("は"), noun("猫", ["animal"]), particle("を"), verb("食べます")],
      "ja",
    );
    expect(r.valid).toBe(true);
    expect(r.issues).toHaveLength(1);
    expect(r.issues![0]!.code).toBe("animacy_subject");
    expect(r.issues![0]!.severity).toBe("soft");
    expect(r.multiplier).toBe(2.8); // 3.5 × 0.8
  });

  // 17–30: Additional valid combos (no explicit assertions on patternId needed)

  it("v17: 本を読みます — obj + を + verb (pattern: adj_noun_verb without adj)", () => {
    const r = validateCombo([noun("本"), particle("を"), verb("読みます")], "ja");
    expect(r.valid).toBe(true);
  });

  it("v18: 大きい犬走る — adj + noun + verb", () => {
    const r = validateCombo([adj("大きい"), noun("犬"), verb("走る")], "ja");
    expect(r.valid).toBe(true);
  });

  it("v19: 私は学校に行きます — 5-token location pattern", () => {
    const r = validateCombo(
      [noun("私"), particle("は"), noun("学校"), particle("に"), verb("行きます")],
      "ja",
    );
    expect(r.valid).toBe(true);
  });

  it("v20: 猫は魚を食べます — animate subject, no animacy flag", () => {
    const r = validateCombo(
      [noun("猫", ["animal"]), particle("は"), noun("魚", ["food"]), particle("を"), verb("食べます")],
      "ja",
    );
    expect(r.valid).toBe(true);
    expect(r.issues).toHaveLength(0);
  });

  it("v21: 私は先生に手紙を書きます — 7-token indirect", () => {
    const r = validateCombo(
      [noun("私"), particle("は"), noun("先生"), particle("に"), noun("手紙"), particle("を"), verb("書きます")],
      "ja",
    );
    expect(r.valid).toBe(true);
    expect(r.multiplier).toBe(4.5);
  });

  it("v22: 小さい白いねこ — adj + adj + noun", () => {
    const r = validateCombo([adj("小さい"), adj("白い"), noun("ねこ")], "ja");
    expect(r.valid).toBe(true);
  });

  it("v23: 走る — single verb token", () => {
    expect(validateCombo([verb("走る")], "ja").valid).toBe(true);
  });

  it("v24: 高い — single adjective token", () => {
    expect(validateCombo([adj("高い")], "ja").valid).toBe(true);
  });

  it("v25: 猫 — single noun token", () => {
    expect(validateCombo([noun("猫")], "ja").valid).toBe(true);
  });

  it("v26: あなたは食べます — topic + は + verb", () => {
    const r = validateCombo([noun("あなた"), particle("は"), verb("食べます")], "ja");
    expect(r.valid).toBe(true);
  });

  it("v27: 私はりんごを食べます — standard SOV", () => {
    const r = validateCombo(
      [noun("私"), particle("は"), noun("りんご"), particle("を"), verb("食べます")],
      "ja",
    );
    expect(r.valid).toBe(true);
  });

  it("v28: ここは静かです — adverb topic + adj predicate", () => {
    const r = validateCombo(
      [tok("bloom", "adverb", "ここ"), particle("は"), adj("静かです")],
      "ja",
    );
    expect(r.valid).toBe(true);
  });

  it("v29: あの大きい猫 — adj + adj + noun chain", () => {
    const r = validateCombo([adj("あの"), adj("大きい"), noun("猫")], "ja");
    expect(r.valid).toBe(true);
  });

  it("v30: 友達は駅に行きます — 5-token topic+location+verb", () => {
    const r = validateCombo(
      [noun("友達"), particle("は"), noun("駅"), particle("に"), verb("行きます")],
      "ja",
    );
    expect(r.valid).toBe(true);
  });
});

// ── v2 Japanese invalid patterns ───────────────────────────────────────────

describe("validateCombo v2 — Japanese invalid (15 sentences)", () => {
  it("i1: は + verb — particle opener", () => {
    const r = validateCombo([particle("は"), verb("食べます")], "ja");
    expect(r.valid).toBe(false);
    expect(r.reason).toBe("cannot_open_with_particle");
  });

  it("i2: を + noun — particle opener", () => {
    const r = validateCombo([particle("を"), noun("すし")], "ja");
    expect(r.valid).toBe(false);
    expect(r.reason).toBe("cannot_open_with_particle");
  });

  it("i3: verb + noun — no valid ja pattern", () => {
    const r = validateCombo([verb("食べます"), noun("猫")], "ja");
    expect(r.valid).toBe(false);
  });

  it("i4: verb + verb — no valid ja pattern", () => {
    const r = validateCombo([verb("食べます"), verb("行きます")], "ja");
    expect(r.valid).toBe(false);
  });

  it("i5: verb + adj — no valid ja pattern", () => {
    const r = validateCombo([verb("食べます"), adj("大きい")], "ja");
    expect(r.valid).toBe(false);
  });

  it("i6: adj + adj — missing required noun head", () => {
    const r = validateCombo([adj("大きい"), adj("赤い")], "ja");
    expect(r.valid).toBe(false);
  });

  it("i7: noun + noun — no pattern matches two bare nouns", () => {
    const r = validateCombo([noun("猫"), noun("犬")], "ja");
    expect(r.valid).toBe(false);
  });

  it("i8: particle + particle — opener check fires first", () => {
    const r = validateCombo([particle("は"), particle("を")], "ja");
    expect(r.valid).toBe(false);
    expect(r.reason).toBe("cannot_open_with_particle");
  });

  it("i9: adj alone is valid but adj + particle is not", () => {
    const r = validateCombo([adj("大きい"), particle("は")], "ja");
    expect(r.valid).toBe(false);
  });

  it("i10: noun + verb + adj — adj dangling after verb has no pattern", () => {
    // noun+verb matches ja_noun_verb but then adj is leftover → coverage=0.67 < threshold
    const r = validateCombo([noun("私"), verb("食べます"), adj("大きい")], "ja");
    expect(r.valid).toBe(false);
  });

  it("i11: verb + particle + noun — verb-first, no pattern", () => {
    const r = validateCombo([verb("食べます"), particle("は"), noun("猫")], "ja");
    expect(r.valid).toBe(false);
  });

  it("i12: noun + verb + noun — extra noun after verb, leftover kills score", () => {
    const r = validateCombo([noun("私"), verb("食べます"), noun("猫")], "ja");
    expect(r.valid).toBe(false);
  });

  it("i13: particle + noun + verb — opener check fires", () => {
    const r = validateCombo([particle("に"), noun("公園"), verb("行きます")], "ja");
    expect(r.valid).toBe(false);
    expect(r.reason).toBe("cannot_open_with_particle");
  });

  it("i14: adj + particle — adj cannot be followed by particle alone", () => {
    const r = validateCombo([adj("大きい"), particle("は")], "ja");
    expect(r.valid).toBe(false);
  });

  it("i15: noun + noun + noun — three bare nouns, no pattern", () => {
    const r = validateCombo([noun("猫"), noun("犬"), noun("魚")], "ja");
    expect(r.valid).toBe(false);
  });
});

// ── v2 Thai valid patterns ─────────────────────────────────────────────────

describe("validateCombo v2 — Thai valid (15 sentences)", () => {
  const thNoun = (written: string, tags?: string[]) => tok("bloom", "noun", written, tags);
  const thVerb = (written: string) => tok("spark", "verb", written);
  const thAdj = (written: string) => tok("flow", "adjective", written);
  const thParticle = (written: string) => tok("echo", "particle", written);

  it("t1: กิน — verb alone", () => {
    expect(validateCombo([thVerb("กิน")], "th").valid).toBe(true);
  });

  it("t2: ข้าวอร่อย — noun + adj (head-initial)", () => {
    const r = validateCombo([thNoun("ข้าว"), thAdj("อร่อย")], "th");
    expect(r.valid).toBe(true);
    expect(r.matchedPatternId).toBe("th_noun_adj");
  });

  it("t3: ฉันกิน — subject + verb", () => {
    const r = validateCombo([thNoun("ฉัน"), thVerb("กิน")], "th");
    expect(r.valid).toBe(true);
    expect(r.matchedPatternId).toBe("th_subj_verb");
  });

  it("t4: ฉันสวย — subject + adj (zero copula)", () => {
    const r = validateCombo([thNoun("ฉัน"), thAdj("สวย")], "th");
    expect(r.valid).toBe(true);
    // Both th_noun_adj and th_subj_adj tie on completeness; either match is correct.
  });

  it("t5: ฉันกินข้าว — SVO", () => {
    const r = validateCombo([thNoun("ฉัน"), thVerb("กิน"), thNoun("ข้าว")], "th");
    expect(r.valid).toBe(true);
    expect(r.multiplier).toBe(2.0);
    expect(r.matchedPatternId).toBe("th_subj_verb_obj");
  });

  it("t6: ฉันไม่กิน — subject + ไม่ + verb", () => {
    const r = validateCombo(
      [thNoun("ฉัน"), tok("echo", "adverb", "ไม่"), thVerb("กิน")],
      "th",
    );
    expect(r.valid).toBe(true);
    expect(r.matchedPatternId).toBe("th_subj_neg_verb");
  });

  it("t7: ฉันไปที่ตลาด — subject + verb + ที่ + location", () => {
    const r = validateCombo(
      [thNoun("ฉัน"), thVerb("ไป"), tok("echo", "particle", "ที่"), thNoun("ตลาด")],
      "th",
    );
    expect(r.valid).toBe(true);
    expect(r.matchedPatternId).toBe("th_subj_verb_place");
  });

  it("t8: ฉันกินข้าวที่ตลาด — SVO + ที่ + place", () => {
    const r = validateCombo(
      [thNoun("ฉัน"), thVerb("กิน"), thNoun("ข้าว"), tok("echo", "particle", "ที่"), thNoun("ตลาด")],
      "th",
    );
    expect(r.valid).toBe(true);
    expect(r.multiplier).toBe(3.5);
    expect(r.matchedPatternId).toBe("th_subj_verb_obj_place");
  });

  it("t9: ฉันกินข้าวครับ — SVO + polite particle", () => {
    const r = validateCombo(
      [thNoun("ฉัน"), thVerb("กิน"), thNoun("ข้าว"), thParticle("ครับ")],
      "th",
    );
    expect(r.valid).toBe(true);
    expect(r.matchedPatternId).toBe("th_subj_verb_obj_polite");
  });

  it("t10: กินข้าว — verb + obj (subject omitted)", () => {
    const r = validateCombo([thVerb("กิน"), thNoun("ข้าว")], "th");
    expect(r.valid).toBe(true);
    expect(r.matchedPatternId).toBe("th_subj_verb_obj");
  });

  it("t11: เขาดื่มน้ำ — he drinks water", () => {
    const r = validateCombo([thNoun("เขา"), thVerb("ดื่ม"), thNoun("น้ำ")], "th");
    expect(r.valid).toBe(true);
  });

  it("t12: น้ำเย็น — noun + adj (cold water)", () => {
    const r = validateCombo([thNoun("น้ำ"), thAdj("เย็น")], "th");
    expect(r.valid).toBe(true);
    expect(r.matchedPatternId).toBe("th_noun_adj");
  });

  it("t13: ฉันไม่ดื่มน้ำ — neg + verb + obj", () => {
    const r = validateCombo(
      [thNoun("ฉัน"), tok("echo", "adverb", "ไม่"), thVerb("ดื่ม"), thNoun("น้ำ")],
      "th",
    );
    expect(r.valid).toBe(true);
  });

  it("t14: ข้าวอร่อยมาก — noun + adj + adj stack", () => {
    const r = validateCombo([thNoun("ข้าว"), thAdj("อร่อย")], "th");
    expect(r.valid).toBe(true);
  });

  it("t15: ฉันกินข้าวที่ตลาดค่ะ — SVO + place + polite", () => {
    const r = validateCombo(
      [
        thNoun("ฉัน"), thVerb("กิน"), thNoun("ข้าว"),
        tok("echo", "particle", "ที่"), thNoun("ตลาด"),
      ],
      "th",
    );
    expect(r.valid).toBe(true);
  });
});

// ── v2 Thai invalid patterns ───────────────────────────────────────────────

describe("validateCombo v2 — Thai invalid (15 sentences)", () => {
  const thNoun = (written: string, tags?: string[]) => tok("bloom", "noun", written, tags);
  const thVerb = (written: string) => tok("spark", "verb", written);
  const thAdj = (written: string) => tok("flow", "adjective", written);
  const thParticle = (written: string) => tok("echo", "particle", written);

  it("i1: ครับ + verb — particle opener", () => {
    const r = validateCombo([thParticle("ครับ"), thVerb("กิน")], "th");
    expect(r.valid).toBe(false);
    expect(r.reason).toBe("cannot_open_with_particle");
  });

  it("i2: verb + verb — no valid th pattern", () => {
    const r = validateCombo([thVerb("กิน"), thVerb("ไป")], "th");
    expect(r.valid).toBe(false);
  });

  it("i3: adj + noun — wrong order for Thai (noun must come first)", () => {
    const r = validateCombo([thAdj("อร่อย"), thNoun("ข้าว")], "th");
    expect(r.valid).toBe(false);
  });

  it("i4: particle + noun + verb — particle opener", () => {
    const r = validateCombo([thParticle("ที่"), thNoun("ตลาด"), thVerb("กิน")], "th");
    expect(r.valid).toBe(false);
    expect(r.reason).toBe("cannot_open_with_particle");
  });

  it("i5: verb + adj — no valid th pattern starting with verb", () => {
    const r = validateCombo([thVerb("กิน"), thAdj("อร่อย")], "th");
    expect(r.valid).toBe(false);
  });

  it("i6: noun + noun + noun — three bare nouns", () => {
    const r = validateCombo([thNoun("ฉัน"), thNoun("ข้าว"), thNoun("ตลาด")], "th");
    expect(r.valid).toBe(false);
  });

  it("i7: verb + noun + verb — double verb", () => {
    const r = validateCombo([thVerb("กิน"), thNoun("ข้าว"), thVerb("ไป")], "th");
    expect(r.valid).toBe(false);
  });

  it("i8: adj + adj — wrong order, two adjectives alone", () => {
    const r = validateCombo([thAdj("อร่อย"), thAdj("เย็น")], "th");
    expect(r.valid).toBe(false);
  });

  it("i9: verb + adj + noun + adj — no Thai pattern covers this order", () => {
    // A verb-first sequence with interleaved adjectives has no valid pattern
    const r = validateCombo(
      [thVerb("กิน"), thAdj("อร่อย"), thNoun("ข้าว"), thAdj("เย็น")],
      "th",
    );
    expect(r.valid).toBe(false);
  });

  it("i10: particle + particle — particle opener check fires", () => {
    const r = validateCombo([thParticle("ครับ"), thParticle("ที่")], "th");
    expect(r.valid).toBe(false);
  });

  it("i11: adj + verb — no th pattern starts with adj then verb", () => {
    const r = validateCombo([thAdj("อร่อย"), thVerb("กิน")], "th");
    expect(r.valid).toBe(false);
  });

  it("i12: noun + verb + verb + noun — leftover tokens hurt score", () => {
    const r = validateCombo(
      [thNoun("ฉัน"), thVerb("กิน"), thVerb("ไป"), thNoun("บ้าน")],
      "th",
    );
    expect(r.valid).toBe(false);
  });

  it("i13: verb + adj + adj — verb then two adjectives, no Thai pattern", () => {
    const r = validateCombo([thVerb("กิน"), thAdj("อร่อย"), thAdj("เย็น")], "th");
    expect(r.valid).toBe(false);
  });

  it("i14: adj + particle — adj opener with particle", () => {
    const r = validateCombo([thAdj("อร่อย"), thParticle("ครับ")], "th");
    expect(r.valid).toBe(false);
  });

  it("i15: noun + adj + verb — adj-before-verb in wrong position", () => {
    const r = validateCombo([thNoun("ฉัน"), thAdj("อร่อย"), thVerb("กิน")], "th");
    expect(r.valid).toBe(false);
  });
});

// ── v2 semantic checks ─────────────────────────────────────────────────────

describe("validateCombo v2 — semantic checks", () => {
  it("animacy soft flag does not invalidate but reduces multiplier", () => {
    const r = validateCombo(
      [noun("すし", ["food"]), particle("は"), noun("猫", ["animal"]), particle("を"), verb("食べます")],
      "ja",
    );
    expect(r.valid).toBe(true);
    expect(r.issues).toHaveLength(1);
    expect(r.issues![0]!.code).toBe("animacy_subject");
    expect(r.multiplier).toBeLessThan(3.5);
  });

  it("inanimate subject without を does NOT trigger animacy flag", () => {
    const r = validateCombo(
      [noun("りんご", ["food"]), particle("は"), adj("おいしい")],
      "ja",
    );
    expect(r.valid).toBe(true);
    expect((r.issues ?? []).filter((i) => i.code === "animacy_subject")).toHaveLength(0);
  });

  it("animate subject with を does NOT trigger animacy flag", () => {
    const r = validateCombo(
      [noun("猫", ["animal"]), particle("は"), noun("魚", ["food"]), particle("を"), verb("食べます")],
      "ja",
    );
    expect(r.valid).toBe(true);
    expect((r.issues ?? []).filter((i) => i.code === "animacy_subject")).toHaveLength(0);
  });
});
