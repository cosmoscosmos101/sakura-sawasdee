import { create } from "zustand";
import type { VocabEntry } from "../content/schema";
import type { Question, L1 } from "../learning/questionGenerator";
import { generateQuestion, questionTypeForEncounter } from "../learning/questionGenerator";
import type { ComboToken, ComboResult } from "../learning/comboValidator";
import { validateCombo } from "../learning/comboValidator";
import { eventBus } from "./eventBus";
import { db, type SrsCard, type AlbumEntry } from "../data/db";
import { usePlayerStore } from "./playerStore";
import { createCard, reviewCard as srsReview, type AnswerOutcome } from "../learning/srs";

export type BossGimmick = "katakana_only" | "counter_only" | "keigo_only";

export type BattlePhase =
  | "idle"
  | "command"
  | "question"
  | "result"
  | "combo"
  | "victory"
  | "defeat";

export interface BattleKotodama {
  vocabEntry: VocabEntry;
  encounterCount: number; // how many times this Kotodama has been used
  sentThisTurn: boolean;
}

export interface LastResult {
  correct: boolean;
  damage: number;
  timingMs: number;
  timingTier: "critical" | "normal" | "slow";
}

interface BattleState {
  phase: BattlePhase;
  enemyId: string;
  enemyHp: number;
  enemyMaxHp: number;
  playerHp: number;
  playerMaxHp: number;
  party: BattleKotodama[]; // always 4
  activeIndex: number; // which party slot is currently answering
  chain: ComboToken[];
  currentQuestion: Question | null;
  lastResult: LastResult | null;
  comboResult: ComboResult | null;
  l1: L1;
  bossGimmick: BossGimmick | null;

  startBattle(enemyId: string, pool: VocabEntry[], l1: L1, bossGimmick?: BossGimmick | null, bossMaxHp?: number): void;
  sendKotodama(index: number): void;
  submitAnswer(choiceIndex: number, timingMs: number): void;
  proceedFromResult(): void;
  executeCombo(): void;
  flee(): void;
  endBattle(): void;
}

async function persistSrsReview(vocabId: string, outcome: AnswerOutcome): Promise<void> {
  const existing = await db.srsCards.get(vocabId);
  const card: SrsCard = existing ?? { ...createCard(vocabId), vocabId };
  const updated = srsReview(card, outcome);
  await db.srsCards.put({ ...updated, vocabId });
}

const BASE_DAMAGE = 10;
const ENEMY_DAMAGE_PER_TURN = 4;
const ENEMY_MAX_HP = 30;
const PLAYER_MAX_HP = 40;
const WRONG_ANSWER_HP_LOSS = 2; // 5% of 40

function timingTier(ms: number): "critical" | "normal" | "slow" {
  if (ms <= 3000) return "critical";
  if (ms <= 8000) return "normal";
  return "slow";
}

function timingMultiplier(tier: "critical" | "normal" | "slow"): number {
  if (tier === "critical") return 2.0;
  if (tier === "slow") return 0.7;
  return 1.0;
}

