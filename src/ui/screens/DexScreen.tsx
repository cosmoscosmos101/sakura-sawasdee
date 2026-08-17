import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { VocabEntry } from "../../content/schema";
import type { Element } from "../../content/schema";
import { db } from "../../data/db";
import { getMemoryState, type KotodamaMemoryState } from "../../learning/srs";
import { usePlayerStore } from "../../state/playerStore";

interface DexEntry {
  vocab: VocabEntry;
  caught: boolean;
  memoryState: KotodamaMemoryState | null;
}

type FilterState = "all" | "caught" | "uncaught";
type FilterMemory = "all" | KotodamaMemoryState;

const ELEMENT_COLOUR: Record<Element, string> = {
  bloom:  "#F7A8C4",
  spark:  "#FFE08A",
  flow:   "#7FC4E0",
  echo:   "#C9B8F0",
  stone:  "#C9A27E",
  light:  "#FFF6E5",
};

const MEMORY_LABEL: Record<KotodamaMemoryState, string> = {
  radiant: "✨ Radiant",
  bright:  "🌸 Bright",
  dazed:   "💫 Dazed",
  sleepy:  "💤 Sleepy",
  fading:  "🌫️ Fading",
};

const MEMORY_COLOUR: Record<KotodamaMemoryState, string> = {
  radiant: "#FFE08A",
  bright:  "#F7A8C4",
  dazed:   "#7FC4E0",
  sleepy:  "#C9B8F0",
  fading:  "#A9A3B8",
};

interface Props {
  pool: VocabEntry[];
  onClose: () => void;
}

