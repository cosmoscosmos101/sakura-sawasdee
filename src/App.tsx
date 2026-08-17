import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { GameCanvas } from "./ui/GameCanvas";
import { UIOverlay } from "./ui/UIOverlay";
import { StartScreen } from "./ui/screens/StartScreen";
import { CutsceneScreen } from "./ui/screens/CutsceneScreen";
import { AuthScreen } from "./ui/screens/AuthScreen";
import { startAutosave, loadProfile, saveProfile, loadSettings } from "./data/db";
import { initAnalytics, recordSessionEnd } from "./data/analytics";
import { syncSrsCards } from "./data/cloudSync";
import { usePlayerStore } from "./state/playerStore";
import { updateStreak, toDateString } from "./learning/streakManager";
import { CUTSCENES } from "./content/cutscenes";

const AUTH_SEEN_KEY = "sakura_auth_seen";

async function onSessionStart(): Promise<void> {
  const profile = await loadProfile();
  const nowMs = Date.now();
  const month = new Date(nowMs).getMonth() + 1;
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

export default function App() {
  const [started, setStarted] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [typewriter, setTypewriter] = useState(true);
  const cleanupRef = useRef<(() => void) | null>(null);

  function handleStart() {
    if (!localStorage.getItem(AUTH_SEEN_KEY)) {
      setShowAuth(true);
    } else {
      setStarted(true);
      setShowIntro(true);
    }
    void loadSettings().then((s) => setTypewriter(s.typewriterEffect));
  }

  function handleAuthComplete() {
    localStorage.setItem(AUTH_SEEN_KEY, "1");
    setShowAuth(false);
    setStarted(true);
    setShowIntro(true);
  }

  useEffect(() => {
    if (!started) return;
    void onSessionStart();
    void syncSrsCards();
    initAnalytics(crypto.randomUUID());
    const sessionStartTs = Date.now();
    const handleUnload = () => {
      const { currentMapId } = usePlayerStore.getState();
      recordSessionEnd(Date.now() - sessionStartTs, currentMapId);
    };
    window.addEventListener("beforeunload", handleUnload);
    cleanupRef.current = startAutosave(() => {
      const { playerCol, playerRow, currentMapId } = usePlayerStore.getState();
      return { mapId: currentMapId, playerCol, playerRow, kotodamaDefeated: [], tutorialStep: 0 };
    });
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      cleanupRef.current?.();
    };
  }, [started]);

  return (
    <main className="relative h-dvh w-dvw overflow-hidden bg-[#4A3F55]">
      <GameCanvas />
      <UIOverlay />

      <AnimatePresence>
        {!started && !showAuth && <StartScreen key="start" onStart={handleStart} />}
      </AnimatePresence>

      <AnimatePresence>
        {showAuth && <AuthScreen key="auth" onComplete={handleAuthComplete} />}
      </AnimatePresence>

      <AnimatePresence>
        {showIntro && (
          <CutsceneScreen
            key="intro"
            cutscene={CUTSCENES.intro!}
            typewriter={typewriter}
            onComplete={() => setShowIntro(false)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
