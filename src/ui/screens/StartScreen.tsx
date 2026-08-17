import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayerStore } from "../../state/playerStore";
import type { LocalePair } from "../../state/playerStore";
import { saveProfile } from "../../data/db";

interface Props {
  onStart: () => void;
}

interface LocaleOption {
  pair: LocalePair;
  flag: string;
  label: string;
  subLabel: string;
}

const LOCALE_OPTIONS: LocaleOption[] = [
  {
    pair: { l1: "th", l2: "ja" },
    flag: "🇹🇭",
    label: "เรียนภาษาญี่ปุ่น",
    subLabel: "Thai → Japanese",
  },
  {
    pair: { l1: "en", l2: "ja" },
    flag: "🇬🇧",
    label: "Learn Japanese",
    subLabel: "English → Japanese",
  },
  {
    pair: { l1: "ja", l2: "th" },
    flag: "🇯🇵",
    label: "タイ語を学ぶ",
    subLabel: "Japanese → Thai",
  },
];

/** 6 skin tones from the master palette. */
const SKIN_TONES = ["#FFE8D6", "#F5D0B0", "#E0B088", "#C08E62", "#9B6B45", "#6E4830"] as const;

export function StartScreen({ onStart }: Props) {
  const { setLocale } = usePlayerStore();
  const [selectedLocale, setSelectedLocale] = useState<LocalePair | null>(null);
  const [selectedSkin, setSelectedSkin] = useState(0);
  const [step, setStep] = useState<"locale" | "character">("locale");

  function handleLocaleSelect(pair: LocalePair) {
    setSelectedLocale(pair);
    setLocale(pair);
    setStep("character");
  }

  function handleStart() {
    if (!selectedLocale) return;
    void saveProfile({
      locale: selectedLocale,
      name: "",
    });
    onStart();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#FFF0F5]"
    >
      {/* Logo */}
      <div className="mb-6 text-center">
        <p
          className="text-[28px] font-semibold text-[#4A3F55]"
          style={{ fontFamily: "var(--font-jp)" }}
        >
          🌸 さくら と สวัสดี
        </p>
        <p className="mt-1 text-[11px] text-[#9188A0]">Sakura & Sawasdee</p>
      </div>

      <AnimatePresence mode="wait">
        {step === "locale" && (
          <motion.div
            key="locale"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex w-full max-w-[300px] flex-col gap-3 px-4"
          >
            <p className="text-center text-[11px] text-[#6B5F78]">
              Choose your journey
            </p>
            {LOCALE_OPTIONS.map((opt) => (
              <button
                key={`${opt.pair.l1}-${opt.pair.l2}`}
                onClick={() => handleLocaleSelect(opt.pair)}
                className="flex items-center gap-3 rounded-2xl border-[3px] border-[#4A3F55] bg-[#FFF6E5] px-4 py-3 text-left shadow-sm transition-colors hover:bg-[#FFD9E8]"
              >
                <span className="text-[24px]">{opt.flag}</span>
                <div>
                  <p className="text-[13px] font-semibold text-[#4A3F55]">{opt.label}</p>
                  <p className="text-[10px] text-[#9188A0]">{opt.subLabel}</p>
                </div>
              </button>
            ))}
          </motion.div>
        )}

        {step === "character" && (
          <motion.div
            key="character"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex w-full max-w-[300px] flex-col items-center gap-4 px-4"
          >
            <p className="text-[11px] text-[#6B5F78]">Choose your character</p>

            {/* Character preview */}
            <div className="relative h-16 w-12">
              <div
                className="absolute inset-0 rounded-xl border-2 border-[#4A3F55]"
                style={{ background: SKIN_TONES[selectedSkin] }}
              />
              <div
                className="absolute left-1/2 top-1 h-4 w-8 -translate-x-1/2 rounded-full border border-[#4A3F55]"
                style={{ background: "#C9A27E" }}
              />
              <div
                className="absolute left-1/2 top-[26px] h-6 w-7 -translate-x-1/2 rounded-sm border border-[#4A3F55]"
                style={{ background: "#5A5A8C" }}
              />
            </div>

            {/* Skin tone picker */}
            <div className="flex gap-2">
              {SKIN_TONES.map((tone, i) => (
                <button
                  key={tone}
                  onClick={() => setSelectedSkin(i)}
                  className="h-6 w-6 rounded-full border-2 transition-transform"
                  style={{
                    background: tone,
                    borderColor: selectedSkin === i ? "#4A3F55" : "#9188A0",
                    transform: selectedSkin === i ? "scale(1.2)" : "scale(1)",
                  }}
                />
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep("locale")}
                className="rounded-xl border-2 border-[#9188A0] bg-[#FFF6E5] px-4 py-2 text-[11px] text-[#9188A0]"
              >
                ← Back
              </button>
              <button
                onClick={handleStart}
                className="rounded-xl border-[3px] border-[#4A3F55] bg-[#F7A8C4] px-6 py-2 text-[13px] font-semibold text-[#4A3F55] shadow-sm transition-colors hover:bg-[#FFD9E8]"
              >
                Start 🌸
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="absolute bottom-4 text-[9px] text-[#9188A0]">
        Phase 1 vertical slice — save data stored locally
      </p>
    </motion.div>
  );
}
