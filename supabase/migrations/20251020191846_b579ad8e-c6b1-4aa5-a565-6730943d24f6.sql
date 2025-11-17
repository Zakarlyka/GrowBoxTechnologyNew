-- Enable RLS on devices table if not already enabled
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;

-- Allow service role to insert devices (for confirm-device edge function)
CREATE POLICY "Service role can insert devices"
ON devices
FOR INSERT
TO service_role
WITH CHECK (true);

-- Allow authenticated users to view their own devices
CREATE POLICY "Users can view own devices"
ON devices
FOR SELECT
USING (auth.uid() = user_id);

-- Allow authenticated users to update their own devices
CREATE POLICY "Users can update own devices"
ON devices
FOR UPDATE
USING (auth.uid() = user_id);

-- Allow authenticated users to delete their own devices
CREATE POLICY "Users can delete own devices"
ON devices
FOR DELETE
USING (auth.uid() = user_id);