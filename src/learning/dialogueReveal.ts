import type { DialogueLine } from "../content/schema";

/**
 * Mild-immersion dialogue (Hiragana Forbidden Speech).
 *
 * Adaptive: a line stays in L1 until every tagged token is known.
 * Gradual reveal: L2 → reading → L1 translation, one layer per keypress.
 * Max L2: skip the known-word gate (New Game+ / second playthrough).
 */

export type DialogueMode = "adaptive" | "max_l2";
export type RevealLayer = "l2" | "reading" | "translation";

export function lineTokenIds(line: DialogueLine): string[] {
  return line.tokenIds ?? line.newWordIds ?? [];
}

/**
 * HFS rule: do not show the sentence in L2 unless every tagged word is known.
 * Untagged flavour lines (no tokens) always show L2 — they carry no quiz vocab.
 */
export function shouldShowL2(
  tokenIds: readonly string[],
  knownWordIds: ReadonlySet<string>,
  mode: DialogueMode,
): boolean {
  if (mode === "max_l2") return true;
  if (tokenIds.length === 0) return true;
  return tokenIds.every((id) => knownWordIds.has(id));
}

export function initialLayer(showL2: boolean, gradual: boolean): RevealLayer {
  if (!showL2) return "translation";
  if (!gradual) return "translation";
  return "l2";
}

/** Advance one HFS reveal step. `done` means the next keypress should change line. */
export function nextRevealLayer(
  current: RevealLayer,
  hasReading: boolean,
): RevealLayer | "done" {
  if (current === "l2") return hasReading ? "reading" : "translation";
  if (current === "reading") return "translation";
  return "done";
}

export function isFullyRevealed(layer: RevealLayer, gradual: boolean): boolean {
  if (!gradual) return true;
  return layer === "translation";
}

export function visibleReading(line: DialogueLine, layer: RevealLayer, showL2: boolean): boolean {
  return showL2 && Boolean(line.reading) && (layer === "reading" || layer === "translation");
}

export function visibleTranslation(layer: RevealLayer): boolean {
  return layer === "translation";
}
