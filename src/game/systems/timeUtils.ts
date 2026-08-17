export type TimeOfDay = "dawn" | "day" | "dusk" | "night";

export function timeOfDayFromHour(hour: number): TimeOfDay {
  if (hour >= 5  && hour < 7)  return "dawn";
  if (hour >= 7  && hour < 17) return "day";
  if (hour >= 17 && hour < 19) return "dusk";
  return "night";
}

export const TOD_COLOUR: Record<TimeOfDay, number> = {
  dawn:  0xFFD4C4,
  day:   0xFFFFFF,
  dusk:  0xC9A8D9,
  night: 0x2A2545,
};

export const TOD_ALPHA: Record<TimeOfDay, number> = {
  dawn:  0.18,
  day:   0.0,
  dusk:  0.22,
  night: 0.55,
};
