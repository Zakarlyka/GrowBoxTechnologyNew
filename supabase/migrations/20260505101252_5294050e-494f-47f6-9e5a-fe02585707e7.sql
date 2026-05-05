
-- 1. DEVICES: replace wide-open anon SELECT with demo-only
DROP POLICY IF EXISTS "Allow anon select devices" ON public.devices;
CREATE POLICY "Anon can view demo devices"
  ON public.devices FOR SELECT TO anon
  USING (is_demo = true);

-- 2. SENSOR_DATA: keep anon insert but require device_id to match a known device
--    (matches either devices.id UUID or devices.device_id hardware token)
CREATE OR REPLACE FUNCTION public.validate_sensor_data_device()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.devices
     WHERE id::text = NEW.device_id::text
        OR device_id = NEW.device_id::text
  ) THEN
    RAISE EXCEPTION 'Unknown device_id: %', NEW.device_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_sensor_data_device ON public.sensor_data;
CREATE TRIGGER trg_validate_sensor_data_device
  BEFORE INSERT ON public.sensor_data
  FOR EACH ROW EXECUTE FUNCTION public.validate_sensor_data_device();

-- 3. STORAGE: consolidate grow-images policies + enforce per-user folder
DROP POLICY IF EXISTS "Auth Upload" ON storage.objects;
DROP POLICY IF EXISTS "Auth Upload Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Public Read" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Public read access" ON storage.objects;

CREATE POLICY "grow_images_public_read"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'grow-images');

CREATE POLICY "grow_images_user_upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'grow-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 4. Set search_path on functions missing it (linter warns)
ALTER FUNCTION public.watchdog_error_handler() SET search_path = public;
ALTER FUNCTION public.update_device_latest_state() SET search_path = public;
ALTER FUNCTION public.get_my_role() SET search_path = public;
ALTER FUNCTION public.reset_main_plant() SET search_path = public;
ALTER FUNCTION public.cascade_delete_device_data() SET search_path = public;
ALTER FUNCTION public.check_violation_rls_cols() SET search_path = public;
ALTER FUNCTION public.has_role(uuid, text) SET search_path = public;
ALTER FUNCTION public.mark_devices_offline() SET search_path = public;
ALTER FUNCTION public.set_pending_user_id() SET search_path = public;
ALTER FUNCTION public.update_device_activity() SET search_path = public;
ALTER FUNCTION public.update_device_on_new_log() SET search_path = public;
ALTER FUNCTION public.update_device_status() SET search_path = public;
ALTER FUNCTION public.verify_and_consume_pending_token(text) SET search_path = public;
ALTER FUNCTION public.get_device_settings(text) SET search_path = public;
ALTER FUNCTION public.check_and_zero_offline_devices() SET search_path = public;
