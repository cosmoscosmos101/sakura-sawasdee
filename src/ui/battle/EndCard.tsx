import { useEffect } from "react";
import { useBattleStore } from "../../state/battleStore";
import { applyVictoryRewards } from "../../state/victoryActions";

export function EndCard() {
  const phase        = useBattleStore((s) => s.phase);
  const rewardedXp   = useBattleStore((s) => s.rewardedXp);
  const upgradedIds  = useBattleStore((s) => s.upgradedVocabIds);
  const endBattle    = useBattleStore((s) => s.endBattle);

  useEffect(() => {
    if (phase === "victory") void applyVictoryRewards();
  }, [phase]);

  if (phase !== "victory") return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.65)",
        zIndex: 50,
        pointerEvents: "auto",
      }}
    >
      <div
        style={{
          background: "rgba(13,13,26,0.97)",
          border: "2px solid #ffd700",
          borderRadius: 6,
          padding: "24px 32px",
          textAlign: "center",
          fontFamily: "'Chrono', monospace",
          color: "#e8dcc8",
          maxWidth: 300,
        }}
      >
        <div style={{ fontSize: 28, marginBottom: 6 }}>✦</div>
        <div style={{ color: "#ffd700", fontSize: 14, marginBottom: 4, letterSpacing: 1 }}>
          VICTORY
        </div>
        <div style={{ fontSize: 12, color: "#4dff4d", marginBottom: 4 }}>
          +{rewardedXp} XP
        </div>
        <div style={{ fontSize: 10, color: "#9188a0", marginBottom: 16 }}>
          {upgradedIds.length} word{upgradedIds.length !== 1 ? "s" : ""} strengthened
        </div>
        <button
          onClick={endBattle}
          style={{
            background: "#1a1e32",
            border: "1px solid #ffd700",
            borderRadius: 3,
            color: "#ffd700",
            fontSize: 11,
            padding: "6px 20px",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Continue ▶
        </button>
      </div>
    </div>
  );
}
