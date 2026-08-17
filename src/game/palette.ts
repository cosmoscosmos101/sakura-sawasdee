/**
 * Master palette — 48 colours.
 *
 * Every asset and every drawn pixel must come from this list.
 * Rules (see CLAUDE.md §5):
 *   - Never #000000 or #FFFFFF (snow excepted)
 *   - Outlines always INK_DARK
 *   - Saturation <= 60%, Lightness >= 45%
 */
export const PALETTE = {
  // Outlines — never pure black
  INK_DARK: "#4A3F55",
  INK_MID: "#6B5F78",
  INK_SOFT: "#9188A0",

  // Sakura / Japanese spring
  SAKURA_1: "#FFF0F5",
  SAKURA_2: "#FFD9E8",
  SAKURA_3: "#F7A8C4",
  SAKURA_4: "#D97FA5",
  BRANCH_1: "#A88A7D",
  BRANCH_2: "#7D6459",

  // Sky / water
  SKY_DAY: "#BDE3FF",
  SKY_DAWN: "#FFD4C4",
  SKY_DUSK: "#C9A8D9",
  SKY_NIGHT: "#5A5A8C",
  WATER_1: "#C8ECF5",
  WATER_2: "#7FC4E0",
  WATER_3: "#4E93B5",

  // Mint / foliage
  MINT_1: "#E0FAF0",
  MINT_2: "#C8F2E0",
  LEAF_1: "#A8DDB5",
  LEAF_2: "#7BB88F",
  LEAF_3: "#4E7D5E",

  // Cream / light
  CREAM_1: "#FFFBF0",
  CREAM_2: "#FFF6E5",
  CREAM_3: "#F5E3C8",
  GOLD_1: "#FFE08A",
  GOLD_2: "#F2C879",

  // Violet / magic
  LAVENDER_1: "#F0EAFF",
  LAVENDER_2: "#E0D7FF",
  LAVENDER_3: "#C9B8F0",
  FOG_1: "#D8D4E0",
  FOG_2: "#A9A3B8",
  FOG_3: "#6E6880",

  // Thailand — warm / market
  MANGO: "#FFE3A3",
  TEAK_1: "#C9A27E",
  TEAK_2: "#9B7B5C",
  TERRACOTTA: "#E09B7D",
  TEMPLE_GOLD: "#F2C879",
  RIVER_TEAL: "#9FD8CE",
  CHILI: "#F08D8D",
  TUKTUK_PINK: "#F5A3C7",
  TUKTUK_BLUE: "#A3C7F5",
  BANANA_LEAF: "#8FBF7A",

  // Snow / winter
  SNOW_1: "#FFFFFF",
  SNOW_2: "#F0F4FA",
  SNOW_SHADOW: "#D4DCE8",

  // Autumn
  MOMIJI_1: "#FFB39B",
  MOMIJI_2: "#F08A6E",
  AUTUMN_GOLD: "#E8C87A",

  // Skin tones
  SKIN_1: "#FFE8D6",
  SKIN_2: "#F5D0B0",
  SKIN_3: "#E0B088",
  SKIN_4: "#C08E62",
  SKIN_5: "#9B6B45",
  SKIN_6: "#6E4830",
} as const;

export type PaletteKey = keyof typeof PALETTE;

/** Convert a palette hex string to the 0xRRGGBB number Phaser expects. */
export function hex(key: PaletteKey): number {
  return Number.parseInt(PALETTE[key].slice(1), 16);
}

/** Element colours — Kotodama elements map to word classes. See CLAUDE.md §7. */
export const ELEMENT_COLORS = {
  bloom: PALETTE.SAKURA_3, // noun
  spark: PALETTE.GOLD_1, // verb
  flow: PALETTE.WATER_2, // adjective
  echo: PALETTE.LAVENDER_3, // particle / grammar
  stone: PALETTE.TEAK_1, // kanji / Thai letter
  light: PALETTE.CREAM_2, // phrase / idiom
} as const;

export type ElementName = keyof typeof ELEMENT_COLORS;
