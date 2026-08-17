import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { eventBus } from "../state/eventBus";
import { audioSystem } from "../state/AudioSystem";
import { BattleOverlay } from "./battle/BattleOverlay";
import { DexScreen } from "./screens/DexScreen";
import { StreakTree } from "./screens/StreakTree";
import { OmikujiScreen } from "./screens/OmikujiScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { RoomScreen } from "./screens/RoomScreen";
import { AlbumScreen } from "./screens/AlbumScreen";
import { StatsScreen } from "./screens/StatsScreen";
import { AnalyticsDashboard } from "./screens/AnalyticsDashboard";
import { ProfilePanel } from "./screens/ProfilePanel";
import { BugReportButton } from "./components/BugReportButton";
import ToneKitchenScreen from "./screens/ToneKitchenScreen";
import FishingScreen from "./screens/FishingScreen";
import WordSegmentScreen from "./screens/WordSegmentScreen";
import BargainingScreen from "./screens/BargainingScreen";
import TuktukScreen from "./screens/TuktukScreen";
import HandwritingScreen from "./screens/HandwritingScreen";
import { useBattleStore, type BossGimmick } from "../state/battleStore";
import { db, loadSettings } from "../data/db";
import { ALL_VOCAB } from "../content/allVocab";

type Panel = "dex" | "streak" | "omikuji" | "settings" | "room" | "album" | "stats" | "analytics"
  | "tone_kitchen" | "fishing" | "word_segment" | "bargaining" | "tuktuk" | "handwriting"
  | "profile" | null;

interface DueNotif { due: number; lapsed: number; newCards: number }

function buildNotifMessage({ due, lapsed, newCards }: DueNotif): string | null {
  if (lapsed > 0) return `🌫️ The fog has taken ${lapsed} Kotodama! Hurry!`;
  if (due > 0) return `💤 ${due} Kotodama are resting in the garden`;
  if (newCards > 0) return `✨ ${newCards} wild Kotodama have appeared!`;
  return null;
}

const HUD_BTN = "rounded-xl border-2 border-[#4A3F55] px-2.5 py-1.5 text-[11px] font-semibold text-[#4A3F55] shadow-sm";

