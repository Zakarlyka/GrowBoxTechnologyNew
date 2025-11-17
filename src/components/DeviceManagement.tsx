import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Settings, 
  Trash2, 
  Thermometer, 
  Droplets, 
  Sun, 
  Zap,
  Activity,
  WifiOff,
  Wifi,
  Edit,
  Save,
  X
} from 'lucide-react';

interface Device {
  id: string;
  device_id: string;
  name: string;
  type: string;
  status: string;
  location?: string;
  settings?: any;
  last_seen: string;
  last_seen_at?: string;
  last_activity?: string;
  last_temp?: number;
  last_hum?: number;
  user_id: string;
  group_id?: string;
  created_at: string;
  updated_at: string;
}

interface DeviceControl {
  id: string;
  device_id: string;
  control_name: string;
  control_type: string;
  value?: boolean;
  intensity?: number;
}

export function DeviceManagement() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [deviceControls, setDeviceControls] = useState<DeviceControl[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [newDevice, setNewDevice] = useState({
    device_id: '',
    name: '',
    type: 'grow_box',
    location: ''
  });

  const [deviceSettings, setDeviceSettings] = useState({
    temperature_min: 18,
    temperature_max: 28,
    humidity_min: 40,
    humidity_max: 80,
    light_schedule: {
      enabled: true,
      start_time: '06:00',
      end_time: '20:00'
    },
    watering_schedule: {
      enabled: false,
      interval_hours: 12,
      duration_minutes: 5
    }
  });

  useEffect(() => {
    if (user) {
      fetchDevices();
    }
  }, [user]);

  useEffect(() => {
    if (selectedDevice) {
      fetchDeviceControls(selectedDevice.id);
    }
  }, [selectedDevice]);

  const fetchDevices = async () => {
    try {
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDevices(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDeviceControls = async (deviceId: string) => {
    try {
      const { data, error } = await supabase
        .from('device_controls')
        .select('*')
        .eq('device_id', deviceId);

      if (error) throw error;
      setDeviceControls((data as any) || []);
    } catch (error: any) {
      console.error('Error fetching device controls:', error);
    }
  };

  const addDevice = async () => {
    if (!newDevice.device_id || !newDevice.name) {
      toast({
        title: "Error",
        description: "Device ID and name are required",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('devices')
        .insert({
          device_id: newDevice.device_id,
          name: newDevice.name,
          type: newDevice.type,
          location: newDevice.location,
          user_id: user!.id,
          configuration: deviceSettings,
          status: 'offline'
        })
        .select()
        .single();

      if (error) throw error;

      setDevices(prev => [data, ...prev]);
      setShowAddDialog(false);
      setNewDevice({ device_id: '', name: '', type: 'grow_box', location: '' });
      
      toast({
        title: "Success",
        description: "Device added successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateDeviceSettings = async () => {
    if (!selectedDevice) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('devices')
        .update({
          configuration: deviceSettings,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedDevice.id);

      if (error) throw error;

      setDevices(prev => prev.map(device => 
        device.id === selectedDevice.id 
          ? { ...device, configuration: deviceSettings }
          : device
      ));

      toast({
        title: "Success",
        description: "Device settings updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteDevice = async () => {
    if (!selectedDevice) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('devices')
        .delete()
        .eq('id', selectedDevice.id);

      if (error) throw error;

      setDevices(prev => prev.filter(device => device.id !== selectedDevice.id));
      setShowDeleteDialog(false);
      setSelectedDevice(null);
      
      toast({
        title: "Success",
        description: "Device deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const controlDevice = async (controlName: string, value?: boolean, intensity?: number) => {
    if (!selectedDevice) return;

    try {
      const { error } = await supabase
        .from('device_controls')
        .upsert({
          device_id: selectedDevice.id,
          control_name: controlName,
          control_type: intensity !== undefined ? 'slider' : 'switch',
          value,
          intensity,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'device_id,control_name'
        });

      if (error) throw error;

      fetchDeviceControls(selectedDevice.id);
      
      toast({
        title: "Success",
        description: `${controlName} updated successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getControlValue = (controlName: string, type: 'value' | 'intensity') => {
    const control = deviceControls.find(c => c.control_name === controlName);
    return control ? control[type] : (type === 'value' ? false : 0);
  };

  if (loading) {
    return (
      <div className="flex-1 p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {t('devices.title')}
          </h1>
          <p className="text-muted-foreground">
            Manage your IoT devices and monitor their status
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="glow-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Device
        </Button>
      </div>

      {devices.length === 0 ? (
        <Card className="gradient-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Activity className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No devices found</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add your first IoT device to start monitoring your greenhouse
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Device
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {devices.map((device) => (
            <Card key={device.id} className="gradient-card border-border/50 hover:glow-primary transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{device.name}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge variant={device.status === 'online' ? 'default' : 'destructive'}>
                      {device.status === 'online' ? (
                        <Wifi className="h-3 w-3 mr-1" />
                      ) : (
                        <WifiOff className="h-3 w-3 mr-1" />
                      )}
                      {device.status}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  ID: {device.device_id}
                </p>
                {device.location && (
                  <p className="text-sm text-muted-foreground">
                    📍 {device.location}
                  </p>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedDevice(device);
                      setDeviceSettings(device.settings || deviceSettings);
                      setShowSettingsDialog(true);
                    }}
                    className="flex-1"
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Settings
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedDevice(device);
                      setShowDeleteDialog(true);
                    }}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Device Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Device</DialogTitle>
            <DialogDescription>
              Register a new IoT device to your greenhouse system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="device_id">Device ID *</Label>
              <Input
                id="device_id"
                value={newDevice.device_id}
                onChange={(e) => setNewDevice(prev => ({ ...prev, device_id: e.target.value }))}
                placeholder="e.g., ESP32-001"
              />
            </div>
            <div>
              <Label htmlFor="name">Device Name *</Label>
              <Input
                id="name"
                value={newDevice.name}
                onChange={(e) => setNewDevice(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Greenhouse #1"
              />
            </div>
            <div>
              <Label htmlFor="type">Device Type</Label>
              <Select value={newDevice.type} onValueChange={(value) => setNewDevice(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grow_box">Grow Box</SelectItem>
                  <SelectItem value="greenhouse">Greenhouse</SelectItem>
                  <SelectItem value="sensor">Sensor Station</SelectItem>
                  <SelectItem value="irrigation">Irrigation System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="location">Location (Optional)</Label>
              <Input
                id="location"
                value={newDevice.location}
                onChange={(e) => setNewDevice(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., Backyard, Room A"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={addDevice} disabled={saving}>
              {saving ? 'Adding...' : 'Add Device'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Device Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Device Settings - {selectedDevice?.name}</DialogTitle>
            <DialogDescription>
              Configure device parameters and controls
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="parameters" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="parameters">Parameters</TabsTrigger>
              <TabsTrigger value="controls">Controls</TabsTrigger>
            </TabsList>
            
            <TabsContent value="parameters" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center space-x-2">
                    <Thermometer className="h-4 w-4" />
                    <span>Temperature Range (°C)</span>
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={deviceSettings.temperature_min}
                      onChange={(e) => setDeviceSettings(prev => ({ 
                        ...prev, 
                        temperature_min: parseFloat(e.target.value) || 0 
                      }))}
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={deviceSettings.temperature_max}
                      onChange={(e) => setDeviceSettings(prev => ({ 
                        ...prev, 
                        temperature_max: parseFloat(e.target.value) || 0 
                      }))}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="flex items-center space-x-2">
                    <Droplets className="h-4 w-4" />
                    <span>Humidity Range (%)</span>
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={deviceSettings.humidity_min}
                      onChange={(e) => setDeviceSettings(prev => ({ 
                        ...prev, 
                        humidity_min: parseFloat(e.target.value) || 0 
                      }))}
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={deviceSettings.humidity_max}
                      onChange={(e) => setDeviceSettings(prev => ({ 
                        ...prev, 
                        humidity_max: parseFloat(e.target.value) || 0 
                      }))}
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center space-x-2">
                      <Sun className="h-4 w-4" />
                      <span>Light Schedule</span>
                    </Label>
                    <Switch
                      checked={deviceSettings.light_schedule.enabled}
                      onCheckedChange={(checked) => setDeviceSettings(prev => ({
                        ...prev,
                        light_schedule: { ...prev.light_schedule, enabled: checked }
                      }))}
                    />
                  </div>
                  {deviceSettings.light_schedule.enabled && (
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="time"
                        value={deviceSettings.light_schedule.start_time}
                        onChange={(e) => setDeviceSettings(prev => ({
                          ...prev,
                          light_schedule: { ...prev.light_schedule, start_time: e.target.value }
                        }))}
                      />
                      <Input
                        type="time"
                        value={deviceSettings.light_schedule.end_time}
                        onChange={(e) => setDeviceSettings(prev => ({
                          ...prev,
                          light_schedule: { ...prev.light_schedule, end_time: e.target.value }
                        }))}
                      />
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="controls" className="space-y-4">
              {selectedDevice?.status === 'online' ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="flex items-center space-x-2">
                        <Sun className="h-4 w-4" />
                        <span>Light</span>
                      </Label>
                      <Switch
                        checked={getControlValue('light', 'value') as boolean}
                        onCheckedChange={(checked) => controlDevice('light', checked)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Intensity</Label>
                      <Slider
                        value={[getControlValue('light', 'intensity') as number]}
                        onValueChange={([value]) => controlDevice('light', undefined, value)}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="flex items-center space-x-2">
                        <Droplets className="h-4 w-4" />
                        <span>Water Pump</span>
                      </Label>
                      <Switch
                        checked={getControlValue('water_pump', 'value') as boolean}
                        onCheckedChange={(checked) => controlDevice('water_pump', checked)}
                      />
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="flex items-center space-x-2">
                        <Zap className="h-4 w-4" />
                        <span>Fan</span>
                      </Label>
                      <Switch
                        checked={getControlValue('fan', 'value') as boolean}
                        onCheckedChange={(checked) => controlDevice('fan', checked)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Speed</Label>
                      <Slider
                        value={[getControlValue('fan', 'intensity') as number]}
                        onValueChange={([value]) => controlDevice('fan', undefined, value)}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="flex items-center space-x-2">
                        <Thermometer className="h-4 w-4" />
                        <span>Heater</span>
                      </Label>
                      <Switch
                        checked={getControlValue('heater', 'value') as boolean}
                        onCheckedChange={(checked) => controlDevice('heater', checked)}
                      />
                    </div>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-8">
                  <WifiOff className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Device is offline. Controls are not available.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettingsDialog(false)}>
              Close
            </Button>
            <Button onClick={updateDeviceSettings} disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Device Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Device</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedDevice?.name}"? This action cannot be undone and will remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteDevice} disabled={saving}>
              {saving ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}