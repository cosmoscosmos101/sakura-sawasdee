import { describe, it, expect } from "vitest";
import { seasonFromDate, type Season } from "./seasonUtils";
import { timeOfDayFromHour, type TimeOfDay } from "./timeUtils";

describe("seasonFromDate", () => {
  const cases: Array<[number, Season]> = [
    [3,  "spring"], [4,  "spring"], [5,  "spring"],
    [6,  "summer"], [7,  "summer"], [8,  "summer"],
    [9,  "autumn"], [10, "autumn"], [11, "autumn"],
    [12, "winter"], [1,  "winter"], [2,  "winter"],
  ];

  for (const [month, expected] of cases) {
    it(`month ${month} → ${expected}`, () => {
      const d = new Date(2026, month - 1, 15);
      expect(seasonFromDate(d)).toBe(expected);
    });
  }
});

describe("timeOfDayFromHour", () => {
  const cases: Array<[number, TimeOfDay]> = [
    [0,  "night"], [3,  "night"], [4,  "night"],
    [5,  "dawn"],  [6,  "dawn"],
    [7,  "day"],   [12, "day"],   [16, "day"],
    [17, "dusk"],  [18, "dusk"],
    [19, "night"], [22, "night"],
  ];

  for (const [hour, expected] of cases) {
    it(`hour ${hour} → ${expected}`, () => {
      expect(timeOfDayFromHour(hour)).toBe(expected);
    });
  }
});
