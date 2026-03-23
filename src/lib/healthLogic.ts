/** Evaluate health status based on vitals */
export type HealthStatus = "SAFE" | "WARNING" | "ALERT";

export interface VitalReading {
  temperature: number;
  heart_rate: number;
  spo2: number;
}

export interface HealthEvaluation {
  status: HealthStatus;
  recommendation: string;
}

export function evaluateHealth(vitals: VitalReading): HealthEvaluation {
  if (vitals.temperature > 38 || vitals.spo2 < 94) {
    return {
      status: "ALERT",
      recommendation: "Visit the clinic immediately",
    };
  }
  if (vitals.heart_rate > 100) {
    return {
      status: "WARNING",
      recommendation: "Rest and monitor your condition",
    };
  }
  return {
    status: "SAFE",
    recommendation: "You are in good health",
  };
}
