import Phaser from "phaser";
import { TILE_SIZE } from "../config";
import type { MovementSystem } from "../systems/MovementSystem";
import type { CardinalDir } from "../systems/VirtualJoystick";

export type Direction = "down" | "left" | "right" | "up";

const MOVE_MS = 200;       // ms per tile at normal speed
const RUN_MULT = 1.6;      // Shift: ×1.6 speed → ÷1.6 duration
const FRAME_KEY: Record<Direction, string> = {
  down:  "idle_down",
  left:  "idle_left",
  right: "idle_right",
  up:    "idle_up",
};

/**
 * Grid-locked player — the central entity in WorldScene.
 *
 * Movement is tween-based: one tile at a time, 200 ms per step.
 * While a tween is running, input is ignored (no diagonal clipping).
 * Sprites are placeholders until real sheets arrive — swap in P2.
 *
 * PLACEHOLDER NOTICE: Uses 'px_player_sheet' generated in BootScene.
 * Replace with a real 4-direction / walk-cycle spritesheet in Phase 2.
 */
export class Player extends Phaser.GameObjects.Sprite {
  private col: number;
  private row: number;
  private moving = false;
  private facing: Direction = "down";

  constructor(scene: Phaser.Scene, startCol: number, startRow: number) {
    super(
      scene,
      startCol * TILE_SIZE + TILE_SIZE / 2,
      (startRow + 1) * TILE_SIZE,
      "px_player_sheet",
      "idle_down",
    );
    this.col = startCol;
    this.row = startRow;
    this.setOrigin(0.5, 1);
    this.setDepth(10);
    scene.add.existing(this);
    this.play("idle_down");
  }

  /** Attempt to move dx/dy tiles. No-op while a tween is in progress. */
  tryMove(dx: number, dy: number, running: boolean, sys: MovementSystem): void {
    if (this.moving || (dx === 0 && dy === 0)) return;

    const tc = this.col + dx;
    const tr = this.row + dy;
    if (!sys.canMoveTo(tc, tr)) return;

    this.facing = this.dirFrom(dx, dy);
    this.play(`walk_${this.facing}`, true);

    this.col = tc;
    this.row = tr;
    this.moving = true;

    const duration = MOVE_MS / (running ? RUN_MULT : 1);
    this.scene.tweens.add({
      targets: this,
      x: tc * TILE_SIZE + TILE_SIZE / 2,
      y: (tr + 1) * TILE_SIZE,
      duration,
      ease: "Linear",
      onComplete: () => {
        this.moving = false;
        this.play(`idle_${this.facing}`, true);
      },
    });
  }

  /** Move from an external direction signal (virtual joystick). */
  tryMoveDir(dir: CardinalDir, running: boolean, sys: MovementSystem): void {
    const map: Record<CardinalDir, [number, number]> = {
      up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0], none: [0, 0],
    };
    const [dx, dy] = map[dir];
    this.tryMove(dx, dy, running, sys);
  }

  isMoving(): boolean { return this.moving; }
  getCol(): number { return this.col; }
  getRow(): number { return this.row; }
  getFacing(): Direction { return this.facing; }

  /** World-space tile-centred position (feet). */
  getTileWorldX(): number { return this.col * TILE_SIZE + TILE_SIZE / 2; }
  getTileWorldY(): number { return (this.row + 1) * TILE_SIZE; }

  private dirFrom(dx: number, dy: number): Direction {
    if (dx < 0) return "left";
    if (dx > 0) return "right";
    if (dy < 0) return "up";
    return "down";
  }

  // ── Animation helpers ─────────────────────────────────────────────────────

  /**
   * Register animations in the scene's global AnimationManager.
   * Call once from WorldScene.create() before adding the Player.
   * PLACEHOLDER: single-frame stand-ins — real 4-frame walk cycles in Phase 2.
   */
  static createAnimations(scene: Phaser.Scene): void {
    const dirs: Direction[] = ["down", "left", "right", "up"];
    for (const dir of dirs) {
      scene.anims.create({
        key: `walk_${dir}`,
        frames: [{ key: "px_player_sheet", frame: FRAME_KEY[dir] }],
        frameRate: 8,
        repeat: -1,
      });
      scene.anims.create({
        key: `idle_${dir}`,
        frames: [{ key: "px_player_sheet", frame: FRAME_KEY[dir] }],
        frameRate: 2,
        repeat: -1,
      });
    }
  }
}
