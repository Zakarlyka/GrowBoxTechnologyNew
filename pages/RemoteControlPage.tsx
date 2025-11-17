import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RemoteControl } from '@/components/RemoteControl';
import { Terminal } from '@/components/Terminal';
import { SensorChart } from '@/components/SensorChart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Gamepad2, Terminal as TerminalIcon, TrendingUp, Wifi } from 'lucide-react';

export function RemoteControlPage() {
  const { t } = useTranslation();
  const [selectedDevice, setSelectedDevice] = useState('device-1');
  
  // Mock devices - in real app, fetch from Supabase
  const devices = [
    { id: 'device-1', name: 'Grow Box #1', status: 'online', location: 'Кімната 1' },
    { id: 'device-2', name: 'Grow Box #2', status: 'offline', location: 'Кімната 2' },
    { id: 'device-3', name: 'Grow Box #3', status: 'online', location: 'Балкон' },
  ];

  const currentDevice = devices.find(d => d.id === selectedDevice) || devices[0];

  const handleControlChange = (control: string, value: any) => {
    console.log(`Device ${selectedDevice} - ${control}:`, value);
    // In real app, send to Supabase or device API
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('navigation.remoteControl')}</h1>
          <p className="text-muted-foreground">
            RemoteXY-inspired control interface for IoT devices
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={selectedDevice} onValueChange={setSelectedDevice}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select device" />
            </SelectTrigger>
            <SelectContent>
              {devices.map((device) => (
                <SelectItem key={device.id} value={device.id}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      device.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    {device.name} - {device.location}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Device Status Card */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="w-5 h-5" />
              Device Status: {currentDevice.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Badge variant={currentDevice.status === 'online' ? "default" : "destructive"}>
                {currentDevice.status === 'online' ? 'Online' : 'Offline'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Location: {currentDevice.location}
              </span>
              <span className="text-sm text-muted-foreground">
                Last seen: {new Date().toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <div className="lg:col-span-4">
          <Tabs defaultValue="controls" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="controls" className="flex items-center gap-2">
                <Gamepad2 className="w-4 h-4" />
                Remote Controls
              </TabsTrigger>
              <TabsTrigger value="terminal" className="flex items-center gap-2">
                <TerminalIcon className="w-4 h-4" />
                Terminal
              </TabsTrigger>
              <TabsTrigger value="charts" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Live Charts
              </TabsTrigger>
            </TabsList>

            <TabsContent value="controls" className="space-y-4">
              <RemoteControl
                deviceId={selectedDevice}
                deviceName={currentDevice.name}
                onControlChange={handleControlChange}
              />
            </TabsContent>

            <TabsContent value="terminal" className="space-y-4">
              <Terminal
                deviceId={selectedDevice}
                deviceName={currentDevice.name}
                isConnected={currentDevice.status === 'online'}
              />
            </TabsContent>

            <TabsContent value="charts" className="space-y-4">
              <SensorChart
                deviceId={selectedDevice}
                deviceName={currentDevice.name}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}