export function DexScreen({ pool, onClose }: Props) {
  const l1 = usePlayerStore((s) => s.locale.l1);
  const [entries, setEntries] = useState<DexEntry[]>([]);
  const [selected, setSelected] = useState<DexEntry | null>(null);
  const [filterState, setFilterState] = useState<FilterState>("all");
  const [filterMemory, setFilterMemory] = useState<FilterMemory>("all");

  const loadEntries = useCallback(async () => {
    const cards = await db.srsCards.toArray();
    const cardMap = new Map(cards.map((c) => [c.vocabId, c]));
    const now = Date.now();

    const result: DexEntry[] = pool.map((vocab) => {
      const card = cardMap.get(vocab.id);
      return {
        vocab,
        caught: !!card,
        memoryState: card ? getMemoryState(card, now) : null,
      };
    });
    setEntries(result);
  }, [pool]);

  useEffect(() => { void loadEntries(); }, [loadEntries]);

  const filtered = entries.filter((e) => {
    if (filterState === "caught"   && !e.caught) return false;
    if (filterState === "uncaught" && e.caught)  return false;
    if (filterMemory !== "all" && e.memoryState !== filterMemory) return false;
    return true;
  });

  const caughtCount = entries.filter((e) => e.caught).length;
  const pct = entries.length ? Math.round((caughtCount / entries.length) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 z-40 flex flex-col bg-[#FFF0F5] overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b-[3px] border-[#4A3F55] bg-[#FFD9E8] px-4 py-3">
        <button onClick={onClose} className="text-[#4A3F55] text-[20px] leading-none">←</button>
        <div>
          <p className="text-[14px] font-semibold text-[#4A3F55]" style={{ fontFamily: "var(--font-jp)" }}>
            ことだまずかん
          </p>
          <p className="text-[9px] text-[#6B5F78]">Kotodama Dex</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-[11px] font-semibold text-[#4A3F55]">{caughtCount} / {entries.length}</p>
          <p className="text-[9px] text-[#9188A0]">{pct}% complete</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto px-3 py-2 text-[9px]">
        {(["all", "caught", "uncaught"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilterState(f)}
            className="shrink-0 rounded-full border-2 px-3 py-1 transition-colors"
            style={{
              borderColor: "#4A3F55",
              background: filterState === f ? "#4A3F55" : "#FFF6E5",
              color: filterState === f ? "#FFF6E5" : "#4A3F55",
            }}
          >
            {f}
          </button>
        ))}
        <div className="mx-1 w-px bg-[#9188A0]" />
        {(["all", "radiant", "bright", "dazed", "sleepy", "fading"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilterMemory(f)}
            className="shrink-0 rounded-full border-2 px-3 py-1 transition-colors"
            style={{
              borderColor: "#4A3F55",
              background: filterMemory === f ? "#4A3F55" : "#FFF6E5",
              color: filterMemory === f ? "#FFF6E5" : "#4A3F55",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        <div className="grid grid-cols-3 gap-2">
          {filtered.map((e) => (
            <button
              key={e.vocab.id}
              onClick={() => setSelected(e)}
              className="rounded-2xl border-2 border-[#4A3F55] p-2 text-left transition-transform active:scale-95"
              style={{ background: e.caught ? ELEMENT_COLOUR[e.vocab.element] + "44" : "#D8D4E044" }}
            >
              <div
                className="mx-auto mb-1 h-8 w-8 rounded-xl border-2 border-[#4A3F55] flex items-center justify-center"
                style={{ background: e.caught ? ELEMENT_COLOUR[e.vocab.element] : "#A9A3B8" }}
              >
                <span className="text-[16px]" style={{ fontFamily: "var(--font-jp)" }}>
                  {e.caught ? e.vocab.written : "?"}
                </span>
              </div>
              <p className="text-center text-[8px] text-[#4A3F55] font-semibold">
                {e.caught ? e.vocab.kotodama.name : "???"}
              </p>
              {e.memoryState && (
                <p className="text-center text-[7px]" style={{ color: MEMORY_COLOUR[e.memoryState] }}>
                  {MEMORY_LABEL[e.memoryState]}
                </p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Detail panel */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute inset-x-0 bottom-0 rounded-t-3xl border-t-[3px] border-[#4A3F55] bg-[#FFF6E5] p-4"
          >
            <button
              onClick={() => setSelected(null)}
              className="absolute right-4 top-4 text-[#9188A0] text-[18px] leading-none"
            >
              ×
            </button>

            <div className="flex gap-3">
              <div
                className="h-14 w-14 shrink-0 rounded-2xl border-2 border-[#4A3F55] flex items-center justify-center"
                style={{ background: ELEMENT_COLOUR[selected.vocab.element] }}
              >
                <span className="text-[28px]" style={{ fontFamily: "var(--font-jp)" }}>
                  {selected.vocab.written}
                </span>
              </div>
              <div>
                <p className="text-[13px] font-semibold text-[#4A3F55]">{selected.vocab.kotodama.name}</p>
                <p className="text-[11px] text-[#6B5F78]" style={{ fontFamily: "var(--font-jp)" }}>
                  {selected.vocab.written} — {selected.vocab.reading}
                </p>
                <p className="text-[10px] text-[#9188A0]">
                  {selected.vocab.meaning[l1] ?? selected.vocab.meaning["en"]}
                </p>
              </div>
            </div>

            {selected.memoryState && (
              <p className="mt-2 text-[10px]" style={{ color: MEMORY_COLOUR[selected.memoryState] }}>
                {MEMORY_LABEL[selected.memoryState]}
              </p>
            )}

            <p className="mt-2 text-[9px] text-[#9188A0] leading-relaxed">
              {selected.vocab.kotodama.description["en"]}
            </p>

            {selected.vocab.mnemonic?.["en"] && (
              <p className="mt-2 text-[9px] text-[#6B5F78] italic leading-relaxed">
                💡 {selected.vocab.mnemonic["en"]}
              </p>
            )}

            <div className="mt-2">
              <p className="text-[8px] text-[#9188A0]">Habitat:</p>
              <div className="mt-0.5 flex flex-wrap gap-1">
                {selected.vocab.kotodama.habitat.map((h) => (
                  <span
                    key={h}
                    className="rounded-full bg-[#F7A8C4] px-2 py-0.5 text-[7px] text-[#4A3F55]"
                  >
                    {h}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
