import { describe, it, expect } from "vitest";
import { validateCombo, multiplierFor, type ComboToken } from "./comboValidator";
import type { Element } from "../content/schema";

const t = (element: Element, id: string = element): ComboToken => ({ id, element });

describe("multiplierFor", () => {
  it("returns the documented multiplier ladder", () => {
    expect(multiplierFor(1)).toBe(1);
    expect(multiplierFor(2)).toBe(1.5);
    expect(multiplierFor(3)).toBe(2.0);
    expect(multiplierFor(4)).toBe(2.8);
    expect(multiplierFor(5)).toBe(3.5);
    expect(multiplierFor(6)).toBe(4.5);
    expect(multiplierFor(9)).toBe(4.5);
  });
});

describe("validateCombo — Japanese", () => {
  it("accepts the canonical 私はすしを食べます skeleton", () => {
    // bloom echo bloom echo spark
    const result = validateCombo(
      [t("bloom", "watashi"), t("echo", "wa"), t("bloom", "sushi"), t("echo", "wo"), t("spark", "tabemasu")],
      "ja",
    );
    expect(result.valid).toBe(true);
    expect(result.chainLength).toBe(5);
    expect(result.multiplier).toBe(3.5);
  });

  it("accepts adjective + noun (おいしいパン)", () => {
    const result = validateCombo([t("flow"), t("bloom")], "ja");
    expect(result.valid).toBe(true);
    expect(result.multiplier).toBe(1.5);
  });

  it("rejects a verb followed by anything — Japanese is verb-final", () => {
    const result = validateCombo([t("bloom"), t("echo"), t("spark"), t("bloom")], "ja");
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("spark_cannot_precede_bloom");
  });

  it("rejects opening with a particle", () => {
    const result = validateCombo([t("echo"), t("bloom")], "ja");
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("cannot_open_with_echo");
  });

  it("rejects two particles in a row", () => {
    const result = validateCombo([t("bloom"), t("echo"), t("echo")], "ja");
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("echo_cannot_precede_echo");
  });

  it("awards the 6+ tier for long chains", () => {
    const result = validateCombo(
      [t("bloom"), t("echo"), t("bloom"), t("echo"), t("bloom"), t("echo"), t("spark")],
      "ja",
    );
    expect(result.valid).toBe(true);
    expect(result.multiplier).toBe(4.5);
  });
});

describe("validateCombo — Thai", () => {
  it("accepts the canonical ฉันกินข้าวที่ตลาด skeleton", () => {
    // bloom spark bloom echo bloom
    const result = validateCombo(
      [t("bloom", "chan"), t("spark", "kin"), t("bloom", "khao"), t("echo", "thi"), t("bloom", "talat")],
      "th",
    );
    expect(result.valid).toBe(true);
    expect(result.multiplier).toBe(3.5);
  });

  it("accepts a verb followed by an object — Thai is SVO, unlike Japanese", () => {
    const result = validateCombo([t("bloom"), t("spark"), t("bloom")], "th");
    expect(result.valid).toBe(true);
  });

  it("accepts a polite particle closing the sentence", () => {
    const result = validateCombo([t("bloom"), t("flow"), t("light")], "th");
    expect(result.valid).toBe(true);
  });

  it("rejects anything after the polite particle", () => {
    const result = validateCombo([t("bloom"), t("flow"), t("light"), t("bloom")], "th");
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("light_cannot_precede_bloom");
  });
});

describe("validateCombo — edge cases", () => {
  it("treats a single token as trivially valid with no bonus", () => {
    const result = validateCombo([t("bloom")], "ja");
    expect(result.valid).toBe(true);
    expect(result.multiplier).toBe(1);
  });

  it("rejects an empty combo", () => {
    const result = validateCombo([], "ja");
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("empty_combo");
  });

  it("lets stone (characters) precede anything", () => {
    const result = validateCombo([t("stone"), t("stone"), t("bloom")], "ja");
    expect(result.valid).toBe(true);
  });
});
