import { Thermometer, Heart, Wind, Activity, Shield, Clock } from "lucide-react";
import { DashboardCard } from "@/components/DashboardCard";
import { StatusBadge } from "@/components/StatusBadge";
import { HistoryTable } from "@/components/HistoryTable";
import { VitalsChart } from "@/components/VitalsChart";
import { useVitals } from "@/hooks/useVitals";
import type { HealthStatus } from "@/lib/healthLogic";

const Dashboard = () => {
  const { records, latest, loading } = useVitals();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <nav className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg text-foreground">
              HealthKiosk
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Live Monitoring</span>
            <span className="relative flex h-2.5 w-2.5 ml-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-safe opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-status-safe"></span>
            </span>
          </div>
        </div>
      </nav>

      {/* Hero Header */}
      <header className="bg-primary">
        <div className="container max-w-6xl mx-auto px-4 py-10 md:py-14">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground leading-tight">
              Smart Health Kiosk
              <br />
              <span className="opacity-80">Dashboard</span>
            </h1>
            <p className="mt-3 text-primary-foreground/70 text-base md:text-lg max-w-lg">
              Contactless vital signs monitoring — real-time IoT health data from ESP32 sensors.
            </p>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 -mt-6 pb-16 space-y-6">
        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-4 text-muted-foreground">
              <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium">Loading vital signs...</span>
            </div>
          </div>
        )}

        {!loading && (
          <>
            {/* Digital Health Pass */}
            {latest && (
              <div className="bg-card rounded-2xl border border-border p-8 shadow-card animate-slide-up text-center">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-4">
                  Digital Health Pass
                </p>
                <StatusBadge status={latest.status as HealthStatus} size="lg" />
                <p className="mt-5 text-muted-foreground text-sm max-w-md mx-auto">
                  {latest.recommendation}
                </p>
              </div>
            )}

            {/* Vital Cards */}
            {latest ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <DashboardCard
                  title="Body Temperature"
                  value={latest.temperature.toFixed(1)}
                  unit="°C"
                  icon={<Thermometer className="w-5 h-5" />}
                  variant="primary"
                />
                <DashboardCard
                  title="Heart Rate"
                  value={latest.heart_rate}
                  unit="bpm"
                  icon={<Heart className="w-5 h-5" />}
                  variant="destructive"
                />
                <DashboardCard
                  title="SpO₂"
                  value={latest.spo2}
                  unit="%"
                  icon={<Wind className="w-5 h-5" />}
                  variant="safe"
                />
              </div>
            ) : (
              <div className="bg-card rounded-2xl border border-border p-14 shadow-card text-center">
                <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-5">
                  <Activity className="w-8 h-8 text-accent-foreground" />
                </div>
                <h2 className="font-display font-semibold text-xl text-foreground mb-2">
                  Awaiting Data
                </h2>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  No vital sign readings yet. Data will appear here automatically when ESP32 sensors send readings.
                </p>
              </div>
            )}

            {/* Chart */}
            {records.length > 1 && (
              <section className="bg-card rounded-2xl border border-border p-6 shadow-card animate-slide-up">
                <h2 className="font-display font-semibold text-lg text-foreground mb-5">
                  Vitals Over Time
                </h2>
                <VitalsChart records={records} />
              </section>
            )}

            {/* History Table */}
            <section className="bg-card rounded-2xl border border-border shadow-card animate-slide-up overflow-hidden">
              <div className="px-6 py-5 border-b border-border">
                <h2 className="font-display font-semibold text-lg text-foreground">
                  Reading History
                </h2>
              </div>
              <HistoryTable records={records} />
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="container max-w-6xl mx-auto px-4 py-6 flex items-center justify-between text-xs text-muted-foreground">
          <span>© 2026 Smart Health Kiosk — Rwanda Polytechnic</span>
          <span>Powered by IoT · ESP32</span>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