export const useBattleStore = create<BattleState>((set, get) => ({
  phase: "idle",
  enemyId: "",
  enemyHp: ENEMY_MAX_HP,
  enemyMaxHp: ENEMY_MAX_HP,
  playerHp: PLAYER_MAX_HP,
  playerMaxHp: PLAYER_MAX_HP,
  party: [],
  activeIndex: -1,
  chain: [],
  currentQuestion: null,
  lastResult: null,
  comboResult: null,
  l1: "th",
  bossGimmick: null,

  startBattle(enemyId, pool, l1, bossGimmick, bossMaxHp) {
    const enemyMax = bossMaxHp ?? ENEMY_MAX_HP;
    const partyEntries = pool.slice(0, 4);
    const party: BattleKotodama[] = partyEntries.map((e) => ({
      vocabEntry: e,
      encounterCount: 0,
      sentThisTurn: false,
    }));
    set({
      phase: "command",
      enemyId,
      enemyHp: enemyMax,
      enemyMaxHp: enemyMax,
      playerHp: PLAYER_MAX_HP,
      playerMaxHp: PLAYER_MAX_HP,
      party,
      activeIndex: -1,
      chain: [],
      currentQuestion: null,
      lastResult: null,
      comboResult: null,
      l1,
      bossGimmick: bossGimmick ?? null,
    });
  },

  sendKotodama(index) {
    const { party, phase, l1, bossGimmick } = get();
    if (phase !== "command") return;
    const slot = party.at(index);
    if (!slot || slot.sentThisTurn) return;

    // Build a pool of all party vocab for distractor generation
    const vocabPool = party.map((k) => k.vocabEntry);
    const qType = bossGimmick === "katakana_only"
      ? "script_reading" as const
      : questionTypeForEncounter(slot.encounterCount);
    const question = generateQuestion(qType, slot.vocabEntry, vocabPool, l1);

    set({ phase: "question", activeIndex: index, currentQuestion: question });
  },

  submitAnswer(choiceIndex, timingMs) {
    const { currentQuestion, activeIndex, party, chain, enemyHp, playerHp, l1 } = get();
    if (!currentQuestion) return;

    const correct = choiceIndex === currentQuestion.correctIndex;
    const tier = timingTier(timingMs);
    const mult = timingMultiplier(tier);
    const damage = correct ? Math.round(BASE_DAMAGE * mult) : 0;

    // Persist SRS review — fire and forget, does not block the UI
    const srsOutcome: AnswerOutcome =
      !correct ? "incorrect" :
      tier === "critical" ? "critical" :
      tier === "slow" ? "assisted" : "correct";
    void persistSrsReview(currentQuestion.vocabId, srsOutcome);

    const newEnemyHp = Math.max(0, enemyHp - damage);
    const newPlayerHp = correct
      ? Math.max(0, playerHp - ENEMY_DAMAGE_PER_TURN)
      : Math.max(0, playerHp - ENEMY_DAMAGE_PER_TURN - WRONG_ANSWER_HP_LOSS);

    // Add to sentence chain
    const slot = party.at(activeIndex);
    const newChain: ComboToken[] = slot
      ? [...chain, { id: slot.vocabEntry.id, element: slot.vocabEntry.element }]
      : chain;

    // Mark Kotodama as sent this turn
    const newParty = party.map((k, i) =>
      i === activeIndex
        ? { ...k, sentThisTurn: true, encounterCount: k.encounterCount + 1 }
        : k,
    );

    // Emit effect for Phaser to animate
    eventBus.emit("battle:effect", {
      type: correct ? (tier === "critical" ? "critical" : "damage") : "miss",
      amount: damage,
    });

    const lastResult: LastResult = { correct, damage, timingMs, timingTier: tier };

    // Check win/lose conditions
    if (newEnemyHp === 0) {
      set({ phase: "result", enemyHp: 0, playerHp: newPlayerHp, chain: newChain, party: newParty, lastResult, currentQuestion: null, l1 });
      return;
    }
    if (newPlayerHp === 0) {
      set({ phase: "result", playerHp: 0, enemyHp: newEnemyHp, chain: newChain, party: newParty, lastResult, currentQuestion: null, l1 });
      return;
    }

    set({ phase: "result", enemyHp: newEnemyHp, playerHp: newPlayerHp, chain: newChain, party: newParty, lastResult, currentQuestion: null, l1 });
  },

  proceedFromResult() {
    const { enemyHp, playerHp } = get();
    if (enemyHp === 0) { get().endBattle(); return; }
    if (playerHp === 0) { set({ phase: "defeat" }); return; }

    const allSent = get().party.every((k) => k.sentThisTurn);
    if (allSent) {
      // Auto-trigger combo when all 4 Kotodama have gone
      get().executeCombo();
      return;
    }
    set({ phase: "command", lastResult: null });
  },

  executeCombo() {
    const { chain, l1, enemyHp } = get();
    if (chain.length === 0) {
      set({ phase: "command" });
      return;
    }

    // Determine the language from l1 — the L2 being learned
    const combLang = l1 === "th" ? "ja" : "th";
    const result = validateCombo(chain, combLang);

    if (result.valid && result.multiplier > 1) {
      const comboDamage = Math.round(BASE_DAMAGE * result.multiplier);
      const newHp = Math.max(0, enemyHp - comboDamage);
      eventBus.emit("battle:effect", { type: "combo", amount: comboDamage });
      // Save to Sentence Album (fire-and-forget)
      const { party } = get();
      const wordById = new Map(party.map((k) => [k.vocabEntry.id, k.vocabEntry.written]));
      const sentence = chain.map((t) => wordById.get(t.id) ?? t.id).join("");
      const entry: AlbumEntry = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        sentence,
        words: chain.map((t) => t.id),
        mapId: usePlayerStore.getState().currentMapId,
        createdAt: Date.now(),
        comboLength: chain.length,
        multiplier: result.multiplier,
      };
      void db.sentenceAlbum.add(entry);
      set({ comboResult: result, enemyHp: newHp, phase: "combo" });
    } else {
      set({ comboResult: result, phase: "combo" });
    }
  },

  flee() {
    eventBus.emit("battle:end", { won: false, xpGained: 0 });
    set({ phase: "idle", chain: [], party: [], currentQuestion: null });
  },

  endBattle() {
    const won = get().enemyHp === 0;
    eventBus.emit("battle:end", { won, xpGained: won ? 30 : 0 });
    set({ phase: won ? "victory" : "defeat" });
  },
}));
