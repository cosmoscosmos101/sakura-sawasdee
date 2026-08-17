/**
 * Thai handwriting recognition — stroke path comparison.
 * Uses discrete Fréchet distance on normalised point sequences to score
 * how closely the player's drawn stroke matches the template.
 *
 * Pure functions — no UI or Phaser dependencies.
 */

export interface Point { x: number; y: number }

export interface Stroke {
  points: Point[];
  /** For template strokes: which part of the character this stroke draws. */
  label?: string;
}

export interface HandwritingChallenge {
  id: string;
  character: string;    // Thai character
  romanized: string;
  meaning: string;
  strokes: Stroke[];    // Template strokes in [0,1]×[0,1] space
  /** index of the correct starting point among stroke[0].points */
  headLoopStart?: number;
}

export interface HandwritingResult {
  score: number;        // 0.0 – 1.0
  correct: boolean;
  feedback: string;
}

// ── Geometry helpers ──────────────────────────────────────────────────────────

function dist(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/** Resample a stroke to exactly n evenly-spaced points. */
export function resampleStroke(points: Point[], n: number): Point[] {
  if (points.length === 0) return [];
  if (points.length === 1) return Array.from({ length: n }, () => ({ ...points[0]! }));

  // Build cumulative arc lengths
  const lens: number[] = [0];
  for (let i = 1; i < points.length; i++) {
    lens.push(lens[i - 1]! + dist(points[i - 1]!, points[i]!));
  }
  const total = lens[lens.length - 1]!;
  if (total === 0) return Array.from({ length: n }, () => ({ ...points[0]! }));

  const result: Point[] = [];
  for (let i = 0; i < n; i++) {
    const target = (i / (n - 1)) * total;
    // Binary-search the correct segment
    let lo = 0, hi = lens.length - 2;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if ((lens[mid + 1] ?? 0) < target) lo = mid + 1;
      else hi = mid;
    }
    const segStart = lens[lo]!;
    const segEnd = lens[lo + 1]!;
    const t = segEnd === segStart ? 0 : (target - segStart) / (segEnd - segStart);
    const a = points[lo]!;
    const b = points[lo + 1] ?? points[lo]!;
    result.push({ x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) });
  }
  return result;
}

/** Normalise a stroke's bounding box to [0,1]×[0,1]. */
export function normaliseStroke(points: Point[]): Point[] {
  if (points.length === 0) return [];
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  const scale = Math.max(rangeX, rangeY);
  return points.map((p) => ({
    x: (p.x - minX) / scale,
    y: (p.y - minY) / scale,
  }));
}

const RESAMPLE_N = 32;

/**
 * Discrete Fréchet distance between two resampled, normalised strokes.
 * Lower = more similar. Returns a value in [0, √2].
 */
export function frechetDistance(a: Point[], b: Point[]): number {
  const ra = resampleStroke(normaliseStroke(a), RESAMPLE_N);
  const rb = resampleStroke(normaliseStroke(b), RESAMPLE_N);
  const n = RESAMPLE_N;

  // dp[i][j] = min bottle-neck coupling distance for ra[0..i], rb[0..j]
  const dp: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(Infinity));
  dp[0]![0] = dist(ra[0]!, rb[0]!);
  for (let i = 1; i < n; i++) dp[i]![0] = Math.max(dp[i - 1]![0]!, dist(ra[i]!, rb[0]!));
  for (let j = 1; j < n; j++) dp[0]![j] = Math.max(dp[0]![j - 1]!, dist(ra[0]!, rb[j]!));
  for (let i = 1; i < n; i++) {
    for (let j = 1; j < n; j++) {
      dp[i]![j] = Math.max(
        dist(ra[i]!, rb[j]!),
        Math.min(dp[i - 1]![j]!, dp[i]![j - 1]!, dp[i - 1]![j - 1]!),
      );
    }
  }
  return dp[n - 1]![n - 1]!;
}

/**
 * Score a drawn stroke against the template.
 * Returns 0–1 where 1 = perfect match.
 */
export function scoreStroke(drawn: Point[], template: Point[]): number {
  if (drawn.length < 3) return 0;
  const fd = frechetDistance(drawn, template);
  // Normalise: fd of 0 → 1.0, fd of 0.4+ → 0.0 (empirical threshold)
  const score = Math.max(0, 1 - fd / 0.4);
  return Math.round(score * 100) / 100;
}

/**
 * Evaluate a full character attempt (one or more strokes).
 */
