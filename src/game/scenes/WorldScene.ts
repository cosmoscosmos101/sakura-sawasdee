import Phaser from "phaser";
import { TILE_SIZE } from "../config";
import { WeatherSystem } from "../systems/WeatherSystem";
import { MovementSystem } from "../systems/MovementSystem";
import { VirtualJoystick } from "../systems/VirtualJoystick";
import { SeasonSystem } from "../systems/SeasonSystem";
import { TimeSystem } from "../systems/TimeSystem";
import { Player } from "../entities/Player";
import { NPC } from "../entities/NPC";
import { eventBus } from "../../state/eventBus";
import { usePlayerStore } from "../../state/playerStore";
import { playSignReveal } from "./signReveal";
import { emitMinigame, showHint } from "./minigameEmit";
import { isPortalAllowed, portalBlockedMessage } from "../maps/timeGate";
import type { DialogueNode } from "../../content/schema";
import { JA_DIALOGUE, TH_DIALOGUE } from "../../content/dialogueLoader";
import { JA_VOCAB, TH_VOCAB } from "../../content/allVocab";
import { EncounterSystem } from "../systems/EncounterSystem";
import { BossSystem } from "../systems/BossSystem";
import { getMapDef } from "../maps/mapRegistry";
import type { MapDef } from "../maps/mapDef";

interface SceneData {
  mapKey?: string;
  startCol?: number;
  startRow?: number;
}

