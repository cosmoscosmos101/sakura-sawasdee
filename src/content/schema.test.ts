import { describe, it, expect } from "vitest";
import { parseVocabFile, POS_TO_ELEMENT } from "./schema";
import sample from "./ja/vocab_sample.json";
import hiragana from "./ja/vocab_hiragana.json";
import n5_02a from "./ja/vocab_n5_02a.json";
import n5_02b from "./ja/vocab_n5_02b.json";
const n5_02 = [...n5_02a, ...n5_02b];
import thConsMid from "./th/vocab_cons_mid.json";
import thConsHighLow from "./th/vocab_cons_high_low.json";
const thConsonants = [...thConsMid, ...thConsHighLow];
import kata01 from "./ja/vocab_kata_01.json";
import kata02 from "./ja/vocab_kata_02.json";
import kata03 from "./ja/vocab_kata_03.json";
import kata04 from "./ja/vocab_kata_04.json";
import kata05 from "./ja/vocab_kata_05.json";
const katakana = [...kata01, ...kata02, ...kata03, ...kata04, ...kata05];
import { ALL_VOCAB, JA_VOCAB, TH_VOCAB } from "./allVocab";

describe("vocab content", () => {
  it("validates the Japanese sample file against the schema", () => {
    const entries = parseVocabFile(sample, "ja/vocab_sample.json");
    expect(entries.length).toBeGreaterThan(0);
  });

  it("keeps element consistent with part of speech", () => {
    const entries = parseVocabFile(sample, "ja/vocab_sample.json");
    for (const entry of entries) {
      expect(entry.element).toBe(POS_TO_ELEMENT[entry.pos]);
    }
  });

  it("gives every entry at least one example sentence", () => {
    const entries = parseVocabFile(sample, "ja/vocab_sample.json");
    for (const entry of entries) {
      expect(entry.examples.length).toBeGreaterThan(0);
    }
  });

  it("throws a readable error on malformed content", () => {
    expect(() => parseVocabFile([{ id: "broken" }], "test.json")).toThrowError(
      /Invalid content in test\.json/,
    );
  });
});

describe("vocab_hiragana content", () => {
  it("validates all 7 hiragana entries", () => {
    const entries = parseVocabFile(hiragana, "ja/vocab_hiragana.json");
    expect(entries).toHaveLength(7);
  });

  it("all entries have element=stone (character pos)", () => {
    const entries = parseVocabFile(hiragana, "ja/vocab_hiragana.json");
    for (const entry of entries) {
      expect(entry.element).toBe("stone");
      expect(entry.pos).toBe("character");
    }
  });

  it("hiragana IDs spell out はなみがくえん", () => {
    const entries = parseVocabFile(hiragana, "ja/vocab_hiragana.json");
    const ids = entries.map((e) => e.id);
    expect(ids).toContain("ja_kana_ha");
    expect(ids).toContain("ja_kana_na");
    expect(ids).toContain("ja_kana_mi");
    expect(ids).toContain("ja_kana_ga");
    expect(ids).toContain("ja_kana_ku");
    expect(ids).toContain("ja_kana_e");
    expect(ids).toContain("ja_kana_n");
  });
});

describe("vocab_n5_02 content", () => {
  it("validates all 10 entries against the schema", () => {
    const entries = parseVocabFile(n5_02 as unknown, "ja/vocab_n5_02.json");
    expect(entries).toHaveLength(10);
  });

  it("includes all four seasons", () => {
    const entries = parseVocabFile(n5_02 as unknown, "ja/vocab_n5_02.json");
    const written = entries.map((e) => e.written);
    expect(written).toContain("春");
    expect(written).toContain("夏");
    expect(written).toContain("秋");
    expect(written).toContain("冬");
  });

  it("season words have element=bloom (noun)", () => {
    const entries = parseVocabFile(n5_02 as unknown, "ja/vocab_n5_02.json");
    const seasons = entries.filter((e) => ["春","夏","秋","冬"].includes(e.written));
    for (const s of seasons) expect(s.element).toBe("bloom");
  });

  it("読む has element=spark (verb)", () => {
    const entries = parseVocabFile(n5_02 as unknown, "ja/vocab_n5_02.json");
    const yomu = entries.find((e) => e.written === "読む");
    expect(yomu?.element).toBe("spark");
  });

  it("all entries have element consistent with pos", () => {
    const entries = parseVocabFile(n5_02 as unknown, "ja/vocab_n5_02.json");
    for (const entry of entries) {
      expect(entry.element).toBe(POS_TO_ELEMENT[entry.pos]);
    }
  });
});

