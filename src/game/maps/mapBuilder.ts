/** Shared utilities for procedurally generating Tiled JSON maps. */

export type CellFn = (col: number, row: number) => number;

export interface MapLayout {
  cols: number;
  rows: number;
  tilesetName: string;
  ground: CellFn;
  decoration: CellFn;
  collision: CellFn;
  abovePlayer: CellFn;
}

function makeData(cols: number, rows: number, fn: CellFn): number[] {
  const data: number[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      data.push(fn(c, r));
    }
  }
  return data;
}

function tiledLayer(id: number, name: string, w: number, h: number, data: number[]) {
  return { id, name, type: "tilelayer", visible: true, opacity: 1, x: 0, y: 0, width: w, height: h, data };
}

export function buildTiledJson(layout: MapLayout): object {
  const { cols: W, rows: H, tilesetName } = layout;
  return {
    version: "1.10", tiledversion: "1.10.2", type: "map",
    orientation: "orthogonal", renderorder: "right-down",
    infinite: false, compressionlevel: -1,
    nextlayerid: 5, nextobjectid: 1,
    width: W, height: H, tilewidth: 32, tileheight: 32,
    tilesets: [{
      firstgid: 1, name: tilesetName,
      tilewidth: 32, tileheight: 32,
      columns: 8, tilecount: 16, margin: 0, spacing: 0,
      imagewidth: 256, imageheight: 64,
      image: "../tilesets/test_tileset.png",
    }],
    layers: [
      tiledLayer(1, "ground",       W, H, makeData(W, H, layout.ground)),
      tiledLayer(2, "decoration",   W, H, makeData(W, H, layout.decoration)),
      tiledLayer(3, "collision",    W, H, makeData(W, H, layout.collision)),
      tiledLayer(4, "above_player", W, H, makeData(W, H, layout.abovePlayer)),
    ],
  };
}

// ── Common cell predicates ────────────────────────────────────────────────────

export function border(c: number, r: number, cols: number, rows: number): boolean {
  return c === 0 || r === 0 || c === cols - 1 || r === rows - 1;
}

export function inRect(c: number, r: number, x1: number, y1: number, x2: number, y2: number): boolean {
  return c >= x1 && c <= x2 && r >= y1 && r <= y2;
}

export function atPoints(c: number, r: number, pts: ReadonlyArray<readonly [number, number]>): boolean {
  return pts.some(([pc, pr]) => pc === c && pr === r);
}
