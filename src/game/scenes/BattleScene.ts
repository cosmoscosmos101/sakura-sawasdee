import Phaser from "phaser";
import { PALETTE, hex } from "../palette";
import { GAME_WIDTH, GAME_HEIGHT } from "../config";
import { eventBus } from "../../state/eventBus";

interface BattleInitData {
  enemyId: string;
  locationId: string;
}

/**
 * Phaser battle scene — visuals only.
 *
 * All game logic lives in battleStore (Zustand) and React UI.
 * This scene only renders and animates. It subscribes to battle:effect
 * events and plays the corresponding animations.
 *
 * Lifecycle:
 *   WorldScene detects encounter → scene.launch("BattleScene", data) + scene.sleep()
 *   BattleScene starts, React BattleOverlay appears
 *   battle:end event → BattleScene fades out → WorldScene wakes
 */
export class BattleScene extends Phaser.Scene {
  private enemySprite!: Phaser.GameObjects.Sprite;
  private partySprites: Phaser.GameObjects.Sprite[] = [];
  private damageText?: Phaser.GameObjects.Text;
  private offEffect?: () => void;
  private offBattleEnd?: () => void;
  private enemyFloatTween?: Phaser.Tweens.Tween;

  constructor() {
    super({ key: "BattleScene" });
  }

  init(_data: BattleInitData): void {
    // data available if needed for future location-specific backdrops
  }

  create(): void {
    this.drawBackdrop();
    this.spawnEnemy();
    this.spawnParty();
    this.bindEvents();
  }

  // ── Background ──────────────────────────────────────────────────────────

  private drawBackdrop(): void {
    const g = this.add.graphics();

    // Sky gradient (top half)
    const skyTop = Number.parseInt(PALETTE.SKY_DAWN.slice(1), 16);
    const skyBot = Number.parseInt(PALETTE.SAKURA_2.slice(1), 16);
    for (let y = 0; y < GAME_HEIGHT * 0.55; y++) {
      const t = y / (GAME_HEIGHT * 0.55);
      const r = Math.round(((skyTop >> 16) & 0xff) * (1 - t) + ((skyBot >> 16) & 0xff) * t);
      const gr = Math.round(((skyTop >> 8) & 0xff) * (1 - t) + ((skyBot >> 8) & 0xff) * t);
      const b = Math.round((skyTop & 0xff) * (1 - t) + (skyBot & 0xff) * t);
      g.fillStyle((r << 16) | (gr << 8) | b, 1);
      g.fillRect(0, y, GAME_WIDTH, 1);
    }

    // Ground band
    g.fillStyle(Number.parseInt(PALETTE.LEAF_1.slice(1), 16), 1);
    g.fillRect(0, Math.round(GAME_HEIGHT * 0.55), GAME_WIDTH, Math.round(GAME_HEIGHT * 0.15));
    g.fillStyle(Number.parseInt(PALETTE.LEAF_2.slice(1), 16), 1);
    g.fillRect(0, Math.round(GAME_HEIGHT * 0.7), GAME_WIDTH, Math.round(GAME_HEIGHT * 0.3));

    // Atmospheric fog at horizon
    g.fillStyle(Number.parseInt(PALETTE.FOG_1.slice(1), 16), 0.35);
    g.fillRect(0, Math.round(GAME_HEIGHT * 0.48), GAME_WIDTH, Math.round(GAME_HEIGHT * 0.12));

    g.setDepth(0);

    // Silhouette sakura trees (left and right)
    this.drawSilhouetteTrees(g);
  }

  private drawSilhouetteTrees(g: Phaser.GameObjects.Graphics): void {
    const treeColor = Number.parseInt(PALETTE.SAKURA_4.slice(1), 16);
    const trunkColor = Number.parseInt(PALETTE.BRANCH_1.slice(1), 16);

    const trees = [
      { x: 30, ground: Math.round(GAME_HEIGHT * 0.7) },
      { x: GAME_WIDTH - 30, ground: Math.round(GAME_HEIGHT * 0.7) },
    ];
    for (const { x, ground } of trees) {
      g.fillStyle(trunkColor, 1);
      g.fillRect(x - 3, ground - 40, 6, 40);
      g.fillStyle(treeColor, 0.7);
      g.fillCircle(x, ground - 50, 28);
      g.fillStyle(Number.parseInt(PALETTE.SAKURA_2.slice(1), 16), 0.5);
      g.fillCircle(x - 8, ground - 62, 18);
    }
  }

