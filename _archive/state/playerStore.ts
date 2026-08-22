import { create } from "zustand";
import { clampPoliteness } from "../learning/thai/politenessSystem";

export type LocaleCode = "th" | "en" | "ja";

export interface LocalePair {
  /** The player's native language — UI and explanations use this. */
  l1: LocaleCode;
  /** The language being learned — NPCs speak this. */
  l2: Extract<LocaleCode, "ja" | "th">;
}

interface PlayerState {
  locale: LocalePair;
  playerName: string;
  /** Word IDs the player has learned well enough to count as "known" (for i+1 dialogue). */
  knownWordIds: Set<string>;
  /** Consecutive days played. Drives the sakura Streak Tree. */
  streakDays: number;
  /** Streak freezes held. Hard cap of 2 — see GDD §14.1. */
  winterWraps: number;
  /** Current overworld position — written by WorldScene, read by autosave. */
  playerCol: number;
  playerRow: number;
  currentMapId: string;
  /** 0–100. Raised by using ครับ/ค่ะ/นะคะ in dialogue; decays daily toward 50. */
  politenessScore: number;

  setLocale: (locale: LocalePair) => void;
  setPlayerName: (name: string) => void;
  markWordKnown: (wordId: string) => void;
  addWinterWrap: () => void;
  setWorldPosition: (col: number, row: number, mapId?: string) => void;
  addPoliteness: (delta: number) => void;
}

export const MAX_WINTER_WRAPS = 2;

export const usePlayerStore = create<PlayerState>((set) => ({
  locale: { l1: "th", l2: "ja" },
  playerName: "",
  knownWordIds: new Set<string>(),
  streakDays: 0,
  winterWraps: 0,
  playerCol: 14,
  playerRow: 10,
  currentMapId: "test_map",
  politenessScore: 50,

  setLocale: (locale) => set({ locale }),
  setPlayerName: (playerName) => set({ playerName }),

  markWordKnown: (wordId) =>
    set((state) => {
      const next = new Set(state.knownWordIds);
      next.add(wordId);
      return { knownWordIds: next };
    }),

  // Research indicates two freezes is the sweet spot; more forgiveness erodes the habit.
  addWinterWrap: () =>
    set((state) => ({
      winterWraps: Math.min(MAX_WINTER_WRAPS, state.winterWraps + 1),
    })),

  setWorldPosition: (col, row, mapId) =>
    set((state) => ({
      playerCol: col,
      playerRow: row,
      currentMapId: mapId ?? state.currentMapId,
    })),

  addPoliteness: (delta) =>
    set((state) => ({ politenessScore: clampPoliteness(state.politenessScore + delta) })),
}));
