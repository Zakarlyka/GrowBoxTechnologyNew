-- Create telegram_users table for bot connections
CREATE TABLE public.telegram_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_id BIGINT NOT NULL UNIQUE,
  username TEXT,
  first_name TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.telegram_users ENABLE ROW LEVEL SECURITY;

-- Users can view their own telegram connection
CREATE POLICY "Users can view own telegram" ON public.telegram_users
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own telegram connection  
CREATE POLICY "Users can update own telegram" ON public.telegram_users
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own telegram connection
CREATE POLICY "Users can delete own telegram" ON public.telegram_users
  FOR DELETE USING (auth.uid() = user_id);

-- Allow insert from service role (edge function)
CREATE POLICY "Service role can insert telegram" ON public.telegram_users
  FOR INSERT WITH CHECK (true);

-- Create index for fast chat_id lookups
CREATE INDEX idx_telegram_users_chat_id ON public.telegram_users(chat_id);
CREATE INDEX idx_telegram_users_user_id ON public.telegram_users(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_telegram_users_updated_at
  BEFORE UPDATE ON public.telegram_users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- DEVICE ALERT FUNCTION
-- ============================================

-- Function to send Telegram alert when device goes offline
CREATE OR REPLACE FUNCTION public.notify_device_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_settings RECORD;
  alert_payload jsonb;
BEGIN
  -- Only trigger on status change to 'offline'
  IF OLD.status = 'online' AND NEW.status = 'offline' THEN
    -- Get user's telegram settings
    SELECT telegram_chat_id, telegram_enabled
    INTO user_settings
    FROM public.notification_settings
    WHERE user_id = NEW.user_id;

    IF user_settings.telegram_enabled = true AND user_settings.telegram_chat_id IS NOT NULL THEN
      alert_payload := jsonb_build_object(
        'chat_id', user_settings.telegram_chat_id,
        'title', '🔴 Пристрій офлайн',
        'message', format('Пристрій "%s" перейшов у режим офлайн. Перевірте підключення.', NEW.name),
        'type', 'warning'
      );

      PERFORM net.http_post(
        url := 'https://ychnmaaximnoxvwnzrgs.supabase.co/functions/v1/telegram-notify',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := alert_payload
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger for device status changes
DROP TRIGGER IF EXISTS on_device_status_change ON public.devices;
CREATE TRIGGER on_device_status_change
  AFTER UPDATE OF status ON public.devices
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_device_status_change();

-- ============================================
-- SENSOR THRESHOLD ALERT FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.notify_sensor_threshold_exceeded()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  device_record RECORD;
  user_settings RECORD;
  alert_payload jsonb;
  settings jsonb;
  target_temp float;
  target_hum int;
  temp_hyst float;
  hum_hyst int;
  alert_message text;
  should_alert boolean := false;
BEGIN
  -- Get device info and settings
  SELECT d.*, d.settings INTO device_record
  FROM public.devices d
  WHERE d.device_id = NEW.device_id;

  IF device_record IS NULL THEN
    RETURN NEW;
  END IF;

  settings := COALESCE(device_record.settings, '{}'::jsonb);
  target_temp := COALESCE((settings->>'target_temp')::float, 25.0);
  target_hum := COALESCE((settings->>'target_hum')::int, 60);
  temp_hyst := COALESCE((settings->>'temp_hyst')::float, 2.0);
  hum_hyst := COALESCE((settings->>'hum_hyst')::int, 5);

  alert_message := '';

  -- Check temperature thresholds
  IF NEW.temp IS NOT NULL THEN
    IF NEW.temp > (target_temp + temp_hyst + 3) THEN
      alert_message := format('🌡️ Критична температура: %.1f°C (ціль: %.1f°C)', NEW.temp, target_temp);
      should_alert := true;
    ELSIF NEW.temp < (target_temp - temp_hyst - 3) THEN
      alert_message := format('❄️ Низька температура: %.1f°C (ціль: %.1f°C)', NEW.temp, target_temp);
      should_alert := true;
    END IF;
  END IF;

  -- Check humidity thresholds
  IF NEW.hum IS NOT NULL AND NOT should_alert THEN
    IF NEW.hum > (target_hum + hum_hyst + 10) THEN
      alert_message := format('💧 Висока вологість: %.0f%% (ціль: %s%%)', NEW.hum, target_hum);
      should_alert := true;
    ELSIF NEW.hum < (target_hum - hum_hyst - 10) THEN
      alert_message := format('🏜️ Низька вологість: %.0f%% (ціль: %s%%)', NEW.hum, target_hum);
      should_alert := true;
    END IF;
  END IF;

  IF should_alert THEN
    -- Get user's telegram settings
    SELECT telegram_chat_id, telegram_enabled
    INTO user_settings
    FROM public.notification_settings
    WHERE user_id = device_record.user_id;

    IF user_settings.telegram_enabled = true AND user_settings.telegram_chat_id IS NOT NULL THEN
      alert_payload := jsonb_build_object(
        'chat_id', user_settings.telegram_chat_id,
        'title', format('⚠️ %s', device_record.name),
        'message', alert_message,
        'type', 'error'
      );

      PERFORM net.http_post(
        url := 'https://ychnmaaximnoxvwnzrgs.supabase.co/functions/v1/telegram-notify',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := alert_payload
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger for sensor threshold alerts
DROP TRIGGER IF EXISTS on_sensor_threshold_exceeded ON public.device_logs;
CREATE TRIGGER on_sensor_threshold_exceeded
  AFTER INSERT ON public.device_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_sensor_threshold_exceeded();