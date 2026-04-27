-- Update watchdog_sensor_alerts:
-- - Treat soil_moisture = 0 as "sensor disconnected" (throttled 1/hour)
-- - Keep existing NO_WATER pump-error logic
CREATE OR REPLACE FUNCTION public.watchdog_sensor_alerts()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  device_rec RECORD;
  msg_text TEXT;
  last_alert_time TIMESTAMPTZ;
BEGIN
  SELECT * INTO device_rec FROM public.devices WHERE device_id = NEW.device_id;
  IF device_rec IS NULL THEN RETURN NEW; END IF;

  -- 🚰 PUMP / WATER FAILURE (existing logic, preserved)
  IF NEW.error = 'NO_WATER' THEN
      SELECT MAX(created_at) INTO last_alert_time FROM public.user_notifications
      WHERE user_id = device_rec.user_id
        AND title = '🚰 Water Failure'
        AND created_at > NOW() - INTERVAL '1 hour';

      IF last_alert_time IS NULL THEN
          msg_text := 'Pump stopped! Check water tank. Soil: ' || CAST(NEW.soil_moisture AS TEXT) || '%';
          INSERT INTO public.user_notifications (user_id, title, message, type)
          VALUES (device_rec.user_id, '🚰 Water Failure', msg_text, 'error');
      END IF;
  END IF;

  -- 🌱 SOIL SENSOR DISCONNECT DETECTION (new)
  -- A reading of exactly 0 means probe is unplugged / shorted / on dry bench,
  -- NOT genuinely 0% moisture. Surface a throttled "Sensor Offline" alert
  -- instead of spamming dry-soil emergencies.
  IF NEW.soil_moisture IS NOT NULL AND NEW.soil_moisture = 0 THEN
      SELECT MAX(created_at) INTO last_alert_time FROM public.user_notifications
      WHERE user_id = device_rec.user_id
        AND title = '🔌 Soil Sensor Offline'
        AND created_at > NOW() - INTERVAL '1 hour';

      IF last_alert_time IS NULL THEN
          msg_text := 'Soil moisture probe on "' || COALESCE(device_rec.name, 'device') ||
                      '" is reading 0%. Check the cable and probe placement.';
          INSERT INTO public.user_notifications (user_id, title, message, type)
          VALUES (device_rec.user_id, '🔌 Soil Sensor Offline', msg_text, 'warning');
      END IF;
  END IF;

  RETURN NEW;
END;
$function$;