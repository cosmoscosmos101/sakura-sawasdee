import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toThaiWords, nearbyPrices } from "../../learning/thai/thaiNumbers";
import { usePlayerStore } from "../../state/playerStore";
import { POLITE_PARTICLES, pickItem, type BargainItem } from "./bargainingData";

interface Props {
  onClose: () => void;
}

type Phase = "comprehend" | "offer" | "counter" | "deal" | "walkaway";

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function BargainingScreen({ onClose }: Props) {
  const addPoliteness = usePlayerStore((s) => s.addPoliteness);

  const [item, setItem] = useState<BargainItem>(() => pickItem());
  const [phase, setPhase] = useState<Phase>("comprehend");
  const [selectedParticle, setSelectedParticle] = useState<string | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<number | null>(null);
  const [paReply, setPaReply] = useState("");
  const [dealCount, setDealCount] = useState(0);
  const [politeBonus, setPoliteBonus] = useState(0);

  // Phase 1 — four price choices, one is the correct list price
  const priceChoices = useMemo(() => {
    const wrong = nearbyPrices(item.listPrice, 3);
    return shuffle([item.listPrice, ...wrong]);
  }, [item]);

  // Phase 2 — offer prices: 50%, 65%, 75%, 85% of list
  const offerChoices = useMemo(() => {
    const ratios = [0.5, 0.65, 0.75, 0.85];
    return ratios.map((r) => Math.round(item.listPrice * r));
  }, [item]);

  const handleComprehend = useCallback((choice: number) => {
    if (choice === item.listPrice) {
      setPaReply("ใช่แล้ว! แล้วจะเอาราคาเท่าไหร่?");
      setPhase("offer");
    } else {
      setPaReply(`ไม่ใช่ค่ะ ราคา ${toThaiWords(item.listPrice)} บาท ลองอีกครั้ง`);
    }
  }, [item]);

  const handleOffer = useCallback(() => {
    if (selectedOffer === null || selectedParticle === null) return;

    const ratio = selectedOffer / item.listPrice;
    const pScore = POLITE_PARTICLES.find((p) => p.text === selectedParticle)?.score ?? 0;
    setPoliteBonus(pScore);
    addPoliteness(pScore);

    if (selectedOffer < item.minAccept * 0.7) {
      setPaReply("โอ้โห! ถูกเกินไปเลยค่ะ ไม่ขาย!");
      setPhase("walkaway");
    } else if (selectedOffer < item.minAccept) {
      const counter = Math.round(item.minAccept * 1.1);
      setPaReply(`ลดให้ไม่ได้ขนาดนั้น — ${toThaiWords(counter)} บาท ได้ไหม${selectedParticle}?`);
      setPhase("counter");
    } else if (ratio <= 0.85) {
      // Good offer — accept with enthusiasm
      const saved = item.listPrice - selectedOffer;
      setPaReply(`ตกลง ${toThaiWords(selectedOffer)} บาท! ประหยัดไป ${saved} บาทเลย สุดยอด!`);
      setPhase("deal");
      setDealCount((c) => c + 1);
    } else {
      setPaReply(`โอเค ${toThaiWords(selectedOffer)} บาท ตกลงนะ ขอบคุณ${selectedParticle}!`);
      setPhase("deal");
      setDealCount((c) => c + 1);
    }
  }, [selectedOffer, selectedParticle, item, addPoliteness]);

  const handleAcceptCounter = useCallback(() => {
    setPaReply("ขอบคุณมากค่ะ! ได้เลย!");
    setPhase("deal");
    setDealCount((c) => c + 1);
  }, []);

  const handleNextItem = useCallback(() => {
    setItem(pickItem());
    setPhase("comprehend");
    setSelectedParticle(null);
    setSelectedOffer(null);
    setPaReply("");
    setPoliteBonus(0);
  }, []);

  return (
    <div className="pointer-events-auto absolute inset-0 z-20 flex items-end justify-center bg-black/50">
      <motion.div
        initial={{ y: 300, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 300, opacity: 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 22 }}
        className="w-full max-w-sm rounded-t-2xl border-t-2 border-l-2 border-r-2 border-[#4A3F55] bg-[#FFF6E5] p-4 shadow-xl"
      >
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[13px] font-bold text-[#4A3F55]">🛒 ตลาดสดของป้าสมศรี</p>
            <p className="text-[9px] text-[#9188A0]">Pa Somsri's Market · {dealCount} deals made</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-[#4A3F55] bg-[#F5E3C8] px-2 py-0.5 text-[10px] text-[#4A3F55]"
          >
            leave
          </button>
        </div>

        {/* Item display */}
        <div className="mb-3 flex items-center gap-3 rounded-xl bg-[#F5E3C8] px-3 py-2">
          <span className="text-3xl">{item.emoji}</span>
          <div>
            <p className="font-[IBMPlexSansThai] text-[16px] font-bold leading-none text-[#4A3F55]">
              {item.name}
            </p>
            <p className="text-[9px] text-[#9188A0]">{item.meaning}</p>
          </div>
        </div>

        {/* Pa Somsri speech */}
        <div className="mb-3 rounded-xl bg-[#FFD9E8] px-3 py-2">
          <p className="text-[9px] font-semibold text-[#D97FA5]">ป้าสมศรี says:</p>
          <AnimatePresence mode="wait">
            <motion.p
              key={paReply || phase}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-0.5 font-[IBMPlexSansThai] text-[12px] text-[#4A3F55]"
            >
              {phase === "comprehend"
                ? `${item.name} ราคา ${toThaiWords(item.listPrice)} บาทค่ะ — เท่าไหร่นะ?`
                : paReply}
            </motion.p>
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">

          {/* Phase 1 — comprehend the price */}
          {phase === "comprehend" && (
            <motion.div key="comprehend" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p className="mb-2 text-center text-[10px] text-[#6B5F78]">
                How much is she asking? Tap the correct price.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {priceChoices.map((price) => (
                  <button
                    key={price}
                    onClick={() => handleComprehend(price)}
                    className="rounded-xl border-2 border-[#4A3F55] bg-[#E0D7FF] py-2 text-[13px] font-bold text-[#4A3F55] active:scale-95"
                  >
                    ฿{price}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Phase 2 — build polite counter-offer */}
          {phase === "offer" && (
            <motion.div key="offer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
              <p className="text-center text-[10px] text-[#6B5F78]">
                Make your offer — pick a price then a polite particle.
              </p>

              {/* Price row */}
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {offerChoices.map((price) => (
                  <button
                    key={price}
                    onClick={() => setSelectedOffer(price)}
                    className="shrink-0 rounded-xl border-2 px-2 py-1.5 text-[11px] font-bold text-[#4A3F55] active:scale-95 transition-colors"
                    style={{
                      borderColor: selectedOffer === price ? "#D97FA5" : "#4A3F55",
                      background: selectedOffer === price ? "#FFD9E8" : "#FFF0F5",
                    }}
                  >
                    {toThaiWords(price)}
                    <span className="block text-[8px] font-normal text-[#9188A0]">฿{price}</span>
                  </button>
                ))}
              </div>

              {/* Particle row */}
              <div className="flex gap-1.5">
                {POLITE_PARTICLES.map((p) => (
                  <button
                    key={p.text}
                    onClick={() => setSelectedParticle(p.text)}
                    className="flex-1 rounded-xl border-2 py-1.5 text-[11px] font-bold text-[#4A3F55] active:scale-95 transition-colors"
                    style={{
                      borderColor: selectedParticle === p.text ? "#D97FA5" : "#4A3F55",
                      background: selectedParticle === p.text ? "#FFD9E8" : "#E0D7FF",
                    }}
                  >
                    {p.text}
                    <span className="block text-[8px] font-normal text-[#9188A0]">{p.label}</span>
                  </button>
                ))}
              </div>

              {/* Offer preview */}
              <div className="min-h-[24px] rounded-lg bg-[#F5E3C8] px-2 py-1 text-center">
                <span className="font-[IBMPlexSansThai] text-[11px] text-[#4A3F55]">
                  {selectedOffer !== null
                    ? `ขอ ${toThaiWords(selectedOffer)} บาท${selectedParticle ?? " …"}`
                    : "เลือกราคาและคำลงท้าย…"}
                </span>
              </div>

              <button
                onClick={handleOffer}
                disabled={selectedOffer === null || selectedParticle === null}
                className="w-full rounded-xl border-2 border-[#4A3F55] bg-[#FFD9E8] py-1.5 text-[11px] font-bold text-[#4A3F55] disabled:opacity-40 active:scale-95"
              >
                Make offer →
              </button>
            </motion.div>
          )}

          {/* Phase 3 — counter-offer from Pa Somsri */}
          {phase === "counter" && (
            <motion.div key="counter" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
              <button
                onClick={handleNextItem}
                className="flex-1 rounded-xl border-2 border-[#4A3F55] bg-[#E0D7FF] py-1.5 text-[10px] font-semibold text-[#4A3F55] active:scale-95"
              >
                Walk away
              </button>
              <button
                onClick={handleAcceptCounter}
                className="flex-[2] rounded-xl border-2 border-[#4A3F55] bg-[#FFD9E8] py-1.5 text-[11px] font-bold text-[#4A3F55] active:scale-95"
              >
                ตกลง — Accept →
              </button>
            </motion.div>
          )}

          {/* Phase — deal or walkaway */}
          {(phase === "deal" || phase === "walkaway") && (
            <motion.div
              key="outcome"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-2"
            >
              <div className="rounded-xl py-2 text-center"
                style={{ background: phase === "deal" ? "#C8F2E0" : "#FFD9E8" }}>
                <p className="text-[14px] font-bold text-[#4A3F55]">
                  {phase === "deal" ? "🤝 ตกลง! Deal!" : "😤 เดินออกไปก่อน…"}
                </p>
                {phase === "deal" && politeBonus > 0 && (
                  <p className="text-[9px] text-[#4A3F55]/70">
                    +{politeBonus} politeness for using {selectedParticle}
                  </p>
                )}
              </div>
              <button
                onClick={handleNextItem}
                className="w-full rounded-xl border-2 border-[#4A3F55] bg-[#FFD9E8] py-1.5 text-[11px] font-bold text-[#4A3F55] active:scale-95"
              >
                Next item →
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  );
}
