import Phaser from "phaser";
import { TILE_SIZE } from "../config";
import { db } from "../../data/db";
import { getDueCards } from "../../learning/srs";
import type { VocabEntry } from "../../content/schema";

interface WildKotodama {
  sprite: Phaser.GameObjects.Sprite;
  glow: Phaser.GameObjects.Graphics;
  vocabId: string;
  col: number;
  row: number;
  isDue: boolean;
  moveTimer: number;
}

const WANDER_INTERVAL = 2500; // ms between steps
const GLOW_COLOUR = 0xFFE08A;  // GOLD_1 — due-for-review indicator
const GLOW_ALPHA = 0.45;

/**
 * EncounterSystem — places visible Kotodama on the map.
 * Kotodama whose SRS card is due glow gold (GDD §phase3).
 *
 * Call `spawn(pool, mapCols, mapRows)` once after tilemap load.
 * Call `update(delta)` every frame to drive wandering movement.
 */
export class EncounterSystem {
  private scene: Phaser.Scene;
  private wilds: WildKotodama[] = [];
  private dueVocabIds = new Set<string>();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    void this.loadDueCards();
  }

  private async loadDueCards(): Promise<void> {
    const cards = await db.srsCards.toArray();
    const due = getDueCards(cards, Date.now());
    this.dueVocabIds = new Set(due.map((c) => c.vocabId));
    for (const w of this.wilds) {
      w.isDue = this.dueVocabIds.has(w.vocabId);
      this.refreshGlow(w);
    }
  }

  /**
   * Spawn `count` wild Kotodama drawn from `pool`, randomly placed within the
   * map boundary. Avoids placing on the player start tile.
   */
  spawn(
    pool: VocabEntry[],
    mapCols: number,
    mapRows: number,
    count = Math.min(pool.length, 6),
  ): void {
    const used = new Set<string>();
    const shuffled = [...pool].sort(() => Math.random() - 0.5);

    for (let i = 0; i < count; i++) {
      const entry = shuffled[i];
      if (!entry) break;

      let col: number;
      let row: number;
      let key: string;
      let attempts = 0;
      do {
        col = 2 + Math.floor(Math.random() * (mapCols - 4));
        row = 2 + Math.floor(Math.random() * (mapRows - 4));
        key = `${col},${row}`;
        attempts++;
      } while (used.has(key) && attempts < 20);
      used.add(key);

      this.spawnOne(entry, col, row);
    }
  }

  private spawnOne(entry: VocabEntry, col: number, row: number): void {
    const x = col * TILE_SIZE + TILE_SIZE / 2;
    const y = (row + 1) * TILE_SIZE;
    const isDue = this.dueVocabIds.has(entry.id);

    const glow = this.scene.add.graphics()
      .fillStyle(GLOW_COLOUR, isDue ? GLOW_ALPHA : 0)
      .fillCircle(x, y - TILE_SIZE / 2, TILE_SIZE * 0.7)
      .setDepth(7);

    const sprite = this.scene.add.sprite(x, y, "px_kotodama")
      .setDepth(8)
      .setOrigin(0.5, 1);

    this.scene.tweens.add({
      targets: sprite,
      y: sprite.y - 4,
      duration: 900 + Math.random() * 200,
      yoyo: true,
      repeat: -1,
      offset: Math.random() * 900,
    });

    if (isDue) {
      this.scene.tweens.add({
        targets: glow,
        alpha: 0.15,
        duration: 1000,
        yoyo: true,
        repeat: -1,
      });
    }

    this.wilds.push({
      sprite,
      glow,
      vocabId: entry.id,
      col,
      row,
      isDue,
      moveTimer: Math.random() * WANDER_INTERVAL,
    });
  }

  private refreshGlow(w: WildKotodama): void {
    const alpha = w.isDue ? GLOW_ALPHA : 0;
    w.glow.clear().fillStyle(GLOW_COLOUR, alpha).fillCircle(
      w.sprite.x,
      w.sprite.y - TILE_SIZE / 2,
      TILE_SIZE * 0.7,
    );
  }

  /** Gentle random-walk wandering. delta is in ms. */
  update(delta: number): void {
    for (const w of this.wilds) {
      w.moveTimer -= delta;
      if (w.moveTimer > 0) continue;
      w.moveTimer = WANDER_INTERVAL + Math.random() * 1000;

      const dx = Math.sign(Math.random() - 0.5);
      const dy = Math.sign(Math.random() - 0.5);
      w.col += dx;
      w.row += dy;

      const tx = w.col * TILE_SIZE + TILE_SIZE / 2;
      const ty = (w.row + 1) * TILE_SIZE;

      this.scene.tweens.add({
        targets: w.sprite,
        x: tx,
        duration: 300,
        ease: "Sine.easeInOut",
      });
      w.glow.setPosition(tx - w.sprite.x, ty - (w.row + 1) * TILE_SIZE);
    }
  }

  destroy(): void {
    for (const w of this.wilds) {
      w.sprite.destroy();
      w.glow.destroy();
    }
    this.wilds = [];
  }
}
