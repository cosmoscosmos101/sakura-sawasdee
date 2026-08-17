import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../../data/db";
import { ALL_VOCAB } from "../../content/allVocab";
import { generateQuestion } from "../../learning/questionGenerator";
import { reviewCard } from "../../learning/srs";
import type { SrsCardData } from "../../learning/srs";
import type { VocabEntry } from "../../content/schema";
import type { Question } from "../../learning/questionGenerator";

interface Props {
  onClose: () => void;
}

type FishPhase = "swimming" | "question" | "correct" | "wrong" | "empty";

interface ActiveFish {
  card: SrsCardData;
  vocab: VocabEntry;
}

/**
 * Pier Fishing — the relaxed review mode. No timer. No penalty.
 * Due-review cards surface as fish; tap to answer at your own pace.
 */
export default function FishingScreen({ onClose }: Props) {
  const [fish, setFish] = useState<ActiveFish | null>(null);
  const [phase, setPhase] = useState<FishPhase>("swimming");
  const [question, setQuestion] = useState<Question | null>(null);
  const [caughtCount, setCaughtCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dueQueue, setDueQueue] = useState<ActiveFish[]>([]);

  useEffect(() => {
    const nowMs = Date.now();
    void db.srsCards.toArray().then((cards) => {
      const due = cards.filter(
        (c) => (c.state === 2 && c.due <= nowMs) || c.state === 3,
      );
      const queue = due.flatMap((card) => {
        const vocab = ALL_VOCAB.find((v) => v.id === card.vocabId);
        return vocab ? [{ card: card as SrsCardData, vocab }] : [];
      });
      setDueQueue(queue);
      setLoading(false);
      if (queue.length === 0) setPhase("empty");
    });
  }, []);

  const surfaceNextFish = useCallback((queue: ActiveFish[]) => {
    const next = queue[0];
    if (!next) { setPhase("empty"); return; }
    setDueQueue(queue.slice(1));
    setFish(next);
    setQuestion(generateQuestion("meaning_match", next.vocab, ALL_VOCAB, "th"));
    setPhase("swimming");
  }, []);

  useEffect(() => {
    if (!loading && dueQueue.length > 0 && !fish) {
      surfaceNextFish(dueQueue);
    }
  }, [loading, dueQueue, fish, surfaceNextFish]);

  const handleTapFish = () => {
    if (phase === "swimming") setPhase("question");
  };

  const handleAnswer = useCallback(async (choiceIdx: number) => {
    if (!fish || !question) return;
    const correct = choiceIdx === question.correctIndex;

    const outcome = correct ? "correct" : "assisted" as const;
    const updated = reviewCard(fish.card, outcome);
    await db.srsCards.put(updated as typeof fish.card);

    if (correct) {
      setPhase("correct");
      setCaughtCount((c) => c + 1);
    } else {
      setPhase("wrong");
    }

    setTimeout(() => {
      setFish(null);
      setDueQueue((q) => {
        surfaceNextFish(q);
        return q;
      });
    }, 1800);
  }, [fish, question, surfaceNextFish]);

  return (
    <div className="pointer-events-auto absolute inset-0 z-20 flex flex-col bg-gradient-to-b from-[#9FD8CE] to-[#C8ECF5]">
      {/* Header */}
      <header className="flex items-center justify-between p-3">
        <div>
          <p className="text-[13px] font-bold text-[#4A3F55]">🎣 Pier Fishing</p>
          <p className="text-[9px] text-[#4A3F55]/70">No timer · No penalty · Just remember</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-lg border border-[#4A3F55]/30 bg-[#FFF6E5]/80 px-2 py-0.5 text-[10px] font-semibold text-[#4A3F55]">
            🐟 {caughtCount} caught
          </span>
          <button
            onClick={onClose}
            className="rounded-lg border border-[#4A3F55] bg-[#FFF6E5] px-2 py-0.5 text-[10px] text-[#4A3F55]"
          >
            leave
          </button>
        </div>
      </header>

      {/* Pond */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-[#7FC4E0]/40"
            style={{ width: 60 + i * 40, height: 60 + i * 40 }}
            animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 3 + i, repeat: Infinity, delay: i * 1.2 }}
          />
        ))}

        <AnimatePresence>
          {fish && phase === "swimming" && (
            <motion.button
              key={fish.vocab.id + "-swim"}
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: [0, -8, 0], opacity: 1 }}
              transition={{
                y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                opacity: { duration: 0.4 },
              }}
              onClick={handleTapFish}
              className="flex flex-col items-center gap-1"
            >
              <span className="text-4xl">🐟</span>
              <span className="rounded-full border border-[#4A3F55]/30 bg-[#FFF6E5]/90 px-2 py-0.5 font-[IBMPlexSansThai] text-[14px] font-bold text-[#4A3F55]">
                {fish.vocab.written}
              </span>
              <span className="text-[8px] text-[#4A3F55]/60">tap to catch</span>
            </motion.button>
          )}

          {phase === "correct" && (
            <motion.div
              key="correct"
              initial={{ y: 0, opacity: 1 }}
              animate={{ y: -60, opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="flex flex-col items-center gap-1"
            >
              <span className="text-4xl">✨</span>
              <span className="text-[12px] font-bold text-[#4A3F55]">Remembered!</span>
            </motion.div>
          )}

          {phase === "wrong" && (
            <motion.div
              key="wrong"
              initial={{ y: 0, opacity: 1 }}
              animate={{ y: 30, opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeIn" }}
              className="flex flex-col items-center gap-1"
            >
              <span className="text-4xl">💫</span>
              <span className="text-[12px] font-bold text-[#4A3F55]">Slipped away…</span>
            </motion.div>
          )}

          {phase === "empty" && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-2 text-center"
            >
              <span className="text-4xl">🌊</span>
              <p className="text-[13px] font-bold text-[#4A3F55]">Pond is peaceful</p>
              <p className="text-[10px] text-[#4A3F55]/70">No words need review right now.</p>
              <p className="text-[10px] text-[#4A3F55]/70">Explore a little, then come back!</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Question card slides up on tap */}
      <AnimatePresence>
        {phase === "question" && question && fish && (
          <motion.div
            key="question"
            initial={{ y: 200 }}
            animate={{ y: 0 }}
            exit={{ y: 200 }}
            transition={{ type: "spring", stiffness: 200, damping: 22 }}
            className="rounded-t-2xl border-t-2 border-l-2 border-r-2 border-[#4A3F55] bg-[#FFF6E5] p-4 shadow-xl"
          >
            <p className="mb-1 text-center text-[10px] text-[#6B5F78]">
              What does this mean?
            </p>
            <p className="mb-3 text-center font-[IBMPlexSansThai] text-[22px] font-bold text-[#4A3F55]">
              {question.prompt}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {question.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => void handleAnswer(i)}
                  className="rounded-xl border-2 border-[#4A3F55] bg-[#FFD9E8] py-2 text-[11px] font-semibold text-[#4A3F55] active:scale-95"
                >
                  {opt.text}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-[12px] text-[#4A3F55]">Checking the pond…</p>
        </div>
      )}
    </div>
  );
}
