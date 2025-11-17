-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'developer', 'admin')),
  developer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  category TEXT DEFAULT 'standard',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create devices table
CREATE TABLE public.devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'grow_box',
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'error')),
  location TEXT,
  configuration JSONB DEFAULT '{}',
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sensor_data table for telemetry
CREATE TABLE public.sensor_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
  temperature DECIMAL(5,2),
  humidity DECIMAL(5,2),
  soil_moisture DECIMAL(5,2),
  light_level DECIMAL(8,2),
  ph_level DECIMAL(4,2),
  ec_level DECIMAL(8,2),
  water_level DECIMAL(5,2),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create device_controls table
CREATE TABLE public.device_controls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
  control_type TEXT NOT NULL,
  control_name TEXT NOT NULL,
  value BOOLEAN DEFAULT false,
  intensity INTEGER DEFAULT 0,
  schedule JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_controls ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Developers can view their assigned users
CREATE POLICY "Developers can view assigned users" ON public.profiles
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.profiles 
      WHERE role = 'developer' AND user_id = auth.uid()
    ) AND developer_id = auth.uid()
  );

-- Device policies
CREATE POLICY "Users can view own devices" ON public.devices
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own devices" ON public.devices
  FOR ALL USING (auth.uid() = user_id);

-- Developers can view devices of assigned users
CREATE POLICY "Developers can view assigned user devices" ON public.devices
  FOR SELECT USING (
    user_id IN (
      SELECT user_id FROM public.profiles 
      WHERE developer_id = auth.uid()
    )
  );

-- Sensor data policies
CREATE POLICY "Users can view own device sensor data" ON public.sensor_data
  FOR SELECT USING (
    device_id IN (
      SELECT id FROM public.devices WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Devices can insert sensor data" ON public.sensor_data
  FOR INSERT WITH CHECK (true);

-- Device controls policies
CREATE POLICY "Users can manage own device controls" ON public.device_controls
  FOR ALL USING (
    device_id IN (
      SELECT id FROM public.devices WHERE user_id = auth.uid()
    )
  );

-- Functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_devices_updated_at
  BEFORE UPDATE ON public.devices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_device_controls_updated_at
  BEFORE UPDATE ON public.device_controls
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();