describe("katakana content", () => {
  it("validates all 45 katakana entries across 5 files", () => {
    const entries = parseVocabFile(katakana as unknown, "ja/vocab_kata_*.json");
    expect(entries).toHaveLength(45);
  });

  it("all entries are lang=ja with element=stone and pos=character", () => {
    const entries = parseVocabFile(katakana as unknown, "ja/vocab_kata_*.json");
    for (const e of entries) {
      expect(e.lang).toBe("ja");
      expect(e.element).toBe("stone");
      expect(e.pos).toBe("character");
    }
  });

  it("all entries are tagged katakana", () => {
    const entries = parseVocabFile(katakana as unknown, "ja/vocab_kata_*.json");
    for (const e of entries) {
      expect(e.tags).toContain("katakana");
    }
  });

  it("has no duplicate IDs across all 5 files", () => {
    const entries = parseVocabFile(katakana as unknown, "ja/vocab_kata_*.json");
    const ids = entries.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("includes key katakana characters", () => {
    const entries = parseVocabFile(katakana as unknown, "ja/vocab_kata_*.json");
    const written = entries.map((e) => e.written);
    ["ア", "イ", "ウ", "エ", "オ", "カ", "シ", "ツ", "ラ", "ン"].forEach((c) =>
      expect(written).toContain(c)
    );
  });
});

describe("ALL_VOCAB merged pool", () => {
  it("contains entries from all source files", () => {
    // 47 hiragana + 34 n5 + 9 adj + 9 particles + 8 keigo + 8 counter + 9 time + 9 people + 9 places
    // + 9 transport/numbers + 9 body/health + 9 clothing/colours + 45 katakana + 13 th = 227
    expect(ALL_VOCAB.length).toBeGreaterThanOrEqual(47 + 34 + 9 + 9 + 8 + 8 + 9 + 9 + 9 + 9 + 9 + 9 + 45 + 13);
  });

  it("has no duplicate IDs", () => {
    const ids = ALL_VOCAB.map((e) => e.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("every entry has a valid element", () => {
    const valid = ["bloom","spark","flow","echo","stone","light"];
    for (const e of ALL_VOCAB) {
      expect(valid).toContain(e.element);
    }
  });
});

describe("Thai consonant content", () => {
  it("validates all 13 entries against the schema", () => {
    const entries = parseVocabFile(thConsonants as unknown, "th/vocab_consonants.json");
    expect(entries).toHaveLength(13);
  });

  it("all entries are lang=th with element=stone (character pos)", () => {
    const entries = parseVocabFile(thConsonants as unknown, "th/vocab_consonants.json");
    for (const e of entries) {
      expect(e.lang).toBe("th");
      expect(e.element).toBe("stone");
      expect(e.pos).toBe("character");
    }
  });

  it("has mid-class, high-class, and low-class consonants", () => {
    const entries = parseVocabFile(thConsonants as unknown, "th/vocab_consonants.json");
    const midClass = entries.filter((e) => e.tags.includes("mid_class"));
    const highClass = entries.filter((e) => e.tags.includes("high_class"));
    const lowClass = entries.filter((e) => e.tags.includes("low_class"));
    expect(midClass.length).toBeGreaterThanOrEqual(7);
    expect(highClass.length).toBeGreaterThanOrEqual(2);
    expect(lowClass.length).toBeGreaterThanOrEqual(4);
  });

  it("all entries have toneRule set", () => {
    const entries = parseVocabFile(thConsonants as unknown, "th/vocab_consonants.json");
    for (const e of entries) {
      expect(e.toneRule).toBeTruthy();
    }
  });
});

describe("JA_VOCAB / TH_VOCAB sub-pools", () => {
  it("JA_VOCAB contains only Japanese entries", () => {
    for (const e of JA_VOCAB) expect(e.lang).toBe("ja");
  });

  it("TH_VOCAB contains only Thai entries", () => {
    for (const e of TH_VOCAB) expect(e.lang).toBe("th");
  });

  it("JA_VOCAB + TH_VOCAB equals ALL_VOCAB length", () => {
    expect(JA_VOCAB.length + TH_VOCAB.length).toBe(ALL_VOCAB.length);
  });
});
