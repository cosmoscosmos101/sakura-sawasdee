import { describe, it, expect } from "vitest";
import { toThaiWords, parseThaiWords, nearbyPrices } from "./thaiNumbers";

describe("toThaiWords", () => {
  it("converts single digits", () => {
    expect(toThaiWords(1)).toBe("หนึ่ง");
    expect(toThaiWords(9)).toBe("เก้า");
  });
  it("converts ten", () => {
    expect(toThaiWords(10)).toBe("สิบ");
  });
  it("converts teens", () => {
    expect(toThaiWords(11)).toBe("สิบเอ็ด");
    expect(toThaiWords(15)).toBe("สิบห้า");
  });
  it("converts twenty as ยี่สิบ", () => {
    expect(toThaiWords(20)).toBe("ยี่สิบ");
  });
  it("converts 21 with เอ็ด", () => {
    expect(toThaiWords(21)).toBe("ยี่สิบเอ็ด");
  });
  it("converts 25", () => {
    expect(toThaiWords(25)).toBe("ยี่สิบห้า");
  });
  it("converts 30–99", () => {
    expect(toThaiWords(30)).toBe("สามสิบ");
    expect(toThaiWords(50)).toBe("ห้าสิบ");
    expect(toThaiWords(99)).toBe("เก้าสิบเก้า");
  });
  it("converts 100 as หนึ่งร้อย", () => {
    expect(toThaiWords(100)).toBe("หนึ่งร้อย");
  });
  it("converts 150", () => {
    expect(toThaiWords(150)).toBe("หนึ่งร้อยห้าสิบ");
  });
  it("converts 200", () => {
    expect(toThaiWords(200)).toBe("สองร้อย");
  });
  it("converts 250", () => {
    expect(toThaiWords(250)).toBe("สองร้อยห้าสิบ");
  });
  it("converts 350", () => {
    expect(toThaiWords(350)).toBe("สามร้อยห้าสิบ");
  });
  it("converts 1000", () => {
    expect(toThaiWords(1000)).toBe("หนึ่งพัน");
  });
  it("converts 1500", () => {
    expect(toThaiWords(1500)).toBe("หนึ่งพันห้าร้อย");
  });
});

describe("parseThaiWords", () => {
  it("parses single digits", () => {
    expect(parseThaiWords("หนึ่ง")).toBe(1);
    expect(parseThaiWords("เก้า")).toBe(9);
  });
  it("parses สิบ as 10", () => {
    expect(parseThaiWords("สิบ")).toBe(10);
  });
  it("parses สิบเอ็ด as 11", () => {
    expect(parseThaiWords("สิบเอ็ด")).toBe(11);
  });
  it("parses ยี่สิบ as 20", () => {
    expect(parseThaiWords("ยี่สิบ")).toBe(20);
  });
  it("round-trips values produced by toThaiWords", () => {
    const targets = [1, 10, 11, 20, 21, 50, 100, 150, 200, 250, 350, 500];
    for (const n of targets) {
      expect(parseThaiWords(toThaiWords(n))).toBe(n);
    }
  });
  it("returns null for unrecognized strings", () => {
    expect(parseThaiWords("abc")).toBeNull();
    expect(parseThaiWords("")).toBeNull();
  });
});

describe("nearbyPrices", () => {
  it("returns the requested count", () => {
    const result = nearbyPrices(200, 3);
    expect(result).toHaveLength(3);
  });
  it("never returns the target itself", () => {
    const target = 250;
    const result = nearbyPrices(target, 3);
    expect(result).not.toContain(target);
  });
  it("all prices are positive", () => {
    const result = nearbyPrices(50, 3);
    expect(result.every((p) => p > 0)).toBe(true);
  });
});
