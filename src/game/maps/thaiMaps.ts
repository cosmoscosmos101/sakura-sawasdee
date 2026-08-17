import { buildTiledJson, border, inRect, atPoints } from "./mapBuilder";
import type { MapDef } from "./mapDef";

// Tile GIDs (firstgid = 1)
const GRASS = 1, PATH = 2, TRUNK = 4, WALL = 5, FLOWER = 7;

// ── Tuk-tuk Terminal (32×20) ──────────────────────────────────────────────────
// Entry point for the Thai world — south → fresh_market, east → airport
const TT_TREES = [[2, 5], [29, 5], [2, 17], [29, 17]] as const;

export const TUKTUK_TERMINAL: MapDef = {
  key: "tuktuk_terminal", worldId: "th", cols: 32, rows: 20,
  tilesetName: "test_tileset",
  playerStart: { col: 16, row: 14 },
  weatherType: "clear",
  portals: [
    { col: 16, row: 19, targetMapKey: "fresh_market", targetCol: 16, targetRow: 1  },
    { col: 0,  row: 10, targetMapKey: "airport",      targetCol: 28, targetRow: 9  },
  ],
  npcs: [
    { npcId: "tuktuk_driver", col: 8,  row: 10, startId: "driver_01",  hasQuest: true,  minigameEvent: { type: "tuktuk:open" } },
    { npcId: "pa_somsri",     col: 24, row: 10, startId: "somsri_01",  hasQuest: false, minigameEvent: { type: "bargaining:open" } },
  ],
  kotodamaSpots: [[10, 6], [22, 6], [16, 14]] as const,
  tiledJson: buildTiledJson({
    cols: 32, rows: 20, tilesetName: "test_tileset",
    ground: (c, r) => inRect(c, r, 3, 6, 28, 16) || inRect(c, r, 14, 16, 18, 19) ? PATH : GRASS,
    decoration: (c, r) => {
      if (atPoints(c, r, TT_TREES)) return TRUNK;
      if (r === 17 && c >= 12 && c <= 20 && c % 2 === 0) return FLOWER;
      return 0;
    },
    collision: (c, r) => {
      const isPortal = (c === 16 && r === 19) || (c === 0 && r === 10);
      if (border(c, r, 32, 20) && !isPortal) return WALL;
      if (atPoints(c, r, TT_TREES)) return WALL;
      if (inRect(c, r, 4, 7, 27, 8) || inRect(c, r, 4, 14, 27, 15)) return WALL;
      return 0;
    },
    abovePlayer: () => 0,
  }),
};

// ── Fresh Market (38×24) ─────────────────────────────────────────────────────
// North ← tuktuk_terminal; south → temple (placeholder)
export const FRESH_MARKET: MapDef = {
  key: "fresh_market", worldId: "th", cols: 38, rows: 24,
  tilesetName: "test_tileset",
  playerStart: { col: 16, row: 3 },
  weatherType: "clear",
  portals: [
    { col: 16, row: 0,  targetMapKey: "tuktuk_terminal", targetCol: 16, targetRow: 17 },
    { col: 19, row: 23, targetMapKey: "temple",          targetCol: 16, targetRow: 1  },
  ],
  npcs: [
    { npcId: "noodle_vendor", col: 8,  row: 10, startId: "noodle_01", hasQuest: false },
    { npcId: "fruit_stall",   col: 28, row: 10, startId: "fruit_01",  hasQuest: true  },
    { npcId: "pa_somsri",     col: 20, row: 16, startId: "somsri_02", hasQuest: true,  minigameEvent: { type: "bargaining:open" } },
  ],
  triggerZones: [
    { col: 22, row: 19, event: { type: "tone_kitchen:open" } },
  ],
  kotodamaSpots: [[6, 8], [16, 12], [30, 8], [12, 18], [24, 18]] as const,
  tiledJson: buildTiledJson({
    cols: 38, rows: 24, tilesetName: "test_tileset",
    ground: (c, r) => {
      if (inRect(c, r, 14, 0, 18, 23) || inRect(c, r, 4, 6, 33, 21)) return PATH;
      return GRASS;
    },
    decoration: (c, r) => {
      if ((r === 8 || r === 16) && c >= 5 && c <= 32 && (c - 5) % 6 === 0) return FLOWER;
      return 0;
    },
    collision: (c, r) => {
      const isPortal = (c === 16 && r === 0) || (c === 19 && r === 23);
      if (border(c, r, 38, 24) && !isPortal) return WALL;
      if (r === 9  && c >= 5 && c <= 32 && (c - 5) % 6 < 4 && !inRect(c, r, 14, 9, 18, 9)) return WALL;
      if (r === 15 && c >= 5 && c <= 32 && (c - 5) % 6 < 4 && !inRect(c, r, 14, 15, 18, 15)) return WALL;
      return 0;
    },
    abovePlayer: () => 0,
  }),
};

// ── Airport (30×18) — Japan ↔ Thailand hub ────────────────────────────────────
// West portal → test_map col 28, row 9; east portal → tuktuk_terminal col 1, row 10
export const AIRPORT: MapDef = {
  key: "airport", worldId: "ja", cols: 30, rows: 18,
  tilesetName: "test_tileset",
  playerStart: { col: 15, row: 9 },
  weatherType: "clear",
  portals: [
    { col: 0,  row: 9, targetMapKey: "test_map",        targetCol: 1,  targetRow: 9  },
    { col: 29, row: 9, targetMapKey: "tuktuk_terminal", targetCol: 1,  targetRow: 10 },
  ],
  npcs: [
    { npcId: "check_in", col: 15, row: 4, startId: "checkin_01", hasQuest: false },
    { npcId: "customs",  col: 8,  row: 9, startId: "customs_01", hasQuest: false },
  ],
  kotodamaSpots: [[10, 5], [20, 5]] as const,
  tiledJson: buildTiledJson({
    cols: 30, rows: 18, tilesetName: "test_tileset",
    ground: (c, r) => inRect(c, r, 0, 6, 29, 12) ? PATH : GRASS,
    decoration: () => 0,
    collision: (c, r) => {
      if ((r === 0 || r === 17) && !(c === 15 && r === 0)) return WALL;
      if (c === 0  && r !== 9) return WALL;
      if (c === 29 && r !== 9) return WALL;
      if (inRect(c, r, 5, 2, 24, 5)) return WALL;
      return 0;
    },
    abovePlayer: () => 0,
  }),
};
