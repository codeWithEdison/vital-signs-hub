import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
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

export function VitalsChart({ records }: VitalsChartProps) {
  // Show last 20 records in chronological order
  const chartData = [...records]
    .slice(0, 20)
    .reverse()
    .map((r) => ({
      time: format(new Date(r.created_at), "HH:mm"),
      Temperature: r.temperature,
      "Heart Rate": r.heart_rate,
      SpO2: r.spo2,
    }));

  if (chartData.length === 0) return null;

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(210 20% 90%)" />
          <XAxis dataKey="time" tick={{ fontSize: 12 }} stroke="hsl(210 10% 50%)" />
          <YAxis tick={{ fontSize: 12 }} stroke="hsl(210 10% 50%)" />
          <Tooltip
            contentStyle={{
              borderRadius: "0.75rem",
              border: "1px solid hsl(210 20% 90%)",
              boxShadow: "0 10px 25px -5px rgb(0 0 0 / 0.08)",
            }}
          />
          <Legend />
          <Line type="monotone" dataKey="Temperature" stroke="hsl(199 89% 48%)" strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="Heart Rate" stroke="hsl(0 72% 51%)" strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="SpO2" stroke="hsl(152 69% 45%)" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
