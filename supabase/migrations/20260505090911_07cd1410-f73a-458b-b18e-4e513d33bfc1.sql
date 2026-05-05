-- 1. Welcome notification on signup
DROP TRIGGER IF EXISTS on_auth_user_created_notify ON auth.users;
CREATE TRIGGER on_auth_user_created_notify
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_notification();

-- 2. Rewrite watchdog_sensor_alerts: thresholds from notification_settings,
--    UUID-or-token device match, 15-min debounce per alert kind.
CREATE OR REPLACE FUNCTION public.watchdog_sensor_alerts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  d RECORD; ns RECORD; last_t TIMESTAMPTZ;
  t_min numeric; t_max numeric; h_min numeric; h_max numeric; s_min int;
BEGIN
  SELECT * INTO d FROM public.devices
   WHERE id::text = NEW.device_id::text OR device_id = NEW.device_id::text
   LIMIT 1;
  IF d IS NULL THEN RETURN NEW; END IF;

  SELECT * INTO ns FROM public.notification_settings WHERE user_id = d.user_id;

  t_min := COALESCE(ns.temperature_min, (d.settings->>'temp_min')::numeric, 18);
  t_max := COALESCE(ns.temperature_max, (d.settings->>'temp_max')::numeric, 30);
  h_min := COALESCE(ns.humidity_min,    (d.settings->>'hum_min')::numeric, 40);
  h_max := COALESCE(ns.humidity_max,    (d.settings->>'hum_max')::numeric, 80);
  s_min := COALESCE(ns.soil_min,        (d.settings->>'soil_min')::int, 20);

  IF NEW.temperature IS NOT NULL AND (NEW.temperature > t_max OR NEW.temperature < t_min) THEN
    SELECT MAX(created_at) INTO last_t FROM public.user_notifications
     WHERE user_id=d.user_id AND title='🌡️ Температура'
       AND created_at > now() - interval '15 minutes';
    IF last_t IS NULL THEN
      INSERT INTO public.user_notifications (user_id, device_id, title, message, type)
      VALUES (d.user_id, d.id, '🌡️ Температура',
        format('%.1f°C поза межами %s–%s°C на "%s"', NEW.temperature, t_min, t_max, d.name),
        'warning');
    END IF;
  END IF;

  IF NEW.humidity IS NOT NULL AND (NEW.humidity > h_max OR NEW.humidity < h_min) THEN
    SELECT MAX(created_at) INTO last_t FROM public.user_notifications
     WHERE user_id=d.user_id AND title='💧 Вологість'
       AND created_at > now() - interval '15 minutes';
    IF last_t IS NULL THEN
      INSERT INTO public.user_notifications (user_id, device_id, title, message, type)
      VALUES (d.user_id, d.id, '💧 Вологість',
        format('%.0f%% поза межами %s–%s%% на "%s"', NEW.humidity, h_min, h_max, d.name),
        'warning');
    END IF;
  END IF;

  IF NEW.soil_moisture IS NOT NULL THEN
    IF NEW.soil_moisture = 0 THEN
      SELECT MAX(created_at) INTO last_t FROM public.user_notifications
       WHERE user_id=d.user_id AND title='🔌 Sensor Offline'
         AND created_at > now() - interval '15 minutes';
      IF last_t IS NULL THEN
        INSERT INTO public.user_notifications (user_id, device_id, title, message, type)
        VALUES (d.user_id, d.id, '🔌 Sensor Offline',
                'Soil probe reading 0%. Check cable.', 'warning');
      END IF;
    ELSIF NEW.soil_moisture < s_min THEN
      SELECT MAX(created_at) INTO last_t FROM public.user_notifications
       WHERE user_id=d.user_id AND title='🌵 Dry Soil'
         AND created_at > now() - interval '15 minutes';
      IF last_t IS NULL THEN
        INSERT INTO public.user_notifications (user_id, device_id, title, message, type)
        VALUES (d.user_id, d.id, '🌵 Dry Soil',
          format('Вологість ґрунту %s%% (мін %s%%) на "%s"', NEW.soil_moisture, s_min, d.name),
          'warning');
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END $$;

-- 3. sensor_data: cache + watchdog
DROP TRIGGER IF EXISTS trg_update_device_latest_state ON public.sensor_data;
CREATE TRIGGER trg_update_device_latest_state
AFTER INSERT ON public.sensor_data
FOR EACH ROW EXECUTE FUNCTION public.update_device_latest_state();

DROP TRIGGER IF EXISTS trg_watchdog_sensor_alerts ON public.sensor_data;
CREATE TRIGGER trg_watchdog_sensor_alerts
AFTER INSERT ON public.sensor_data
FOR EACH ROW EXECUTE FUNCTION public.watchdog_sensor_alerts();

-- 4. device_logs: cache + error watchdog
DROP TRIGGER IF EXISTS trg_update_device_on_new_log ON public.device_logs;
CREATE TRIGGER trg_update_device_on_new_log
AFTER INSERT ON public.device_logs
FOR EACH ROW EXECUTE FUNCTION public.update_device_on_new_log();

DROP TRIGGER IF EXISTS trg_watchdog_error_handler ON public.device_logs;
CREATE TRIGGER trg_watchdog_error_handler
AFTER INSERT ON public.device_logs
FOR EACH ROW EXECUTE FUNCTION public.watchdog_error_handler();

-- 5. Device offline alert (insert-only; webhook delivers to Telegram)
CREATE OR REPLACE FUNCTION public.notify_device_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status = 'online' AND NEW.status = 'offline' THEN
    INSERT INTO public.user_notifications (user_id, device_id, title, message, type)
    VALUES (NEW.user_id, NEW.id, '🔴 Пристрій офлайн',
            format('Пристрій "%s" перейшов у офлайн.', NEW.name), 'warning');
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_device_status_change ON public.devices;
CREATE TRIGGER trg_notify_device_status_change
AFTER UPDATE OF status ON public.devices
FOR EACH ROW EXECUTE FUNCTION public.notify_device_status_change();

-- 6. Drop orphaned legacy functions (broken pg_net/current_setting calls)
DROP FUNCTION IF EXISTS public.notify_sensor_threshold_exceeded() CASCADE;
DROP FUNCTION IF EXISTS public.notify_user_telegram() CASCADE;