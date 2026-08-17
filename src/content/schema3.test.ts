import { describe, it, expect } from "vitest";
import { parseVocabFile } from "./schema";
import n5_09 from "./ja/vocab_n5_09.json";
import n5_10 from "./ja/vocab_n5_10.json";
import n5_11 from "./ja/vocab_n5_11.json";

describe("vocab_n5_09 transport/numbers content", () => {
  it("validates all 9 entries", () => {
    const entries = parseVocabFile(n5_09 as unknown, "ja/vocab_n5_09.json");
    expect(entries).toHaveLength(9);
  });

  it("all entries are noun (bloom) with lang=ja", () => {
    const entries = parseVocabFile(n5_09 as unknown, "ja/vocab_n5_09.json");
    for (const e of entries) {
      expect(e.lang).toBe("ja");
      expect(e.pos).toBe("noun");
      expect(e.element).toBe("bloom");
    }
  });

  it("includes transport words 電車 バス 自転車", () => {
    const entries = parseVocabFile(n5_09 as unknown, "ja/vocab_n5_09.json");
    const written = entries.map((e) => e.written);
    ["電車", "バス", "自転車"].forEach((w) => expect(written).toContain(w));
  });

  it("includes numbers 一 二 三 百 千 and currency 円", () => {
    const entries = parseVocabFile(n5_09 as unknown, "ja/vocab_n5_09.json");
    const written = entries.map((e) => e.written);
    ["一", "二", "三", "百", "千", "円"].forEach((w) =>
      expect(written).toContain(w)
    );
  });
});

describe("vocab_n5_10 body/health content", () => {
  it("validates all 9 entries", () => {
    const entries = parseVocabFile(n5_10 as unknown, "ja/vocab_n5_10.json");
    expect(entries).toHaveLength(9);
  });

  it("body parts are noun (bloom), health adjectives are flow", () => {
    const entries = parseVocabFile(n5_10 as unknown, "ja/vocab_n5_10.json");
    const nouns = entries.filter((e) => e.pos === "noun");
    const adjs  = entries.filter((e) => e.pos === "adjective");
    nouns.forEach((e) => expect(e.element).toBe("bloom"));
    adjs.forEach((e)  => expect(e.element).toBe("flow"));
  });

  it("includes body parts 頭 目 耳 手 足 口", () => {
    const entries = parseVocabFile(n5_10 as unknown, "ja/vocab_n5_10.json");
    const written = entries.map((e) => e.written);
    ["頭", "目", "耳", "手", "足", "口"].forEach((w) =>
      expect(written).toContain(w)
    );
  });

  it("includes health words 気分 大丈夫 痛い", () => {
    const entries = parseVocabFile(n5_10 as unknown, "ja/vocab_n5_10.json");
    const written = entries.map((e) => e.written);
    ["気分", "大丈夫", "痛い"].forEach((w) => expect(written).toContain(w));
  });
});

describe("vocab_n5_11 clothing/colour content", () => {
  it("validates all 9 entries", () => {
    const entries = parseVocabFile(n5_11 as unknown, "ja/vocab_n5_11.json");
    expect(entries).toHaveLength(9);
  });

  it("colour nouns are bloom, adjectives are flow", () => {
    const entries = parseVocabFile(n5_11 as unknown, "ja/vocab_n5_11.json");
    const nouns = entries.filter((e) => e.pos === "noun");
    const adjs  = entries.filter((e) => e.pos === "adjective");
    nouns.forEach((e) => expect(e.element).toBe("bloom"));
    adjs.forEach((e)  => expect(e.element).toBe("flow"));
  });

  it("includes colours 赤 青 白 黒 黄色 緑", () => {
    const entries = parseVocabFile(n5_11 as unknown, "ja/vocab_n5_11.json");
    const written = entries.map((e) => e.written);
    ["赤", "青", "白", "黒", "黄色", "緑"].forEach((w) =>
      expect(written).toContain(w)
    );
  });

  it("includes 服 シャツ かわいい", () => {
    const entries = parseVocabFile(n5_11 as unknown, "ja/vocab_n5_11.json");
    const written = entries.map((e) => e.written);
    ["服", "シャツ", "かわいい"].forEach((w) => expect(written).toContain(w));
  });
});
