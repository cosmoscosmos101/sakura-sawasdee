import { buildTiledJson, border, inRect, atPoints } from "./mapBuilder";
import type { MapDef } from "./mapDef";

const GRASS = 1, PATH = 2, TRUNK = 4, WALL = 5, FLOWER = 7;

// ── Temple (32×22) ───────────────────────────────────────────────────────────
// North ← fresh_market (19,23); east → pier (0,11)
export const TEMPLE: MapDef = {
  key: "temple", worldId: "th", cols: 32, rows: 22,
  tilesetName: "test_tileset",
  playerStart: { col: 16, row: 3 },
  weatherType: "clear",
  portals: [
    { col: 16, row: 0,  targetMapKey: "fresh_market", targetCol: 19, targetRow: 22 },
    { col: 31, row: 11, targetMapKey: "pier",         targetCol: 1,  targetRow: 11 },
  ],
  npcs: [
    { npcId: "luang_phor", col: 16, row: 10, startId: "monk_01",   hasQuest: false, minigameEvent: { type: "handwriting:open" } },
    { npcId: "novice",     col: 10, row: 14, startId: "novice_01", hasQuest: true  },
  ],
  kotodamaSpots: [[8, 6], [16, 14], [24, 6]] as const,
  tiledJson: buildTiledJson({
    cols: 32, rows: 22, tilesetName: "test_tileset",
    ground: (c, r) => inRect(c, r, 12, 0, 20, 21) || inRect(c, r, 4, 8, 27, 15) ? PATH : GRASS,
    decoration: (c, r) => {
      if (atPoints(c, r, [[4,4],[27,4],[4,17],[27,17]] as const)) return TRUNK;
      if ((r === 7 || r === 16) && c >= 5 && c <= 26 && c % 4 === 1) return FLOWER;
      return 0;
    },
    collision: (c, r) => {
      const isPortal = (c === 16 && r === 0) || (c === 31 && r === 11);
      if (border(c, r, 32, 22) && !isPortal) return WALL;
      if (atPoints(c, r, [[4,4],[27,4],[4,17],[27,17]] as const)) return WALL;
      if (inRect(c, r, 5, 9, 26, 10) || inRect(c, r, 5, 14, 26, 15)) return WALL;
      return 0;
    },
    abovePlayer: () => 0,
  }),
};

// ── Pier (36×18) ────────────────────────────────────────────────────────────
// West ← temple (31,11); south → old_town (18,0)
export const PIER: MapDef = {
  key: "pier", worldId: "th", cols: 36, rows: 18,
  tilesetName: "test_tileset",
  playerStart: { col: 4, row: 9 },
  weatherType: "clear",
  portals: [
    { col: 0,  row: 11, targetMapKey: "temple",   targetCol: 30, targetRow: 11 },
    { col: 18, row: 17, targetMapKey: "old_town",  targetCol: 18, targetRow: 1  },
  ],
  npcs: [
    { npcId: "boatman",    col: 20, row: 8,  startId: "boat_01",  hasQuest: true,  minigameEvent: { type: "word_segment:open", location: "pier" } },
    { npcId: "fisherman2", col: 28, row: 12, startId: "fish2_01", hasQuest: false, minigameEvent: { type: "fishing:open" } },
  ],
  kotodamaSpots: [[10, 8], [22, 10], [30, 6]] as const,
  tiledJson: buildTiledJson({
    cols: 36, rows: 18, tilesetName: "test_tileset",
    ground: (c, r) => inRect(c, r, 0, 6, 35, 13) || inRect(c, r, 16, 0, 20, 17) ? PATH : GRASS,
    decoration: (c, r) => {
      if ((c === 3 || c === 32) && r >= 4 && r <= 14 && r % 5 === 4) return FLOWER;
      return 0;
    },
    collision: (c, r) => {
      const isPortal = (c === 0 && r === 11) || (c === 18 && r === 17);
      if (border(c, r, 36, 18) && !isPortal) return WALL;
      if (inRect(c, r, 4, 5, 34, 6)) return WALL;
      if (inRect(c, r, 4, 14, 34, 15)) return WALL;
      return 0;
    },
    abovePlayer: () => 0,
  }),
};

