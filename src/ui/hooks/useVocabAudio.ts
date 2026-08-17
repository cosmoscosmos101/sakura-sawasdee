import { useCallback } from "react";
import { audioSystem } from "../../state/AudioSystem";

/**
 * Returns a stable `play(vocabId, text, lang)` function.
 * Tries a prerecorded MP3; falls back to Web Speech API when the file is absent.
 */
export function useVocabAudio() {
  const play = useCallback(
    (vocabId: string, text: string, lang: "ja" | "th") => {
      audioSystem.playVoice(vocabId, text, lang);
    },
    [],
  );
  return { play };
}
