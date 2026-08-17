import { Howl } from "howler";
import { eventBus } from "./eventBus";

const BGM_MAP: Record<string, string> = {
  test_map: "main_theme", hanami_academy: "school",
  sakura_station: "station", sakura_path: "sakura_walk",
  shrine: "shrine", shopping_street: "market",
  winter_courtyard: "winter", festival_grounds: "festival", autumn_hill: "autumn",
  tuktuk_terminal: "thai_transit", fresh_market: "thai_market",
  airport: "airport", temple: "thai_temple", pier: "pier",
  old_town: "old_town", rice_field: "rice_field",
  night_market: "night_market", floating_market: "floating_market",
};

const AMBIENT_MAP: Record<string, string> = {
  fresh_market: "market_chatter", shopping_street: "market_chatter",
  night_market: "market_chatter", floating_market: "water_lapping",
  pier: "water_lapping", temple: "temple_bells", shrine: "temple_bells",
  rice_field: "cicadas", autumn_hill: "cicadas", tuktuk_terminal: "traffic",
};

type SfxKey =
  | "battle_hit" | "battle_critical" | "battle_miss" | "battle_combo"
  | "battle_win" | "battle_flee" | "dialogue_advance" | "kotodama_appear"
  | "portal_whoosh" | "fishing_cast" | "fishing_reel" | "fishing_catch"
  | "bargaining_deal" | "bargaining_counter" | "handwriting_correct"
  | "handwriting_wrong" | "wordseg_correct" | "wordseg_wrong"
  | "tuktuk_correct" | "tuktuk_miss";

function src(dir: string, key: string): string {
  return `/assets/audio/${dir}/${key}.mp3`;
}

function makeHowl(path: string, loop: boolean, vol: number): Howl {
  return new Howl({ src: [path], loop, volume: vol, preload: false,
    onloaderror: () => { /* file absent — silently degrade */ } });
}

class AudioSystemImpl {
  private bgmVol = 0.7;
  private sfxVol = 0.8;
  private ambVol = 0.4;
  private voiceVol = 1.0;
  private currentBgm: Howl | null = null;
  private currentAmb: Howl | null = null;
  private sfxCache = new Map<SfxKey, Howl>();
  private lastMapKey = "";

  constructor() {
    eventBus.on("map:change", ({ mapId }) => { this.onMapChange(mapId); });
    eventBus.on("battle:start", () => { this.playSFX("kotodama_appear"); });
    eventBus.on("battle:end", ({ won }) => { this.playSFX(won ? "battle_win" : "battle_flee"); });
    eventBus.on("battle:effect", ({ type }) => {
      const k: SfxKey = type === "critical" ? "battle_critical"
                      : type === "miss"     ? "battle_miss"
                      : type === "combo"    ? "battle_combo" : "battle_hit";
      this.playSFX(k);
    });
  }

  private onMapChange(mapId: string): void {
    if (this.lastMapKey === mapId) return;
    this.lastMapKey = mapId;
    const bgmKey = BGM_MAP[mapId];
    if (bgmKey) this.crossfadeBGM(bgmKey);
    this.swapAmbient(AMBIENT_MAP[mapId] ?? null);
  }

  private crossfadeBGM(key: string): void {
    const prev = this.currentBgm;
    const next = makeHowl(src("bgm", key), true, 0);
    next.play();
    next.fade(0, this.bgmVol, 1500);
    if (prev) {
      prev.fade(this.bgmVol, 0, 1500);
      prev.once("fade", () => { prev.stop(); });
    }
    this.currentBgm = next;
  }

  private swapAmbient(key: string | null): void {
    const prev = this.currentAmb;
    if (prev) { prev.fade(this.ambVol, 0, 800); prev.once("fade", () => { prev.stop(); }); }
    this.currentAmb = null;
    if (!key) return;
    const next = makeHowl(src("ambient", key), true, 0);
    next.play();
    next.fade(0, this.ambVol, 800);
    this.currentAmb = next;
  }

  playSFX(key: SfxKey): void {
    let h = this.sfxCache.get(key);
    if (!h) { h = makeHowl(src("sfx", key), false, this.sfxVol); this.sfxCache.set(key, h); }
    h.play();
  }

  playVoice(vocabId: string, text: string, lang: "ja" | "th"): void {
    const h = makeHowl(src("voice", vocabId), false, this.voiceVol);
    let didPlay = false;
    h.once("play", () => { didPlay = true; });
    h.once("loaderror", () => { if (!didPlay) this.tts(text, lang); });
    h.play();
  }

  private tts(text: string, lang: "ja" | "th"): void {
    if (!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === "ja" ? "ja-JP" : "th-TH";
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  }

  applySettings(bgm: number, sfx: number, amb: number, voice: number): void {
    this.bgmVol = bgm; this.sfxVol = sfx; this.ambVol = amb; this.voiceVol = voice;
    this.currentBgm?.volume(bgm);
    this.currentAmb?.volume(amb);
    this.sfxCache.forEach((h) => h.volume(sfx));
  }
}

export const audioSystem = new AudioSystemImpl();
