import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Cutscene } from "../../content/cutscenes";

interface Props {
  cutscene: Cutscene;
  typewriter?: boolean;
  onComplete: () => void;
}

function TypewriterText({ text, active }: { text: string; active: boolean }) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    if (!active) { setDisplayed(text); return; }
    setDisplayed("");
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, 22);
    return () => clearInterval(id);
  }, [text, active]);

  return (
    <p className="whitespace-pre-line text-center text-[11px] leading-relaxed text-[#6B5F78]">
      {displayed}
    </p>
  );
}

export function CutsceneScreen({ cutscene, typewriter = true, onComplete }: Props) {
  const [idx, setIdx] = useState(0);
  const slide = cutscene.slides[idx];

  const advance = useCallback(() => {
    if (idx < cutscene.slides.length - 1) setIdx((i) => i + 1);
    else onComplete();
  }, [idx, cutscene.slides.length, onComplete]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); advance(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance]);

  if (!slide) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="pointer-events-auto absolute inset-0 z-50 flex flex-col items-center justify-center p-8 select-none"
      style={{ background: slide.bg }}
      onClick={advance}
      role="dialog"
      aria-label={`Cutscene: ${slide.title}`}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3 }}
          className="flex max-w-[280px] flex-col items-center gap-4"
        >
          <p className="text-[52px] leading-none" role="img" aria-label={slide.title}>
            {slide.illustration}
          </p>
          <p className="text-center text-[15px] font-bold text-[#4A3F55]">{slide.title}</p>
          <TypewriterText text={slide.body} active={typewriter} />
        </motion.div>
      </AnimatePresence>

      {/* Progress dots */}
      <div className="absolute bottom-8 flex gap-2" aria-label="Slide progress">
        {cutscene.slides.map((_, i) => (
          <div
            key={i}
            className="h-1.5 rounded-full transition-all"
            style={{
              width: i === idx ? 16 : 6,
              backgroundColor: i <= idx ? "#4A3F55" : "#9188A0",
              opacity: i <= idx ? 1 : 0.4,
            }}
          />
        ))}
      </div>

      <p className="absolute bottom-4 right-4 text-[9px] text-[#9188A0]">
        Tap or press Space
      </p>
    </motion.div>
  );
}
