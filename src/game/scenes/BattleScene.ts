import Phaser from "phaser";
import { eventBus } from "../../state/eventBus";
import { useBattleStore } from "../../state/battleStore";
import { GAME_WIDTH, GAME_HEIGHT } from "../config";

const ENEMY_X  = 120;  const ENEMY_Y  = 110;
const CHRONO_X = 340;  const CHRONO_Y = 140;

function randomBg(): string { return "map-forest"; }

function enemySprite(enemyId: string): string {
  if (enemyId.includes("magus")) return "magus";
  // Each enemy id maps to a consistent monster sprite (1, 2, or 3)
  const n = (enemyId.charCodeAt(enemyId.length - 1) % 3) + 1;
  return `monster-${n}`;
}

export class BattleScene extends Phaser.Scene {
  private bg!:        Phaser.GameObjects.Image;
  private enemySpr!:  Phaser.GameObjects.Image;
  private chronoSpr!: Phaser.GameObjects.Image;
  private bgm?: Phaser.Sound.BaseSound;
  private offEffect!: () => void;
  private offEnd!:    () => void;
  private offEnemy!:  () => void;
  private unsubStore!: () => void;

  constructor() { super({ key: "BattleScene" }); }

  create() {
    this.bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, randomBg())
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

    const { enemyId, bossGimmick } = useBattleStore.getState();
    this.enemySpr  = this.add.image(ENEMY_X,  ENEMY_Y,  enemySprite(enemyId)).setDepth(5);
    this.chronoSpr = this.add.image(CHRONO_X, CHRONO_Y, "crono-idle-left").setDepth(5).setFlipX(true);

    const bgmKey = bossGimmick ? "bgm-boss" : "bgm-battle";
    this.bgm = this.sound.get(bgmKey) ?? this.sound.add(bgmKey, { loop: true, volume: 0.45 });
    if (!this.bgm.isPlaying) this.bgm.play();

    this.cameras.main.flash(200, 255, 255, 255);

    // ── Event bus listeners ────────────────────────────────────────────────
    this.offEffect = eventBus.on("battle:effect", ({ type, amount }) => this.playEffect(type, amount ?? 0));
    this.offEnemy  = eventBus.on("battle:enemy_action", () => this.enemyAttackAnim());
    this.offEnd    = eventBus.on("battle:end", ({ won }) => {
      this.stopBgm();
      const delay = won ? 600 : 700;
      if (won) this.cameras.main.flash(400, 255, 255, 200);
      else     this.cameras.main.fade(600, 0, 0, 0);
      this.time.delayedCall(delay, () => {
        this.scene.wake("WorldScene");
        this.scene.sleep("BattleScene");
      });
    });

    // ── Store subscription — track HP changes for Chrono hit anim ─────────
    this.unsubStore = useBattleStore.subscribe((state, prev) => {
      if (!this.scene.isActive("BattleScene")) return;
      if (state.playerHp < prev.playerHp) {
        this.chronoTakesHit(prev.playerHp - state.playerHp);
      }
      if (state.phase !== prev.phase) this.onPhaseChange(state.phase, state.enemyId);
    });