export function evaluateHandwriting(
  drawnStrokes: Point[][],
  challenge: HandwritingChallenge,
): HandwritingResult {
  const templateStrokes = challenge.strokes;
  const n = Math.min(drawnStrokes.length, templateStrokes.length);
  if (n === 0) return { score: 0, correct: false, feedback: "Draw the character!" };

  let total = 0;
  for (let i = 0; i < n; i++) {
    total += scoreStroke(drawnStrokes[i]!, templateStrokes[i]!.points);
  }
  const score = total / templateStrokes.length;
  const correct = score >= 0.65;
  const feedback = correct
    ? "สวยมาก! Beautiful stroke!"
    : score >= 0.4
    ? "Almost — follow the guide line closely."
    : "Try again — start from the dot and follow the arrow.";

  return { score: Math.round(score * 100) / 100, correct, feedback };
}

// ── Challenge pool ─────────────────────────────────────────────────────────────
// Template strokes are authored in [0,1]×[0,1] normalised space.
// Each point set traces the canonical stroke path for the character.

export const HANDWRITING_CHALLENGES: HandwritingChallenge[] = [
  {
    id: "hw_ก",
    character: "ก",
    romanized: "k",
    meaning: "chicken (mid-class consonant)",
    strokes: [
      {
        label: "body",
        points: [
          { x: 0.35, y: 0.20 }, { x: 0.60, y: 0.20 }, { x: 0.65, y: 0.35 },
          { x: 0.55, y: 0.55 }, { x: 0.35, y: 0.65 }, { x: 0.20, y: 0.65 },
          { x: 0.15, y: 0.50 }, { x: 0.20, y: 0.35 }, { x: 0.35, y: 0.20 },
        ],
      },
      {
        label: "tail",
        points: [
          { x: 0.65, y: 0.35 }, { x: 0.80, y: 0.55 }, { x: 0.75, y: 0.75 }, { x: 0.55, y: 0.85 },
        ],
      },
    ],
    headLoopStart: 0,
  },
  {
    id: "hw_ข",
    character: "ข",
    romanized: "kh",
    meaning: "egg (high-class consonant)",
    strokes: [
      {
        label: "body",
        points: [
          { x: 0.30, y: 0.25 }, { x: 0.55, y: 0.20 }, { x: 0.70, y: 0.35 },
          { x: 0.65, y: 0.55 }, { x: 0.45, y: 0.65 }, { x: 0.25, y: 0.60 },
          { x: 0.20, y: 0.45 }, { x: 0.30, y: 0.25 },
        ],
      },
      {
        label: "ascender",
        points: [
          { x: 0.55, y: 0.20 }, { x: 0.60, y: 0.10 }, { x: 0.70, y: 0.08 },
        ],
      },
    ],
    headLoopStart: 0,
  },
  {
    id: "hw_ค",
    character: "ค",
    romanized: "kh",
    meaning: "person (low-class consonant)",
    strokes: [
      {
        label: "body",
        points: [
          { x: 0.25, y: 0.30 }, { x: 0.50, y: 0.20 }, { x: 0.70, y: 0.30 },
          { x: 0.72, y: 0.55 }, { x: 0.55, y: 0.70 }, { x: 0.30, y: 0.72 },
          { x: 0.18, y: 0.58 }, { x: 0.20, y: 0.40 }, { x: 0.35, y: 0.30 },
        ],
      },
    ],
  },
  {
    id: "hw_ง",
    character: "ง",
    romanized: "ng",
    meaning: "snake (low-class consonant)",
    strokes: [
      {
        label: "curve",
        points: [
          { x: 0.55, y: 0.20 }, { x: 0.70, y: 0.35 }, { x: 0.65, y: 0.55 },
          { x: 0.45, y: 0.65 }, { x: 0.25, y: 0.60 }, { x: 0.20, y: 0.40 },
          { x: 0.35, y: 0.25 }, { x: 0.55, y: 0.20 },
          { x: 0.70, y: 0.30 }, { x: 0.80, y: 0.50 }, { x: 0.70, y: 0.80 }, { x: 0.45, y: 0.88 },
        ],
      },
    ],
    headLoopStart: 0,
  },
  {
    id: "hw_จ",
    character: "จ",
    romanized: "ch",
    meaning: "plate (mid-class consonant)",
    strokes: [
      {
        label: "hook",
        points: [
          { x: 0.60, y: 0.20 }, { x: 0.70, y: 0.30 }, { x: 0.65, y: 0.55 },
          { x: 0.45, y: 0.65 }, { x: 0.25, y: 0.58 }, { x: 0.20, y: 0.40 },
          { x: 0.30, y: 0.25 }, { x: 0.50, y: 0.20 },
        ],
      },
      {
        label: "base",
        points: [
          { x: 0.20, y: 0.72 }, { x: 0.75, y: 0.72 },
        ],
      },
    ],
  },
];
