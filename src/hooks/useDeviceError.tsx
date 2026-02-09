import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseDeviceErrorResult {
  error: string | null;
  isLoading: boolean;
  refetch: () => void;
}

/**
 * Hook to track the latest error from device_logs for a given device.
 * Subscribes to real-time INSERT events on device_logs.
 */
export function useDeviceError(deviceId: string | null): UseDeviceErrorResult {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLatestError = useCallback(async () => {
    if (!deviceId) {
      setError(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error: fetchErr } = await supabase
        .from('device_logs')
        .select('error')
        .eq('device_id', deviceId)
        .not('error', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchErr) {
        console.error('Error fetching device error:', fetchErr);
        setError(null);
      } else {
        setError(data?.error ?? null);
      }
    } catch (err) {
      console.error('Error in fetchLatestError:', err);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    fetchLatestError();

    if (!deviceId) return;

    const channel = supabase
      .channel(`device-error-${deviceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'device_logs',
          filter: `device_id=eq.${deviceId}`,
        },
        (payload) => {
          const newError = (payload.new as any)?.error as string | null;
          // Update error: if new log has an error, set it; if no error, clear it
          setError(newError ?? null);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [deviceId, fetchLatestError]);

  return { error, isLoading, refetch: fetchLatestError };
}
