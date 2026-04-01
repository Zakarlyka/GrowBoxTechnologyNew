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
  deviceName: string | null;
  deviceType: string | null;
  deviceUuid: string | null;
}

export function useDeviceControls(deviceId: string | null) {
  const [deviceData, setDeviceData] = useState<DeviceData>({
    settings: null,
    lastTemp: null,
    lastHum: null,
    lastSoilMoisture: null,
    lastSeenAt: null,
    deviceName: null,
    deviceType: null,
    deviceUuid: null,
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const isInitialLoad = useState({ current: true })[0];

  const fetchData = useCallback(async (silent = false) => {
    if (!deviceId) return;
    if (!silent) setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('devices')
        .select('id, name, type, settings, last_temp, last_hum, last_soil_moisture, last_seen_at')
        .eq('device_id', deviceId)
        .single();

      if (error) throw error;
      
      setDeviceData({
        settings: (data?.settings as any) || null,
        lastTemp: data?.last_temp ?? null,
        lastHum: data?.last_hum ?? null,
        lastSoilMoisture: data?.last_soil_moisture ?? null,
        lastSeenAt: data?.last_seen_at || null,
        deviceName: data?.name || null,
        deviceType: data?.type || null,
        deviceUuid: data?.id || null,
      });
    } catch (error: any) {
      if (!silent) toast.error(`Помилка завантаження: ${error.message}`);
    } finally {
      setLoading(false);
      isInitialLoad.current = false;
    }
  }, [deviceId, isInitialLoad]);

  useEffect(() => {
    fetchData();

    if (!deviceId) return;

    // Subscribe to realtime changes (silent updates)
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
          fetchData(true);
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
    deviceName: deviceData.deviceName,
    deviceType: deviceData.deviceType,
    deviceUuid: deviceData.deviceUuid,
    loading,
    isSaving,
    saveSettings,
    refetch: fetchData,
  };
}
