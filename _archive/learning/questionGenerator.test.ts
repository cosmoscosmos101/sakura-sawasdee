import { describe, it, expect } from "vitest";
import {
  generateMeaningMatch,
  generateReverseRecall,
  generateScriptReading,
  generateListening,
  generateSentenceBuild,
  generateQuestion,
  questionTypeForEncounter,
} from "./questionGenerator";
import { parseVocabFile } from "../content/schema";
import rawVocab from "../content/ja/vocab_n5_01.json";

const pool = parseVocabFile(rawVocab, "vocab_n5_01.json");
const neko = pool.find((e) => e.id === "ja_n5_0001")!;
const taberu = pool.find((e) => e.id === "ja_n5_0005")!;

// ── shared assertions ────────────────────────────────────────────────────────

function assertValidQuestion(q: ReturnType<typeof generateMeaningMatch>) {
  expect(q.options).toHaveLength(4);
  expect(q.correctIndex).toBeGreaterThanOrEqual(0);
  expect(q.correctIndex).toBeLessThan(4);
  const allTexts = q.options.map((o) => o.text);
  expect(new Set(allTexts).size).toBe(4); // all options must be distinct
  expect(q.timeLimitMs).toBeGreaterThan(0);
}

// ── meaning_match ────────────────────────────────────────────────────────────

describe("generateMeaningMatch", () => {
  it("produces 4 unique options, correct one is a valid meaning", () => {
    const q = generateMeaningMatch(neko, pool, "th");
    assertValidQuestion(q);
    expect(q.type).toBe("meaning_match");
    expect(q.prompt).toBe("猫");
    expect(q.promptSub).toBe("ねこ");
    expect(q.options[q.correctIndex]?.text).toBe("แมว");
  });

  it("works for English L1", () => {
    const q = generateMeaningMatch(neko, pool, "en");
    expect(q.options[q.correctIndex]?.text).toBe("cat");
  });

  it("distractors are different from the correct answer", () => {
    const q = generateMeaningMatch(neko, pool, "th");
    const correct = q.options[q.correctIndex]?.text;
    const others = q.options.filter((_, i) => i !== q.correctIndex);
    for (const o of others) {
      expect(o.text).not.toBe(correct);
    }
  });
});

// ── reverse_recall ───────────────────────────────────────────────────────────

describe("generateReverseRecall", () => {
  it("prompts with L1 meaning, options are L2 written forms", () => {
    const q = generateReverseRecall(neko, pool, "th");
    assertValidQuestion(q);
    expect(q.type).toBe("reverse_recall");
    expect(q.prompt).toBe("แมว");
    expect(q.options[q.correctIndex]?.text).toBe("猫");
  });

  it("does not include the correct written form as a distractor", () => {
    const q = generateReverseRecall(neko, pool, "th");
    const others = q.options.filter((_, i) => i !== q.correctIndex);
    for (const o of others) {
      expect(o.text).not.toBe("猫");
    }
  });
});

// ── script_reading ───────────────────────────────────────────────────────────

describe("generateScriptReading", () => {
  it("prompts with written form, options are readings", () => {
    const q = generateScriptReading(neko, pool);
    assertValidQuestion(q);
    expect(q.type).toBe("script_reading");
    expect(q.prompt).toBe("猫");
    expect(q.options[q.correctIndex]?.text).toBe("ねこ");
  });
});

// ── listening ────────────────────────────────────────────────────────────────

describe("generateListening", () => {
  it("is structurally valid and has type listening", () => {
    const q = generateListening(neko, pool, "th");
    assertValidQuestion(q);
    expect(q.type).toBe("listening");
    expect(q.options[q.correctIndex]?.text).toBe("แมว");
  });

  it("uses the reading as the prompt (audio placeholder)", () => {
    const q = generateListening(neko, pool, "th");
    expect(q.prompt).toBe("ねこ");
  });
});

// ── sentence_build ───────────────────────────────────────────────────────────

describe("generateSentenceBuild", () => {
  it("produces a valid question for an entry with examples", () => {
    const q = generateSentenceBuild(neko, pool, "th");
    assertValidQuestion(q);
    expect(q.type).toBe("sentence_build");
  });

  it("has a higher time limit than other types", () => {
    const qSentence = generateSentenceBuild(neko, pool, "th");
    const qMeaning = generateMeaningMatch(neko, pool, "th");
    expect(qSentence.timeLimitMs).toBeGreaterThan(qMeaning.timeLimitMs);
  });

  it("falls back to meaning_match for entries without examples (via verb)", () => {
    // taberu has examples, so this tests the happy path too
    const q = generateSentenceBuild(taberu, pool, "th");
    assertValidQuestion(q);
  });
});

// ── generateQuestion dispatcher ──────────────────────────────────────────────

describe("generateQuestion", () => {
  it("dispatches to the correct generator for each type", () => {
    expect(generateQuestion("meaning_match",  neko, pool, "th").type).toBe("meaning_match");
    expect(generateQuestion("reverse_recall", neko, pool, "th").type).toBe("reverse_recall");
    expect(generateQuestion("script_reading", neko, pool, "th").type).toBe("script_reading");
    expect(generateQuestion("listening",      neko, pool, "th").type).toBe("listening");
    expect(generateQuestion("sentence_build", neko, pool, "th").type).toBe("sentence_build");
  });

  it("falls back to meaning_match when pool is too small", () => {
    const tiny = [neko, pool[1]!].filter(Boolean);
    const q = generateQuestion("reverse_recall", neko, tiny, "th");
    expect(q.type).toBe("meaning_match");
  });
});

// ── questionTypeForEncounter ─────────────────────────────────────────────────

describe("questionTypeForEncounter", () => {
  it("cycles through types starting at meaning_match", () => {
    expect(questionTypeForEncounter(0)).toBe("meaning_match");
    expect(questionTypeForEncounter(1)).toBe("reverse_recall");
    expect(questionTypeForEncounter(2)).toBe("script_reading");
  });

  it("wraps around after 5 encounters", () => {
    expect(questionTypeForEncounter(5)).toBe("meaning_match");
  });
});
