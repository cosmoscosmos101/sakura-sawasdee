import rawMain from "./ja/dialogue_main.json";
import rawNPCs from "./ja/dialogue_npcs.json";
import rawNPCsB from "./ja/dialogue_npcs_b.json";
import rawTh from "./th/dialogue.json";
import rawThB from "./th/dialogue_b.json";
import { parseDialogueFile, type DialogueNode } from "./schema";

export const JA_DIALOGUE: DialogueNode[] = [
  ...parseDialogueFile(rawMain as unknown, "ja/dialogue_main.json"),
  ...parseDialogueFile(rawNPCs as unknown, "ja/dialogue_npcs.json"),
  ...parseDialogueFile(rawNPCsB as unknown, "ja/dialogue_npcs_b.json"),
];

export const TH_DIALOGUE: DialogueNode[] = [
  ...parseDialogueFile(rawTh as unknown, "th/dialogue.json"),
  ...parseDialogueFile(rawThB as unknown, "th/dialogue_b.json"),
];
