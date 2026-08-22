import { useBattleStore } from "../../state/battleStore";

const BAR_W = 120;

function HpBar({ current, max }: { current: number; max: number }) {
  const pct = max > 0 ? current / max : 0;
  const color = pct > 0.5 ? "#4dff4d" : pct > 0.25 ? "#ffdd57" : "#ff4040";
  return (
    <div
      style={{ width: BAR_W, height: 6, background: "#1a1a2e", border: "1px solid #4a6fa5", borderRadius: 3 }}
    >
      <div
        style={{
          width: `${Math.max(0, pct * 100)}%`,
          height: "100%",
          background: color,
          borderRadius: 3,
          transition: "width 0.25s ease",
        }}
      />
    </div>
  );
}

export function BattleHUD() {
  const playerHp    = useBattleStore((s) => s.playerHp);
  const playerMaxHp = useBattleStore((s) => s.playerMaxHp);
  const enemyHp     = useBattleStore((s) => s.enemyHp);
  const enemyMaxHp  = useBattleStore((s) => s.enemyMaxHp);
  const enemyId     = useBattleStore((s) => s.enemyId);

  return (
    <div
      style={{
        position: "absolute",
        top: 8,
        right: 8,
        padding: "8px 12px",
        background: "rgba(13,13,26,0.88)",
        border: "2px solid #4a6fa5",
        borderRadius: 4,
        display: "flex",
        flexDirection: "column",
        gap: 6,
        minWidth: 160,
        fontFamily: "'Chrono', monospace",
        color: "#e8dcc8",
        fontSize: 11,
      }}
    >
      {/* Enemy */}
      <div>
        <div style={{ color: "#ff8888", marginBottom: 2, textTransform: "uppercase", fontSize: 9, letterSpacing: 1 }}>
          {enemyId.replace("-", " ")}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <HpBar current={enemyHp} max={enemyMaxHp} />
          <span style={{ fontSize: 10, color: "#aaa" }}>{enemyHp}/{enemyMaxHp}</span>
        </div>
      </div>

      <div style={{ borderTop: "1px solid #2a3f5f" }} />

      {/* Player */}
      <div>
        <div style={{ color: "#6ab4ff", marginBottom: 2, textTransform: "uppercase", fontSize: 9, letterSpacing: 1 }}>
          CRONO
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <HpBar current={playerHp} max={playerMaxHp} />
          <span style={{ fontSize: 10, color: "#aaa" }}>{playerHp}/{playerMaxHp}</span>
        </div>
      </div>
    </div>
  );
}
