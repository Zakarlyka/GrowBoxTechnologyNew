import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Activity, AlertCircle, Cpu } from 'lucide-react';
import { useDevices } from '@/hooks/useDevices';
import { AddDeviceDialog } from './AddDeviceDialog';
import { FleetDeviceCard } from './FleetDeviceCard';

export function Devices() {
  const { t } = useTranslation();
  const { devices, loading, fetchDevices } = useDevices();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);

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
            Управління парком пристроїв
          </p>
        </div>
        <Button className="gradient-primary min-h-[44px]" onClick={() => setAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('devices.addDevice')}
        </Button>
      </div>

      {/* Fleet Stats - Compact */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
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
            <Button onClick={() => setAddDialogOpen(true)} className="gradient-primary min-h-[44px]">
              <Plus className="mr-2 h-4 w-4" />
              {t('devices.addDevice')}
            </Button>
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
