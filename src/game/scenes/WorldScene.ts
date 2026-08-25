import Phaser from "phaser";
import { eventBus } from "../../state/eventBus";
import { ALL_VOCAB } from "../../content/allVocab";
import { useBattleStore } from "../../state/battleStore";
import { usePlayerStore } from "../../state/playerStore";
import { GAME_WIDTH, GAME_HEIGHT } from "../config";
import { NpcSystem } from "../systems/NpcSystem";
import { addSakuraPetals } from "../systems/Atmosphere";
import { useSettingsStore } from "../../state/settingsStore";
import { encounterChance } from "../../learning/vocabMastery";
import { t } from "../../i18n/t";

type Dir = "front" | "back" | "left" | "right";

const PLAYER_SPEED      = 90;
const ENCOUNTER_STEPS   = 18;
const ENCOUNTER_ENEMIES = ["fog-grunt", "fog-wisp", "fog-magus"];

/**
 * Obstacle zones derived from mapaFloresta.png (769×768).
 * Scale = 0.624; visible strip = image rows 168-601 → game y 0-270.
 * Conversion: game_x = image_x × 0.624, game_y = image_y × 0.624 − 105.
 * Format: [centreX, centreY, width, height] in game-canvas pixels.
 * Set DEV=true to see red overlays.
 */
const OBSTACLE_ZONES: [number, number, number, number][] = [
  // ── World borders ─────────────────────────────────
  [240,   4, 480,   8],   // top wall
  [240, 267, 480,   8],   // bottom wall
  [  4, 135,   8, 270],   // left wall
  [476, 135,   8, 270],   // right wall

  // ── Upper-left corner trees (image ~0-120, 168-310) ──
  [ 37,  27,  75,  55],

  // ── Upper-center tree cluster (image ~270-450, 168-290) ──
  [224,  16, 112,  38],

  // ── Upper-right corner trees (image ~610-769, 168-300) ──
  [432,  28,  92,  56],

  // ── Mid-left tree wall (image ~0-150, 300-490) ───────
  [ 47, 121,  94, 118],

  // ── Center-left tree (image ~120-260, 350-510) ───────
  [118, 152,  87, 100],

  // ── Large center tree (image ~310-520, 330-510) ──────
  [262, 142, 130, 112],

  // ── Mid-right tree wall (image ~550-769, 290-490) ────
  [416, 126, 138, 124],

  // ── Lower-left trees (image ~0-180, 490-601) ─────────
  [ 56, 237, 112,  68],

  // ── Lower-center-left tree (image ~160-310, 540-601) ─
  [147, 253,  94,  38],

  // ── Lower-center-right tree (image ~330-530, 510-601) ─
  [269, 245, 124,  56],

  // ── Lower-right trees (image ~570-769, 480-601) ──────
  [419, 236, 124,  68],
];

