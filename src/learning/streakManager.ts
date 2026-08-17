export interface StreakUpdate {
  streakDays: number;
  winterWraps: number;
  /** Calendar days missed (0 = streak extended today) */
  missedDays: number;
  usedWinterWrap: boolean;
}

/** Full calendar days between two unix-ms timestamps. */
export function daysBetween(earlierMs: number, laterMs: number): number {
  return Math.floor((laterMs - earlierMs) / 86_400_000);
}

/**
 * Visual blossom stage for the Streak Tree.
 * 0=bare, 1=bud, 2=bloom, 3=full bloom, 4=radiant
 */
export function streakStage(days: number): 0 | 1 | 2 | 3 | 4 {
  if (days <= 0) return 0;
  if (days <= 2) return 1;
  if (days <= 6) return 2;
  if (days <= 29) return 3;
  return 4;
}

/**
 * Compute the new streak state when the player opens the game.
 *
 * Rules:
 * - gap 0   : already played today — no change
 * - gap 1   : consecutive day — streak increments
 * - gap 2, winter wrap available — wrap consumed, streak still increments
 * - gap 2–6 : streak stalls (petals fall / leaves yellow at 3+)
 * - gap 7+  : 7 days elapsed without play — streak resets to 1
 *
 * @param lastPlayedMs  Unix ms of last session (0 = first ever session)
 * @param nowMs         Unix ms of current moment
 * @param currentDays   Streak before this session
 * @param currentWraps  Winter wraps held (max 2)
 * @param isWinter      Whether the current real-world month is winter (Dec–Feb)
 */
export function updateStreak(
  lastPlayedMs: number,
  nowMs: number,
  currentDays: number,
  currentWraps: number,
  isWinter: boolean,
): StreakUpdate {
  if (lastPlayedMs === 0) {
    return { streakDays: 1, winterWraps: currentWraps, missedDays: 0, usedWinterWrap: false };
  }

  const gap = daysBetween(lastPlayedMs, nowMs);

  if (gap === 0) {
    return { streakDays: currentDays, winterWraps: currentWraps, missedDays: 0, usedWinterWrap: false };
  }

  if (gap === 1) {
    return { streakDays: currentDays + 1, winterWraps: currentWraps, missedDays: 0, usedWinterWrap: false };
  }

  // 7+ days elapsed → reset
  if (gap >= 7) {
    return { streakDays: 1, winterWraps: currentWraps, missedDays: gap - 1, usedWinterWrap: false };
  }

  // Exactly 1 missed day + winter wrap → absorb the miss
  if (gap === 2 && isWinter && currentWraps > 0) {
    return {
      streakDays: currentDays + 1,
      winterWraps: currentWraps - 1,
      missedDays: 0,
      usedWinterWrap: true,
    };
  }

  // Streak stalls (gap 2–6, no wrap or gap > 2)
  return { streakDays: currentDays, winterWraps: currentWraps, missedDays: gap - 1, usedWinterWrap: false };
}

/** "YYYY-MM-DD" string for a given unix-ms timestamp (local time). */
export function toDateString(ms: number): string {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
