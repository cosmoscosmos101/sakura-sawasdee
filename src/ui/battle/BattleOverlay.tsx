import { useBattleStore } from "../../state/battleStore";
import { BattleHUD }    from "./BattleHUD";
import { CommandMenu }  from "./CommandMenu";
import { QuestionCard } from "./QuestionCard";
import { ComboBar }     from "./ComboBar";
import { DefeatCard }   from "./DefeatCard";
import { EndCard }      from "./EndCard";

export function BattleOverlay() {
  const phase = useBattleStore((s) => s.phase);
  if (phase === "idle") return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 20,
        pointerEvents: "none",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        padding: 10,
        gap: 8,
      }}
    >
      {/* Top-right HP bars */}
      <BattleHUD />

      {/* Bottom row: command menu + chain + question */}
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
        <CommandMenu />
        <ComboBar />
        <QuestionCard />
      </div>

      {/* Full-screen overlays for end states */}
      <DefeatCard />
      <EndCard />
    </div>
  );
}
