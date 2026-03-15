interface EvaluationBarProps {
  evalCp: number;
}

export function EvaluationBar({ evalCp }: EvaluationBarProps) {
  const normalized = Math.max(-1200, Math.min(1200, evalCp));
  const whitePercent = 50 + (normalized / 1200) * 50;

  return (
    <div className="h-full min-h-80 w-8 overflow-hidden rounded-full border border-slate-600 bg-slate-900">
      <div
        className="w-full bg-slate-200 transition-all duration-300"
        style={{ height: `${Math.max(5, Math.min(95, whitePercent))}%` }}
      />
      <div
        className="w-full bg-slate-900 transition-all duration-300"
        style={{ height: `${100 - Math.max(5, Math.min(95, whitePercent))}%` }}
      />
    </div>
  );
}
