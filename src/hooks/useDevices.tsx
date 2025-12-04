import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

export interface Device {
  id: string;
  device_id: string;
  name: string;
  type: string;
  status: string;
  location?: string | null;
  last_temp?: number | null;
  last_hum?: number | null;
  last_soil_moisture?: number | null;
  last_seen?: string | null;
  last_seen_at?: string | null;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface DeviceControl {
  id: string;
  device_id: string;
  control_type: string;
  control_name: string;
  value: boolean;
  intensity?: number;
  schedule?: any;
}

export function useDevices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Calculate device status based on last_seen_at
  const calculateDeviceStatus = (lastSeenAt?: string | null): 'online' | 'offline' => {
    if (!lastSeenAt) return 'offline';
    
    const lastSeen = new Date(lastSeenAt);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60);
    
    return diffMinutes <= 2 ? 'online' : 'offline';
  };

  const fetchDevices = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Calculate status dynamically for each device
      const devicesWithStatus = (data || []).map(device => ({
        ...device,
        status: calculateDeviceStatus(device.last_seen)
      })) as Device[];
      
      setDevices(devicesWithStatus);
    } catch (error: any) {
      console.error('Error fetching devices:', error);
      toast({
        title: 'Помилка завантаження',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Update device statuses based on last_seen
  const updateDevicesStatus = () => {
    setDevices(prevDevices => 
      prevDevices.map(device => ({
        ...device,
        status: calculateDeviceStatus(device.last_seen)
      }))
    );
  };

  useEffect(() => {
    fetchDevices();

    // Check status every 10 seconds
    const statusInterval = setInterval(updateDevicesStatus, 10000);

    // Subscribe to realtime changes
    const channel = supabase
      .channel('devices-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'devices',
          filter: `user_id=eq.${user?.id}`,
        },
        (payload) => {
          console.log('Device change received:', payload);
          fetchDevices();
        }
      )
      .subscribe();

    return () => {
      clearInterval(statusInterval);
      supabase.removeChannel(channel);
    };
  }, [user]);

  const deleteDevice = async (deviceId: string) => {
    try {
      const { error } = await supabase
        .from('devices')
        .delete()
        .eq('id', deviceId);

      if (error) throw error;

      toast({
        title: 'Пристрій видалено',
        description: 'Пристрій успішно видалено з вашого облікового запису',
      });
    } catch (error: any) {
      console.error('Error deleting device:', error);
      toast({
        title: 'Помилка видалення',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const updateDeviceStatus = async (deviceId: string, status: 'online' | 'offline') => {
    try {
      const { error } = await supabase
        .from('devices')
        .update({ status, last_seen: new Date().toISOString() })
        .eq('id', deviceId);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error updating device status:', error);
    }
  };

  return {
    devices,
    loading,
    fetchDevices,
    deleteDevice,
    updateDeviceStatus,
  };
}
