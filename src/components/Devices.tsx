import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Activity, AlertCircle, Cpu, Beaker } from 'lucide-react';
import { useDevices } from '@/hooks/useDevices';
import { useAuth } from '@/hooks/useAuth';
import { AddDeviceDialog } from './AddDeviceDialog';
import { FleetDeviceCard } from './FleetDeviceCard';
import { SmartHelp } from '@/components/ui/smart-help';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function Devices() {
  const { t } = useTranslation();
  const { devices: allDevices, loading, fetchDevices } = useDevices();
  // Fleet view shows only active (non-archived) devices
  const devices = allDevices.filter(d => d.lifecycle !== 'archived');
  const { user } = useAuth();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [isCreatingDemo, setIsCreatingDemo] = useState(false);

  // Check if demo device already exists
  const hasDemoDevice = devices.some(d => d.type === 'demo' || d.name === 'Demo Growbox');

  // Create Demo Device with mock plant
  const handleCreateDemoDevice = async () => {
    if (!user) return;
    setIsCreatingDemo(true);

    try {
      // Generate unique demo device ID
      const demoDeviceId = `demo_${Date.now()}`;

      // 1. Create demo device
      const { data: deviceData, error: deviceError } = await supabase
        .from('devices')
        .insert({
          user_id: user.id,
          device_id: demoDeviceId,
          name: 'Demo Growbox',
          type: 'demo',
          status: 'offline',
          settings: {
            target_temp: 25,
            target_hum: 60,
            soil_min: 30,
            soil_max: 70,
            light_mode: 1,
            light_start_h: 6,
            light_end_h: 22
          }
        })
        .select()
        .single();

      if (deviceError) throw deviceError;

      // 2. Create mock plant linked to this device
      const { error: plantError } = await supabase
        .from('plants')
        .insert({
          user_id: user.id,
          device_id: demoDeviceId,
          custom_name: 'Demo Plant',
          current_stage: 'vegetative',
          is_main: true,
          start_date: new Date().toISOString().split('T')[0]
        });

      if (plantError) {
        console.warn('Failed to create mock plant:', plantError);
      }

      toast.success(t('devices.demoCreated'), {
        description: t('demoSimulation.watchdogNote')
      });

      fetchDevices();
    } catch (error: any) {
      console.error('Demo device creation error:', error);
      toast.error(t('devices.demoError'), {
        description: error.message
      });
    } finally {
      setIsCreatingDemo(false);
    }
  };

  // 3-Stage Logic: Stage A+B (0-40s) = Online, Stage C (>40s) = Offline
  useEffect(() => {
    const calculateOnline = () => {
      const now = Date.now();
      const count = devices.filter(d => {
        if (!(d as any).last_seen_at) return false;
        const lastSeen = new Date((d as any).last_seen_at).getTime();
        return (now - lastSeen) < 40000;
      }).length;
      setOnlineCount(count);
    };

    calculateOnline();
    const interval = setInterval(calculateOnline, 1000);
    return () => clearInterval(interval);
  }, [devices]);

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {t('devices.title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('devices.subtitle')}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Demo Device Button */}
          {!hasDemoDevice && (
            <SmartHelp content={t('demoSimulation.description')} isText={false}>
              <Button 
                variant="outline" 
                className="min-h-[44px] border-warning/50 text-warning hover:bg-warning/10"
                onClick={handleCreateDemoDevice}
                disabled={isCreatingDemo}
              >
                <Beaker className="mr-2 h-4 w-4" />
                {isCreatingDemo ? t('demoSimulation.simulating') : t('devices.demoGrowbox')}
              </Button>
            </SmartHelp>
          )}
          
          <SmartHelp content={t('help.addDeviceButton')} isText={false}>
            <Button className="gradient-primary min-h-[44px]" onClick={() => setAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('devices.addDevice')}
            </Button>
          </SmartHelp>
        </div>
      </div>

      {/* Fleet Stats - Compact */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <SmartHelp content={t('help.statsTotal')} isText={false}>
          <Card className="gradient-card border-border/50">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{t('dashboard.totalDevices')}</p>
                  <p className="text-2xl font-bold text-foreground">{devices.length}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-primary/10">
                  <Cpu className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </SmartHelp>

        <SmartHelp content={t('help.statsOnline')} isText={false}>
          <Card className="gradient-card border-border/50">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{t('dashboard.onlineDevices')}</p>
                  <p className="text-2xl font-bold text-success">{onlineCount}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-success/10">
                  <Activity className="h-5 w-5 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
        </SmartHelp>

        <SmartHelp content={t('help.statsOffline')} isText={false}>
          <Card className="gradient-card border-border/50">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{t('dashboard.offlineDevices')}</p>
                  <p className="text-2xl font-bold text-destructive">{devices.length - onlineCount}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-destructive/10">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
        </SmartHelp>

        <SmartHelp content={t('help.statsActivity')} isText={false}>
          <Card className="gradient-card border-border/50">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{t('dashboard.activity')}</p>
                  <p className="text-2xl font-bold text-foreground">
                    {devices.length > 0 ? Math.round((onlineCount / devices.length) * 100) : 0}%
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-accent/10">
                  <Activity className="h-5 w-5 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </SmartHelp>
      </div>

      {/* Device Fleet List */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : devices.length === 0 ? (
        <Card className="gradient-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Cpu className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-semibold mb-2">{t('dashboard.noDevices')}</p>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              {t('dashboard.noDevicesDescription')}
            </p>
            <SmartHelp content={t('help.addDeviceButton')} isText={false}>
              <Button onClick={() => setAddDialogOpen(true)} className="gradient-primary min-h-[44px]">
                <Plus className="mr-2 h-4 w-4" />
                {t('devices.addDevice')}
              </Button>
            </SmartHelp>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {devices.map(device => (
            <FleetDeviceCard key={device.id} device={device} />
          ))}
        </div>
      )}

      <AddDeviceDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} onDeviceAdded={fetchDevices} />
    </div>
  );
}