// ── Old Town (30×22) ─────────────────────────────────────────────────────────
// North ← pier (18,17); east → rice_field (0,11)
export const OLD_TOWN: MapDef = {
  key: "old_town", worldId: "th", cols: 30, rows: 22,
  tilesetName: "test_tileset",
  playerStart: { col: 18, row: 4 },
  weatherType: "clear",
  portals: [
    { col: 18, row: 0,  targetMapKey: "pier",       targetCol: 18, targetRow: 16 },
    { col: 29, row: 11, targetMapKey: "rice_field",  targetCol: 1,  targetRow: 11 },
  ],
  npcs: [
    { npcId: "shophouse_owner", col: 8,  row: 10, startId: "shop2_01",  hasQuest: true  },
    { npcId: "street_vendor",   col: 22, row: 14, startId: "vendor2_01",hasQuest: false },
  ],
  kotodamaSpots: [[6, 7], [15, 12], [24, 8]] as const,
  tiledJson: buildTiledJson({
    cols: 30, rows: 22, tilesetName: "test_tileset",
    ground: (c, r) => inRect(c, r, 5, 0, 24, 21) || inRect(c, r, 14, 0, 15, 21) ? PATH : GRASS,
    decoration: (c, r) => {
      if (atPoints(c, r, [[3,5],[26,5],[3,16],[26,16]] as const)) return TRUNK;
      return 0;
    },
    collision: (c, r) => {
      const isPortal = (c === 18 && r === 0) || (c === 29 && r === 11);
      if (border(c, r, 30, 22) && !isPortal) return WALL;
      if (atPoints(c, r, [[3,5],[26,5],[3,16],[26,16]] as const)) return WALL;
      return 0;
    },
    abovePlayer: () => 0,
  }),
};

// ── Rice Field (40×24) ───────────────────────────────────────────────────────
// West ← old_town (29,11); east → night_market (0,12)
export const RICE_FIELD: MapDef = {
  key: "rice_field", worldId: "th", cols: 40, rows: 24,
  tilesetName: "test_tileset",
  playerStart: { col: 4, row: 12 },
  weatherType: "clear",
  portals: [
    { col: 0,  row: 11, targetMapKey: "old_town",    targetCol: 28, targetRow: 11 },
    { col: 39, row: 12, targetMapKey: "night_market", targetCol: 1,  targetRow: 12 },
  ],
  npcs: [
    { npcId: "farmer",  col: 20, row: 12, startId: "farmer_01", hasQuest: true  },
    { npcId: "buffalo", col: 30, row: 16, startId: "buffalo_01",hasQuest: false },
  ],
  kotodamaSpots: [[10, 8], [20, 16], [32, 8], [16, 20]] as const,
  tiledJson: buildTiledJson({
    cols: 40, rows: 24, tilesetName: "test_tileset",
    ground: (c, r) => inRect(c, r, 0, 8, 39, 15) || inRect(c, r, 18, 0, 22, 23) ? PATH : GRASS,
    decoration: (c, r) => {
      if (r >= 4 && r <= 6 && c >= 5 && c <= 37 && c % 6 === 2) return FLOWER;
      if (r >= 18 && r <= 20 && c >= 5 && c <= 37 && c % 6 === 2) return FLOWER;
      return 0;
    },
    collision: (c, r) => {
      const isPortal = (c === 0 && r === 11) || (c === 39 && r === 12);
      if (border(c, r, 40, 24) && !isPortal) return WALL;
      return 0;
    },
    abovePlayer: () => 0,
  }),
};

