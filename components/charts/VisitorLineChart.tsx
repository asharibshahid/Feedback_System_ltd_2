import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
type LineData = {
  day: string;
  value: number;
};

export function VisitorLineChart({ data }: { data: LineData[] }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[color:var(--bm-text)]">Visitor trend</h2>
        <span className="text-xs uppercase tracking-[0.4em] text-[color:var(--bm-text-soft)]">Live</span>
      </div>
      <div className="h-64 min-h-[260px] min-w-0">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data}>
            <CartesianGrid stroke="#E7E1DD" vertical={false} />
            <XAxis dataKey="day" axisLine={false} tick={{ fill: "#8A7D77" }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--brand-accent)"
              strokeWidth={4}
              dot={false}
              animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
