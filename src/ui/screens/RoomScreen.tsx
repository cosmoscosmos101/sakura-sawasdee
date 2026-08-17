import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { db, loadRoomState, saveRoomState, type PlacedFurniture } from "../../data/db";

const COLS = 8;
const ROWS = 6;
const DISPLAY_SLOTS = 6;

interface FurnitureItem { id: string; name: string; emoji: string; color: string }

const FURNITURE: FurnitureItem[] = [
  { id: "kotatsu",   name: "Kotatsu",   emoji: "🍵", color: "#C9A27E" },
  { id: "bookshelf", name: "Bookshelf", emoji: "📚", color: "#A88A7D" },
  { id: "bonsai",    name: "Bonsai",    emoji: "🌱", color: "#A8DDB5" },
  { id: "lamp",      name: "Lamp",      emoji: "🏮", color: "#FFE08A" },
  { id: "futon",     name: "Futon",     emoji: "🛏️", color: "#BDE3FF" },
  { id: "desk",      name: "Desk",      emoji: "📝", color: "#D97FA5" },
  { id: "window",    name: "Window",    emoji: "🪟", color: "#FFD9E8" },
  { id: "clock",     name: "Clock",     emoji: "🕐", color: "#E0D7FF" },
];

type Grid = (string | null)[][];

function emptyGrid(): Grid {
  return Array.from({ length: ROWS }, () => Array<string | null>(COLS).fill(null));
}

function placedToGrid(placed: PlacedFurniture[]): Grid {
  const g = emptyGrid();
  for (const p of placed) {
    if (p.row >= 0 && p.row < ROWS && p.col >= 0 && p.col < COLS) {
      g[p.row]![p.col] = p.itemId;
    }
  }
  return g;
}

function gridToPlaced(g: Grid): PlacedFurniture[] {
  const out: PlacedFurniture[] = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const id = g[row]?.[col];
      if (id) out.push({ itemId: id, col, row });
    }
  }
  return out;
}

const byId = (id: string): FurnitureItem | undefined => FURNITURE.find((f) => f.id === id);

// ── Sub-components ───────────────────────────────────────────────────────────

