export interface CutsceneSlide {
  bg: string;
  illustration: string; // emoji or short text
  title: string;
  body: string;
}

export interface Cutscene {
  id: string;
  slides: CutsceneSlide[];
}

export const CUTSCENES: Record<string, Cutscene> = {
  intro: {
    id: "intro",
    slides: [
      {
        bg: "#D8D4E0",
        illustration: "🌫️",
        title: "The Fog Descends",
        body: "A grey silence has crept across the world.\nWords are vanishing — and with them, memory itself.",
      },
      {
        bg: "#FFD9E8",
        illustration: "🌸",
        title: "A Voice in the Mist",
        body: "But deep in the fog, small lights still glow —\nKotodama, the word spirits, waiting to be remembered.",
      },
      {
        bg: "#FFF6E5",
        illustration: "✨",
        title: "Your Journey Begins",
        body: "Speak their names. Learn their shapes.\nTogether, you can push back The Silence.",
      },
    ],
  },
  hanami_arrival: {
    id: "hanami_arrival",
    slides: [
      {
        bg: "#FFF0F5",
        illustration: "🏫",
        title: "Hanami Academy",
        body: "A school built where cherry petals never stop falling.\nThe teachers here speak only in questions.",
      },
    ],
  },
  first_battle: {
    id: "first_battle",
    slides: [
      {
        bg: "#A9A3B8",
        illustration: "🌑",
        title: "A Kotodama in the Fog",
        body: "It drifts — confused, fading.\nOnly the right word can call it back to the light.",
      },
    ],
  },
  thailand_gate: {
    id: "thailand_gate",
    slides: [
      {
        bg: "#BDE3FF",
        illustration: "✈️",
        title: "The Gate Between Worlds",
        body: "Beyond this airport lies a different kind of silence —\none flavoured with jasmine rice and tuk-tuk horns.",
      },
    ],
  },
  thai_arrival: {
    id: "thai_arrival",
    slides: [
      {
        bg: "#FFE3A3",
        illustration: "🛺",
        title: "สวัสดี Thailand",
        body: "The air smells of lemongrass. A tuk-tuk idles nearby.\nA whole new language waits — starting with hello.",
      },
    ],
  },
  market_heartbeat: {
    id: "market_heartbeat",
    slides: [
      {
        bg: "#C8F2E0",
        illustration: "🥭",
        title: "The Market's Heartbeat",
        body: "Every stall has a story told in numbers, colours, and politeness.\nListen carefully — Pa Somsri doesn't repeat herself.",
      },
    ],
  },
  silence_weakens: {
    id: "silence_weakens",
    slides: [
      {
        bg: "#FFD9E8",
        illustration: "💫",
        title: "The Silence Retreats",
        body: "A word remembered is a light restored.\nThe fog thins — just a little — and somewhere, a Kotodama breathes easier.",
      },
    ],
  },
};
