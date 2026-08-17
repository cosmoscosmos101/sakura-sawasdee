import { describe, it, expect } from "vitest";
import {
  resampleStroke,
  normaliseStroke,
  frechetDistance,
  scoreStroke,
  evaluateHandwriting,
  HANDWRITING_CHALLENGES,
  type Point,
} from "./handwriting";

const LINE: Point[] = [{ x: 0, y: 0 }, { x: 0.5, y: 0.5 }, { x: 1, y: 1 }];

describe("resampleStroke", () => {
  it("returns n points", () => {
    expect(resampleStroke(LINE, 8)).toHaveLength(8);
  });
  it("handles single point input", () => {
    const result = resampleStroke([{ x: 0.5, y: 0.5 }], 4);
    expect(result).toHaveLength(4);
    expect(result.every((p) => p.x === 0.5 && p.y === 0.5)).toBe(true);
  });
  it("preserves endpoints", () => {
    const r = resampleStroke(LINE, 10);
    expect(r[0]!.x).toBeCloseTo(0, 5);
    expect(r[r.length - 1]!.x).toBeCloseTo(1, 5);
  });
  it("returns empty for empty input", () => {
    expect(resampleStroke([], 10)).toEqual([]);
  });
});

describe("normaliseStroke", () => {
  it("returns empty for empty input", () => {
    expect(normaliseStroke([])).toEqual([]);
  });
  it("maps min point to (0,0)", () => {
    const pts: Point[] = [{ x: 10, y: 20 }, { x: 30, y: 40 }];
    const norm = normaliseStroke(pts);
    expect(Math.min(...norm.map((p) => p.x))).toBeCloseTo(0, 5);
    expect(Math.min(...norm.map((p) => p.y))).toBeCloseTo(0, 5);
  });
  it("largest dimension maps to 1", () => {
    const pts: Point[] = [{ x: 0, y: 0 }, { x: 100, y: 50 }];
    const norm = normaliseStroke(pts);
    expect(Math.max(...norm.map((p) => p.x))).toBeCloseTo(1, 5);
  });
});

describe("frechetDistance", () => {
  it("returns 0 for identical strokes", () => {
    expect(frechetDistance(LINE, LINE)).toBeCloseTo(0, 3);
  });
  it("returns a positive value for different strokes", () => {
    const other: Point[] = [{ x: 0, y: 1 }, { x: 0.5, y: 0.5 }, { x: 1, y: 0 }];
    expect(frechetDistance(LINE, other)).toBeGreaterThan(0);
  });
  it("is symmetric", () => {
    const other: Point[] = [{ x: 0, y: 1 }, { x: 0.5, y: 0.5 }, { x: 1, y: 0 }];
    expect(frechetDistance(LINE, other)).toBeCloseTo(frechetDistance(other, LINE), 5);
  });
});

describe("scoreStroke", () => {
  it("scores a perfect match as 1.0", () => {
    const pts = HANDWRITING_CHALLENGES[0]!.strokes[0]!.points;
    expect(scoreStroke(pts, pts)).toBe(1);
  });
  it("scores a very different stroke near 0", () => {
    const template: Point[] = [{ x: 0, y: 0 }, { x: 1, y: 1 }];
    const drawn: Point[] = [{ x: 0, y: 1 }, { x: 0, y: 0.9 }, { x: 0.1, y: 0.8 }];
    expect(scoreStroke(drawn, template)).toBeLessThan(0.5);
  });
  it("returns 0 for fewer than 3 drawn points", () => {
    const template = HANDWRITING_CHALLENGES[0]!.strokes[0]!.points;
    expect(scoreStroke([{ x: 0.5, y: 0.5 }], template)).toBe(0);
    expect(scoreStroke([], template)).toBe(0);
  });
});

describe("evaluateHandwriting", () => {
  it("returns correct=true for perfect template strokes", () => {
    const ch = HANDWRITING_CHALLENGES[0]!;
    const drawnStrokes = ch.strokes.map((s) => s.points);
    const result = evaluateHandwriting(drawnStrokes, ch);
    expect(result.correct).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(0.65);
  });
  it("returns correct=false for empty strokes", () => {
    const ch = HANDWRITING_CHALLENGES[0]!;
    const result = evaluateHandwriting([], ch);
    expect(result.correct).toBe(false);
    expect(result.score).toBe(0);
  });
  it("gives feedback string for all outcomes", () => {
    const ch = HANDWRITING_CHALLENGES[0]!;
    const good = evaluateHandwriting(ch.strokes.map((s) => s.points), ch);
    expect(typeof good.feedback).toBe("string");
    const bad = evaluateHandwriting([], ch);
    expect(typeof bad.feedback).toBe("string");
  });
});

describe("HANDWRITING_CHALLENGES", () => {
  it("has at least 5 challenges", () => {
    expect(HANDWRITING_CHALLENGES.length).toBeGreaterThanOrEqual(5);
  });
  it("every challenge has unique id", () => {
    const ids = new Set(HANDWRITING_CHALLENGES.map((c) => c.id));
    expect(ids.size).toBe(HANDWRITING_CHALLENGES.length);
  });
  it("every challenge has at least one stroke with 3+ points", () => {
    for (const ch of HANDWRITING_CHALLENGES) {
      expect(ch.strokes.length).toBeGreaterThanOrEqual(1);
      expect(ch.strokes[0]!.points.length).toBeGreaterThanOrEqual(3);
    }
  });
});
