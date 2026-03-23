import type { ReactNode } from "react";

interface DashboardCardProps {
  title: string;
  value: string | number;
  unit: string;
  icon: ReactNode;
  variant?: "primary" | "destructive" | "safe";
}

const variantStyles = {
  primary: "bg-accent text-accent-foreground",
  destructive: "bg-status-alert-bg text-status-alert",
  safe: "bg-status-safe-bg text-status-safe",
};

export function DashboardCard({ title, value, unit, icon, variant = "primary" }: DashboardCardProps) {
  return (
    <div className="bg-card rounded-xl border border-border px-4 py-3 shadow-card hover:shadow-card-hover transition-shadow flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg ${variantStyles[variant]} grid place-items-center shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground leading-none mb-0.5">{title}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-display font-bold text-foreground leading-none">{value}</span>
          <span className="text-xs text-muted-foreground">{unit}</span>
        </div>
      </div>
    </div>
  );
}