export function UIOverlay() {
  const [booted, setBooted] = useState(false);
  const [mapId, setMapId] = useState<string>("");
  const [panel, setPanel] = useState<Panel>(null);
  const [dueNotif, setDueNotif] = useState<DueNotif>({ due: 0, lapsed: 0, newCards: 0 });
  const [wordSegLocation, setWordSegLocation] = useState<string>("pier");
  const battlePhase = useBattleStore((s) => s.phase);
  const startBattle = useBattleStore((s) => s.startBattle);
  const inBattle = battlePhase !== "idle";

  // Boot AudioSystem and apply persisted settings on first render
  useEffect(() => {
    void loadSettings().then((s) => {
      audioSystem.applySettings(s.bgmVolume, s.sfxVolume, s.ambientVolume, s.voiceVolume);
      document.documentElement.setAttribute("data-font-size", s.fontSize);
      document.documentElement.setAttribute("data-colorblind", String(s.colorblind));
    });
  }, []);

  useEffect(() => {
    const offBoot = eventBus.on("boot:complete", () => setBooted(true));
    const offMap  = eventBus.on("map:change", ({ mapId: id }) => setMapId(id));
    const offToneKitchen  = eventBus.on("tone_kitchen:open",  () => setPanel("tone_kitchen"));
    const offFishing      = eventBus.on("fishing:open",       () => setPanel("fishing"));
    const offBargaining   = eventBus.on("bargaining:open",    () => setPanel("bargaining"));
    const offTuktuk       = eventBus.on("tuktuk:open",        () => setPanel("tuktuk"));
    const offHandwriting  = eventBus.on("handwriting:open",   () => setPanel("handwriting"));
    const offWordSeg = eventBus.on("word_segment:open", ({ location }) => {
      setWordSegLocation(location);
      setPanel("word_segment");
    });
    const offBattleStart = eventBus.on("battle:start", ({ enemyId, bossGimmick, bossMaxHp }) => {
      const gimmick = (bossGimmick ?? null) as BossGimmick | null;
      let pool = ALL_VOCAB;
      if (gimmick === "katakana_only") pool = ALL_VOCAB.filter((v) => v.tags.includes("katakana"));
      else if (gimmick === "counter_only") pool = ALL_VOCAB.filter((v) => v.tags.includes("counter"));
      else if (gimmick === "keigo_only") pool = ALL_VOCAB.filter((v) => v.tags.includes("keigo"));
      startBattle(enemyId, pool, "th", gimmick, bossMaxHp);
    });
    return () => { offBoot(); offMap(); offToneKitchen(); offFishing(); offWordSeg(); offBargaining(); offTuktuk(); offHandwriting(); offBattleStart(); };
  }, [startBattle]);

  useEffect(() => {
    if (!booted) return;
    const nowMs = Date.now();
    void db.srsCards.toArray().then((cards) => {
      setDueNotif({
        due:      cards.filter((c) => c.state === 2 && c.due <= nowMs).length,
        lapsed:   cards.filter((c) => c.state === 3).length,
        newCards: Math.min(cards.filter((c) => c.state === 0).length, 10),
      });
    });
  }, [booted]);

  const notifMessage = buildNotifMessage(dueNotif);
  const close = () => setPanel(null);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between" role="region" aria-label="Game UI">
      <AnimatePresence>
        {inBattle && <BattleOverlay key="battle" />}
      </AnimatePresence>

      {!inBattle && (
        <div className="relative flex flex-col justify-between p-3" style={{ height: "100%" }}>
          <header className="pointer-events-auto flex items-start justify-between">
            <div className="rounded-xl border-2 border-[#4A3F55] bg-[#FFF6E5]/90 px-3 py-1.5 shadow-sm" aria-live="polite">
              <p className="text-[11px] font-semibold leading-none text-[#4A3F55]">🌸 Sakura &amp; Sawasdee</p>
              <p className="mt-1 text-[9px] leading-none text-[#6B5F78]">{booted ? (mapId || "loading") : "Booting…"}</p>
            </div>
            <nav className="flex gap-1.5" aria-label="Game menus">
              <button onClick={() => setPanel("omikuji")}  aria-label="Omikuji fortune" className={`${HUD_BTN} bg-[#FFE08A]/90`}>🎋</button>
              <button onClick={() => setPanel("album")}    aria-label="Sentence album"  className={`${HUD_BTN} bg-[#FFF6E5]/90`}>📝</button>
              <button onClick={() => setPanel("streak")}   aria-label="Streak tree"     className={`${HUD_BTN} bg-[#FFD9E8]/90`}>🌳</button>
              <button onClick={() => setPanel("dex")}      aria-label="Kotodama dex"    className={`${HUD_BTN} bg-[#F7A8C4]/90`}>📖</button>
              <button onClick={() => setPanel("stats")}     aria-label="Progress stats"  className={`${HUD_BTN} bg-[#BDE3FF]/90`}>📊</button>
              <button onClick={() => setPanel("analytics")} aria-label="Balance analytics" className={`${HUD_BTN} bg-[#FFE08A]/90`}>📈</button>
              <button onClick={() => setPanel("room")}     aria-label="My room"         className={`${HUD_BTN} bg-[#C8F2E0]/90`}>🏠</button>
              <button onClick={() => setPanel("profile")}  aria-label="Profile"         className={`${HUD_BTN} bg-[#C9B8F0]/90`}>👤</button>
              <button onClick={() => setPanel("settings")} aria-label="Settings"        className={`${HUD_BTN} bg-[#E0D7FF]/90`}>⚙️</button>
            </nav>
          </header>

          {notifMessage && (
            <div role="status" aria-live="polite"
              className="pointer-events-none absolute bottom-20 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-xl border-2 border-[#4A3F55] bg-[#FFF0F5]/95 px-3 py-1.5 text-[11px] font-medium text-[#4A3F55] shadow-md">
              {notifMessage}
            </div>
          )}

          <div className="pointer-events-auto absolute bottom-2 right-2 z-20">
            <BugReportButton />
          </div>

          <footer className="flex items-end justify-between">
            <div className="rounded-xl border-2 border-[#4A3F55] bg-[#FFF6E5]/90 px-3 py-2 shadow-sm" aria-label="Controls">
              <p className="text-[10px] leading-relaxed text-[#4A3F55]">
                <span className="font-semibold">WASD / arrows</span> move ·{" "}
                <span className="font-semibold">Shift</span> run ·{" "}
                <span className="font-semibold">Space / Z</span> talk
              </p>
              <p className="mt-1 text-[9px] leading-relaxed text-[#6B5F78]">
                Step on a <span className="font-semibold text-[#F7A8C4]">🌸</span> to enter battle
              </p>
            </div>
            <div className="rounded-xl border-2 border-[#4A3F55] bg-[#FFF6E5]/90 px-3 py-2 text-right shadow-sm" aria-label="Current location">
              <p className="mt-1.5 font-[NotoSansJP] text-[12px] leading-none text-[#4A3F55]">はなみがくえん</p>
              <p className="mt-1 font-[IBMPlexSansThai] text-[10px] leading-none text-[#9188A0]">โรงเรียนฮานามิ</p>
            </div>
          </footer>
        </div>
      )}

      <AnimatePresence>
        {panel === "dex"          && <DexScreen       key="dex"          pool={ALL_VOCAB} onClose={close} />}
        {panel === "streak"       && <StreakTree       key="streak"       onClose={close} />}
        {panel === "omikuji"      && <OmikujiScreen    key="omikuji"      onClose={close} />}
        {panel === "settings"     && <SettingsScreen   key="settings"     onClose={close} />}
        {panel === "room"         && <RoomScreen       key="room"         onClose={close} />}
        {panel === "album"        && <AlbumScreen      key="album"        onClose={close} />}
        {panel === "stats"        && <StatsScreen      key="stats"        onClose={close} />}
        {panel === "tone_kitchen" && <ToneKitchenScreen key="tone_kitchen" onClose={close} />}
        {panel === "fishing"      && <FishingScreen    key="fishing"      onClose={close} />}
        {panel === "word_segment" && <WordSegmentScreen key="word_segment" location={wordSegLocation} onClose={close} />}
        {panel === "bargaining"   && <BargainingScreen  key="bargaining"  onClose={close} />}
        {panel === "tuktuk"       && <TuktukScreen     key="tuktuk"       onClose={close} />}
        {panel === "handwriting"  && <HandwritingScreen  key="handwriting"  onClose={close} />}
        {panel === "analytics"    && <AnalyticsDashboard key="analytics"    onClose={close} />}
        {panel === "profile"      && <ProfilePanel       key="profile"      onClose={close} />}
      </AnimatePresence>
    </div>
  );
}
