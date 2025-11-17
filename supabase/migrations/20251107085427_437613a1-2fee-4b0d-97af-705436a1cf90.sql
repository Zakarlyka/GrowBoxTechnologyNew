-- Add RLS policies for admins to access all profiles and roles

-- Allow admins to read all profiles
CREATE POLICY "Admins can read all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND app_role IN ('admin', 'superadmin', 'developer')
  )
);

-- Allow admins to read all user roles
CREATE POLICY "Admins can read all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.app_role IN ('admin', 'superadmin', 'developer')
  )
);

-- Allow admins to update user roles
CREATE POLICY "Admins can update user roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.app_role IN ('admin', 'superadmin', 'developer')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.app_role IN ('admin', 'superadmin', 'developer')
  )
);