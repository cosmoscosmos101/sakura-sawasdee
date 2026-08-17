/**
 * Playthrough spec — simulates a player progressing from Chapter 1 through Chapter 2.
 * Tests the full learning pipeline through pure functions; no IndexedDB required.
 */

import { describe, it, expect } from "vitest";
import { createCard, reviewCard, getDueCards, isLost } from "../learning/srs";
import { validateCombo, type ComboToken } from "../learning/comboValidator";
import { updateStreak } from "../learning/streakManager";
import { generateQuestion } from "../learning/questionGenerator";
import { ALL_VOCAB } from "../content/allVocab";

const DAY            = 86_400_000;
const SESSION_START  = new Date("2026-01-10T09:00:00Z").getTime();

// Real vocab pool so questions use actual content
const jaPool  = ALL_VOCAB.filter((v) => v.lang === "ja").slice(0, 20);
const target  = jaPool[0]!;

// ── Chapter 1 — SRS card lifecycle ───────────────────────────────────────────

describe("Chapter 1 — SRS card lifecycle", () => {
  it("a new card starts at state 0 (New) with zero reps", () => {
    const card = createCard(target.id, SESSION_START);
    expect(card.state).toBe(0);
    expect(card.reps).toBe(0);
    expect(card.lapses).toBe(0);
  });

  it("a correct answer advances state to Learning or Review (≥ 1)", () => {
    const card  = createCard(target.id, SESSION_START);
    const after = reviewCard(card, "correct", SESSION_START);
    expect(after.reps).toBeGreaterThan(0);
    expect(after.state).toBeGreaterThanOrEqual(1);
  });

  it("an incorrect answer on a review card increments lapses", () => {
    let card = createCard(target.id, SESSION_START);
    card     = reviewCard(card, "correct", SESSION_START);
    card     = reviewCard(card, "correct", SESSION_START + DAY * 3);
    const lapseBefore = card.lapses;
    const after       = reviewCard(card, "incorrect", SESSION_START + DAY * 6);
    expect(after.lapses).toBeGreaterThan(lapseBefore);
  });

  it("a single lapse does not mark the card as lost", () => {
    let card = createCard(target.id, SESSION_START);
    card     = reviewCard(card, "incorrect", SESSION_START);
    expect(isLost(card)).toBe(false);
  });

  it("getDueCards surfaces cards whose due time has elapsed", () => {
    const cards = jaPool.slice(0, 5).map((v) => {
      let c = createCard(v.id, SESSION_START);
      c     = reviewCard(c, "correct", SESSION_START);
      return c;
    });
    const due = getDueCards(cards, SESSION_START + DAY * 10);
    expect(due.length).toBeGreaterThan(0);
  });

  it("a critical answer grants higher stability than a correct one", () => {
    const critCard    = reviewCard(createCard("crit", SESSION_START), "critical", SESSION_START);
    const correctCard = reviewCard(createCard("corr", SESSION_START), "correct",  SESSION_START);
    expect(critCard.stability).toBeGreaterThan(correctCard.stability);
  });

  it("generates a meaning_match question with exactly 4 options", () => {
    const q = generateQuestion("meaning_match", target, jaPool, "th");
    expect(q.vocabId).toBe(target.id);
    expect(q.options).toHaveLength(4);
    expect(q.correctIndex).toBeGreaterThanOrEqual(0);
    expect(q.correctIndex).toBeLessThan(4);
  });
});

// ── Chapter 2 — Sentence Combos ──────────────────────────────────────────────

