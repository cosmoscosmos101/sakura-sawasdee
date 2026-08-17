/**
 * Procedurally generated 30×20 test world map in Tiled JSON format.
 *
 * Tile GID key (firstgid = 1):
 *   1 = grass   2 = path    3 = water
 *   4 = trunk   5 = wall    7 = flower   8 = canopy
 *
 * PLACEHOLDER: Replace with a real Tiled .tmj file in P2.
 * Real sprites must be swapped in by updating BootScene's makeTileset().
 */

const W = 30;
const H = 20;

// Trees at [col, row] — must match BootScene decoration placement
const TREES: ReadonlyArray<readonly [number, number]> = [
  [6, 4], [6, 11], [22, 6], [22, 14], [10, 17],
];
const FLOWERS: ReadonlyArray<readonly [number, number]> = [
  [3, 3], [8, 6], [11, 2], [18, 8], [3, 15], [17, 16],
];

function makeGround(): number[] {
  const d: number[] = [];
  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W; c++) {
      if (r >= 1 && r <= 5 && c >= 23 && c <= 27) d.push(3);      // water
      else if (r >= 1 && r <= 18 && c >= 13 && c <= 16) d.push(2); // path
      else d.push(1);                                               // grass
    }
  }
  return d;
}

// Border tiles that serve as portal exits — left open (GID 0) so the player can step there.
const PORTAL_TILES: ReadonlyArray<readonly [number, number]> = [
  [14, 0],   // north → sakura_path
  [29, 10],  // east  → shopping_street
  [24, 19],  // SE    → shrine
  [6,  19],  // SW    → winter_courtyard
  [0,  9],   // west  → airport
];

function makeCollision(): number[] {
  const d = new Array<number>(W * H).fill(0);
  const isTree = (c: number, r: number) =>
    TREES.some(([tc, tr]) => tc === c && tr === r);
  const isPortal = (c: number, r: number) =>
    PORTAL_TILES.some(([pc, pr]) => pc === c && pr === r);
  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W; c++) {
      const i = r * W + c;
      const onBorder = r === 0 || r === H - 1 || c === 0 || c === W - 1;
      const isWater = c >= 23 && c <= 27 && r >= 1 && r <= 5;
      if ((onBorder && !isPortal(c, r)) || isTree(c, r) || isWater) d[i] = 5;
    }
  }
  return d;
}

function makeDecoration(): number[] {
  const d = new Array<number>(W * H).fill(0);
  for (const [c, r] of TREES) d[r * W + c] = 4;
  for (const [c, r] of FLOWERS) d[r * W + c] = 7;
  return d;
}

function makeAbovePlayer(): number[] {
  const d = new Array<number>(W * H).fill(0);
  for (const [c, r] of TREES) {
    if (r - 1 >= 0) d[(r - 1) * W + c] = 8;
    if (r - 2 >= 0) d[(r - 2) * W + c] = 8;
  }
  return d;
}

function layer(name: string, id: number, data: number[]) {
  return {
    id, name, type: "tilelayer", visible: true, opacity: 1,
    x: 0, y: 0, width: W, height: H, data,
  };
}

export const TEST_MAP = {
  version: "1.10", tiledversion: "1.10.2", type: "map",
  orientation: "orthogonal", renderorder: "right-down",
  infinite: false, compressionlevel: -1,
  nextlayerid: 5, nextobjectid: 1,
  width: W, height: H, tilewidth: 32, tileheight: 32,
  tilesets: [{
    firstgid: 1, name: "test_tileset",
    tilewidth: 32, tileheight: 32,
    columns: 8, tilecount: 16, margin: 0, spacing: 0,
    imagewidth: 256, imageheight: 64,
    image: "../tilesets/test_tileset.png",
  }],
  layers: [
    layer("ground", 1, makeGround()),
    layer("decoration", 2, makeDecoration()),
    layer("collision", 3, makeCollision()),
    layer("above_player", 4, makeAbovePlayer()),
  ],
} as const;
