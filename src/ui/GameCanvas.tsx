import { useEffect, useRef } from "react";
import type Phaser from "phaser";

/**
 * Mounts the Phaser game into a div and tears it down on unmount.
 *
 * Phaser is imported dynamically so the React shell can paint before the
 * engine chunk arrives (see manualChunks in vite.config.ts).
 *
 * `import type` above is erased at build time, so this file does not pull
 * Phaser into the UI bundle — it only borrows the types.
 */
export function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let unbindScaling: (() => void) | undefined;

    void (async () => {
      const [phaserModule, config] = await Promise.all([
        import("phaser"),
        import("../game/config"),
      ]);
      if (cancelled) return;

      const game = new phaserModule.default.Game(config.createGameConfig(container));
      gameRef.current = game;
      unbindScaling = config.bindIntegerScaling(game);
    })();

    return () => {
      cancelled = true;
      unbindScaling?.();
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0 z-0" />;
}
