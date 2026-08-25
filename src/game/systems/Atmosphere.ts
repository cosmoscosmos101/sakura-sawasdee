import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../config";
import { hex } from "../palette";

/** Floating petals — Design Pillar 3: the world is never still. */
export function addSakuraPetals(scene: Phaser.Scene): void {
  for (let i = 0; i < 10; i++) {
    const x = Math.random() * GAME_WIDTH;
    const y = Math.random() * GAME_HEIGHT;
    const petal = scene.add.rectangle(x, y, 2, 2, hex("SAKURA_2"), 0.7).setDepth(3);
    const dur = 3200 + Math.random() * 2000;
    scene.tweens.add({
      targets: petal,
      x: x + (Math.random() - 0.5) * 50,
      y: y - 90 - Math.random() * 40,
      alpha: 0,
      duration: dur,
      delay: Math.random() * 3000,
      repeat: -1,
      ease: "Sine.easeIn",
      onRepeat: () => {
        petal.x = Math.random() * GAME_WIDTH;
        petal.y = GAME_HEIGHT + 4;
        petal.alpha = 0.7;
      },
    });
  }
}
