import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { loadSettings, saveSettings, type Settings, type FontSize } from "../../data/db";
import { audioSystem } from "../../state/AudioSystem";

type PartialSetting = Partial<Omit<Settings, "id">>;

function VolumeSlider({ label, emoji, value, onChange }: {
  label: string; emoji: string; value: number; onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3" role="group" aria-label={`${label} volume`}>
      <span className="w-6 text-center text-base" aria-hidden>{emoji}</span>
      <span className="w-20 text-xs font-semibold text-[#4A3F55]">{label}</span>
      <input type="range" min="0" max="1" step="0.05" value={value} aria-valuenow={Math.round(value * 100)}
        onChange={(e) => onChange(Number(e.target.value))} className="flex-1 accent-[#F7A8C4]" />
      <span className="w-8 text-right text-xs tabular-nums text-[#9188A0]">{Math.round(value * 100)}</span>
    </div>
  );
}

function Toggle({ label, description, value, onChange }: {
  label: string; description: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <button onClick={() => onChange(!value)} className="flex w-full items-start justify-between gap-4 text-left"
      role="switch" aria-checked={value} aria-label={label}>
      <div>
        <p className="text-sm font-semibold text-[#4A3F55]">{label}</p>
        <p className="text-[11px] leading-relaxed text-[#9188A0]">{description}</p>
      </div>
      <div className="mt-0.5 flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-[#4A3F55] px-0.5 transition-colors"
        style={{ backgroundColor: value ? "#F7A8C4" : "#E0D7FF" }}>
        <div className="h-4 w-4 rounded-full bg-[#4A3F55] transition-transform"
          style={{ transform: value ? "translateX(20px)" : "translateX(0)" }} />
      </div>
    </button>
  );
}

const FONT_OPTIONS: { value: FontSize; label: string }[] = [
  { value: "sm", label: "A" },
  { value: "md", label: "A" },
  { value: "lg", label: "A" },
];

const FONT_SIZES: Record<FontSize, string> = { sm: "text-[9px]", md: "text-[11px]", lg: "text-[13px]" };

export function SettingsScreen({ onClose }: { onClose: () => void }) {
  const [s, setS] = useState<Omit<Settings, "id">>({
    bgmVolume: 0.7, sfxVolume: 0.8, voiceVolume: 1.0, ambientVolume: 0.4,
    showReading: true, showTranslation: true,
    reducedMotion: false, colorblind: false, typewriterEffect: true, fontSize: "md",
  });

  useEffect(() => {
    void loadSettings().then(({ id: _id, ...rest }) => setS(rest));
  }, []);

  async function update(patch: PartialSetting) {
    const next = { ...s, ...patch };
    setS(next);
    await saveSettings(patch);
    audioSystem.applySettings(next.bgmVolume, next.sfxVolume, next.ambientVolume, next.voiceVolume);
    // Propagate font size and colorblind to root
    document.documentElement.setAttribute("data-font-size", next.fontSize);
    document.documentElement.setAttribute("data-colorblind", String(next.colorblind));
  }

  return (
    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 320, damping: 34 }}
      className="pointer-events-auto absolute inset-0 z-30 flex flex-col bg-[#FFF6E5] p-4"
      role="dialog" aria-label="Settings">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-lg font-bold text-[#4A3F55]">⚙️ Settings</p>
        <button onClick={onClose} aria-label="Close settings"
          className="rounded-xl border-2 border-[#4A3F55] bg-[#F7A8C4] px-3 py-1.5 text-sm font-semibold text-[#4A3F55]">✕</button>
      </div>

      <div className="flex flex-col gap-5 overflow-y-auto">
        {/* Audio */}
        <section aria-labelledby="audio-heading">
          <p id="audio-heading" className="mb-3 text-xs font-bold uppercase tracking-widest text-[#9188A0]">Audio</p>
          <div className="flex flex-col gap-3 rounded-xl border-2 border-[#F7A8C4] bg-white/60 px-4 py-4">
            <VolumeSlider label="Music"     emoji="🎵" value={s.bgmVolume}     onChange={(v) => void update({ bgmVolume: v })} />
            <VolumeSlider label="Ambient"   emoji="🌿" value={s.ambientVolume} onChange={(v) => void update({ ambientVolume: v })} />
            <VolumeSlider label="Sound FX"  emoji="🔔" value={s.sfxVolume}     onChange={(v) => void update({ sfxVolume: v })} />
            <VolumeSlider label="Voices"    emoji="🗣️" value={s.voiceVolume}   onChange={(v) => void update({ voiceVolume: v })} />
          </div>
        </section>

        {/* Font size */}
        <section aria-labelledby="font-heading">
          <p id="font-heading" className="mb-3 text-xs font-bold uppercase tracking-widest text-[#9188A0]">Text size</p>
          <div className="flex gap-2 rounded-xl border-2 border-[#FFD9E8] bg-white/60 px-4 py-3" role="radiogroup" aria-label="Font size">
            {FONT_OPTIONS.map((opt) => (
              <button key={opt.value} onClick={() => void update({ fontSize: opt.value })}
                role="radio" aria-checked={s.fontSize === opt.value}
                className={`${FONT_SIZES[opt.value]} flex-1 rounded-lg border-2 py-1.5 font-semibold transition-colors`}
                style={{ borderColor: s.fontSize === opt.value ? "#4A3F55" : "#9188A0",
                  backgroundColor: s.fontSize === opt.value ? "#F7A8C4" : "transparent",
                  color: "#4A3F55" }}>
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        {/* Language display */}
        <section aria-labelledby="lang-heading">
          <p id="lang-heading" className="mb-3 text-xs font-bold uppercase tracking-widest text-[#9188A0]">Language display</p>
          <div className="flex flex-col gap-4 rounded-xl border-2 border-[#FFD9E8] bg-white/60 px-4 py-4">
            <Toggle label="Show reading (furigana / romanisation)"
              description="Displays pronunciation guides above kanji and Thai text"
              value={s.showReading} onChange={(v) => void update({ showReading: v })} />
            <div className="h-px bg-[#F7A8C4]/40" />
            <Toggle label="Show translation"
              description="Shows the L1 meaning during questions and dialogue"
              value={s.showTranslation} onChange={(v) => void update({ showTranslation: v })} />
            <div className="h-px bg-[#F7A8C4]/40" />
            <Toggle label="Typewriter effect"
              description="Animates text appearing letter by letter in dialogue"
              value={s.typewriterEffect} onChange={(v) => void update({ typewriterEffect: v })} />
          </div>
        </section>

        {/* Accessibility */}
        <section aria-labelledby="a11y-heading">
          <p id="a11y-heading" className="mb-3 text-xs font-bold uppercase tracking-widest text-[#9188A0]">Accessibility</p>
          <div className="flex flex-col gap-4 rounded-xl border-2 border-[#C8F2E0] bg-white/60 px-4 py-4">
            <Toggle label="Reduce motion"
              description="Turns off particles and screen-shake animations"
              value={s.reducedMotion} onChange={(v) => void update({ reducedMotion: v })} />
            <div className="h-px bg-[#C8F2E0]/60" />
            <Toggle label="Colourblind mode"
              description="Adds shape indicators alongside colour cues for Kotodama elements"
              value={s.colorblind} onChange={(v) => void update({ colorblind: v })} />
          </div>
        </section>

        <p className="text-center text-[10px] text-[#9188A0]">Sakura &amp; Sawasdee v0.1.0 · Save: IndexedDB</p>
      </div>
    </motion.div>
  );
}
