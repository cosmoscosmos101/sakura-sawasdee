/**
 * Thai number system — converts integers to Thai words and back.
 * Covers the range 1–9999 (sufficient for market prices).
 * Pure functions — no UI or Phaser dependencies.
 */

const ONES = ["", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"] as const;
const TEENS = ["สิบ", "สิบเอ็ด", "สิบสอง", "สิบสาม", "สิบสี่", "สิบห้า", "สิบหก", "สิบเจ็ด", "สิบแปด", "สิบเก้า"] as const;

export function toThaiWords(n: number): string {
  if (n <= 0 || !Number.isInteger(n)) return "ศูนย์";

  const parts: string[] = [];

  const thousands = Math.floor(n / 1000);
  if (thousands > 0) {
    parts.push((thousands === 1 ? "หนึ่ง" : (ONES[thousands] ?? "")) + "พัน");
    n -= thousands * 1000;
  }

  const hundreds = Math.floor(n / 100);
  if (hundreds > 0) {
    parts.push((hundreds === 1 ? "หนึ่ง" : (ONES[hundreds] ?? "")) + "ร้อย");
    n -= hundreds * 100;
  }

  if (n >= 10) {
    if (n < 20) {
      parts.push(TEENS[n - 10] ?? "สิบ");
      n = 0;
    } else {
      const tens = Math.floor(n / 10);
      const tensWord = tens === 2 ? "ยี่สิบ" : (ONES[tens] ?? "") + "สิบ";
      parts.push(tensWord);
      n -= tens * 10;
    }
  }

  if (n > 0) {
    // เอ็ด replaces หนึ่ง when it is the final unit after tens
    const lastPart = parts[parts.length - 1] ?? "";
    const afterTens = lastPart.endsWith("สิบ") || lastPart.endsWith("ยี่สิบ");
    parts.push(afterTens && n === 1 ? "เอ็ด" : (ONES[n] ?? ""));
  }

  return parts.join("");
}

/**
 * Parse a Thai number word string back to an integer.
 * Only covers a subset sufficient for market prices.
 * Returns null when the string is not recognized.
 */
export function parseThaiWords(s: string): number | null {
  let n = 0;
  let remaining = s;

  const takePrefix = (word: string, value: number): boolean => {
    if (remaining.startsWith(word)) {
      n += value;
      remaining = remaining.slice(word.length);
      return true;
    }
    return false;
  };

  // Thousands
  for (let i = 9; i >= 1; i--) {
    const w = (ONES[i] ?? "") + "พัน";
    if (takePrefix(w, i * 1000)) break;
  }

  // Hundreds
  for (let i = 9; i >= 1; i--) {
    const w = (ONES[i] ?? "") + "ร้อย";
    if (takePrefix(w, i * 100)) break;
  }

  // Tens
  if (takePrefix("ยี่สิบ", 20)) {
    // 21-29 handled below
  } else {
    for (let i = 9; i >= 2; i--) {
      if (takePrefix((ONES[i] ?? "") + "สิบ", i * 10)) break;
    }
    if (takePrefix("สิบ", 10)) {
      // 10 exactly or teens
    }
  }

  // Units
  if (remaining === "เอ็ด") { n += 1; remaining = ""; }
  else {
    for (let i = 9; i >= 1; i--) {
      if (takePrefix(ONES[i] ?? "", i)) break;
    }
  }

  if (remaining.length > 0) return null;
  return n === 0 ? null : n;
}

/** Return 3 wrong-answer prices near the target, distinct and plausible. */
export function nearbyPrices(target: number, count = 3): number[] {
  const offsets = [-100, -50, -30, 30, 50, 100, 200].filter((o) => {
    const v = target + o;
    return v > 0 && v !== target;
  });
  // Shuffle deterministically by sorting with a fixed seed via Math.sin
  const shuffled = offsets
    .sort((a, b) => Math.sin(a + target) - Math.sin(b + target))
    .slice(0, count);
  return shuffled.map((o) => target + o);
}
