-- Fix get_device_settings to be SECURITY DEFINER and handle edge cases
CREATE OR REPLACE FUNCTION public.get_device_settings(device_uuid text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    device_settings jsonb;
    device_found boolean;
BEGIN
    -- Check if device exists first
    SELECT EXISTS(SELECT 1 FROM devices WHERE device_id = device_uuid) INTO device_found;
    
    IF NOT device_found THEN
        -- Device not found - return error indicator
        RETURN json_build_object('error', 'device_not_found', 'device_id', device_uuid);
    END IF;

    -- Get settings from device
    SELECT settings INTO device_settings
    FROM devices
    WHERE device_id = device_uuid;

    -- If settings is NULL or empty, return defaults
    IF device_settings IS NULL OR device_settings = '{}'::jsonb THEN
        RETURN json_build_object(
            'target_temp', 25.0,
            'target_hum', 60,
            'soil_min', 30,
            'soil_max', 70,
            'light_start_h', 6,
            'light_start_m', 0,
            'light_end_h', 22,
            'light_end_m', 0,
            'light_mode', 1,
            'pump_mode', 0,
            'pump_pulse', 0,
            'climate_mode', 0
        );
    END IF;

    -- Return parsed settings with defaults for missing fields
    RETURN json_build_object(
        'target_temp', COALESCE((device_settings->>'target_temp')::float, 25.0),
        'target_hum', COALESCE((device_settings->>'target_hum')::int, 60),
        'soil_min', COALESCE((device_settings->>'soil_min')::int, 30),
        'soil_max', COALESCE((device_settings->>'soil_max')::int, 70),
        'light_start_h', COALESCE((device_settings->>'light_start_h')::int, 6),
        'light_start_m', COALESCE((device_settings->>'light_start_m')::int, 0),
        'light_end_h', COALESCE((device_settings->>'light_end_h')::int, 22),
        'light_end_m', COALESCE((device_settings->>'light_end_m')::int, 0),
        'light_mode', COALESCE((device_settings->>'light_mode')::int, 1),
        'pump_mode', COALESCE((device_settings->>'pump_mode')::int, 0),
        'pump_pulse', COALESCE((device_settings->>'pump_pulse')::int, 0),
        'climate_mode', COALESCE((device_settings->>'climate_mode')::int, 0)
    );
END;
$function$;