import type { DialogueNode } from "./schema";

/** NPC dialogue keyed by npcId → l2 language being learned */
export const NPC_DIALOGUE: Record<string, Partial<Record<"ja" | "th", DialogueNode[]>>> = {
  elder: {
    ja: [
      {
        id: "elder_ja_1",
        speakerNpcId: "elder",
        speakerName: { th: "ผู้เฒ่าเคนจิ", en: "Elder Kenji" },
        lines: [
          {
            l2: "ようこそ、わかものよ。",
            reading: "ようこそ、若者よ。",
            translation: { th: "ยินดีต้อนรับ หนุ่มน้อย", en: "Welcome, young one." },
          },
          {
            l2: "このもりの きりは、ことばを たべる。",
            reading: "この森の霧は、言葉を食べる。",
            translation: {
              th: "หมอกในป่านี้กินคำพูด",
              en: "The fog in this forest devours words.",
            },
          },
          {
            l2: "ことばを まなべば、きりは きえる。",
            reading: "言葉を学べば、霧は消える。",
            translation: {
              th: "ถ้าเรียนรู้คำศัพท์ หมอกจะหายไป",
              en: "Learn the words and the fog will vanish.",
            },
          },
        ],
        endsDialogue: true,
      },
    ],
    th: [
      {
        id: "elder_th_1",
        speakerNpcId: "elder",
        speakerName: { en: "Elder Somchai", th: "ผู้เฒ่าสมชาย" },
        lines: [
          {
            l2: "ยินดีต้อนรับ หนุ่มน้อย",
            translation: { en: "Welcome, young one." },
          },
          {
            l2: "หมอกในป่านี้กินคำศัพท์",
            translation: { en: "The fog in this forest devours vocabulary." },
          },
          {
            l2: "เรียนภาษาไทยให้แม่น แล้วหมอกจะหายไป",
            translation: { en: "Master Thai, and the fog will disappear." },
          },
        ],
        endsDialogue: true,
      },
    ],
  },

  traveler: {
    ja: [
      {
        id: "traveler_ja_1",
        speakerNpcId: "traveler",
        speakerName: { th: "นักเดินทาง", en: "Traveler" },
        lines: [
          {
            l2: "私も猫が好きだよ！",
            reading: "わたしもねこがすきだよ！",
            translation: {
              th: "ฉันก็ชอบแมวเหมือนกันนะ!",
              en: "I like cats too!",
            },
            tokenIds: ["ja_n5_0098", "ja_n5_0001", "ja_n5_0043"],
            newWordIds: ["ja_n5_0098", "ja_n5_0001"],
          },
          {
            l2: "もじを おぼえると、てきに かてるよ！",
            reading: "文字を覚えると、敵に勝てるよ！",
            translation: {
              th: "ถ้าจำตัวอักษรได้ ก็จะชนะศัตรูได้!",
              en: "Memorise the characters and you can beat the enemies!",
            },
          },
        ],
        endsDialogue: true,
      },
    ],
    th: [
      {
        id: "traveler_th_1",
        speakerNpcId: "traveler",
        speakerName: { en: "Traveler", th: "นักเดินทาง" },
        lines: [
          {
            l2: "สวัสดี! กำลังเรียนภาษาไทยอยู่เหรอ?",
            translation: { en: "Hello! Are you learning Thai?" },
          },
          {
            l2: "จำคำศัพท์ให้เยอะ แล้วจะชนะหมอก!",
            translation: { en: "Memorise lots of vocab and you'll beat the fog!" },
          },
        ],
        endsDialogue: true,
      },
    ],
  },

  child: {
    ja: [
      {
        id: "child_ja_1",
        speakerNpcId: "child",
        speakerName: { th: "เด็กน้อย", en: "Child" },
        lines: [
          {
            l2: "猫が好き？",
            reading: "ねこがすき？",
            translation: { th: "ชอบแมวไหม?", en: "Do you like cats?" },
            tokenIds: ["ja_n5_0001", "ja_n5_0043"],
            newWordIds: ["ja_n5_0001", "ja_n5_0043"],
          },
          {
            l2: "わたしは ことばまもりたい！",
            reading: "私は言葉守り隊！",
            translation: {
              th: "ฉันอยู่ในทีมพิทักษ์คำศัพท์!",
              en: "I'm in the Word Guardian Squad!",
            },
          },
          {
            l2: "いっしょに たたかおう！",
            reading: "一緒に戦おう！",
            translation: { th: "มาต่อสู้ด้วยกันเถอะ!", en: "Let's fight together!" },
          },
        ],
        endsDialogue: true,
      },
    ],
    th: [
      {
        id: "child_th_1",
        speakerNpcId: "child",
        speakerName: { en: "Child", th: "เด็กน้อย" },
        lines: [
          {
            l2: "เฮ้ คุณเป็นใคร?",
            translation: { en: "Hey, who are you?" },
          },
          {
            l2: "ฉันอยู่ในทีมพิทักษ์คำศัพท์!",
            translation: { en: "I'm in the Word Guardian Squad!" },
          },
          {
            l2: "มาต่อสู้ด้วยกันเถอะ!",
            translation: { en: "Let's fight together!" },
          },
        ],
        endsDialogue: true,
      },
    ],
  },
};
