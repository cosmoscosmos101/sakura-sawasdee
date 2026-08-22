import { create } from "zustand";
import { eventBus } from "./eventBus";
import { loadProfile, saveProfile } from "../data/db";
import { makeDailyQuests, levelFromExp, expForLevel, type DailyQuest } from "../learning/questSystem";

export interface QuestProgress {
  date: string;
  progress: [number, number, number];
  completed: [boolean, boolean, boolean];
}

interface QuestStoreState {
  exp: number;
  level: number;
  quests: DailyQuest[];
  questProgress: QuestProgress;
  initialized: boolean;

  init: () => Promise<void>;
  addExp: (amount: number) => Promise<void>;
  incrementQuest: (questIndex: number) => Promise<void>;
}

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function freshProgress(date: string): QuestProgress {
  return { date, progress: [0, 0, 0], completed: [false, false, false] };
}

export const useQuestStore = create<QuestStoreState>((set, get) => ({
  exp: 0,
  level: 1,
  quests: makeDailyQuests(),
  questProgress: freshProgress(todayDate()),
  initialized: false,

  async init() {
    if (get().initialized) return;
    set({ initialized: true });

    const profile = await loadProfile();
    const today = todayDate();
    const stored = profile?.questProgress;
    const questProgress = stored?.date === today ? stored : freshProgress(today);
    const exp = profile?.exp ?? 0;

    set({ exp, level: levelFromExp(exp), questProgress, quests: makeDailyQuests() });

    eventBus.on("battle:end", ({ won, xpGained }) => {
      if (!won) return;
      // Sequential: quest completion may itself award EXP — await to avoid stale read
      void (async () => {
        await get().incrementQuest(0); // "defeat monsters" (may grant bonus EXP first)
        await get().addExp(xpGained);  // base 30 EXP for the win
      })();
    });
    eventBus.on("battle:correct_answer", () => {
      void get().incrementQuest(1); // "answer correctly"
    });
    eventBus.on("battle:combo_done", () => {
      void get().incrementQuest(2); // "execute combo"
    });
  },

  async addExp(amount: number) {
    const newExp = get().exp + amount;
    const newLevel = levelFromExp(newExp);
    set({ exp: newExp, level: newLevel });
    await saveProfile({ exp: newExp, level: newLevel });
  },

  async incrementQuest(questIndex: number) {
    const { questProgress, quests } = get();
    const quest = quests[questIndex];
    if (!quest || questProgress.completed[questIndex]) return;

    const idx = questIndex as 0 | 1 | 2;
    const newProgress: [number, number, number] = [...questProgress.progress] as [number, number, number];
    newProgress[idx] = Math.min((newProgress[idx] ?? 0) + 1, quest.goal);

    const newCompleted: [boolean, boolean, boolean] = [...questProgress.completed] as [boolean, boolean, boolean];
    const justCompleted = (newProgress[idx] ?? 0) >= quest.goal;
    if (justCompleted) newCompleted[idx] = true;

    const updated: QuestProgress = { ...questProgress, progress: newProgress, completed: newCompleted };
    set({ questProgress: updated });

    // Bonus EXP is awarded separately from the base battle win EXP
    if (justCompleted) await get().addExp(quest.reward);

    await saveProfile({ questProgress: updated });
  },
}));

/** Convenience selector: progress 0–1 for the EXP bar inside the current level */
export function selectLevelProgress(state: QuestStoreState): number {
  const lo = expForLevel(state.level);
  const hi = expForLevel(state.level + 1);
  return hi > lo ? (state.exp - lo) / (hi - lo) : 1;
}
