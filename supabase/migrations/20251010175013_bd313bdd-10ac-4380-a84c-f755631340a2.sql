-- Таблиця для тимчасового парування пристрою
CREATE TABLE IF NOT EXISTS public.device_pairing_temp (
  device_id TEXT PRIMARY KEY,
  pairing_code TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Включаємо RLS (захист рядків)
ALTER TABLE public.device_pairing_temp ENABLE ROW LEVEL SECURITY;

-- device_pairing_temp має бути доступною для Edge Functions через service_role
-- Політики не створюємо, оскільки доступ контролюється через service_role_key

-- Таблиця devices вже існує, перевіряємо наявність індексу для device_id
CREATE INDEX IF NOT EXISTS idx_devices_device_id ON public.devices(device_id);
CREATE INDEX IF NOT EXISTS idx_device_pairing_temp_device_id ON public.device_pairing_temp(device_id);

-- Додаємо функцію для очищення старих записів парування (старіші за 1 годину)
CREATE OR REPLACE FUNCTION public.cleanup_old_pairing_records()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.device_pairing_temp
  WHERE created_at < (now() - interval '1 hour');
END;
$$;