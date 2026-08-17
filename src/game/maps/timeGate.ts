export function isPortalAllowed(targetMapKey: string): boolean {
  if (targetMapKey === "night_market") {
    const h = new Date().getHours();
    return h >= 18 || h < 2;
  }
  if (targetMapKey === "floating_market") {
    const d = new Date().getDay();
    return d === 0 || d === 6;
  }
  return true;
}

export function portalBlockedMessage(targetMapKey: string): string {
  if (targetMapKey === "night_market")    return "Night market opens at 18:00 🌙";
  if (targetMapKey === "floating_market") return "Floating market: weekends only 🛶";
  return "";
}
