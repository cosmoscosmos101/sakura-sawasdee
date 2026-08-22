export type QuestType = "defeat_monsters" | "correct_answers" | "execute_combo";

export interface DailyQuest {
  id: string;
  type: QuestType;
  label: string;
  labelTh: string;
  goal: number;
  reward: number; // EXP
  icon: string;
}

const DAILY_QUESTS: DailyQuest[] = [
  {
    id: "defeat_monsters",
    type: "defeat_monsters",
    label: "Defeat 3 monsters",
    labelTh: "กำจัดมอนสเตอร์ 3 ตัว",
    goal: 3,
    reward: 50,
    icon: "⚔️",
  },
  {
    id: "correct_answers",
    type: "correct_answers",
    label: "Answer 10 questions correctly",
    labelTh: "ตอบคำถามถูก 10 ข้อ",
    goal: 10,
    reward: 30,
    icon: "💬",
  },
  {
    id: "execute_combo",
    type: "execute_combo",
    label: "Execute a Sentence Combo",
    labelTh: "ใช้ Sentence Combo สำเร็จ",
    goal: 1,
    reward: 20,
    icon: "✨",
  },
];

export function makeDailyQuests(): DailyQuest[] {
  return DAILY_QUESTS;
}

/** Level 1 = 0 EXP, Level 2 = 50 EXP, Level 3 = 200 EXP, Level n = 50*(n-1)^2 */
export function levelFromExp(exp: number): number {
  return Math.floor(Math.sqrt(exp / 50)) + 1;
}

export function expForLevel(level: number): number {
  return 50 * (level - 1) ** 2;
}
