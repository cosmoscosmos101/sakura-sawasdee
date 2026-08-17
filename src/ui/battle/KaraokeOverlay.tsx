import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { eventBus } from "../../state/eventBus";
import { TONE_COLOUR, TONE_NAMES, type Tone } from "../../learning/thai/scriptSystem";

type Phase = "idle" | "playing" | "result";

interface ToneChoice {
  syllableIdx: number;
  syllableText: string;
  expectedTone: Tone;
}

interface TapResult {
  syllableText: string;
  expected: Tone;
  chosen: Tone;
  correct: boolean;
}

interface Props {
  onClose: () => void;
  micEnabled: boolean;
  pendingChoices: ToneChoice[];
}

function PitchContourButton({ tone, onClick }: { tone: Tone; onClick: () => void }) {
  const contours = ["─", "↘", "↘↗", "↑", "↗"];
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center rounded-xl border-2 border-[#4A3F55] px-2 py-1.5 shadow-sm active:scale-95"
      style={{ background: TONE_COLOUR[tone] }}
    >
      <span className="text-[18px] leading-none">{contours[tone]}</span>
      <span className="mt-0.5 text-[9px] font-semibold text-[#4A3F55]">{TONE_NAMES[tone]}</span>
    </button>
  );
}

function ScoreBar({ results }: { results: TapResult[] }) {
  const correct = results.filter((r) => r.correct).length;
  const pct = results.length === 0 ? 0 : Math.round((correct / results.length) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#E0D7FF]">
        <motion.div
          className="h-full rounded-full bg-[#F7A8C4]"
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 80 }}
        />
      </div>
      <span className="text-[9px] font-semibold text-[#4A3F55]">{pct}%</span>
    </div>
  );
}

/**
 * Mic-free karaoke overlay. When micEnabled=true, Web Audio autocorrelation
 * is attempted; contour buttons serve as fallback and primary mic-free mode.
 */
