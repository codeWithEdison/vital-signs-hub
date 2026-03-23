import { StatusBadge } from "./StatusBadge";
import type { HealthStatus } from "@/lib/healthLogic";
import { format } from "date-fns";
import { Thermometer, Heart, Wind } from "lucide-react";

interface VitalRecord {
  id: string;
  temperature: number;
  heart_rate: number;
  spo2: number;
  status: string;
  recommendation: string;
  created_at: string;
}

interface HistoryTableProps {
  records: VitalRecord[];
}

export function HistoryTable({ records }: HistoryTableProps) {
  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4">
          <Thermometer className="w-5 h-5 text-muted-foreground/50" />
        </div>
        <p className="font-medium text-sm">No readings yet</p>
        <p className="text-xs mt-1">Data will appear when sensors send readings</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="text-left py-3 px-5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Time</th>
            <th className="text-left py-3 px-5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><Thermometer className="w-3 h-3" /> Temp</span>
            </th>
            <th className="text-left py-3 px-5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><Heart className="w-3 h-3" /> HR</span>
            </th>
            <th className="text-left py-3 px-5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><Wind className="w-3 h-3" /> SpO₂</span>
            </th>
            <th className="text-left py-3 px-5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record, i) => (
            <tr
              key={record.id}
              className="border-b border-border/40 hover:bg-muted/20 transition-colors"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <td className="py-3 px-5 text-xs text-muted-foreground font-medium">
                {format(new Date(record.created_at), "MMM d, HH:mm")}
              </td>
              <td className="py-3 px-5 text-sm font-semibold text-foreground tabular-nums">
                {record.temperature.toFixed(1)}°C
              </td>
              <td className="py-3 px-5 text-sm font-semibold text-foreground tabular-nums">
                {record.heart_rate} <span className="text-xs text-muted-foreground font-normal">bpm</span>
              </td>
              <td className="py-3 px-5 text-sm font-semibold text-foreground tabular-nums">
                {record.spo2}%
              </td>
              <td className="py-3 px-5">
                <StatusBadge status={record.status as HealthStatus} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
