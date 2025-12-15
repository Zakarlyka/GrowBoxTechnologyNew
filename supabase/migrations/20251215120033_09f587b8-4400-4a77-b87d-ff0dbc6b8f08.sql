-- Fix library_strains RLS policies that incorrectly reference auth.users.role
-- Drop the broken policies that try to access auth.users

DROP POLICY IF EXISTS "Admin Create Access" ON public.library_strains;

-- Recreate with proper admin check using is_admin() function
CREATE POLICY "Admin Create Access" 
ON public.library_strains 
FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) AND is_admin()
);

-- Also ensure the Modify Strains policy is fixed
DROP POLICY IF EXISTS "Modify Strains" ON public.library_strains;

CREATE POLICY "Modify Strains" 
ON public.library_strains 
FOR ALL
USING (
  (auth.uid() = user_id) OR is_admin()
)
WITH CHECK (
  (auth.uid() = user_id) OR is_admin()
);