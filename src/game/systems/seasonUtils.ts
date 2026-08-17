export type Season = "spring" | "summer" | "autumn" | "winter";

export function seasonFromDate(date: Date): Season {
  const month = date.getMonth() + 1;
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}

export const SEASON_TINT: Record<Season, number> = {
  spring:  0xFFEEF5,
  summer:  0xE8FFE8,
  autumn:  0xFFEECC,
  winter:  0xEEF4FF,
};

export const SEASON_PARTICLES: Record<Season, number[]> = {
  spring:  [0xFFD9E8, 0xFFF0F5, 0xF7A8C4],
  summer:  [0xC8F2E0, 0xA8DDB5, 0xFFE08A],
  autumn:  [0xFFB39B, 0xF2C879, 0xE09B7D],
  winter:  [0xF0F4FA, 0xBDE3FF, 0xD8D4E0],
};
