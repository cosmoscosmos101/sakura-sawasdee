import { useSettingsStore } from "../state/settingsStore";
import { PALETTE } from "../game/palette";
import { t, dialogueModeLabel, encounterRateLabel } from "../i18n/t";

const PANEL: React.CSSProperties = {
  pointerEvents: "all",
  background: "rgba(13,13,26,0.96)",
  border: `2px solid ${PALETTE.WATER_3}`,
  borderRadius: 4,
  padding: "12px 16px",
  fontFamily: "'Chrono', monospace",
  color: PALETTE.CREAM_3,
  minWidth: 240,
};

const BTN = (on: boolean): React.CSSProperties => ({
  background: "transparent",
  border: `1px solid ${on ? PALETTE.GOLD_1 : PALETTE.FOG_3}`,
  color: on ? PALETTE.CREAM_2 : PALETTE.INK_SOFT,
  borderRadius: 3,
  fontFamily: "inherit",
  fontSize: 10,
  padding: "6px 10px",
  cursor: "pointer",
  marginRight: 6,
  marginBottom: 6,
});

export function LearningSettings({ onClose }: { onClose: () => void }) {
  const dialogueMode = useSettingsStore((s) => s.dialogueMode);
  const readingMode = useSettingsStore((s) => s.readingMode);
  const encounterRate = useSettingsStore((s) => s.encounterRate);
  const gradualReveal = useSettingsStore((s) => s.gradualReveal);

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 40, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "all" }}>
      <button type="button" aria-label={t("common.close")} onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(13,13,26,0.45)", border: 0, cursor: "pointer" }} />
      <div style={PANEL} role="dialog" aria-label={t("learn.settings.title")}>
        <div style={{ color: PALETTE.GOLD_1, fontSize: 11, letterSpacing: 2, marginBottom: 10 }}>
          {t("learn.settings.title")}
        </div>

        <div style={{ fontSize: 9, color: PALETTE.INK_SOFT, marginBottom: 4 }}>{dialogueModeLabel(dialogueMode)}</div>
        <div>
          <button type="button" style={BTN(dialogueMode === "adaptive")} onClick={() => useSettingsStore.getState().setDialogueMode("adaptive")}>
            {t("learn.dialogue.adaptive")}
          </button>
          <button type="button" style={BTN(dialogueMode === "max_l2")} onClick={() => useSettingsStore.getState().setDialogueMode("max_l2")}>
            {t("learn.dialogue.max_l2")}
          </button>
        </div>

        <div style={{ fontSize: 9, color: PALETTE.INK_SOFT, margin: "8px 0 4px" }}>{t(`learn.reading.${readingMode}`)}</div>
        <div>
          <button type="button" style={BTN(readingMode === "auto")} onClick={() => useSettingsStore.getState().setReadingMode("auto")}>
            {t("learn.reading.auto")}
          </button>
          <button type="button" style={BTN(readingMode === "press")} onClick={() => useSettingsStore.getState().setReadingMode("press")}>
            {t("learn.reading.press")}
          </button>
          <button type="button" style={BTN(gradualReveal)} onClick={() => useSettingsStore.getState().setGradualReveal(!gradualReveal)}>
            {t("learn.gradual")}
          </button>
        </div>

        <div style={{ fontSize: 9, color: PALETTE.INK_SOFT, margin: "8px 0 4px" }}>
          {encounterRateLabel(encounterRate)}
        </div>
        <div style={{ fontSize: 9, color: PALETTE.FOG_2 }}>{t("learn.encounter.hint")}</div>

        <button type="button" onClick={onClose} style={{ ...BTN(true), marginTop: 12 }}>
          {t("common.close")}
        </button>
      </div>
    </div>
  );
}
