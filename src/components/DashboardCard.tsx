import type { ReactNode } from "react";

interface DashboardCardProps {
  title: string;
  value: string | number;
  unit: string;
  icon: ReactNode;
  accentColor?: string;
}

export function DashboardCard({ title, value, unit, icon, accentColor }: DashboardCardProps) {
  return (
    <div className="group relative bg-card rounded-xl border border-border p-6 shadow-card hover:shadow-card-hover transition-all duration-300 animate-slide-up">
      {/* Accent top bar */}
      <div className={`absolute top-0 left-6 right-6 h-0.5 rounded-b ${accentColor ?? "gradient-primary"}`} />
      
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-display font-bold text-foreground">{value}</span>
            <span className="text-sm text-muted-foreground">{unit}</span>
          </div>
        </div>
        <div className="p-2.5 rounded-lg bg-secondary text-primary">
          {icon}
        </div>
      </div>
    </div>
  );
}
