import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Thermometer, Droplets, Sprout, Sun, Moon, Wifi, WifiOff, Trash2, Pencil, Check, X, QrCode } from 'lucide-react';
import { useDevices } from '@/hooks/useDevices';
import { useDeviceLogs } from '@/hooks/useDeviceLogs';
import { useDeviceControls } from '@/hooks/useDeviceControls';
import { useDeviceSchedules } from '@/hooks/useDeviceSchedules';
import { DeviceControls } from '@/components/DeviceControls';
import { LogsTable } from '@/components/LogsTable';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart-simple';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { calculatePhotoperiod, isWithinLightSchedule, formatTime } from '@/lib/utils';
import QRCode from 'react-qr-code';
export default function DeviceDetail() {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const navigate = useNavigate();
  const {
    devices,
    loading,
    deleteDevice
  } = useDevices();
  const device = devices.find(d => d.id === id);
  const {
    logs,
    latestLog
  } = useDeviceLogs(id);
  const {
    settings
  } = useDeviceControls(device?.device_id || null);
  const {
    schedules
  } = useDeviceSchedules(id || '');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [timeInterval, setTimeInterval] = useState('24h');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(device?.name || '');
  const handleDelete = async () => {
    if (id) {
      await deleteDevice(id);
      navigate('/');
    }
  };
  const handleSaveName = async () => {
    if (!editedName.trim() || !device) return;
    try {
      const {
        error
      } = await supabase.from('devices').update({
        name: editedName.trim()
      }).eq('id', device.id);
      if (error) throw error;
      toast({
        title: 'Успіх',
        description: 'Назву пристрою оновлено'
      });
      setIsEditingName(false);
      window.location.reload(); // Simple refresh to update the name
    } catch (error: any) {
      console.error('Rename error:', error);
      toast({
        title: 'Помилка',
        description: error.message,
        variant: 'destructive'
      });
    }
  };
  const handleCancelEdit = () => {
    setEditedName(device?.name || '');
    setIsEditingName(false);
  };
  if (loading) {
    return <div className="flex-1 flex items-center justify-center p-6">
        <p className="text-muted-foreground">Завантаження...</p>
      </div>;
  }
  if (!device) {
    return <div className="flex-1 flex flex-col items-center justify-center p-6">
        <p className="text-xl text-muted-foreground mb-4">Пристрій не знайдено</p>
        <Button onClick={() => navigate('/')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Повернутися
        </Button>
      </div>;
  }
  const isOnline = device.status === 'online';

  // Get light mode from settings
  const getLightMode = () => {
    if (!settings) return null;
    
    const lightMode = (settings as any).light_mode ?? 1;
    const startH = (settings as any).light_start_h ?? 6;
    const startM = (settings as any).light_start_m ?? 0;
    const endH = (settings as any).light_end_h ?? 22;
    const endM = (settings as any).light_end_m ?? 0;

    const { dayHours, nightHours } = calculatePhotoperiod(startH, endH);
    const isDay = isWithinLightSchedule(startH, startM, endH, endM);

    return {
      isDay,
      dayHours,
      nightHours,
      startTime: formatTime(startH, startM),
      endTime: formatTime(endH, endM),
    };
  };
  const lightMode = getLightMode();

  // Prepare chart data based on selected interval
  const getFilteredLogs = () => {
    const now = new Date();
    const hoursMap: Record<string, number> = {
      '1h': 1,
      '6h': 6,
      '12h': 12,
      '24h': 24,
      '7d': 168
    };
    const hours = hoursMap[timeInterval] || 24;
    const cutoffTime = new Date(now.getTime() - hours * 60 * 60 * 1000);
    return logs.filter(log => new Date(log.timestamp) >= cutoffTime);
  };
  const filteredLogs = getFilteredLogs();
  const chartData = filteredLogs.slice(0, 100).reverse().map(log => ({
    time: new Date(log.timestamp).toLocaleTimeString('uk-UA', {
      hour: '2-digit',
      minute: '2-digit'
    }),
    temperature: log.temperature || 0,
    humidity: log.humidity || 0,
    soil_moisture: log.soil_moisture || 0,
    light_level: log.light_level || 0
  }));
  return <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Панель керування</h1>
            <p className="text-muted-foreground">
              Моніторинг та керування пристроєм
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={isOnline ? 'default' : 'destructive'} className="flex items-center gap-1">
            {isOnline ? <>
                <Wifi className="h-3 w-3" />
                Online
              </> : <>
                <WifiOff className="h-3 w-3" />
                Offline
              </>}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => setQrDialogOpen(true)}>
            <QrCode className="h-4 w-4 mr-2" />
            Показати QR / Перепідключити
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Видалити
          </Button>
        </div>
      </div>

      {/* Device Info Card */}
      <Card className="gradient-card border-border/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            {isEditingName ? <>
                <Input value={editedName} onChange={e => setEditedName(e.target.value)} className="text-xl font-semibold max-w-md" autoFocus onKeyDown={e => {
              if (e.key === 'Enter') handleSaveName();
              if (e.key === 'Escape') handleCancelEdit();
            }} />
                <Button size="sm" variant="ghost" onClick={handleSaveName}>
                  <Check className="h-4 w-4 text-success" />
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                  <X className="h-4 w-4 text-destructive" />
                </Button>
              </> : <>
                <CardTitle className="text-xl">{device.name}</CardTitle>
                <Button size="sm" variant="ghost" onClick={() => {
              setEditedName(device.name);
              setIsEditingName(true);
            }}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </>}
          </div>
          {device.location && <p className="text-sm text-muted-foreground">{device.location}</p>}
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
              <div className="flex items-center space-x-2">
                <Thermometer className="h-4 w-4 text-accent" />
                <span className="text-sm text-muted-foreground">Температура</span>
              </div>
              <span className="text-lg font-semibold text-foreground">
                {latestLog?.temperature?.toFixed(1) || device.last_temp?.toFixed(1) || '--'}°C
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
              <div className="flex items-center space-x-2">
                <Droplets className="h-4 w-4 text-accent" />
                <span className="text-sm text-muted-foreground">Вологість</span>
              </div>
              <span className="text-lg font-semibold text-foreground">
                {latestLog?.humidity?.toFixed(0) || device.last_hum?.toFixed(0) || '--'}%
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
              <div className="flex items-center space-x-2">
                <Sprout className="h-4 w-4 text-accent" />
                <span className="text-sm text-muted-foreground">Ґрунт</span>
              </div>
              <span className="text-lg font-semibold text-foreground">
                {latestLog?.soil_moisture?.toFixed(0) || '--'}%
              </span>
            </div>

            <div className={`flex flex-col gap-2 p-3 rounded-lg border border-border/30 transition-colors ${lightMode?.isDay ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-blue-500/10 border-blue-500/30'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {lightMode?.isDay ? <Sun className="h-4 w-4 text-yellow-500" /> : <Moon className="h-4 w-4 text-blue-500" />}
                  <span className="text-sm text-muted-foreground">Світло</span>
                </div>
                {lightMode && (
                  <span className="text-lg font-semibold text-foreground flex items-center gap-1">
                    {lightMode.isDay ? '☀️ День' : '🌙 Ніч'}
                  </span>
                )}
              </div>
              {lightMode ? (
                <div className="text-sm text-muted-foreground">
                  День {lightMode.dayHours}год / Ніч {lightMode.nightHours}год
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">--</span>
              )}
            </div>
          </div>

          {(device.last_seen || device.last_seen_at) && <div className="pt-2 border-t border-border/30">
              <p className="text-xs text-muted-foreground text-center">
                Остання активність: {(() => {
              const date = new Date(device.last_seen_at || device.last_seen!);
              const day = String(date.getDate()).padStart(2, '0');
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const year = date.getFullYear();
              const hours = String(date.getHours()).padStart(2, '0');
              const minutes = String(date.getMinutes()).padStart(2, '0');
              const seconds = String(date.getSeconds()).padStart(2, '0');
              return `${day}.${month}.${year}, ${hours}:${minutes}:${seconds}`;
            })()}
              </p>
            </div>}
        </CardContent>
      </Card>

      {/* Device Controls */}
      <DeviceControls deviceId={device.device_id} />

      {/* Chart */}
      <Card className="gradient-card border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Історія показників (
              {timeInterval === '1h' ? '1 год' : timeInterval === '6h' ? '6 год' : timeInterval === '12h' ? '12 год' : timeInterval === '24h' ? '24 год' : '7 днів'})
            </CardTitle>
            <Tabs value={timeInterval} onValueChange={setTimeInterval}>
              <TabsList>
                <TabsTrigger value="1h">1 год</TabsTrigger>
                <TabsTrigger value="6h">6 год</TabsTrigger>
                <TabsTrigger value="12h">12 год</TabsTrigger>
                <TabsTrigger value="24h">24 год</TabsTrigger>
                <TabsTrigger value="7d">7 днів</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            {chartData.length > 0 ? <ChartContainer config={{}}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="temperature" stroke="hsl(0 75% 60%)" strokeWidth={2} name="Температура" />
                    <Line type="monotone" dataKey="humidity" stroke="hsl(210 100% 56%)" strokeWidth={2} name="Вологість" />
                    <Line type="monotone" dataKey="soil_moisture" stroke="hsl(120 60% 45%)" strokeWidth={2} name="Вологість ґрунту" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer> : <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Немає даних для відображення</p>
              </div>}
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <LogsTable deviceId={device.id} />

      {device.last_seen && <p className="text-sm text-muted-foreground text-center">
          Останнє оновлення: {new Date(device.last_seen).toLocaleString('uk-UA')}
        </p>}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити пристрій?</AlertDialogTitle>
            <AlertDialogDescription>
              Цю дію неможливо скасувати. Пристрій "{device.name}" буде видалено назавжди разом з усіма даними.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Скасувати</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Видалити
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>QR-код для перепідключення</DialogTitle>
            <DialogDescription>
              Використовуйте цей QR-код для повторного підключення пристрою до мережі
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-center p-6 bg-white rounded-lg">
              <QRCode 
                value={`http://192.168.4.1/?token=${device.device_id}`} 
                size={200} 
              />
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                ID пристрою: <span className="font-mono font-semibold">{device.device_id}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Відскануйте QR-код через додаток або камеру для перепідключення
              </p>
            </div>
            <Button onClick={() => setQrDialogOpen(false)} className="w-full">
              Закрити
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>;
}