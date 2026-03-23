import { StatusBadge } from "./StatusBadge";
import type { HealthStatus } from "@/lib/healthLogic";
import { format } from "date-fns";

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
        <svg className="w-16 h-16 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="font-medium">No readings yet</p>
        <p className="text-sm mt-1">Vital signs will appear here when data is received</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Time</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Temp (°C)</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Heart Rate</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">SpO2</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recommendation</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
              <td className="py-3 px-4 text-sm text-muted-foreground">
                {format(new Date(record.created_at), "MMM d, HH:mm:ss")}
              </td>
              <td className="py-3 px-4 text-sm font-medium text-foreground">{record.temperature.toFixed(1)}</td>
              <td className="py-3 px-4 text-sm font-medium text-foreground">{record.heart_rate}</td>
              <td className="py-3 px-4 text-sm font-medium text-foreground">{record.spo2}%</td>
              <td className="py-3 px-4">
                <StatusBadge status={record.status as HealthStatus} />
              </td>
              <td className="py-3 px-4 text-sm text-muted-foreground">{record.recommendation}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
