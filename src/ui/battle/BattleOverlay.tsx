import { AnimatePresence, motion } from "framer-motion";
import { useBattleStore } from "../../state/battleStore";
import { usePlayerStore } from "../../state/playerStore";
import type { ComboResult } from "../../learning/comboValidator";
import { BattleHUD } from "./BattleHUD";
import { QuestionCard } from "./QuestionCard";
import { ComboBar } from "./ComboBar";
import { CommandMenu } from "./CommandMenu";

/**
 * Full-screen React overlay that sits on top of BattleScene (Phaser).
 *
 * All battle interaction happens here. Reads from battleStore and
 * dispatches actions back to it. Never touches Phaser directly.
 */
export function BattleOverlay() {
  const battle = useBattleStore();
  const { locale } = usePlayerStore();

  const { phase, enemyHp, enemyMaxHp, playerHp, playerMaxHp, party, chain, currentQuestion, lastResult, comboResult } = battle;

  if (phase === "idle") return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between">
      {/* Top: HP bars */}
      <BattleHUD
        enemyHp={enemyHp}
        enemyMaxHp={enemyMaxHp}
        playerHp={playerHp}
        playerMaxHp={playerMaxHp}
        playerL1={locale.l1}
      />

      {/* Middle area: question or result */}
      <div className="flex flex-col items-center gap-2 px-2">
        <AnimatePresence mode="wait">
          {phase === "question" && currentQuestion && (
            <QuestionCard
              key={`${currentQuestion.vocabId}-${currentQuestion.type}`}
              question={currentQuestion}
              onAnswer={(idx, timing) => battle.submitAnswer(idx, timing)}
            />
          )}

          {phase === "result" && lastResult && (
            <ResultCard
              key="result"
              correct={lastResult.correct}
              damage={lastResult.damage}
              tier={lastResult.timingTier}
              playerL1={locale.l1}
              onNext={() => battle.proceedFromResult()}
            />
          )}

          {phase === "combo" && (
            <ComboResultCard
              key="combo"
              comboResult={comboResult}
              playerL1={locale.l1}
              onNext={() => {
                if (enemyHp === 0) battle.endBattle();
                else if (playerHp === 0) useBattleStore.setState({ phase: "defeat" });
                else useBattleStore.setState({ phase: "command", lastResult: null, comboResult: null, chain: [], party: party.map((k) => ({ ...k, sentThisTurn: false })) });
              }}
            />
          )}

          {(phase === "victory" || phase === "defeat") && (
            <EndCard
              key="end"
              won={phase === "victory"}
              playerL1={locale.l1}
              onClose={() => useBattleStore.setState({ phase: "idle" })}
            />
          )}
        </AnimatePresence>

        {/* Combo chain indicator (always visible except idle) */}
        {phase === "command" && <ComboBar chain={chain} comboResult={null} playerL1={locale.l1} />}
      </div>

      {/* Bottom: command menu */}
      {phase === "command" && (
        <CommandMenu
          party={party}
          playerL1={locale.l1}
          chainLength={chain.length}
          onSend={(i) => battle.sendKotodama(i)}
          onCombo={() => battle.executeCombo()}
          onFlee={() => battle.flee()}
        />
      )}
    </div>
  );
}

// ── Locale label tables ──────────────────────────────────────────────────────

const COMBO_RESULT_LABELS: Record<string, { valid: string; invalid: string }> = {
  th: { valid: "ประโยคสมบูรณ์!", invalid: "ลำดับไม่ถูกต้อง" },
  en: { valid: "Sentence Combo!", invalid: "Word order incomplete" },
  ja: { valid: "文章コンボ！", invalid: "語順が不完全" },
};

const END_LABELS: Record<string, { won: string; lost: string }> = {
  th: { won: "ชนะแล้ว! 🌸", lost: "สู้ต่อไป..." },
  en: { won: "Victory! 🌸", lost: "Keep going..." },
  ja: { won: "勝利！ 🌸", lost: "頑張れ..." },
};

// ── Sub-panels ───────────────────────────────────────────────────────────────

function ResultCard({
  correct, damage, tier, playerL1, onNext,
}: {
  correct: boolean;
  damage: number;
  tier: "critical" | "normal" | "slow";
  playerL1: string;
  onNext: () => void;
}) {
  const msg = {
    th: { correct: "ถูกต้อง!", wrong: "ลองอีกครั้ง", critical: "ยอดเยี่ยม!", slow: "ช้าไปนิด" },
    en: { correct: "Correct!", wrong: "Not quite…", critical: "Critical!", slow: "A bit slow" },
    ja: { correct: "正解！", wrong: "もう一度", critical: "完璧！", slow: "少し遅かった" },
  };
  const l = (msg as Record<string, typeof msg["en"]>)[playerL1] ?? msg.en;
  const label = correct ? (tier === "critical" ? l.critical : l.correct) : l.wrong;
  const color = correct ? "#4E7D5E" : "#C9A27E";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.15 }}
      className="pointer-events-auto mx-auto w-full max-w-[300px] cursor-pointer rounded-2xl border-[3px] border-[#4A3F55] bg-[#FFF6E5] px-5 py-4 text-center shadow-lg"
      onClick={onNext}
    >
      <p className="text-[18px] font-semibold" style={{ color }}>{label}</p>
      {damage > 0 && (
        <p className="mt-1 text-[12px] text-[#6B5F78]">
          -{damage} HP
        </p>
      )}
      <p className="mt-2 text-[9px] text-[#9188A0]">tap to continue</p>
    </motion.div>
  );
}

function ComboResultCard({
  comboResult, playerL1, onNext,
}: {
  comboResult: ComboResult | null;
  playerL1: string;
  onNext: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="pointer-events-auto mx-auto w-full max-w-[300px] cursor-pointer rounded-2xl border-[3px] border-[#4A3F55] bg-[#FFF6E5] px-5 py-4 text-center shadow-lg"
      onClick={onNext}
    >
      {comboResult?.valid ? (
        <>
          <p className="text-[16px] font-semibold text-[#4E7D5E]">
            {COMBO_RESULT_LABELS[playerL1]?.valid ?? COMBO_RESULT_LABELS["en"]!.valid}
          </p>
          <p className="mt-1 text-[13px] text-[#6B5F78]">×{comboResult.multiplier}</p>
        </>
      ) : (
        <p className="text-[14px] text-[#9188A0]">
          {COMBO_RESULT_LABELS[playerL1]?.invalid ?? COMBO_RESULT_LABELS["en"]!.invalid}
        </p>
      )}
      <p className="mt-2 text-[9px] text-[#9188A0]">tap to continue</p>
    </motion.div>
  );
}

function EndCard({
  won, playerL1, onClose,
}: {
  won: boolean;
  playerL1: string;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="pointer-events-auto mx-auto w-full max-w-[300px] cursor-pointer rounded-2xl border-[3px] border-[#4A3F55] bg-[#FFF6E5] px-5 py-5 text-center shadow-lg"
      onClick={onClose}
    >
      <p className="text-[20px] font-semibold text-[#4A3F55]">
        {won
          ? (END_LABELS[playerL1]?.won ?? END_LABELS["en"]!.won)
          : (END_LABELS[playerL1]?.lost ?? END_LABELS["en"]!.lost)}
      </p>
      <p className="mt-3 text-[9px] text-[#9188A0]">tap to return</p>
    </motion.div>
  );
}
