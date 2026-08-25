import type { VocabEntry } from "../content/schema";

/**
 * Battle-drill frequency (Hiragana Forbidden Speech):
 * words you already know appear less often; shaky words keep showing up.
 *
 * Encounter rate is a 5-notch slider. Index 0 = no random drills.
 */

export const ENCOUNTER_CHANCES = [0, 0.15, 0.4, 0.7, 1] as const;
export type EncounterRateIndex = 0 | 1 | 2 | 3 | 4;

export function encounterChance(index: EncounterRateIndex): number {
  return ENCOUNTER_CHANCES[index];
}

export function bumpEncounterRate(
  current: EncounterRateIndex,
  delta: 1 | -1,
): EncounterRateIndex {
  const next = Math.min(4, Math.max(0, current + delta));
  return next as EncounterRateIndex;
}

/**
 * Higher mastery → lower weight. Known words still appear (so they don't
 * vanish) but at about a third of the rate of unknown ones.
 */
export function battleWeight(known: boolean, reps: number): number {
  if (!known) return 1.2;
  const mastery = Math.min(1, reps / 8);
  return 0.35 + (1 - mastery) * 0.4;
}

/**
 * Weighted sample without replacement. If the pool is smaller than `count`,
 * returns the whole pool shuffled.
 */
export function pickWeightedParty(
  pool: readonly VocabEntry[],
  count: number,
  knownWordIds: ReadonlySet<string>,
  repsById: ReadonlyMap<string, number>,
  rng: () => number = Math.random,
): VocabEntry[] {
  if (pool.length === 0 || count <= 0) return [];

  const remaining = pool.map((entry) => ({
    entry,
    weight: battleWeight(knownWordIds.has(entry.id), repsById.get(entry.id) ?? 0),
  }));

  const picked: VocabEntry[] = [];
  const n = Math.min(count, remaining.length);

  for (let i = 0; i < n; i++) {
    const total = remaining.reduce((sum, row) => sum + row.weight, 0);
    let dart = rng() * total;
    let chosen = remaining.length - 1;
    for (let j = 0; j < remaining.length; j++) {
      dart -= remaining[j]!.weight;
      if (dart <= 0) {
        chosen = j;
        break;
      }
    }
    const row = remaining.splice(chosen, 1)[0];
    if (row) picked.push(row.entry);
  }

  return picked;
}
