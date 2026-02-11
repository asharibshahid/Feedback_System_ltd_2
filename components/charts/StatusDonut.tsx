import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

type PieDatum = {
  name: string;
  value: number;
  color: string;
};

export function StatusDonut({ data }: { data: PieDatum[] }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[color:var(--bm-text)]">Entry overview</h2>
        <span className="text-xs uppercase tracking-[0.4em] text-[color:var(--bm-text-soft)]">Pulse</span>
      </div>
      <div className="flex items-center justify-center min-h-[220px] min-w-0">
        <ResponsiveContainer width={220} height={220}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius={70}
              outerRadius={100}
              startAngle={180}
              endAngle={540}
              paddingAngle={4}
              stroke="transparent"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-between">
        {data.map((entry) => (
          <div key={entry.name} className="flex flex-col items-center gap-1">
            <span className="text-xs uppercase tracking-[0.4em] text-[color:var(--bm-text-soft)]">
              {entry.name}
            </span>
            <span className="text-xl font-semibold text-[color:var(--bm-text)]">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

