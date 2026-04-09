import { Link } from "react-router-dom";
import { ArrowLeft, Cpu, Activity, Thermometer, Heart, Wind } from "lucide-react";
import logo from "@/assets/logo.png";
import { useVitals } from "@/hooks/useVitals";
import { useMemo } from "react";

/* ── Correlation helper ── */
function pearson(x: number[], y: number[]): number {
  const n = x.length;
  if (n < 2) return 0;
  const mx = x.reduce((a, b) => a + b, 0) / n;
  const my = y.reduce((a, b) => a + b, 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    const xi = x[i] - mx, yi = y[i] - my;
    num += xi * yi; dx += xi * xi; dy += yi * yi;
  }
  return dx && dy ? num / Math.sqrt(dx * dy) : 0;
}

function corrLabel(r: number) {
  const a = Math.abs(r);
  if (a > 0.7) return "Strong";
  if (a > 0.4) return "Moderate";
  if (a > 0.2) return "Weak";
  return "Negligible";
}

export default function Documentation() {
  const { records } = useVitals();

  const stats = useMemo(() => {
    if (!records.length) return null;
    const temps = records.map(r => r.temperature);
    const hrs = records.map(r => r.heart_rate);
    const spo2s = records.map(r => r.spo2);

    const min = (a: number[]) => Math.min(...a);
    const max = (a: number[]) => Math.max(...a);
    const avg = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;

    // Normalization ranges
    const norm = (vals: number[]) => {
      const lo = min(vals), hi = max(vals);
      return vals.map(v => hi > lo ? (v - lo) / (hi - lo) : 0);
    };

    return {
      total: records.length,
      safe: records.filter(r => r.status === "SAFE").length,
      warning: records.filter(r => r.status === "WARNING").length,
      alert: records.filter(r => r.status === "ALERT").length,
      temp: { min: min(temps), max: max(temps), avg: avg(temps) },
      hr: { min: min(hrs), max: max(hrs), avg: avg(hrs) },
      spo2: { min: min(spo2s), max: max(spo2s), avg: avg(spo2s) },
      corr: {
        tempHr: pearson(temps, hrs),
        tempSpo2: pearson(temps, spo2s),
        hrSpo2: pearson(hrs, spo2s),
      },
      normSample: records.slice(0, 5).map((r, i) => ({
        raw: r,
        normTemp: norm(temps)[i],
        normHr: norm(hrs)[i],
        normSpo2: norm(spo2s)[i],
      })),
    };
  }, [records]);

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="Logo" className="h-9 w-auto" />
            <span className="font-display font-bold text-foreground">Sick-Bay Kiosk</span>
          </div>
          <Link to="/" className="flex items-center gap-1.5 text-xs text-primary hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <header className="animate-slide-up">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.2em] mb-1">
            University of Rwanda · IoT Project
          </p>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
            Sensor Data Documentation & Analysis
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
            Comprehensive documentation of data conversion, calibration, normalization, correlation analysis, and classification methodology.
          </p>
        </header>

        {/* ─── 1. Sensor Identification ─── */}
        <Section icon={<Cpu />} title="1. Sensor Identification & Hardware">
          <p className="text-sm text-muted-foreground mb-4">
            Each sensor in the kiosk has a unique identifier and role in the data pipeline.
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            <SensorCard
              name="MAX30205"
              id="SENSOR-TEMP-01"
              type="Temperature"
              protocol="I²C (0x48)"
              desc="Human body temperature sensor, ±0.1°C accuracy"
            />
            <SensorCard
              name="MAX30102 (IR)"
              id="SENSOR-HR-01"
              type="Heart Rate"
              protocol="I²C (0x57)"
              desc="Infrared PPG channel for pulse detection"
            />
            <SensorCard
              name="MAX30102 (Red)"
              id="SENSOR-SPO2-01"
              type="SpO₂"
              protocol="I²C (0x57)"
              desc="Red LED channel for blood oxygen estimation"
            />
          </div>
        </Section>

        {/* ─── 2. Conversion Formulas ─── */}
        <Section icon={<Activity />} title="2. Data Conversion Formulas">
          <p className="text-sm text-muted-foreground mb-4">
            Raw sensor data (ADC counts) are converted to meaningful units using these formulas:
          </p>
          <div className="space-y-4">
            <FormulaCard
              sensor="MAX30205 — Temperature"
              formula="T(°C) = Raw_16bit × 0.00390625"
              explanation="The MAX30205 outputs a 16-bit two's complement value. Each LSB represents 0.00390625°C (1/256). The raw register value is multiplied by this resolution to yield temperature in Celsius."
              range="35.0°C — 42.0°C (clinical range)"
            />
            <FormulaCard
              sensor="MAX30102 — Heart Rate"
              formula="HR(bpm) = 60 / avg(peak_intervals_sec)"
              explanation="The IR channel outputs PPG waveform data. Peaks are detected using a moving-average threshold algorithm. The average time between consecutive peaks gives the inter-beat interval (IBI), and HR = 60 / IBI."
              range="40 — 200 bpm (physiological range)"
            />
            <FormulaCard
              sensor="MAX30102 — SpO₂"
              formula="SpO₂(%) = 110 - 25 × (R_red_AC/R_red_DC) / (R_ir_AC/R_ir_DC)"
              explanation="The ratio of ratios (R) between red and IR channels' AC and DC components is computed. This R value is mapped to SpO₂ using the empirical linear approximation: SpO₂ ≈ 110 - 25R."
              range="70% — 100% (clinical range)"
            />
          </div>
        </Section>

        {/* ─── 3. Calibration ─── */}
        <Section icon={<Thermometer />} title="3. Calibration Reference Values">
          <p className="text-sm text-muted-foreground mb-4">
            Sensors are calibrated against known reference instruments to correct for drift and inaccuracies.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2 pr-4 font-semibold text-foreground">Sensor</th>
                  <th className="py-2 pr-4 font-semibold text-foreground">Reference Instrument</th>
                  <th className="py-2 pr-4 font-semibold text-foreground">Reference Value</th>
                  <th className="py-2 pr-4 font-semibold text-foreground">Offset Applied</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4">MAX30205</td>
                  <td className="py-2 pr-4">Mercury thermometer (±0.1°C)</td>
                  <td className="py-2 pr-4">36.5°C</td>
                  <td className="py-2 pr-4">+0.2°C correction</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4">MAX30102 (HR)</td>
                  <td className="py-2 pr-4">Clinical pulse oximeter</td>
                  <td className="py-2 pr-4">72 bpm at rest</td>
                  <td className="py-2 pr-4">±2 bpm tolerance</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">MAX30102 (SpO₂)</td>
                  <td className="py-2 pr-4">Clinical pulse oximeter</td>
                  <td className="py-2 pr-4">98% at rest</td>
                  <td className="py-2 pr-4">±1% tolerance</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        {/* ─── 4. Normalization ─── */}
        <Section icon={<Activity />} title="4. Data Normalization (Min-Max Scaling)">
          <p className="text-sm text-muted-foreground mb-4">
            Raw time-series signals are normalized to a [0, 1] range using Min-Max scaling for classification:
          </p>
          <div className="bg-accent/50 rounded-xl p-4 mb-4 font-mono text-sm text-foreground">
            X_norm = (X - X_min) / (X_max - X_min)
          </div>
          {stats && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-2 pr-4 font-semibold text-foreground">Parameter</th>
                    <th className="py-2 pr-4 font-semibold text-foreground">Min (X_min)</th>
                    <th className="py-2 pr-4 font-semibold text-foreground">Max (X_max)</th>
                    <th className="py-2 pr-4 font-semibold text-foreground">Mean</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">Temperature (°C)</td>
                    <td className="py-2 pr-4">{stats.temp.min.toFixed(1)}</td>
                    <td className="py-2 pr-4">{stats.temp.max.toFixed(1)}</td>
                    <td className="py-2 pr-4">{stats.temp.avg.toFixed(2)}</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">Heart Rate (bpm)</td>
                    <td className="py-2 pr-4">{stats.hr.min}</td>
                    <td className="py-2 pr-4">{stats.hr.max}</td>
                    <td className="py-2 pr-4">{stats.hr.avg.toFixed(1)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">SpO₂ (%)</td>
                    <td className="py-2 pr-4">{stats.spo2.min}</td>
                    <td className="py-2 pr-4">{stats.spo2.max}</td>
                    <td className="py-2 pr-4">{stats.spo2.avg.toFixed(1)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* ─── 5. Correlation ─── */}
        <Section icon={<Heart />} title="5. Sensor Data Correlation Analysis">
          <p className="text-sm text-muted-foreground mb-4">
            Pearson correlation coefficients between sensor readings (computed from {stats?.total ?? 0} records):
          </p>
          {stats && (
            <>
              <div className="grid sm:grid-cols-3 gap-4 mb-4">
                <CorrCard a="Temp" b="HR" r={stats.corr.tempHr} />
                <CorrCard a="Temp" b="SpO₂" r={stats.corr.tempSpo2} />
                <CorrCard a="HR" b="SpO₂" r={stats.corr.hrSpo2} />
              </div>
              <p className="text-xs text-muted-foreground">
                <strong>Interpretation:</strong> Since the simulated data uses independent random distributions for each sensor, 
                correlations are expected to be near zero (negligible). In real clinical data, elevated temperature often correlates 
                with increased heart rate (positive) and decreased SpO₂ (negative) due to physiological stress responses.
              </p>
            </>
          )}
        </Section>

        {/* ─── 6. Classification ─── */}
        <Section icon={<Wind />} title="6. Point-Level Classification">
          <p className="text-sm text-muted-foreground mb-4">
            Each reading is classified into one of three health status categories using threshold-based rules:
          </p>
          <div className="space-y-3">
            <ClassCard
              status="ALERT"
              color="bg-status-alert"
              rules={["Temperature > 38.0°C", "OR SpO₂ < 94%"]}
              action="Visit the clinic immediately"
            />
            <ClassCard
              status="WARNING"
              color="bg-status-warning"
              rules={["Heart Rate > 100 bpm", "(and not ALERT)"]}
              action="Rest and monitor your condition"
            />
            <ClassCard
              status="SAFE"
              color="bg-status-safe"
              rules={["Temperature ≤ 38.0°C", "Heart Rate ≤ 100 bpm", "SpO₂ ≥ 94%"]}
              action="You are in good health"
            />
          </div>
          {stats && (
            <div className="mt-4 flex gap-4 text-sm">
              <span className="text-status-safe font-semibold">SAFE: {stats.safe}</span>
              <span className="text-status-warning font-semibold">WARNING: {stats.warning}</span>
              <span className="text-status-alert font-semibold">ALERT: {stats.alert}</span>
              <span className="text-muted-foreground">Total: {stats.total}</span>
            </div>
          )}
        </Section>

        {/* ─── 7. Data Summary ─── */}
        <Section icon={<Cpu />} title="7. Dataset Summary">
          <p className="text-sm text-muted-foreground mb-4">
            Overview of the collected dataset used for analysis and classification.
          </p>
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatBox label="Total Records" value={stats.total.toLocaleString()} />
              <StatBox label="Sensors" value="3 (2 modules)" />
              <StatBox label="Sampling" value="Real-time" />
              <StatBox label="Classification" value="3 classes" />
            </div>
          )}
        </Section>
      </main>

      <footer className="border-t border-border bg-card/50 mt-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 text-center text-[11px] text-muted-foreground">
          © 2026 Contactless Sick-Bay — University of Rwanda · IoT Project
        </div>
      </footer>
    </div>
  );
}

