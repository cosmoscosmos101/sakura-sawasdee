import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  evaluateToneKitchenGuess,
  CLASS_COLOUR,
  TONE_COLOUR,
  TONE_NAMES,
  TONE_MARK_CHAR,
  type ConsonantClass,
  type VowelLength,
  type SyllableType,
  type ToneMark,
  type Tone,
  type ToneRecipe,
} from "../../learning/thai/scriptSystem";
import { IngredientSlot, ToneButton } from "../components/ToneKitchenWidgets";

interface Props {
  onClose: () => void;
}

type Step = "class" | "vowel" | "syllable" | "mark" | "guess";

interface Recipe {
  consonantClass: ConsonantClass | null;
  vowelLength: VowelLength | null;
  syllableType: SyllableType | null;
  toneMark: ToneMark | null;
}

interface Feedback {
  correct: boolean;
  tone: Tone;
  explanation: string;
}

const STEP_ORDER: Step[] = ["class", "vowel", "syllable", "mark", "guess"];

export default function ToneKitchenScreen({ onClose }: Props) {
  const [step, setStep] = useState<Step>("class");
  const [recipe, setRecipe] = useState<Recipe>({
    consonantClass: null,
    vowelLength: null,
    syllableType: null,
    toneMark: null,
  });
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [streak, setStreak] = useState(0);

  const advance = useCallback(() => {
    const idx = STEP_ORDER.indexOf(step);
    const next = STEP_ORDER[idx + 1];
    if (idx < STEP_ORDER.length - 1 && next) setStep(next);
  }, [step]);

  const handleClass = (cls: ConsonantClass) => {
    setRecipe((r) => ({ ...r, consonantClass: cls }));
    advance();
  };
  const handleVowel = (len: VowelLength) => {
    setRecipe((r) => ({ ...r, vowelLength: len }));
    advance();
  };
  const handleSyllable = (syl: SyllableType) => {
    setRecipe((r) => ({ ...r, syllableType: syl }));
    advance();
  };
  const handleMark = (mark: ToneMark) => {
    setRecipe((r) => ({ ...r, toneMark: mark }));
    advance();
  };
  const handleGuess = (guessedTone: Tone) => {
    const full = recipe as ToneRecipe;
    const result = evaluateToneKitchenGuess({ recipe: full, guessedTone });
    setFeedback({ correct: result.correct, tone: result.actual.tone, explanation: result.explanation });
    setStreak((s) => (result.correct ? s + 1 : 0));
  };

  const reset = () => {
    setStep("class");
    setRecipe({ consonantClass: null, vowelLength: null, syllableType: null, toneMark: null });
    setFeedback(null);
  };

  const classSlotValue = recipe.consonantClass ?? "?";
  const classSlotColour = recipe.consonantClass ? CLASS_COLOUR[recipe.consonantClass] : "#FFF6E5";
  const vowelSlotValue = recipe.vowelLength ? (recipe.vowelLength === "long" ? "long" : "short") : "?";
  const syllableSlotValue = recipe.syllableType ?? "?";
  const markSlotValue = recipe.toneMark ? TONE_MARK_CHAR[recipe.toneMark] : "?";

  return (
    <div className="pointer-events-auto absolute inset-0 z-20 flex items-center justify-center bg-black/50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="relative flex w-[300px] flex-col rounded-2xl border-2 border-[#4A3F55] bg-[#FFF6E5] p-4 shadow-xl"
      >
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[13px] font-bold text-[#4A3F55]">🍳 Tone Kitchen</p>
            <p className="text-[9px] text-[#9188A0]">Pa Somsri's kitchen · streak {streak}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-[#4A3F55] bg-[#F5E3C8] px-2 py-0.5 text-[10px] text-[#4A3F55]"
          >
            close
          </button>
        </div>

        {/* Ingredient slots */}
        <div className="mb-3 flex justify-around rounded-xl bg-[#F5E3C8] px-3 py-2">
          <IngredientSlot label="class" value={classSlotValue} colour={classSlotColour} active={step === "class"} />
          <span className="mt-3 text-[#9188A0]">+</span>
          <IngredientSlot label="vowel" value={vowelSlotValue} colour="#C8ECF5" active={step === "vowel"} />
          <span className="mt-3 text-[#9188A0]">+</span>
          <IngredientSlot label="syllable" value={syllableSlotValue} colour="#C8F2E0" active={step === "syllable"} />
          <span className="mt-3 text-[#9188A0]">+</span>
          <IngredientSlot label="mark" value={markSlotValue} colour="#E0D7FF" active={step === "mark"} />
        </div>

        {/* Picker area */}
        <AnimatePresence mode="wait">
          {!feedback && (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.12 }}
            >
              {step === "class" && (
                <div className="space-y-2">
                  <p className="text-center text-[10px] font-semibold text-[#6B5F78]">Pick the consonant class</p>
                  <div className="flex gap-2">
                    {(["mid", "high", "low"] as ConsonantClass[]).map((cls) => (
                      <button
                        key={cls}
                        onClick={() => handleClass(cls)}
                        className="flex-1 rounded-xl border-2 border-[#4A3F55] py-2 text-[11px] font-bold text-[#4A3F55] shadow-sm active:scale-95"
                        style={{ background: CLASS_COLOUR[cls] }}
                      >
                        {cls}
                      </button>
                    ))}
                  </div>
                  <p className="text-center text-[9px] text-[#9188A0]">
                    mid: ก จ ด ต บ ป&nbsp; · &nbsp;high: ข ส ห&nbsp; · &nbsp;low: ค ง น ม…
                  </p>
                </div>
              )}

              {step === "vowel" && (
                <div className="space-y-2">
                  <p className="text-center text-[10px] font-semibold text-[#6B5F78]">How long is the vowel?</p>
                  <div className="flex gap-2">
                    {(["short", "long"] as VowelLength[]).map((len) => (
                      <button
                        key={len}
                        onClick={() => handleVowel(len)}
                        className="flex-1 rounded-xl border-2 border-[#4A3F55] bg-[#C8ECF5] py-2 text-[11px] font-bold text-[#4A3F55] shadow-sm active:scale-95"
                      >
                        {len === "short" ? "short ◦" : "long ─"}
                      </button>
                    ))}
                  </div>
                  <p className="text-center text-[9px] text-[#9188A0]">
                    กา = long · กะ = short
                  </p>
                </div>
              )}

              {step === "syllable" && (
                <div className="space-y-2">
                  <p className="text-center text-[10px] font-semibold text-[#6B5F78]">Live or dead syllable?</p>
                  <div className="flex gap-2">
                    {(["live", "dead"] as SyllableType[]).map((syl) => (
                      <button
                        key={syl}
                        onClick={() => handleSyllable(syl)}
                        className="flex-1 rounded-xl border-2 border-[#4A3F55] bg-[#C8F2E0] py-2 text-[11px] font-bold text-[#4A3F55] shadow-sm active:scale-95"
                      >
                        {syl === "live" ? "🌱 live" : "🔪 dead"}
                      </button>
                    ))}
                  </div>
                  <p className="text-center text-[9px] text-[#9188A0]">
                    live: ends in n/m/ng/y/w or long vowel · dead: ends in k/p/t or short vowel alone
                  </p>
                </div>
              )}

              {step === "mark" && (
                <div className="space-y-2">
                  <p className="text-center text-[10px] font-semibold text-[#6B5F78]">Any tone mark?</p>
                  <div className="grid grid-cols-5 gap-1">
                    {(["none", "mai_ek", "mai_tho", "mai_tri", "mai_jattawa"] as ToneMark[]).map((mark) => (
                      <button
                        key={mark}
                        onClick={() => handleMark(mark)}
                        className="flex flex-col items-center rounded-xl border-2 border-[#4A3F55] bg-[#E0D7FF] py-1.5 text-[#4A3F55] shadow-sm active:scale-95"
                      >
                        <span className="text-[16px] leading-none">{TONE_MARK_CHAR[mark]}</span>
                        <span className="mt-0.5 text-[7px]">{mark === "none" ? "none" : mark.replace("mai_", "").replace("_", " ")}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === "guess" && (
                <div className="space-y-2">
                  <p className="text-center text-[10px] font-semibold text-[#6B5F78]">What tone does this make?</p>
                  <div className="grid grid-cols-5 gap-1">
                    {([0, 1, 2, 3, 4] as Tone[]).map((t) => (
                      <ToneButton key={t} tone={t} onClick={handleGuess} />
                    ))}
                  </div>
                  <div
                    className="mt-1 rounded-lg border border-[#4A3F55]/30 p-2 text-[9px] text-[#6B5F78]"
                    style={{ background: "#FFF0F5" }}
                  >
                    {recipe.consonantClass}-class · {recipe.vowelLength} vowel · {recipe.syllableType} syllable
                    {recipe.toneMark !== "none" ? ` · ${TONE_MARK_CHAR[recipe.toneMark!]}` : ""}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {feedback && (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-2"
            >
              {/* Result bowl */}
              <div
                className="flex flex-col items-center rounded-xl border-2 border-[#4A3F55] p-3 shadow-sm"
                style={{ background: TONE_COLOUR[feedback.tone] }}
              >
                <span className="text-2xl">{feedback.correct ? "✨" : "💫"}</span>
                <p className="mt-1 text-[13px] font-bold text-[#4A3F55]">
                  {TONE_NAMES[feedback.tone]} tone
                </p>
              </div>

              <p className="text-center text-[9px] leading-relaxed text-[#6B5F78]">
                {feedback.explanation}
              </p>

              <button
                onClick={reset}
                className="w-full rounded-xl border-2 border-[#4A3F55] bg-[#FFD9E8] py-1.5 text-[11px] font-bold text-[#4A3F55] shadow-sm active:scale-95"
              >
                Cook another →
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
