import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  applySegmentCuts,
  evaluateSegmentation,
  getRandomChallenge,
  segmentsToCuts,
  type SegmentChallenge,
} from "../../learning/thai/wordSegmentation";

interface Props {
  onClose: () => void;
  location?: string;
}

type Phase = "reading" | "result";

/**
 * Word Segmentation minigame — Naga boss puzzle at the pier.
 * Player taps gap positions in an unspaced Thai string to split words.
 * Gap slots appear between every character; player toggles them on/off.
 */
export default function WordSegmentScreen({ onClose, location }: Props) {
  const [challenge, setChallenge] = useState<SegmentChallenge>(() =>
    getRandomChallenge(location),
  );
  const [activeCuts, setActiveCuts] = useState<Set<number>>(new Set());
  const [phase, setPhase] = useState<Phase>("reading");
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [wasCorrect, setWasCorrect] = useState(false);
  const [streak, setStreak] = useState(0);

  const chars = [...challenge.raw];

  const toggleCut = useCallback((pos: number) => {
    setActiveCuts((prev) => {
      const next = new Set(prev);
      if (next.has(pos)) next.delete(pos);
      else next.add(pos);
      return next;
    });
  }, []);

  const handleSubmit = useCallback(() => {
    const result = evaluateSegmentation(
      { raw: challenge.raw, cuts: [...activeCuts] },
      challenge,
    );
    setScore(result.score);
    setFeedback(result.feedback);
    setWasCorrect(result.correct);
    setStreak((s) => (result.correct ? s + 1 : 0));
    setPhase("result");
  }, [challenge, activeCuts]);

  const handleNext = useCallback(() => {
    setChallenge(getRandomChallenge(location));
    setActiveCuts(new Set());
    setPhase("reading");
    setFeedback("");
  }, [location]);

  const handleShowAnswer = useCallback(() => {
    const correctCuts = segmentsToCuts(challenge.correctSegments);
    setActiveCuts(new Set(correctCuts));
  }, [challenge]);

  const previewSegments = applySegmentCuts(challenge.raw, [...activeCuts]);

  return (
    <div className="pointer-events-auto absolute inset-0 z-20 flex items-center justify-center bg-black/50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="relative w-[320px] rounded-2xl border-2 border-[#4A3F55] bg-[#FFF6E5] p-4 shadow-xl"
      >
        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <div>
            <p className="text-[13px] font-bold text-[#4A3F55]">🐍 Word Split</p>
            <p className="text-[9px] text-[#9188A0]">Naga's pier puzzle · streak {streak}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-[#4A3F55] bg-[#F5E3C8] px-2 py-0.5 text-[10px] text-[#4A3F55]"
          >
            close
          </button>
        </div>

        {/* Hint */}
        <p className="mb-2 rounded-lg bg-[#F5E3C8] px-2 py-1.5 text-center text-[10px] text-[#6B5F78]">
          💡 {challenge.hint}
        </p>

        {/* Character strip with gap buttons */}
        <div className="mb-3 flex flex-wrap items-center justify-center gap-0 rounded-xl border-2 border-[#4A3F55] bg-[#FFF0F5] px-2 py-3">
          {chars.map((char, i) => (
            <span key={i} className="flex items-center">
              {i > 0 && (
                <button
                  onClick={() => toggleCut(i)}
                  className="relative mx-0.5 flex h-8 w-3 items-center justify-center"
                  aria-label={`Split before character ${i}`}
                >
                  <span
                    className="h-6 w-0.5 rounded-full transition-colors duration-100"
                    style={{
                      background: activeCuts.has(i) ? "#D97FA5" : "#E0D7FF",
                    }}
                  />
                  {activeCuts.has(i) && (
                    <span className="absolute -top-1 left-1/2 -translate-x-1/2 text-[8px] text-[#D97FA5]">|</span>
                  )}
                </button>
              )}
              <span
                className="font-[IBMPlexSansThai] text-[18px] leading-none text-[#4A3F55]"
              >
                {char}
              </span>
            </span>
          ))}
        </div>

        {/* Live preview */}
        <div className="mb-3 min-h-[28px] flex flex-wrap gap-1.5 rounded-lg bg-[#F5E3C8] px-2 py-1.5">
          {previewSegments.map((seg, i) => (
            <span
              key={i}
              className="rounded-lg border border-[#4A3F55]/30 bg-[#FFF6E5] px-1.5 py-0.5 font-[IBMPlexSansThai] text-[12px] text-[#4A3F55]"
            >
              {seg}
            </span>
          ))}
        </div>

        {/* Actions */}
        <AnimatePresence mode="wait">
          {phase === "reading" && (
            <motion.div
              key="actions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-2"
            >
              <button
                onClick={() => { setActiveCuts(new Set()); }}
                className="flex-1 rounded-xl border-2 border-[#4A3F55] bg-[#E0D7FF] py-1.5 text-[10px] font-semibold text-[#4A3F55] active:scale-95"
              >
                Clear
              </button>
              <button
                onClick={handleSubmit}
                className="flex-[2] rounded-xl border-2 border-[#4A3F55] bg-[#FFD9E8] py-1.5 text-[11px] font-bold text-[#4A3F55] active:scale-95"
              >
                Check splits →
              </button>
            </motion.div>
          )}

          {phase === "result" && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              {/* Score bar */}
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#E0D7FF]">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: wasCorrect ? "#C8F2E0" : "#F7A8C4" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round(score * 100)}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
                <span className="text-[9px] font-bold text-[#4A3F55]">
                  {Math.round(score * 100)}%
                </span>
              </div>

              <p className="text-center text-[9px] leading-relaxed text-[#6B5F78]">
                {feedback}
              </p>

              <div className="flex gap-2">
                {!wasCorrect && (
                  <button
                    onClick={handleShowAnswer}
                    className="flex-1 rounded-xl border-2 border-[#4A3F55] bg-[#F5E3C8] py-1.5 text-[10px] font-semibold text-[#4A3F55] active:scale-95"
                  >
                    Show answer
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="flex-[2] rounded-xl border-2 border-[#4A3F55] bg-[#FFD9E8] py-1.5 text-[11px] font-bold text-[#4A3F55] active:scale-95"
                >
                  {wasCorrect ? "Next sign →" : "Try another →"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
