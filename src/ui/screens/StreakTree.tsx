import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { loadProfile } from "../../data/db";
import { streakStage, toDateString } from "../../learning/streakManager";

const STAGE_LABEL = ["bare", "budding", "in bloom", "full bloom", "✨ radiant"] as const;

const BRANCH_PATHS: { d: string; w: number }[] = [
  { d: "M60,105 Q38,96 22,85", w: 5 },
  { d: "M60,105 Q82,96 98,85", w: 5 },
  { d: "M60,96 Q42,80 30,62", w: 4 },
  { d: "M60,96 Q78,80 90,62", w: 4 },
  { d: "M60,90 Q52,75 46,58", w: 3 },
  { d: "M60,90 Q68,75 74,58", w: 3 },
  { d: "M60,90 Q59,72 58,52", w: 3 },
];

// [cx, cy, r] — ordered from branch tips inward
const BLOSSOMS: readonly [number, number, number][] = [
  [22, 84, 7], [98, 84, 7], [30, 60, 7], [90, 60, 7],           // stage 1
  [36, 94, 7], [84, 94, 7], [41, 74, 7], [79, 74, 7],           // stage 2
  [54, 50, 8], [66, 50, 8],
  [27, 73, 7], [93, 73, 7], [47, 64, 7], [73, 64, 7],           // stage 3
  [52, 56, 7], [68, 56, 7], [55, 41, 7], [65, 41, 7],
  [60, 36, 8], [50, 45, 7], [70, 45, 7], [44, 53, 7],           // stage 4
  [76, 53, 7], [57, 29, 7], [63, 29, 7], [60, 21, 9],
] as const;

const STAGE_COUNT = [0, 4, 10, 18, 26] as const;

function SakuraTreeSvg({ stage }: { stage: 0 | 1 | 2 | 3 | 4 }) {
  const count = STAGE_COUNT[stage];
  const radiant = stage === 4;
  return (
    <svg viewBox="0 0 120 150" className="mx-auto w-40 select-none drop-shadow-md">
      <defs>
        {radiant && (
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        )}
      </defs>
      {/* Trunk */}
      <rect x="54" y="95" width="12" height="50" rx="4" fill="#A88A7D" />
      {/* Branches */}
      {BRANCH_PATHS.map((bp, i) => (
        <path key={i} d={bp.d} stroke="#A88A7D" strokeWidth={bp.w}
          fill="none" strokeLinecap="round" />
      ))}
      {/* Blossoms */}
      <g filter={radiant ? "url(#glow)" : undefined}>
        {BLOSSOMS.slice(0, count).map(([cx, cy, r], i) => (
          <g key={i}>
            <circle cx={cx} cy={cy} r={r} fill="#FFD9E8" stroke="#F7A8C4" strokeWidth="0.8" />
            <circle cx={cx} cy={cy} r={r * 0.3} fill="#F7A8C4" />
          </g>
        ))}
      </g>
      {/* Ground */}
      <ellipse cx="60" cy="146" rx="24" ry="4" fill="#C9A27E" opacity="0.4" />
    </svg>
  );
}

function buildHeatmap(playDates: ReadonlySet<string>): { date: string; played: boolean; future: boolean }[][] {
  const nowMs = Date.now();
  const today = toDateString(nowMs);
  const days: { date: string; played: boolean; future: boolean }[] = [];
  for (let i = 364; i >= 0; i--) {
    const date = toDateString(nowMs - i * 86_400_000);
    days.push({ date, played: playDates.has(date), future: false });
  }
  // Pad to start on Sunday
  const firstDOW = new Date(days[0]?.date ?? today).getDay();
  const padded = [
    ...Array.from({ length: firstDOW }, () => ({ date: "", played: false, future: true })),
    ...days,
  ];
  const weeks: typeof days[] = [];
  for (let i = 0; i < padded.length; i += 7) weeks.push(padded.slice(i, i + 7));
  return weeks;
}

export function StreakTree({ onClose }: { onClose: () => void }) {
  const [streakDays, setStreakDays] = useState(0);
  const [winterWraps, setWinterWraps] = useState(0);
  const [playDates, setPlayDates] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    void loadProfile().then((p) => {
      if (!p) return;
      setStreakDays(p.streakDays);
      setWinterWraps(p.winterWraps);
      setPlayDates(new Set(p.playDates ?? []));
    });
  }, []);

  const stage = streakStage(streakDays);
  const weeks = useMemo(() => buildHeatmap(playDates), [playDates]);

  return (
    <motion.div
      initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 320, damping: 34 }}
      className="pointer-events-auto absolute inset-0 z-30 flex flex-col items-center overflow-y-auto bg-[#FFF0F5] p-4"
    >
      {/* Header */}
      <div className="mb-3 flex w-full max-w-sm items-center justify-between">
        <div>
          <p className="text-lg font-bold text-[#4A3F55]">🌸 Streak Tree</p>
          <p className="text-xs text-[#9188A0]">{streakDays} day{streakDays !== 1 ? "s" : ""} · {STAGE_LABEL[stage]}</p>
        </div>
        <button
          onClick={onClose}
          className="rounded-xl border-2 border-[#4A3F55] bg-[#F7A8C4] px-3 py-1.5 text-sm font-semibold text-[#4A3F55]"
        >✕</button>
      </div>

      {/* Tree */}
      <SakuraTreeSvg stage={stage} />

      {/* Winter wraps */}
      {winterWraps > 0 && (
        <p className="mt-2 text-sm text-[#6B5F78]">
          🌨️ Winter wrap{winterWraps !== 1 ? "s" : ""}: <strong>{winterWraps}</strong> remaining
        </p>
      )}

      {/* Streak details */}
      <div className="mt-3 w-full max-w-sm rounded-xl border-2 border-[#F7A8C4] bg-white/70 px-4 py-3">
        <p className="text-xs font-semibold text-[#4A3F55]">How the tree grows</p>
        <ul className="mt-1.5 space-y-1 text-[11px] text-[#6B5F78]">
          <li>🌿 Play every day to open more blossoms</li>
          <li>🍂 Miss 1 day — petals fall (streak stalls)</li>
          <li>🍁 Miss 3+ days — leaves yellow</li>
          <li>❄️ 7 days without play — tree resets</li>
          <li>🌨️ Winter wraps freeze the tree for 1 missed day</li>
        </ul>
      </div>

      {/* 365-day heatmap */}
      <div className="mt-4 w-full max-w-sm">
        <p className="mb-2 text-xs font-semibold text-[#4A3F55]">Last 365 days</p>
        <div className="flex gap-[2px] overflow-x-auto pb-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[2px]">
              {week.map((cell, di) => (
                <div
                  key={di}
                  title={cell.date}
                  className="h-[7px] w-[7px] rounded-[1px]"
                  style={{
                    backgroundColor: cell.future || !cell.date
                      ? "transparent"
                      : cell.played
                        ? "#F7A8C4"
                        : "#E0D7FF",
                  }}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="mt-1 flex items-center gap-2 text-[10px] text-[#9188A0]">
          <span className="inline-block h-2.5 w-2.5 rounded-[1px] bg-[#F7A8C4]" /> played
          <span className="ml-2 inline-block h-2.5 w-2.5 rounded-[1px] bg-[#E0D7FF]" /> missed
        </div>
      </div>
    </motion.div>
  );
}
