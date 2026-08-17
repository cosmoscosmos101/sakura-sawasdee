import { describe, it, expect } from "vitest";
import {
  getConsonantClass,
  computeTone,
  detectToneMark,
  evaluateToneKitchenGuess,
  getMidClassConsonants,
  getHighClassConsonants,
  getLowClassConsonants,
} from "./scriptSystem";

describe("getConsonantClass", () => {
  it("classifies mid-class consonants", () => {
    expect(getConsonantClass("ก")).toBe("mid");
    expect(getConsonantClass("จ")).toBe("mid");
    expect(getConsonantClass("ด")).toBe("mid");
    expect(getConsonantClass("ต")).toBe("mid");
    expect(getConsonantClass("บ")).toBe("mid");
    expect(getConsonantClass("ป")).toBe("mid");
    expect(getConsonantClass("อ")).toBe("mid");
  });

  it("classifies high-class consonants", () => {
    expect(getConsonantClass("ข")).toBe("high");
    expect(getConsonantClass("ส")).toBe("high");
    expect(getConsonantClass("ห")).toBe("high");
    expect(getConsonantClass("ฉ")).toBe("high");
    expect(getConsonantClass("ผ")).toBe("high");
  });

  it("classifies low-class consonants", () => {
    expect(getConsonantClass("ค")).toBe("low");
    expect(getConsonantClass("ง")).toBe("low");
    expect(getConsonantClass("ช")).toBe("low");
    expect(getConsonantClass("น")).toBe("low");
    expect(getConsonantClass("ม")).toBe("low");
    expect(getConsonantClass("ย")).toBe("low");
    expect(getConsonantClass("ว")).toBe("low");
    expect(getConsonantClass("ล")).toBe("low");
  });
});

describe("class member counts", () => {
  it("mid class has 9 consonants", () => {
    expect(getMidClassConsonants()).toHaveLength(9);
  });
  it("high class has 11 consonants", () => {
    expect(getHighClassConsonants()).toHaveLength(11);
  });
  it("low class has 24 consonants", () => {
    expect(getLowClassConsonants()).toHaveLength(24);
  });
});

describe("computeTone — mid class", () => {
  it("mid + live + no mark = mid (0)", () => {
    const r = computeTone({ consonantClass: "mid", vowelLength: "long", syllableType: "live", toneMark: "none" });
    expect(r.tone).toBe(0);
  });
  it("mid + live + mai ek = low (1)", () => {
    const r = computeTone({ consonantClass: "mid", vowelLength: "long", syllableType: "live", toneMark: "mai_ek" });
    expect(r.tone).toBe(1);
  });
  it("mid + live + mai tho = falling (2)", () => {
    const r = computeTone({ consonantClass: "mid", vowelLength: "long", syllableType: "live", toneMark: "mai_tho" });
    expect(r.tone).toBe(2);
  });
  it("mid + dead-short + no mark = low (1)", () => {
    const r = computeTone({ consonantClass: "mid", vowelLength: "short", syllableType: "dead", toneMark: "none" });
    expect(r.tone).toBe(1);
  });
});

describe("computeTone — high class", () => {
  it("high + live + no mark = rising (4)  ← the key diagnostic for ข vs ค", () => {
    const r = computeTone({ consonantClass: "high", vowelLength: "long", syllableType: "live", toneMark: "none" });
    expect(r.tone).toBe(4);
  });
  it("high + live + mai ek = low (1)", () => {
    const r = computeTone({ consonantClass: "high", vowelLength: "long", syllableType: "live", toneMark: "mai_ek" });
    expect(r.tone).toBe(1);
  });
  it("high + live + mai tho = falling (2)", () => {
    const r = computeTone({ consonantClass: "high", vowelLength: "long", syllableType: "live", toneMark: "mai_tho" });
    expect(r.tone).toBe(2);
  });
  it("high + dead-short + no mark = low (1)", () => {
    const r = computeTone({ consonantClass: "high", vowelLength: "short", syllableType: "dead", toneMark: "none" });
    expect(r.tone).toBe(1);
  });
});

describe("computeTone — low class", () => {
  it("low + live + no mark = mid (0)", () => {
    const r = computeTone({ consonantClass: "low", vowelLength: "long", syllableType: "live", toneMark: "none" });
    expect(r.tone).toBe(0);
  });
  it("low + live + mai ek = falling (2)", () => {
    const r = computeTone({ consonantClass: "low", vowelLength: "long", syllableType: "live", toneMark: "mai_ek" });
    expect(r.tone).toBe(2);
  });
  it("low + live + mai tho = high (3)", () => {
    const r = computeTone({ consonantClass: "low", vowelLength: "long", syllableType: "live", toneMark: "mai_tho" });
    expect(r.tone).toBe(3);
  });
  it("low + dead-short + no mark = high (3)  ← the hot-pan rule", () => {
    const r = computeTone({ consonantClass: "low", vowelLength: "short", syllableType: "dead", toneMark: "none" });
    expect(r.tone).toBe(3);
  });
  it("low + dead-long + no mark = falling (2)", () => {
    const r = computeTone({ consonantClass: "low", vowelLength: "long", syllableType: "dead", toneMark: "none" });
    expect(r.tone).toBe(2);
  });
});

describe("detectToneMark", () => {
  it("detects mai ek in ข้าว", () => expect(detectToneMark("ข้าว")).toBe("mai_tho"));
  it("detects none in กาว",   () => expect(detectToneMark("กาว")).toBe("none"));
  it("detects mai ek in ก่อน", () => expect(detectToneMark("ก่อน")).toBe("mai_ek"));
  it("detects mai tri",        () => expect(detectToneMark("ก๊าก")).toBe("mai_tri"));
  it("detects mai jattawa",    () => expect(detectToneMark("ก๋า")).toBe("mai_jattawa"));
});

describe("evaluateToneKitchenGuess", () => {
  it("returns correct when guess matches", () => {
    const result = evaluateToneKitchenGuess({
      recipe: { consonantClass: "mid", vowelLength: "long", syllableType: "live", toneMark: "none" },
      guessedTone: 0,
    });
    expect(result.correct).toBe(true);
  });

  it("returns incorrect with explanation when wrong", () => {
    const result = evaluateToneKitchenGuess({
      recipe: { consonantClass: "high", vowelLength: "long", syllableType: "live", toneMark: "none" },
      guessedTone: 0,
    });
    expect(result.correct).toBe(false);
    expect(result.actual.tone).toBe(4);
    expect(result.explanation).toContain("rising");
  });

  it("explanation always includes the rule", () => {
    const result = evaluateToneKitchenGuess({
      recipe: { consonantClass: "low", vowelLength: "short", syllableType: "dead", toneMark: "none" },
      guessedTone: 3,
    });
    expect(result.correct).toBe(true);
    expect(result.explanation).toContain("high");
  });
});
