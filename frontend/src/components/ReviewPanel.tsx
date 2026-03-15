import type { MoveAnalysis } from "../types/review";

interface ReviewPanelProps {
  move: MoveAnalysis | null;
}

export function ReviewPanel({ move }: ReviewPanelProps) {
  if (!move) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4 text-slate-300">
        Load a PGN and run analysis to see move-by-move review comments.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-4 text-slate-100">
      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Game Review</p>
      <h3 className="mt-2 text-lg font-semibold">
        Move {move.moveNumber}: {move.san}
      </h3>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg bg-slate-800 p-2">
          <p className="text-slate-400">Classification</p>
          <p>{move.classification}</p>
        </div>
        <div className="rounded-lg bg-slate-800 p-2">
          <p className="text-slate-400">Best Move</p>
          <p>{move.bestMoveSan ?? "N/A"}</p>
        </div>
        <div className="rounded-lg bg-slate-800 p-2">
          <p className="text-slate-400">Eval Before</p>
          <p>{(move.evalBefore / 100).toFixed(2)}</p>
        </div>
        <div className="rounded-lg bg-slate-800 p-2">
          <p className="text-slate-400">Eval After</p>
          <p>{(move.evalAfter / 100).toFixed(2)}</p>
        </div>
      </div>
      <p className="mt-3 rounded-lg border border-slate-700 bg-slate-950/40 p-3 text-sm text-slate-200">
        {move.explanation}
      </p>
    </div>
  );
}
