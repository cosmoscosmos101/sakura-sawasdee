import { toDateString } from "./streakManager";

export type OmikujiFortune = "大吉" | "中吉" | "小吉" | "末吉" | "凶";
export type DailyBuff =
  | "xp_boost"       // ×1.5 spirit XP
  | "easy_questions" // softer question types until midnight
  | "extra_encounter"// +1 Kotodama per area
  | "rare_spawn"     // rare forms appear more often
  | "bonus_xp";      // ×1.1 (凶's silver lining — always gentle)

export type DailyQuestId =
  | "catch_3"    // catch 3 wild Kotodama
  | "correct_10" // answer 10 questions correctly
  | "combo_3"    // build a 3-word sentence combo
  | "win_2"      // win 2 battles without fleeing
  | "bloom_find";// find a Bloom-element Kotodama

export interface OmikujiResult {
  fortune: OmikujiFortune;
  buff: DailyBuff;
  questId: DailyQuestId;
  drawnAt: string; // "YYYY-MM-DD"
}

// ── Weighted draw ────────────────────────────────────────────────────────────

// Weights approximate traditional shrine distributions (凶 is rare but real)
const WEIGHTS: [OmikujiFortune, number][] = [
  ["大吉", 17],
  ["中吉", 30],
  ["小吉", 35],
  ["末吉", 10],
  ["凶",    8],
];
const TOTAL_WEIGHT = WEIGHTS.reduce((s, [, w]) => s + w, 0);

export function drawFortune(rng: () => number = Math.random): OmikujiFortune {
  let n = rng() * TOTAL_WEIGHT;
  for (const [fortune, weight] of WEIGHTS) {
    n -= weight;
    if (n < 0) return fortune;
  }
  return "小吉"; // fallback (unreachable in practice)
}

// ── Buff & quest derivation ───────────────────────────────────────────────────

export const FORTUNE_BUFF: Record<OmikujiFortune, DailyBuff> = {
  "大吉": "xp_boost",
  "中吉": "easy_questions",
  "小吉": "extra_encounter",
  "末吉": "rare_spawn",
  "凶":   "bonus_xp",
};

// Two quests per fortune — alternate by day-of-year parity for variety
const FORTUNE_QUESTS: Record<OmikujiFortune, [DailyQuestId, DailyQuestId]> = {
  "大吉": ["combo_3",    "correct_10"],
  "中吉": ["correct_10", "catch_3"],
  "小吉": ["catch_3",    "bloom_find"],
  "末吉": ["bloom_find", "win_2"],
  "凶":   ["win_2",      "combo_3"],
};

export function fortuneQuest(fortune: OmikujiFortune, dayIndex: number): DailyQuestId {
  return dayIndex % 2 === 0 ? FORTUNE_QUESTS[fortune][0] : FORTUNE_QUESTS[fortune][1];
}

// ── Player-facing copy ───────────────────────────────────────────────────────

export const FORTUNE_LABEL: Record<OmikujiFortune, string> = {
  "大吉": "Great Blessing",
  "中吉": "Good Fortune",
  "小吉": "Small Luck",
  "末吉": "Uncertain Path",
  "凶":   "A Trial Ahead",
};

export const FORTUNE_POEM: Record<OmikujiFortune, string> = {
  "大吉": "The sakura blooms bright — all things open to you today.",
  "中吉": "A steady wind carries words to where they need to go.",
  "小吉": "Small steps still move forward. Quiet effort bears fruit.",
  "末吉": "The path bends, but bending paths still lead somewhere.",
  "凶":   "Even storms water the roots. Today's hardship is tomorrow's bloom.",
};

export const BUFF_LABEL: Record<DailyBuff, string> = {
  xp_boost:        "Spirit XP ×1.5 all day",
  easy_questions:  "Gentler questions until midnight",
  extra_encounter: "+1 Kotodama encounter per area",
  rare_spawn:      "Rare Kotodama appear more often",
  bonus_xp:        "Spirit XP ×1.1 — small but sure",
};

export const QUEST_LABEL: Record<DailyQuestId, string> = {
  catch_3:    "Catch 3 wild Kotodama today",
  correct_10: "Answer 10 questions correctly",
  combo_3:    "Build a 3-word Sentence Combo",
  win_2:      "Win 2 battles without fleeing",
  bloom_find: "Find a Bloom 🌸 Kotodama",
};

// ── Main API ─────────────────────────────────────────────────────────────────

/** Returns true if the player has not yet drawn today. */
export function canDraw(lastDrawnDate: string | undefined, nowMs: number): boolean {
  return lastDrawnDate !== toDateString(nowMs);
}

/** Draw today's fortune. Pass a custom rng for deterministic tests. */
export function drawOmikuji(nowMs: number, rng?: () => number): OmikujiResult {
  const today = toDateString(nowMs);
  const fortune = drawFortune(rng);
  const dayIndex = Math.floor(nowMs / 86_400_000);
  return {
    fortune,
    buff: FORTUNE_BUFF[fortune],
    questId: fortuneQuest(fortune, dayIndex),
    drawnAt: today,
  };
}
