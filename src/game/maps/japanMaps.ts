import { buildTiledJson, border, inRect, atPoints, type CellFn } from "./mapBuilder";
import type { MapDef } from "./mapDef";

// Tile GIDs (firstgid = 1)
const GRASS = 1, PATH = 2, WATER = 3, TRUNK = 4, WALL = 5, FLOWER = 7, CANOPY = 8;

function treeAbove(trees: ReadonlyArray<readonly [number, number]>): CellFn {
  return (c, r) => {
    for (const [tc, tr] of trees) {
      if (tc === c && (tr - 1 === r || tr - 2 === r)) return CANOPY;
    }
    return 0;
  };
}

// ── Sakura Station (30×18) ────────────────────────────────────────────────────
// Portal south → sakura_path row 1
const SS_TREES = [[2, 3], [27, 3], [2, 14], [27, 14]] as const;

export const SAKURA_STATION: MapDef = {
  key: "sakura_station", worldId: "ja", cols: 30, rows: 18,
  tilesetName: "test_tileset",
  playerStart: { col: 14, row: 14 },
  weatherType: "sakura",
  portals: [{ col: 14, row: 17, targetMapKey: "sakura_path", targetCol: 14, targetRow: 1 }],
  npcs: [
    { npcId: "station_master", col: 5,  row: 5,  startId: "station_01", hasQuest: false },
    { npcId: "momo",           col: 14, row: 12, startId: "momo_01",    hasQuest: false },
  ],
  kotodamaSpots: [[8, 7], [20, 7]] as const,
  tiledJson: buildTiledJson({
    cols: 30, rows: 18, tilesetName: "test_tileset",
    ground: (c, r) => inRect(c, r, 5, 4, 24, 10) || inRect(c, r, 12, 11, 17, 17) ? PATH : GRASS,
    decoration: (c, r) => atPoints(c, r, SS_TREES) ? TRUNK : (inRect(c, r, 3, 6, 4, 9) ? FLOWER : 0),
    collision: (c, r) => {
      if (border(c, r, 30, 18) && !(c === 14 && r === 17)) return WALL;
      if (atPoints(c, r, SS_TREES)) return WALL;
      if (inRect(c, r, 5, 3, 24, 3)) return WALL;
      if (inRect(c, r, 5, 11, 24, 11) && !inRect(c, r, 12, 11, 17, 11)) return WALL;
      return 0;
    },
    abovePlayer: treeAbove(SS_TREES),
  }),
};

// ── Sakura Path (40×22) ───────────────────────────────────────────────────────
// Connects: station (N) ↔ hanami_academy / test_map (S), autumn_hill (W), festival (E)
const SP_TREES = [[3, 4], [3, 10], [3, 17], [36, 5], [36, 12], [36, 18], [15, 2], [25, 19]] as const;

export const SAKURA_PATH: MapDef = {
  key: "sakura_path", worldId: "ja", cols: 40, rows: 22,
  tilesetName: "test_tileset",
  playerStart: { col: 14, row: 3 },
  weatherType: "sakura",
  portals: [
    { col: 14, row: 0,  targetMapKey: "sakura_station", targetCol: 14, targetRow: 15 },
    { col: 14, row: 21, targetMapKey: "hanami_academy",   targetCol: 15, targetRow: 21 },
    { col: 0,  row: 11, targetMapKey: "autumn_hill",     targetCol: 28, targetRow: 11 },
    { col: 39, row: 11, targetMapKey: "festival_grounds",targetCol: 1,  targetRow: 12 },
  ],
  npcs: [
    { npcId: "fisherman", col: 8,  row: 12, startId: "fisherman_01", hasQuest: false },
    { npcId: "grandma",   col: 32, row: 8,  startId: "grandma_01",   hasQuest: true  },
  ],
  kotodamaSpots: [[12, 8], [22, 13], [30, 6]] as const,
  tiledJson: buildTiledJson({
    cols: 40, rows: 22, tilesetName: "test_tileset",
    ground: (c, r) => {
      if (inRect(c, r, 5, 1, 33, 5)) return WATER;
      if (inRect(c, r, 12, 0, 16, 21)) return PATH;
      return GRASS;
    },
    decoration: (c, r) => {
      if (atPoints(c, r, SP_TREES)) return TRUNK;
      if (inRect(c, r, 6, 7, 11, 9) || inRect(c, r, 25, 14, 32, 16)) return FLOWER;
      return 0;
    },
    collision: (c, r) => {
      const isPortalEdge = (c === 14 && (r === 0 || r === 21)) || (r === 11 && (c === 0 || c === 39));
      if (border(c, r, 40, 22) && !isPortalEdge) return WALL;
      if (atPoints(c, r, SP_TREES)) return WALL;
      if (inRect(c, r, 5, 1, 33, 5)) return WALL;
      return 0;
    },
    abovePlayer: treeAbove(SP_TREES),
  }),
};