export class WorldScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Image;
  private keys!: {
    up: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key;
    w: Phaser.Input.Keyboard.Key; s: Phaser.Input.Keyboard.Key;
    a: Phaser.Input.Keyboard.Key; d: Phaser.Input.Keyboard.Key;
    e: Phaser.Input.Keyboard.Key;
    q: Phaser.Input.Keyboard.Key;
    shift: Phaser.Input.Keyboard.Key;
  };
  private facing: Dir = "front";
  private moving = false;
  private stepCounter = 0;
  private encounterExclaim: Phaser.GameObjects.Text | null = null;
  private transitioning = false;
  private walkFrame = 0;
  private walkTimer = 0;
  private bgm?: Phaser.Sound.BaseSound;
  private obstacles!: Phaser.Physics.Arcade.StaticGroup;
  private npcSystem!: NpcSystem;

  constructor() { super({ key: "WorldScene" }); }

  create() {
    const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "map-forest");
    bg.setScale(Math.max(GAME_WIDTH / bg.width, GAME_HEIGHT / bg.height));

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000022, 0.25);

    // ── Atmosphere: drifting petals (Design Pillar 3 — always moving) ────
    addSakuraPetals(this);

    // ── Obstacle collision zones ─────────────────────────────────────────
    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.obstacles = this.physics.add.staticGroup();

    const dbg = import.meta.env.DEV;
    if (!this.textures.exists("_pixel")) {
      const g = this.add.graphics({ x: -9999, y: -9999 });
      g.fillStyle(0xffffff).fillRect(0, 0, 1, 1);
      g.generateTexture("_pixel", 1, 1);
      g.destroy();
    }

    OBSTACLE_ZONES.forEach(([cx, cy, w, h]) => {
      const sprite = this.obstacles.create(cx, cy, "_pixel") as Phaser.Physics.Arcade.Sprite;
      sprite.setDisplaySize(w, h).setAlpha(dbg ? 0.25 : 0).setDepth(dbg ? 50 : 0);
      if (dbg) sprite.setTint(0xff0000);
      sprite.refreshBody();
    });

    // ── Player ──────────────────────────────────────────────────────────
    this.player = this.physics.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "crono-idle-front");
    this.player.setDepth(10).setCollideWorldBounds(true);
    (this.player.body as Phaser.Physics.Arcade.Body).setSize(14, 20).setOffset(9, 22);
    this.physics.add.collider(this.player, this.obstacles);

    // ── NPCs ─────────────────────────────────────────────────────────────
    this.npcSystem = new NpcSystem(this);
    this.npcSystem.create();

    // ── Keyboard ────────────────────────────────────────────────────────
    const kb = this.input.keyboard!;
    this.keys = {
      up:    kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      down:  kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      left:  kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      w:     kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      s:     kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      a:     kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      d:     kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      e:     kb.addKey(Phaser.Input.Keyboard.KeyCodes.E),
      q:     kb.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
      shift: kb.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
    };

    // ── Scene events ─────────────────────────────────────────────────────
    this.events.on(Phaser.Scenes.Events.WAKE, () => {
      this.transitioning = false;
      this.player.setTexture(`crono-idle-${this.facing}`);
      (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    });

    const offBattleEnd   = eventBus.on("battle:end", ({ won }) => {
      if (won) this.scene.wake("WorldScene");
    });
    const offDialogueOpen = eventBus.on("dialogue:open", () => {
      this.transitioning = true;
      (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
      this.player.setTexture(`crono-idle-${this.facing}`);
    });
    const offDialogueClose = eventBus.on("dialogue:close", () => {
      this.transitioning = false;
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      offBattleEnd(); offDialogueOpen(); offDialogueClose();
      this.npcSystem.destroy();
    });

    eventBus.emit("map:change", { mapId: "forest" });
    this.bgm = this.sound.add("bgm-overworld", { loop: true, volume: 0.4 });
    this.bgm.play();
  }

  update(_time: number, delta: number) {
    if (this.transitioning) return;

    const up    = this.keys.up.isDown    || this.keys.w.isDown;
    const down  = this.keys.down.isDown  || this.keys.s.isDown;
    const left  = this.keys.left.isDown  || this.keys.a.isDown;
    const right = this.keys.right.isDown || this.keys.d.isDown;

    const dx = (right ? 1 : 0) - (left ? 1 : 0);
    const dy = (down  ? 1 : 0) - (up   ? 1 : 0);
    const prevMoving = this.moving;
    this.moving = dx !== 0 || dy !== 0;

    const body = this.player.body as Phaser.Physics.Arcade.Body;

    if (this.moving) {
      const len = Math.sqrt(dx * dx + dy * dy);
      body.setVelocity((dx / len) * PLAYER_SPEED, (dy / len) * PLAYER_SPEED);

      if      (dx > 0)  this.facing = "right";
      else if (dx < 0)  this.facing = "left";
      else if (dy < 0)  this.facing = "back";
      else              this.facing = "front";

      this.walkTimer += delta;
      if (this.walkTimer >= 100) {
        this.walkTimer = 0;
        const frames = this.getWalkFrameKeys();
        this.walkFrame = (this.walkFrame + 1) % frames.length;
        this.player.setTexture(frames[this.walkFrame] ?? "crono-idle-front");
      }

      const dist = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2) * (delta / 1000);
      this.stepCounter += dist;
      const chance = encounterChance(useSettingsStore.getState().encounterRate);
      if (chance > 0 && this.stepCounter >= ENCOUNTER_STEPS && Math.random() < chance) {
        this.stepCounter = 0;
        this.triggerEncounter();
      }
    } else {
      body.setVelocity(0, 0);
      if (prevMoving) {
        this.player.setTexture(`crono-idle-${this.facing}`);
        this.walkFrame = 0;
        this.walkTimer = 0;
      }
    }

    // NPC proximity + E-key interaction
    this.npcSystem.update(this.player.x, this.player.y);
    if (Phaser.Input.Keyboard.JustDown(this.keys.e)) {
      this.npcSystem.tryInteract();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.q)) {
      const delta: 1 | -1 = this.keys.shift.isDown ? -1 : 1;
      const rate = useSettingsStore.getState().bumpEncounter(delta);
      eventBus.emit("hud:toast", { text: t(`learn.encounter.${rate}`) });
    }
  }

  private getWalkFrameKeys(): string[] {
    if (this.facing === "front") return Array.from({ length: 6 }, (_, i) => `crono-walk-front-${i + 1}`);
    if (this.facing === "back")  return Array.from({ length: 6 }, (_, i) => `crono-walk-down-${i + 1}`);
    if (this.facing === "left")  return Array.from({ length: 6 }, (_, i) => `crono-walk-left-${i + 1}`);
    return Array.from({ length: 6 }, (_, i) => `crono-walk-right-${i + 1}`);
  }

  private triggerEncounter() {
    if (this.transitioning) return;
    this.transitioning = true;
    (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);

    this.encounterExclaim = this.add
      .text(this.player.x, this.player.y - 30, "!", {
        fontSize: "28px", color: "#ffd700", fontStyle: "bold",
        stroke: "#1a1a2e", strokeThickness: 5,
      }).setDepth(20);

    if (this.sound.get("sfx-sword")) this.sound.play("sfx-sword", { volume: 0.6 });

    this.tweens.add({
      targets: this.encounterExclaim,
      y: this.player.y - 52, alpha: 0, duration: 600, ease: "Power2",
      onComplete: () => { this.encounterExclaim?.destroy(); this.startBattle(); },
    });
  }

  private startBattle() {
    const bgm = this.bgm;
    if (bgm?.isPlaying) {
      this.tweens.add({
        targets: { vol: 0.4 }, vol: 0, duration: 400,
        onUpdate: (_, t) => { if (bgm.isPlaying) (bgm as Phaser.Sound.WebAudioSound).setVolume(t.vol as number); },
        onComplete: () => bgm.stop(),
      });
    }

    const enemyId = ENCOUNTER_ENEMIES[Math.floor(Math.random() * ENCOUNTER_ENEMIES.length)] ?? "fog-grunt";
    const { l1 } = usePlayerStore.getState().locale;
    useBattleStore.getState().startBattle(enemyId, ALL_VOCAB, l1, null);
    eventBus.emit("battle:start", { enemyId, locationId: "forest" });

    this.cameras.main.flash(300, 255, 255, 255, false);
    this.time.delayedCall(300, () => {
      this.scene.sleep("WorldScene");
      if (this.scene.isActive("BattleScene") || this.scene.isPaused("BattleScene")) {
        this.scene.wake("BattleScene");
      } else {
        this.scene.launch("BattleScene");
      }
    });
  }
}
