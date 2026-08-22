import { useEffect, useRef, useState } from "react";
import { GameCanvas } from "./ui/GameCanvas";
import { UIOverlay }  from "./ui/UIOverlay";
import { startAutosave, loadProfile, saveProfile } from "./data/db";
import { initAnalytics, recordSessionEnd } from "./data/analytics";
import { usePlayerStore, type LocalePair } from "./state/playerStore";
import { useQuestStore } from "./state/questStore";
import { updateStreak, toDateString } from "./learning/streakManager";

async function onSessionStart(): Promise<void> {
  const profile = await loadProfile();
  const nowMs = Date.now();
  const month  = new Date(nowMs).getMonth() + 1;
  const isWinter = month === 12 || month <= 2;
  const update = updateStreak(
    profile?.lastPlayed ?? 0, nowMs,
    profile?.streakDays ?? 0, profile?.winterWraps ?? 0, isWinter,
  );
  const today = toDateString(nowMs);
  const playDates = [...(profile?.playDates ?? [])];
  if (!playDates.includes(today)) playDates.push(today);
  await saveProfile({ streakDays: update.streakDays, winterWraps: update.winterWraps, playDates });
}

const PATHS: Array<{ locale: LocalePair; label: string; sub: string }> = [
  { locale: { l1: "th", l2: "ja" }, label: "THAI  →  JAPANESE", sub: "ภาษาไทย → 日本語" },
  { locale: { l1: "en", l2: "th" }, label: "ENGLISH  →  THAI",  sub: "English → ภาษาไทย" },
];

export default function App() {
  const [started, setStarted] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const cleanupRef = useRef<(() => void) | null>(null);

  async function handleStart() {
    usePlayerStore.getState().setLocale(PATHS[selectedIdx]!.locale);
    setStarted(true);
    await onSessionStart();
    void useQuestStore.getState().init();
    initAnalytics(crypto.randomUUID());
    const sessionStart = Date.now();
    const handleUnload = () => {
      const { currentMapId } = usePlayerStore.getState();
      recordSessionEnd(Date.now() - sessionStart, currentMapId);
    };
    window.addEventListener("beforeunload", handleUnload);
    cleanupRef.current = startAutosave(() => {
      const { playerCol, playerRow, currentMapId } = usePlayerStore.getState();
      return { mapId: currentMapId, playerCol, playerRow, kotodamaDefeated: [], tutorialStep: 0 };
    });
  }

  useEffect(() => () => { cleanupRef.current?.(); }, []);

  return (
    <main style={{ position: "relative", width: "100dvw", height: "100dvh", overflow: "hidden", background: "#0d0d1a" }}>
      <GameCanvas />
      <UIOverlay />

      {!started && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 100,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          background: "#0d0d1a", fontFamily: "'Chrono', monospace", color: "#e8dcc8",
        }}>
          <div style={{ fontSize: 28, color: "#ffd700", letterSpacing: 3, marginBottom: 6 }}>
            CHRONO KOTODAMA
          </div>
          <div style={{ fontSize: 10, color: "#6B5F78", marginBottom: 40, letterSpacing: 2 }}>
            ✦ BATTLE THE SILENCE ✦
          </div>

          {/* Language path selector */}
          <div style={{ marginBottom: 36, display: "flex", flexDirection: "column", gap: 10 }}>
            {PATHS.map((path, i) => (
              <button
                key={path.label}
                onClick={() => setSelectedIdx(i)}
                style={{
                  background: "transparent",
                  border: `1px solid ${selectedIdx === i ? "#4a6fa5" : "#2a2a3a"}`,
                  borderRadius: 3,
                  color: selectedIdx === i ? "#e8dcc8" : "#6B5F78",
                  fontFamily: "inherit",
                  fontSize: 12,
                  letterSpacing: 2,
                  padding: "8px 28px",
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  transition: "border-color 0.1s, color 0.1s",
                }}
              >
                <span style={{ color: selectedIdx === i ? "#ffd700" : "transparent", fontSize: 10 }}>►</span>
                <span>
                  <div>{path.label}</div>
                  <div style={{ fontSize: 9, color: selectedIdx === i ? "#9188a0" : "#3a3a4a", marginTop: 2 }}>{path.sub}</div>
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={() => void handleStart()}
            style={{
              background: "transparent",
              border: "2px solid #4a6fa5",
              borderRadius: 4,
              color: "#e8dcc8",
              fontSize: 13,
              padding: "10px 36px",
              cursor: "pointer",
              fontFamily: "inherit",
              letterSpacing: 2,
            }}
          >
            NEW GAME
          </button>
        </div>
      )}
    </main>
  );
}
