import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type AppRole = 'user' | 'admin' | 'developer' | 'superadmin';

export function useUserRole() {
  const { user } = useAuth();

  const { data: roles, isLoading, error } = useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('app_role') as any;

      if (error) throw error;
      return (data as any[]).map((r: any) => r.app_role as AppRole);
    },
    enabled: !!user,
  });

  const hasRole = (role: AppRole): boolean => {
    return roles?.includes(role) ?? false;
  };

  const isAdmin = hasRole('admin');
  const isDeveloper = hasRole('developer');
  const isUser = hasRole('user');

  return {
    roles: roles ?? [],
    hasRole,
    isAdmin,
    isDeveloper,
    isUser,
    isLoading,
    error,
  };
}
