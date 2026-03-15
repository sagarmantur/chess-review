import clsx from "clsx";
import type { MoveAnalysis } from "../types/review";

interface MoveListProps {
  moves: MoveAnalysis[];
  currentPly: number;
  onSelectPly: (ply: number) => void;
}

const severityColor: Record<string, string> = {
  Brilliant: "bg-cyan-400/25 text-cyan-200",
  Great: "bg-sky-400/25 text-sky-200",
  Best: "bg-emerald-400/25 text-emerald-200",
  Excellent: "bg-green-400/25 text-green-200",
  Good: "bg-lime-400/25 text-lime-200",
  Inaccuracy: "bg-yellow-400/25 text-yellow-200",
  Mistake: "bg-orange-400/25 text-orange-200",
  Blunder: "bg-red-500/30 text-red-100",
  Miss: "bg-rose-500/30 text-rose-100",
  "Book move": "bg-blue-500/25 text-blue-100"
};

export function MoveList({ moves, currentPly, onSelectPly }: MoveListProps) {
  return (
    <div className="h-[22rem] overflow-auto rounded-xl border border-slate-700 bg-slate-900/80 p-3">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-300">
        Moves
      </h3>
      <div className="space-y-2 text-sm">
        {moves.map((move) => {
          const active = move.ply === currentPly;
          return (
            <button
              key={`${move.ply}-${move.san}`}
              type="button"
              onClick={() => onSelectPly(move.ply)}
              className={clsx(
                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition",
                active
                  ? "bg-slate-700 text-white"
                  : "bg-slate-800/60 text-slate-200 hover:bg-slate-700/80"
              )}
            >
              <span>
                {move.moveNumber}.
                {move.color === "b" ? ".." : ""} {move.san}
              </span>
              <span
                className={clsx(
                  "rounded-full px-2 py-0.5 text-xs",
                  severityColor[move.classification] ?? "bg-slate-600 text-slate-100"
                )}
              >
                {move.classification}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
