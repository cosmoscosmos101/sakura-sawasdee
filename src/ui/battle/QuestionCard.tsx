import { useState, useEffect, useRef } from "react";
import { useBattleStore } from "../../state/battleStore";

const CARD: React.CSSProperties = {
  background: "rgba(10,10,22,0.97)",
  border: "2px solid #4a6fa5",
  borderRadius: 4,
  padding: "12px 16px",
  fontFamily: "'Chrono', monospace",
  color: "#e8dcc8",
  minWidth: 280,
  maxWidth: 340,
  pointerEvents: "auto",
};

const CHOICE_BASE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "7px 10px",
  margin: "3px 0",
  border: "1px solid #2a3f5f",
  borderRadius: 3,
  cursor: "pointer",
  fontSize: 13,
  transition: "background 0.1s, border-color 0.1s",
};

function choiceStyle(selected: boolean, correct: boolean | null, hovered: boolean): React.CSSProperties {
  if (selected && correct === true)  return { ...CHOICE_BASE, border: "1px solid #4dff4d", background: "rgba(77,255,77,0.12)" };
  if (selected && correct === false) return { ...CHOICE_BASE, border: "1px solid #ff4040", background: "rgba(255,64,64,0.12)" };
  if (hovered)                       return { ...CHOICE_BASE, border: "1px solid #4a6fa5", background: "rgba(74,111,165,0.2)" };
  return CHOICE_BASE;
}

/** Shrinking timer bar — green → yellow → red as time runs out */
function TimerBar({ elapsed, limit }: { elapsed: number; limit: number }) {
  const pct  = Math.max(0, 1 - elapsed / limit);
  const color = pct > 0.55 ? "#4dff4d" : pct > 0.28 ? "#ffdd57" : "#ff4040";
  return (
    <div style={{ width: "100%", height: 3, background: "#1a1a2e", borderRadius: 2, marginBottom: 10 }}>
      <div style={{ width: `${pct * 100}%`, height: "100%", background: color, borderRadius: 2, transition: "width 0.08s linear, background 0.3s" }} />
    </div>
  );
}

export function QuestionCard() {
  const phase             = useBattleStore((s) => s.phase);
  const question          = useBattleStore((s) => s.currentQuestion);
  const submitAnswer      = useBattleStore((s) => s.submitAnswer);
  const lastResult        = useBattleStore((s) => s.lastResult);
  const proceedFromResult = useBattleStore((s) => s.proceedFromResult);

  const [selected,  setSelected]  = useState<number | null>(null);
  const [revealed,  setRevealed]  = useState(false);
  const [hovered,   setHovered]   = useState<number | null>(null);
  const [elapsed,   setElapsed]   = useState(0);
  const startRef  = useRef(Date.now());
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (phase === "question") {
      setSelected(null); setRevealed(false); setElapsed(0);
      startRef.current = Date.now();
      timerRef.current = setInterval(() => setElapsed(Date.now() - startRef.current), 80);
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, question]);

  if (phase === "question" && question) {
    const limit = question.timeLimitMs ?? 12000;
    const choose = (i: number) => {
      if (selected !== null) return;
      setSelected(i); setRevealed(true);
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      submitAnswer(i, Date.now() - startRef.current);
    };

    return (
      <div style={CARD}>
        <TimerBar elapsed={elapsed} limit={limit} />
        <div style={{ fontSize: 9, color: "#ffd700", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" }}>
          {question.type.replace(/_/g, " ")}
        </div>
        <div style={{ fontSize: 17, marginBottom: 10, color: "#ffffff", lineHeight: 1.3 }}>
          {question.prompt}
        </div>
        {question.promptSub && (
          <div style={{ fontSize: 11, color: "#9188a0", marginBottom: 8 }}>{question.promptSub}</div>
        )}
        {question.options.map((opt, i) => (
          <div
            key={i}
            style={choiceStyle(selected === i, revealed ? i === question.correctIndex : null, hovered === i)}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => choose(i)}
          >
            {hovered === i && selected === null && (
              <img src="/ct-assets/sprites/cursor.png" alt="" style={{ width: 10, imageRendering: "pixelated" }} />
            )}
            <span>{opt.text}</span>
          </div>
        ))}
      </div>
    );
  }

  if (phase === "result" && lastResult) {
    const tierColor = lastResult.timingTier === "critical" ? "#ffd700" : lastResult.timingTier === "slow" ? "#9188a0" : "#e8dcc8";
    return (
      <div style={{ ...CARD, textAlign: "center" }}>
        <div style={{ fontSize: 26, marginBottom: 4 }}>{lastResult.correct ? "✓" : "✗"}</div>
        <div style={{ color: lastResult.correct ? "#4dff4d" : "#ff4040", fontSize: 14, marginBottom: 3 }}>
          {lastResult.correct ? `+${lastResult.damage} damage` : "Miss!"}
        </div>
        <div style={{ fontSize: 10, color: tierColor, marginBottom: 12, letterSpacing: 1 }}>
          {lastResult.timingTier.toUpperCase()}
        </div>
        <button
          onClick={proceedFromResult}
          style={{ background: "#1a1e32", border: "1px solid #4a6fa5", borderRadius: 3, color: "#e8dcc8", fontSize: 11, padding: "5px 18px", cursor: "pointer", fontFamily: "inherit" }}
        >
          Continue ▶
        </button>
      </div>
    );
  }

  return null;
}
