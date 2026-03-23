import { Thermometer, Heart, Wind, Activity, Shield, Clock, Download, QrCode } from "lucide-react";
import { DashboardCard } from "@/components/DashboardCard";
import { StatusBadge } from "@/components/StatusBadge";
import { HistoryTable } from "@/components/HistoryTable";
import { VitalsChart } from "@/components/VitalsChart";
import { HealthPassCard } from "@/components/HealthPassCard";
import { useVitals } from "@/hooks/useVitals";
import type { HealthStatus } from "@/lib/healthLogic";

const Dashboard = () => {
  const { records, latest, loading } = useVitals();

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <nav className="bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-foreground tracking-tight">
              HealthKiosk
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Live Monitoring</span>
            <span className="relative flex h-2 w-2 ml-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-safe opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-status-safe" />
            </span>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative bg-primary overflow-hidden">
        {/* Decorative shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-primary-foreground/5" />
          <div className="absolute -bottom-32 -left-16 w-64 h-64 rounded-full bg-primary-foreground/5" />
          <div className="absolute top-1/2 right-1/4 w-40 h-40 rounded-full bg-primary-foreground/3" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 py-12 md:py-16">
          <div className="max-w-xl">
            <p className="text-primary-foreground/60 text-xs font-semibold uppercase tracking-[0.2em] mb-3">
              Rwanda Polytechnic · IoT Project
            </p>
            <h1 className="text-3xl md:text-[2.75rem] font-display font-bold text-primary-foreground leading-[1.15]">
              Contactless Vital Signs Kiosk
            </h1>
            <p className="mt-4 text-primary-foreground/65 text-sm md:text-base leading-relaxed max-w-md">
              Real-time health monitoring powered by ESP32, MAX30205 &amp; MAX30102 sensors.
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pb-20">
        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-28">
            <div className="flex flex-col items-center gap-4 text-muted-foreground">
              <div className="w-8 h-8 border-[3px] border-primary/30 border-t-primary rounded-full animate-spin" />
              <span className="text-sm">Loading vital signs…</span>
            </div>
          </div>
        )}

        {!loading && (
          <div className="space-y-8 -mt-8">
            {/* Health Pass + Vitals Grid */}
            {latest ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Health Pass - spans left */}
                <div className="lg:col-span-5">
                  <HealthPassCard
                    status={latest.status as HealthStatus}
                    recommendation={latest.recommendation}
                    temperature={latest.temperature}
                    heartRate={latest.heart_rate}
                    spo2={latest.spo2}
                    timestamp={latest.created_at}
                  />
                </div>

                {/* Vital Cards - right column */}
                <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <DashboardCard
                    title="Temperature"
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
              </div>
            ) : (
              <div className="bg-card rounded-2xl border border-border p-16 shadow-card text-center animate-slide-up">
                <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-5">
                  <Activity className="w-7 h-7 text-accent-foreground" />
                </div>
                <h2 className="font-display font-semibold text-xl text-foreground mb-2">Awaiting Data</h2>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  No readings yet. Data will appear automatically when ESP32 sensors send vital signs.
                </p>
              </div>
            )}

            {/* Chart */}
            {records.length > 1 && (
              <section className="bg-card rounded-2xl border border-border shadow-card animate-slide-up overflow-hidden">
                <div className="px-6 py-5 border-b border-border flex items-center justify-between">
                  <div>
                    <h2 className="font-display font-semibold text-base text-foreground">Vitals Trend</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Last {Math.min(records.length, 20)} readings</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary" /> Temp</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-destructive" /> HR</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-status-safe" /> SpO₂</span>
                  </div>
                </div>
                <div className="p-6">
                  <VitalsChart records={records} />
                </div>
              </section>
            )}

            {/* History Table */}
            <section className="bg-card rounded-2xl border border-border shadow-card animate-slide-up overflow-hidden">
              <div className="px-6 py-5 border-b border-border">
                <h2 className="font-display font-semibold text-base text-foreground">Reading History</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{records.length} total readings</p>
              </div>
              <HistoryTable records={records} />
            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/60">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>© 2026 Smart Health Kiosk — Rwanda Polytechnic</span>
          <span>ESP32 · MAX30205 · MAX30102 · Ultrasonic</span>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
