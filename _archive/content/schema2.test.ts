import { describe, it, expect } from "vitest";
import { parseVocabFile } from "./schema";
import n5_03 from "./ja/vocab_n5_03.json";
import n5_04a from "./ja/vocab_n5_04a.json";
import n5_04b from "./ja/vocab_n5_04b.json";
const n5_04 = [...n5_04a, ...n5_04b];
import n5_05 from "./ja/vocab_n5_05.json";
import particles from "./ja/vocab_particles.json";
import keigo from "./ja/vocab_keigo.json";
import counter from "./ja/vocab_counter.json";
import n5_06 from "./ja/vocab_n5_06.json";
import n5_07 from "./ja/vocab_n5_07.json";
import n5_08 from "./ja/vocab_n5_08.json";

describe("vocab_n5_03 food content", () => {
  it("validates all 9 food entries", () => {
    const entries = parseVocabFile(n5_03 as unknown, "ja/vocab_n5_03.json");
    expect(entries).toHaveLength(9);
  });

  it("all entries are noun (bloom) with lang=ja", () => {
    const entries = parseVocabFile(n5_03 as unknown, "ja/vocab_n5_03.json");
    for (const e of entries) {
      expect(e.lang).toBe("ja");
      expect(e.pos).toBe("noun");
      expect(e.element).toBe("bloom");
    }
  });

  it("includes ごはん 水 お茶", () => {
    const entries = parseVocabFile(n5_03 as unknown, "ja/vocab_n5_03.json");
    const written = entries.map((e) => e.written);
    expect(written).toContain("ごはん");
    expect(written).toContain("水");
    expect(written).toContain("お茶");
  });
});

describe("vocab_n5_04 verb content", () => {
  it("validates all 9 verb entries across 04a + 04b", () => {
    const entries = parseVocabFile(n5_04 as unknown, "ja/vocab_n5_04.json");
    expect(entries).toHaveLength(9);
  });

  it("all entries are verb (spark) with lang=ja", () => {
    const entries = parseVocabFile(n5_04 as unknown, "ja/vocab_n5_04.json");
    for (const e of entries) {
      expect(e.lang).toBe("ja");
      expect(e.pos).toBe("verb");
      expect(e.element).toBe("spark");
    }
  });

  it("includes both ichidan and godan verbs", () => {
    const entries = parseVocabFile(n5_04 as unknown, "ja/vocab_n5_04.json");
    const ichidan = entries.filter((e) => e.conjugationGroup === "ichidan");
    const godan   = entries.filter((e) => e.conjugationGroup === "godan");
    expect(ichidan.length).toBeGreaterThanOrEqual(2);
    expect(godan.length).toBeGreaterThanOrEqual(4);
  });

  it("includes key verbs 食べる 飲む 行く 見る", () => {
    const entries = parseVocabFile(n5_04 as unknown, "ja/vocab_n5_04.json");
    const written = entries.map((e) => e.written);
    ["食べる", "飲む", "行く", "見る"].forEach((v) => expect(written).toContain(v));
  });
});

describe("vocab_counter content", () => {
  it("validates all 8 counter entries", () => {
    const entries = parseVocabFile(counter as unknown, "ja/vocab_counter.json");
    expect(entries).toHaveLength(8);
  });

  it("all entries are counter (stone) with lang=ja", () => {
    const entries = parseVocabFile(counter as unknown, "ja/vocab_counter.json");
    for (const e of entries) {
      expect(e.lang).toBe("ja");
      expect(e.pos).toBe("counter");
      expect(e.element).toBe("stone");
    }
  });

  it("all entries are tagged counter", () => {
    const entries = parseVocabFile(counter as unknown, "ja/vocab_counter.json");
    for (const e of entries) expect(e.tags).toContain("counter");
  });

  it("includes 匹 枚 本 人", () => {
    const entries = parseVocabFile(counter as unknown, "ja/vocab_counter.json");
    const written = entries.map((e) => e.written);
    ["匹", "枚", "本", "人"].forEach((c) => expect(written).toContain(c));
  });
});

describe("vocab_n5_05 adjective content", () => {
  it("validates all 9 adjective entries", () => {
    const entries = parseVocabFile(n5_05 as unknown, "ja/vocab_n5_05.json");
    expect(entries).toHaveLength(9);
  });

  it("all entries are adjective (flow) with lang=ja", () => {
    const entries = parseVocabFile(n5_05 as unknown, "ja/vocab_n5_05.json");
    for (const e of entries) {
      expect(e.lang).toBe("ja");
      expect(e.pos).toBe("adjective");
      expect(e.element).toBe("flow");
    }
  });

  it("includes both i-adj and na-adj entries", () => {
    const entries = parseVocabFile(n5_05 as unknown, "ja/vocab_n5_05.json");
    const iAdj = entries.filter((e) => e.tags.includes("i-adj"));
    const naAdj = entries.filter((e) => e.tags.includes("na-adj"));
    expect(iAdj.length).toBeGreaterThanOrEqual(5);
    expect(naAdj.length).toBeGreaterThanOrEqual(2);
  });
});

