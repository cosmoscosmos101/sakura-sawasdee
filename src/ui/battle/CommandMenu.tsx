import { useState, useEffect } from "react";
import { useBattleStore } from "../../state/battleStore";

// Inject pulse keyframes once — cannot be expressed as an inline style object
const PULSE_CSS = `
@keyframes ck-slot-pulse {
  0%, 100% { box-shadow: none; }
  50%       { box-shadow: 0 0 0 2px rgba(74,111,165,0.55); }
}`;
function ensurePulseStyle() {
  if (!document.getElementById("ck-pulse-style")) {
    const s = document.createElement("style");
    s.id = "ck-pulse-style";
    s.textContent = PULSE_CSS;
    document.head.appendChild(s);
  }
}

const PANEL_STYLE: React.CSSProperties = {
  background: "rgba(13,13,26,0.92)",
  border: "2px solid #4a6fa5",
  borderRadius: 4,
  padding: "10px 14px",
  fontFamily: "'Chrono', monospace",
  color: "#e8dcc8",
  minWidth: 220,
};

const ITEM_STYLE = (active: boolean): React.CSSProperties => ({
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "5px 6px",
  borderRadius: 2,
  cursor: "pointer",
  background: active ? "rgba(74,111,165,0.35)" : "transparent",
  fontSize: 12,
  letterSpacing: 0.5,
  transition: "background 0.1s",
});

export function CommandMenu() {
  const party      = useBattleStore((s) => s.party);
  const phase      = useBattleStore((s) => s.phase);
  const sendKotodama = useBattleStore((s) => s.sendKotodama);
  const flee         = useBattleStore((s) => s.flee);
  const telegraph    = useBattleStore((s) => s.telegraphedAction);

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  useEffect(() => { ensurePulseStyle(); }, []);

  if (phase !== "command") return null;

  return (
    <div style={{ ...PANEL_STYLE, pointerEvents: "auto" }}>
      <div style={{ color: "#ffd700", fontSize: 10, letterSpacing: 2, marginBottom: 8, textTransform: "uppercase" }}>
        — Select Word —
      </div>

      {party.map((slot, i) => {
        const sent = slot.sentThisTurn;
        const pulsing = !sent && hoveredIdx !== i;
        return (
          <div
            key={i}
            style={{
              ...ITEM_STYLE(hoveredIdx === i && !sent),
              animation: pulsing ? "ck-slot-pulse 1.8s ease-in-out infinite" : "none",
              animationDelay: `${i * 0.28}s`,
            }}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
            onClick={() => !sent && sendKotodama(i)}
          >
            {/* CT cursor arrow */}
            <img
              src="/ct-assets/sprites/cursor.png"
              alt=""
              style={{
                width: 12,
                imageRendering: "pixelated",
                opacity: hoveredIdx === i && !sent ? 1 : 0,
                transition: "opacity 0.1s",
              }}
            />
            <span style={{ color: sent ? "#555" : "#e8dcc8", flex: 1 }}>
              {slot.vocabEntry.written}
            </span>
            <span style={{ fontSize: 10, color: "#6ab4ff" }}>
              {slot.vocabEntry.element ?? ""}
            </span>
            {sent && (
              <span style={{ fontSize: 9, color: "#888" }}>✓</span>
            )}
          </div>
        );
      })}

      <div style={{ borderTop: "1px solid #2a3f5f", marginTop: 6, paddingTop: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button
          onClick={flee}
          style={{
            background: "none",
            border: "1px solid #6b5f78",
            borderRadius: 3,
            color: "#9188a0",
            fontSize: 10,
            padding: "3px 10px",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Flee
        </button>
        {telegraph && (
          <div style={{ fontSize: 9, color: "#ff8888", maxWidth: 140, textAlign: "right" }}>
            ⚠ {telegraph.telegraphKey}
          </div>
        )}
      </div>
    </div>
  );
}
