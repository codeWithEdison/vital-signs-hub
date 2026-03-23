import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

interface VitalRecord {
  id: string;
  temperature: number;
  heart_rate: number;
  spo2: number;
  created_at: string;
}

interface VitalsChartProps {
  records: VitalRecord[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-card-hover text-xs">
      <p className="text-muted-foreground font-medium mb-2">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-semibold text-foreground">
            {entry.name === "Temp" ? `${entry.value}°C` : entry.name === "HR" ? `${entry.value} bpm` : `${entry.value}%`}
          </span>
        </div>
      ))}
    </div>
  );
};

export function VitalsChart({ records }: VitalsChartProps) {
  const chartData = [...records]
    .slice(0, 20)
    .reverse()
    .map((r) => ({
      time: format(new Date(r.created_at), "HH:mm"),
      Temp: r.temperature,
      HR: r.heart_rate,
      SpO2: r.spo2,
    }));

  if (chartData.length === 0) return null;

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="gradTemp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(230 80% 42%)" stopOpacity={0.15} />
              <stop offset="95%" stopColor="hsl(230 80% 42%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradHR" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(0 72% 51%)" stopOpacity={0.12} />
              <stop offset="95%" stopColor="hsl(0 72% 51%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradSpO2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(158 64% 36%)" stopOpacity={0.12} />
              <stop offset="95%" stopColor="hsl(158 64% 36%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 16% 90%)" vertical={false} />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 11, fill: "hsl(220 10% 46%)" }}
            axisLine={{ stroke: "hsl(220 16% 90%)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "hsl(220 10% 46%)" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="Temp"
            stroke="hsl(230 80% 42%)"
            strokeWidth={2}
            fill="url(#gradTemp)"
            dot={{ r: 3, fill: "hsl(230 80% 42%)", strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 2, stroke: "hsl(0 0% 100%)" }}
          />
          <Area
            type="monotone"
            dataKey="HR"
            stroke="hsl(0 72% 51%)"
            strokeWidth={2}
            fill="url(#gradHR)"
            dot={{ r: 3, fill: "hsl(0 72% 51%)", strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 2, stroke: "hsl(0 0% 100%)" }}
          />
          <Area
            type="monotone"
            dataKey="SpO2"
            stroke="hsl(158 64% 36%)"
            strokeWidth={2}
            fill="url(#gradSpO2)"
            dot={{ r: 3, fill: "hsl(158 64% 36%)", strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 2, stroke: "hsl(0 0% 100%)" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
