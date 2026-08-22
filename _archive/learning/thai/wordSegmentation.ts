/**
 * Word segmentation engine for the Naga boss at the pier.
 * Players tap between characters in an unspaced Thai string to insert
 * word boundaries. Validation checks their cuts against the correct answer.
 *
 * Pure functions — no UI or Phaser dependencies.
 */

export interface SegmentChallenge {
  id: string;
  raw: string;              // Unspaced Thai text, e.g. "ก๋วยเตี๋ยวเรือรสเด็ด"
  correctSegments: string[]; // e.g. ["ก๋วยเตี๋ยว", "เรือ", "รส", "เด็ด"]
  hint: string;             // English hint for the meaning
  location: string;         // Where in the Thai world this would appear
}

export interface SegmentAttempt {
  raw: string;
  /** Character indices where the player inserted cuts (0 = before first char). */
  cuts: number[];
}

export interface SegmentResult {
  correct: boolean;
  playerSegments: string[];
  correctSegments: string[];
  score: number; // 0.0–1.0: fraction of correct boundaries
  feedback: string;
}

/**
 * Split a Thai string at the given cut positions.
 * Cut positions are indices into the character array (not byte positions).
 */
export function applySegmentCuts(raw: string, cuts: number[]): string[] {
  const chars = [...raw]; // spread handles multi-codepoint Thai chars correctly
  const sortedCuts = [...new Set(cuts)].sort((a, b) => a - b);

  const segments: string[] = [];
  let prev = 0;
  for (const cut of sortedCuts) {
    if (cut > 0 && cut < chars.length) {
      segments.push(chars.slice(prev, cut).join(""));
      prev = cut;
    }
  }
  segments.push(chars.slice(prev).join(""));
  return segments.filter((s) => s.length > 0);
}

/**
 * Compute the correct cut positions from a list of segments.
 */
export function segmentsToCuts(segments: string[]): number[] {
  const cuts: number[] = [];
  let pos = 0;
  for (let i = 0; i < segments.length - 1; i++) {
    pos += [...(segments[i] ?? "")].length;
    cuts.push(pos);
  }
  return cuts;
}

/**
 * Evaluate a player's segmentation attempt.
 */
export function evaluateSegmentation(
  attempt: SegmentAttempt,
  challenge: SegmentChallenge,
): SegmentResult {
  const playerSegments = applySegmentCuts(attempt.raw, attempt.cuts);
  const correctCuts = new Set(segmentsToCuts(challenge.correctSegments));
  const playerCuts = new Set(attempt.cuts.filter((c) => c > 0 && c < [...attempt.raw].length));

  // Jaccard score on cut sets
  const union = new Set([...correctCuts, ...playerCuts]);
  const intersection = new Set([...correctCuts].filter((c) => playerCuts.has(c)));
  const score = union.size === 0 ? 1 : intersection.size / union.size;

  const correct = score === 1 && playerSegments.length === challenge.correctSegments.length;
  const feedback = correct
    ? "Perfect! You can read Thai signs!"
    : `Almost! The correct split: ${challenge.correctSegments.join(" | ")}`;

  return { correct, playerSegments, correctSegments: challenge.correctSegments, score, feedback };
}

// ── Challenge pool ─────────────────────────────────────────────────────────────

export const SEGMENT_CHALLENGES: SegmentChallenge[] = [
  {
    id: "seg_001",
    raw: "ก๋วยเตี๋ยวเรือรสเด็ด",
    correctSegments: ["ก๋วยเตี๋ยว", "เรือ", "รส", "เด็ด"],
    hint: "A famous noodle boat dish",
    location: "pier",
  },
  {
    id: "seg_002",
    raw: "น้ำมะพร้าวสดใหม่",
    correctSegments: ["น้ำ", "มะพร้าว", "สด", "ใหม่"],
    hint: "Fresh coconut water",
    location: "fresh_market",
  },
  {
    id: "seg_003",
    raw: "ตลาดน้ำยามเช้า",
    correctSegments: ["ตลาด", "น้ำ", "ยาม", "เช้า"],
    hint: "Morning floating market",
    location: "floating_market",
  },
  {
    id: "seg_004",
    raw: "ข้าวผัดกระเพรา",
    correctSegments: ["ข้าว", "ผัด", "กระเพรา"],
    hint: "Basil fried rice",
    location: "fresh_market",
  },
  {
    id: "seg_005",
    raw: "วัดพระเจ้าองค์ใหญ่",
    correctSegments: ["วัด", "พระเจ้า", "องค์", "ใหญ่"],
    hint: "Temple of the great Lord",
    location: "temple",
  },
  {
    id: "seg_006",
    raw: "เรือหางยาวตลาดเก่า",
    correctSegments: ["เรือ", "หางยาว", "ตลาด", "เก่า"],
    hint: "Long-tail boat to the old market",
    location: "pier",
  },
  {
    id: "seg_007",
    raw: "ผลไม้สดตามฤดูกาล",
    correctSegments: ["ผลไม้", "สด", "ตาม", "ฤดูกาล"],
    hint: "Fresh seasonal fruit",
    location: "fresh_market",
  },
  {
    id: "seg_008",
    raw: "ถนนคนเดินตอนเย็น",
    correctSegments: ["ถนน", "คนเดิน", "ตอน", "เย็น"],
    hint: "Evening walking street",
    location: "night_market",
  },
];

export function getRandomChallenge(location?: string): SegmentChallenge {
  const pool = location
    ? SEGMENT_CHALLENGES.filter((c) => c.location === location)
    : SEGMENT_CHALLENGES;
  const src = pool.length > 0 ? pool : SEGMENT_CHALLENGES;
  const idx = Math.floor(Math.random() * src.length);
  return src[idx] ?? (SEGMENT_CHALLENGES[0] as SegmentChallenge);
}
