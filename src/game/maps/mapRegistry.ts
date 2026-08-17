import type { MapDef } from "./mapDef";
import { TEST_MAP } from "./testMap";
import {
  SAKURA_STATION, SAKURA_PATH, SHRINE, SHOPPING_STREET,
  WINTER_COURTYARD, FESTIVAL_GROUNDS, AUTUMN_HILL,
} from "./japanMaps";
import { HANAMI_ACADEMY } from "./japanMaps_b";
import { TUKTUK_TERMINAL, FRESH_MARKET, AIRPORT } from "./thaiMaps";
import { TEMPLE, PIER, OLD_TOWN, RICE_FIELD, NIGHT_MARKET, FLOATING_MARKET } from "./thaiMaps_b";

const TEST_MAP_DEF: MapDef = {
  key: "test_map", worldId: "ja", cols: 30, rows: 20,
  tilesetName: "test_tileset",
  playerStart: { col: 14, row: 10 },
  weatherType: "sakura",
  portals: [],
  npcs: [],
  kotodamaSpots: [] as const,
  tiledJson: TEST_MAP,
};

const ALL_MAPS: readonly MapDef[] = [
  TEST_MAP_DEF,
  HANAMI_ACADEMY,
  SAKURA_STATION, SAKURA_PATH, SHRINE, SHOPPING_STREET,
  WINTER_COURTYARD, FESTIVAL_GROUNDS, AUTUMN_HILL,
  TUKTUK_TERMINAL, FRESH_MARKET, AIRPORT,
  TEMPLE, PIER, OLD_TOWN, RICE_FIELD, NIGHT_MARKET, FLOATING_MARKET,
];

const REGISTRY = new Map<string, MapDef>(ALL_MAPS.map((m) => [m.key, m]));

export function getMapDef(key: string): MapDef {
  const def = REGISTRY.get(key);
  if (!def) throw new Error(`Map "${key}" not found in registry`);
  return def;
}

export function getWorldMaps(worldId: "ja" | "th"): readonly MapDef[] {
  return ALL_MAPS.filter((m) => m.worldId === worldId);
}

export type { MapDef };
