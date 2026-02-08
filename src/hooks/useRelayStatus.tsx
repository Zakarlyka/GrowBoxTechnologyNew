import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Relay status object from ESP8266 telemetry
 * Values: 0 = OFF, 1 = ON
 */
export interface RelayStatus {
  light: 0 | 1;
  vent: 0 | 1;
  pump: 0 | 1;
  clim: 0 | 1;
  humid: 0 | 1;
}

interface UseRelayStatusResult {
  relayStatus: RelayStatus | null;
  isLoading: boolean;
  refetch: () => void;
}

/**
 * Hook for real-time relay status from devices.relay_status
 * Subscribes to Supabase realtime changes and updates instantly
 * when hardware reports state changes.
 */
export function useRelayStatus(deviceId: string | null): UseRelayStatusResult {
  const [relayStatus, setRelayStatus] = useState<RelayStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRelayStatus = useCallback(async () => {
    if (!deviceId) {
      setRelayStatus(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('devices')
        .select('relay_status')
        .eq('device_id', deviceId)
        .single();

      if (error) {
        console.error('Error fetching relay status:', error);
        setRelayStatus(null);
      } else {
        // Parse relay_status JSONB column safely
        const rawStatus = data?.relay_status as unknown;
        if (rawStatus && typeof rawStatus === 'object' && 'light' in rawStatus) {
          setRelayStatus(rawStatus as RelayStatus);
        } else {
          setRelayStatus(null);
        }
      }
    } catch (err) {
      console.error('Error in fetchRelayStatus:', err);
      setRelayStatus(null);
    } finally {
      setIsLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    fetchRelayStatus();

    if (!deviceId) return;

    // Subscribe to real-time changes on relay_status
    const channel = supabase
      .channel(`relay-status-${deviceId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'devices',
          filter: `device_id=eq.${deviceId}`,
        },
        (payload) => {
          console.log('Relay status update received:', payload.new);
          const newStatus = (payload.new as any)?.relay_status as RelayStatus | null;
          setRelayStatus(newStatus || null);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [deviceId, fetchRelayStatus]);

  return {
    relayStatus,
    isLoading,
    refetch: fetchRelayStatus,
  };
}
