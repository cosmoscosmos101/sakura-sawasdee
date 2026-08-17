import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { loadProfile, saveProfile } from "../../data/db";
import {
  canDraw, drawOmikuji,
  FORTUNE_LABEL, FORTUNE_POEM, BUFF_LABEL, QUEST_LABEL, FORTUNE_BUFF,
  type OmikujiFortune, type DailyQuestId,
} from "../../learning/omikuji";

const FORTUNE_COLOUR: Record<OmikujiFortune, string> = {
  "大吉": "#FFE08A",
  "中吉": "#FFD9E8",
  "小吉": "#C8F2E0",
  "末吉": "#E0D7FF",
  "凶":   "#D8D4E0",
};

const FORTUNE_TEXT_COLOUR: Record<OmikujiFortune, string> = {
  "大吉": "#7A5500",
  "中吉": "#4A3F55",
  "小吉": "#2A5E44",
  "末吉": "#3D2E6B",
  "凶":   "#4A4055",
};

type Phase = "idle" | "drawing" | "revealed";

interface FortuneState {
  fortune: OmikujiFortune;
  questId: DailyQuestId;
}

export function OmikujiScreen({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [alreadyDrawn, setAlreadyDrawn] = useState(false);
  const [fortune, setFortune] = useState<FortuneState | null>(null);

  useEffect(() => {
    void loadProfile().then((p) => {
      const nowMs = Date.now();
      if (!canDraw(p?.omikujiDate, nowMs) && p?.omikujiFortune) {
        setFortune({
          fortune: p.omikujiFortune as OmikujiFortune,
          questId: (p.omikujiQuestId ?? "catch_3") as DailyQuestId,
        });
        setAlreadyDrawn(true);
        setPhase("revealed");
      }
    });
  }, []);

  async function handleDraw() {
    setPhase("drawing");
    const result = drawOmikuji(Date.now());
    await saveProfile({
      omikujiDate:    result.drawnAt,
      omikujiFortune: result.fortune,
      omikujiQuestId: result.questId,
    });
    // Dramatic pause while the stick "falls"
    await new Promise<void>((r) => setTimeout(r, 900));
    setFortune({ fortune: result.fortune, questId: result.questId });
    setPhase("revealed");
  }

  return (
    <motion.div
      initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 280, damping: 30 }}
      className="pointer-events-auto absolute inset-0 z-30 flex flex-col items-center justify-center overflow-hidden bg-[#4A3F55]/80 backdrop-blur-sm"
    >
      {/* Paper slip or shrine display */}
      <AnimatePresence mode="wait">
        {phase === "idle" && (
          <motion.div key="shrine"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="text-6xl select-none">🎋</div>
            <div className="rounded-xl border-2 border-[#FFE08A] bg-[#FFF6E5] px-6 py-4 text-center shadow-lg">
              <p className="text-sm font-bold text-[#4A3F55]">Shrine Fortune Sticks</p>
              <p className="mt-1 text-xs text-[#9188A0]">Shake the tube and receive your fortune</p>
            </div>
            <button
              onClick={() => void handleDraw()}
              className="rounded-xl border-2 border-[#FFE08A] bg-[#FFE08A] px-8 py-3 text-sm font-bold text-[#4A3F55] shadow-lg active:scale-95"
            >
              Draw your fortune 🎋
            </button>
          </motion.div>
        )}

        {phase === "drawing" && (
          <motion.div key="drawing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-3"
          >
            <motion.div
              animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-6xl"
            >🎋</motion.div>
            <p className="text-sm text-[#FFD9E8]">The stick falls…</p>
          </motion.div>
        )}

        {phase === "revealed" && fortune && (
          <FortuneReveal
            fortune={fortune.fortune}
            questId={fortune.questId}
            alreadyDrawn={alreadyDrawn}
            onClose={onClose}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function FortuneReveal({
  fortune, questId, alreadyDrawn, onClose,
}: {
  fortune: OmikujiFortune;
  questId: DailyQuestId;
  alreadyDrawn: boolean;
  onClose: () => void;
}) {
  const bg = FORTUNE_COLOUR[fortune];
  const ink = FORTUNE_TEXT_COLOUR[fortune];
  const buff = FORTUNE_BUFF[fortune];

  return (
    <motion.div
      initial={{ scaleY: 0, originY: 0 }}
      animate={{ scaleY: 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 24 }}
      className="flex max-w-xs flex-col items-center rounded-2xl border-4 shadow-2xl"
      style={{ backgroundColor: bg, borderColor: ink + "44" }}
    >
      {/* Fortune strip header */}
      <div className="w-full rounded-t-xl px-4 py-3 text-center" style={{ backgroundColor: ink + "18" }}>
        {alreadyDrawn && (
          <p className="mb-1 text-[10px]" style={{ color: ink + "99" }}>Today's fortune</p>
        )}
        <p className="font-[NotoSansJP] text-4xl font-black" style={{ color: ink }}>
          {fortune}
        </p>
        <p className="mt-1 text-xs font-semibold" style={{ color: ink }}>
          {FORTUNE_LABEL[fortune]}
        </p>
      </div>

      {/* Poem */}
      <div className="px-5 py-3 text-center">
        <p className="text-[11px] italic leading-relaxed" style={{ color: ink + "cc" }}>
          "{FORTUNE_POEM[fortune]}"
        </p>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px w-full" style={{ backgroundColor: ink + "33" }} />

      {/* Buff */}
      <div className="w-full px-5 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: ink + "88" }}>Today's blessing</p>
        <p className="mt-1 text-sm font-bold" style={{ color: ink }}>✨ {BUFF_LABEL[buff]}</p>
      </div>

      {/* Quest */}
      <div className="w-full rounded-b-xl px-5 py-3" style={{ backgroundColor: ink + "10" }}>
        <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: ink + "88" }}>Daily quest</p>
        <p className="mt-1 text-sm font-bold" style={{ color: ink }}>📜 {QUEST_LABEL[questId]}</p>
      </div>

      <button
        onClick={onClose}
        className="mb-4 mt-2 rounded-xl border-2 px-6 py-1.5 text-xs font-semibold"
        style={{ borderColor: ink + "44", color: ink }}
      >
        Carry this fortune ✓
      </button>
    </motion.div>
  );
}
