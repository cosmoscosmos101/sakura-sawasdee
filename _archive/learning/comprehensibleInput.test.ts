import { describe, it, expect } from "vitest";
import { rateNode, selectComprehensibleNodes, pickNodeForNextWords } from "./comprehensibleInput";
import type { DialogueNode } from "../content/schema";

function makeNode(id: string, wordIds: string[]): DialogueNode {
  return {
    id,
    speakerNpcId: "yuki",
    speakerName: { ja: "ユキ", th: "ยูกิ" },
    lines: [
      {
        l2: "テスト",
        newWordIds: wordIds,
      },
    ],
    endsDialogue: false,
  };
}

const KNOWN = new Set(["w1", "w2", "w3", "w4", "w5", "w6", "w7", "w8", "w9", "w10"]);

describe("rateNode", () => {
  it("returns knownRatio=1 for a node with no newWordIds", () => {
    const node = makeNode("n1", []);
    const r = rateNode(node, KNOWN);
    expect(r.knownRatio).toBe(1);
    expect(r.newWordIds).toHaveLength(0);
  });

  it("correctly computes ratio when all words are known", () => {
    const node = makeNode("n2", ["w1", "w2", "w3"]);
    const r = rateNode(node, KNOWN);
    expect(r.knownRatio).toBe(1);
    expect(r.newWordIds).toHaveLength(0);
  });

  it("correctly identifies new words", () => {
    const node = makeNode("n3", ["w1", "w2", "wNew"]);
    const r = rateNode(node, KNOWN);
    expect(r.newWordIds).toContain("wNew");
    expect(r.knownRatio).toBeCloseTo(2 / 3);
  });

  it("returns knownRatio=0 for all-unknown node", () => {
    const node = makeNode("n4", ["unknown_a", "unknown_b"]);
    const r = rateNode(node, new Set());
    expect(r.knownRatio).toBe(0);
    expect(r.newWordIds).toHaveLength(2);
  });
});

describe("selectComprehensibleNodes", () => {
  it("returns nodes in the 85–97% window", () => {
    // 9/10 known = 90% — should be in range
    const good = makeNode("g1", ["w1", "w2", "w3", "w4", "w5", "w6", "w7", "w8", "w9", "wNew"]);
    // 5/10 known = 50% — too hard
    const hard = makeNode("h1", ["w1", "w2", "w3", "w4", "w5", "a", "b", "c", "d", "e"]);
    // 10/10 = 100% — too easy
    const easy = makeNode("e1", ["w1", "w2", "w3"]);

    const result = selectComprehensibleNodes([good, hard, easy], KNOWN);
    expect(result.some((r) => r.node.id === "g1")).toBe(true);
    expect(result.every((r) => r.node.id !== "h1")).toBe(true);
  });

  it("falls back to the closest node when nothing is in range", () => {
    const only = makeNode("o1", ["w1", "a", "b", "c", "d"]);
    const result = selectComprehensibleNodes([only], KNOWN);
    expect(result).toHaveLength(1);
    expect(result[0]?.node.id).toBe("o1");
  });

  it("prefers slightly-too-easy over too-hard in fallback", () => {
    const tooEasy = makeNode("te", ["w1"]);
    const tooHard = makeNode("th", ["unknown_a", "unknown_b", "unknown_c"]);
    const result = selectComprehensibleNodes([tooEasy, tooHard], KNOWN);
    expect(result[0]?.node.id).toBe("te");
  });
});

describe("pickNodeForNextWords", () => {
  it("returns a node that introduces the queued word", () => {
    const node = makeNode("n1", ["w1", "wQueued"]);
    const result = pickNodeForNextWords([node], KNOWN, ["wQueued"]);
    expect(result?.node.id).toBe("n1");
  });

  it("returns null when no node introduces any queued word", () => {
    const node = makeNode("n1", ["w1", "w2"]);
    const result = pickNodeForNextWords([node], KNOWN, ["wNotThere"]);
    expect(result).toBeNull();
  });

  it("prefers the node introducing more queued words", () => {
    const better = makeNode("b1", ["wA", "wB", "wC"]);
    const worse  = makeNode("w1", ["wA"]);
    const result = pickNodeForNextWords([worse, better], new Set(), ["wA", "wB", "wC"]);
    expect(result?.node.id).toBe("b1");
  });
});