// ── Shrine (26×22) ────────────────────────────────────────────────────────────
// Portal south → test_map col 24, row 18
const SH_TREES = [[3, 5], [22, 5], [3, 15], [22, 15]] as const;

export const SHRINE: MapDef = {
  key: "shrine", worldId: "ja", cols: 26, rows: 22,
  tilesetName: "test_tileset",
  playerStart: { col: 13, row: 19 },
  weatherType: "clear",
  portals: [{ col: 13, row: 21, targetMapKey: "test_map", targetCol: 24, targetRow: 18 }],
  npcs: [
    { npcId: "shrine_maiden", col: 13, row: 5,  startId: "miko_01",    hasQuest: true  },
    { npcId: "visitor",       col: 8,  row: 14, startId: "visitor_01", hasQuest: false },
  ],
  kotodamaSpots: [[10, 10], [16, 10]] as const,
  tiledJson: buildTiledJson({
    cols: 26, rows: 22, tilesetName: "test_tileset",
    ground: (c, r) => {
      if (inRect(c, r, 7, 2, 18, 18) || inRect(c, r, 11, 18, 15, 21)) return PATH;
      return GRASS;
    },
    decoration: (c, r) => {
      if (atPoints(c, r, SH_TREES)) return TRUNK;
      if (inRect(c, r, 8, 3, 11, 4) || inRect(c, r, 14, 3, 17, 4)) return FLOWER;
      return 0;
    },
    collision: (c, r) => {
      if (border(c, r, 26, 22) && !(c === 13 && r === 21)) return WALL;
      if (atPoints(c, r, SH_TREES)) return WALL;
      if (inRect(c, r, 9, 2, 16, 2) || inRect(c, r, 9, 6, 16, 7)) return WALL;
      return 0;
    },
    abovePlayer: treeAbove(SH_TREES),
  }),
};

// ── Shopping Street (36×20) ───────────────────────────────────────────────────
// Portal west → test_map col 28, row 10
export const SHOPPING_STREET: MapDef = {
  key: "shopping_street", worldId: "ja", cols: 36, rows: 20,
  tilesetName: "test_tileset",
  playerStart: { col: 2, row: 10 },
  weatherType: "clear",
  portals: [{ col: 0, row: 10, targetMapKey: "test_map", targetCol: 28, targetRow: 10 }],
  npcs: [
    { npcId: "ramen_chef",  col: 12, row: 5,  startId: "chef_01",    hasQuest: false },
    { npcId: "shopkeeper",  col: 26, row: 5,  startId: "shop_01",    hasQuest: true  },
    { npcId: "student",     col: 18, row: 14, startId: "student_01", hasQuest: false },
  ],
  kotodamaSpots: [[8, 10], [20, 10], [30, 8]] as const,
  tiledJson: buildTiledJson({
    cols: 36, rows: 20, tilesetName: "test_tileset",
    ground: (c, r) => inRect(c, r, 0, 8, 35, 12) ? PATH : GRASS,
    decoration: (c, r) => (r === 7 || r === 13) && c % 4 === 0 ? FLOWER : 0,
    collision: (c, r) => {
      if ((r === 0 || r === 19 || c === 35) && !(c === 0 && r === 10)) return WALL;
      if (c === 0 && r !== 10) return WALL;
      if (inRect(c, r, 1, 2, 34, 6) || inRect(c, r, 1, 14, 34, 18)) return WALL;
      return 0;
    },
    abovePlayer: () => 0,
  }),
};

// ── Winter Courtyard (30×20) ─────────────────────────────────────────────────
// Portal south → test_map col 6, row 18
const WC_TREES = [[6, 4], [22, 6], [10, 17]] as const;

