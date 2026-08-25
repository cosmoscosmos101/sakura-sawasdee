import { describe, it, expect } from "vitest";
import {
  lineTokenIds,
  shouldShowL2,
  initialLayer,
  nextRevealLayer,
  isFullyRevealed,
  visibleReading,
  visibleTranslation,
} from "./dialogueReveal";
import type { DialogueLine } from "../content/schema";

const line = (partial: Partial<DialogueLine> = {}): DialogueLine => ({
  l2: "猫が好きです。",
  reading: "ねこがすきです。",
  translation: { en: "I like cats.", th: "ชอบแมว" },
  tokenIds: ["ja_n5_0001", "ja_n5_0043"],
  ...partial,
});

describe("lineTokenIds", () => {
  it("prefers tokenIds over newWordIds", () => {
    expect(lineTokenIds(line({ newWordIds: ["x"] }))).toEqual(["ja_n5_0001", "ja_n5_0043"]);
  });

  it("falls back to newWordIds", () => {
    expect(lineTokenIds(line({ tokenIds: undefined, newWordIds: ["a"] }))).toEqual(["a"]);
  });
});

describe("shouldShowL2", () => {
  const known = new Set(["ja_n5_0001", "ja_n5_0043"]);

  it("shows L2 in max_l2 even when nothing is known", () => {
    expect(shouldShowL2(["ja_n5_0001"], new Set(), "max_l2")).toBe(true);
  });

  it("shows L2 only when every token is known (adaptive)", () => {
    expect(shouldShowL2(["ja_n5_0001", "ja_n5_0043"], known, "adaptive")).toBe(true);
    expect(shouldShowL2(["ja_n5_0001", "missing"], known, "adaptive")).toBe(false);
  });

  it("shows L2 for untagged flavour lines", () => {
    expect(shouldShowL2([], new Set(), "adaptive")).toBe(true);
  });
});

describe("reveal layers", () => {
  it("starts at L2 when gradual + known, translation when hidden", () => {
    expect(initialLayer(true, true)).toBe("l2");
    expect(initialLayer(false, true)).toBe("translation");
    expect(initialLayer(true, false)).toBe("translation");
  });

  it("cycles L2 → reading → translation → done", () => {
    expect(nextRevealLayer("l2", true)).toBe("reading");
    expect(nextRevealLayer("l2", false)).toBe("translation");
    expect(nextRevealLayer("reading", true)).toBe("translation");
    expect(nextRevealLayer("translation", true)).toBe("done");
  });

  it("treats translation as fully revealed", () => {
    expect(isFullyRevealed("l2", true)).toBe(false);
    expect(isFullyRevealed("translation", true)).toBe(true);
    expect(isFullyRevealed("l2", false)).toBe(true);
  });

  it("shows reading only after the reading layer", () => {
    const l = line();
    expect(visibleReading(l, "l2", true)).toBe(false);
    expect(visibleReading(l, "reading", true)).toBe(true);
    expect(visibleReading(l, "translation", true)).toBe(true);
    expect(visibleReading(l, "reading", false)).toBe(false);
  });

  it("shows the L1 gloss only on the last layer", () => {
    expect(visibleTranslation("l2")).toBe(false);
    expect(visibleTranslation("translation")).toBe(true);
  });
});