  // ── Sprites ─────────────────────────────────────────────────────────────

  private spawnEnemy(): void {
    this.enemySprite = this.add.sprite(
      GAME_WIDTH / 2, Math.round(GAME_HEIGHT * 0.38), "px_fog_enemy",
    );
    this.enemySprite
      .setScale(2)
      .setOrigin(0.5, 1)
      .setDepth(10)
      .setAlpha(0);

    this.tweens.add({
      targets: this.enemySprite,
      alpha: 1,
      duration: 400,
      ease: "Sine.easeOut",
    });

    this.enemyFloatTween = this.tweens.add({
      targets: this.enemySprite,
      y: this.enemySprite.y - 6,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
      delay: 400,
    });
  }

  private spawnParty(): void {
    const slotXs = [60, 130, 200, 270] as const;
    const y = GAME_HEIGHT - 18;
    for (const x of slotXs) {
      const s = this.add.sprite(x, y, "px_kotodama")
        .setScale(1.2)
        .setOrigin(0.5, 1)
        .setDepth(10);
      this.partySprites.push(s);
    }
  }

  // ── Event handlers ───────────────────────────────────────────────────────

  private bindEvents(): void {
    this.offEffect = eventBus.on("battle:effect", ({ type, amount }) => {
      switch (type) {
        case "damage":
        case "critical": this.playDamageEffect(amount ?? 0, type === "critical"); break;
        case "miss":     this.playMissEffect(); break;
        case "combo":    this.playComboEffect(amount ?? 0); break;
        default: break;
      }
    });

    this.offBattleEnd = eventBus.on("battle:end", () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.wake("WorldScene");
        this.scene.stop();
      });
    });
  }

  private playDamageEffect(amount: number, critical: boolean): void {
    // Enemy flash red-pink
    this.tweens.add({
      targets: this.enemySprite,
      alpha: 0.3,
      duration: 80,
      yoyo: true,
      repeat: 2,
    });
    // Gentle screen shake (Pillar 1: always gentle)
    this.cameras.main.shake(120, critical ? 0.007 : 0.004);

    if (amount > 0) this.showDamageNumber(amount, critical);
  }

  private playMissEffect(): void {
    if (this.damageText) this.damageText.destroy();
    this.damageText = this.add.text(
      GAME_WIDTH / 2 - 16, Math.round(GAME_HEIGHT * 0.28), "...",
      { fontSize: "10px", color: PALETTE.INK_SOFT },
    ).setDepth(50);
    this.tweens.add({
      targets: this.damageText,
      y: this.damageText.y - 12,
      alpha: 0,
      duration: 700,
      onComplete: () => this.damageText?.destroy(),
    });
  }

  private playComboEffect(amount: number): void {
    this.cameras.main.shake(200, 0.008);
    // Rainbow flash across enemy
    const flash = this.add.graphics().setDepth(20);
    flash.fillStyle(hex("GOLD_1"), 0.6);
    flash.fillRect(0, 0, GAME_WIDTH, Math.round(GAME_HEIGHT * 0.7));
    this.tweens.add({ targets: flash, alpha: 0, duration: 300, onComplete: () => flash.destroy() });
    if (amount > 0) this.showDamageNumber(amount, true);
  }

  private showDamageNumber(amount: number, critical: boolean): void {
    this.damageText?.destroy();
    const color = critical ? PALETTE.GOLD_1 : PALETTE.SAKURA_3;
    this.damageText = this.add.text(
      GAME_WIDTH / 2 - 10, Math.round(GAME_HEIGHT * 0.22),
      critical ? `${amount}!!` : `${amount}`,
      { fontSize: critical ? "14px" : "10px", color },
    ).setDepth(50);
    this.tweens.add({
      targets: this.damageText,
      y: this.damageText.y - 18,
      alpha: 0,
      duration: 900,
      ease: "Sine.easeOut",
      onComplete: () => this.damageText?.destroy(),
    });
  }

  // ── Cleanup ──────────────────────────────────────────────────────────────

  shutdown(): void {
    this.offEffect?.();
    this.offBattleEnd?.();
    this.enemyFloatTween?.stop();
  }
}
