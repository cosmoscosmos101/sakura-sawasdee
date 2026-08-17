import { TONE_COLOUR, TONE_NAMES, type Tone } from "../../learning/thai/scriptSystem";

export function IngredientSlot({
  label,
  value,
  colour,
  active,
}: {
  label:  string;
  value:  string;
  colour: string;
  active: boolean;
}) {
  return (
    <div
      className="flex flex-col items-center gap-1"
      style={{ opacity: active || value !== "?" ? 1 : 0.4 }}
    >
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#4A3F55] text-sm font-bold text-[#4A3F55] shadow-sm"
        style={{ background: value !== "?" ? colour : "#FFF6E5" }}
      >
        {value}
      </div>
      <span className="text-[9px] text-[#6B5F78]">{label}</span>
    </div>
  );
}

export function ToneButton({
  tone,
  onClick,
}: {
  tone:    Tone;
  onClick: (t: Tone) => void;
}) {
  const toneSymbols = ["─", "↘", "↘↗", "↑", "↗↘"];
  return (
    <button
      onClick={() => onClick(tone)}
      className="flex flex-col items-center gap-0.5 rounded-xl border-2 border-[#4A3F55] px-2 py-1.5 text-[#4A3F55] shadow-sm active:scale-95"
      style={{ background: TONE_COLOUR[tone] }}
    >
      <span className="text-[14px] leading-none">{toneSymbols[tone]}</span>
      <span className="text-[9px] font-semibold">{TONE_NAMES[tone]}</span>
    </button>
  );
}
