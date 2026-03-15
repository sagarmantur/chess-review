import type { EngineLine } from "../types/review";

interface EngineLinesProps {
  lines: EngineLine[];
}

export function EngineLines({ lines }: EngineLinesProps) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-300">
        Engine Lines
      </h3>
      <div className="space-y-2 text-sm text-slate-200">
        {lines.length === 0 && <p className="text-slate-400">No engine lines yet.</p>}
        {lines.map((line) => (
          <div key={line.multipv} className="rounded-lg bg-slate-800/70 p-2">
            <p className="text-xs text-slate-400">Line #{line.multipv}</p>
            <p>
              Score: {line.mate !== null ? `Mate ${line.mate}` : (line.cp ?? 0) / 100}
            </p>
            <p className="font-mono text-xs text-slate-300">{line.pv.join(" ") || "-"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
