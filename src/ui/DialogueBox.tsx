import { useEffect, useState, useCallback, useRef } from "react";
import { eventBus } from "../state/eventBus";
import type { DialogueNode } from "../content/schema";
import { usePlayerStore } from "../state/playerStore";

interface DialogueState {
  nodes: DialogueNode[];
  currentNodeId: string;
  lineIndex: number;
}

const BOX: React.CSSProperties = {
  background: "rgba(13,13,26,0.94)",
  border: "2px solid #4a6fa5",
  borderRadius: 4,
  padding: "10px 16px",
  fontFamily: "'Chrono', monospace",
};

export function DialogueBox() {
  const [dlg, setDlg] = useState<DialogueState | null>(null);
  const l1 = usePlayerStore((s) => s.locale.l1);
  const advanceRef = useRef<() => void>(() => {});

  const closeDialogue = useCallback(() => {
    setDlg(null);
    eventBus.emit("dialogue:close");
  }, []);

  const advance = useCallback(() => {
    setDlg((prev) => {
      if (!prev) return null;
      const node = prev.nodes.find((n) => n.id === prev.currentNodeId);
      if (!node) return null;

      if (prev.lineIndex < node.lines.length - 1) {
        return { ...prev, lineIndex: prev.lineIndex + 1 };
      }
      // No choices yet — follow nextId or end
      if (node.nextId) {
        const next = prev.nodes.find((n) => n.id === node.nextId);
        return next ? { ...prev, currentNodeId: next.id, lineIndex: 0 } : null;
      }
      return null; // triggers close via useEffect below
    });
  }, []);

  // Close after state cleared by advance
  useEffect(() => {
    if (dlg === null) return;
    const node = dlg.nodes.find((n) => n.id === dlg.currentNodeId);
    if (!node) { closeDialogue(); }
  }, [dlg, closeDialogue]);

  // Keep ref current so the keydown handler never closes over stale advance
  useEffect(() => { advanceRef.current = advance; }, [advance]);

  useEffect(() => {
    const off = eventBus.on("dialogue:open", ({ nodes, startId }) => {
      setDlg({ nodes, currentNodeId: startId, lineIndex: 0 });
    });
    return off;
  }, []);

  useEffect(() => {
    if (!dlg) return;
    const handler = (e: KeyboardEvent) => {
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

  const speakerName = node.speakerName[l1] ?? node.speakerName["en"] ?? "";
  const translation = line.translation?.[l1] ?? "";
  const isLastLine = dlg.lineIndex === node.lines.length - 1;
  const hasMore = !isLastLine || !!node.nextId;

  return (
    <div
      onClick={advance}
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        padding: "0 8px 8px",
        cursor: "pointer",
        pointerEvents: "all",
      }}
    >
      <div style={BOX}>
        {/* Speaker name */}
        <div style={{ color: "#ffd700", fontSize: 10, marginBottom: 6, letterSpacing: 1 }}>
          ▼ {speakerName.toUpperCase()}
        </div>

        {/* L2 main text */}
        <div style={{ color: "#e8dcc8", fontSize: 13, lineHeight: 1.6, marginBottom: line.reading ? 2 : 4 }}>
          {line.l2}
        </div>

        {/* Reading / romanisation */}
        {line.reading && (
          <div style={{ color: "#9188a0", fontSize: 9, marginBottom: 4 }}>
            {line.reading}
          </div>
        )}

        {/* L1 translation */}
        {translation && (
          <div style={{ color: "#6ab4ff", fontSize: 10, fontStyle: "italic", marginBottom: 2 }}>
            {translation}
          </div>
        )}

        {/* New word badge */}
        {(line.newWordIds?.length ?? 0) > 0 && (
          <div style={{ color: "#c9b8f0", fontSize: 9, marginTop: 2 }}>✦ NEW WORD</div>
        )}

        {/* Continue hint */}
        <div style={{ color: "#2a2a4a", fontSize: 8, textAlign: "right", marginTop: 6 }}>
          {hasMore ? "SPACE / CLICK ▶" : "SPACE / CLICK ✓"}
        </div>
      </div>
    </div>
  );
}
