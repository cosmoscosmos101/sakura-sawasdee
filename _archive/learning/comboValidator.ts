import type { Element } from "../content/schema";
import jaPatterns from "../content/ja/patterns.json";
import thPatterns from "../content/th/patterns.json";
import { validateLegacy } from "./comboValidatorLegacy";

/**
 * Sentence Combo validation — the signature mechanic (GDD §6.5).
 *
 * v2: pattern grammar matcher replaces the element-sequence FSM.
 * Each Kotodama now carries pos/tags/written from its VocabEntry,
 * enabling slot-role matching against the patterns/*.json library.
 *
 * Pure logic — must not import from src/game/ or src/ui/ (CLAUDE.md §4).
 */

export type Lang = "ja" | "th";

// ── Types ──────────────────────────────────────────────────────────────────

export interface ComboToken {
  id: string;
  element: Element;
  /** Populated from VocabEntry.pos when available. */
  pos?: string;
  tags?: string[];
  written?: string;
  register?: string;
}

export interface ComboIssue {
  code: string;
  severity: "soft" | "hard";
}

export interface ComboResult {
  valid: boolean;
  chainLength: number;
  multiplier: number;
  reason?: string;
  /** v2 fields — undefined when legacy path is taken */
  matchedPatternId?: string | null;
  completeness?: number;
  issues?: ComboIssue[];
  suggestion?: string;
}

// ── Multiplier ladder (CLAUDE.md §7) ─────────────────────────────────────

export function multiplierFor(chainLength: number): number {
  if (chainLength <= 1) return 1;
  if (chainLength === 2) return 1.5;
  if (chainLength === 3) return 2.0;
  if (chainLength === 4) return 2.8;
  if (chainLength === 5) return 3.5;
  return 4.5;
}

// ── Pattern types ──────────────────────────────────────────────────────────

interface PatternSlot {
  role: string;
  pos?: string[];
  literal?: string;
  optional: boolean;
}

interface Pattern {
  id: string;
  lang: string;
  sequence: PatternSlot[];
  semanticChecks: string[];
}

const JA_PATTERNS = jaPatterns as Pattern[];
const TH_PATTERNS = thPatterns as Pattern[];

// ── Slot matching ──────────────────────────────────────────────────────────

function slotMatches(token: ComboToken, slot: PatternSlot): boolean {
  if (slot.literal !== undefined) {
    return token.written === slot.literal;
  }
  if (slot.pos && token.pos !== undefined) {
    return slot.pos.includes(token.pos);
  }
  return false;
}

interface MatchResult {
  completeness: number;
  roles: Map<string, ComboToken>;
  tokensConsumed: number;
}

/**
 * Greedy linear slot matcher.
 * Walk slots in order. For each slot try to consume the current token.
 * On miss: advance slot pointer; token stays (retried against next slot).
 * Returns completeness ∈ [0, 1].
 */
function matchPattern(tokens: ComboToken[], pattern: Pattern): MatchResult {
  const roles = new Map<string, ComboToken>();
  let ti = 0;
  let si = 0;
  let requiredFilled = 0;
  let totalRequired = pattern.sequence.filter((s) => !s.optional).length;

  while (si < pattern.sequence.length && ti < tokens.length) {
    const slot = pattern.sequence[si];
    if (!slot) { si++; continue; }
    const token = tokens[ti];
    if (!token) { ti++; continue; }

    if (slotMatches(token, slot)) {
      roles.set(slot.role, token);
      if (!slot.optional) requiredFilled++;
      ti++;
      si++;
    } else if (slot.optional) {
      si++;
    } else {
      si++;
    }
  }

  if (totalRequired === 0) totalRequired = 1;
  const filled = requiredFilled / totalRequired;
  const coverage = ti / tokens.length;
  // Multiply so leftover unmatched tokens always penalise the score.
  const completeness = filled * coverage;

  return { completeness, roles, tokensConsumed: ti };
}

// ── Semantic checks ────────────────────────────────────────────────────────

const INANIMATE_TAGS = ["food", "object", "place", "abstract", "nature"];

