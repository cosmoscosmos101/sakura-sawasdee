import Phaser from "phaser";

const GAME_WIDTH = 480;
const GAME_HEIGHT = 270;

const CHARS = ["は", "な", "み", "が", "く", "え", "ん"] as const;
const COLORS = [
  "#FFD9E8", "#F7A8C4", "#C9B8F0", "#F7A8C4",
  "#7FC4E0", "#C8F2E0", "#FFE08A",
] as const;

/** One-shot animation for the はなみがくえん school sign (GDD §P1.4). */
export function playSignReveal(scene: Phaser.Scene): void {
  const overlay = scene.add.graphics()
    .fillStyle(0x4A3F55, 0.75)
    .fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
    .setScrollFactor(0)
    .setDepth(500)
    .setAlpha(0);

  scene.tweens.add({ targets: overlay, alpha: 1, duration: 600 });

  const signY = Math.round(GAME_HEIGHT * 0.42);
  const board = scene.add.graphics()
    .fillStyle(0xFFF6E5, 1)
    .fillRoundedRect(Math.round(GAME_WIDTH * 0.1), signY - 20, Math.round(GAME_WIDTH * 0.8), 44, 8)
    .setScrollFactor(0)
    .setDepth(501)
    .setAlpha(0);
  scene.tweens.add({ targets: board, alpha: 1, duration: 400, delay: 600 });

  CHARS.forEach((char, i) => {
    const x = Math.round(GAME_WIDTH / 2 - CHARS.length * 16 + i * 32 + 8);
    const charText = scene.add.text(x, signY - 4, char, {
      fontSize: "22px",
      color: "#4A3F55",
      fontFamily: "NotoSansJP, sans-serif",
    })
      .setScrollFactor(0)
      .setDepth(502)
      .setAlpha(0);

    scene.time.delayedCall(1000 + i * 300, () => {
      charText.setAlpha(1);
      charText.setColor(COLORS[i] ?? "#FFD9E8");
      scene.tweens.add({ targets: charText, scaleX: 1.3, scaleY: 1.3, duration: 150, yoyo: true });
    });
  });

  const translation = scene.add.text(
    Math.round(GAME_WIDTH / 2),
    signY + 30,
    "โรงเรียนฮานามิ  •  Hanami Academy",
    { fontSize: "9px", color: "#9188A0", fontFamily: "IBMPlexSansThai, sans-serif" },
  )
    .setOrigin(0.5, 0)
    .setScrollFactor(0)
    .setDepth(502)
    .setAlpha(0);

  scene.time.delayedCall(1000 + CHARS.length * 300 + 200, () => {
    scene.tweens.add({ targets: translation, alpha: 1, duration: 500 });
  });

  scene.time.delayedCall(4500, () => {
    scene.tweens.add({ targets: [overlay, board, translation], alpha: 0, duration: 600 });
  });
}
