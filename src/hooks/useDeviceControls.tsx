import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { type DeviceSettings } from '@/types';
import { toast } from 'sonner';

interface DeviceData {
  settings: DeviceSettings | null;
  lastTemp: number | null;
  lastHum: number | null;
  lastSoilMoisture: number | null;
  lastSeenAt: string | null;
}

export function useDeviceControls(deviceId: string | null) {
  const [deviceData, setDeviceData] = useState<DeviceData>({
    settings: null,
    lastTemp: null,
    lastHum: null,
    lastSoilMoisture: null,
    lastSeenAt: null,
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = useCallback(async () => {
    if (!deviceId) return;
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('devices')
        .select('settings, last_temp, last_hum, last_soil_moisture, last_seen_at')
        .eq('device_id', deviceId)
        .single();

      if (error) throw error;
      
      setDeviceData({
        settings: (data?.settings as any) || null,
        lastTemp: data?.last_temp || null,
        lastHum: data?.last_hum || null,
        lastSoilMoisture: data?.last_soil_moisture || null,
        lastSeenAt: data?.last_seen_at || null,
      });
    } catch (error: any) {
      toast.error(`Помилка завантаження: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    fetchData();

    if (!deviceId) return;

    // Subscribe to settings changes
    const channel = supabase
      .channel(`device-${deviceId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'devices',
          filter: `device_id=eq.${deviceId}`,
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData, deviceId]);

  const saveSettings = async (settingsPatch: Partial<DeviceSettings>) => {
    if (!deviceId) return;
    setIsSaving(true);
    
    try {
      // Merge patch with existing settings
      const updatedSettings = {
        ...(deviceData.settings || {}),
        ...settingsPatch,
      };

      const { error } = await supabase
        .from('devices')
        .update({ settings: updatedSettings })
        .eq('device_id', deviceId);

      if (error) throw error;
      
      setDeviceData(prev => ({
        ...prev,
        settings: updatedSettings as DeviceSettings,
      }));
      
      toast.success('Налаштування збережено!');
    } catch (error: any) {
      toast.error(`Помилка: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    settings: deviceData.settings,
    sensorData: {
      temperature: deviceData.lastTemp,
      humidity: deviceData.lastHum,
      soilMoisture: deviceData.lastSoilMoisture,
    },
    lastSeenAt: deviceData.lastSeenAt,
    loading,
    isSaving,
    saveSettings,
    refetch: fetchData,
  };
}
