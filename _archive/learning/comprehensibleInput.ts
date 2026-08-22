import type { DialogueNode } from "../content/schema";

/**
 * Comprehensible-input selector (Krashen i+1 principle).
 *
 * Selects dialogue nodes where 85–97% of words are already in the player's
 * known-word set. Words outside that band will be new — enough to teach, not
 * enough to confuse. Falls back to the closest ratio if nothing qualifies.
 */

const TARGET_MIN = 0.85;
const TARGET_MAX = 0.97;

export interface RatedNode {
  node: DialogueNode;
  knownRatio: number;
  newWordIds: string[];
}

/**
 * Tokenise a dialogue node into word IDs it references.
 * We rely on the structured `newWordIds` field rather than raw text splitting,
 * which would require a full tokeniser per language.
 */
function collectWordIds(node: DialogueNode): string[] {
  const ids: string[] = [];
  for (const line of node.lines) {
    for (const id of line.newWordIds ?? []) ids.push(id);
  }
  return ids;
}

/**
 * Rate a dialogue node against the player's known word set.
 * Returns the ratio of known words and which ones are new.
 *
 * Lines that have no `newWordIds` are treated as 100% known
 * (they carry no teachable vocabulary).
 */
export function rateNode(node: DialogueNode, knownWordIds: ReadonlySet<string>): RatedNode {
  const referenced = collectWordIds(node);
  if (referenced.length === 0) return { node, knownRatio: 1, newWordIds: [] };

  const newWordIds = referenced.filter((id) => !knownWordIds.has(id));
  const knownRatio = 1 - newWordIds.length / referenced.length;
  return { node, knownRatio, newWordIds };
}

/**
 * From a list of dialogue nodes, return those in the comprehensible input window
 * (85–97% known). If none qualify, return the closest single node — always
 * preferring slightly too easy over significantly too hard.
 */
export function selectComprehensibleNodes(
  nodes: DialogueNode[],
  knownWordIds: ReadonlySet<string>,
): RatedNode[] {
  const rated = nodes.map((n) => rateNode(n, knownWordIds));
  const inRange = rated.filter(
    (r) => r.knownRatio >= TARGET_MIN && r.knownRatio <= TARGET_MAX,
  );
  if (inRange.length > 0) return inRange;

  rated.sort((a, b) => {
    const da = distanceFromWindow(a.knownRatio);
    const db = distanceFromWindow(b.knownRatio);
    if (da !== db) return da - db;
    return b.knownRatio - a.knownRatio;
  });
  return rated.slice(0, 1);
}

function distanceFromWindow(ratio: number): number {
  if (ratio < TARGET_MIN) return TARGET_MIN - ratio;
  if (ratio > TARGET_MAX) return ratio - TARGET_MAX;
  return 0;
}

/**
 * Pick one dialogue node that introduces exactly the next word IDs in `queue`.
 * Used to gate NPC conversations to the player's current lesson sequence.
 *
 * Returns `null` if no node in the candidates introduces any queued word.
 */
export function pickNodeForNextWords(
  nodes: DialogueNode[],
  knownWordIds: ReadonlySet<string>,
  wordQueue: string[],
): RatedNode | null {
  const targetIds = new Set(wordQueue);
  const rated = nodes
    .map((n) => rateNode(n, knownWordIds))
    .filter((r) => r.newWordIds.some((id) => targetIds.has(id)));

  if (rated.length === 0) return null;

  rated.sort((a, b) => {
    const aTarget = a.newWordIds.filter((id) => targetIds.has(id)).length;
    const bTarget = b.newWordIds.filter((id) => targetIds.has(id)).length;
    return bTarget - aTarget;
  });

  return rated[0] ?? null;
}
