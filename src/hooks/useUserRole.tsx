import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type AppRole = 'user' | 'admin' | 'moderator';

export function useUserRole() {
  const { user } = useAuth();

  const { data: roles, isLoading, error } = useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) throw error;
      return data.map(r => r.role as AppRole);
    },
    enabled: !!user,
  });

  const hasRole = (role: AppRole): boolean => {
    return roles?.includes(role) ?? false;
  };

  const isAdmin = hasRole('admin');
  const isModerator = hasRole('moderator');
  const isUser = hasRole('user');

  return {
    roles: roles ?? [],
    hasRole,
    isAdmin,
    isModerator,
    isUser,
    isLoading,
    error,
  };
}
