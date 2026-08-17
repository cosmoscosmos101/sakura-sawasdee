import Dexie, { type Table } from "dexie";
import type { LocalePair } from "../state/playerStore";
import { eventBus } from "../state/eventBus";

// ── Table row types ──────────────────────────────────────────────────────────

export interface PlayerProfile {
  id: 1; // singleton row
  name: string;
  locale: LocalePair;
  createdAt: number; // unix ms
  lastPlayed: number;
  streakDays: number;
  winterWraps: number;
  /** "YYYY-MM-DD" strings for each day the player opened the game (used by Streak Tree heatmap). */
  playDates?: string[];
  /** "YYYY-MM-DD" of the most recent omikuji draw (undefined = never drawn). */
  omikujiDate?: string;
  /** Fortune drawn today, e.g. "大吉". */
  omikujiFortune?: string;
  /** Daily quest identifier for today. */
  omikujiQuestId?: string;
}

export interface KotodamaRecord {
  /** Matches VocabEntry.id */
  vocabId: string;
  caughtAt: number;
  encounterCount: number;
  combosExecuted: number;
}

/** Serialisable FSRS card state — matches the subset used by ts-fsrs. */
export interface SrsCard {
  vocabId: string;
  due: number; // unix ms
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  state: number; // 0=New 1=Learning 2=Review 3=Relearning
  lastReview: number; // unix ms, 0 = never
}

export interface WorldState {
  id: 1; // singleton row
  mapId: string;
  playerCol: number;
  playerRow: number;
  kotodamaDefeated: string[]; // vocabIds
  tutorialStep: number; // 0 = not started
}

export type FontSize = "sm" | "md" | "lg";

export interface Settings {
  id: 1; // singleton row
  bgmVolume: number; // 0–1
  sfxVolume: number; // 0–1
  voiceVolume: number; // 0–1
  ambientVolume: number; // 0–1
  showReading: boolean;
  showTranslation: boolean;
  reducedMotion: boolean;
  colorblind: boolean;
  typewriterEffect: boolean;
  fontSize: FontSize;
}

// ── Defaults ─────────────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS: Settings = {
  id: 1,
  bgmVolume: 0.7,
  sfxVolume: 0.8,
  voiceVolume: 1.0,
  ambientVolume: 0.4,
  showReading: true,
  showTranslation: true,
  reducedMotion: false,
  colorblind: false,
  typewriterEffect: true,
  fontSize: "md",
};

export const DEFAULT_WORLD_STATE: WorldState = {
  id: 1,
  mapId: "test_map",
  playerCol: 14,
  playerRow: 10,
  kotodamaDefeated: [],
  tutorialStep: 0,
};

export interface AlbumEntry {
  /** Unique id — unix-ms string keeps sort order. */
  id: string;
  /** Written forms joined, e.g. "私はすしを食べます". */
  sentence: string;
  /** VocabIds in combo order. */
  words: string[];
  mapId: string;
  createdAt: number;
  comboLength: number;
  multiplier: number;
}

export interface PlacedFurniture {
  itemId: string;
  col: number;
  row: number;
}

export interface RoomState {
  id: 1;
  /** Grid furniture — one entry per occupied cell. */
  placed: PlacedFurniture[];
  /** Exactly 6 slots; empty string = unassigned. */
  displayCase: string[];
}

export const DEFAULT_ROOM_STATE: RoomState = {
  id: 1,
  placed: [],
  displayCase: ["", "", "", "", "", ""],
};

// ── Database class ───────────────────────────────────────────────────────────

export interface AnalyticsEvent {
  id: string;       // uuid-like: `${ts}-${Math.random()}`
  type: string;
  data: Record<string, unknown>;
  ts: number;       // unix ms
}

