import { create } from "zustand";
import {
  loadSettings,
  saveSettings,
  type DialogueMode,
  type EncounterRateIndex,
  type ReadingMode,
} from "../data/db";
import { bumpEncounterRate } from "../learning/vocabMastery";

interface SettingsState {
  hydrated: boolean;
  dialogueMode: DialogueMode;
  readingMode: ReadingMode;
  encounterRate: EncounterRateIndex;
  gradualReveal: boolean;
  hydrate: () => Promise<void>;
  setDialogueMode: (mode: DialogueMode) => void;
  setReadingMode: (mode: ReadingMode) => void;
  setEncounterRate: (rate: EncounterRateIndex) => void;
  bumpEncounter: (delta: 1 | -1) => EncounterRateIndex;
  setGradualReveal: (on: boolean) => void;
}

function persist(partial: Parameters<typeof saveSettings>[0]): void {
  void saveSettings(partial);
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  hydrated: false,
  dialogueMode: "adaptive",
  readingMode: "auto",
  encounterRate: 2,
  gradualReveal: true,

  async hydrate() {
    const stored = await loadSettings();
    set({
      hydrated: true,
      dialogueMode: stored.dialogueMode,
      readingMode: stored.readingMode,
      encounterRate: stored.encounterRate,
      gradualReveal: stored.gradualReveal,
    });
  },

  setDialogueMode(dialogueMode) {
    set({ dialogueMode });
    persist({ dialogueMode });
  },

  setReadingMode(readingMode) {
    set({ readingMode });
    persist({ readingMode });
  },

  setEncounterRate(encounterRate) {
    set({ encounterRate });
    persist({ encounterRate });
  },

  bumpEncounter(delta) {
    const encounterRate = bumpEncounterRate(get().encounterRate, delta);
    set({ encounterRate });
    persist({ encounterRate });
    return encounterRate;
  },

  setGradualReveal(gradualReveal) {
    set({ gradualReveal });
    persist({ gradualReveal });
  },
}));
