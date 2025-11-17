-- Enable RLS on devices and device_logs tables
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to recreate them with correct specifications
DROP POLICY IF EXISTS "Users manage their devices" ON public.devices;
DROP POLICY IF EXISTS "Users view their logs" ON public.device_logs;

-- Create RLS policy for devices table
CREATE POLICY "Users manage their devices"
ON public.devices
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create RLS policy for device_logs table
CREATE POLICY "Users view their logs"
ON public.device_logs
FOR ALL
TO authenticated
USING (device_id IN (SELECT id FROM devices WHERE user_id = auth.uid()))
WITH CHECK (device_id IN (SELECT id FROM devices WHERE user_id = auth.uid()));