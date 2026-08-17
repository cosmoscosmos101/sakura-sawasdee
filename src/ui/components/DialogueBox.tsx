import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import type { DialogueNode, DialogueLine } from "../../content/schema";
import type { LocaleCode } from "../../state/playerStore";

interface Props {
  nodes: DialogueNode[];
  startId: string;
  playerL1: LocaleCode;
  onClose: () => void;
}

const CHARS_PER_SEC = 30;
const CHAR_DELAY_MS = Math.round(1000 / CHARS_PER_SEC);

export function DialogueBox({ nodes, startId, playerL1, onClose }: Props) {
  const [nodeId, setNodeId] = useState(startId);
  const [lineIdx, setLineIdx] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [typing, setTyping] = useState(true);
  const [showReading, setShowReading] = useState(false);
  const [showTranslation, setShowTranslation] = useState(true);

  const charCountRef = useRef(0);
  const intervalRef = useRef<number | null>(null);

  const currentNode = nodes.find((n) => n.id === nodeId);
  const currentLine: DialogueLine | undefined = currentNode?.lines[lineIdx];
  const isLastLine = currentNode ? lineIdx >= currentNode.lines.length - 1 : true;
  const hasChoices = isLastLine && (currentNode?.choices?.length ?? 0) > 0;

  // ── Typewriter ────────────────────────────────────────────────────────────
  const startTyping = useCallback((text: string) => {
    charCountRef.current = 0;
    setDisplayText("");
    setTyping(true);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => {
      charCountRef.current += 1;
      setDisplayText(text.slice(0, charCountRef.current));
      if (charCountRef.current >= text.length) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setTyping(false);
      }
    }, CHAR_DELAY_MS);
  }, []);

  useEffect(() => {
    if (!currentLine) return;
    startTyping(currentLine.l2);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [currentLine, startTyping]);

  // ── Advance / skip ────────────────────────────────────────────────────────
  const advance = useCallback(() => {
    if (!currentNode) return;

    if (typing) {
      // Skip typewriter
      if (intervalRef.current) clearInterval(intervalRef.current);
      setDisplayText(currentLine?.l2 ?? "");
      setTyping(false);
      return;
    }
    if (hasChoices) return; // wait for choice

    if (!isLastLine) {
      setLineIdx((i) => i + 1);
      return;
    }
    // Last line, no choices
    if (currentNode.endsDialogue || !currentNode.nextId) {
      onClose();
      return;
    }
    const next = nodes.find((n) => n.id === currentNode.nextId);
    if (!next) { onClose(); return; }
    setNodeId(next.id);
    setLineIdx(0);
  }, [typing, hasChoices, isLastLine, currentNode, currentLine, nodes, onClose]);

  const pickChoice = useCallback((nextId: string) => {
    const next = nodes.find((n) => n.id === nextId);
    if (!next) { onClose(); return; }
    setNodeId(next.id);
    setLineIdx(0);
  }, [nodes, onClose]);

  // ── Keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "KeyZ" || e.code === "Enter") {
        e.preventDefault();
        advance();
      }
      if (e.code === "KeyR") setShowReading((v) => !v);
      if (e.code === "KeyT") setShowTranslation((v) => !v);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [advance]);

  if (!currentNode || !currentLine) return null;

  const speakerName = currentNode.speakerName[playerL1] ?? currentNode.speakerName.en ?? "";
  const translation = showTranslation
    ? (currentLine.translation?.[playerL1] ?? currentLine.translation?.en)
    : undefined;
  const reading = showReading ? currentLine.reading : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, scaleY: 0.92, y: 8 }}
      animate={{ opacity: 1, scaleY: 1, y: 0 }}
      exit={{ opacity: 0, scaleY: 0.92, y: 8 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="pointer-events-auto mx-auto w-full max-w-[460px]"
    >
      <div
        className="rounded-2xl border-[3px] border-[#4A3F55] shadow-lg"
        style={{ background: "#FFF6E5" }}
      >
        {/* Speaker header */}
        <div className="flex items-center justify-between border-b-2 border-[#4A3F55] px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full border-2 border-[#4A3F55] bg-[#C9B8F0]" />
            <span className="text-[11px] font-semibold text-[#4A3F55]">{speakerName}</span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setShowReading((v) => !v)}
              className={`rounded px-1.5 py-0.5 text-[9px] font-medium border ${showReading ? "border-[#4A3F55] bg-[#C9B8F0] text-[#4A3F55]" : "border-[#9188A0] text-[#9188A0]"}`}
            >
              よみ
            </button>
            <button
              onClick={() => setShowTranslation((v) => !v)}
              className={`rounded px-1.5 py-0.5 text-[9px] font-medium border ${showTranslation ? "border-[#4A3F55] bg-[#FFF0F5] text-[#4A3F55]" : "border-[#9188A0] text-[#9188A0]"}`}
            >
              แปล
            </button>
          </div>
        </div>

        {/* Text body */}
        <div className="min-h-[80px] px-4 py-3" onClick={advance}>
          <p
            className="text-[15px] leading-relaxed text-[#4A3F55]"
            style={{ fontFamily: "var(--font-jp)" }}
          >
            {displayText}
            {typing && <span className="animate-pulse">▌</span>}
          </p>
          {reading && !typing && (
            <p className="mt-0.5 text-[11px] text-[#6B5F78]" style={{ fontFamily: "var(--font-jp)" }}>
              {reading}
            </p>
          )}
          {translation && !typing && (
            <p className="mt-1 text-[12px] text-[#9188A0]">
              {translation}
            </p>
          )}
        </div>

        {/* Choices */}
        {hasChoices && !typing && (
          <div className="border-t-2 border-[#F5E3C8] px-4 py-3 flex flex-col gap-2">
            {currentNode.choices!.map((ch, i) => (
              <button
                key={i}
                onClick={() => pickChoice(ch.nextId)}
                className="w-full rounded-xl border-2 border-[#4A3F55] bg-[#FFF0F5] px-3 py-1.5 text-left text-[12px] text-[#4A3F55] transition-colors hover:bg-[#FFD9E8]"
              >
                {ch.label[playerL1] ?? ch.label.en}
              </button>
            ))}
          </div>
        )}

        {/* Advance indicator */}
        {!typing && !hasChoices && (
          <div className="flex justify-end px-4 pb-2">
            <span className="animate-bounce text-[14px] text-[#4A3F55]">▶</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