function isInanimate(token: ComboToken): boolean {
  if (!token.tags) return false;
  return token.tags.some((t) => INANIMATE_TAGS.includes(t));
}

/**
 * animacy_subject: if the subject/topic role is filled by something tagged
 * inanimate AND an object (wo/object slot) is also present, flag it softly.
 * Example bad: すしは猫を食べます (sushi eats the cat).
 */
function checkAnimacySubject(roles: Map<string, ComboToken>): ComboIssue | null {
  const subject = roles.get("topic") ?? roles.get("subject");
  const hasObject = roles.has("object") || roles.has("wo");
  if (subject && hasObject && isInanimate(subject)) {
    return { code: "animacy_subject", severity: "soft" };
  }
  return null;
}

function runSemanticChecks(checks: string[], roles: Map<string, ComboToken>): ComboIssue[] {
  const issues: ComboIssue[] = [];
  for (const checkId of checks) {
    if (checkId === "animacy_subject") {
      const issue = checkAnimacySubject(roles);
      if (issue) issues.push(issue);
    }
  }
  return issues;
}

// ── Particle opener pre-check ──────────────────────────────────────────────

const PARTICLE_POS = new Set(["particle", "postposition", "conjunction"]);

function startsWithParticle(tokens: ComboToken[]): boolean {
  const first = tokens[0];
  return first?.pos !== undefined && PARTICLE_POS.has(first.pos);
}

// ── Main validator ─────────────────────────────────────────────────────────

const COMPLETENESS_THRESHOLD = 0.7;

export function validateCombo(tokens: ComboToken[], lang: Lang): ComboResult {
  const chainLength = tokens.length;

  if (chainLength === 0) {
    return { valid: false, chainLength: 0, multiplier: 1, reason: "empty_combo" };
  }

  if (chainLength === 1) {
    return { valid: true, chainLength: 1, multiplier: 1 };
  }

  // Legacy path: none of the tokens carry pos data → fall back to element FSM
  const hasPosData = tokens.some((t) => t.pos !== undefined);
  if (!hasPosData) {
    return validateLegacy(tokens, lang);
  }

  // Particle opener: a particle-first chain is invalid regardless of pattern
  if (startsWithParticle(tokens)) {
    return {
      valid: false, chainLength, multiplier: 1,
      reason: "cannot_open_with_particle",
      matchedPatternId: null, completeness: 0, issues: [],
    };
  }

  const patterns = lang === "ja" ? JA_PATTERNS : TH_PATTERNS;

  let bestScore = -1;
  let bestPattern: Pattern | null = null;
  let bestRoles = new Map<string, ComboToken>();

  for (const pattern of patterns) {
    const { completeness, roles } = matchPattern(tokens, pattern);
    if (completeness > bestScore) {
      bestScore = completeness;
      bestPattern = pattern;
      bestRoles = roles;
    }
  }

  if (!bestPattern || bestScore < COMPLETENESS_THRESHOLD) {
    return {
      valid: false, chainLength, multiplier: 1,
      reason: "no_pattern_match",
      matchedPatternId: null,
      completeness: bestScore < 0 ? 0 : bestScore,
      issues: [],
    };
  }

  const issues = runSemanticChecks(bestPattern.semanticChecks, bestRoles);
  const hasSoftIssue = issues.some((i) => i.severity === "soft");
  const hasHardIssue = issues.some((i) => i.severity === "hard");

  if (hasHardIssue) {
    const hardCode = issues.find((i) => i.severity === "hard")?.code;
    return {
      valid: false, chainLength, multiplier: 1,
      ...(hardCode !== undefined && { reason: hardCode }),
      matchedPatternId: bestPattern.id,
      completeness: bestScore,
      issues,
    };
  }

  let multiplier = multiplierFor(chainLength);
  if (hasSoftIssue) multiplier = Math.round(multiplier * 0.8 * 10) / 10;

  return {
    valid: true,
    chainLength,
    multiplier,
    matchedPatternId: bestPattern.id,
    completeness: bestScore,
    issues,
  };
}
