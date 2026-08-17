import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { db, type AlbumEntry } from "../../data/db";

const MULTIPLIER_STAR: Record<number, string> = {
  1.5: "★★",
  2.0: "★★★",
  2.8: "★★★★",
  3.5: "★★★★★",
  4.5: "★★★★★★",
};

function multiplierStars(m: number): string {
  for (const [val, stars] of Object.entries(MULTIPLIER_STAR)) {
    if (m <= Number(val)) return stars;
  }
  return "★★★★★★";
}

function formatDate(ms: number): string {
  const d = new Date(ms);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function groupByDay(entries: AlbumEntry[]): Map<string, AlbumEntry[]> {
  const map = new Map<string, AlbumEntry[]>();
  for (const e of entries) {
    const day = new Date(e.createdAt).toDateString();
    const group = map.get(day) ?? [];
    group.push(e);
    map.set(day, group);
  }
  return map;
}

function EntryCard({ entry }: { entry: AlbumEntry }) {
  const stars = multiplierStars(entry.multiplier);
  const hue = (entry.comboLength * 37) % 360;
  const bg = `hsl(${hue}, 60%, 95%)`;
  const border = `hsl(${hue}, 55%, 78%)`;

  return (
    <div
      className="rounded-xl border-2 px-4 py-3 shadow-sm"
      style={{ backgroundColor: bg, borderColor: border }}
    >
      {/* Sentence */}
      <p className="font-[NotoSansJP] text-xl font-bold leading-snug text-[#4A3F55]">
        {entry.sentence}
      </p>
      {/* Meta row */}
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#F7A8C4]">{stars}</span>
          <span className="text-[10px] text-[#9188A0]">
            ×{entry.multiplier} · {entry.comboLength} words
          </span>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-[#9188A0]">{entry.mapId}</p>
          <p className="text-[9px] text-[#9188A0]">{formatDate(entry.createdAt)}</p>
        </div>
      </div>
    </div>
  );
}

export function AlbumScreen({ onClose }: { onClose: () => void }) {
  const [entries, setEntries] = useState<AlbumEntry[]>([]);

  useEffect(() => {
    void db.sentenceAlbum
      .orderBy("createdAt")
      .reverse()
      .toArray()
      .then(setEntries);
  }, []);

  const groups = groupByDay(entries);
  const isEmpty = entries.length === 0;

  return (
    <motion.div
      initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 320, damping: 34 }}
      className="pointer-events-auto absolute inset-0 z-30 flex flex-col bg-[#FFF6E5] p-4"
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-lg font-bold text-[#4A3F55]">📝 Sentence Album</p>
          <p className="text-xs text-[#9188A0]">
            {isEmpty ? "Your journal is empty" : `${entries.length} sentence${entries.length !== 1 ? "s" : ""} saved`}
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-xl border-2 border-[#4A3F55] bg-[#F7A8C4] px-3 py-1.5 text-sm font-semibold text-[#4A3F55]"
        >✕</button>
      </div>

      {/* Empty state */}
      {isEmpty && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <div className="text-5xl">📖</div>
          <div className="rounded-xl border-2 border-[#FFD9E8] bg-white/60 px-6 py-4 max-w-xs">
            <p className="text-sm font-semibold text-[#4A3F55]">No sentences yet</p>
            <p className="mt-1 text-xs leading-relaxed text-[#9188A0]">
              Build a Sentence Combo in battle — chain 2+ Kotodama in a grammatically correct order and your sentence is saved here forever.
            </p>
          </div>
        </div>
      )}

      {/* Grouped list */}
      {!isEmpty && (
        <div className="flex flex-col gap-5 overflow-y-auto">
          {[...groups.entries()].map(([day, dayEntries]) => (
            <section key={day}>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#9188A0]">
                {day}
              </p>
              <div className="flex flex-col gap-2">
                {dayEntries.map((e) => (
                  <EntryCard key={e.id} entry={e} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </motion.div>
  );
}
