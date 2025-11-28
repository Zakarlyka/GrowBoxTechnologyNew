import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function usePremiumStatus() {
  const { user } = useAuth();

  const { data: isPremium, isLoading } = useQuery({
    queryKey: ['premium-status', user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      const { data, error } = await supabase
        .from('subscriptions')
        .select('status, plans(slug)')
        .eq('user_id', user.id)
        .single();

      if (error || !data) return false;
      
      // User is premium if they have an active subscription to a non-free plan
      return data.status === 'active' && (data.plans as any)?.slug !== 'free';
    },
    enabled: !!user,
  });

  return {
    isPremium: isPremium ?? false,
    isLoading,
  };
}
