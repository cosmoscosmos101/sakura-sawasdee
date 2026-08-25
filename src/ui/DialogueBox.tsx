import { useEffect, useState, useCallback, useRef } from "react";
import { eventBus } from "../state/eventBus";
import type { DialogueLine, DialogueNode } from "../content/schema";
import { usePlayerStore } from "../state/playerStore";
import { useSettingsStore } from "../state/settingsStore";
import { audioSystem } from "../state/AudioSystem";
import { PALETTE } from "../game/palette";
import { t } from "../i18n/t";
import {
  initialLayer,
  isFullyRevealed,
  lineTokenIds,
  nextRevealLayer,
  shouldShowL2,
  visibleReading,
  visibleTranslation,
  type RevealLayer,
} from "../learning/dialogueReveal";

interface DialogueState {
  nodes: DialogueNode[];
  currentNodeId: string;
  lineIndex: number;
  layer: RevealLayer;
  showL2: boolean;
}

const BOX: React.CSSProperties = {
  background: "rgba(13,13,26,0.94)",
  border: `2px solid ${PALETTE.WATER_3}`,
  borderRadius: 4,
  padding: "10px 16px",
  fontFamily: "'Chrono', monospace",
};

function lineSetup(line: DialogueLine): Pick<DialogueState, "layer" | "showL2"> {
  const known = usePlayerStore.getState().knownWordIds;
  const { dialogueMode, gradualReveal } = useSettingsStore.getState();
  const showL2 = shouldShowL2(lineTokenIds(line), known, dialogueMode);
  return { showL2, layer: initialLayer(showL2, gradualReveal) };
}

