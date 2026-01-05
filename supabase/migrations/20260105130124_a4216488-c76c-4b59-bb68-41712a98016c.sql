-- Add is_ai_allowed column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_ai_allowed boolean NOT NULL DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.is_ai_allowed IS 'Admin-controlled flag to allow/deny AI features for this user';