// ── Night Market (34×22) ─────────────────────────────────────────────────────
// West ← rice_field (39,12); north → floating_market (17,21)
// Note: time-of-day gating (18:00–02:00) is handled in WorldScene.
export const NIGHT_MARKET: MapDef = {
  key: "night_market", worldId: "th", cols: 34, rows: 22,
  tilesetName: "test_tileset",
  playerStart: { col: 4, row: 11 },
  weatherType: "clear",
  portals: [
    { col: 0,  row: 12, targetMapKey: "rice_field",      targetCol: 38, targetRow: 12 },
    { col: 17, row: 0,  targetMapKey: "floating_market",  targetCol: 17, targetRow: 19 },
  ],
  npcs: [
    { npcId: "night_vendor_01", col: 12, row: 10, startId: "nv01_01",   hasQuest: true  },
    { npcId: "night_vendor_02", col: 22, row: 14, startId: "nv02_01",   hasQuest: false },
    { npcId: "pa_somsri",       col: 17, row: 8,  startId: "somsri_03", hasQuest: true,  minigameEvent: { type: "bargaining:open" } },
  ],
  kotodamaSpots: [[8, 8], [17, 14], [26, 8], [12, 18]] as const,
  tiledJson: buildTiledJson({
    cols: 34, rows: 22, tilesetName: "test_tileset",
    ground: (c, r) => inRect(c, r, 4, 4, 29, 17) || inRect(c, r, 14, 0, 20, 21) ? PATH : GRASS,
    decoration: (c, r) => {
      if ((r === 5 || r === 16) && c >= 5 && c <= 28 && c % 5 === 0) return FLOWER;
      return 0;
    },
    collision: (c, r) => {
      const isPortal = (c === 0 && r === 12) || (c === 17 && r === 0);
      if (border(c, r, 34, 22) && !isPortal) return WALL;
      if (r === 6  && c >= 5 && c <= 28 && !inRect(c, r, 14, 6, 20, 6)) return WALL;
      if (r === 15 && c >= 5 && c <= 28 && !inRect(c, r, 14, 15, 20, 15)) return WALL;
      return 0;
    },
    abovePlayer: () => 0,
  }),
};

// ── Floating Market (34×18) ──────────────────────────────────────────────────
// South ← night_market (17,0); Note: weekend-only gating in WorldScene.
export const FLOATING_MARKET: MapDef = {
  key: "floating_market", worldId: "th", cols: 34, rows: 18,
  tilesetName: "test_tileset",
  playerStart: { col: 17, row: 4 },
  weatherType: "clear",
  portals: [
    { col: 17, row: 17, targetMapKey: "night_market", targetCol: 17, targetRow: 1 },
  ],
  npcs: [
    { npcId: "boat_vendor",     col: 10, row: 9,  startId: "bv_01",    hasQuest: true  },
    { npcId: "watermelon_lady", col: 24, row: 9,  startId: "wml_01",   hasQuest: false },
    { npcId: "pa_somsri",       col: 17, row: 12, startId: "somsri_04",hasQuest: true, minigameEvent: { type: "bargaining:open" } },
  ],
  kotodamaSpots: [[8, 6], [17, 10], [26, 6], [10, 14], [24, 14]] as const,
  tiledJson: buildTiledJson({
    cols: 34, rows: 18, tilesetName: "test_tileset",
    ground: (c, r) => inRect(c, r, 4, 4, 29, 13) || inRect(c, r, 14, 0, 20, 17) ? PATH : GRASS,
    decoration: (c, r) => {
      if (r === 6 && c >= 5 && c <= 28 && c % 4 === 1) return FLOWER;
      if (r === 12 && c >= 5 && c <= 28 && c % 4 === 1) return FLOWER;
      return 0;
    },
    collision: (c, r) => {
      const isPortal = (c === 17 && r === 17);
      if (border(c, r, 34, 18) && !isPortal) return WALL;
      if (r === 7  && c >= 5 && c <= 28 && !inRect(c, r, 14, 7, 20, 7)) return WALL;
      if (r === 11 && c >= 5 && c <= 28 && !inRect(c, r, 14, 11, 20, 11)) return WALL;
      return 0;
    },
    abovePlayer: () => 0,
  }),
};
