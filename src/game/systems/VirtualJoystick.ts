import Phaser from "phaser";
import { hex } from "../palette";
import { GAME_HEIGHT } from "../config";

export type CardinalDir = "up" | "down" | "left" | "right" | "none";

interface JoyState {
  active: boolean;
  pointerId: number;
  startX: number;
  startY: number;
  knobX: number;
  knobY: number;
}

const BASE_X = 68;
const BASE_Y_OFFSET = 68; // from bottom
const BASE_RADIUS = 40;
const KNOB_RADIUS = 18;
const DEAD_ZONE = 8; // px before direction registers

/**
 * Simple 4-way virtual joystick drawn in Phaser.
 *
 * Shown only when a touch device is detected (navigator.maxTouchPoints > 0).
 * Lives in screen space (scrollFactor 0) so it doesn't move with the camera.
 * Only imports from game/ modules — no React dependency.
 */
export class VirtualJoystick {
  private scene: Phaser.Scene;
  private gfx: Phaser.GameObjects.Graphics;
  private visible = false;
  private state: JoyState = {
    active: false, pointerId: -1,
    startX: 0, startY: 0, knobX: BASE_X, knobY: 0,
  };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.gfx = scene.add.graphics();
    this.gfx.setScrollFactor(0).setDepth(900);

    this.visible = navigator.maxTouchPoints > 0;
    if (!this.visible) return;

    this.state.knobY = GAME_HEIGHT - BASE_Y_OFFSET;
    this.drawBase();
    this.bindPointerEvents();
  }

  private drawBase(): void {
    this.gfx.clear();
    const bx = BASE_X;
    const by = GAME_HEIGHT - BASE_Y_OFFSET;

    // Outer ring
    this.gfx.fillStyle(hex("INK_DARK"), 0.3);
    this.gfx.fillCircle(bx, by, BASE_RADIUS);
    this.gfx.lineStyle(2, hex("INK_MID"), 0.6);
    this.gfx.strokeCircle(bx, by, BASE_RADIUS);

    // Knob
    this.gfx.fillStyle(hex("SAKURA_3"), 0.8);
    this.gfx.fillCircle(this.state.knobX, this.state.knobY, KNOB_RADIUS);
  }

  private bindPointerEvents(): void {
    const { input } = this.scene;
    input.on(Phaser.Input.Events.POINTER_DOWN, this.onDown, this);
    input.on(Phaser.Input.Events.POINTER_MOVE, this.onMove, this);
    input.on(Phaser.Input.Events.POINTER_UP, this.onUp, this);
    input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onUp, this);
  }

  private onDown = (ptr: Phaser.Input.Pointer): void => {
    if (this.state.active) return;
    const bx = BASE_X;
    const by = GAME_HEIGHT - BASE_Y_OFFSET;
    const dist = Phaser.Math.Distance.Between(ptr.x, ptr.y, bx, by);
    if (dist > BASE_RADIUS * 1.4) return; // only respond inside the zone
    this.state = {
      active: true, pointerId: ptr.id,
      startX: bx, startY: by,
      knobX: bx, knobY: by,
    };
  };

  private onMove = (ptr: Phaser.Input.Pointer): void => {
    if (!this.state.active || ptr.id !== this.state.pointerId) return;
    const dx = ptr.x - this.state.startX;
    const dy = ptr.y - this.state.startY;
    const dist = Math.hypot(dx, dy);
    const clamp = Math.min(dist, BASE_RADIUS);
    const angle = Math.atan2(dy, dx);
    this.state.knobX = this.state.startX + Math.cos(angle) * clamp;
    this.state.knobY = this.state.startY + Math.sin(angle) * clamp;
  };

  private onUp = (ptr: Phaser.Input.Pointer): void => {
    if (ptr.id !== this.state.pointerId) return;
    this.state.active = false;
    this.state.knobX = BASE_X;
    this.state.knobY = GAME_HEIGHT - BASE_Y_OFFSET;
  };

  update(): void {
    if (!this.visible) return;
    this.drawBase();
  }

  /** Discrete 4-way direction from current joystick position. */
  getDirection(): CardinalDir {
    if (!this.state.active) return "none";
    const dx = this.state.knobX - this.state.startX;
    const dy = this.state.knobY - this.state.startY;
    if (Math.abs(dx) < DEAD_ZONE && Math.abs(dy) < DEAD_ZONE) return "none";
    return Math.abs(dx) >= Math.abs(dy)
      ? dx > 0 ? "right" : "left"
      : dy > 0 ? "down" : "up";
  }

  isVisible(): boolean { return this.visible; }

  destroy(): void {
    if (this.visible) {
      this.scene.input.off(Phaser.Input.Events.POINTER_DOWN, this.onDown, this);
      this.scene.input.off(Phaser.Input.Events.POINTER_MOVE, this.onMove, this);
      this.scene.input.off(Phaser.Input.Events.POINTER_UP, this.onUp, this);
      this.scene.input.off(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onUp, this);
    }
    this.gfx.destroy();
  }
}
