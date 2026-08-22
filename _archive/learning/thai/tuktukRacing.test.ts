import { describe, it, expect } from "vitest";
import {
  generateIntersection,
  scoreAttempt,
  timerBudget,
  aggregateWpm,
  fluencyBand,
  ROAD_SIGNS,
} from "./tuktukRacing";

describe("generateIntersection", () => {
  it("destination matches the sign at the correct direction slot", () => {
    for (let i = 0; i < 20; i++) {
      const ix = generateIntersection();
      const idx = ["left", "straight", "right"].indexOf(ix.correctDir);
      expect(ix.choices[idx as 0 | 1 | 2]?.thai).toBe(ix.destination.thai);
    }
  });

  it("wrong slots differ from destination", () => {
    for (let i = 0; i < 20; i++) {
      const ix = generateIntersection();
      const dirs = ["left", "straight", "right"] as const;
      for (const d of dirs) {
        if (d !== ix.correctDir) {
          const idx = dirs.indexOf(d);
          expect(ix.choices[idx]?.thai).not.toBe(ix.destination.thai);
        }
      }
    }
  });

  it("all three choices are distinct", () => {
    for (let i = 0; i < 20; i++) {
      const ix = generateIntersection();
      const thais = ix.choices.map((c) => c.thai);
      expect(new Set(thais).size).toBe(3);
    }
  });
});

describe("scoreAttempt", () => {
  it("returns correct=true for the right direction", () => {
    const ix = generateIntersection();
    const result = scoreAttempt(ix, ix.correctDir, 1200);
    expect(result.correct).toBe(true);
  });

  it("returns correct=false for a wrong direction", () => {
    const ix = generateIntersection();
    const wrong = (["left", "straight", "right"] as const).find((d) => d !== ix.correctDir)!;
    const result = scoreAttempt(ix, wrong, 1200);
    expect(result.correct).toBe(false);
  });

  it("wpm is 0 for wrong answers", () => {
    const ix = generateIntersection();
    const wrong = (["left", "straight", "right"] as const).find((d) => d !== ix.correctDir)!;
    expect(scoreAttempt(ix, wrong, 1000).wpm).toBe(0);
  });

  it("faster reaction gives higher wpm", () => {
    const ix = generateIntersection();
    const slow = scoreAttempt(ix, ix.correctDir, 3000);
    const fast = scoreAttempt(ix, ix.correctDir, 800);
    expect(fast.wpm).toBeGreaterThan(slow.wpm);
  });
});

describe("timerBudget", () => {
  it("starts at 4000ms for streak 0", () => {
    expect(timerBudget(0)).toBe(4000);
  });
  it("decreases with streak", () => {
    expect(timerBudget(5)).toBeLessThan(timerBudget(0));
  });
  it("never drops below 1500ms", () => {
    expect(timerBudget(999)).toBeGreaterThanOrEqual(1500);
  });
});

describe("aggregateWpm", () => {
  it("returns 0 for empty results", () => {
    expect(aggregateWpm([])).toBe(0);
  });
  it("ignores wrong answers", () => {
    const results = [
      { correct: true, reactionMs: 1000, wpm: 60 },
      { correct: false, reactionMs: 1200, wpm: 0 },
    ];
    expect(aggregateWpm(results)).toBe(60);
  });
  it("averages multiple correct wpm values", () => {
    const results = [
      { correct: true, reactionMs: 500, wpm: 80 },
      { correct: true, reactionMs: 500, wpm: 100 },
    ];
    expect(aggregateWpm(results)).toBe(90);
  });
});

describe("fluencyBand", () => {
  it("labels 120+ as Fluent", () => {
    expect(fluencyBand(120).label).toBe("Fluent");
    expect(fluencyBand(150).label).toBe("Fluent");
  });
  it("labels 80-119 as Proficient", () => {
    expect(fluencyBand(80).label).toBe("Proficient");
    expect(fluencyBand(100).label).toBe("Proficient");
  });
  it("labels 40-79 as Developing", () => {
    expect(fluencyBand(40).label).toBe("Developing");
  });
  it("labels below 40 as Beginner", () => {
    expect(fluencyBand(0).label).toBe("Beginner");
    expect(fluencyBand(20).label).toBe("Beginner");
  });
});

describe("ROAD_SIGNS", () => {
  it("has at least 12 signs", () => {
    expect(ROAD_SIGNS.length).toBeGreaterThanOrEqual(12);
  });
  it("every sign has non-empty thai, romanized, meaning", () => {
    for (const s of ROAD_SIGNS) {
      expect(s.thai.length).toBeGreaterThan(0);
      expect(s.romanized.length).toBeGreaterThan(0);
      expect(s.meaning.length).toBeGreaterThan(0);
    }
  });
  it("all thai strings are unique", () => {
    const thais = new Set(ROAD_SIGNS.map((s) => s.thai));
    expect(thais.size).toBe(ROAD_SIGNS.length);
  });
});
