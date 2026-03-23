import { Thermometer, Heart, Wind, Activity } from "lucide-react";
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
      {/* Header */}
      <header className="gradient-hero">
        <div className="container max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/20">
              <Activity className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-primary-foreground">
              Smart Health Kiosk Dashboard
            </h1>
          </div>
          <p className="text-primary-foreground/70 text-sm md:text-base">
            Contactless vital signs monitoring — real-time IoT health data
          </p>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 -mt-4 pb-12 space-y-8">
        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Loading vital signs...</span>
            </div>
          </div>
        )}

        {!loading && (
          <>
            {/* Digital Health Pass */}
            {latest && (
              <div className="bg-card rounded-xl border border-border p-6 md:p-8 shadow-card animate-slide-up text-center">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                  Digital Health Pass
                </p>
                <StatusBadge status={latest.status as HealthStatus} size="lg" />
                <p className="mt-4 text-muted-foreground">{latest.recommendation}</p>
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
                  accentColor="bg-primary"
                />
                <DashboardCard
                  title="Heart Rate"
                  value={latest.heart_rate}
                  unit="bpm"
                  icon={<Heart className="w-5 h-5" />}
                  accentColor="bg-destructive"
                />
                <DashboardCard
                  title="SpO2"
                  value={latest.spo2}
                  unit="%"
                  icon={<Wind className="w-5 h-5" />}
                  accentColor="bg-accent"
                />
              </div>
            ) : (
              <div className="bg-card rounded-xl border border-border p-12 shadow-card text-center">
                <Activity className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                <h2 className="font-display font-semibold text-lg text-foreground mb-1">Awaiting Data</h2>
                <p className="text-sm text-muted-foreground">
                  No vital sign readings yet. Data will appear here automatically when the ESP32 sensors send readings.
                </p>
              </div>
            )}

            {/* Chart */}
            {records.length > 1 && (
              <section className="bg-card rounded-xl border border-border p-6 shadow-card animate-slide-up">
                <h2 className="font-display font-semibold text-lg text-foreground mb-4">Vitals Over Time</h2>
                <VitalsChart records={records} />
              </section>
            )}

            {/* History Table */}
            <section className="bg-card rounded-xl border border-border shadow-card animate-slide-up overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h2 className="font-display font-semibold text-lg text-foreground">Reading History</h2>
              </div>
              <HistoryTable records={records} />
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
