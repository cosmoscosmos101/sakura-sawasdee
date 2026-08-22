import type { Element } from "../content/schema";
import type { ComboToken, ComboResult, Lang } from "./comboValidator";
import { multiplierFor } from "./comboValidator";

/**
 * Legacy element-FSM path for ComboTokens that carry no pos field.
 * Kept separate to respect the 300-line cap (CLAUDE.md §4).
 */

const JA_TRANSITIONS: Record<Element, Element[]> = {
  bloom: ["echo", "spark", "bloom"],
  echo: ["bloom", "spark", "flow"],
  flow: ["bloom", "spark"],
  spark: [],
  stone: ["bloom", "echo", "flow", "spark", "stone"],
  light: [],
};

const TH_TRANSITIONS: Record<Element, Element[]> = {
  bloom: ["spark", "flow", "echo", "bloom"],
  spark: ["bloom", "flow", "echo"],
  flow: ["bloom", "echo", "light"],
  echo: ["bloom", "spark"],
  stone: ["bloom", "spark", "flow", "echo", "stone"],
  light: [],
};

const VALID_OPENERS: Record<Lang, Element[]> = {
  ja: ["bloom", "flow", "stone", "light"],
  th: ["bloom", "flow", "stone", "light"],
};

export function validateLegacy(tokens: ComboToken[], lang: Lang): ComboResult {
  const chainLength = tokens.length;
  const first = tokens[0];
  if (!first) return { valid: false, chainLength, multiplier: 1, reason: "empty_combo" };

  if (!VALID_OPENERS[lang].includes(first.element)) {
    return { valid: false, chainLength, multiplier: 1, reason: `cannot_open_with_${first.element}` };
  }

  const transitions = lang === "ja" ? JA_TRANSITIONS : TH_TRANSITIONS;
  for (let i = 0; i < tokens.length - 1; i++) {
    const cur = tokens[i];
    const nxt = tokens[i + 1];
    if (!cur || !nxt) continue;
    if (!transitions[cur.element].includes(nxt.element)) {
      return { valid: false, chainLength, multiplier: 1, reason: `${cur.element}_cannot_precede_${nxt.element}` };
    }
  }

  return { valid: true, chainLength, multiplier: multiplierFor(chainLength) };
}
