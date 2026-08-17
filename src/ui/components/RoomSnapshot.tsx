import type { RoomState } from "../../data/db";

const COLS = 8;
const ROWS = 6;
const FURNITURE_EMOJI: Record<string, string> = {
  kotatsu: "🍵", bookshelf: "📚", bonsai: "🌱", lamp: "🏮",
  futon: "🛏️", desk: "📝", window: "🪟", clock: "🕐",
};

interface Props {
  room: RoomState;
  cellPx?: number;
}

/** Read-only grid snapshot — used for friend room visits. */
export function RoomSnapshot({ room, cellPx = 24 }: Props) {
  const grid = Array.from({ length: ROWS }, () => Array<string | null>(COLS).fill(null));
  for (const p of room.placed) {
    const row = grid[p.row];
    if (row) row[p.col] = p.itemId;
  }

  return (
    <div className="flex flex-col gap-0.5">
      {grid.map((row, r) => (
        <div key={r} className="flex gap-0.5">
          {row.map((cell, c) => (
            <div
              key={c}
              className="flex items-center justify-center rounded border border-[#E0D7FF] bg-[#FFF0F5]"
              style={{ width: cellPx, height: cellPx, fontSize: cellPx * 0.55 }}
            >
              {cell ? (FURNITURE_EMOJI[cell] ?? "📦") : null}
            </div>
          ))}
        </div>
      ))}
      {room.displayCase.some(Boolean) && (
        <div className="mt-2 flex gap-1">
          {room.displayCase.map((id, i) => (
            <div
              key={i}
              className="flex items-center justify-center rounded border-2 border-[#4A3F55] bg-[#FFF6E5]"
              style={{ width: cellPx, height: cellPx, fontSize: cellPx * 0.6 }}
            >
              {id ? (FURNITURE_EMOJI[id] ?? "📦") : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
