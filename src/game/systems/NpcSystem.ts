import Phaser from "phaser";
import { eventBus } from "../../state/eventBus";
import { NPC_DIALOGUE } from "../../content/npcDialogue";
import { usePlayerStore } from "../../state/playerStore";

const INTERACT_RANGE = 44;

interface NpcDef {
  id: string;
  x: number;
  y: number;
  name: string;
  headColor: number;
  bodyColor: number;
}

/** Positions verified against WorldScene obstacle zones — all in clear walkable tiles. */
const NPC_DEFS: NpcDef[] = [
  { id: "elder",    x: 200, y: 100, name: "ELDER",    headColor: 0xe8dcc8, bodyColor: 0x6b5f78 },
  { id: "traveler", x: 180, y: 185, name: "TRAVELER", headColor: 0xf5e3c8, bodyColor: 0x4e7d5e },
  { id: "child",    x: 248, y: 142, name: "CHILD",    headColor: 0xffd9e8, bodyColor: 0xd97fa5 },
];

export class NpcSystem {
  private scene: Phaser.Scene;
  private npcData: Array<{ def: NpcDef; container: Phaser.GameObjects.Container }> = [];
  private hintText!: Phaser.GameObjects.Text;
  private nearestNpc: NpcDef | null = null;
  private paused = false;
  private offClose!: () => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  create() {
    for (const def of NPC_DEFS) {
      const g = this.scene.add.graphics();
      // Head (6×6 px)
      g.fillStyle(def.headColor);
      g.fillRect(-3, -16, 6, 6);
      // Body (8×10 px)
      g.fillStyle(def.bodyColor);
      g.fillRect(-4, -10, 8, 10);
      // Legs (3×5 px each)
      g.fillStyle(def.bodyColor);
      g.fillRect(-4, 0, 3, 5);
      g.fillRect(1, 0, 3, 5);

      const nameTag = this.scene.add.text(0, 6, def.name, {
        fontSize: "6px",
        fontFamily: "'Chrono', monospace",
        color: "#9188a0",
        stroke: "#0d0d1a",
        strokeThickness: 2,
      }).setOrigin(0.5, 0);

      const container = this.scene.add.container(def.x, def.y, [g, nameTag]).setDepth(9);

      // Gentle idle bob — Design Pillar 3: always moving
      this.scene.tweens.add({
        targets: container,
        y: def.y - 2,
        duration: 700 + Math.random() * 300,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });

      this.npcData.push({ def, container });
    }

    this.hintText = this.scene.add.text(0, 0, "[E] TALK", {
      fontSize: "8px",
      fontFamily: "'Chrono', monospace",
      color: "#ffd700",
      stroke: "#0d0d1a",
      strokeThickness: 3,
    }).setDepth(22).setVisible(false).setOrigin(0.5);

    this.offClose = eventBus.on("dialogue:close", () => { this.paused = false; });
  }

  update(playerX: number, playerY: number) {
    if (this.paused) return;

    let nearest: NpcDef | null = null;
    let nearestDist = Infinity;
    for (const { def } of this.npcData) {
      const dist = Math.hypot(def.x - playerX, def.y - playerY);
      if (dist < nearestDist) { nearestDist = dist; nearest = def; }
    }

    if (nearest && nearestDist <= INTERACT_RANGE) {
      this.nearestNpc = nearest;
      this.hintText.setPosition(nearest.x, nearest.y - 28).setVisible(true);
    } else {
      this.nearestNpc = null;
      this.hintText.setVisible(false);
    }
  }

  tryInteract(): boolean {
    if (!this.nearestNpc || this.paused) return false;
    const npc = this.nearestNpc;
    const { locale } = usePlayerStore.getState();
    const nodes = NPC_DIALOGUE[npc.id]?.[locale.l2];
    if (!nodes || nodes.length === 0) return false;

    this.paused = true;
    this.hintText.setVisible(false);
    eventBus.emit("dialogue:open", { npcId: npc.id, nodes, startId: nodes[0]!.id });
    return true;
  }

  destroy() {
    this.offClose();
    for (const { container } of this.npcData) container.destroy();
    this.hintText.destroy();
  }
}
