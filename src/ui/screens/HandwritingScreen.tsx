import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  evaluateHandwriting,
  HANDWRITING_CHALLENGES,
  type HandwritingChallenge,
  type Point,
} from "../../learning/thai/handwriting";

interface Props {
  onClose: () => void;
}

type Phase = "drawing" | "result";

const CANVAS_SIZE = 240;

function toNorm(px: number, total: number): number {
  return px / total;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

/** Convert a stored stroke (normalised) to SVG path string for the canvas area. */
function strokeToPath(stroke: Point[], size: number): string {
  if (stroke.length === 0) return "";
  return stroke
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x * size} ${p.y * size}`)
    .join(" ");
}

export default function HandwritingScreen({ onClose }: Props) {
  const [challenge, setChallenge] = useState<HandwritingChallenge>(() =>
    pickRandom(HANDWRITING_CHALLENGES),
  );
  const [phase, setPhase] = useState<Phase>("drawing");
  const [drawnStrokes, setDrawnStrokes] = useState<Point[][]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [wasCorrect, setWasCorrect] = useState(false);
  const [streak, setStreak] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);
  const drawing = useRef(false);

  const getSvgPoint = useCallback((e: React.PointerEvent | PointerEvent): Point => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: toNorm(e.clientX - rect.left, rect.width),
      y: toNorm(e.clientY - rect.top, rect.height),
    };
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (phase !== "drawing") return;
    drawing.current = true;
    svgRef.current?.setPointerCapture(e.pointerId);
    setCurrentStroke([getSvgPoint(e)]);
  }, [phase, getSvgPoint]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!drawing.current) return;
    setCurrentStroke((prev) => [...prev, getSvgPoint(e)]);
  }, [getSvgPoint]);

  const onPointerUp = useCallback(() => {
    if (!drawing.current) return;
    drawing.current = false;
    setCurrentStroke((prev) => {
      if (prev.length >= 2) {
        setDrawnStrokes((strokes) => [...strokes, prev]);
      }
      return [];
    });
  }, []);

  // Release capture if pointer leaves
  useEffect(() => {
    const onUp = () => { drawing.current = false; setCurrentStroke([]); };
    window.addEventListener("pointerup", onUp);
    return () => window.removeEventListener("pointerup", onUp);
  }, []);

  const handleCheck = useCallback(() => {
    const result = evaluateHandwriting(drawnStrokes, challenge);
    setScore(result.score);
    setFeedback(result.feedback);
    setWasCorrect(result.correct);
    setStreak((s) => (result.correct ? s + 1 : 0));
    setPhase("result");
  }, [drawnStrokes, challenge]);

  const handleNext = useCallback(() => {
    setChallenge(pickRandom(HANDWRITING_CHALLENGES));
    setDrawnStrokes([]);
    setCurrentStroke([]);
    setPhase("drawing");
    setFeedback("");
  }, []);

  const handleClear = useCallback(() => {
    setDrawnStrokes([]);
    setCurrentStroke([]);
  }, []);

  const strokeCount = drawnStrokes.length + (currentStroke.length > 1 ? 1 : 0);
  const needed = challenge.strokes.length;

  return (
    <div className="pointer-events-auto absolute inset-0 z-20 flex items-center justify-center bg-black/50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="relative w-[310px] rounded-2xl border-2 border-[#4A3F55] bg-[#FFF6E5] p-4 shadow-xl"
      >
        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <div>
            <p className="text-[13px] font-bold text-[#4A3F55]">✍️ Thai Script</p>
            <p className="text-[9px] text-[#9188A0]">
              Trace the character · streak {streak}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-[#4A3F55] bg-[#F5E3C8] px-2 py-0.5 text-[10px] text-[#4A3F55]"
          >
            close
          </button>
        </div>

        {/* Character info */}
        <div className="mb-3 flex items-center gap-3 rounded-xl bg-[#F5E3C8] px-3 py-2">
          <span className="font-[IBMPlexSansThai] text-[36px] font-bold leading-none text-[#4A3F55]">
            {challenge.character}
          </span>
          <div>
            <p className="text-[10px] font-semibold text-[#4A3F55]">/{challenge.romanized}/</p>
            <p className="text-[9px] text-[#9188A0]">{challenge.meaning}</p>
            <p className="text-[8px] text-[#9188A0]">
              {strokeCount}/{needed} strokes
            </p>
          </div>
        </div>

        {/* Drawing canvas */}
        <div className="relative mb-3 overflow-hidden rounded-xl border-2 border-[#4A3F55] bg-[#FFF0F5]"
          style={{ width: CANVAS_SIZE, height: CANVAS_SIZE, margin: "0 auto" }}>
          <svg
            ref={svgRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            style={{ touchAction: "none", cursor: "crosshair" }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            {/* Template guide (faint) */}
            {challenge.strokes.map((s, i) => (
              <path
                key={`guide-${i}`}
                d={strokeToPath(s.points, CANVAS_SIZE)}
                stroke="#C9B8F0"
                strokeWidth={6}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                opacity={0.35}
              />
            ))}

            {/* Start dot */}
            {challenge.strokes[0] && (
              <circle
                cx={(challenge.strokes[0].points[0]?.x ?? 0.5) * CANVAS_SIZE}
                cy={(challenge.strokes[0].points[0]?.y ?? 0.2) * CANVAS_SIZE}
                r={6}
                fill="#D97FA5"
                opacity={0.8}
              />
            )}

            {/* Player strokes already committed */}
            {drawnStrokes.map((stroke, i) => (
              <path
                key={`drawn-${i}`}
                d={strokeToPath(stroke, CANVAS_SIZE)}
                stroke="#4A3F55"
                strokeWidth={3.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            ))}

            {/* Live stroke in progress */}
            {currentStroke.length > 1 && (
              <path
                d={strokeToPath(currentStroke, CANVAS_SIZE)}
                stroke="#D97FA5"
                strokeWidth={3.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            )}
          </svg>

          {/* Result overlay */}
          <AnimatePresence>
            {phase === "result" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center rounded-xl"
                style={{ background: wasCorrect ? "#C8F2E0CC" : "#FFD9E8CC" }}
              >
                <p className="text-[28px]">{wasCorrect ? "✨" : "💫"}</p>
                <p className="text-[12px] font-bold text-[#4A3F55]">
                  {Math.round(score * 100)}%
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Feedback */}
        {phase === "result" && (
          <p className="mb-2 text-center text-[9px] leading-relaxed text-[#6B5F78]">
            {feedback}
          </p>
        )}

        {/* Actions */}
        <AnimatePresence mode="wait">
          {phase === "drawing" && (
            <motion.div key="draw-actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
              <button
                onClick={handleClear}
                className="flex-1 rounded-xl border-2 border-[#4A3F55] bg-[#E0D7FF] py-1.5 text-[10px] font-semibold text-[#4A3F55] active:scale-95"
              >
                Clear
              </button>
              <button
                onClick={handleCheck}
                disabled={drawnStrokes.length === 0}
                className="flex-[2] rounded-xl border-2 border-[#4A3F55] bg-[#FFD9E8] py-1.5 text-[11px] font-bold text-[#4A3F55] disabled:opacity-40 active:scale-95"
              >
                Check →
              </button>
            </motion.div>
          )}

          {phase === "result" && (
            <motion.div key="result-actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
              {!wasCorrect && (
                <button
                  onClick={() => { setDrawnStrokes([]); setPhase("drawing"); }}
                  className="flex-1 rounded-xl border-2 border-[#4A3F55] bg-[#F5E3C8] py-1.5 text-[10px] font-semibold text-[#4A3F55] active:scale-95"
                >
                  Retry
                </button>
              )}
              <button
                onClick={handleNext}
                className="flex-[2] rounded-xl border-2 border-[#4A3F55] bg-[#FFD9E8] py-1.5 text-[11px] font-bold text-[#4A3F55] active:scale-95"
              >
                {wasCorrect ? "Next →" : "New char →"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
