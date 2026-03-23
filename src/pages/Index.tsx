import { useEffect, useRef } from "react";
import { Thermometer, Heart, Wind, Activity, Clock } from "lucide-react";
import logo from "@/assets/logo.png";
import { DashboardCard } from "@/components/DashboardCard";
import { HistoryTable } from "@/components/HistoryTable";
import { VitalsChart } from "@/components/VitalsChart";
import { HealthPassCard } from "@/components/HealthPassCard";
import { useVitals } from "@/hooks/useVitals";
import { downloadHealthPassPDF } from "@/lib/pdfHealthPass";
import type { HealthStatus } from "@/lib/healthLogic";

/* Auto-download PDF when arriving from QR scan */
function useAutoDownloadFromQR() {
  const triggered = useRef(false);
  useEffect(() => {
    if (triggered.current) return;
    const p = new URLSearchParams(window.location.search);
    if (p.get("download") !== "1") return;
    triggered.current = true;

    downloadHealthPassPDF(
      (p.get("s") || "SAFE") as HealthStatus,
      parseFloat(p.get("t") || "36.5"),
      parseInt(p.get("hr") || "72", 10),
      parseInt(p.get("o2") || "98", 10),
      p.get("r") || "You are in good health",
      p.get("ts") || new Date().toISOString()
    );
    window.history.replaceState({}, "", window.location.pathname);
  }, []);
}

const Dashboard = () => {
  useAutoDownloadFromQR();
  const { records, latest, loading } = useVitals();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ─── Navbar ─── */}
      <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="Contactless Sick-Bay logo" className="h-9 w-auto" />
            <span className="font-display font-bold text-foreground">Sick-Bay Kiosk</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Live</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute h-full w-full rounded-full bg-status-safe opacity-75" />
              <span className="relative rounded-full h-2 w-2 bg-status-safe" />
            </span>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <header className="bg-primary relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary-foreground/[0.04]" />
          <div className="absolute bottom-0 -left-20 w-56 h-56 rounded-full bg-primary-foreground/[0.04]" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-14">
          <p className="text-primary-foreground/50 text-[11px] font-semibold uppercase tracking-[0.2em] mb-2">
            University of Rwanda · IoT Project
          </p>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-primary-foreground leading-tight">
            Contactless Vital Signs Kiosk
          </h1>
          <p className="mt-3 text-primary-foreground/60 text-sm max-w-lg">
            Real-time health monitoring powered by ESP32, MAX30205 &amp; MAX30102 sensors.
          </p>
        </div>
      </header>

      {/* ─── Content ─── */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <div className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
              <span className="text-sm">Loading vital signs…</span>
            </div>
          </div>
        ) : !latest ? (
          <div className="bg-card rounded-2xl border border-border p-12 text-center animate-slide-up">
            <div className="w-14 h-14 rounded-2xl bg-accent grid place-items-center mx-auto mb-4">
              <Activity className="w-7 h-7 text-accent-foreground" />
            </div>
            <h2 className="font-display font-semibold text-lg text-foreground mb-1">Awaiting Data</h2>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Vital signs will appear automatically when ESP32 sensors send readings.
            </p>
          </div>
        ) : (
          <>
            {/* Row 1 — Health Pass + Metric cards side by side */}
            <section className="grid grid-cols-1 lg:grid-cols-5 gap-5 animate-slide-up">
              {/* Health Pass (left) */}
              <div className="lg:col-span-2">
                <HealthPassCard
                  status={latest.status as HealthStatus}
                  recommendation={latest.recommendation}
                  temperature={latest.temperature}
                  heartRate={latest.heart_rate}
                  spo2={latest.spo2}
                  timestamp={latest.created_at}
                />
              </div>

              {/* Metric cards (right, stacked) */}
              <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">
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
            </section>

            {/* Row 2 — Chart */}
            {records.length > 1 && (
              <section className="bg-card rounded-2xl border border-border shadow-card overflow-hidden animate-slide-up">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <div>
                    <h2 className="font-display font-semibold text-sm text-foreground">Vitals Trend</h2>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Last {Math.min(records.length, 20)} readings
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" />Temp</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive" />HR</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-status-safe" />SpO₂</span>
                  </div>
                </div>
                <div className="p-4">
                  <VitalsChart records={records} />
                </div>
              </section>
            )}

            {/* Row 3 — History Table */}
            <section className="bg-card rounded-2xl border border-border shadow-card overflow-hidden animate-slide-up">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="font-display font-semibold text-sm text-foreground">Reading History</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">{records.length} total readings</p>
              </div>
              <HistoryTable records={records} />
            </section>
          </>
        )}
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border bg-card/50 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-1 text-[11px] text-muted-foreground">
          <span>© 2026 Smart Health Kiosk — University of Rwanda</span>
          <span>ESP32 · MAX30205 · MAX30102</span>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
