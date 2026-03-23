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
    <div className="group relative bg-card rounded-2xl border border-border p-5 shadow-card hover:shadow-card-hover transition-all duration-300 animate-slide-up overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-[3px] ${style.bar}`} />

      <div className={`w-10 h-10 rounded-xl ${style.iconBg} flex items-center justify-center mb-4`}>
        {icon}
      </div>

      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{title}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-display font-bold text-foreground tracking-tight">{value}</span>
        <span className="text-sm font-medium text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}
