import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TuktukRoad } from "../components/TuktukRoad";
import {
  generateIntersection,
  scoreAttempt,
  timerBudget,
  aggregateWpm,
  fluencyBand,
  type Intersection,
  type RaceResult,
  type Direction,
} from "../../learning/thai/tuktukRacing";

interface Props {
  onClose: () => void;
}

const TOTAL_SIGNS = 8;

type Phase = "countdown" | "driving" | "result";

export default function TuktukScreen({ onClose }: Props) {
  const [phase, setPhase] = useState<Phase>("countdown");
  const [countdown, setCountdown] = useState(3);
  const [intersection, setIntersection] = useState<Intersection>(() => generateIntersection());
  const [timeLeft, setTimeLeft] = useState(4000);
  const [signVisible, setSignVisible] = useState(true);
  const [results, setResults] = useState<RaceResult[]>([]);
  const [streak, setStreak] = useState(0);
  const [bump, setBump] = useState(false);
  const [signIndex, setSignIndex] = useState(0);
  const startRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Countdown 3 → 2 → 1 → go
  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown === 0) { setPhase("driving"); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 900);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  // Per-intersection timer
  useEffect(() => {
    if (phase !== "driving") return;
    const budget = timerBudget(streak);
    setTimeLeft(budget);
    startRef.current = Date.now();

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 100) return 0;
        return t - 100;
      });
    }, 100);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, intersection, streak]);

  // Auto-advance on timeout
  useEffect(() => {
    if (phase !== "driving" || timeLeft > 0) return;
    if (timerRef.current) clearInterval(timerRef.current);
    advanceSign(null);
  }, [timeLeft, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const advanceSign = useCallback((chosen: Direction | null) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const reactionMs = Date.now() - startRef.current;

    let result: RaceResult;
    if (chosen === null) {
      result = { correct: false, reactionMs: 0, wpm: 0 };
      setBump(true);
      setTimeout(() => setBump(false), 400);
    } else {
      result = scoreAttempt(intersection, chosen, reactionMs);
      if (!result.correct) {
        setBump(true);
        setTimeout(() => setBump(false), 400);
      }
    }

    const newStreak = result.correct ? streak + 1 : 0;
    setStreak(newStreak);
    const newResults = [...results, result];

    if (signIndex + 1 >= TOTAL_SIGNS) {
      setResults(newResults);
      setPhase("result");
      return;
    }

    setSignVisible(false);
    setTimeout(() => {
      setResults(newResults);
      setSignIndex((i) => i + 1);
      setIntersection(generateIntersection());
      setSignVisible(true);
    }, 350);
  }, [intersection, results, signIndex, streak]);

  const handleChoice = useCallback((dir: Direction) => {
    if (phase !== "driving") return;
    advanceSign(dir);
  }, [phase, advanceSign]);

  const budget = timerBudget(streak);
  const timerPct = timeLeft / budget;
  const wpm = aggregateWpm(results);
  const band = fluencyBand(wpm);

  return (
    <div className="pointer-events-auto absolute inset-0 z-20 flex flex-col overflow-hidden bg-[#9FD8CE]">

      <TuktukRoad />

      {/* Header — destination */}
      <header className="relative z-10 mx-auto mt-3 w-[310px] rounded-xl border-2 border-[#4A3F55] bg-[#FFF6E5]/95 px-3 py-2 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] text-[#9188A0]">🛺 Destination · sign {signIndex + 1}/{TOTAL_SIGNS}</p>
            {phase === "driving" && (
              <p className="font-[IBMPlexSansThai] text-[18px] font-bold leading-tight text-[#4A3F55]">
                {intersection.destination.thai}
              </p>
            )}
            {phase === "result" && (
              <p className="text-[12px] font-bold text-[#4A3F55]">Race over!</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-[#4A3F55] bg-[#F5E3C8] px-2 py-0.5 text-[10px] text-[#4A3F55]"
          >
            exit
          </button>
        </div>
        {/* Timer bar */}
        {phase === "driving" && (
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[#E0D7FF]">
            <motion.div
              className="h-full rounded-full"
              style={{ background: timerPct > 0.4 ? "#7BB88F" : "#F7A8C4" }}
              animate={{ width: `${timerPct * 100}%` }}
              transition={{ duration: 0.1, ease: "linear" }}
            />
          </div>
        )}
      </header>

      {/* Tuk-tuk */}
      <div className="relative z-10 mx-auto mt-auto flex flex-col items-center">
        <motion.div
          animate={bump ? { x: [-6, 6, -4, 4, 0] } : { x: 0 }}
          transition={{ duration: 0.4 }}
          className="text-5xl"
        >
          🛺
        </motion.div>
      </div>

      {/* Countdown overlay */}
      <AnimatePresence>
        {phase === "countdown" && (
          <motion.div
            key="cd"
            className="absolute inset-0 z-20 flex items-center justify-center"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="rounded-2xl border-2 border-[#4A3F55] bg-[#FFF6E5]/95 px-8 py-6 text-center shadow-xl">
              <p className="mb-2 text-[11px] text-[#9188A0]">🛺 Tuk-tuk Race — read signs fast!</p>
              <motion.p
                key={countdown}
                initial={{ scale: 2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-5xl font-bold text-[#4A3F55]"
              >
                {countdown === 0 ? "GO!" : countdown}
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Intersection sign panel */}
      <AnimatePresence>
        {phase === "driving" && signVisible && (
          <motion.div
            key={signIndex}
            initial={{ y: -120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
            className="absolute bottom-6 left-1/2 z-10 w-[310px] -translate-x-1/2 rounded-2xl border-2 border-[#4A3F55] bg-[#FFF6E5]/97 p-3 shadow-xl"
          >
            <p className="mb-2 text-center text-[9px] text-[#9188A0]">
              Which way to <span className="font-bold text-[#4A3F55] font-[IBMPlexSansThai]">{intersection.destination.thai}</span>?
            </p>
            <div className="flex gap-2">
              {(["left", "straight", "right"] as const).map((dir, i) => {
                const arrow = dir === "left" ? "←" : dir === "right" ? "→" : "↑";
                const sign = intersection.choices[i]!;
                return (
                  <button
                    key={dir}
                    onClick={() => handleChoice(dir)}
                    className="flex flex-1 flex-col items-center gap-0.5 rounded-xl border-2 border-[#4A3F55] bg-[#C9B8F0]/60 py-2 active:scale-95"
                  >
                    <span className="text-[14px] font-bold text-[#4A3F55]">{arrow}</span>
                    <span className="font-[IBMPlexSansThai] text-[13px] font-bold leading-tight text-[#4A3F55]">
                      {sign.thai}
                    </span>
                    <span className="text-[7px] text-[#9188A0]">{sign.romanized}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result screen */}
      <AnimatePresence>
        {phase === "result" && (
          <motion.div
            key="result"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute inset-4 z-20 flex flex-col items-center justify-center rounded-2xl border-2 border-[#4A3F55] bg-[#FFF6E5]/97 p-5 shadow-xl"
          >
            <p className="mb-1 text-[11px] text-[#9188A0]">🛺 Race finished!</p>
            <div
              className="mb-3 rounded-2xl px-6 py-3 text-center"
              style={{ background: band.colour }}
            >
              <p className="text-[28px] font-bold text-[#4A3F55]">{wpm}</p>
              <p className="text-[10px] font-semibold text-[#4A3F55]">words per minute</p>
              <p className="mt-0.5 text-[12px] font-bold text-[#4A3F55]">{band.label}</p>
            </div>

            <div className="mb-3 flex gap-3 text-center">
              <div className="rounded-xl bg-[#C8F2E0] px-3 py-1.5">
                <p className="text-[18px] font-bold text-[#4A3F55]">
                  {results.filter((r) => r.correct).length}
                </p>
                <p className="text-[8px] text-[#4A3F55]">correct</p>
              </div>
              <div className="rounded-xl bg-[#FFD9E8] px-3 py-1.5">
                <p className="text-[18px] font-bold text-[#4A3F55]">
                  {results.filter((r) => !r.correct).length}
                </p>
                <p className="text-[8px] text-[#4A3F55]">missed</p>
              </div>
            </div>

            <div className="flex w-full gap-2">
              <button
                onClick={() => {
                  setPhase("countdown");
                  setCountdown(3);
                  setResults([]);
                  setSignIndex(0);
                  setStreak(0);
                  setIntersection(generateIntersection());
                }}
                className="flex-1 rounded-xl border-2 border-[#4A3F55] bg-[#E0D7FF] py-1.5 text-[10px] font-bold text-[#4A3F55] active:scale-95"
              >
                Race again
              </button>
              <button
                onClick={onClose}
                className="flex-1 rounded-xl border-2 border-[#4A3F55] bg-[#FFD9E8] py-1.5 text-[10px] font-bold text-[#4A3F55] active:scale-95"
              >
                Back to world
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
