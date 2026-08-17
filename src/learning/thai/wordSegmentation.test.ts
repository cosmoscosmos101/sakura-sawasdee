import { describe, it, expect } from "vitest";
import {
  applySegmentCuts,
  segmentsToCuts,
  evaluateSegmentation,
  SEGMENT_CHALLENGES,
} from "./wordSegmentation";

describe("applySegmentCuts", () => {
  it("no cuts → single segment", () => {
    expect(applySegmentCuts("กินข้าว", [])).toEqual(["กินข้าว"]);
  });
  it("one cut splits into two", () => {
    expect(applySegmentCuts("กินข้าว", [3])).toEqual(["กิน", "ข้าว"]);
  });
  it("ignores cut at position 0", () => {
    expect(applySegmentCuts("กินข้าว", [0, 3])).toEqual(["กิน", "ข้าว"]);
  });
  it("ignores cut at end", () => {
    const chars = [..."กินข้าว"];
    expect(applySegmentCuts("กินข้าว", [chars.length])).toEqual(["กินข้าว"]);
  });
  it("deduplicates cuts", () => {
    expect(applySegmentCuts("กินข้าว", [3, 3])).toEqual(["กิน", "ข้าว"]);
  });
  it("multiple cuts produce multiple segments", () => {
    expect(applySegmentCuts("กินข้าวร้อน", [3, 7])).toEqual(["กิน", "ข้าว", "ร้อน"]);
  });
});

describe("segmentsToCuts", () => {
  it("empty gives no cuts", () => {
    expect(segmentsToCuts([])).toEqual([]);
  });
  it("single segment gives no cuts", () => {
    expect(segmentsToCuts(["กิน"])).toEqual([]);
  });
  it("two segments give one cut", () => {
    expect(segmentsToCuts(["กิน", "ข้าว"])).toEqual([3]);
  });
  it("three segments give two cuts", () => {
    expect(segmentsToCuts(["กิน", "ข้าว", "ร้อน"])).toEqual([3, 7]);
  });
  it("round-trips with applySegmentCuts", () => {
    const segs = ["ก๋วยเตี๋ยว", "เรือ", "รส", "เด็ด"];
    const raw = segs.join("");
    const cuts = segmentsToCuts(segs);
    expect(applySegmentCuts(raw, cuts)).toEqual(segs);
  });
});

describe("evaluateSegmentation", () => {
  const challenge = SEGMENT_CHALLENGES[0]!;

  it("perfect answer scores 1.0 and correct=true", () => {
    const correctCuts = segmentsToCuts(challenge.correctSegments);
    const result = evaluateSegmentation({ raw: challenge.raw, cuts: correctCuts }, challenge);
    expect(result.correct).toBe(true);
    expect(result.score).toBe(1);
  });

  it("empty cuts scores less than perfect", () => {
    const result = evaluateSegmentation({ raw: challenge.raw, cuts: [] }, challenge);
    expect(result.score).toBeLessThan(1);
    expect(result.correct).toBe(false);
  });

  it("partial cuts give fractional score", () => {
    const correctCuts = segmentsToCuts(challenge.correctSegments);
    const halfCuts = correctCuts.slice(0, 1);
    const result = evaluateSegmentation({ raw: challenge.raw, cuts: halfCuts }, challenge);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(1);
  });

  it("wrong cuts score 0", () => {
    const result = evaluateSegmentation({ raw: challenge.raw, cuts: [1, 2] }, challenge);
    expect(result.correct).toBe(false);
  });

  it("feedback shows correct segments on wrong answer", () => {
    const result = evaluateSegmentation({ raw: challenge.raw, cuts: [] }, challenge);
    expect(result.feedback).toContain("|");
  });

  it("feedback is positive on correct answer", () => {
    const correctCuts = segmentsToCuts(challenge.correctSegments);
    const result = evaluateSegmentation({ raw: challenge.raw, cuts: correctCuts }, challenge);
    expect(result.feedback).toContain("Perfect");
  });
});

describe("SEGMENT_CHALLENGES", () => {
  it("has at least 8 challenges", () => {
    expect(SEGMENT_CHALLENGES.length).toBeGreaterThanOrEqual(8);
  });
  it("every challenge has correct segments that rejoin to raw", () => {
    for (const c of SEGMENT_CHALLENGES) {
      expect(c.correctSegments.join("")).toBe(c.raw);
    }
  });
  it("every challenge has a unique id", () => {
    const ids = new Set(SEGMENT_CHALLENGES.map((c) => c.id));
    expect(ids.size).toBe(SEGMENT_CHALLENGES.length);
  });
});