class SakuraSawasdeeDexie extends Dexie {
  playerProfile!: Table<PlayerProfile, number>;
  kotodamaCollection!: Table<KotodamaRecord, string>;
  srsCards!: Table<SrsCard, string>;
  worldState!: Table<WorldState, number>;
  settings!: Table<Settings, number>;
  roomState!: Table<RoomState, number>;
  sentenceAlbum!: Table<AlbumEntry, string>;
  analyticsEvents!: Table<AnalyticsEvent, string>;

  constructor() {
    super("sakura_sawasdee");

    this.version(1).stores({
      playerProfile: "id",
      kotodamaCollection: "vocabId, caughtAt",
      srsCards: "vocabId, due, state",
      worldState: "id",
      settings: "id",
    });

    // v2: room decoration table
    this.version(2).stores({ roomState: "id" });

    // v3: sentence combo journal
    this.version(3).stores({ sentenceAlbum: "id, createdAt" });

    // v4: privacy-first local analytics
    this.version(4).stores({ analyticsEvents: "id, type, ts" });
  }
}

export const db = new SakuraSawasdeeDexie();

// ── Save / load helpers ──────────────────────────────────────────────────────

export async function loadSettings(): Promise<Settings> {
  const stored = await db.settings.get(1);
  return { ...DEFAULT_SETTINGS, ...(stored ?? {}) } as Settings;
}

export async function saveSettings(partial: Partial<Omit<Settings, "id">>): Promise<void> {
  const current = await loadSettings();
  await db.settings.put({ ...current, ...partial, id: 1 });
}

export async function loadWorldState(): Promise<WorldState> {
  return (await db.worldState.get(1)) ?? { ...DEFAULT_WORLD_STATE };
}

export async function saveWorldState(partial: Partial<Omit<WorldState, "id">>): Promise<void> {
  const current = await loadWorldState();
  await db.worldState.put({ ...current, ...partial, id: 1 });
}

export async function loadProfile(): Promise<PlayerProfile | undefined> {
  return db.playerProfile.get(1);
}

export async function saveProfile(partial: Partial<Omit<PlayerProfile, "id">>): Promise<void> {
  const existing = await loadProfile();
  const base: PlayerProfile = existing ?? {
    id: 1,
    name: "",
    locale: { l1: "th", l2: "ja" },
    createdAt: Date.now(),
    lastPlayed: Date.now(),
    streakDays: 0,
    winterWraps: 0,
    playDates: [],
  };
  await db.playerProfile.put({ ...base, ...partial, id: 1, lastPlayed: Date.now() });
}

export async function recordKotodamaCaught(vocabId: string): Promise<void> {
  const existing = await db.kotodamaCollection.get(vocabId);
  if (existing) {
    await db.kotodamaCollection.update(vocabId, {
      encounterCount: existing.encounterCount + 1,
    });
  } else {
    await db.kotodamaCollection.put({
      vocabId,
      caughtAt: Date.now(),
      encounterCount: 1,
      combosExecuted: 0,
    });
  }
}

export async function loadRoomState(): Promise<RoomState> {
  return (await db.roomState.get(1)) ?? { ...DEFAULT_ROOM_STATE };
}

export async function saveRoomState(partial: Partial<Omit<RoomState, "id">>): Promise<void> {
  const current = await loadRoomState();
  await db.roomState.put({ ...current, ...partial, id: 1 });
}

// ── Autosave ─────────────────────────────────────────────────────────────────

type WorldStateGetter = () => Omit<WorldState, "id">;

/**
 * Start autosave: persists world state every 30 seconds and on every map change.
 * Returns a cleanup function — call it on app unmount.
 */
export function startAutosave(getWorldState: WorldStateGetter): () => void {
  const persist = () => void saveWorldState(getWorldState());

  const interval = window.setInterval(persist, 30_000);
  const offMap = eventBus.on("map:change", persist);
  const offBattleEnd = eventBus.on("battle:end", persist);

  return () => {
    clearInterval(interval);
    offMap();
    offBattleEnd();
  };
}