function RoomGrid({ grid, selected, onCell }: {
  grid: Grid; selected: string | null; onCell: (r: number, c: number) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border-2 border-[#C9A27E]"
      style={{ display: "grid", gridTemplateColumns: `repeat(${COLS}, 1fr)`, backgroundColor: "#E8D5B0", gap: 1 }}
    >
      {Array.from({ length: ROWS }, (_, r) =>
        Array.from({ length: COLS }, (_, c) => {
          const id = grid[r]?.[c] ?? null;
          const item = id ? byId(id) : null;
          return (
            <button key={`${r}-${c}`} onClick={() => onCell(r, c)}
              className="flex aspect-square items-center justify-center text-xl transition-colors"
              style={{
                backgroundColor: item ? item.color + "CC" : selected ? "#FFE8EF" : "#FFF0DC",
                outline: !item && selected ? "1.5px dashed #D97FA5" : undefined,
              }}
              title={item?.name ?? (selected ? "Place here" : "Empty")}
            >
              {item?.emoji}
            </button>
          );
        })
      )}
    </div>
  );
}

function FurnitureBar({ selected, onSelect }: {
  selected: string | null; onSelect: (id: string | null) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {FURNITURE.map((f) => (
        <button key={f.id} onClick={() => onSelect(selected === f.id ? null : f.id)}
          className="flex shrink-0 flex-col items-center rounded-xl border-2 px-2 py-1.5"
          style={{
            borderColor: selected === f.id ? "#4A3F55" : "#C9A27E",
            backgroundColor: selected === f.id ? f.color : f.color + "55",
            boxShadow: selected === f.id ? "0 0 0 2px #4A3F5544" : undefined,
          }}
        >
          <span className="text-xl">{f.emoji}</span>
          <span className="mt-0.5 text-[9px] font-semibold text-[#4A3F55]">{f.name}</span>
        </button>
      ))}
    </div>
  );
}

function DisplayCase({ slots, caughtIds, onChange }: {
  slots: string[]; caughtIds: string[]; onChange: (slots: string[]) => void;
}) {
  const [picking, setPicking] = useState<number | null>(null);

  function assign(i: number, vocabId: string) {
    const next = [...slots];
    next[i] = vocabId;
    onChange(next);
    setPicking(null);
  }

  return (
    <div>
      <p className="mb-2 text-xs font-bold text-[#4A3F55]">Display case</p>
      <div className="flex gap-2">
        {slots.map((vocabId, i) => (
          <button key={i} onClick={() => setPicking(picking === i ? null : i)}
            className="flex h-12 w-12 flex-col items-center justify-center rounded-xl border-2 bg-[#FFF6E5]"
            style={{ borderColor: picking === i ? "#4A3F55" : "#C9A27E" }}
            title={vocabId || "Empty"}
          >
            {vocabId
              ? <><span className="text-[8px] font-bold text-[#4A3F55] leading-none">{vocabId}</span><span className="text-[10px]">🌸</span></>
              : <span className="text-xl text-[#D8D4E0]">◦</span>
            }
          </button>
        ))}
      </div>

      {picking !== null && (
        <div className="mt-2 max-h-28 overflow-y-auto rounded-xl border-2 border-[#F7A8C4] bg-white/80 p-2">
          <button onClick={() => assign(picking, "")}
            className="mb-1 w-full rounded-lg bg-[#D8D4E0]/60 px-2 py-1 text-left text-[10px] text-[#4A3F55]">
            (empty this slot)
          </button>
          {caughtIds.length === 0
            ? <p className="text-[10px] text-[#9188A0]">Catch some Kotodama first!</p>
            : caughtIds.map((id) => (
              <button key={id} onClick={() => assign(picking, id)}
                className="w-full rounded-lg px-2 py-1.5 text-left text-[11px] font-medium text-[#4A3F55] hover:bg-[#FFD9E8]/60">
                🌸 {id}
              </button>
            ))
          }
        </div>
      )}
    </div>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────

export function RoomScreen({ onClose }: { onClose: () => void }) {
  const [grid, setGrid] = useState<Grid>(emptyGrid);
  const [displaySlots, setDisplaySlots] = useState<string[]>(Array(DISPLAY_SLOTS).fill(""));
  const [caughtIds, setCaughtIds] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const room = await loadRoomState();
      setGrid(placedToGrid(room.placed));
      setDisplaySlots(Array.from({ length: DISPLAY_SLOTS }, (_, i) => room.displayCase[i] ?? ""));
      const caught = await db.kotodamaCollection.toArray();
      setCaughtIds(caught.map((k) => k.vocabId));
    })();
  }, []);

  const handleCell = useCallback((row: number, col: number) => {
    const existing = grid[row]?.[col] ?? null;
    let next = grid.map((r) => [...r]) as Grid;

    if (existing) {
      next[row]![col] = null;
      setSelected(existing);
    } else if (selected) {
      next[row]![col] = selected;
      setSelected(null);
    } else {
      return; // nothing to do
    }

    setGrid(next);
    void saveRoomState({ placed: gridToPlaced(next), displayCase: displaySlots });
  }, [grid, selected, displaySlots]);

  function handleSlots(slots: string[]) {
    setDisplaySlots(slots);
    void saveRoomState({ placed: gridToPlaced(grid), displayCase: slots });
  }

  return (
    <motion.div
      initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 320, damping: 34 }}
      className="pointer-events-auto absolute inset-0 z-30 flex flex-col bg-[#FFF6E5] p-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-lg font-bold text-[#4A3F55]">🏠 My Room</p>
          <p className="text-[10px] text-[#9188A0]">
            {selected ? `Placing: ${byId(selected)?.emoji} ${byId(selected)?.name} — tap a cell` : "Select furniture below, then tap a cell to place it"}
          </p>
        </div>
        <button onClick={onClose}
          className="rounded-xl border-2 border-[#4A3F55] bg-[#F7A8C4] px-3 py-1.5 text-sm font-semibold text-[#4A3F55]">
          ✕
        </button>
      </div>

      <div className="flex flex-col gap-4 overflow-y-auto">
        <RoomGrid grid={grid} selected={selected} onCell={handleCell} />
        <FurnitureBar selected={selected} onSelect={setSelected} />
        <DisplayCase slots={displaySlots} caughtIds={caughtIds} onChange={handleSlots} />
      </div>
    </motion.div>
  );
}