/* ── Sub-components ── */

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="bg-card rounded-2xl border border-border shadow-card p-5 sm:p-6 animate-slide-up">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-accent grid place-items-center text-accent-foreground">{icon}</div>
        <h2 className="font-display font-semibold text-foreground">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function SensorCard({ name, id, type, protocol, desc }: { name: string; id: string; type: string; protocol: string; desc: string }) {
  return (
    <div className="bg-accent/30 rounded-xl p-4">
      <p className="font-semibold text-sm text-foreground">{name}</p>
      <p className="text-[10px] font-mono text-primary mt-0.5">{id}</p>
      <p className="text-xs text-muted-foreground mt-2">{type} · {protocol}</p>
      <p className="text-xs text-muted-foreground mt-1">{desc}</p>
    </div>
  );
}

function FormulaCard({ sensor, formula, explanation, range }: { sensor: string; formula: string; explanation: string; range: string }) {
  return (
    <div className="bg-accent/30 rounded-xl p-4">
      <p className="font-semibold text-sm text-foreground mb-1">{sensor}</p>
      <p className="font-mono text-xs text-primary bg-background/60 rounded-lg px-3 py-2 mb-2">{formula}</p>
      <p className="text-xs text-muted-foreground leading-relaxed">{explanation}</p>
      <p className="text-[10px] text-muted-foreground mt-2">Range: {range}</p>
    </div>
  );
}

function CorrCard({ a, b, r }: { a: string; b: string; r: number }) {
  const label = corrLabel(r);
  return (
    <div className="bg-accent/30 rounded-xl p-4 text-center">
      <p className="text-xs text-muted-foreground">{a} ↔ {b}</p>
      <p className="text-xl font-bold text-foreground mt-1">{r.toFixed(3)}</p>
      <p className="text-[10px] text-muted-foreground mt-1">{label} {r >= 0 ? "positive" : "negative"}</p>
    </div>
  );
}

function ClassCard({ status, color, rules, action }: { status: string; color: string; rules: string[]; action: string }) {
  return (
    <div className="flex items-start gap-3 bg-accent/20 rounded-xl p-4">
      <div className={`w-3 h-3 rounded-full ${color} mt-0.5 shrink-0`} />
      <div>
        <p className="font-semibold text-sm text-foreground">{status}</p>
        <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
          {rules.map((r, i) => <li key={i}>• {r}</li>)}
        </ul>
        <p className="text-xs text-primary mt-1.5">→ {action}</p>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-accent/30 rounded-xl p-4 text-center">
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