export const WINTER_COURTYARD: MapDef = {
  key: "winter_courtyard", worldId: "ja", cols: 30, rows: 20,
  tilesetName: "test_tileset",
  playerStart: { col: 14, row: 10 },
  weatherType: "snow",
  portals: [{ col: 14, row: 19, targetMapKey: "test_map", targetCol: 6, targetRow: 18 }],
  npcs: [
    { npcId: "snowman_kid", col: 10, row: 8,  startId: "snow_01",  hasQuest: false },
    { npcId: "elder",       col: 20, row: 12, startId: "elder_01", hasQuest: true  },
  ],
  kotodamaSpots: [[5, 8], [18, 5], [25, 14]] as const,
  tiledJson: buildTiledJson({
    cols: 30, rows: 20, tilesetName: "test_tileset",
    ground: (c, r) => inRect(c, r, 13, 0, 15, 19) ? PATH : GRASS,
    decoration: (c, r) => atPoints(c, r, WC_TREES) ? TRUNK : 0,
    collision: (c, r) => {
      if (border(c, r, 30, 20) && !(c === 14 && r === 19)) return WALL;
      return atPoints(c, r, WC_TREES) ? WALL : 0;
    },
    abovePlayer: treeAbove(WC_TREES),
  }),
};

// ── Festival Grounds (40×26) ──────────────────────────────────────────────────
// Portal south → test_map col 14, row 18
const FG_TREES = [[4, 4], [4, 20], [35, 4], [35, 20], [20, 3]] as const;

export const FESTIVAL_GROUNDS: MapDef = {
  key: "festival_grounds", worldId: "ja", cols: 40, rows: 26,
  tilesetName: "test_tileset",
  playerStart: { col: 20, row: 23 },
  weatherType: "clear",
  portals: [
    { col: 20, row: 25, targetMapKey: "sakura_path", targetCol: 38, targetRow: 11 },
  ],
  npcs: [
    { npcId: "yatai_vendor", col: 10, row: 12, startId: "vendor_01", hasQuest: false },
    { npcId: "dancer",       col: 28, row: 10, startId: "dancer_01", hasQuest: true  },
    { npcId: "drummer",      col: 20, row: 8,  startId: "drum_01",   hasQuest: false },
  ],
  kotodamaSpots: [[12, 8], [20, 14], [28, 8], [8, 18], [32, 18]] as const,
  tiledJson: buildTiledJson({
    cols: 40, rows: 26, tilesetName: "test_tileset",
    ground: (c, r) => {
      if (inRect(c, r, 8, 6, 32, 22) || inRect(c, r, 18, 22, 22, 25)) return PATH;
      return GRASS;
    },
    decoration: (c, r) => {
      if (atPoints(c, r, FG_TREES)) return TRUNK;
      if (r === 7 && c >= 9 && c <= 31 && (c - 9) % 4 === 0) return FLOWER;
      return 0;
    },
    collision: (c, r) => {
      if (border(c, r, 40, 26) && !(c === 20 && r === 25)) return WALL;
      return atPoints(c, r, FG_TREES) ? WALL : 0;
    },
    abovePlayer: treeAbove(FG_TREES),
  }),
};

// ── Autumn Hill (30×22) ───────────────────────────────────────────────────────
// Portal east → sakura_path col 1, row 11
const AH_TREES = [[5, 5], [5, 14], [24, 5], [24, 14], [14, 8]] as const;

export const AUTUMN_HILL: MapDef = {
  key: "autumn_hill", worldId: "ja", cols: 30, rows: 22,
  tilesetName: "test_tileset",
  playerStart: { col: 27, row: 11 },
  weatherType: "clear",
  portals: [{ col: 29, row: 11, targetMapKey: "sakura_path", targetCol: 1, targetRow: 11 }],
  npcs: [
    { npcId: "leaf_poet", col: 10, row: 10, startId: "poet_01",  hasQuest: false },
    { npcId: "hiker",     col: 20, row: 14, startId: "hiker_01", hasQuest: true  },
  ],
  kotodamaSpots: [[8, 12], [20, 8], [14, 16]] as const,
  tiledJson: buildTiledJson({
    cols: 30, rows: 22, tilesetName: "test_tileset",
    ground: (c, r) => inRect(c, r, 12, 0, 16, 21) ? PATH : GRASS,
    decoration: (c, r) => {
      if (atPoints(c, r, AH_TREES)) return TRUNK;
      if (inRect(c, r, 8, 16, 20, 18)) return FLOWER;
      return 0;
    },
    collision: (c, r) => {
      if (border(c, r, 30, 22) && !(c === 29 && r === 11)) return WALL;
      if (atPoints(c, r, AH_TREES)) return WALL;
      if (inRect(c, r, 8, 15, 20, 15)) return WALL;
      return 0;
    },
    abovePlayer: treeAbove(AH_TREES),
  }),
};
