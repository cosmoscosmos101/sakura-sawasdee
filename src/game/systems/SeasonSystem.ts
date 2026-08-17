import Phaser from "phaser";
import { seasonFromDate, SEASON_TINT, SEASON_PARTICLES, type Season } from "./seasonUtils";

export type { Season };
export { seasonFromDate, SEASON_PARTICLES };

/**
 * SeasonSystem — applies a subtle world tint based on the real calendar date.
 * Reads the real device date on construction; pass overrideDate for testing.
 */
export class SeasonSystem {
  readonly season: Season;
  private tintOverlay: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, overrideDate?: Date) {
    this.season = seasonFromDate(overrideDate ?? new Date());
    this.tintOverlay = this.buildOverlay(scene);
  }

  private buildOverlay(scene: Phaser.Scene): Phaser.GameObjects.Graphics {
    const { width, height } = scene.scale;
    const colour = SEASON_TINT[this.season];
    return scene.add.graphics()
      .fillStyle(colour, 0.08)
      .fillRect(0, 0, width, height)
      .setScrollFactor(0)
      .setDepth(1)
      .setBlendMode(Phaser.BlendModes.OVERLAY);
  }

  getParticleColours(): number[] {
    return SEASON_PARTICLES[this.season];
  }

  destroy(): void {
    this.tintOverlay.destroy();
  }
}
