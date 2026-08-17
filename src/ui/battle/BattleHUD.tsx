import type { LocaleCode } from "../../state/playerStore";

interface Props {
  enemyHp: number;
  enemyMaxHp: number;
  playerHp: number;
  playerMaxHp: number;
  playerL1: LocaleCode;
}

const LABELS: Record<LocaleCode, { enemy: string; you: string }> = {
  th: { enemy: "หมอกคำ", you: "คุณ" },
  en: { enemy: "Fog Word", you: "You" },
  ja: { enemy: "霧の言葉", you: "あなた" },
};

function HpBar({ current, max, color }: { current: number; max: number; color: string }) {
  const pct = max > 0 ? Math.max(0, current / max) * 100 : 0;
  return (
    <div className="h-2.5 w-full rounded-full border border-[#4A3F55] bg-[#F5E3C8]">
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

export function BattleHUD({ enemyHp, enemyMaxHp, playerHp, playerMaxHp, playerL1 }: Props) {
  const labels = LABELS[playerL1] ?? LABELS.en;

  return (
    <div className="pointer-events-none flex w-full items-start justify-between px-3 pt-3">
      {/* Enemy HP */}
      <div className="w-36 rounded-xl border-2 border-[#4A3F55] bg-[#FFF6E5]/90 px-3 py-2 shadow-sm">
        <p className="text-[9px] font-semibold text-[#6B5F78]">{labels.enemy}</p>
        <div className="mt-1">
          <HpBar current={enemyHp} max={enemyMaxHp} color="#F7A8C4" />
        </div>
        <p className="mt-0.5 text-right text-[8px] text-[#9188A0]">
          {enemyHp} / {enemyMaxHp}
        </p>
      </div>

      {/* Player HP */}
      <div className="w-36 rounded-xl border-2 border-[#4A3F55] bg-[#FFF6E5]/90 px-3 py-2 shadow-sm">
        <p className="text-[9px] font-semibold text-[#6B5F78]">{labels.you}</p>
        <div className="mt-1">
          <HpBar current={playerHp} max={playerMaxHp} color="#7FC4E0" />
        </div>
        <p className="mt-0.5 text-right text-[8px] text-[#9188A0]">
          {playerHp} / {playerMaxHp}
        </p>
      </div>
    </div>
  );
}
