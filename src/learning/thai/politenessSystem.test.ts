import { describe, it, expect } from "vitest";
import {
  analysePoliteness,
  getPolitenessLevel,
  getDialogueTier,
  decayPoliteness,
  clampPoliteness,
} from "./politenessSystem";

describe("analysePoliteness", () => {
  it("returns zero delta for plain text with no markers", () => {
    const r = analysePoliteness("ฉันต้องการน้ำ");
    expect(r.delta).toBe(0);
  });
  it("detects ครับ", () => {
    const r = analysePoliteness("ขอน้ำหน่อยครับ");
    expect(r.delta).toBe(3);
  });
  it("detects ค่ะ", () => {
    const r = analysePoliteness("ขอบคุณค่ะ");
    expect(r.delta).toBeGreaterThanOrEqual(3); // ขอบคุณ +2 + ค่ะ +3 = 5
  });
  it("detects นะคะ", () => {
    const r = analysePoliteness("ช่วยหน่อยนะคะ");
    expect(r.delta).toBe(4);
  });
  it("detects multiple markers and sums them", () => {
    const r = analysePoliteness("ขอบคุณมากนะครับ");
    expect(r.delta).toBe(6); // ขอบคุณ +2 + นะครับ +4
  });
  it("includes detected markers in reason string", () => {
    const r = analysePoliteness("ดีครับ");
    expect(r.reason).toContain("ครับ");
  });
  it("reason explains missing markers", () => {
    const r = analysePoliteness("โอเค");
    expect(r.reason).toContain("no politeness");
  });
});

describe("getPolitenessLevel", () => {
  it("very_polite at 80+",  () => expect(getPolitenessLevel(80)).toBe("very_polite"));
  it("very_polite at 100",  () => expect(getPolitenessLevel(100)).toBe("very_polite"));
  it("polite at 50–79",     () => expect(getPolitenessLevel(65)).toBe("polite"));
  it("neutral at 20–49",    () => expect(getPolitenessLevel(35)).toBe("neutral"));
  it("rude below 20",       () => expect(getPolitenessLevel(10)).toBe("rude"));
  it("boundary 20 = neutral", () => expect(getPolitenessLevel(20)).toBe("neutral"));
  it("boundary 50 = polite",  () => expect(getPolitenessLevel(50)).toBe("polite"));
});

describe("getDialogueTier", () => {
  it("warm at 65+",    () => expect(getDialogueTier(70)).toBe("warm"));
  it("normal at 30–64", () => expect(getDialogueTier(50)).toBe("normal"));
  it("cool below 30",  () => expect(getDialogueTier(15)).toBe("cool"));
});

describe("decayPoliteness", () => {
  it("moves high score toward 50", () => {
    const result = decayPoliteness(100);
    expect(result).toBeLessThan(100);
    expect(result).toBeGreaterThan(50);
  });
  it("moves low score toward 50", () => {
    const result = decayPoliteness(0);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(50);
  });
  it("leaves 50 unchanged", () => {
    expect(decayPoliteness(50)).toBe(50);
  });
});

describe("clampPoliteness", () => {
  it("clamps above 100", () => expect(clampPoliteness(120)).toBe(100));
  it("clamps below 0",   () => expect(clampPoliteness(-5)).toBe(0));
  it("passes through mid-range", () => expect(clampPoliteness(60)).toBe(60));
});
