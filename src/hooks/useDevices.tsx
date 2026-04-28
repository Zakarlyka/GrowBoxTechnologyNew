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
  lifecycle?: 'active' | 'archived';
  is_demo?: boolean;
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

    // Subscribe to realtime changes for immediate UI updates
    const channel = supabase
      .channel('devices-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'devices',
          filter: `user_id=eq.${user?.id}`,
        },
        (payload) => {
          console.log('Device realtime update:', payload.new);
          setDevices(prev => prev.map(d => 
            d.id === (payload.new as Device).id 
              ? { ...(payload.new as Device), status: calculateDeviceStatus((payload.new as Device).last_seen_at) }
              : d
          ));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'devices',
          filter: `user_id=eq.${user?.id}`,
        },
        () => fetchDevices()
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'devices',
          filter: `user_id=eq.${user?.id}`,
        },
        () => fetchDevices()
      )
      .subscribe((status) => {
        console.log('Devices channel status:', status);
      });

    return () => {
      clearInterval(statusInterval);
      supabase.removeChannel(channel);
    };
  }, [user]);

  /**
   * Smart delete:
   *   - demo device  → hard DELETE (no archive)
   *   - active       → soft delete (lifecycle='archived'), keeps history
   *   - archived     → hard DELETE (called from Archive view)
   */
  const deleteDevice = async (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    const isDemo = device?.is_demo === true || device?.type === 'demo';
    const isArchived = device?.lifecycle === 'archived';

    try {
      if (isDemo || isArchived) {
        const { error } = await supabase.from('devices').delete().eq('id', deviceId);
        if (error) throw error;
        setDevices(prev => prev.filter(d => d.id !== deviceId));
        toast({
          title: 'Пристрій видалено',
          description: 'Пристрій повністю видалено з вашого облікового запису',
        });
      } else {
        const { error } = await supabase
          .from('devices')
          .update({ lifecycle: 'archived' } as any)
          .eq('id', deviceId);
        if (error) throw error;
        setDevices(prev => prev.map(d => d.id === deviceId ? { ...d, lifecycle: 'archived' } : d));
        toast({
          title: 'Переміщено в архів',
          description: 'Пристрій збережено в архіві. Історичні дані залишаються доступними.',
        });
      }
    } catch (error: any) {
      console.error('Error deleting device:', error);
      toast({
        title: 'Помилка',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const restoreDevice = async (deviceId: string) => {
    try {
      const { error } = await supabase
        .from('devices')
        .update({ lifecycle: 'active' } as any)
        .eq('id', deviceId);
      if (error) throw error;
      setDevices(prev => prev.map(d => d.id === deviceId ? { ...d, lifecycle: 'active' } : d));
      toast({
        title: 'Пристрій відновлено',
        description: 'Пристрій повернуто з архіву та знову доступний для керування.',
      });
    } catch (error: any) {
      console.error('Error restoring device:', error);
      toast({
        title: 'Помилка',
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
    restoreDevice,
    updateDeviceStatus,
  };
}
