import type { Element } from "../content/schema";

/**
 * Sentence Combo validation — the signature mechanic (GDD §6.5).
 *
 * Pure logic. This module must never import from src/game/ or src/ui/ (CLAUDE.md §4).
 *
 * The rule set is deliberately grammatical rather than arbitrary: chaining
 * elements in a valid order IS producing a valid sentence skeleton, so the
 * player internalises word order without being taught a rule.
 */

export type Lang = "ja" | "th";

export interface ComboResult {
  valid: boolean;
  chainLength: number;
  multiplier: number;
  /** Present only when invalid — a short, kind explanation for the player. */
  reason?: string;
}

/** Multipliers by chain length. See CLAUDE.md §7. */
export function multiplierFor(chainLength: number): number {
  if (chainLength <= 1) return 1;
  if (chainLength === 2) return 1.5;
  if (chainLength === 3) return 2.0;
  if (chainLength === 4) return 2.8;
  if (chainLength === 5) return 3.5;
  return 4.5;
}

/**
 * Which elements may legally follow a given element.
 *
 * Japanese is particle-marked and verb-final:
 *   NOUN は NOUN を VERB   →  bloom echo bloom echo spark
 * Modifiers precede their head, so flow (adjective) may precede bloom (noun).
 */
const JA_TRANSITIONS: Record<Element, Element[]> = {
  bloom: ["echo", "spark", "bloom"], // noun → particle (or compound noun, or verb in casual speech)
  echo: ["bloom", "spark", "flow"], // particle → next phrase or the verb
  flow: ["bloom", "spark"], // adjective modifies a noun, or ends the clause
  spark: [], // verb is final in Japanese — nothing follows
  stone: ["bloom", "echo", "flow", "spark", "stone"], // characters compose into anything
  light: [], // a set phrase stands alone
};

/**
 * Thai is SVO and head-initial: modifiers FOLLOW their noun.
 *   PRON VERB NOUN PREP NOUN  →  bloom spark bloom echo bloom
 */
const TH_TRANSITIONS: Record<Element, Element[]> = {
  bloom: ["spark", "flow", "echo", "bloom"], // noun → verb, or a following modifier
  spark: ["bloom", "flow", "echo"], // verb → object or manner
  flow: ["bloom", "echo", "light"], // adjective follows its noun, then may close
  echo: ["bloom", "spark"], // preposition/classifier → its complement
  stone: ["bloom", "spark", "flow", "echo", "stone"],
  light: [], // polite particle (ครับ/ค่ะ) closes the sentence
};

/** A sentence must begin with something that can open a clause. */
const VALID_OPENERS: Record<Lang, Element[]> = {
  ja: ["bloom", "flow", "stone", "light"],
  th: ["bloom", "flow", "stone", "light"],
};

export interface ComboToken {
  id: string;
  element: Element;
}

/**
 * Validate an ordered sequence of Kotodama as a sentence skeleton.
 *
 * A broken chain is never punished (Pillar 1, Always Gentle) — the player
 * simply loses the multiplier and gets told why in one friendly line.
 */
export function validateCombo(tokens: ComboToken[], lang: Lang): ComboResult {
  const chainLength = tokens.length;

  if (chainLength === 0) {
    return { valid: false, chainLength: 0, multiplier: 1, reason: "empty_combo" };
  }

  if (chainLength === 1) {
    // A single word is always a legal (if unexciting) play.
    return { valid: true, chainLength: 1, multiplier: 1 };
  }

  const first = tokens[0];
  if (!first) {
    return { valid: false, chainLength, multiplier: 1, reason: "empty_combo" };
  }

  if (!VALID_OPENERS[lang].includes(first.element)) {
    return {
      valid: false,
      chainLength,
      multiplier: 1,
      reason: `cannot_open_with_${first.element}`,
    };
  }

  const transitions = lang === "ja" ? JA_TRANSITIONS : TH_TRANSITIONS;

  for (let i = 0; i < tokens.length - 1; i++) {
    const current = tokens[i];
    const next = tokens[i + 1];
    if (!current || !next) continue;

    const allowed = transitions[current.element];
    if (!allowed.includes(next.element)) {
      return {
        valid: false,
        chainLength,
        multiplier: 1,
        reason: `${current.element}_cannot_precede_${next.element}`,
      };
    }
  }

  return { valid: true, chainLength, multiplier: multiplierFor(chainLength) };
}
