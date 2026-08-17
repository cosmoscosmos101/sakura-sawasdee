import { buildTiledJson, border, inRect, atPoints, type CellFn } from "./mapBuilder";
import type { MapDef } from "./mapDef";

const GRASS = 1, PATH = 2, TRUNK = 4, WALL = 5, FLOWER = 7, CANOPY = 8;

function treeAbove(trees: ReadonlyArray<readonly [number, number]>): CellFn {
  return (c, r) => {
    for (const [tc, tr] of trees) {
      if (tc === c && (tr - 1 === r || tr - 2 === r)) return CANOPY;
    }
    return 0;
  };
}

// ── Hanami Academy (32×24) ────────────────────────────────────────────────────
// The school occupies the north half; the courtyard fills the centre.
// South portal → sakura_path.  Keigo Kaiju boss at col 15 row 8 (school hall).
//
// Room map (approximate grid columns):
//   cols  2-30, rows 1-6  = school building (shoe lockers / classrooms / library)
//   cols  2-30, rows 7-9  = inner corridor (Keigo Kaiju boss zone)
//   cols  2-30, rows 10-16 = courtyard (open air, sakura tree)
//   cols  2-10, rows 17-20 = west wing (club room / music room)
//   cols 20-30, rows 17-20 = east wing (cafeteria / infirmary)
//   cols 11-20, rows 21-23 = south gate path → portal

const HA_TREES = [
  [4,  12], [6,  14], [10, 11],
  [22, 13], [26, 11], [28, 14],
  [15, 10],
] as const;

export const HANAMI_ACADEMY: MapDef = {
  key: "hanami_academy", worldId: "ja", cols: 32, rows: 24,
  tilesetName: "test_tileset",
  playerStart: { col: 15, row: 19 },
  weatherType: "sakura",
  portals: [
    { col: 15, row: 23, targetMapKey: "sakura_path",     targetCol: 14, targetRow: 20 },
    { col: 31, row: 12, targetMapKey: "shopping_street",  targetCol: 1,  targetRow: 10 },
    { col: 0,  row: 12, targetMapKey: "winter_courtyard", targetCol: 28, targetRow: 10 },
  ],
  npcs: [
    { npcId: "teacher_tanaka", col: 8,  row: 4,  startId: "tanaka_01",  hasQuest: true  },
    { npcId: "momo",           col: 15, row: 14, startId: "momo_01",    hasQuest: false },
    { npcId: "student_yuki",   col: 24, row: 4,  startId: "yuki_01",    hasQuest: false },
    { npcId: "librarian",      col: 28, row: 4,  startId: "librarian_01", hasQuest: true },
  ],
  kotodamaSpots: [[6, 7], [25, 7], [15, 12], [8, 18], [24, 18]] as const,
  tiledJson: buildTiledJson({
    cols: 32, rows: 24, tilesetName: "test_tileset",
    ground: (c, r) => {
      // School building interior
      if (inRect(c, r, 2, 1, 30, 9)) return PATH;
      // Courtyard
      if (inRect(c, r, 2, 10, 30, 16)) return GRASS;
      // Wing corridors
      if (inRect(c, r, 2, 17, 10, 20) || inRect(c, r, 20, 17, 30, 20)) return PATH;
      // South gate path
      if (inRect(c, r, 13, 21, 19, 23)) return PATH;
      // East-west courtyard walkway
      if (inRect(c, r, 2, 10, 30, 10) || inRect(c, r, 2, 16, 30, 16)) return PATH;
      if (inRect(c, r, 13, 10, 19, 23)) return PATH;
      return GRASS;
    },
    decoration: (c, r) => {
      if (atPoints(c, r, HA_TREES)) return TRUNK;
      // Flower beds along the building front
      if (inRect(c, r, 3, 9, 12, 9) || inRect(c, r, 19, 9, 29, 9)) return FLOWER;
      return 0;
    },
    collision: (c, r) => {
      const portalEdge =
        (c === 15 && r === 23) ||
        (c === 31 && r === 12) ||
        (c === 0  && r === 12);
      if (border(c, r, 32, 24) && !portalEdge) return WALL;
      // School building outer walls
      if (inRect(c, r, 2, 1, 30, 1))  return WALL;
      if (inRect(c, r, 2, 9, 30, 9) && !inRect(c, r, 13, 9, 19, 9)) return WALL;
      // Interior room dividers (classroom / library split)
      if (inRect(c, r, 17, 1, 17, 6)) return WALL;
      if (inRect(c, r, 24, 1, 24, 6)) return WALL;
      if (atPoints(c, r, HA_TREES)) return WALL;
      // Wing outer walls
      if (inRect(c, r, 2, 17, 10, 17) || inRect(c, r, 2, 20, 10, 20)) return WALL;
      if (inRect(c, r, 20, 17, 30, 17) || inRect(c, r, 20, 20, 30, 20)) return WALL;
      return 0;
    },
    abovePlayer: treeAbove(HA_TREES),
  }),
};
