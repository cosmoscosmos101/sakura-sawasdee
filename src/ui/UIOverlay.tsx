import { useEffect, useState } from "react";
import { eventBus } from "../state/eventBus";
import { BattleOverlay } from "./battle/BattleOverlay";
import { DialogueBox } from "./DialogueBox";
import { QuestPanel } from "./QuestPanel";
import { LearningSettings } from "./LearningSettings";
import { useBattleStore } from "../state/battleStore";
import { db } from "../data/db";
import { PALETTE } from "../game/palette";
import { t } from "../i18n/t";

const HUD: React.CSSProperties = {
  fontFamily: "'Chrono', monospace",
  fontSize: 11,
  color: PALETTE.CREAM_3,
  background: "rgba(13,13,26,0.82)",
  border: `1px solid ${PALETTE.WATER_3}`,
  borderRadius: 4,
  padding: "5px 10px",
};

export function UIOverlay() {
  const [booted, setBooted] = useState(false);
  const [mapId, setMapId] = useState("");
  const [dueCount, setDueCount] = useState(0);
  const [inDialogue, setInDialogue] = useState(false);
  const [toast, setToast] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const phase = useBattleStore((s) => s.phase);
  const inBattle = phase !== "idle";

  useEffect(() => {
    const offBoot = eventBus.on("boot:complete", () => setBooted(true));
    const offMap = eventBus.on("map:change", ({ mapId: id }) => setMapId(id));
    const offOpen = eventBus.on("dialogue:open", () => setInDialogue(true));
    const offClose = eventBus.on("dialogue:close", () => setInDialogue(false));
    const offToast = eventBus.on("hud:toast", ({ text }) => setToast(text));
    return () => { offBoot(); offMap(); offOpen(); offClose(); offToast(); };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(""), 1800);
    return () => window.clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (inDialogue || inBattle) return;
      setSettingsOpen((open) => !open);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [inDialogue, inBattle]);

  useEffect(() => {
    if (!booted) return;
    const now = Date.now();
    void db.srsCards.toArray().then((cards) =>
      setDueCount(cards.filter((c) => c.state === 2 && c.due <= now).length));
  }, [booted]);

  return (
    <div
      style={{
        position: "absolute", inset: 0, zIndex: 10, pointerEvents: "none",
        display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 8,
      }}
      role="region"
      aria-label="Game UI"
    >
      {inBattle && <BattleOverlay />}

      {!inBattle && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <div style={HUD}>
              <div style={{ color: PALETTE.GOLD_1, fontSize: 10, letterSpacing: 1 }}>CHRONO KOTODAMA</div>
              <div style={{ color: PALETTE.INK_SOFT, fontSize: 9, marginTop: 2 }}>
                {booted ? (mapId || "—") : "Loading…"}
              </div>
              {dueCount > 0 && (
                <div style={{ color: PALETTE.SAKURA_3, fontSize: 9, marginTop: 2 }}>
                  {t("queue.sleepyHud", { count: dueCount })}
                </div>
              )}
              {toast && (
                <div style={{ color: PALETTE.LAVENDER_3, fontSize: 9, marginTop: 4 }}>{toast}</div>
              )}
            </div>
            {booted && <QuestPanel />}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {!inDialogue && (
              <div style={HUD}>
                <span style={{ color: PALETTE.TUKTUK_BLUE }}>WASD</span>
                <span style={{ color: PALETTE.INK_SOFT }}> move  </span>
                <span style={{ color: PALETTE.TUKTUK_BLUE }}>E</span>
                <span style={{ color: PALETTE.INK_SOFT }}> talk  </span>
                <span style={{ color: PALETTE.TUKTUK_BLUE }}>Q</span>
                <span style={{ color: PALETTE.INK_SOFT }}> fog  </span>
                <span style={{ color: PALETTE.TUKTUK_BLUE }}>ESC</span>
                <span style={{ color: PALETTE.INK_SOFT }}> {t("learn.settings.title")}</span>
              </div>
            )}
            <DialogueBox />
          </div>
        </>
      )}

      {settingsOpen && !inBattle && (
        <LearningSettings onClose={() => setSettingsOpen(false)} />
      )}
    </div>
  );
}
