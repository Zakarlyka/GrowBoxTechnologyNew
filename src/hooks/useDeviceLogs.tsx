import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DeviceLog {
  id: string;
  device_id: string;
  temperature?: number;
  humidity?: number;
  soil_moisture?: number;
  light_level?: number;
  water_level?: number;
  ph_level?: number;
  ec_level?: number;
  timestamp: string;
}

export function useDeviceLogs(deviceId?: string) {
  const [logs, setLogs] = useState<DeviceLog[]>([]);
  const [latestLog, setLatestLog] = useState<DeviceLog | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    if (!deviceId) return;

    try {
      const { data, error } = await supabase
        .from('sensor_data')
        .select('*')
        .eq('device_id', deviceId)
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      setLogs(data || []);
      if (data && data.length > 0) {
        setLatestLog(data[0]);
      }
    } catch (error: any) {
      console.error('Error fetching device logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (deviceId) {
      fetchLogs();

      // Subscribe to realtime updates
      const channel = supabase
        .channel(`device-logs-${deviceId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'sensor_data',
            filter: `device_id=eq.${deviceId}`,
          },
          (payload) => {
            console.log('New sensor data:', payload);
            const newLog = payload.new as DeviceLog;
            setLatestLog(newLog);
            setLogs((prev) => [newLog, ...prev.slice(0, 99)]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [deviceId]);

  return {
    logs,
    latestLog,
    loading,
    fetchLogs,
  };
}
