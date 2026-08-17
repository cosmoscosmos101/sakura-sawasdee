import type { BattleKotodama } from "../../state/battleStore";
import type { LocaleCode } from "../../state/playerStore";

interface Props {
  party: BattleKotodama[];
  playerL1: LocaleCode;
  chainLength: number;
  onSend: (index: number) => void;
  onCombo: () => void;
  onFlee: () => void;
}

const LABELS: Record<LocaleCode, {
  send: string; combo: string; flee: string; sent: string;
}> = {
  th: { send: "ส่ง",  combo: "คอมโบ", flee: "หนี", sent: "แล้ว" },
  en: { send: "Send", combo: "Combo!", flee: "Flee", sent: "sent" },
  ja: { send: "だす",  combo: "コンボ！", flee: "にげる", sent: "済" },
};

const ELEMENT_COLOR: Record<string, string> = {
  bloom: "#F7A8C4", spark: "#FFE08A", flow: "#7FC4E0",
  echo: "#C9B8F0",  stone: "#C9A27E", light: "#FFF6E5",
};

export function CommandMenu({ party, playerL1, chainLength, onSend, onCombo, onFlee }: Props) {
  const labels = LABELS[playerL1] ?? LABELS.en;

  return (
    <div className="pointer-events-auto w-full px-3 pb-3">
      <div className="rounded-2xl border-[3px] border-[#4A3F55] bg-[#FFF6E5] p-3 shadow-lg">
        {/* Kotodama party row */}
        <div className="mb-2 grid grid-cols-4 gap-2">
          {party.map((k, i) => {
            const sent = k.sentThisTurn;
            const element = k.vocabEntry.element;
            return (
              <button
                key={k.vocabEntry.id}
                onClick={() => onSend(i)}
                disabled={sent}
                className="flex flex-col items-center rounded-xl border-2 border-[#4A3F55] py-1.5 transition-colors"
                style={{ background: sent ? "#F5E3C8" : ELEMENT_COLOR[element] ?? "#FFF0F5" }}
              >
                <span className="text-[14px]">
                  {sent ? "✓" : "🌸"}
                </span>
                <span className="mt-0.5 text-[8px] leading-tight text-[#4A3F55]">
                  {sent ? labels.sent : k.vocabEntry.reading}
                </span>
              </button>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={onCombo}
            disabled={chainLength < 2}
            className="flex-1 rounded-xl border-2 border-[#4A3F55] bg-[#FFE08A] py-1.5 text-[11px] font-semibold text-[#4A3F55] transition-colors hover:bg-[#F2C879] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {labels.combo}
          </button>
          <button
            onClick={onFlee}
            className="rounded-xl border-2 border-[#9188A0] bg-[#FFF6E5] px-3 py-1.5 text-[11px] text-[#9188A0] transition-colors hover:bg-[#F5E3C8]"
          >
            {labels.flee}
          </button>
        </div>
      </div>
    </div>
  );
}
