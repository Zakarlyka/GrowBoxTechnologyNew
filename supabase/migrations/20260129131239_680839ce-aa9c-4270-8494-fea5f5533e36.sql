-- Watchdog function for sensor_data alerts with debounce
CREATE OR REPLACE FUNCTION public.watchdog_sensor_alerts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  device_record RECORD;
  user_settings RECORD;
  alert_title TEXT;
  alert_message TEXT;
  alert_type TEXT := 'warning';
  last_alert_time TIMESTAMPTZ;
  debounce_minutes INT := 15; -- Don't repeat same alert type within 15 min
BEGIN
  -- 1. Get device info to find the owner
  SELECT d.user_id, d.name INTO device_record
  FROM public.devices d
  WHERE d.id = NEW.device_id;

  IF device_record.user_id IS NULL THEN
    RETURN NEW; -- Device not found, skip
  END IF;

  -- 2. Get user's notification thresholds
  SELECT 
    temperature_min, temperature_max,
    humidity_min, humidity_max,
    telegram_enabled
  INTO user_settings
  FROM public.notification_settings
  WHERE user_id = device_record.user_id;

  IF user_settings IS NULL THEN
    RETURN NEW; -- No settings configured
  END IF;

  -- 3. Check Temperature HIGH
  IF NEW.temperature IS NOT NULL AND user_settings.temperature_max IS NOT NULL 
     AND NEW.temperature > user_settings.temperature_max THEN
    
    -- Debounce: Check last similar alert
    SELECT MAX(created_at) INTO last_alert_time
    FROM public.user_notifications
    WHERE user_id = device_record.user_id
      AND title LIKE '%температура%'
      AND created_at > NOW() - (debounce_minutes || ' minutes')::INTERVAL;

    IF last_alert_time IS NULL THEN
      alert_title := '🌡️ Висока температура!';
      alert_message := format('Пристрій "%s": %.1f°C (макс: %s°C)', 
        device_record.name, NEW.temperature, user_settings.temperature_max);
      alert_type := 'error';

      INSERT INTO public.user_notifications (user_id, title, message, type)
      VALUES (device_record.user_id, alert_title, alert_message, alert_type);
    END IF;
  END IF;

  -- 4. Check Temperature LOW
  IF NEW.temperature IS NOT NULL AND user_settings.temperature_min IS NOT NULL 
     AND NEW.temperature < user_settings.temperature_min THEN
    
    SELECT MAX(created_at) INTO last_alert_time
    FROM public.user_notifications
    WHERE user_id = device_record.user_id
      AND title LIKE '%Низька температура%'
      AND created_at > NOW() - (debounce_minutes || ' minutes')::INTERVAL;

    IF last_alert_time IS NULL THEN
      alert_title := '❄️ Низька температура!';
      alert_message := format('Пристрій "%s": %.1f°C (мін: %s°C)', 
        device_record.name, NEW.temperature, user_settings.temperature_min);
      alert_type := 'warning';

      INSERT INTO public.user_notifications (user_id, title, message, type)
      VALUES (device_record.user_id, alert_title, alert_message, alert_type);
    END IF;
  END IF;

  -- 5. Check Humidity LOW
  IF NEW.humidity IS NOT NULL AND user_settings.humidity_min IS NOT NULL 
     AND NEW.humidity < user_settings.humidity_min THEN
    
    SELECT MAX(created_at) INTO last_alert_time
    FROM public.user_notifications
    WHERE user_id = device_record.user_id
      AND title LIKE '%вологість%'
      AND created_at > NOW() - (debounce_minutes || ' minutes')::INTERVAL;

    IF last_alert_time IS NULL THEN
      alert_title := '🏜️ Низька вологість!';
      alert_message := format('Пристрій "%s": %.0f%% (мін: %s%%)', 
        device_record.name, NEW.humidity, user_settings.humidity_min);
      alert_type := 'warning';

      INSERT INTO public.user_notifications (user_id, title, message, type)
      VALUES (device_record.user_id, alert_title, alert_message, alert_type);
    END IF;
  END IF;

  -- 6. Check Humidity HIGH
  IF NEW.humidity IS NOT NULL AND user_settings.humidity_max IS NOT NULL 
     AND NEW.humidity > user_settings.humidity_max THEN
    
    SELECT MAX(created_at) INTO last_alert_time
    FROM public.user_notifications
    WHERE user_id = device_record.user_id
      AND title LIKE '%Висока вологість%'
      AND created_at > NOW() - (debounce_minutes || ' minutes')::INTERVAL;

    IF last_alert_time IS NULL THEN
      alert_title := '💧 Висока вологість!';
      alert_message := format('Пристрій "%s": %.0f%% (макс: %s%%)', 
        device_record.name, NEW.humidity, user_settings.humidity_max);
      alert_type := 'warning';

      INSERT INTO public.user_notifications (user_id, title, message, type)
      VALUES (device_record.user_id, alert_title, alert_message, alert_type);
    END IF;
  END IF;

  -- 7. Check Soil Moisture LOW (bonus)
  IF NEW.soil_moisture IS NOT NULL AND NEW.soil_moisture < 20 THEN
    SELECT MAX(created_at) INTO last_alert_time
    FROM public.user_notifications
    WHERE user_id = device_record.user_id
      AND title LIKE '%ґрунт%'
      AND created_at > NOW() - (debounce_minutes || ' minutes')::INTERVAL;

    IF last_alert_time IS NULL THEN
      alert_title := '🪴 Сухий ґрунт!';
      alert_message := format('Пристрій "%s": вологість ґрунту %.0f%% - потрібен полив!', 
        device_record.name, NEW.soil_moisture);
      alert_type := 'warning';

      INSERT INTO public.user_notifications (user_id, title, message, type)
      VALUES (device_record.user_id, alert_title, alert_message, alert_type);
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- Create trigger on sensor_data
DROP TRIGGER IF EXISTS watchdog_sensor_data ON public.sensor_data;
CREATE TRIGGER watchdog_sensor_data
  AFTER INSERT ON public.sensor_data
  FOR EACH ROW
  EXECUTE FUNCTION public.watchdog_sensor_alerts();

-- Also ensure user_notifications trigger exists for Telegram
DROP TRIGGER IF EXISTS on_new_notification_telegram ON public.user_notifications;
CREATE TRIGGER on_new_notification_telegram
  AFTER INSERT ON public.user_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_user_telegram();