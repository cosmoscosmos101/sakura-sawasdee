import { db } from "./db";
import { eventBus } from "../state/eventBus";

/** Fire-and-forget — never throws. */
export async function trackEvent(type: string, data: Record<string, unknown> = {}): Promise<void> {
  try {
    const ts = Date.now();
    await db.analyticsEvents.add({ id: `${ts}-${Math.random().toString(36).slice(2)}`, type, data, ts });
  } catch {
    // IndexedDB write errors should never break gameplay
  }
}

/** Keep the last N events; prune the rest. Call periodically to prevent unbounded growth. */
export async function pruneAnalytics(keepLast = 1000): Promise<void> {
  const all = await db.analyticsEvents.orderBy("ts").reverse().toArray();
  if (all.length <= keepLast) return;
  const stale = all.slice(keepLast).map((e) => e.id);
  await db.analyticsEvents.bulkDelete(stale);
}

const SESSION_END_KEY = "sakura_session_end";

/** Called on beforeunload — writes last-session data to localStorage synchronously. */
export function recordSessionEnd(durationMs: number, mapId: string): void {
  try {
    localStorage.setItem(SESSION_END_KEY, JSON.stringify({ durationMs, mapId, ts: Date.now() }));
  } catch { /* storage full / private mode */ }
}

/** Wire eventBus → analytics. Call once at app startup. */
export function initAnalytics(sessionId: string): void {
  // Flush the previous session's end data written by recordSessionEnd()
  try {
    const raw = localStorage.getItem(SESSION_END_KEY);
    if (raw) {
      const prev = JSON.parse(raw) as { durationMs: number; mapId: string; ts: number };
      void trackEvent("session_end", { durationMs: prev.durationMs, mapId: prev.mapId, ts: prev.ts });
      localStorage.removeItem(SESSION_END_KEY);
    }
  } catch { /* ignore */ }

  void trackEvent("session_start", { sessionId, ts: Date.now() });

  eventBus.on("map:change", ({ mapId }) => { void trackEvent("map_change", { mapId }); });
  eventBus.on("battle:end",  ({ won })    => { void trackEvent(won ? "battle_won" : "battle_lost"); });
  eventBus.on("battle:effect", ({ type }) => { if (type === "miss") void trackEvent("battle_miss"); });

  const minigames = ["fishing:open","bargaining:open","tuktuk:open","handwriting:open","tone_kitchen:open","word_segment:open"] as const;
  for (const ev of minigames) {
    eventBus.on(ev, () => { void trackEvent("minigame_open", { minigame: ev }); });
  }

  // Prune on startup so we don't accumulate forever
  void pruneAnalytics();
}

export interface VocabStats {
  vocabId: string;
  reps: number;
  lapses: number;
  successRate: number; // 0–1
}

/** Per-vocab success rates derived from SRS cards. Used by the balance dashboard. */
export async function getVocabStats(): Promise<VocabStats[]> {
  const cards = await db.srsCards.where("reps").above(0).toArray();
  return cards.map((c) => ({
    vocabId: c.vocabId,
    reps: c.reps,
    lapses: c.lapses,
    successRate: c.reps > 0 ? Math.max(0, (c.reps - c.lapses) / c.reps) : 1,
  }));
}
