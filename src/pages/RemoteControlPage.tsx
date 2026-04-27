import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RemoteControl } from '@/components/RemoteControl';
import { Terminal } from '@/components/Terminal';
import { SensorChart } from '@/components/SensorChart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Gamepad2, Terminal as TerminalIcon, TrendingUp, Wifi, Cpu } from 'lucide-react';
import { useDevices } from '@/hooks/useDevices';
import { useNavigate } from 'react-router-dom';

export function RemoteControlPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { devices, loading } = useDevices();
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

  // Auto-select first device once data loads
  useEffect(() => {
    if (!selectedDeviceId && devices.length > 0) {
      setSelectedDeviceId(devices[0].id);
    }
  }, [devices, selectedDeviceId]);

  const currentDevice = useMemo(
    () => devices.find(d => d.id === selectedDeviceId) ?? null,
    [devices, selectedDeviceId]
  );

  // Live online status (matches Dashboard logic: <40s since last_seen_at)
  const isOnline = useMemo(() => {
    if (!currentDevice?.last_seen_at) return false;
    return Date.now() - new Date(currentDevice.last_seen_at).getTime() < 40000;
  }, [currentDevice?.last_seen_at]);

  const handleControlChange = (control: string, value: any) => {
    // Real telemetry/control updates flow through DeviceControls + Supabase.
    // This callback is a passthrough for the legacy RemoteControl widget.
    // eslint-disable-next-line no-console
    console.log(`Device ${selectedDeviceId} - ${control}:`, value);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-12 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Empty state — no real devices paired yet
  if (devices.length === 0) {
    return (
      <div className="container mx-auto py-12 flex flex-col items-center justify-center text-center">
        <Cpu className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2">
          {t('dashboard.noDevices', 'Немає пристроїв')}
        </h2>
        <p className="text-muted-foreground mb-4 max-w-md">
          {t(
            'remoteControl.noDevicesHint',
            'Спочатку підключіть GrowBox у розділі «Пристрої», щоб керувати ним з цієї сторінки.'
          )}
        </p>
        <Button onClick={() => navigate('/devices')} className="gradient-primary">
          {t('dashboard.goToDevices', 'До пристроїв')}
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t('navigation.remoteControl')}</h1>
          <p className="text-muted-foreground">
            {t(
              'remoteControl.subtitle',
              'Розширене керування підключеними IoT-пристроями.'
            )}
          </p>
        </div>

        <Select
          value={selectedDeviceId ?? undefined}
          onValueChange={(v) => setSelectedDeviceId(v)}
        >
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder={t('remoteControl.selectDevice', 'Оберіть пристрій')} />
          </SelectTrigger>
          <SelectContent>
            {devices.map((device) => {
              const deviceOnline =
                !!device.last_seen_at &&
                Date.now() - new Date(device.last_seen_at).getTime() < 40000;
              return (
                <SelectItem key={device.id} value={device.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        deviceOnline ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    />
                    <span>{device.name}</span>
                    {device.location && (
                      <span className="text-muted-foreground">— {device.location}</span>
                    )}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {currentDevice && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="w-5 h-5" />
                {currentDevice.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-4">
                <Badge variant={isOnline ? 'default' : 'destructive'}>
                  {isOnline ? 'Online' : 'Offline'}
                </Badge>
                {currentDevice.location && (
                  <span className="text-sm text-muted-foreground">
                    {t('remoteControl.location', 'Розташування')}: {currentDevice.location}
                  </span>
                )}
                {currentDevice.last_seen_at && (
                  <span className="text-sm text-muted-foreground">
                    {t('remoteControl.lastSeen', 'Останній сигнал')}:{' '}
                    {new Date(currentDevice.last_seen_at).toLocaleString()}
                  </span>
                )}
                <span className="text-xs font-mono text-muted-foreground">
                  ID: {currentDevice.device_id}
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-4">
            <Tabs defaultValue="controls" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="controls" className="flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4" />
                  {t('remoteControl.tabs.controls', 'Керування')}
                </TabsTrigger>
                <TabsTrigger value="terminal" className="flex items-center gap-2">
                  <TerminalIcon className="w-4 h-4" />
                  {t('remoteControl.tabs.terminal', 'Термінал')}
                </TabsTrigger>
                <TabsTrigger value="charts" className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  {t('remoteControl.tabs.charts', 'Графіки')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="controls" className="space-y-4">
                <RemoteControl
                  deviceId={currentDevice.device_id}
                  deviceName={currentDevice.name}
                  onControlChange={handleControlChange}
                />
              </TabsContent>

              <TabsContent value="terminal" className="space-y-4">
                <Terminal
                  deviceId={currentDevice.device_id}
                  deviceName={currentDevice.name}
                  isConnected={isOnline}
                />
              </TabsContent>

              <TabsContent value="charts" className="space-y-4">
                <SensorChart
                  deviceId={currentDevice.device_id}
                  deviceName={currentDevice.name}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
    </div>
  );
}
