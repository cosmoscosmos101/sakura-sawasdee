import Phaser from "phaser";
import { eventBus } from "../../state/eventBus";

export interface KaraokeLine {
  syllables: KaraokeSyllable[];
  startMs: number;
  durationMs: number;
}

export interface KaraokeSyllable {
  text: string;
  tone: 0 | 1 | 2 | 3 | 4;
  offsetMs: number;
  durationMs: number;
}

interface SceneData {
  lines: KaraokeLine[];
  title?: string;
}

const TONE_COLOURS: Record<number, number> = {
  0: 0x7fc4e0,
  1: 0x9188a0,
  2: 0xf7a8c4,
  3: 0xffe08a,
  4: 0xc9b8f0,
};

// Vertical offset from the contour baseline for each tone (pixels, negative = up)
const CONTOUR_Y: Record<number, number> = {
  0:   0,
  1:  20,
  2:  15,
  3: -24,
  4: -12,
};

/**
 * KaraokeScene — scrolling Thai lyrics with pitch contour guides.
 * Mic detection lives in KaraokeOverlay (React / Web Audio API).
 * This scene owns the visual timing bar and syllable highlight trail.
 */
export class KaraokeScene extends Phaser.Scene {
  private lines: KaraokeLine[] = [];
  private title = "";
  private elapsed = 0;
  private playing = false;
  private currentLineIdx = 0;

  private timingFill!: Phaser.GameObjects.Rectangle;
  private syllableTexts: Phaser.GameObjects.Text[] = [];
  private contourGfx!: Phaser.GameObjects.Graphics;
  private petals: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private readonly onExit = () => { this.exitScene(); };

  private readonly SCENE_W = 480;
  private readonly SCENE_H = 270;
  private readonly LINE_Y = 160;
  private readonly CONTOUR_BASELINE = 130;

  constructor() {
    super({ key: "KaraokeScene" });
  }

  init(data: SceneData): void {
    this.lines = data.lines ?? [];
    this.title = data.title ?? "";
    this.elapsed = 0;
    this.playing = false;
    this.currentLineIdx = 0;
    this.syllableTexts = [];
  }

  create(): void {
    this.drawGradientBg();

    this.add.text(this.SCENE_W / 2, 20, this.title, {
      fontFamily: "'IBMPlexSansThai', sans-serif",
      fontSize: "12px",
      color: "#4A3F55",
    }).setOrigin(0.5, 0).setAlpha(0.7);

    this.contourGfx = this.add.graphics();

    // Timing bar at the bottom
    this.add.rectangle(this.SCENE_W / 2, this.SCENE_H - 18, this.SCENE_W - 40, 8, 0xe0d7ff)
      .setOrigin(0.5, 0.5);
    this.timingFill = this.add.rectangle(20, this.SCENE_H - 18, 0, 8, 0xf7a8c4)
      .setOrigin(0, 0.5);

    this.addFloatingPetals();

    const totalMs = this.totalDuration();
    if (totalMs > 0) {
      this.time.delayedCall(300, () => {
        this.playing = true;
        eventBus.emit("karaoke:start", { totalMs });
      });
    }

    this.input.keyboard?.on("keydown-ESC", this.onExit);
    eventBus.on("karaoke:exit", this.onExit);
  }

  private drawGradientBg(): void {
    const gfx = this.add.graphics();
    for (let y = 0; y < this.SCENE_H; y++) {
      const t = y / this.SCENE_H;
      const r = Math.round(0xff * (1 - t) + 0xff * t);
      const g = Math.round(0xf0 * (1 - t) + 0xf6 * t);
      const b = Math.round(0xf5 * (1 - t) + 0xe5 * t);
      gfx.fillStyle((r << 16) | (g << 8) | b, 1);
      gfx.fillRect(0, y, this.SCENE_W, 1);
    }
  }

  private addFloatingPetals(): void {
    const pxTexture = this.textures.exists("karaoke_petal")
      ? "karaoke_petal"
      : this.createPetalTexture();
    this.petals = this.add.particles(0, 0, pxTexture, {
      x: { min: 0, max: this.SCENE_W },
      y: -10,
      speedY: { min: 20, max: 50 },
      speedX: { min: -15, max: 15 },
      lifespan: 7000,
      quantity: 1,
      frequency: 300,
      alpha: { start: 0.7, end: 0 },
      scale: { min: 0.6, max: 1.2 },
      // Sakura pink tints as hex integers (PALETTE strings can't be used here)
      tint: [0xffd9e8, 0xf7a8c4, 0xfff0f5],
      rotate: { min: 0, max: 360 },
    });
  }

