import type { Weather } from "../systems/WeatherSystem";

export type WorldId = "ja" | "th";

export type MinigameEventDef =
  | { readonly type: "fishing:open" | "bargaining:open" | "tuktuk:open" | "handwriting:open" | "tone_kitchen:open" }
  | { readonly type: "word_segment:open"; readonly location: string };

export interface TriggerZoneDef {
  col: number;
  row: number;
  event: MinigameEventDef;
}

export interface NpcDef {
  npcId: string;
  col: number;
  row: number;
  startId: string;
  hasQuest: boolean;
  minigameEvent?: MinigameEventDef;
}

export interface PortalDef {
  col: number;
  row: number;
  targetMapKey: string;
  targetCol: number;
  targetRow: number;
}

export interface MapDef {
  key: string;
  worldId: WorldId;
  cols: number;
  rows: number;
  tilesetName: string;
  playerStart: { col: number; row: number };
  npcs: readonly NpcDef[];
  kotodamaSpots: ReadonlyArray<readonly [number, number]>;
  portals: readonly PortalDef[];
  triggerZones?: readonly TriggerZoneDef[];
  weatherType: Weather;
  tiledJson: object;
}
