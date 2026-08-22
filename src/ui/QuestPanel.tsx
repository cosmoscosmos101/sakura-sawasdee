import { useQuestStore, selectLevelProgress } from "../state/questStore";
import { usePlayerStore } from "../state/playerStore";

const PANEL: React.CSSProperties = {
  background: "rgba(13,13,26,0.82)",
  border: "1px solid #4a6fa5",
  borderRadius: 4,
  padding: "4px 10px",
  fontFamily: "'Chrono', monospace",
};

export function QuestPanel() {
  const quests        = useQuestStore((s) => s.quests);
  const questProgress = useQuestStore((s) => s.questProgress);
  const level         = useQuestStore((s) => s.level);
  const levelPct      = useQuestStore(selectLevelProgress);
  const l1            = usePlayerStore((s) => s.locale.l1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 130 }}>
      {/* Level + XP bar */}
      <div style={PANEL}>
        <div style={{ color: "#ffd700", fontSize: 9, letterSpacing: 1, marginBottom: 3 }}>
          LV {level}
        </div>
        <div style={{ background: "#1a1a2e", borderRadius: 2, height: 4, overflow: "hidden" }}>
          <div
            style={{
              width: `${Math.round(levelPct * 100)}%`,
              height: "100%",
              background: "#4a6fa5",
              transition: "width 0.4s ease-out",
            }}
          />
        </div>
      </div>

      {/* Daily quests */}
      {quests.map((q, i) => {
        const progress  = questProgress.progress[i] ?? 0;
        const completed = questProgress.completed[i] ?? false;
        const label     = l1 === "th" ? q.labelTh : q.label;
        return (
          <div
            key={q.id}
            style={{
              ...PANEL,
              border: `1px solid ${completed ? "#4e7d5e" : "#2a2a3a"}`,
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "3px 8px",
            }}
          >
            <span style={{ fontSize: 9 }}>{q.icon}</span>
            <span style={{ flex: 1, fontSize: 8, color: completed ? "#7bb88f" : "#9188a0" }}>
              {label}
            </span>
            <span style={{ fontSize: 9, color: completed ? "#7bb88f" : "#6ab4ff" }}>
              {completed ? "✓" : `${progress}/${q.goal}`}
            </span>
          </div>
        );
      })}
    </div>
  );
}
