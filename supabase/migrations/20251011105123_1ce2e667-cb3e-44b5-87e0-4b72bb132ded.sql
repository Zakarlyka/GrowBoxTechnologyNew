-- Fix security warnings: Add RLS policies for device_pairing_temp table
-- Enable RLS on device_pairing_temp if not already enabled
ALTER TABLE device_pairing_temp ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own pairing codes
CREATE POLICY "Users can insert their own pairing codes"
ON device_pairing_temp
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow service role to read all pairing codes (for setup function)
CREATE POLICY "Service role can read all pairing codes"
ON device_pairing_temp
FOR SELECT
TO service_role
USING (true);

-- Allow automatic cleanup of old records
CREATE POLICY "Allow cleanup of old pairing codes"
ON device_pairing_temp
FOR DELETE
TO service_role
USING (created_at < NOW() - INTERVAL '1 hour');