  private createPetalTexture(): string {
    const key = "karaoke_petal";
    const gfx = this.make.graphics();
    gfx.fillStyle(0xf7a8c4, 1);
    gfx.fillEllipse(6, 6, 12, 8);
    gfx.generateTexture(key, 12, 12);
    gfx.destroy();
    return key;
  }

  update(_time: number, delta: number): void {
    if (!this.playing) return;
    this.elapsed += delta;
    const totalMs = this.totalDuration();
    const progress = Math.min(this.elapsed / totalMs, 1);

    this.timingFill.width = (this.SCENE_W - 40) * progress;

    this.updateCurrentLine();
    this.drawContour();

    if (this.elapsed >= totalMs + 500) {
      this.playing = false;
      eventBus.emit("karaoke:complete", {});
      this.time.delayedCall(800, () => { this.exitScene(); });
    }
  }

  private updateCurrentLine(): void {
    const line = this.lines[this.currentLineIdx];
    if (!line) return;

    const lineStart = this.lines
      .slice(0, this.currentLineIdx)
      .reduce((acc, l) => acc + l.durationMs, 0);
    const lineElapsed = this.elapsed - lineStart;

    if (lineElapsed > line.durationMs && this.currentLineIdx < this.lines.length - 1) {
      this.clearSyllableTexts();
      this.currentLineIdx++;
      const nextLine = this.lines[this.currentLineIdx];
      if (nextLine) this.renderLine(nextLine);
      return;
    }

    if (lineElapsed >= 0 && this.syllableTexts.length === 0) {
      this.renderLine(line);
    }

    const activeSyl = line.syllables.findIndex((s, i) => {
      const next = line.syllables[i + 1];
      return lineElapsed >= s.offsetMs && (!next || lineElapsed < next.offsetMs);
    });

    this.syllableTexts.forEach((t, i) => {
      const isCurrent = i === activeSyl;
      t.setStyle({ color: isCurrent ? "#4A3F55" : "#9188A0" });
      t.setScale(isCurrent ? 1.15 : 1.0);
    });
  }

  private renderLine(line: KaraokeLine): void {
    this.clearSyllableTexts();
    const totalWidth = line.syllables.length * 30;
    let x = (this.SCENE_W - totalWidth) / 2;
    for (const syl of line.syllables) {
      const txt = this.add.text(x, this.LINE_Y, syl.text, {
        fontFamily: "'IBMPlexSansThai', sans-serif",
        fontSize: "22px",
        color: "#9188A0",
      }).setOrigin(0, 0.5);
      this.syllableTexts.push(txt);
      x += txt.width + 4;
    }
  }

  private clearSyllableTexts(): void {
    for (const t of this.syllableTexts) t.destroy();
    this.syllableTexts = [];
  }

  private drawContour(): void {
    const line = this.lines[this.currentLineIdx];
    if (!line || this.syllableTexts.length === 0) return;

    this.contourGfx.clear();

    line.syllables.forEach((syl, i) => {
      const txt = this.syllableTexts[i];
      if (!txt) return;

      const cx = txt.x + txt.width / 2;
      const cy = this.CONTOUR_BASELINE + (CONTOUR_Y[syl.tone] ?? 0);
      const colour = TONE_COLOURS[syl.tone] ?? 0xfff0f5;

      this.contourGfx.fillStyle(colour, 0.85);
      this.contourGfx.fillCircle(cx, cy, 6);

      if (i > 0) {
        const prevTxt = this.syllableTexts[i - 1];
        const prevSyl = line.syllables[i - 1];
        if (prevTxt && prevSyl) {
          const prevCx = prevTxt.x + prevTxt.width / 2;
          const prevCy = this.CONTOUR_BASELINE + (CONTOUR_Y[prevSyl.tone] ?? 0);
          this.contourGfx.lineStyle(2, colour, 0.5);
          this.contourGfx.beginPath();
          this.contourGfx.moveTo(prevCx, prevCy);
          this.contourGfx.lineTo(cx, cy);
          this.contourGfx.strokePath();
        }
      }

      const toneLabels = ["mid", "low", "fall", "high", "rise"];
      const toneLabel = toneLabels[syl.tone] ?? "";
      const lbl = this.add.text(cx, cy - 12, toneLabel, {
        fontSize: "7px",
        color: "#6B5F78",
      }).setOrigin(0.5, 1).setAlpha(0.7);
      this.time.delayedCall(200, () => { lbl.destroy(); });
    });
  }

  private totalDuration(): number {
    return this.lines.reduce((acc, l) => acc + l.durationMs, 0);
  }

  private exitScene(): void {
    this.petals?.stop();
    this.scene.stop("KaraokeScene");
    this.scene.resume("WorldScene");
  }

  shutdown(): void {
    eventBus.off("karaoke:exit", this.onExit);
    this.clearSyllableTexts();
  }
}
