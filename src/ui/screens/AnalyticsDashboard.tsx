import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { db } from "../../data/db";
import { getVocabStats, type VocabStats } from "../../data/analytics";
import { ALL_VOCAB } from "../../content/allVocab";

interface Summary {
  sessionCount: number;
  mapChanges: number;
  battlesWon: number;
  battlesLost: number;
  minigameOpens: number;
  avgSessionMins: number;  // average session duration in minutes (0 if no data)
  topQuitMap: string | null;
  hardWords: VocabStats[];  // success rate < 0.60
  easyWords: VocabStats[];  // success rate > 0.98 with ≥ 5 reps
}

const VOCAB_MAP = new Map(ALL_VOCAB.map((v) => [v.id, v]));

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className="rounded-full px-2 py-0.5 text-[9px] font-semibold text-[#4A3F55]"
      style={{ backgroundColor: color }}>{children}</span>
  );
}

export function AnalyticsDashboard({ onClose }: { onClose: () => void }) {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    void (async () => {
      const [events, vocabStats] = await Promise.all([
        db.analyticsEvents.orderBy("ts").reverse().limit(2000).toArray(),
        getVocabStats(),
      ]);
      const count = (type: string) => events.filter((e) => e.type === type).length;
      const maps = new Set(events.filter((e) => e.type === "map_change").map((e) => e.data.mapId));

      const endEvents = events.filter((e) => e.type === "session_end");
      const durations = endEvents
        .map((e) => (typeof e.data.durationMs === "number" ? e.data.durationMs : 0))
        .filter((d) => d > 0);
      const avgSessionMins = durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length / 60_000)
        : 0;

      const quitMapCounts: Record<string, number> = {};
      for (const e of endEvents) {
        const mid = typeof e.data.mapId === "string" ? e.data.mapId : null;
        if (mid) quitMapCounts[mid] = (quitMapCounts[mid] ?? 0) + 1;
      }
      const topQuitMap = Object.entries(quitMapCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? null;

      setSummary({
        sessionCount:   count("session_start"),
        mapChanges:     maps.size,
        battlesWon:     count("battle_won"),
        battlesLost:    count("battle_lost"),
        minigameOpens:  count("minigame_open"),
        avgSessionMins,
        topQuitMap,
        hardWords: vocabStats.filter((v) => v.reps >= 3 && v.successRate < 0.60)
          .sort((a, b) => a.successRate - b.successRate).slice(0, 8),
        easyWords: vocabStats.filter((v) => v.reps >= 5 && v.successRate > 0.98)
          .sort((a, b) => b.reps - a.reps).slice(0, 8),
      });
    })();
  }, []);

  return (
    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 320, damping: 34 }}
      className="pointer-events-auto absolute inset-0 z-30 flex flex-col bg-[#FFF6E5] p-4"
      role="dialog" aria-label="Analytics dashboard">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-lg font-bold text-[#4A3F55]">📈 Balance</p>
        <button onClick={onClose} aria-label="Close analytics"
          className="rounded-xl border-2 border-[#4A3F55] bg-[#F7A8C4] px-3 py-1.5 text-sm font-semibold text-[#4A3F55]">✕</button>
      </div>

      {!summary ? (
        <p className="text-center text-[11px] text-[#9188A0]">Loading…</p>
      ) : (
        <div className="flex flex-col gap-5 overflow-y-auto">
          {/* Session summary */}
          <section>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#9188A0]">Sessions</p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Sessions",   value: summary.sessionCount,  bg: "#FFD9E8" },
                { label: "Battles won", value: summary.battlesWon,   bg: "#C8F2E0" },
                { label: "Minigames",  value: summary.minigameOpens, bg: "#BDE3FF" },
                {
                  label: "Avg session",
                  value: summary.avgSessionMins > 0 ? `${summary.avgSessionMins}m` : "—",
                  bg: "#FFE08A",
                },
              ].map(({ label, value, bg }) => (
                <div key={label} className="flex flex-col items-center rounded-xl border-2 border-[#E0D7FF] py-2"
                  style={{ backgroundColor: bg + "60" }}>
                  <p className="text-[18px] font-bold text-[#4A3F55]">{value}</p>
                  <p className="text-[8px] text-[#9188A0]">{label}</p>
                </div>
              ))}
            </div>
            {summary.topQuitMap && (
              <p className="mt-2 text-[9px] text-[#9188A0]">
                Most common exit: <span className="font-semibold text-[#4A3F55]">{summary.topQuitMap}</span>
              </p>
            )}
          </section>

          {/* Hard words — success rate < 60% */}
          {summary.hardWords.length > 0 && (
            <section>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#9188A0]">
                Needs attention <span className="ml-1 text-[#D97FA5]">&lt;60% correct</span>
              </p>
              <div className="flex flex-col gap-1.5">
                {summary.hardWords.map((v) => {
                  const entry = VOCAB_MAP.get(v.vocabId);
                  return (
                    <div key={v.vocabId} className="flex items-center justify-between rounded-lg bg-[#FFD9E8]/50 px-3 py-1.5">
                      <div>
                        <span className="text-[12px] font-semibold text-[#4A3F55]">{entry?.written ?? v.vocabId}</span>
                        <span className="ml-2 text-[10px] text-[#9188A0]">{entry?.meaning.en}</span>
                      </div>
                      <Badge color="#F7A8C4">{Math.round(v.successRate * 100)}%</Badge>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Easy words — success rate > 98% */}
          {summary.easyWords.length > 0 && (
            <section>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#9188A0]">
                Too easy <span className="ml-1 text-[#4E7D5E]">&gt;98% correct</span>
              </p>
              <div className="flex flex-col gap-1.5">
                {summary.easyWords.map((v) => {
                  const entry = VOCAB_MAP.get(v.vocabId);
                  return (
                    <div key={v.vocabId} className="flex items-center justify-between rounded-lg bg-[#C8F2E0]/50 px-3 py-1.5">
                      <div>
                        <span className="text-[12px] font-semibold text-[#4A3F55]">{entry?.written ?? v.vocabId}</span>
                        <span className="ml-2 text-[10px] text-[#9188A0]">{entry?.meaning.en}</span>
                      </div>
                      <Badge color="#C8F2E0">{v.reps} reps</Badge>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {summary.hardWords.length === 0 && summary.easyWords.length === 0 && (
            <p className="text-center text-[10px] text-[#9188A0]">
              Play more to see balance data — needs at least 3 reps per word.
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}