/** Primary overworld scene. No React imports — talks to React via eventBus and Zustand. */
export class WorldScene extends Phaser.Scene {
  private player!: Player;
  private movement!: MovementSystem;
  private weather!: WeatherSystem;
  private season!: SeasonSystem;
  private timeOfDay!: TimeSystem;
  private encounters!: EncounterSystem;
  private bosses!: BossSystem;
  private joystick!: VirtualJoystick;
  private npcs: NPC[] = [];
  private dialogueNodes: DialogueNode[] = [];
  private dialogueActive = false;
  private signRevealed = false;
  private transitioning = false;
  private currentMapKey = "hanami_academy";
  private mapDef!: MapDef;
  private startCol: number | undefined = undefined;
  private startRow: number | undefined = undefined;
  private offDialogueOpen?: () => void;
  private offDialogueClose?: () => void;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<
    "W" | "A" | "S" | "D" | "SHIFT" | "SPACE" | "Z",
    Phaser.Input.Keyboard.Key
  >;
  private fpsText?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: "WorldScene" });
  }

  init(data?: SceneData): void {
    this.currentMapKey = data?.mapKey ?? "test_map";
    this.startCol = data?.startCol;
    this.startRow = data?.startRow;
    this.transitioning = false;
    this.signRevealed = false;
  }

  preload(): void {
    const def = getMapDef(this.currentMapKey);
    this.cache.tilemap.add(def.key, { format: Phaser.Tilemaps.Formats.TILED_JSON, data: def.tiledJson });
  }

  create(): void {
    this.mapDef = getMapDef(this.currentMapKey);
    this.npcs = [];

    this.dialogueNodes = this.mapDef.worldId === "th" ? TH_DIALOGUE : JA_DIALOGUE;

    Player.createAnimations(this);
    const map = this.buildTilemap();
    const col = this.startCol ?? this.mapDef.playerStart.col;
    const row = this.startRow ?? this.mapDef.playerStart.row;
    this.player = new Player(this, col, row);

    this.setupCamera(map);
    this.setupInput();
    this.spawnNPCs();

    this.season = new SeasonSystem(this);
    this.timeOfDay = new TimeSystem(this);
    this.weather = new WeatherSystem(this);
    this.weather.setWeather(this.mapDef.weatherType);
    this.joystick = new VirtualJoystick(this);
    this.spawnKotodama();
    this.encounters = new EncounterSystem(this);
    const vocabPool = this.mapDef.worldId === "th" ? TH_VOCAB : JA_VOCAB;
    this.encounters.spawn(vocabPool, this.mapDef.cols, this.mapDef.rows);
    this.bosses = new BossSystem(this.currentMapKey);

    this.offDialogueOpen = eventBus.on("dialogue:open", () => { this.dialogueActive = true; });
    this.offDialogueClose = eventBus.on("dialogue:close", () => { this.dialogueActive = false; });

    if (import.meta.env.DEV) {
      this.fpsText = this.add
        .text(4, 4, "", { fontSize: "8px", color: "#4A3F55" })
        .setScrollFactor(0)
        .setDepth(2000);
    }

    this.cameras.main.fadeIn(300);
    eventBus.emit("map:change", { mapId: this.currentMapKey });
  }

  // ── Tilemap ───────────────────────────────────────────────────────────────

  private buildTilemap(): Phaser.Tilemaps.Tilemap {
    const map = this.make.tilemap({ key: this.currentMapKey });
    const tileset = map.addTilesetImage(this.mapDef.tilesetName, "px_tileset");
    if (!tileset) throw new Error(`Tileset "${this.mapDef.tilesetName}" not found`);

    const ground = map.createLayer("ground", tileset, 0, 0);
    if (!ground) throw new Error("ground layer missing");
    ground.setDepth(0);

    const deco = map.createLayer("decoration", tileset, 0, 0);
    if (!deco) throw new Error("decoration layer missing");
    deco.setDepth(5);

    const collisionRaw = map.createLayer("collision", tileset, 0, 0);
    if (!collisionRaw) throw new Error("collision layer missing");
    const collision = collisionRaw as Phaser.Tilemaps.TilemapLayer;
    collision.setVisible(false).setDepth(0);
    collision.setCollisionByExclusion([-1]);

    const above = map.createLayer("above_player", tileset, 0, 0);
    if (!above) throw new Error("above_player layer missing");
    above.setDepth(20);

    this.movement = new MovementSystem(collision, this.mapDef.cols, this.mapDef.rows);
    return map;
  }

  private setupCamera(map: Phaser.Tilemaps.Tilemap): void {
    this.cameras.main
      .setBounds(0, 0, map.widthInPixels, map.heightInPixels)
      .startFollow(this.player, true, 0.1, 0.1)
      .setRoundPixels(true);
  }

  private setupInput(): void {
    const kb = this.input.keyboard;
    if (!kb) return;
    this.cursors = kb.createCursorKeys();
    this.keys = {
      W: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      SHIFT: kb.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
      SPACE: kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      Z: kb.addKey(Phaser.Input.Keyboard.KeyCodes.Z),
    };
  }

  private spawnNPCs(): void {
    this.npcs = this.mapDef.npcs.map((d) => new NPC(this, d.npcId, d.col, d.row, d.startId, d.hasQuest, d.minigameEvent));
  }

  private spawnKotodama(): void {
    for (const [col, row] of this.mapDef.kotodamaSpots) {
      const k = this.add.sprite(col * TILE_SIZE + TILE_SIZE / 2, (row + 1) * TILE_SIZE, "px_kotodama");
      k.setDepth(8).setOrigin(0.5, 1);
      this.tweens.add({ targets: k, y: k.y - 4, duration: 900, yoyo: true, repeat: -1 });
    }
  }

  private checkKotodamaEncounter(): void {
    if (this.dialogueActive) return;
    const pCol = this.player.getCol();
    const pRow = this.player.getRow();
    const boss = this.bosses?.checkEncounter(pCol, pRow);
    if (boss) { eventBus.emit("battle:start", { enemyId: boss.id, locationId: this.currentMapKey, bossGimmick: boss.gimmick, bossMaxHp: boss.maxHp }); this.scene.launch("BattleScene", { enemyId: boss.id, locationId: this.currentMapKey }); this.scene.sleep(); return; }
    for (const [col, row] of this.mapDef.kotodamaSpots) {
      if (pCol === col && pRow === row) {
        eventBus.emit("battle:start", { enemyId: "fog_word_01", locationId: this.currentMapKey });
        this.scene.launch("BattleScene", { enemyId: "fog_word_01", locationId: this.currentMapKey });
        this.scene.sleep();
        return;
      }
    }
  }

  // ── Update loop ──────────────────────────────────────────────────────────

  update(time: number, delta: number): void {
    this.weather.update(time, delta);
    this.encounters.update(delta);
    this.joystick.update();
    this.handleInput();
    if (this.fpsText) this.fpsText.setText(`${Math.round(this.game.loop.actualFps)} fps`);
  }

  private handleInput(): void {
    if (!this.cursors) return;

    const spaceJust = Phaser.Input.Keyboard.JustDown(this.keys.SPACE);
    const zJust = Phaser.Input.Keyboard.JustDown(this.keys.Z);

    if ((spaceJust || zJust) && !this.dialogueActive) {
      this.tryInteract();
    }
    if (this.dialogueActive) return;

    const running = this.keys.SHIFT.isDown;

    if (this.joystick.isVisible()) {
      const dir = this.joystick.getDirection();
      if (dir !== "none") {
        this.player.tryMoveDir(dir, running, this.movement);
        this.syncPosition();
        return;
      }
    }

    let dx = 0;
    let dy = 0;
    if (this.cursors.left.isDown  || this.keys.A.isDown) dx = -1;
    if (this.cursors.right.isDown || this.keys.D.isDown) dx =  1;
    if (this.cursors.up.isDown    || this.keys.W.isDown) dy = -1;
    if (this.cursors.down.isDown  || this.keys.S.isDown) dy =  1;
    if (dx !== 0 && dy !== 0) dy = 0;

    const tCol = this.player.getCol() + dx;
    const tRow = this.player.getRow() + dy;
    const npcBlocked = this.npcs.some((n) => n.isCollidingWith(tCol, tRow));
    if (!npcBlocked) {
      this.player.tryMove(dx, dy, running, this.movement);
      if (dx !== 0 || dy !== 0) {
        this.syncPosition();
        this.checkKotodamaEncounter();
        this.checkTriggerZones();
      }
    }
  }

  private syncPosition(): void {
    usePlayerStore.getState().setWorldPosition(this.player.getCol(), this.player.getRow(), this.currentMapKey);
  }

  private checkTriggerZones(): void {
    const col = this.player.getCol();
    const row = this.player.getRow();
    if (this.currentMapKey === "hanami_academy" && !this.signRevealed && col === 15 && row === 2) {
      this.signRevealed = true;
      playSignReveal(this);
    }
    for (const z of this.mapDef.triggerZones ?? []) {
      if (col === z.col && row === z.row) { emitMinigame(z.event); return; }
    }
    if (!this.transitioning) this.checkPortals(col, row);
  }

  private checkPortals(col: number, row: number): void {
    for (const p of this.mapDef.portals) {
      if (col !== p.col || row !== p.row) continue;
      if (!isPortalAllowed(p.targetMapKey)) { showHint(this, portalBlockedMessage(p.targetMapKey)); return; }
      this.transitioning = true;
      this.cameras.main.fadeOut(300);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.restart({ mapKey: p.targetMapKey, startCol: p.targetCol, startRow: p.targetRow });
      });
      return;
    }
  }

  private tryInteract(): void {
    const col = this.player.getCol(), row = this.player.getRow();
    const npc = this.npcs.find((n) => n.isAdjacentTo(col, row));
    if (!npc) return;
    const ev = npc.getMinigameEvent();
    if (ev) { emitMinigame(ev); return; }
    eventBus.emit("dialogue:open", { npcId: npc.getNpcId(), nodes: this.dialogueNodes, startId: npc.getStartDialogueId() });
  }

  shutdown(): void {
    this.offDialogueOpen?.();
    this.offDialogueClose?.();
    this.season?.destroy();
    this.timeOfDay?.destroy();
    this.encounters?.destroy();
    this.bosses?.destroy();
    this.weather?.destroy();
    this.joystick?.destroy();
  }
}
