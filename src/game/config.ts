import Phaser from "phaser";
import { PALETTE } from "./palette";
import { BootScene } from "./scenes/BootScene";
import { WorldScene } from "./scenes/WorldScene";
import { BattleScene } from "./scenes/BattleScene";
import { KaraokeScene } from "./scenes/KaraokeScene";

/** Base render resolution. Everything is authored against this. See CLAUDE.md §5. */
export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 270;
export const TILE_SIZE = 32;

/** Player sprite dimensions (2-head-tall chibi). */
export const CHAR_WIDTH = 32;
export const CHAR_HEIGHT = 48;

export function createGameConfig(parent: HTMLElement): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: PALETTE.MINT_2,

    // Crisp pixels, no smoothing. Non-negotiable for the art direction.
    pixelArt: true,
    antialias: false,
    roundPixels: true,

    scale: {
      // NONE + a manual integer zoom. Phaser's FIT mode allows fractional
      // scaling, which produces uneven pixel widths and ruins the pixel art.
      mode: Phaser.Scale.NONE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },

    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: import.meta.env.DEV,
      },
    },

    input: {
      keyboard: true,
      touch: true,
    },

    scene: [BootScene, WorldScene, BattleScene, KaraokeScene],
  };
}

/** Largest whole-number zoom that still fits the viewport. Never below 1. */
export function integerZoomFor(viewportWidth: number, viewportHeight: number): number {
  const zoom = Math.min(
    Math.floor(viewportWidth / GAME_WIDTH),
    Math.floor(viewportHeight / GAME_HEIGHT),
  );
  return Math.max(1, zoom);
}

/**
 * Bind integer scaling to window resize.
 * Returns a cleanup function — call it on unmount to avoid a listener leak.
 */
export function bindIntegerScaling(game: Phaser.Game): () => void {
  const apply = () => {
    game.scale.setZoom(integerZoomFor(window.innerWidth, window.innerHeight));
    game.scale.refresh();
  };
  apply();
  window.addEventListener("resize", apply);
  window.addEventListener("orientationchange", apply);
  return () => {
    window.removeEventListener("resize", apply);
    window.removeEventListener("orientationchange", apply);
  };
}
