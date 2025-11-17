-- Add phone number to profiles table
ALTER TABLE public.profiles 
ADD COLUMN phone TEXT;

-- Add device groups table for organizing devices
CREATE TABLE public.device_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#4F46E5',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add device group relationship
ALTER TABLE public.devices 
ADD COLUMN group_id UUID REFERENCES public.device_groups(id) ON DELETE SET NULL;

-- Add device schedules table
CREATE TABLE public.device_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES public.devices(id) ON DELETE CASCADE NOT NULL,
  control_name TEXT NOT NULL,
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('timer', 'interval', 'daily')),
  start_time TIME,
  end_time TIME,
  interval_minutes INTEGER,
  days_of_week INTEGER[], -- 0=Sunday, 1=Monday, etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add notifications settings table
CREATE TABLE public.notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT false,
  temperature_min NUMERIC,
  temperature_max NUMERIC,
  humidity_min NUMERIC,
  humidity_max NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on new tables
ALTER TABLE public.device_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for device_groups
CREATE POLICY "Users can manage own device groups" 
ON public.device_groups FOR ALL 
USING (auth.uid() = user_id);

-- RLS policies for device_schedules
CREATE POLICY "Users can manage schedules for own devices" 
ON public.device_schedules FOR ALL 
USING (device_id IN (SELECT id FROM devices WHERE user_id = auth.uid()));

-- RLS policies for notification_settings
CREATE POLICY "Users can manage own notification settings" 
ON public.notification_settings FOR ALL 
USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_device_groups_updated_at
  BEFORE UPDATE ON public.device_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_device_schedules_updated_at
  BEFORE UPDATE ON public.device_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_settings_updated_at
  BEFORE UPDATE ON public.notification_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();