export function KaraokeOverlay({ onClose, micEnabled, pendingChoices }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [results, setResults] = useState<TapResult[]>([]);
  const [currentChoice, setCurrentChoice] = useState<ToneChoice | null>(null);
  const [totalMs, setTotalMs] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef(0);
  const hasMicRef = useRef(false);

  const startMic = useCallback(async () => {
    if (!micEnabled) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      hasMicRef.current = true;
    } catch {
      // Permission denied — button-only mode
      hasMicRef.current = false;
    }
  }, [micEnabled]);

  const stopMic = useCallback(() => {
    if (audioCtxRef.current) {
      void audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    cancelAnimationFrame(rafRef.current);
  }, []);

  /** Autocorrelation pitch detection. Returns Hz or null if signal too quiet. */
  const detectPitch = useCallback((): number | null => {
    const analyser = analyserRef.current;
    const ctx = audioCtxRef.current;
    if (!analyser || !ctx) return null;

    const buf = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buf);

    // RMS — skip processing for silent input
    let rms = 0;
    for (let i = 0; i < buf.length; i++) {
      const s = buf[i] ?? 0;
      rms += s * s;
    }
    rms = Math.sqrt(rms / buf.length);
    if (rms < 0.01) return null;

    // Trim leading/trailing silence
    let r1 = 0;
    let r2 = buf.length - 1;
    while (r1 < buf.length / 2 && Math.abs(buf[r1] ?? 0) < 0.2) r1++;
    while (r2 > buf.length / 2 && Math.abs(buf[r2] ?? 0) < 0.2) r2--;

    const trimmed = buf.slice(r1, r2 + 1);
    const halfLen = Math.floor(trimmed.length / 2);
    const correlations = new Float32Array(halfLen);

    for (let i = 0; i < halfLen; i++) {
      let sum = 0;
      for (let j = 0; j < halfLen; j++) {
        sum += (trimmed[j] ?? 0) * (trimmed[j + i] ?? 0);
      }
      correlations[i] = sum;
    }

    // Find first dip, then peak after it
    let d = 0;
    while (d < correlations.length - 1 && (correlations[d] ?? 0) > (correlations[d + 1] ?? 0)) d++;

    let maxVal = -Infinity;
    let maxIdx = -1;
    for (let i = d; i < correlations.length; i++) {
      const v = correlations[i] ?? 0;
      if (v > maxVal) { maxVal = v; maxIdx = i; }
    }
    if (maxIdx <= 0) return null;

    return ctx.sampleRate / maxIdx;
  }, []);

  // Map detected frequency to Thai tone category (relative pitch heuristic)
  const frequencyToTone = useCallback((hz: number): Tone => {
    if (hz > 260) return 3;
    if (hz > 220) return 4;
    if (hz > 160) return 0;
    if (hz > 120) return 2;
    return 1;
  }, []);

  useEffect(() => {
    const offStart = eventBus.on("karaoke:start", ({ totalMs: ms }) => {
      setPhase("playing");
      setTotalMs(ms);
      startTimeRef.current = performance.now();
      void startMic();
    });
    const offComplete = eventBus.on("karaoke:complete", () => {
      setPhase("result");
      stopMic();
    });
    return () => { offStart(); offComplete(); stopMic(); };
  }, [startMic, stopMic]);

  useEffect(() => {
    if (phase !== "playing") return;
    const tick = () => {
      setElapsed(performance.now() - startTimeRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase]);

  useEffect(() => {
    if (pendingChoices.length > 0 && !currentChoice) {
      setCurrentChoice(pendingChoices[0] ?? null);
    }
  }, [pendingChoices, currentChoice]);

  const handleToneChoice = useCallback((chosen: Tone) => {
    if (!currentChoice) return;
    setResults((prev) => [
      ...prev,
      {
        syllableText: currentChoice.syllableText,
        expected: currentChoice.expectedTone,
        chosen,
        correct: chosen === currentChoice.expectedTone,
      },
    ]);
    setCurrentChoice(null);
  }, [currentChoice]);

  const handleMicTap = useCallback(() => {
    const hz = detectPitch();
    if (hz !== null && currentChoice) {
      handleToneChoice(frequencyToTone(hz));
    }
  }, [currentChoice, detectPitch, frequencyToTone, handleToneChoice]);

  const progressPct = totalMs > 0 ? Math.min((elapsed / totalMs) * 100, 100) : 0;

  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex flex-col justify-between p-3">
      {phase === "playing" && (
        <div className="pointer-events-none h-1.5 w-full overflow-hidden rounded-full bg-[#E0D7FF]/60">
          <motion.div className="h-full rounded-full bg-[#F7A8C4]" style={{ width: `${progressPct}%` }} />
        </div>
      )}

      {phase === "playing" && results.length > 0 && (
        <div className="pointer-events-none mt-1 px-2">
          <ScoreBar results={results} />
        </div>
      )}

      <AnimatePresence>
        {phase === "playing" && currentChoice && (
          <motion.div
            key="choice"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="pointer-events-auto mt-auto"
          >
            <div className="rounded-2xl border-2 border-[#4A3F55] bg-[#FFF6E5]/95 p-3 shadow-lg">
              <p className="mb-1.5 text-center text-[10px] text-[#6B5F78]">
                What tone is{" "}
                <span className="font-bold text-[#4A3F55]">{currentChoice.syllableText}</span>?
              </p>
              <div className="grid grid-cols-5 gap-1.5">
                {([0, 1, 2, 3, 4] as Tone[]).map((t) => (
                  <PitchContourButton key={t} tone={t} onClick={() => handleToneChoice(t)} />
                ))}
              </div>
              {micEnabled && hasMicRef.current && (
                <button
                  onClick={handleMicTap}
                  className="mt-2 w-full rounded-xl border-2 border-[#4A3F55] bg-[#C8ECF5] py-1 text-[10px] font-semibold text-[#4A3F55] active:scale-95"
                >
                  🎤 Sing it
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === "result" && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-black/40"
          >
            <div className="w-[240px] rounded-2xl border-2 border-[#4A3F55] bg-[#FFF6E5] p-4 shadow-xl">
              <p className="mb-2 text-center text-[13px] font-bold text-[#4A3F55]">Song finished ✨</p>
              <ScoreBar results={results} />
              <div className="mt-3 max-h-[120px] space-y-1 overflow-y-auto">
                {results.map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-[9px] text-[#6B5F78]">
                    <span className="font-bold text-[#4A3F55]">{r.syllableText}</span>
                    <span style={{ color: TONE_COLOUR[r.expected] }}>{TONE_NAMES[r.expected]}</span>
                    <span>{r.correct ? "✓" : "✗"}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={onClose}
                className="mt-3 w-full rounded-xl border-2 border-[#4A3F55] bg-[#FFD9E8] py-1.5 text-[11px] font-bold text-[#4A3F55] active:scale-95"
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
