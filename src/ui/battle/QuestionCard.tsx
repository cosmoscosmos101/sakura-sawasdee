import { useState, useEffect, useRef } from "react";
import { useBattleStore } from "../../state/battleStore";
import { forgiveLastMistake, skipQuestion } from "../../state/drillActions";
import { PALETTE } from "../../game/palette";
import { t } from "../../i18n/t";

const CARD: React.CSSProperties = {
  background: "rgba(10,10,22,0.97)",
  border: `2px solid ${PALETTE.WATER_3}`,
  borderRadius: 4,
  padding: "12px 16px",
  fontFamily: "'Chrono', monospace",
  color: PALETTE.CREAM_3,
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
  border: `1px solid ${PALETTE.SKY_NIGHT}`,
  borderRadius: 3,
  cursor: "pointer",
  fontSize: 13,
  transition: "background 0.1s, border-color 0.1s",
};

function choiceStyle(selected: boolean, correct: boolean | null, hovered: boolean): React.CSSProperties {
  if (selected && correct === true) {
    return { ...CHOICE_BASE, border: `1px solid ${PALETTE.LEAF_2}`, background: "rgba(123,184,143,0.18)" };
  }
  if (selected && correct === false) {
    return { ...CHOICE_BASE, border: `1px solid ${PALETTE.SAKURA_4}`, background: "rgba(217,127,165,0.16)" };
  }
  if (hovered) {
    return { ...CHOICE_BASE, border: `1px solid ${PALETTE.WATER_3}`, background: "rgba(78,147,181,0.2)" };
  }
  return CHOICE_BASE;
}

function TimerBar({ elapsed, limit }: { elapsed: number; limit: number }) {
  const pct = Math.max(0, 1 - elapsed / limit);
  const color = pct > 0.55 ? PALETTE.LEAF_2 : pct > 0.28 ? PALETTE.GOLD_1 : PALETTE.SAKURA_4;
  return (
    <div style={{ width: "100%", height: 3, background: PALETTE.SKY_NIGHT, borderRadius: 2, marginBottom: 10 }}>
      <div style={{
        width: `${pct * 100}%`, height: "100%", background: color, borderRadius: 2,
        transition: "width 0.08s linear, background 0.3s",
      }} />
    </div>
  );
}

const GHOST_BTN: React.CSSProperties = {
  background: PALETTE.SKY_NIGHT,
  border: `1px solid ${PALETTE.WATER_3}`,
  borderRadius: 3,
  color: PALETTE.CREAM_3,
  fontSize: 11,
  padding: "5px 14px",
  cursor: "pointer",
  fontFamily: "inherit",
};

export function QuestionCard() {
  const phase = useBattleStore((s) => s.phase);
  const question = useBattleStore((s) => s.currentQuestion);
  const submitAnswer = useBattleStore((s) => s.submitAnswer);
  const lastResult = useBattleStore((s) => s.lastResult);
  const proceedFromResult = useBattleStore((s) => s.proceedFromResult);

  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (phase === "question") {
      setSelected(null); setRevealed(false); setElapsed(0);
      startRef.current = Date.now();
      timerRef.current = setInterval(() => setElapsed(Date.now() - startRef.current), 80);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, question]);

  useEffect(() => {
    if (phase !== "question") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && selected === null) { e.preventDefault(); skipQuestion(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, selected]);

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
        <div style={{ fontSize: 9, color: PALETTE.GOLD_1, letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" }}>
          {question.type.replace(/_/g, " ")}
        </div>
        <div style={{ fontSize: 17, marginBottom: 10, color: PALETTE.CREAM_2, lineHeight: 1.3 }}>
          {question.prompt}
        </div>
        {question.promptSub && (
          <div style={{ fontSize: 11, color: PALETTE.INK_SOFT, marginBottom: 8 }}>{question.promptSub}</div>
        )}
        {question.options.map((opt, i) => (
          <div
            key={i}
            style={choiceStyle(selected === i, revealed ? i === question.correctIndex : null, hovered === i)}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => choose(i)}
          >
            <span>{opt.text}</span>
          </div>
        ))}
        <button type="button" onClick={() => skipQuestion()} style={{ ...GHOST_BTN, marginTop: 8, opacity: 0.85 }}>
          {t("learn.skip")}
        </button>
      </div>
    );
  }

  if (phase === "result" && lastResult) {
    const ok = lastResult.correct;
    const accent = ok ? PALETTE.LEAF_2 : PALETTE.SAKURA_4;
    const tierColor = lastResult.timingTier === "critical" ? PALETTE.GOLD_1
      : lastResult.timingTier === "slow" ? PALETTE.INK_SOFT : PALETTE.CREAM_3;
    return (
      <div style={{ ...CARD, textAlign: "center" }}>
        <div style={{ fontSize: 22, marginBottom: 4, color: accent }}>{ok ? "✓" : "?"}</div>
        <div style={{ color: accent, fontSize: 13, marginBottom: 4 }}>
          {ok ? `+${lastResult.damage}` : t("battle.wrongGentle")}
        </div>
        {!ok && (
          <div style={{ fontSize: 10, color: PALETTE.INK_SOFT, marginBottom: 8, lineHeight: 1.5 }}>
            <div>{lastResult.prompt}</div>
            {lastResult.skipped
              ? <div>{t("learn.review.skipped")}</div>
              : <div>{t("learn.review.yours")}: {lastResult.chosenText}</div>}
            <div>{t("learn.review.correct")}: {lastResult.correctText}</div>
          </div>
        )}
        {lastResult.forgiven && (
          <div style={{ fontSize: 10, color: PALETTE.LAVENDER_3, marginBottom: 8 }}>{t("learn.forgiven")}</div>
        )}
        <div style={{ fontSize: 10, color: tierColor, marginBottom: 12, letterSpacing: 1 }}>
          {lastResult.timingTier.toUpperCase()}
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          {!ok && !lastResult.skipped && !lastResult.forgiven && (
            <button type="button" onClick={() => forgiveLastMistake()} style={GHOST_BTN}>
              {t("learn.forgive")}
            </button>
          )}
          <button type="button" onClick={proceedFromResult} style={GHOST_BTN}>
            {t("common.continue")} ▶
          </button>
        </div>
      </div>
    );
  }

  return null;
}
