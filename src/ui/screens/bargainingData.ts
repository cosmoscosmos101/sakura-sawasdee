export interface BargainItem {
  name: string;
  meaning: string;
  emoji: string;
  listPrice: number;
  minAccept: number;
}

export const ITEMS: BargainItem[] = [
  { name: "ผ้าไหม",      meaning: "silk scarf",       emoji: "🧣", listPrice: 350, minAccept: 200 },
  { name: "มะม่วง",     meaning: "mangoes (bunch)",   emoji: "🥭", listPrice: 80,  minAccept: 50  },
  { name: "ตะกร้าไม้ไผ่", meaning: "bamboo basket",    emoji: "🧺", listPrice: 150, minAccept: 90  },
  { name: "น้ำมะพร้าว", meaning: "fresh coconut",     emoji: "🥥", listPrice: 50,  minAccept: 35  },
  { name: "ดอกบัว",     meaning: "lotus flowers",     emoji: "🪷", listPrice: 120, minAccept: 70  },
  { name: "ขนมไทย",     meaning: "Thai sweets (box)", emoji: "🍡", listPrice: 200, minAccept: 130 },
];

export const POLITE_PARTICLES = [
  { text: "ครับ",   score: 3, label: "(male polite)" },
  { text: "ค่ะ",    score: 3, label: "(female polite)" },
  { text: "นะครับ", score: 4, label: "(soft+male)" },
  { text: "นะคะ",  score: 4, label: "(soft+female)" },
];

export function pickItem(): BargainItem {
  return ITEMS[Math.floor(Math.random() * ITEMS.length)] as BargainItem;
}
