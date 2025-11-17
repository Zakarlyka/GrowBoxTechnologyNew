-- Create RPC function for admins to get all users
CREATE OR REPLACE FUNCTION public.admin_get_all_users()
RETURNS TABLE(
  user_id uuid,
  email text,
  app_role app_role,
  full_name text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.user_id,
    p.email,
    COALESCE(ur.app_role, 'user'::app_role) as app_role,
    p.full_name
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id
$$;