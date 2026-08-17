import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { Question } from "../../learning/questionGenerator";

interface Props {
  question: Question;
  onAnswer: (choiceIndex: number, timingMs: number) => void;
}

/** Timing thresholds in ms for the coloured timing bar. */
const CRITICAL_MS = 3000;
const NORMAL_MAX_MS = 8000;

export function QuestionCard({ question, onAnswer }: Props) {
  const [chosen, setChosen] = useState<number | null>(null);
  const startRef = useRef(Date.now());

  // Reset when the question changes
  useEffect(() => {
    setChosen(null);
    startRef.current = Date.now();
  }, [question.vocabId, question.type]);

  // Keyboard shortcuts: 1–4
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const idx = ["1", "2", "3", "4"].indexOf(e.key);
      if (idx !== -1 && chosen === null) pick(idx);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  function pick(idx: number) {
    if (chosen !== null) return;
    setChosen(idx);
    const elapsed = Date.now() - startRef.current;
    // Small delay so the player sees the highlighted choice before advancing
    setTimeout(() => onAnswer(idx, elapsed), 350);
  }

  return (
    <motion.div
      key={`${question.vocabId}-${question.type}`}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="pointer-events-auto mx-auto w-full max-w-[360px]"
    >
      <div className="rounded-2xl border-[3px] border-[#4A3F55] bg-[#FFF6E5] shadow-lg">
        {/* Timing bar */}
        <TimingBar timeLimitMs={question.timeLimitMs} />

        {/* Prompt */}
        <div className="px-5 py-3 text-center">
          <p
            className="text-[22px] leading-tight text-[#4A3F55]"
            style={{ fontFamily: "var(--font-jp)" }}
          >
            {question.prompt}
          </p>
          {question.promptSub && (
            <p className="mt-0.5 text-[11px] text-[#9188A0]" style={{ fontFamily: "var(--font-jp)" }}>
              {question.promptSub}
            </p>
          )}
        </div>

        {/* Options */}
        <div className="grid grid-cols-2 gap-2 px-4 pb-4">
          {question.options.map((opt, i) => {
            const isChosen = chosen === i;
            const isCorrect = i === question.correctIndex;
            const revealed = chosen !== null;

            let bg = "bg-[#FFF0F5] hover:bg-[#FFD9E8]";
            let border = "border-[#4A3F55]";
            if (revealed && isCorrect) { bg = "bg-[#C8F2E0]"; border = "border-[#4E7D5E]"; }
            else if (revealed && isChosen && !isCorrect) { bg = "bg-[#F5E3C8]"; border = "border-[#C9A27E]"; }

            return (
              <button
                key={i}
                onClick={() => pick(i)}
                disabled={chosen !== null}
                className={`rounded-xl border-2 ${border} ${bg} px-2 py-2.5 text-[11px] leading-tight text-[#4A3F55] transition-colors`}
              >
                <span className="mr-1.5 text-[9px] text-[#9188A0]">{i + 1}.</span>
                {opt.text}
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

function TimingBar({ timeLimitMs }: { timeLimitMs: number }) {
  const [pct, setPct] = useState(100);
  const rafRef = useRef<number>(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    startRef.current = Date.now();
    function tick() {
      const elapsed = Date.now() - startRef.current;
      const remaining = Math.max(0, 1 - elapsed / timeLimitMs) * 100;
      setPct(remaining);
      if (remaining > 0) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [timeLimitMs]);

  const elapsed = (100 - pct) / 100 * timeLimitMs;
  const color =
    elapsed < CRITICAL_MS ? "#FFE08A" :
    elapsed < NORMAL_MAX_MS ? "#F7A8C4" : "#A9A3B8";

  return (
    <div className="h-1.5 w-full rounded-t-xl bg-[#F5E3C8]">
      <div
        className="h-full rounded-tl-xl transition-none"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}
