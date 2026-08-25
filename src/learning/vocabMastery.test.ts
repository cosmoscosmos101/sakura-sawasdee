import { describe, it, expect } from "vitest";
import {
  encounterChance,
  bumpEncounterRate,
  battleWeight,
  pickWeightedParty,
} from "./vocabMastery";
import type { VocabEntry } from "../content/schema";

function stub(id: string): VocabEntry {
  return {
    id,
    lang: "ja",
    written: id,
    reading: id,
    romanization: id,
    meaning: { en: id },
    pos: "noun",
    element: "bloom",
    level: "N5",
    chapter: 1,
    tags: [],
    frequency: 1,
    audio: "x.mp3",
    examples: [{ sentence: "x", reading: "x", translation: { en: "x" }, context: "school" }],
    kotodama: {
      name: id,
      sprite: "x.png",
      description: { en: "x" },
      rarity: "common",
      habitat: ["sakura_path"],
    },
  };
}

describe("encounterChance", () => {
  it("maps the five HFS slider notches", () => {
    expect(encounterChance(0)).toBe(0);
    expect(encounterChance(2)).toBe(0.4);
    expect(encounterChance(4)).toBe(1);
  });

  it("clamps the slider at both ends", () => {
    expect(bumpEncounterRate(0, -1)).toBe(0);
    expect(bumpEncounterRate(4, 1)).toBe(4);
    expect(bumpEncounterRate(2, 1)).toBe(3);
  });
});

describe("battleWeight", () => {
  it("weights unknown words higher than mastered ones", () => {
    expect(battleWeight(false, 0)).toBeGreaterThan(battleWeight(true, 8));
    expect(battleWeight(true, 0)).toBeGreaterThan(battleWeight(true, 8));
  });
});

describe("pickWeightedParty", () => {
  it("returns an empty list for an empty pool", () => {
    expect(pickWeightedParty([], 4, new Set(), new Map(), () => 0.5)).toEqual([]);
  });

  it("returns the whole pool when smaller than count", () => {
    const pool = [stub("a"), stub("b")];
    const result = pickWeightedParty(pool, 4, new Set(), new Map(), () => 0.5);
    expect(result).toHaveLength(2);
    expect(new Set(result.map((e) => e.id))).toEqual(new Set(["a", "b"]));
  });

  it("never picks the same entry twice", () => {
    const pool = [stub("a"), stub("b"), stub("c"), stub("d"), stub("e")];
    let i = 0;
    const rng = () => {
      const seq = [0.01, 0.99, 0.4, 0.7, 0.2];
      return seq[i++] ?? 0.5;
    };
    const result = pickWeightedParty(pool, 4, new Set(), new Map(), rng);
    expect(result).toHaveLength(4);
    expect(new Set(result.map((e) => e.id)).size).toBe(4);
  });

  it("picks unknown words more often than mastered ones", () => {
    const pool = [stub("known"), stub("new")];
    const known = new Set(["known"]);
    const reps = new Map([["known", 8]]);
    let unknownHits = 0;
    for (let n = 0; n < 200; n++) {
      const result = pickWeightedParty(pool, 1, known, reps, Math.random);
      if (result[0]?.id === "new") unknownHits += 1;
    }
    expect(unknownHits).toBeGreaterThan(120);
  });
});
