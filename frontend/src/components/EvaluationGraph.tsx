import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

interface EvaluationGraphProps {
  points: Array<{ move: number; eval: number }>;
}

export function EvaluationGraph({ points }: EvaluationGraphProps) {
  return (
    <div className="h-56 w-full rounded-xl border border-slate-700 bg-slate-900/80 p-3">
      <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-300">
        Evaluation Graph
      </p>
      <ResponsiveContainer width="100%" height="88%">
        <LineChart data={points}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="move" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" domain={[-10, 10]} />
          <Tooltip
            contentStyle={{
              background: "#111827",
              border: "1px solid #334155",
              color: "#e2e8f0"
            }}
          />
          <Line
            type="monotone"
            dataKey="eval"
            stroke="#22c55e"
            strokeWidth={2.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
