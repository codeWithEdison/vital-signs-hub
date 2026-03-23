import { useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { downloadHealthPassPDF } from "@/lib/pdfHealthPass";
import type { HealthStatus } from "@/lib/healthLogic";
import { format } from "date-fns";

interface HealthPassCardProps {
  status: HealthStatus;
  recommendation: string;
  temperature: number;
  heartRate: number;
  spo2: number;
  timestamp: string;
}

function getQRImageData(): Promise<string | null> {
  return new Promise((resolve) => {
    const svg = document.querySelector("#health-pass-qr svg");
    if (!svg) return resolve(null);
    const data = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = 200;
      c.height = 200;
      c.getContext("2d")?.drawImage(img, 0, 0, 200, 200);
      resolve(c.toDataURL("image/png"));
    };
    img.onerror = () => resolve(null);
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(data)));
  });
}

export function HealthPassCard({
  status,
  recommendation,
  temperature,
  heartRate,
  spo2,
  timestamp,
}: HealthPassCardProps) {
  const passParams = new URLSearchParams({
    download: "1",
    s: status,
    t: temperature.toFixed(1),
    hr: String(heartRate),
    o2: String(spo2),
    r: recommendation,
    ts: timestamp,
  });
  const qrUrl = `${window.location.origin}/?${passParams.toString()}`;

  const handleDownload = useCallback(async () => {
    const qrImg = await getQRImageData();
    downloadHealthPassPDF(status, temperature, heartRate, spo2, recommendation, timestamp, qrImg);
  }, [status, temperature, heartRate, spo2, recommendation, timestamp]);

  const barColor = status === "SAFE"
    ? "bg-status-safe"
    : status === "WARNING"
    ? "bg-status-warning"
    : "bg-status-alert";

  return (
    <div className="bg-card rounded-2xl border border-border shadow-card animate-slide-up overflow-hidden h-full flex flex-col">
      <div className="flex flex-col items-center px-5 py-6 flex-1 justify-center">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-3">
          Digital Health Pass
        </p>

        <StatusBadge status={status} size="lg" />

        <p className="mt-2.5 text-xs text-muted-foreground text-center leading-relaxed max-w-[220px]">
          {recommendation}
        </p>

        {/* QR */}
        <div id="health-pass-qr" className="mt-4 p-2.5 bg-background rounded-xl border border-border">
          <QRCodeSVG value={qrUrl} size={100} level="M" bgColor="transparent" fgColor="hsl(228 24% 16%)" />
        </div>
        <p className="text-[9px] text-muted-foreground mt-1.5">Scan to download on your device</p>

        <p className="text-[9px] text-muted-foreground mt-2">
          {format(new Date(timestamp), "dd MMM yyyy · HH:mm")}
        </p>

        <button
          onClick={handleDownload}
          className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Download PDF
        </button>
      </div>
    </div>
  );
}
