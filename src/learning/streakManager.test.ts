import { describe, it, expect } from "vitest";
import { updateStreak, streakStage, daysBetween, toDateString } from "./streakManager";

const DAY = 86_400_000;
const now = new Date("2026-08-16T10:00:00Z").getTime();

// ── daysBetween ──────────────────────────────────────────────────────────────

describe("daysBetween", () => {
  it("same moment → 0", () => expect(daysBetween(now, now)).toBe(0));
  it("23h59m later → 0", () => expect(daysBetween(now, now + DAY - 1)).toBe(0));
  it("exactly 1 day later → 1", () => expect(daysBetween(now, now + DAY)).toBe(1));
  it("6 days later → 6", () => expect(daysBetween(now, now + 6 * DAY)).toBe(6));
  it("7 days later → 7", () => expect(daysBetween(now, now + 7 * DAY)).toBe(7));
});

// ── streakStage ──────────────────────────────────────────────────────────────

describe("streakStage", () => {
  it("0 days → bare (0)",        () => expect(streakStage(0)).toBe(0));
  it("1 day  → bud  (1)",        () => expect(streakStage(1)).toBe(1));
  it("2 days → bud  (1)",        () => expect(streakStage(2)).toBe(1));
  it("3 days → bloom (2)",       () => expect(streakStage(3)).toBe(2));
  it("6 days → bloom (2)",       () => expect(streakStage(6)).toBe(2));
  it("7 days → full bloom (3)",  () => expect(streakStage(7)).toBe(3));
  it("29 days → full bloom (3)", () => expect(streakStage(29)).toBe(3));
  it("30 days → radiant (4)",    () => expect(streakStage(30)).toBe(4));
  it("365 days → radiant (4)",   () => expect(streakStage(365)).toBe(4));
});

// ── updateStreak ─────────────────────────────────────────────────────────────

describe("updateStreak", () => {
  it("first ever session (lastPlayed=0) → streak=1", () => {
    const r = updateStreak(0, now, 0, 0, false);
    expect(r).toMatchObject({ streakDays: 1, missedDays: 0, usedWinterWrap: false });
  });

  it("same day → no change", () => {
    const r = updateStreak(now - 3600_000, now, 5, 0, false);
    expect(r).toMatchObject({ streakDays: 5, missedDays: 0 });
  });

  it("consecutive day → streak++", () => {
    const r = updateStreak(now - DAY, now, 5, 0, false);
    expect(r).toMatchObject({ streakDays: 6, missedDays: 0 });
  });

  it("gap=2, not winter, no wrap → streak stalls, missedDays=1", () => {
    const r = updateStreak(now - 2 * DAY, now, 5, 0, false);
    expect(r).toMatchObject({ streakDays: 5, missedDays: 1, usedWinterWrap: false });
  });

  it("gap=2, winter, has wrap → consumes wrap, streak++", () => {
    const r = updateStreak(now - 2 * DAY, now, 5, 2, true);
    expect(r).toMatchObject({ streakDays: 6, winterWraps: 1, missedDays: 0, usedWinterWrap: true });
  });

  it("gap=2, winter, no wrap → streak stalls (wrap exhausted)", () => {
    const r = updateStreak(now - 2 * DAY, now, 5, 0, true);
    expect(r).toMatchObject({ streakDays: 5, missedDays: 1, usedWinterWrap: false });
  });

  it("gap=3, winter, has wrap → wrap not used (>1 missed day)", () => {
    const r = updateStreak(now - 3 * DAY, now, 5, 2, true);
    expect(r).toMatchObject({ streakDays: 5, winterWraps: 2, missedDays: 2, usedWinterWrap: false });
  });

  it("gap=6 → streak stalls, missedDays=5", () => {
    const r = updateStreak(now - 6 * DAY, now, 10, 0, false);
    expect(r).toMatchObject({ streakDays: 10, missedDays: 5 });
  });

  it("gap=7 → reset to 1, missedDays=6", () => {
    const r = updateStreak(now - 7 * DAY, now, 10, 0, false);
    expect(r).toMatchObject({ streakDays: 1, missedDays: 6 });
  });

  it("gap=14 → reset to 1, wraps preserved", () => {
    const r = updateStreak(now - 14 * DAY, now, 20, 2, false);
    expect(r).toMatchObject({ streakDays: 1, winterWraps: 2, missedDays: 13 });
  });
});

// ── toDateString ─────────────────────────────────────────────────────────────

describe("toDateString", () => {
  it("formats 2026-08-16 correctly", () => {
    const ms = new Date("2026-08-16T00:00:00").getTime();
    expect(toDateString(ms)).toMatch(/^2026-08-16$/);
  });

  it("zero-pads month and day", () => {
    const ms = new Date("2026-01-05T00:00:00").getTime();
    expect(toDateString(ms)).toMatch(/^2026-01-05$/);
  });
});