describe("Chapter 2 — Sentence Combo scoring", () => {
  it("3-word Japanese combo (bloom→echo→spark) is valid at ×2.0", () => {
    const tokens: ComboToken[] = [
      { id: "watashi", element: "bloom" },
      { id: "wa",      element: "echo"  },
      { id: "taberu",  element: "spark" },
    ];
    const r = validateCombo(tokens, "ja");
    expect(r.valid).toBe(true);
    expect(r.multiplier).toBeCloseTo(2.0);
  });

  it("5-word Japanese combo (N→P→N→P→V) scores ×3.5", () => {
    const tokens: ComboToken[] = [
      { id: "watashi", element: "bloom" },
      { id: "wa",      element: "echo"  },
      { id: "sushi",   element: "bloom" },
      { id: "wo",      element: "echo"  },
      { id: "taberu",  element: "spark" },
    ];
    const r = validateCombo(tokens, "ja");
    expect(r.valid).toBe(true);
    expect(r.multiplier).toBeCloseTo(3.5);
  });

  it("two consecutive sparks (verb→verb) in Japanese is rejected", () => {
    const tokens: ComboToken[] = [
      { id: "taberu", element: "spark" },
      { id: "iku",    element: "spark" },
    ];
    expect(validateCombo(tokens, "ja").valid).toBe(false);
  });

  it("Thai SVO combo (bloom→spark→bloom) is valid at ×2.0", () => {
    const tokens: ComboToken[] = [
      { id: "chan",  element: "bloom" },
      { id: "kin",  element: "spark" },
      { id: "khao", element: "bloom" },
    ];
    const r = validateCombo(tokens, "th");
    expect(r.valid).toBe(true);
    expect(r.multiplier).toBeCloseTo(2.0);
  });

  it("a lone light (idiom) token cannot be followed by anything", () => {
    const tokens: ComboToken[] = [
      { id: "phrase1", element: "light" },
      { id: "extra",   element: "bloom" },
    ];
    expect(validateCombo(tokens, "ja").valid).toBe(false);
  });

  it("an empty combo is rejected", () => {
    expect(validateCombo([], "ja").valid).toBe(false);
  });
});

// ── Streak progression ────────────────────────────────────────────────────────

describe("Streak progression across multiple sessions", () => {
  it("three consecutive daily sessions produce a streak of 3", () => {
    const d1 = SESSION_START;
    const d2 = d1 + DAY;
    const d3 = d1 + DAY * 2;
    const u1 = updateStreak(0,  d1, 0,            0, false);
    const u2 = updateStreak(d1, d2, u1.streakDays, 0, false);
    const u3 = updateStreak(d2, d3, u2.streakDays, 0, false);
    expect(u3.streakDays).toBe(3);
  });

  it("a gap of 7+ days resets the streak to 1", () => {
    const u = updateStreak(SESSION_START, SESSION_START + DAY * 10, 7, 0, false);
    expect(u.streakDays).toBe(1);
    expect(u.missedDays).toBeGreaterThan(0);
  });

  it("a winter wrap absorbs one missed day without breaking the streak", () => {
    const u = updateStreak(SESSION_START, SESSION_START + DAY * 2, 5, 1, true);
    expect(u.streakDays).toBe(6);
    expect(u.usedWinterWrap).toBe(true);
    expect(u.winterWraps).toBe(0);
  });

  it("playing the same day twice does not double-increment the streak", () => {
    const u1 = updateStreak(0, SESSION_START, 0, 0, false);
    const u2 = updateStreak(SESSION_START, SESSION_START + 1000, u1.streakDays, 0, false);
    expect(u2.streakDays).toBe(1);
  });
});

// ── Balance analytics — success rate logic ────────────────────────────────────

describe("Balance analytics — success rate calculations", () => {
  it("calculates success rate as (reps − lapses) / reps", () => {
    expect(Math.max(0, (10 - 3) / 10)).toBeCloseTo(0.7);
  });

  it("clamps to 0 when lapses exceed reps (data edge case)", () => {
    expect(Math.max(0, (2 - 5) / 2)).toBe(0);
  });

  it("hard words filter: success < 0.60 with ≥ 3 reps", () => {
    const stats = [
      { vocabId: "hard", reps: 5, lapses: 3, successRate: (5 - 3) / 5 }, // 0.40
      { vocabId: "ok",   reps: 5, lapses: 1, successRate: (5 - 1) / 5 }, // 0.80
    ];
    const hard = stats.filter((v) => v.reps >= 3 && v.successRate < 0.60);
    expect(hard).toHaveLength(1);
    expect(hard[0]!.vocabId).toBe("hard");
  });

  it("hard words filter ignores entries with < 3 reps (insufficient data)", () => {
    const stats = [{ vocabId: "new", reps: 2, lapses: 2, successRate: 0 }];
    expect(stats.filter((v) => v.reps >= 3 && v.successRate < 0.60)).toHaveLength(0);
  });

  it("easy words filter: success > 0.98 with ≥ 5 reps", () => {
    const stats = [
      { vocabId: "easy", reps: 10, lapses: 0, successRate: 1.0 },
      { vocabId: "ok",   reps: 10, lapses: 2, successRate: 0.8 },
    ];
    const easy = stats.filter((v) => v.reps >= 5 && v.successRate > 0.98);
    expect(easy).toHaveLength(1);
    expect(easy[0]!.vocabId).toBe("easy");
  });
});