export function DialogueBox() {
  const [dlg, setDlg] = useState<DialogueState | null>(null);
  const l1 = usePlayerStore((s) => s.locale.l1);
  const l2 = usePlayerStore((s) => s.locale.l2);
  const gradual = useSettingsStore((s) => s.gradualReveal);
  const readingMode = useSettingsStore((s) => s.readingMode);
  const advanceRef = useRef<() => void>(() => {});
  const revealRef = useRef<() => void>(() => {});
  const listenRef = useRef<() => void>(() => {});

  const closeDialogue = useCallback(() => {
    setDlg(null);
    eventBus.emit("dialogue:close");
  }, []);

  const speakLine = useCallback((line: DialogueLine, showL2: boolean) => {
    if (!showL2) return;
    audioSystem.playVoice("dialogue_line", line.l2, l2);
  }, [l2]);

  const reveal = useCallback(() => {
    setDlg((prev) => {
      if (!prev) return null;
      const node = prev.nodes.find((n) => n.id === prev.currentNodeId);
      const line = node?.lines[prev.lineIndex];
      if (!line) return prev;
      const next = nextRevealLayer(prev.layer, Boolean(line.reading));
      if (next === "done") return prev;
      return { ...prev, layer: next };
    });
  }, []);

  const advance = useCallback(() => {
    setDlg((prev) => {
      if (!prev) return null;
      const node = prev.nodes.find((n) => n.id === prev.currentNodeId);
      if (!node) return null;
      const line = node.lines[prev.lineIndex];
      if (line && !isFullyRevealed(prev.layer, gradual)) {
        const next = nextRevealLayer(prev.layer, Boolean(line.reading));
        if (next !== "done") return { ...prev, layer: next };
      }
      if (prev.lineIndex < node.lines.length - 1) {
        const upcoming = node.lines[prev.lineIndex + 1];
        if (!upcoming) return null;
        return { ...prev, lineIndex: prev.lineIndex + 1, ...lineSetup(upcoming) };
      }
      if (node.nextId) {
        const nxt = prev.nodes.find((n) => n.id === node.nextId);
        if (!nxt) return null;
        const first = nxt.lines[0];
        if (!first) return null;
        return { ...prev, currentNodeId: nxt.id, lineIndex: 0, ...lineSetup(first) };
      }
      return null;
    });
  }, [gradual]);

  useEffect(() => {
    if (dlg === null) return;
    const node = dlg.nodes.find((n) => n.id === dlg.currentNodeId);
    if (!node) closeDialogue();
  }, [dlg, closeDialogue]);

  useEffect(() => { advanceRef.current = advance; }, [advance]);
  useEffect(() => { revealRef.current = reveal; }, [reveal]);
  useEffect(() => {
    listenRef.current = () => {
      if (!dlg) return;
      const node = dlg.nodes.find((n) => n.id === dlg.currentNodeId);
      const line = node?.lines[dlg.lineIndex];
      if (line) speakLine(line, dlg.showL2);
    };
  }, [dlg, speakLine]);

  useEffect(() => {
    const off = eventBus.on("dialogue:open", ({ nodes, startId }) => {
      const node = nodes.find((n) => n.id === startId) ?? nodes[0];
      const first = node?.lines[0];
      if (!node || !first) return;
      setDlg({ nodes, currentNodeId: node.id, lineIndex: 0, ...lineSetup(first) });
    });
    return off;
  }, []);

  useEffect(() => {
    if (!dlg) return;
    const node = dlg.nodes.find((n) => n.id === dlg.currentNodeId);
    const line = node?.lines[dlg.lineIndex];
    if (line && readingMode === "auto") speakLine(line, dlg.showL2);
  }, [dlg?.currentNodeId, dlg?.lineIndex, dlg?.showL2, readingMode, speakLine]);

  useEffect(() => {
    if (!dlg) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "c" || e.key === "C") { e.preventDefault(); revealRef.current(); }
      if (e.key === "z" || e.key === "Z") { e.preventDefault(); listenRef.current(); }
      if (e.key === " " || e.key === "Enter" || e.key === "e" || e.key === "E") {
        e.preventDefault();
        advanceRef.current();
      }
      if (e.key === "Escape") closeDialogue();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [dlg, closeDialogue]);

  if (!dlg) return null;

  const node = dlg.nodes.find((n) => n.id === dlg.currentNodeId);
  if (!node) return null;
  const line = node.lines[dlg.lineIndex];
  if (!line) return null;

  const speakerName = node.speakerName[l1] ?? node.speakerName.en ?? "";
  const translation = line.translation?.[l1] ?? "";
  const isLastLine = dlg.lineIndex === node.lines.length - 1;
  const hasMore = !isLastLine || Boolean(node.nextId);
  const mainText = dlg.showL2 ? line.l2 : (translation || line.l2);
  const showReading = visibleReading(line, dlg.layer, dlg.showL2);
  const showGloss = dlg.showL2 && visibleTranslation(dlg.layer) && Boolean(translation);

  return (
    <div
      onClick={advance}
      style={{
        position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 50,
        padding: "0 8px 8px", cursor: "pointer", pointerEvents: "all",
      }}
    >
      <div style={BOX}>
        <div style={{ color: PALETTE.GOLD_1, fontSize: 10, marginBottom: 6, letterSpacing: 1 }}>
          ▼ {speakerName.toUpperCase()}
        </div>
        <div style={{ color: PALETTE.CREAM_3, fontSize: 13, lineHeight: 1.6, marginBottom: showReading ? 2 : 4 }}>
          {mainText}
        </div>
        {showReading && (
          <div style={{ color: PALETTE.INK_SOFT, fontSize: 9, marginBottom: 4 }}>{line.reading}</div>
        )}
        {showGloss && (
          <div style={{ color: PALETTE.TUKTUK_BLUE, fontSize: 10, fontStyle: "italic", marginBottom: 2 }}>
            {translation}
          </div>
        )}
        {(line.newWordIds?.length ?? 0) > 0 && dlg.showL2 && (
          <div style={{ color: PALETTE.LAVENDER_3, fontSize: 9, marginTop: 2 }}>✦</div>
        )}
        <div style={{ color: PALETTE.FOG_3, fontSize: 8, textAlign: "right", marginTop: 6 }}>
          {t("learn.reveal.hint")}
          {"  "}
          {hasMore ? "▶" : "✓"}
        </div>
      </div>
    </div>
  );
}
