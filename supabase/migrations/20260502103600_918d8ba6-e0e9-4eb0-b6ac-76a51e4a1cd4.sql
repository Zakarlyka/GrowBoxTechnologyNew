-- 1) telegram_users: prevent anonymous INSERTs that could hijack a user's chat link
DROP POLICY IF EXISTS "Service role can insert telegram" ON public.telegram_users;

CREATE POLICY "Users can insert own telegram"
ON public.telegram_users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- (service_role bypasses RLS entirely, so no separate policy is required for it)

-- 2) nutrient_schedules: stop leaking user_id ↔ schedule mapping to the public
DROP POLICY IF EXISTS "Everyone can read nutrients" ON public.nutrient_schedules;

CREATE POLICY "Read system or own nutrient schedules"
ON public.nutrient_schedules
FOR SELECT
TO anon, authenticated
USING (user_id IS NULL OR auth.uid() = user_id);

-- 3) user_roles: remove from realtime publication so role changes aren't broadcast
ALTER PUBLICATION supabase_realtime DROP TABLE public.user_roles;