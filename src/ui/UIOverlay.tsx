import { useEffect, useState } from "react";
import { eventBus } from "../state/eventBus";
import { BattleOverlay } from "./battle/BattleOverlay";
import { DialogueBox }   from "./DialogueBox";
import { QuestPanel }    from "./QuestPanel";
import { useBattleStore } from "../state/battleStore";
import { db } from "../data/db";

const HUD: React.CSSProperties = {
  fontFamily: "'Chrono', monospace",
  fontSize: 11,
  color: "#e8dcc8",
  background: "rgba(13,13,26,0.82)",
  border: "1px solid #4a6fa5",
  borderRadius: 4,
  padding: "5px 10px",
};

export function UIOverlay() {
  const [booted,    setBooted]    = useState(false);
  const [mapId,     setMapId]     = useState("");
  const [dueCount,  setDueCount]  = useState(0);
  const [inDialogue, setInDialogue] = useState(false);
  const phase    = useBattleStore((s) => s.phase);
  const inBattle = phase !== "idle";

  useEffect(() => {
    const offBoot = eventBus.on("boot:complete", () => setBooted(true));
    const offMap  = eventBus.on("map:change",    ({ mapId: id }) => setMapId(id));
    const offOpen = eventBus.on("dialogue:open", () => setInDialogue(true));
    const offClose = eventBus.on("dialogue:close", () => setInDialogue(false));
    return () => { offBoot(); offMap(); offOpen(); offClose(); };
  }, []);

  useEffect(() => {
    if (!booted) return;
    const now = Date.now();
    void db.srsCards.toArray().then((cards) =>
      setDueCount(cards.filter((c) => c.state === 2 && c.due <= now).length));
  }, [booted]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 10,
        pointerEvents: "none",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 8,
      }}
      role="region"
      aria-label="Game UI"
    >
      {/* Battle layer */}
      {inBattle && <BattleOverlay />}

      {/* Overworld HUD */}
      {!inBattle && (
        <>
          {/* Top bar: game name/location (left) + quest panel (right) */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <div style={HUD}>
              <div style={{ color: "#ffd700", fontSize: 10, letterSpacing: 1 }}>CHRONO KOTODAMA</div>
              <div style={{ color: "#9188a0", fontSize: 9, marginTop: 2 }}>
                {booted ? (mapId || "—") : "Loading…"}
              </div>
              {dueCount > 0 && (
                <div style={{ color: "#ff8888", fontSize: 9, marginTop: 2 }}>
                  {dueCount} word{dueCount !== 1 ? "s" : ""} due
                </div>
              )}
            </div>

            {booted && <QuestPanel />}
          </div>

          {/* Bottom area: controls hint (hidden during dialogue) + dialogue box */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {!inDialogue && (
              <div style={HUD}>
                <span style={{ color: "#6ab4ff" }}>WASD / ↑↓←→</span>
                <span style={{ color: "#9188a0" }}> move  </span>
                <span style={{ color: "#6ab4ff" }}>E</span>
                <span style={{ color: "#9188a0" }}> talk</span>
              </div>
            )}
            <DialogueBox />
          </div>
        </>
      )}
    </div>
  );
}
