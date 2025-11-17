-- Create devices table
CREATE TABLE IF NOT EXISTS public.devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('growbox', 'greenhouse', 'sensor', 'light', 'pump', 'fan', 'heater')),
  api_key TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  settings JSONB DEFAULT '{"temp_min": 18, "temp_max": 26, "humidity_min": 40, "humidity_max": 70, "soil_moisture_min": 30, "soil_moisture_max": 80}'::jsonb,
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'error')),
  last_seen TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create device_logs table for sensor data
CREATE TABLE IF NOT EXISTS public.device_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
  metric TEXT NOT NULL CHECK (metric IN ('temperature', 'humidity', 'soil_moisture', 'light', 'co2', 'ph')),
  value NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create schedules table
CREATE TABLE IF NOT EXISTS public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('on', 'off', 'pulse')),
  start_time TIME NOT NULL,
  end_time TIME,
  repeat TEXT NOT NULL DEFAULT 'daily' CHECK (repeat IN ('once', 'daily', 'weekly', 'monthly')),
  days_of_week INTEGER[] DEFAULT ARRAY[0,1,2,3,4,5,6],
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id UUID REFERENCES public.devices(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('email', 'telegram', 'push')),
  enabled BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create device_groups table for organizing devices
CREATE TABLE IF NOT EXISTS public.device_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create device_group_members junction table
CREATE TABLE IF NOT EXISTS public.device_group_members (
  device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.device_groups(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (device_id, group_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON public.devices(user_id);
CREATE INDEX IF NOT EXISTS idx_device_logs_device_id ON public.device_logs(device_id);
CREATE INDEX IF NOT EXISTS idx_device_logs_created_at ON public.device_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_schedules_device_id ON public.schedules(device_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_device_groups_user_id ON public.device_groups(user_id);

-- Enable Row Level Security
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_group_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for devices
CREATE POLICY "Users can view their own devices"
  ON public.devices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own devices"
  ON public.devices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own devices"
  ON public.devices FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own devices"
  ON public.devices FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for device_logs
CREATE POLICY "Users can view logs from their devices"
  ON public.device_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.devices 
    WHERE devices.id = device_logs.device_id 
    AND devices.user_id = auth.uid()
  ));

CREATE POLICY "Devices can insert their own logs"
  ON public.device_logs FOR INSERT
  WITH CHECK (true);

-- RLS Policies for schedules
CREATE POLICY "Users can view schedules for their devices"
  ON public.schedules FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.devices 
    WHERE devices.id = schedules.device_id 
    AND devices.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert schedules for their devices"
  ON public.schedules FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.devices 
    WHERE devices.id = schedules.device_id 
    AND devices.user_id = auth.uid()
  ));

CREATE POLICY "Users can update schedules for their devices"
  ON public.schedules FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.devices 
    WHERE devices.id = schedules.device_id 
    AND devices.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete schedules for their devices"
  ON public.schedules FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.devices 
    WHERE devices.id = schedules.device_id 
    AND devices.user_id = auth.uid()
  ));

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for device_groups
CREATE POLICY "Users can view their own groups"
  ON public.device_groups FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own groups"
  ON public.device_groups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own groups"
  ON public.device_groups FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own groups"
  ON public.device_groups FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for device_group_members
CREATE POLICY "Users can view members of their groups"
  ON public.device_group_members FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.device_groups 
    WHERE device_groups.id = device_group_members.group_id 
    AND device_groups.user_id = auth.uid()
  ));

CREATE POLICY "Users can add devices to their groups"
  ON public.device_group_members FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.device_groups 
    WHERE device_groups.id = device_group_members.group_id 
    AND device_groups.user_id = auth.uid()
  ));

CREATE POLICY "Users can remove devices from their groups"
  ON public.device_group_members FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.device_groups 
    WHERE device_groups.id = device_group_members.group_id 
    AND device_groups.user_id = auth.uid()
  ));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for updated_at
CREATE TRIGGER set_devices_updated_at
  BEFORE UPDATE ON public.devices
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_schedules_updated_at
  BEFORE UPDATE ON public.schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();