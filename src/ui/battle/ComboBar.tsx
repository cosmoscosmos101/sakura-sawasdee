import type { ComboToken } from "../../learning/comboValidator";
import type { ComboResult } from "../../learning/comboValidator";

interface Props {
  chain: ComboToken[];
  comboResult: ComboResult | null;
  playerL1?: string;
}

const COMBO_LABEL: Record<string, string> = {
  th: "คอมโบ ×",
  en: "Combo ×",
  ja: "コンボ ×",
};

const ELEMENT_COLOR: Record<string, string> = {
  bloom: "#F7A8C4",
  spark: "#FFE08A",
  flow:  "#7FC4E0",
  echo:  "#C9B8F0",
  stone: "#C9A27E",
  light: "#FFF6E5",
};

const ELEMENT_SYMBOL: Record<string, string> = {
  bloom: "🌸",
  spark: "⚡",
  flow:  "💧",
  echo:  "🌙",
  stone: "⛰️",
  light: "✨",
};

export function ComboBar({ chain, comboResult, playerL1 = "en" }: Props) {
  if (chain.length === 0 && !comboResult) return null;

  return (
    <div className="pointer-events-none w-full px-3">
      <div className="rounded-xl border-2 border-[#4A3F55] bg-[#FFF6E5]/90 px-3 py-2 shadow-sm">
        <div className="flex items-center gap-1.5">
          {chain.map((token, i) => (
            <div
              key={`${token.id}-${i}`}
              className="flex h-6 w-6 items-center justify-center rounded-full border border-[#4A3F55] text-[10px]"
              style={{ background: ELEMENT_COLOR[token.element] ?? "#FFF6E5" }}
              title={token.id}
            >
              {ELEMENT_SYMBOL[token.element] ?? "?"}
            </div>
          ))}

          {chain.length > 0 && (
            <span className="ml-1 text-[9px] font-semibold text-[#6B5F78]">
              ×{chain.length === 1 ? "1.0" :
                chain.length === 2 ? "1.5" :
                chain.length === 3 ? "2.0" :
                chain.length === 4 ? "2.8" :
                chain.length === 5 ? "3.5" : "4.5"}
            </span>
          )}
        </div>

        {comboResult && (
          <p className={`mt-1 text-[9px] font-semibold ${comboResult.valid ? "text-[#4E7D5E]" : "text-[#C9A27E]"}`}>
            {comboResult.valid
              ? `${COMBO_LABEL[playerL1] ?? COMBO_LABEL["en"]}${comboResult.multiplier}!`
              : comboResult.reason?.replace(/_/g, " ")}
          </p>
        )}
      </div>
    </div>
  );
}
