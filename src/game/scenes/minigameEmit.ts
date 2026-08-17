import Phaser from "phaser";
import { eventBus } from "../../state/eventBus";
import type { MinigameEventDef } from "../maps/mapDef";

export function emitMinigame(ev: MinigameEventDef): void {
  switch (ev.type) {
    case "fishing:open":      eventBus.emit("fishing:open");      break;
    case "bargaining:open":   eventBus.emit("bargaining:open");   break;
    case "tuktuk:open":       eventBus.emit("tuktuk:open");       break;
    case "handwriting:open":  eventBus.emit("handwriting:open");  break;
    case "tone_kitchen:open": eventBus.emit("tone_kitchen:open"); break;
    case "word_segment:open": eventBus.emit("word_segment:open", { location: ev.location }); break;
  }
}

export function showHint(scene: Phaser.Scene, text: string): void {
  const t = scene.add
    .text(240, 220, text, {
      fontSize: "10px", color: "#4A3F55",
      backgroundColor: "#FFF6E5", padding: { x: 6, y: 3 },
    })
    .setOrigin(0.5, 1).setScrollFactor(0).setDepth(200);
  scene.time.delayedCall(2500, () => t.destroy());
}
