import { useBattleStore } from "../../state/battleStore";

const ELEMENT_COLOR: Record<string, string> = {
  bloom:  "#F7A8C4",
  spark:  "#FFE08A",
  flow:   "#7FC4E0",
  echo:   "#C9B8F0",
  stone:  "#C9A27E",
  light:  "#FFF6E5",
};

export function ComboBar() {
  const chain       = useBattleStore((s) => s.chain);
  const phase       = useBattleStore((s) => s.phase);
  const comboResult = useBattleStore((s) => s.comboResult);
  const executeCombo = useBattleStore((s) => s.executeCombo);
  const proceedFromResult = useBattleStore((s) => s.proceedFromResult);

  if (chain.length === 0) return null;

  const showCombo  = phase === "combo" && comboResult;
  const allSent    = useBattleStore.getState().party.every((k) => k.sentThisTurn);

  return (
    <div
      style={{
        background: "rgba(13,13,26,0.90)",
        border: "2px solid #4a6fa5",
        borderRadius: 4,
        padding: "8px 12px",
        fontFamily: "'Chrono', monospace",
        color: "#e8dcc8",
        fontSize: 11,
        pointerEvents: "auto",
      }}
    >
      <div style={{ fontSize: 9, color: "#ffd700", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" }}>
        Sentence Chain
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
        {chain.map((tok, i) => (
          <span
            key={i}
            style={{
              padding: "2px 7px",
              border: `1px solid ${ELEMENT_COLOR[tok.element] ?? "#4a6fa5"}`,
              borderRadius: 3,
              color: ELEMENT_COLOR[tok.element] ?? "#e8dcc8",
              fontSize: 12,
            }}
          >
            {tok.written}
          </span>
        ))}
      </div>

      {showCombo && (
        <div style={{ marginTop: 4 }}>
          {comboResult.valid && comboResult.multiplier > 1 ? (
            <div style={{ color: "#ffd700", fontWeight: "bold", fontSize: 13 }}>
              ✦ COMBO ×{comboResult.multiplier.toFixed(1)}
            </div>
          ) : (
            <div style={{ color: "#9188a0", fontSize: 11 }}>
              {comboResult.reason ?? "Incomplete combo"}
            </div>
          )}
          <button
            onClick={proceedFromResult}
            style={{
              marginTop: 6,
              background: "#1a1e32",
              border: "1px solid #4a6fa5",
              borderRadius: 3,
              color: "#e8dcc8",
              fontSize: 10,
              padding: "4px 14px",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Next ▶
          </button>
        </div>
      )}

      {!showCombo && allSent && phase === "command" && (
        <button
          onClick={executeCombo}
          style={{
            background: "#2a1e32",
            border: "1px solid #ffd700",
            borderRadius: 3,
            color: "#ffd700",
            fontSize: 10,
            padding: "3px 12px",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          ✦ Fire Combo
        </button>
      )}
    </div>
  );
}