    // ── Wake: refresh sprites/bg/bgm for the NEW battle ───────────────────
    this.events.on(Phaser.Scenes.Events.WAKE, this.onWake, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.offEffect(); this.offEnemy(); this.offEnd();
      this.unsubStore();
      this.events.off(Phaser.Scenes.Events.WAKE, this.onWake, this);
    });
  }

  /** Called every time the scene wakes after the first battle. */
  private onWake() {
    const { enemyId, bossGimmick } = useBattleStore.getState();

    // Fresh random background
    this.bg.setTexture(randomBg());

    // Correct enemy sprite for THIS battle — prevents mixing up opponents
    this.enemySpr.setTexture(enemySprite(enemyId)).setPosition(ENEMY_X, ENEMY_Y);
    this.chronoSpr.setTexture("crono-idle-left").setPosition(CHRONO_X, CHRONO_Y);
    this.chronoSpr.clearTint();
    this.enemySpr.clearTint();

    // Swap to appropriate BGM
    const bgmKey = bossGimmick ? "bgm-boss" : "bgm-battle";
    if (this.bgm?.isPlaying) this.bgm.stop();
    this.bgm = this.sound.get(bgmKey) ?? this.sound.add(bgmKey, { loop: true, volume: 0.45 });
    if (!this.bgm.isPlaying) this.bgm.play();

    this.cameras.main.flash(200, 255, 255, 255);
  }

  // ── Phase / sprite sync ────────────────────────────────────────────────
  private onPhaseChange(phase: string, enemyId: string) {
    if (!this.scene.isActive("BattleScene")) return;
    if (phase === "idle") { this.stopBgm(); return; }
    const sprKey = enemySprite(enemyId);
    if (this.enemySpr.texture.key !== sprKey) this.enemySpr.setTexture(sprKey);
  }

  // ── VFX dispatcher ────────────────────────────────────────────────────
  private playEffect(type: "damage" | "critical" | "miss" | "combo" | "heal", amount = 0) {
    switch (type) {
      case "critical":
        this.cameras.main.shake(200, 0.014);
        this.hitStop(90);
        this.slashFX(ENEMY_X, ENEMY_Y, true);
        this.time.delayedCall(90, () => {
          this.flashSprite(this.enemySpr, 0xffffff);
          this.enemyBounce();
          this.spawnDamageNumber(ENEMY_X, ENEMY_Y - 20, amount, true);
        });
        this.attackAnim();
        break;
      case "damage":
        this.cameras.main.shake(90, 0.007);
        this.hitStop(60);
        this.slashFX(ENEMY_X, ENEMY_Y, false);
        this.time.delayedCall(60, () => {
          this.flashSprite(this.enemySpr, 0xffffff);
          this.enemyBounce();
          this.spawnDamageNumber(ENEMY_X, ENEMY_Y - 20, amount, false);
        });
        this.attackAnim();
        break;
      case "miss":
        this.enemySpr.setTint(0xaaaaaa);
        this.time.delayedCall(100, () => this.enemySpr.clearTint());
        this.tweens.add({ targets: this.enemySpr, x: ENEMY_X + 8, duration: 60, yoyo: true, repeat: 1 });
        this.spawnMissText(ENEMY_X, ENEMY_Y - 20);
        break;
      case "combo":
        this.cameras.main.flash(200, 255, 220, 100);
        this.cameras.main.shake(320, 0.020);
        this.hitStop(120);
        this.slashFX(ENEMY_X, ENEMY_Y, true);
        this.slashFX(ENEMY_X + 12, ENEMY_Y + 12, true);
        this.time.delayedCall(120, () => {
          this.flashSprite(this.enemySpr, 0xffd700);
          this.enemyBounce();
          this.spawnDamageNumber(ENEMY_X, ENEMY_Y - 26, amount, true);
        });
        this.chronoSpr.setTexture("crono-ataque-back");
        this.time.delayedCall(500, () => this.chronoSpr.setTexture("crono-idle-left"));
        break;
      case "heal":
        this.flashSprite(this.chronoSpr, 0x44ff88);
        this.spawnDamageNumber(CHRONO_X, CHRONO_Y - 20, amount, false, "#44ff88");
        break;
    }
  }

  // ── Enemy attacks Chrono ───────────────────────────────────────────────
  private enemyAttackAnim() {
    const origX = this.enemySpr.x;
    this.tweens.add({
      targets: this.enemySpr, x: origX + 50,
      duration: 120, ease: "Power2.easeIn",
      onComplete: () => {
        this.enemySpr.x = origX;
        this.impactSpark(CHRONO_X - 20, CHRONO_Y, 0xff4444);
      },
    });
  }

  private chronoTakesHit(damage: number) {
    this.flashSprite(this.chronoSpr, 0xff6666);
    this.cameras.main.shake(70, 0.006);
    this.spawnDamageNumber(CHRONO_X, CHRONO_Y - 20, damage, false, "#ff6666");
    this.tweens.add({ targets: this.chronoSpr, x: CHRONO_X + 12, duration: 80, yoyo: true });
  }

  // ── Sub-animations ────────────────────────────────────────────────────
  private attackAnim() {
    this.tweens.add({ targets: this.chronoSpr, x: CHRONO_X - 55, duration: 110, yoyo: true, ease: "Power2" });
    this.chronoSpr.setTexture("crono-ataque-1");
    this.time.delayedCall(160, () => this.chronoSpr.setTexture("crono-ataque-2"));
    this.time.delayedCall(310, () => this.chronoSpr.setTexture("crono-idle-left"));
  }

  private enemyBounce() {
    this.tweens.add({ targets: this.enemySpr, x: ENEMY_X - 14, duration: 70, yoyo: true, ease: "Power2" });
  }

  // ── VFX primitives ────────────────────────────────────────────────────
  private slashFX(cx: number, cy: number, crit: boolean) {
    const g = this.add.graphics().setDepth(28);
    const c = crit ? 0xffd700 : 0xffffff;
    [[3, c, 1], [2, 0xffffff, 0.7], [1.5, 0xffcccc, 0.5]].forEach(([lw, col, a]) => {
      g.lineStyle(lw as number, col as number, a as number);
      g.beginPath(); g.moveTo(cx - 28, cy - 36); g.lineTo(cx + 36, cy + 16); g.strokePath();
      g.beginPath(); g.moveTo(cx - 16, cy - 42); g.lineTo(cx + 28, cy + 10); g.strokePath();
    });
    this.tweens.add({ targets: g, alpha: 0, scaleX: 1.3, scaleY: 1.3, duration: 180, onComplete: () => g.destroy() });
  }

  private impactSpark(x: number, y: number, color: number) {
    const g = this.add.graphics().setDepth(27);
    g.fillStyle(color, 1);
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      g.fillCircle(x + Math.cos(angle) * 8, y + Math.sin(angle) * 8, 2);
    }
    this.tweens.add({ targets: g, alpha: 0, scale: 1.6, duration: 220, onComplete: () => g.destroy() });
  }

  private spawnDamageNumber(x: number, y: number, amount: number, crit: boolean, color = "#ffffff") {
    const text = this.add.text(x + Phaser.Math.Between(-8, 8), y, `${amount}`, {
      fontSize: crit ? "20px" : "15px",
      fontFamily: "'Chrono', monospace",
      color, stroke: "#000000", strokeThickness: 3,
    }).setDepth(30).setOrigin(0.5);
    this.tweens.add({ targets: text, y: y - 44, alpha: 0, duration: 850, onComplete: () => text.destroy() });
  }

  private spawnMissText(x: number, y: number) {
    const text = this.add.text(x, y, "MISS", {
      fontSize: "13px", fontFamily: "'Chrono', monospace",
      color: "#9188a0", stroke: "#000000", strokeThickness: 2,
    }).setDepth(30).setOrigin(0.5);
    this.tweens.add({ targets: text, y: y - 30, alpha: 0, duration: 700, onComplete: () => text.destroy() });
  }

  private hitStop(ms: number) {
    this.tweens.pauseAll();
    window.setTimeout(() => { if (this.scene.isActive("BattleScene")) this.tweens.resumeAll(); }, ms);
  }

  private flashSprite(sprite: Phaser.GameObjects.Image, color: number) {
    sprite.setTint(color);
    this.time.delayedCall(130, () => sprite.clearTint());
  }

  private stopBgm() {
    if (!this.bgm?.isPlaying) return;
    this.tweens.add({
      targets: { vol: 0.45 }, vol: 0, duration: 500,
      onUpdate: (_, t) => { (this.bgm as Phaser.Sound.WebAudioSound)?.setVolume(t.vol as number); },
      onComplete: () => this.bgm?.stop(),
    });
  }
}
