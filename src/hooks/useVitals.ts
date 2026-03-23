import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface VitalRecord {
  id: string;
  temperature: number;
  heart_rate: number;
  spo2: number;
  status: string;
  recommendation: string;
  created_at: string;
}

export function useVitals() {
  const [records, setRecords] = useState<VitalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial data
  useEffect(() => {
    async function fetchVitals() {
      const { data, error } = await supabase
        .from("vitals")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (!error && data) {
        setRecords(data as VitalRecord[]);
      }
      setLoading(false);
    }
    fetchVitals();
  }, []);

  // Subscribe to realtime inserts
  useEffect(() => {
    const channel = supabase
      .channel("vitals-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "vitals" },
        (payload) => {
          setRecords((prev) => [payload.new as VitalRecord, ...prev].slice(0, 50));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const latest = records[0] ?? null;

  return { records, latest, loading };
}
