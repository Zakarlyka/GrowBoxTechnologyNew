-- Conditional migrations for devices table
DO $$ 
BEGIN
  -- Add status column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='devices' AND column_name='status') THEN
    ALTER TABLE devices ADD COLUMN status TEXT DEFAULT 'offline';
  END IF;
  
  -- Add last_seen column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='devices' AND column_name='last_seen') THEN
    ALTER TABLE devices ADD COLUMN last_seen TIMESTAMPTZ DEFAULT NOW();
  END IF;
  
  -- Set default for name column if it exists and is NOT NULL
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='devices' AND column_name='name') THEN
    ALTER TABLE devices ALTER COLUMN name SET DEFAULT 'Unnamed Device';
  END IF;
  
  -- Enable RLS if not already enabled
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_catalog.pg_class c 
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace 
    WHERE c.relname = 'devices' 
    AND n.nspname = 'public' 
    AND c.relrowsecurity
  ) THEN
    ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
  END IF;
  
  -- Create policy if not exists
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE tablename = 'devices' 
    AND policyname = 'Users manage their devices'
  ) THEN
    CREATE POLICY "Users manage their devices" ON devices FOR ALL 
    TO authenticated 
    USING (user_id = auth.uid()) 
    WITH CHECK (user_id = auth.uid());
  END IF;
END $$;