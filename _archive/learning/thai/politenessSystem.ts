/**
 * Politeness Meter — pure functions for detecting and scoring Thai
 * politeness markers (ครับ/ค่ะ/นะคะ) in player dialogue choices.
 *
 * Design goal: NPCs respond *warmer* when politeness is high, not *colder*
 * when it is low — consistent with Pillar 1 (Always Gentle).
 */

export type PolitenessLevel = "rude" | "neutral" | "polite" | "very_polite";

export interface PolitenessChange {
  delta: number;
  reason: string;
}

// ── Particle detection ────────────────────────────────────────────────────────

/**
 * Thai politeness particles and their base scores.
 * Longer forms must appear BEFORE shorter substrings they contain so that
 * "นะครับ" is consumed before the plain "ครับ" pattern can match it.
 */
const POLITENESS_MARKERS: { pattern: RegExp; delta: number; label: string }[] = [
  { pattern: /นะคะ/,   delta: +4, label: "นะคะ" },
  { pattern: /นะครับ/, delta: +4, label: "นะครับ" },
  { pattern: /ขอบคุณ/, delta: +2, label: "ขอบคุณ" },
  { pattern: /โปรด/,   delta: +2, label: "โปรด" },
  { pattern: /ค่ะ/,    delta: +3, label: "ค่ะ" },
  { pattern: /ครับ/,   delta: +3, label: "ครับ" },
];

/**
 * Analyse a player's Thai response string and return the politeness delta.
 * Matches are consumed left-to-right so a longer form (นะครับ) does not
 * double-count its shorter suffix (ครับ). Returns zero delta when no
 * markers are found (not a penalty).
 */
export function analysePoliteness(text: string): PolitenessChange {
  let total = 0;
  const found: string[] = [];
  let remaining = text;

  for (const { pattern, delta, label } of POLITENESS_MARKERS) {
    if (pattern.test(remaining)) {
      total += delta;
      found.push(label);
      // Replace the match so sub-patterns can't double-count it
      remaining = remaining.replace(pattern, " ");
    }
  }

  if (found.length === 0) {
    return { delta: 0, reason: "no politeness markers detected" };
  }
  return { delta: total, reason: `used: ${found.join(", ")}` };
}

// ── Level thresholds ──────────────────────────────────────────────────────────

export function getPolitenessLevel(score: number): PolitenessLevel {
  if (score >= 80) return "very_polite";
  if (score >= 50) return "polite";
  if (score >= 20) return "neutral";
  return "rude";
}

/** Human-readable label for the current level (in English). */
export const LEVEL_LABELS: Record<PolitenessLevel, string> = {
  very_polite: "Very Polite",
  polite:      "Polite",
  neutral:     "Neutral",
  rude:        "Blunt",
};

/** Colour for the politeness bar fill. */
export const LEVEL_COLOUR: Record<PolitenessLevel, string> = {
  very_polite: "#C9B8F0", // LAVENDER_3
  polite:      "#C8F2E0", // MINT_2
  neutral:     "#F5E3C8", // CREAM_3
  rude:        "#F7A8C4", // SAKURA_3 — intentionally soft, not alarming
};

// ── NPC response tier ─────────────────────────────────────────────────────────

/**
 * Maps politeness level to a dialogue tier tag.
 * NPC dialogue JSON can include `"politeness": "warm"` to filter which
 * lines appear at each tier.
 */
export function getDialogueTier(score: number): "warm" | "normal" | "cool" {
  if (score >= 65) return "warm";
  if (score >= 30) return "normal";
  return "cool";
}

// ── Decay ─────────────────────────────────────────────────────────────────────

/** Daily natural decay towards neutral (50). Call once per session start. */
export function decayPoliteness(current: number): number {
  const target = 50;
  const decayRate = 0.05; // 5% move toward neutral per day
  return Math.round(current + (target - current) * decayRate);
}

// ── Clamp ─────────────────────────────────────────────────────────────────────

export function clampPoliteness(score: number): number {
  return Math.max(0, Math.min(100, score));
}
