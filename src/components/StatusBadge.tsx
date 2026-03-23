import type { HealthStatus } from "@/lib/healthLogic";
import { ShieldCheck, AlertTriangle, AlertCircle } from "lucide-react";

const statusConfig = {
  SAFE: {
    label: "SAFE",
    icon: ShieldCheck,
    className: "bg-status-safe-bg text-status-safe border-status-safe/20",
    glowClass: "glow-safe",
  },
  WARNING: {
    label: "WARNING",
    icon: AlertTriangle,
    className: "bg-status-warning-bg text-status-warning border-status-warning/20",
    glowClass: "glow-warning",
  },
  ALERT: {
    label: "ALERT",
    icon: AlertCircle,
    className: "bg-status-alert-bg text-status-alert border-status-alert/20",
    glowClass: "glow-alert",
  },
};

interface StatusBadgeProps {
  status: HealthStatus;
  size?: "sm" | "lg";
}

export function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  if (size === "lg") {
    return (
      <div
        className={`inline-flex items-center gap-3 px-8 py-4 rounded-2xl border-2 font-display font-bold text-xl ${config.className} ${config.glowClass} animate-pulse-gentle`}
      >
        <Icon className="w-7 h-7" />
        {config.label}
      </div>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-bold uppercase tracking-wide ${config.className}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}
