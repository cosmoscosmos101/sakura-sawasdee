import Phaser from "phaser";
import { eventBus } from "../../state/eventBus";

const WALK_FRONT  = Array.from({ length: 6 }, (_, i) => `crono-walk-front-${i + 1}`);
const WALK_LEFT   = Array.from({ length: 6 }, (_, i) => `crono-walk-left-${i + 1}`);
const WALK_RIGHT  = Array.from({ length: 6 }, (_, i) => `crono-walk-right-${i + 1}`);
const WALK_DOWN   = Array.from({ length: 9 }, (_, i) => `crono-walk-down-${i + 1}`);
const ATAQUE      = ["crono-ataque-1", "crono-ataque-2"];

export class BootScene extends Phaser.Scene {
  constructor() { super({ key: "BootScene" }); }

  preload() {
    const BASE = "/ct-assets/sprites";
    const SFX   = "/ct-assets/sounds";

    // Chrono walk frames
    WALK_FRONT.forEach((k, i) =>
      this.load.image(k, `${BASE}/cronoWalkFront${i + 1}.png`));
    WALK_LEFT.forEach((k, i) =>
      this.load.image(k, `${BASE}/cronoWalkLeft${i + 1}.png`));
    WALK_RIGHT.forEach((k, i) =>
      this.load.image(k, `${BASE}/cronoWalkRight${i + 1}.png`));
    WALK_DOWN.forEach((k, i) =>
      this.load.image(k, `${BASE}/cronoWalkDown${i + 1}.png`));

    // Idle frames
    this.load.image("crono-idle-front", `${BASE}/cronoNormal1.png`);
    this.load.image("crono-idle-down",  `${BASE}/cronoNormalDown1.png`);
    this.load.image("crono-idle-left",  `${BASE}/cronoNormalLeft1.png`);
    this.load.image("crono-idle-right", `${BASE}/cronoNormalRight1.png`);

    // Attack / hit
    ATAQUE.forEach((k, i) =>
      this.load.image(k, `${BASE}/cronoAtaqueNormal${i + 1}.png`));
    this.load.image("crono-hit",        `${BASE}/cronoHit.png`);
    this.load.image("crono-ataque-back", `${BASE}/cronoAtaqueBack.png`);

    // Battle backgrounds
    Array.from({ length: 7 }, (_, i) => i + 1).forEach((n) =>
      this.load.image(`battle-bg-${n}`, `${BASE}/battle${n}.png`));
    this.load.image("battle-bg-left",   `${BASE}/battleLeft1.png`);

    // Map + misc
    this.load.image("map-forest",  `${BASE}/mapaFloresta.png`);
    this.load.image("magus",       `${BASE}/magus.png`);
    this.load.image("cursor",      `${BASE}/cursor.png`);
    this.load.image("status-bar",  `${BASE}/CronoStatus.png`);
    this.load.image("sword",       `${BASE}/sword.png`);

    // Monsters
    Array.from({ length: 3 }, (_, i) => i + 1).forEach((n) => {
      this.load.image(`monster-${n}`,      `${BASE}/Monster${n}.png`);
      this.load.image(`monster-atk-${n}`,  `${BASE}/MonsterAtk.png`);
      this.load.image(`monster-dmg-${n}`,  `${BASE}/MonsterDamage.png`);
    });
    this.load.image("monster-battle",  `${BASE}/MonsterBattle.png`);
    this.load.image("monster-walk-atk", `${BASE}/MonsterWalkAtk.png`);

    // Font loaded via CSS (@font-face in index.html)
    // Audio
    this.load.audio("bgm-battle",  `${SFX}/battle1.mp3`);
    this.load.audio("bgm-boss",    `${SFX}/boss2.mp3`);
    this.load.audio("bgm-overworld", `${SFX}/castlevania.mp3`);
    this.load.audio("sfx-sword",   `${SFX}/drawSword.wav`);

    this.load.on("progress", (v: number) =>
      eventBus.emit("boot:progress", { value: v as number }));
  }

  create() {
    // Chrono animations
    this.anims.create({
      key: "walk-front",
      frames: WALK_FRONT.map((k) => ({ key: k })),
      frameRate: 8, repeat: -1,
    });
    this.anims.create({
      key: "walk-back",
      frames: WALK_DOWN.slice(0, 6).map((k) => ({ key: k })),
      frameRate: 8, repeat: -1,
    });
    this.anims.create({
      key: "walk-left",
      frames: WALK_LEFT.map((k) => ({ key: k })),
      frameRate: 8, repeat: -1,
    });
    this.anims.create({
      key: "walk-right",
      frames: WALK_RIGHT.map((k) => ({ key: k })),
      frameRate: 8, repeat: -1,
    });
    this.anims.create({
      key: "attack",
      frames: ATAQUE.map((k) => ({ key: k })),
      frameRate: 6, repeat: 0,
    });

    eventBus.emit("boot:complete");
    this.scene.start("WorldScene");
  }
}
