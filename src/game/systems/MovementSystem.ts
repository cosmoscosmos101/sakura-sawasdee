import Phaser from "phaser";

/**
 * Grid-based collision — the only authority on whether a tile is walkable.
 *
 * Accepts the 'collision' TilemapLayer (non-zero tile = blocked).
 * Never imports from ui/ or learning/.
 */
export class MovementSystem {
  private readonly layer: Phaser.Tilemaps.TilemapLayer;
  private readonly cols: number;
  private readonly rows: number;

  constructor(
    collisionLayer: Phaser.Tilemaps.TilemapLayer,
    mapCols: number,
    mapRows: number,
  ) {
    this.layer = collisionLayer;
    this.cols = mapCols;
    this.rows = mapRows;
  }

  /** True if the player may step onto (targetCol, targetRow). */
  canMoveTo(targetCol: number, targetRow: number): boolean {
    if (
      targetCol < 0 ||
      targetCol >= this.cols ||
      targetRow < 0 ||
      targetRow >= this.rows
    ) {
      return false;
    }
    // hasTileAt returns true when a non-empty tile exists → blocked
    return !this.layer.hasTileAt(targetCol, targetRow);
  }

  /** Snap world-pixel coordinates to the nearest tile column. */
  static worldToTileCol(worldX: number, tileSize: number): number {
    return Math.floor(worldX / tileSize);
  }

  /** Snap world-pixel coordinates to the nearest tile row. */
  static worldToTileRow(worldY: number, tileSize: number): number {
    return Math.floor(worldY / tileSize);
  }
}
