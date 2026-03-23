-- Create vitals table for IoT health data
CREATE TABLE public.vitals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  temperature FLOAT NOT NULL,
  heart_rate INTEGER NOT NULL,
  spo2 INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'SAFE',
  recommendation TEXT NOT NULL DEFAULT 'You are in good health',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.vitals ENABLE ROW LEVEL SECURITY;

-- Allow public read access (IoT kiosk data is public)
CREATE POLICY "Anyone can read vitals" ON public.vitals FOR SELECT USING (true);

-- Allow public insert (ESP32 devices insert data)
CREATE POLICY "Anyone can insert vitals" ON public.vitals FOR INSERT WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.vitals;