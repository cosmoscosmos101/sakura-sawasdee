import { describe, it, expect } from "vitest";
import {
  appendAnswer,
  successRate,
  computeAdjustment,
  recommendedQuestionTypes,
  weakestQuestionType,
  type AnswerRecord,
} from "./difficultyBalancer";

const T = Date.now();

function rec(correct: boolean, type: AnswerRecord["questionType"] = "meaning_match"): AnswerRecord {
  return { correct, questionType: type, timestampMs: T };
}

function history(corrects: boolean[]): AnswerRecord[] {
  return corrects.map((c) => rec(c));
}

// ── appendAnswer ──────────────────────────────────────────────────────────────

describe("appendAnswer", () => {
  it("appends a record to an empty history", () => {
    const h = appendAnswer([], rec(true));
    expect(h).toHaveLength(1);
  });

  it("caps history at 20 entries", () => {
    let h: AnswerRecord[] = [];
    for (let i = 0; i < 25; i++) h = appendAnswer(h, rec(true));
    expect(h).toHaveLength(20);
  });

  it("keeps the most recent entries", () => {
    let h: AnswerRecord[] = [];
    for (let i = 0; i < 19; i++) h = appendAnswer(h, rec(true));
    h = appendAnswer(h, rec(false));
    expect(h.at(-1)?.correct).toBe(false);
  });
});

// ── successRate ───────────────────────────────────────────────────────────────

describe("successRate", () => {
  it("returns 1 for an empty history", () => {
    expect(successRate([])).toBe(1);
  });

  it("computes rate correctly", () => {
    expect(successRate(history([true, true, true, false]))).toBeCloseTo(0.75);
  });

  it("returns 1 for all-correct history", () => {
    expect(successRate(history([true, true, true]))).toBe(1);
  });

  it("returns 0 for all-incorrect history", () => {
    expect(successRate(history([false, false, false]))).toBe(0);
  });
});

// ── computeAdjustment ─────────────────────────────────────────────────────────

describe("computeAdjustment", () => {
  it("suggests more new words and hard types above 90%", () => {
    const adj = computeAdjustment(history(Array(20).fill(true)));
    expect(adj.includeHardTypes).toBe(true);
    expect(adj.newWordsPerSession).toBeGreaterThan(7);
  });

  it("maintains balance in 85–90% range", () => {
    const corrects = [...Array(17).fill(true), ...Array(3).fill(false)];
    const adj = computeAdjustment(history(corrects)); // 85%
    expect(adj.includeHardTypes).toBe(false);
    expect(adj.newWordsPerSession).toBe(7);
  });

  it("reduces new words below 85%", () => {
    const corrects = [...Array(16).fill(true), ...Array(4).fill(false)];
    const adj = computeAdjustment(history(corrects)); // 80%
    expect(adj.newWordsPerSession).toBeLessThan(7);
    expect(adj.includeHardTypes).toBe(false);
  });

  it("clamps newWordsPerSession to at least 3 when struggling", () => {
    const adj = computeAdjustment(history(Array(20).fill(false)));
    expect(adj.newWordsPerSession).toBeGreaterThanOrEqual(3);
  });
});

// ── recommendedQuestionTypes ──────────────────────────────────────────────────

describe("recommendedQuestionTypes", () => {
  it("returns only easy types when struggling", () => {
    const types = recommendedQuestionTypes(history(Array(20).fill(false)));
    expect(types).toContain("meaning_match");
    expect(types).not.toContain("cloze");
  });

  it("returns hard types when performing well", () => {
    const types = recommendedQuestionTypes(history(Array(20).fill(true)));
    expect(types).toContain("cloze");
    expect(types).toContain("sentence_build");
  });
});

// ── weakestQuestionType ───────────────────────────────────────────────────────

describe("weakestQuestionType", () => {
  it("returns null for very small history", () => {
    expect(weakestQuestionType([rec(true, "meaning_match")])).toBeNull();
  });

  it("identifies the type with the lowest success rate", () => {
    const h: AnswerRecord[] = [
      rec(true,  "meaning_match"),
      rec(true,  "meaning_match"),
      rec(false, "cloze"),
      rec(false, "cloze"),
      rec(true,  "cloze"),
    ];
    expect(weakestQuestionType(h)).toBe("cloze");
  });

  it("ignores types with fewer than 2 answers", () => {
    const h: AnswerRecord[] = [
      rec(true,  "meaning_match"),
      rec(true,  "meaning_match"),
      rec(false, "tone_match"),
    ];
    expect(weakestQuestionType(h)).toBeNull();
  });
});
