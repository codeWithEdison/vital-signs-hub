import type { ReactNode } from "react";

interface DashboardCardProps {
  title: string;
  value: string | number;
  unit: string;
  icon: ReactNode;
  variant?: "primary" | "destructive" | "safe";
}

const variantStyles = {
  primary: {
    iconBg: "bg-accent text-accent-foreground",
    bar: "bg-primary",
  },
  destructive: {
    iconBg: "bg-status-alert-bg text-status-alert",
    bar: "bg-destructive",
  },
  safe: {
    iconBg: "bg-status-safe-bg text-status-safe",
    bar: "bg-status-safe",
  },
};

export function DashboardCard({ title, value, unit, icon, variant = "primary" }: DashboardCardProps) {
  const style = variantStyles[variant];

  return (
    <div className="group relative bg-card rounded-2xl border border-border p-6 shadow-card hover:shadow-card-hover transition-all duration-300 animate-slide-up overflow-hidden">
      {/* Accent top bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${style.bar}`} />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl font-display font-bold text-foreground tracking-tight">{value}</span>
            <span className="text-sm font-medium text-muted-foreground">{unit}</span>
          </div>
        </div>
        <div className={`p-3 rounded-xl ${style.iconBg}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
