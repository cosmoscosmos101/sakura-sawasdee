import Phaser from "phaser";
import { PALETTE, hex } from "../palette";
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE, CHAR_WIDTH, CHAR_HEIGHT } from "../config";
import { eventBus } from "../../state/eventBus";

/**
 * Boot scene — generates placeholder textures, shows a loading bar, hands off
 * to WorldScene.
 *
 * PLACEHOLDER NOTICE (see CLAUDE.md §10):
 * All textures are procedurally generated. Replace in Phase 2 with real assets:
 *   px_tileset       → a real 256×64 Tiled-compatible tileset PNG
 *   px_player_sheet  → a real 4-direction / 4-frame walk-cycle spritesheet
 *   px_npc_sheet     → NPC direction sheet
 *   px_kotodama      → Kotodama sprite atlas
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload(): void {
    this.makePlaceholderTextures();
    this.drawLoadingBar();
  }

  create(): void {
    eventBus.emit("boot:complete");
    this.time.delayedCall(400, () => this.scene.start("WorldScene"));
  }

  // ── Loading bar ──────────────────────────────────────────────────────────

  private drawLoadingBar(): void {
    const barWidth = 200;
    const barHeight = 8;
    const x = (GAME_WIDTH - barWidth) / 2;
    const y = GAME_HEIGHT / 2 + 20;

    const frame = this.add.graphics();
    frame.lineStyle(1, hex("INK_DARK"), 1);
    frame.strokeRect(x - 2, y - 2, barWidth + 4, barHeight + 4);

    const fill = this.add.graphics();
    this.load.on("progress", (value: number) => {
      fill.clear();
      fill.fillStyle(hex("SAKURA_3"), 1);
      fill.fillRect(x, y, Math.round(barWidth * value), barHeight);
      eventBus.emit("boot:progress", { value });
    });
  }

  // ── Texture generation ───────────────────────────────────────────────────

  private makePlaceholderTextures(): void {
    this.makeTileset();
    this.makePlayerSheet();
    this.makeNpcSheet();
    this.makeKotodama();
    this.makeFogEnemy();
  }

  /**
   * 256×64 tileset — 8 tiles per row, tile size 32×32.
   * GID-to-tile mapping (firstgid=1, so GID n → tile index n-1):
   *   1=grass  2=path  3=water  4=trunk  5=wall  6=_  7=flower  8=canopy
   */
  private makeTileset(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    const tiles: Array<[number, number, string, string]> = [
      // [tileIndex, _, baseColor, accentColor]
      [0, 0, PALETTE.LEAF_1,   PALETTE.LEAF_2],   // GID 1 grass
      [1, 0, PALETTE.CREAM_3,  PALETTE.TEAK_1],   // GID 2 path
      [2, 0, PALETTE.WATER_1,  PALETTE.WATER_2],  // GID 3 water
      [3, 0, PALETTE.BRANCH_1, PALETTE.BRANCH_2], // GID 4 trunk
      [4, 0, PALETTE.LEAF_1,   PALETTE.LEAF_2],   // GID 5 wall (looks like grass; invisible layer)
      [5, 0, PALETTE.FOG_1,    PALETTE.FOG_2],    // GID 6 unused
      [6, 0, PALETTE.SAKURA_2, PALETTE.GOLD_1],   // GID 7 flower
      [7, 0, PALETTE.SAKURA_3, PALETTE.SAKURA_1], // GID 8 canopy
    ];

    for (const [col, row, base, accent] of tiles) {
      const tx = col * TILE_SIZE;
      const ty = row * TILE_SIZE;
      g.fillStyle(Number.parseInt(base.slice(1), 16), 1);
      g.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
      g.fillStyle(Number.parseInt(accent.slice(1), 16), 0.6);
      // Deterministic speckle pattern
      for (let i = 0; i < 5; i++) {
        const sx = tx + 3 + ((i * 7) % (TILE_SIZE - 6));
        const sy = ty + 3 + ((i * 11) % (TILE_SIZE - 6));
        g.fillRect(sx, sy, 2, 2);
      }
    }
    // Extra detail for water: horizontal ripple lines
    g.lineStyle(1, Number.parseInt(PALETTE.WATER_3.slice(1), 16), 0.5);
    for (let i = 0; i < 3; i++) {
      g.lineBetween(64 + 2, i * 9 + 8, 64 + 30, i * 9 + 8);
    }
    // Flower: pink circle with gold centre
    g.fillStyle(Number.parseInt(PALETTE.SAKURA_3.slice(1), 16), 1);
    g.fillCircle(192 + 16, 14, 7);
    g.fillStyle(Number.parseInt(PALETTE.GOLD_1.slice(1), 16), 1);
    g.fillCircle(192 + 16, 14, 3);
    // Canopy: soft circle
    g.fillStyle(Number.parseInt(PALETTE.SAKURA_2.slice(1), 16), 0.9);
    g.fillCircle(224 + 16, 16, 13);
    g.fillStyle(Number.parseInt(PALETTE.SAKURA_1.slice(1), 16), 0.7);
    g.fillCircle(224 + 12, 12, 8);

    g.generateTexture("px_tileset", 256, 64);
    g.destroy();
  }

  /**
   * 128×48 player spritesheet — 4 frames (one per facing direction).
   * Frames are named 'idle_down', 'idle_left', 'idle_right', 'idle_up'.
   * PLACEHOLDER: Real spritesheet must be registered with the same frame names.
   */
  private makePlayerSheet(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    const dirs: Array<[number, string]> = [
      [0, "down"], [32, "left"], [64, "right"], [96, "up"],
    ];
    for (const [ox, dir] of dirs) {
      this.drawPlayerFrame(g, ox, 0, dir as "down" | "left" | "right" | "up");
    }
    g.generateTexture("px_player_sheet", 128, CHAR_HEIGHT);
    g.destroy();

    const tex = this.textures.get("px_player_sheet");
    tex.add("idle_down",  0,  0, 0, CHAR_WIDTH, CHAR_HEIGHT);
    tex.add("idle_left",  0, 32, 0, CHAR_WIDTH, CHAR_HEIGHT);
    tex.add("idle_right", 0, 64, 0, CHAR_WIDTH, CHAR_HEIGHT);
    tex.add("idle_up",    0, 96, 0, CHAR_WIDTH, CHAR_HEIGHT);
  }

  private drawPlayerFrame(
    g: Phaser.GameObjects.Graphics,
    ox: number,
    oy: number,
    dir: "down" | "left" | "right" | "up",
  ): void {
    const ink = hex("INK_DARK");
    // Head
    g.fillStyle(ink, 1);
    g.fillRect(ox + 6, oy + 2, 20, 22);
    g.fillStyle(Number.parseInt(PALETTE.SKIN_2.slice(1), 16), 1);
    g.fillRect(ox + 7, oy + 3, 18, 20);
    g.fillStyle(Number.parseInt(PALETTE.TEAK_1.slice(1), 16), 1);
    g.fillRect(ox + 7, oy + 3, 18, 7);
    g.fillStyle(ink, 1);
    g.fillRect(ox + 11, oy + 14, 3, 4);
    g.fillRect(ox + 19, oy + 14, 3, 4);
    // Body
    g.fillStyle(ink, 1);
    g.fillRect(ox + 8, oy + 24, 16, 22);
    g.fillStyle(Number.parseInt(PALETTE.SKY_NIGHT.slice(1), 16), 1);
    g.fillRect(ox + 9, oy + 25, 14, 20);
    g.fillStyle(Number.parseInt(PALETTE.CREAM_2.slice(1), 16), 1);
    g.fillRect(ox + 13, oy + 25, 6, 8);
    g.fillStyle(Number.parseInt(PALETTE.SAKURA_3.slice(1), 16), 1);
    g.fillRect(ox + 14, oy + 27, 4, 3);
    // Direction indicator dot
    const dotX = ox + 16 + (dir === "left" ? -6 : dir === "right" ? 6 : 0);
    const dotY = oy + (dir === "up" ? 2 : dir === "down" ? 40 : 20);
    g.fillStyle(hex("GOLD_1"), 1);
    g.fillRect(dotX, dotY, 3, 3);
  }

  /** Static NPC placeholder: same as player but tinted differently. */
  private makeNpcSheet(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    const dirs: Array<[number, string]> = [
      [0, "down"], [32, "left"], [64, "right"], [96, "up"],
    ];
    for (const [ox, dir] of dirs) {
      this.drawPlayerFrame(g, ox, 0, dir as "down" | "left" | "right" | "up");
    }
    // Give NPC a different hair colour (lavender) so they're distinguishable
    g.fillStyle(Number.parseInt(PALETTE.LAVENDER_3.slice(1), 16), 1);
    for (const [ox] of dirs) {
      g.fillRect(ox + 7, 3, 18, 7);
    }
    g.generateTexture("px_npc_sheet", 128, CHAR_HEIGHT);
    g.destroy();

    const tex = this.textures.get("px_npc_sheet");
    tex.add("idle_down",  0,  0, 0, CHAR_WIDTH, CHAR_HEIGHT);
    tex.add("idle_left",  0, 32, 0, CHAR_WIDTH, CHAR_HEIGHT);
    tex.add("idle_right", 0, 64, 0, CHAR_WIDTH, CHAR_HEIGHT);
    tex.add("idle_up",    0, 96, 0, CHAR_WIDTH, CHAR_HEIGHT);
  }

  /** Fog Word enemy placeholder — a dim violet fog cloud. */
  private makeFogEnemy(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    // Outer fog mass
    g.fillStyle(Number.parseInt(PALETTE.FOG_2.slice(1), 16), 0.9);
    g.fillEllipse(32, 32, 56, 44);
    // Inner dark core
    g.fillStyle(Number.parseInt(PALETTE.FOG_3.slice(1), 16), 1);
    g.fillEllipse(32, 32, 36, 28);
    // Eyes
    g.fillStyle(Number.parseInt(PALETTE.LAVENDER_3.slice(1), 16), 1);
    g.fillCircle(24, 28, 4);
    g.fillCircle(40, 28, 4);
    g.fillStyle(hex("INK_DARK"), 1);
    g.fillCircle(25, 29, 2);
    g.fillCircle(41, 29, 2);
    // Outline
    g.lineStyle(2, hex("INK_DARK"), 0.6);
    g.strokeEllipse(32, 32, 56, 44);
    g.generateTexture("px_fog_enemy", 64, 64);
    g.destroy();
  }

  private makeKotodama(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(hex("INK_DARK"), 1);
    g.fillCircle(16, 18, 12);
    g.fillStyle(Number.parseInt(PALETTE.SAKURA_2.slice(1), 16), 1);
    g.fillCircle(16, 18, 11);
    g.fillStyle(hex("INK_DARK"), 1);
    g.fillRect(11, 15, 3, 4);
    g.fillRect(19, 15, 3, 4);
    g.fillStyle(Number.parseInt(PALETTE.SAKURA_3.slice(1), 16), 1);
    g.fillTriangle(8, 10, 12, 2, 15, 11);
    g.fillTriangle(24, 10, 20, 2, 17, 11);
    g.generateTexture("px_kotodama", TILE_SIZE, TILE_SIZE);
    g.destroy();
  }
}
