import Phaser from "phaser";
import { timeOfDayFromHour, TOD_COLOUR, TOD_ALPHA, type TimeOfDay } from "./timeUtils";

export type { TimeOfDay };
export { timeOfDayFromHour };

/**
 * TimeSystem — adds a real-clock-driven colour overlay.
 * Re-evaluates every full minute; only redraws on actual ToD changes.
 */
export class TimeSystem {
  private overlay: Phaser.GameObjects.Graphics;
  private currentToD: TimeOfDay;
  private scene: Phaser.Scene;
  private checkTimer: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, overrideHour?: number) {
    this.scene = scene;
    const hour = overrideHour ?? new Date().getHours();
    this.currentToD = timeOfDayFromHour(hour);
    this.overlay = this.buildOverlay();
    this.checkTimer = scene.time.addEvent({
      delay: 60_000,
      callback: this.checkTime,
      callbackScope: this,
      loop: true,
    });
  }

  get timeOfDay(): TimeOfDay {
    return this.currentToD;
  }

  get npcsActive(): boolean {
    return this.currentToD === "day" || this.currentToD === "dawn";
  }

  private buildOverlay(): Phaser.GameObjects.Graphics {
    const { width, height } = this.scene.scale;
    const colour = TOD_COLOUR[this.currentToD];
    const alpha = TOD_ALPHA[this.currentToD];
    return this.scene.add.graphics()
      .fillStyle(colour, alpha)
      .fillRect(0, 0, width, height)
      .setScrollFactor(0)
      .setDepth(90);
  }

  private checkTime(): void {
    const hour = new Date().getHours();
    const newToD = timeOfDayFromHour(hour);
    if (newToD === this.currentToD) return;
    this.currentToD = newToD;
    this.applyToD();
  }

  private applyToD(): void {
    const { width, height } = this.scene.scale;
    const colour = TOD_COLOUR[this.currentToD];
    const alpha = TOD_ALPHA[this.currentToD];
    this.overlay
      .clear()
      .fillStyle(colour, alpha)
      .fillRect(0, 0, width, height);
  }

  destroy(): void {
    this.checkTimer.destroy();
    this.overlay.destroy();
  }
}
