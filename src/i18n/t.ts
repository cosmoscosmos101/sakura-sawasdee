import type { DialogueMode } from "../learning/dialogueReveal";
import en from "./en.json";
import th from "./th.json";
import ja from "./ja.json";
import { usePlayerStore } from "../state/playerStore";

type Dict = Record<string, string>;

const DICTS: Record<string, Dict> = {
  en: en as Dict,
  th: th as Dict,
  ja: ja as Dict,
};

export function t(key: string, params?: Record<string, string | number>): string {
  const l1 = usePlayerStore.getState().locale.l1;
  const dict = DICTS[l1] ?? (en as Dict);
  let text = dict[key] ?? (en as Dict)[key] ?? key;
  if (!params) return text;
  for (const [name, value] of Object.entries(params)) {
    text = text.replaceAll(`{{${name}}}`, String(value));
  }
  return text;
}

export function encounterRateLabel(index: number): string {
  return t(`learn.encounter.${index}`);
}

export function dialogueModeLabel(mode: DialogueMode): string {
  return t(`learn.dialogue.${mode}`);
}
