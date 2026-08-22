import { describe, it, expect } from "vitest";
import {
  generateCloze,
  generateContextChoice,
  generateCounterWord,
  generatePolitenessRegister,
  generateToneMatch,
  generatePitchMatch,
} from "./questionGeneratorAdvanced";
import type { VocabEntry } from "../content/schema";

function makeEntry(overrides: Partial<VocabEntry> = {}): VocabEntry {
  return {
    id: "test_01",
    lang: "ja",
    written: "猫",
    reading: "ねこ",
    romanization: "neko",
    meaning: { th: "แมว", en: "cat" },
    pos: "noun",
    element: "bloom",
    level: "N5",
    chapter: 1,
    tags: ["animal"],
    frequency: 812,
    audio: "voice/ja/cat.mp3",
    examples: [
      {
        sentence: "猫が好きです。",
        reading: "ねこがすきです。",
        translation: { th: "ชอบแมวครับ", en: "I like cats." },
        context: "hanami_academy",
      },
    ],
    kotodama: {
      name: "Nekoko",
      sprite: "kotodama/nekoko.png",
      description: { en: "A sleepy kitten." },
      rarity: "common",
      habitat: ["hanami_academy"],
    },
    ...overrides,
  };
}

function makePool(count = 6): VocabEntry[] {
  return Array.from({ length: count }, (_, i) =>
    makeEntry({
      id: `pool_${i}`,
      written: `語${i}`,
      reading: `ご${i}`,
      romanization: `go${i}`,
      meaning: { th: `คำ${i}`, en: `word${i}` },
    }),
  );
}

// ── generateCloze ─────────────────────────────────────────────────────────────

describe("generateCloze", () => {
  it("produces 4 options with the correct word", () => {
    const entry = makeEntry();
    const q = generateCloze(entry, makePool(), "th");
    if (q.type === "cloze") {
      expect(q.options).toHaveLength(4);
      expect(q.options[q.correctIndex]?.text).toBe(entry.written);
      expect(q.prompt).toContain("___");
    }
  });

  it("falls back to meaning_match when entry has no examples", () => {
    const entry = makeEntry({ examples: [] });
    const q = generateCloze(entry, makePool(), "th");
    expect(q.type).toBe("meaning_match");
  });

  it("falls back to meaning_match when written doesn't appear in the sentence", () => {
    const entry = makeEntry({
      written: "invisible",
      examples: [
        {
          sentence: "猫が好きです。",
          reading: "ねこ",
          translation: { th: "ชอบ", en: "like" },
          context: "test",
        },
      ],
    });
    const q = generateCloze(entry, makePool(), "th");
    expect(q.type).toBe("meaning_match");
  });
});

// ── generateContextChoice ─────────────────────────────────────────────────────

describe("generateContextChoice", () => {
  it("produces a valid question", () => {
    const q = generateContextChoice(makeEntry(), makePool(), "en");
    expect(q.type).toBe("context_choice");
    expect(q.options).toHaveLength(4);
    expect(q.options[q.correctIndex]?.text).toBe("猫");
  });

  it("prompt includes both context and L1 meaning", () => {
    const q = generateContextChoice(makeEntry(), makePool(), "en");
    expect(q.prompt).toContain("cat");
  });
});

// ── generateCounterWord ───────────────────────────────────────────────────────

describe("generateCounterWord", () => {
  it("falls back to meaning_match when no counterWord", () => {
    const q = generateCounterWord(makeEntry(), makePool(), "th");
    expect(q.type).toBe("meaning_match");
  });

  it("generates a counter_word question when pool has counter entries", () => {
    const entry = makeEntry({ counterWord: "匹" });
    const pool = makePool(4).map((e, i) => ({ ...e, counterWord: `CW${i}` }));
    const q = generateCounterWord(entry, pool, "th");
    if (q.type === "counter_word") {
      expect(q.options[q.correctIndex]?.text).toBe("匹");
    }
  });
});

// ── generatePolitenessRegister ────────────────────────────────────────────────

describe("generatePolitenessRegister", () => {
  it("uses the example sentence as the correct answer", () => {
    const entry = makeEntry();
    const q = generatePolitenessRegister(entry, makePool(), "th");
    expect(q.type).toBe("politeness_register");
    expect(q.options[q.correctIndex]?.text).toBe("猫が好きです。");
  });

  it("falls back to meaning_match with no examples", () => {
    const entry = makeEntry({ examples: [] });
    const q = generatePolitenessRegister(entry, makePool(), "th");
    expect(q.type).toBe("meaning_match");
  });
});

// ── generateToneMatch ─────────────────────────────────────────────────────────

describe("generateToneMatch", () => {
  it("generates tone_match question for Thai entries with a tone field", () => {
    const entry = makeEntry({ lang: "th", tone: 2 });
    const q = generateToneMatch(entry, makePool(), "en");
    expect(q.type).toBe("tone_match");
    expect(q.options[q.correctIndex]?.text).toContain("falling");
  });

  it("produces exactly 4 distinct tone options", () => {
    const entry = makeEntry({ lang: "th", tone: 0 });
    const q = generateToneMatch(entry, makePool(), "en");
    if (q.type === "tone_match") {
      expect(q.options).toHaveLength(4);
      const texts = q.options.map((o) => o.text);
      expect(new Set(texts).size).toBe(4);
    }
  });

  it("falls back to meaning_match when no tone field", () => {
    const q = generateToneMatch(makeEntry(), makePool(), "en");
    expect(q.type).toBe("meaning_match");
  });
});

// ── generatePitchMatch ────────────────────────────────────────────────────────

describe("generatePitchMatch", () => {
  it("generates pitch_match question for Japanese entries with pitchAccent", () => {
    const entry = makeEntry({ pitchAccent: 1 });
    const q = generatePitchMatch(entry, makePool(), "en");
    expect(q.type).toBe("pitch_match");
    expect(q.options[q.correctIndex]?.text).toBe("1");
  });

  it("falls back to meaning_match when no pitchAccent field", () => {
    const q = generatePitchMatch(makeEntry(), makePool(), "en");
    expect(q.type).toBe("meaning_match");
  });
});
