-- Add new columns to device_logs for analytics
ALTER TABLE public.device_logs 
ADD COLUMN IF NOT EXISTS light_cycle_hours integer,
ADD COLUMN IF NOT EXISTS irrigation_time time without time zone;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_device_logs_device_timestamp 
ON public.device_logs(device_id, created_at DESC);

-- Add comments for documentation
COMMENT ON COLUMN public.device_logs.light_cycle_hours IS 'Photoperiod Length (hours) - duration of light in daily cycle';
COMMENT ON COLUMN public.device_logs.irrigation_time IS 'Irrigation Event - time of last watering';

-- Enable replica identity for realtime updates
ALTER TABLE public.device_logs REPLICA IDENTITY FULL;