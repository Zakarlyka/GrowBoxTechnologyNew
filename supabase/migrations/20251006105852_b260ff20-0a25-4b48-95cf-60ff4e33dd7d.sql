-- Drop conflicting policies on profiles table
DROP POLICY IF EXISTS "Authenticated developers can view assigned users" ON public.profiles;

-- Drop CHECK constraint that compares with TEXT
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_app_role_check;

-- Create enum type for app_role
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('user', 'admin', 'superadmin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Remove DEFAULT constraint from user_roles
ALTER TABLE public.user_roles ALTER COLUMN app_role DROP DEFAULT;

-- Convert app_role column from TEXT to enum type
ALTER TABLE public.user_roles 
  ALTER COLUMN app_role TYPE public.app_role 
  USING app_role::public.app_role;

-- Add DEFAULT back
ALTER TABLE public.user_roles ALTER COLUMN app_role SET DEFAULT 'user'::public.app_role;

-- Drop old RLS policy on user_roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

-- Create RLS policy for user_roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create has_role security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND app_role = _role
  )
$$;

-- Update devices RLS policies
DROP POLICY IF EXISTS "Users can manage own devices" ON public.devices;
DROP POLICY IF EXISTS "Users can delete their own devices" ON public.devices;
DROP POLICY IF EXISTS "Users can insert their own devices" ON public.devices;
DROP POLICY IF EXISTS "Users can update their own devices" ON public.devices;
DROP POLICY IF EXISTS "Users can view own devices" ON public.devices;
DROP POLICY IF EXISTS "Users can view their own devices" ON public.devices;
DROP POLICY IF EXISTS "Developers can view assigned user devices" ON public.devices;

CREATE POLICY "Users can view own devices"
  ON public.devices
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Users can insert own devices"
  ON public.devices
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own devices"
  ON public.devices
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Users can delete own devices"
  ON public.devices
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

-- Update device_logs RLS policies
DROP POLICY IF EXISTS "Devices can insert their own logs" ON public.device_logs;
DROP POLICY IF EXISTS "Users can view logs from their devices" ON public.device_logs;

CREATE POLICY "Users can view own device logs"
  ON public.device_logs
  FOR SELECT
  TO authenticated
  USING (
    device_id IN (
      SELECT id FROM public.devices 
      WHERE user_id = auth.uid()
    ) 
    OR public.has_role(auth.uid(), 'admin') 
    OR public.has_role(auth.uid(), 'superadmin')
  );

CREATE POLICY "Users can insert logs for own devices"
  ON public.device_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    device_id IN (
      SELECT id FROM public.devices 
      WHERE user_id = auth.uid()
    )
  );

-- Update sensor_data RLS policies
DROP POLICY IF EXISTS "Authenticated devices can insert sensor data" ON public.sensor_data;

CREATE POLICY "Users can insert sensor data for own devices"
  ON public.sensor_data
  FOR INSERT
  TO authenticated
  WITH CHECK (
    device_id IN (
      SELECT id FROM public.devices 
      WHERE user_id = auth.uid()
    )
  );

-- Security definer function to register device
CREATE OR REPLACE FUNCTION public.secure_register_device(
  p_device_id TEXT,
  p_name TEXT,
  p_type TEXT,
  p_location TEXT DEFAULT NULL
)
RETURNS TABLE (id UUID, device_id TEXT, name TEXT, type TEXT, user_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  INSERT INTO public.devices (user_id, device_id, name, type, location, status)
  VALUES (auth.uid(), p_device_id, p_name, p_type, p_location, 'offline')
  RETURNING devices.id, devices.device_id, devices.name, devices.type, devices.user_id;
END;
$$;

-- Fix handle_updated_at function to include search_path
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger to assign 'user' role to new users
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, app_role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, app_role) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();