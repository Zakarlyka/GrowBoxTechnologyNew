# 13 — Auth & roles

- Supabase email/password auth (`useAuth.tsx`, `AuthForm.tsx`). Hard redirect on auth change.
- On signup triggers create profile, `user` role, free subscription, welcome notification.
- Roles in `user_roles.app_role`; admin check = `is_admin()` (admin or developer). Client uses `useUserRole` but security relies on RLS + SECURITY DEFINER functions.
- `/account` = user area, `/admin` = admin only (strict separation).
- To make someone admin: `update user_roles set app_role='admin' where user_id='<uuid>';` in Supabase SQL editor.
