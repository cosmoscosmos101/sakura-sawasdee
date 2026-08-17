import Phaser from "phaser";
import { TILE_SIZE, CHAR_HEIGHT } from "../config";
import { hex } from "../palette";
import type { MinigameEventDef } from "../maps/mapDef";

/**
 * Non-player character — stands on the overworld map, responds to Space/Z
 * interaction when the player is an adjacent tile away.
 *
 * PLACEHOLDER: Uses px_npc_sheet generated in BootScene.
 * Replace with named NPC spritesheets in Phase 2.
 */
export class NPC extends Phaser.GameObjects.Sprite {
  private readonly npcId: string;
  private readonly col: number;
  private readonly row: number;
  private readonly startDialogueId: string;
  private readonly minigame: MinigameEventDef | undefined;
  private questIndicator?: Phaser.GameObjects.Graphics;

  constructor(
    scene: Phaser.Scene,
    npcId: string,
    col: number,
    row: number,
    startDialogueId: string,
    hasQuest = false,
    minigameEvent?: MinigameEventDef,
  ) {
    super(
      scene,
      col * TILE_SIZE + TILE_SIZE / 2,
      (row + 1) * TILE_SIZE,
      "px_npc_sheet",
      "idle_down",
    );
    this.npcId = npcId;
    this.col = col;
    this.row = row;
    this.startDialogueId = startDialogueId;
    this.minigame = minigameEvent;

    this.setOrigin(0.5, 1).setDepth(9);
    scene.add.existing(this);

    // Idle bob — "Living Pastel", Pillar 3
    scene.tweens.add({
      targets: this,
      y: this.y - 2,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
      delay: Math.random() * 600, // stagger so NPCs don't all move in sync
    });

    if (hasQuest) this.createQuestIndicator(scene);
  }

  private createQuestIndicator(scene: Phaser.Scene): void {
    const gfx = scene.add.graphics();
    const x = this.x;
    const y = this.y - CHAR_HEIGHT - 4;

    gfx.fillStyle(hex("GOLD_1"), 1);
    gfx.fillCircle(0, 0, 8);
    gfx.fillStyle(hex("INK_DARK"), 1);
    gfx.fillRect(-1, -5, 2, 5);
    gfx.fillRect(-1, 3, 2, 2);
    gfx.setPosition(x, y).setDepth(15).setScrollFactor(1);

    // Floating bounce
    scene.tweens.add({
      targets: gfx,
      y: gfx.y - 3,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.questIndicator = gfx;
  }

  /**
   * True when the player is exactly 1 tile away (4-directional adjacency).
   * Diagonal adjacency is intentionally excluded — the player must be
   * facing the NPC to interact.
   */
  isAdjacentTo(playerCol: number, playerRow: number): boolean {
    const dc = Math.abs(this.col - playerCol);
    const dr = Math.abs(this.row - playerRow);
    return (dc === 1 && dr === 0) || (dc === 0 && dr === 1);
  }

  /**
   * True when the player is on this NPC's tile (shouldn't happen with proper
   * collision, but guards against edge cases).
   */
  isCollidingWith(playerCol: number, playerRow: number): boolean {
    return this.col === playerCol && this.row === playerRow;
  }

  getNpcId(): string { return this.npcId; }
  getStartDialogueId(): string { return this.startDialogueId; }
  getMinigameEvent(): MinigameEventDef | undefined { return this.minigame; }
  getCol(): number { return this.col; }
  getRow(): number { return this.row; }

  hideQuestIndicator(): void {
    this.questIndicator?.setVisible(false);
  }

  destroy(fromScene?: boolean): void {
    this.questIndicator?.destroy();
    super.destroy(fromScene);
  }
}
