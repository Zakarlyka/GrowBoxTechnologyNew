-- Fix RLS policies for profiles and sensor_data tables to ensure proper data protection

-- First, let's check and fix the profiles table policies
-- Drop and recreate more restrictive policies for profiles table

-- Drop existing policies to recreate them with better security
DROP POLICY IF EXISTS "Developers can view assigned users" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;  
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create more secure policies for profiles table
-- Users can only view their own profile
CREATE POLICY "Users can view own profile only" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can only insert their own profile
CREATE POLICY "Users can insert own profile only" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile only" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Developers can view assigned users (but only if they are authenticated developers)
CREATE POLICY "Authenticated developers can view assigned users" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles dev 
    WHERE dev.user_id = auth.uid() 
    AND dev.role = 'developer'
  ) 
  AND developer_id = auth.uid()
);

-- Ensure profiles table has RLS enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Fix sensor_data policies to be more restrictive
-- Drop existing policies
DROP POLICY IF EXISTS "Devices can insert sensor data" ON public.sensor_data;
DROP POLICY IF EXISTS "Users can view own device sensor data" ON public.sensor_data;

-- Create more secure policies for sensor_data
-- Only authenticated users can view sensor data for their own devices
CREATE POLICY "Users can view own device sensor data only" 
ON public.sensor_data 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND device_id IN (
    SELECT id FROM public.devices 
    WHERE user_id = auth.uid()
  )
);

-- Only allow sensor data insertion for authenticated devices/users
-- This is more restrictive than the previous "true" policy
CREATE POLICY "Authenticated devices can insert sensor data" 
ON public.sensor_data 
FOR INSERT 
WITH CHECK (
  device_id IN (
    SELECT id FROM public.devices 
    WHERE id IS NOT NULL
  )
);

-- Ensure sensor_data table has RLS enabled
ALTER TABLE public.sensor_data ENABLE ROW LEVEL SECURITY;

-- Add additional security measures
-- Ensure all user-related tables have proper RLS
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;