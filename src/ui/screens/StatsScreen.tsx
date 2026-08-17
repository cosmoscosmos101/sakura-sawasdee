import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { db } from "../../data/db";

interface Stats {
  totalCaught: number;
  learned: number;          // srsCards state >= 2 (review/relearning)
  jaCaught: number;
  thCaught: number;
  streakDays: number;
  sessionCount: number;
}

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-[10px] text-[#6B5F78]">
        <span>{label}</span>
        <span className="tabular-nums font-semibold text-[#4A3F55]">{value}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[#E0D7FF]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export function StatsScreen({ onClose }: { onClose: () => void }) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    void (async () => {
      const [cards, collection, profile] = await Promise.all([
        db.srsCards.toArray(),
        db.kotodamaCollection.toArray(),
        db.playerProfile.get(1),
      ]);
      const jaCaught = collection.filter((c) => c.vocabId.startsWith("ja_") || !c.vocabId.startsWith("th_")).length;
      setStats({
        totalCaught: collection.length,
        learned: cards.filter((c) => c.state >= 2).length,
        jaCaught,
        thCaught: collection.filter((c) => c.vocabId.startsWith("th_")).length,
        streakDays: profile?.streakDays ?? 0,
        sessionCount: profile?.playDates?.length ?? 0,
      });
    })();
  }, []);

  return (
    <motion.div
      initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 320, damping: 34 }}
      className="pointer-events-auto absolute inset-0 z-30 flex flex-col bg-[#FFF6E5] p-4"
      role="dialog" aria-label="Learning statistics"
    >
      <div className="mb-4 flex items-center justify-between">
        <p className="text-lg font-bold text-[#4A3F55]">📊 Progress</p>
        <button
          onClick={onClose}
          aria-label="Close stats"
          className="rounded-xl border-2 border-[#4A3F55] bg-[#F7A8C4] px-3 py-1.5 text-sm font-semibold text-[#4A3F55]"
        >✕</button>
      </div>

      {!stats ? (
        <p className="text-center text-[11px] text-[#9188A0]">Loading…</p>
      ) : (
        <div className="flex flex-col gap-5 overflow-y-auto">
          <section>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#9188A0]">Kotodama</p>
            <div className="flex flex-col gap-3 rounded-xl border-2 border-[#F7A8C4] bg-white/60 px-4 py-4">
              <Bar label="Encountered" value={stats.totalCaught} max={800} color="#F7A8C4" />
              <Bar label="Mastered (SRS)" value={stats.learned} max={stats.totalCaught || 1} color="#C8F2E0" />
              <Bar label="Japanese 🇯🇵" value={stats.jaCaught} max={stats.totalCaught || 1} color="#FFE08A" />
              <Bar label="Thai 🇹🇭" value={stats.thCaught} max={stats.totalCaught || 1} color="#9FD8CE" />
            </div>
          </section>

          <section>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#9188A0]">Journey</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { emoji: "🌸", label: "Day streak", value: stats.streakDays },
                { emoji: "📅", label: "Sessions", value: stats.sessionCount },
              ].map(({ emoji, label, value }) => (
                <div key={label} className="flex flex-col items-center rounded-xl border-2 border-[#FFD9E8] bg-white/60 py-3">
                  <p className="text-[22px]">{emoji}</p>
                  <p className="text-[20px] font-bold text-[#4A3F55]">{value}</p>
                  <p className="text-[9px] text-[#9188A0]">{label}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </motion.div>
  );
}
