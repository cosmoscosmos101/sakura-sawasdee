import Phaser from "phaser";
import { PALETTE } from "../palette";
import { GAME_WIDTH, GAME_HEIGHT } from "../config";

export type Weather = "sakura" | "snow" | "rain" | "clear";

interface Particle {
  x: number;
  y: number;
  speed: number;
  size: number;
  alpha: number;
  /** Parallax depth 0 (far) .. 2 (near). */
  layer: number;
  rotation: number;
  spin: number;
  /** Per-particle phase offset so the wind doesn't move everything in lockstep. */
  phase: number;
}

const LAYER_COUNT = 3;

/**
 * Ambient particle layer — Pillar 3, "Living Pastel".
 *
 * If the player stands still for 10 seconds and the screen is static, we've failed.
 * Drawn to a single Graphics object so 50 particles cost one draw call.
 */
export class WeatherSystem {
  private gfx: Phaser.GameObjects.Graphics;
  private particles: Particle[] = [];
  private weather: Weather = "clear";
  private elapsed = 0;

  constructor(scene: Phaser.Scene) {
    this.gfx = scene.add.graphics();
    this.gfx.setScrollFactor(0); // ambient layer is screen-space
    this.gfx.setDepth(1000);
  }

  setWeather(weather: Weather): void {
    this.weather = weather;
    this.particles = [];
    if (weather === "clear") {
      this.gfx.clear();
      return;
    }
    const count = weather === "sakura" ? 50 : weather === "snow" ? 40 : 80;
    for (let i = 0; i < count; i++) {
      this.particles.push(this.spawn(true));
    }
  }

  private spawn(initial = false): Particle {
    const layer = Phaser.Math.Between(0, LAYER_COUNT - 1);
    // Nearer layers are bigger, faster and more opaque.
    const depth = (layer + 1) / LAYER_COUNT;

    let speed: number;
    let size: number;
    if (this.weather === "sakura") {
      speed = Phaser.Math.Between(15, 40) * depth;
      size = Phaser.Math.Between(2, 4) * depth;
    } else if (this.weather === "snow") {
      speed = Phaser.Math.Between(10, 25) * depth;
      size = Phaser.Math.Between(1, 3) * depth;
    } else {
      speed = Phaser.Math.Between(180, 260) * depth;
      size = 1;
    }

    return {
      x: Phaser.Math.Between(-20, GAME_WIDTH + 20),
      y: initial ? Phaser.Math.Between(-GAME_HEIGHT, GAME_HEIGHT) : -10,
      speed,
      size: Math.max(1, Math.round(size)),
      alpha: Phaser.Math.FloatBetween(0.6, 1) * depth,
      layer,
      rotation: Phaser.Math.FloatBetween(0, Math.PI * 2),
      spin: Phaser.Math.FloatBetween(-2, 2),
      phase: Phaser.Math.FloatBetween(0, Math.PI * 2),
    };
  }

  private colorFor(p: Particle): string {
    if (this.weather === "snow") {
      return p.layer === 2 ? PALETTE.SNOW_1 : PALETTE.SNOW_2;
    }
    if (this.weather === "rain") {
      return PALETTE.WATER_2;
    }
    // sakura — three shades give the drift visual depth
    if (p.layer === 0) return PALETTE.SAKURA_3;
    if (p.layer === 1) return PALETTE.SAKURA_2;
    return PALETTE.SAKURA_1;
  }

  update(_time: number, delta: number): void {
    if (this.weather === "clear" || this.particles.length === 0) return;

    const dt = delta / 1000;
    this.elapsed += dt;

    // Wind as a 4-second sine wave, amplitude 20px (see docs/02_Prompt_Pack.md P1.1).
    const windPeriod = 4;
    const windAmplitude = 20;

    this.gfx.clear();

    for (const p of this.particles) {
      p.y += p.speed * dt;
      p.rotation += p.spin * dt;

      if (this.weather !== "rain") {
        const wind =
          Math.sin((this.elapsed / windPeriod) * Math.PI * 2 + p.phase) *
          windAmplitude *
          dt *
          ((p.layer + 1) / LAYER_COUNT);
        p.x += wind;
      } else {
        p.x -= 40 * dt; // rain falls at a fixed slant
      }

      if (p.y > GAME_HEIGHT + 10) {
        Object.assign(p, this.spawn());
        continue;
      }
      if (p.x < -20) p.x = GAME_WIDTH + 20;
      if (p.x > GAME_WIDTH + 20) p.x = -20;

      const color = Number.parseInt(this.colorFor(p).slice(1), 16);
      this.gfx.fillStyle(color, p.alpha);

      if (this.weather === "rain") {
        this.gfx.fillRect(Math.round(p.x), Math.round(p.y), 1, 5);
      } else {
        // A petal reads as a squashed rect that changes aspect as it tumbles.
        const w = Math.max(1, Math.round(p.size * Math.abs(Math.cos(p.rotation))));
        this.gfx.fillRect(Math.round(p.x), Math.round(p.y), w, p.size);
      }
    }
  }

  destroy(): void {
    this.gfx.destroy();
    this.particles = [];
  }
}
