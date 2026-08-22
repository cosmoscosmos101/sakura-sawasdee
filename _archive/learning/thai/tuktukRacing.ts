/**
 * Tuk-tuk Racing — reading-fluency minigame logic.
 * Player sees their destination in Thai at the top; at each intersection
 * three signs appear (left / straight / right) in Thai — pick the one
 * that matches the destination before time runs out.
 *
 * Pure functions — no UI or Phaser dependencies.
 */

export type Direction = "left" | "straight" | "right";

export interface RoadSign {
  thai: string;
  romanized: string;
  meaning: string;
}

export interface Intersection {
  destination: RoadSign;
  choices: [RoadSign, RoadSign, RoadSign]; // left, straight, right
  correctDir: Direction;
}

export interface RaceResult {
  correct: boolean;
  reactionMs: number;
  wpm: number; // estimated words-per-minute for this sign
}

// ── Sign pool ─────────────────────────────────────────────────────────────────

export const ROAD_SIGNS: RoadSign[] = [
  { thai: "วัด",            romanized: "wat",           meaning: "temple" },
  { thai: "ตลาดสด",         romanized: "talàat sòt",    meaning: "fresh market" },
  { thai: "ท่าเรือ",         romanized: "thâa ruea",     meaning: "pier" },
  { thai: "โรงพยาบาล",      romanized: "rong phayaabaan", meaning: "hospital" },
  { thai: "โรงเรียน",       romanized: "rong rian",     meaning: "school" },
  { thai: "สนามบิน",         romanized: "sanaam bin",    meaning: "airport" },
  { thai: "โรงแรม",         romanized: "rong raem",     meaning: "hotel" },
  { thai: "ร้านอาหาร",      romanized: "ráan aahǎan",   meaning: "restaurant" },
  { thai: "สวนสาธารณะ",     romanized: "sǔan sǎatharana", meaning: "park" },
  { thai: "ตลาดนัด",        romanized: "talàat nát",    meaning: "night market" },
  { thai: "ธนาคาร",         romanized: "thanaakaan",    meaning: "bank" },
  { thai: "สถานีตำรวจ",     romanized: "sathǎanii tamrùat", meaning: "police station" },
  { thai: "ไปรษณีย์",       romanized: "praisanii",     meaning: "post office" },
  { thai: "สถานีรถไฟ",      romanized: "sathǎanii rót fai", meaning: "train station" },
  { thai: "ชายหาด",         romanized: "chaai hàat",    meaning: "beach" },
  { thai: "ร้านสะดวกซื้อ",  romanized: "ráan sadùak súue", meaning: "convenience store" },
];

const DIRECTIONS: Direction[] = ["left", "straight", "right"];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

/**
 * Generate one intersection. The destination appears in one of the three
 * direction slots; the other two slots are filled with different wrong signs.
 */
export function generateIntersection(): Intersection {
  const [dest, wrong1, wrong2] = shuffle(ROAD_SIGNS).slice(0, 3) as [RoadSign, RoadSign, RoadSign];
  const correctDir = pickRandom(DIRECTIONS);

  const wrongPool = [wrong1, wrong2];
  let wi = 0;
  const choices = (["left", "straight", "right"] as const).map((d) =>
    d === correctDir ? dest : wrongPool[wi++]!
  ) as [RoadSign, RoadSign, RoadSign];

  return { destination: dest, choices, correctDir };
}

/**
 * Score a single intersection attempt.
 * wpm is an estimate based on Thai character count / reaction time.
 */
export function scoreAttempt(
  intersection: Intersection,
  chosenDir: Direction,
  reactionMs: number,
): RaceResult {
  const correct = chosenDir === intersection.correctDir;
  const charCount = [...intersection.destination.thai].length;
  const wpm = correct ? Math.round((charCount / Math.max(reactionMs, 100)) * 60_000 / 5) : 0;
  return { correct, reactionMs, wpm };
}

/**
 * Timer budget in ms for one intersection.
 * Starts at 4 s; each correct answer shaves 150 ms (min 1.5 s).
 */
export function timerBudget(streakLength: number): number {
  return Math.max(1500, 4000 - streakLength * 150);
}

/**
 * Aggregate WPM for a completed run.
 * Uses only correct attempts with real reaction times.
 */
export function aggregateWpm(results: RaceResult[]): number {
  const correct = results.filter((r) => r.correct && r.reactionMs > 0);
  if (correct.length === 0) return 0;
  const avg = correct.reduce((s, r) => s + r.wpm, 0) / correct.length;
  return Math.round(avg);
}

/**
 * Human-readable fluency band.
 */
export function fluencyBand(wpm: number): { label: string; colour: string } {
  if (wpm >= 120) return { label: "Fluent", colour: "#C8F2E0" };
  if (wpm >= 80)  return { label: "Proficient", colour: "#FFE08A" };
  if (wpm >= 40)  return { label: "Developing", colour: "#FFD9E8" };
  return             { label: "Beginner", colour: "#E0D7FF" };
}