describe("vocab_particles content", () => {
  it("validates all 9 particle entries", () => {
    const entries = parseVocabFile(particles as unknown, "ja/vocab_particles.json");
    expect(entries).toHaveLength(9);
  });

  it("all entries are particle (echo) with lang=ja", () => {
    const entries = parseVocabFile(particles as unknown, "ja/vocab_particles.json");
    for (const e of entries) {
      expect(e.lang).toBe("ja");
      expect(e.pos).toBe("particle");
      expect(e.element).toBe("echo");
    }
  });

  it("includes the 5 core particles は が を に で", () => {
    const entries = parseVocabFile(particles as unknown, "ja/vocab_particles.json");
    const written = entries.map((e) => e.written);
    ["は", "が", "を", "に", "で"].forEach((p) => expect(written).toContain(p));
  });

  it("has no duplicate IDs", () => {
    const entries = parseVocabFile(particles as unknown, "ja/vocab_particles.json");
    const ids = entries.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("vocab_keigo content", () => {
  it("validates all 8 keigo entries", () => {
    const entries = parseVocabFile(keigo as unknown, "ja/vocab_keigo.json");
    expect(entries).toHaveLength(8);
  });

  it("all entries are tagged keigo with lang=ja", () => {
    const entries = parseVocabFile(keigo as unknown, "ja/vocab_keigo.json");
    for (const e of entries) {
      expect(e.lang).toBe("ja");
      expect(e.tags).toContain("keigo");
    }
  });

  it("includes humble and honorific forms", () => {
    const entries = parseVocabFile(keigo as unknown, "ja/vocab_keigo.json");
    const humble   = entries.filter((e) => e.tags.includes("humble"));
    const honorific = entries.filter((e) => e.tags.includes("honorific"));
    expect(humble.length).toBeGreaterThanOrEqual(3);
    expect(honorific.length).toBeGreaterThanOrEqual(2);
  });

  it("おねがいします has element=light (phrase)", () => {
    const entries = parseVocabFile(keigo as unknown, "ja/vocab_keigo.json");
    const onegai = entries.find((e) => e.written === "おねがいします");
    expect(onegai?.element).toBe("light");
    expect(onegai?.pos).toBe("phrase");
  });
});

describe("vocab_n5_06 time content", () => {
  it("validates all 9 time entries", () => {
    const entries = parseVocabFile(n5_06 as unknown, "ja/vocab_n5_06.json");
    expect(entries).toHaveLength(9);
  });

  it("all entries are noun (bloom) with lang=ja", () => {
    const entries = parseVocabFile(n5_06 as unknown, "ja/vocab_n5_06.json");
    for (const e of entries) {
      expect(e.lang).toBe("ja");
      expect(e.pos).toBe("noun");
      expect(e.element).toBe("bloom");
    }
  });

  it("includes 今日 昨日 明日 今 毎日", () => {
    const entries = parseVocabFile(n5_06 as unknown, "ja/vocab_n5_06.json");
    const written = entries.map((e) => e.written);
    ["今日", "昨日", "明日", "今", "毎日"].forEach((w) =>
      expect(written).toContain(w)
    );
  });

  it("includes 午前 and 午後 (AM/PM)", () => {
    const entries = parseVocabFile(n5_06 as unknown, "ja/vocab_n5_06.json");
    const written = entries.map((e) => e.written);
    expect(written).toContain("午前");
    expect(written).toContain("午後");
  });
});

describe("vocab_n5_07 people content", () => {
  it("validates all 9 people entries", () => {
    const entries = parseVocabFile(n5_07 as unknown, "ja/vocab_n5_07.json");
    expect(entries).toHaveLength(9);
  });

  it("all entries are noun (bloom) with lang=ja", () => {
    const entries = parseVocabFile(n5_07 as unknown, "ja/vocab_n5_07.json");
    for (const e of entries) {
      expect(e.lang).toBe("ja");
      expect(e.pos).toBe("noun");
      expect(e.element).toBe("bloom");
    }
  });

  it("includes family: お母さん お父さん お兄さん お姉さん", () => {
    const entries = parseVocabFile(n5_07 as unknown, "ja/vocab_n5_07.json");
    const written = entries.map((e) => e.written);
    ["お母さん", "お父さん", "お兄さん", "お姉さん"].forEach((w) =>
      expect(written).toContain(w)
    );
  });

  it("includes 先生 学生 友だち みんな 人", () => {
    const entries = parseVocabFile(n5_07 as unknown, "ja/vocab_n5_07.json");
    const written = entries.map((e) => e.written);
    ["先生", "学生", "友だち", "みんな", "人"].forEach((w) =>
      expect(written).toContain(w)
    );
  });
});

describe("vocab_n5_08 places content", () => {
  it("validates all 9 place entries", () => {
    const entries = parseVocabFile(n5_08 as unknown, "ja/vocab_n5_08.json");
    expect(entries).toHaveLength(9);
  });

  it("all entries are noun (bloom) with lang=ja", () => {
    const entries = parseVocabFile(n5_08 as unknown, "ja/vocab_n5_08.json");
    for (const e of entries) {
      expect(e.lang).toBe("ja");
      expect(e.pos).toBe("noun");
      expect(e.element).toBe("bloom");
    }
  });

  it("includes 学校 駅 公園 図書館", () => {
    const entries = parseVocabFile(n5_08 as unknown, "ja/vocab_n5_08.json");
    const written = entries.map((e) => e.written);
    ["学校", "駅", "公園", "図書館"].forEach((w) =>
      expect(written).toContain(w)
    );
  });

  it("includes katakana loanwords レストラン スーパー トイレ", () => {
    const entries = parseVocabFile(n5_08 as unknown, "ja/vocab_n5_08.json");
    const written = entries.map((e) => e.written);
    ["レストラン", "スーパー", "トイレ"].forEach((w) =>
      expect(written).toContain(w)
    );
  });
});
