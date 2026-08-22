import { useBattleStore } from "../../state/battleStore";
import { applyDefeatPenalty } from "../../state/defeatActions";
import { useEffect } from "react";

export function DefeatCard() {
  const phase           = useBattleStore((s) => s.phase);
  const defeatedIds     = useBattleStore((s) => s.defeatedVocabIds);
  const endBattle       = useBattleStore((s) => s.endBattle);

  useEffect(() => {
    if (phase === "defeat") void applyDefeatPenalty();
  }, [phase]);

  if (phase !== "defeat") return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.75)",
        zIndex: 50,
        pointerEvents: "auto",
      }}
    >
      <div
        style={{
          background: "rgba(13,13,26,0.97)",
          border: "2px solid #ff4040",
          borderRadius: 6,
          padding: "24px 32px",
          textAlign: "center",
          fontFamily: "'Chrono', monospace",
          color: "#e8dcc8",
          maxWidth: 300,
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 8 }}>✗</div>
        <div style={{ color: "#ff4040", fontSize: 14, marginBottom: 4, letterSpacing: 1 }}>
          DEFEATED
        </div>
        <div style={{ fontSize: 10, color: "#9188a0", marginBottom: 16 }}>
          The fog has taken {defeatedIds.length} word{defeatedIds.length !== 1 ? "s" : ""}.
        </div>
        <button
          onClick={endBattle}
          style={{
            background: "#1a1e32",
            border: "1px solid #4a6fa5",
            borderRadius: 3,
            color: "#e8dcc8",
            fontSize: 11,
            padding: "6px 20px",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Return ▶
        </button>
      </div>
    </div>
  );
}
