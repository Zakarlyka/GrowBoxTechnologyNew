import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Thermometer, Droplets, Sun, Sprout, Cpu, Activity, TrendingUp, Plus, Settings, Trash2, Wifi, WifiOff } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart-simple';
import { useDevices } from '@/hooks/useDevices';
import { useSensorData } from '@/hooks/useSensorData';
import { AddDeviceDialog } from './AddDeviceDialog';
import { DeviceCard } from './DeviceCard';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface SensorData {
  time: string;
  temperature: number;
  humidity: number;
  soilMoisture: number;
  lightLevel: number;
}

interface DeviceStatus {
  id: string;
  name: string;
  status: 'online' | 'offline';
  temperature: number;
  humidity: number;
  soilMoisture: number;
  lightLevel: number;
  lastSeen: string;
}

export function Dashboard() {
  const { t } = useTranslation();
  const { devices, loading, deleteDevice, fetchDevices } = useDevices();
  const { sensorData } = useSensorData();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState<string | null>(null);

  const handleDeleteClick = (deviceId: string) => {
    setDeviceToDelete(deviceId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (deviceToDelete) {
      await deleteDevice(deviceToDelete);
      setDeleteDialogOpen(false);
      setDeviceToDelete(null);
    }
  };

  // Mock sensor data for chart (in real app, use data from useSensorData)
  const [chartData, setChartData] = useState<SensorData[]>([]);

  // Generate mock chart data
  useEffect(() => {
    const generateData = () => {
      const now = new Date();
      const newData: SensorData[] = [];
      for (let i = 23; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 60 * 60 * 1000);
        newData.push({
          time: time.toLocaleTimeString('uk-UA', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          temperature: 22 + Math.random() * 8,
          humidity: 60 + Math.random() * 20,
          soilMoisture: 45 + Math.random() * 30,
          lightLevel: Math.max(0, 80 + Math.sin(i / 4) * 60 + Math.random() * 20)
        });
      }
      setChartData(newData);
    };
    generateData();
    const interval = setInterval(generateData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Calculate online/offline status dynamically based on last_seen_at
  // 3-Stage Logic: Stage A+B (0-40s) = Online, Stage C (>40s) = Offline
  const [onlineDevices, setOnlineDevices] = useState(0);
  const totalDevices = devices.length;

  // Recalculate online status every 1 second for real-time reactivity
  useEffect(() => {
    const calculateOnline = () => {
      const now = Date.now();
      const count = devices.filter(d => {
        if (!d.last_seen_at) return false;
        const lastSeen = new Date(d.last_seen_at).getTime();
        return (now - lastSeen) < 40000; // Online if seen within 40 seconds (Stage A + B)
      }).length;
      setOnlineDevices(count);
    };

    calculateOnline();
    const interval = setInterval(calculateOnline, 1000);
    return () => clearInterval(interval);
  }, [devices]);

  const StatCard = ({ title, value, unit, icon: Icon, trend }: any) => {
    return (
      <Card className="gradient-card border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-xl sm:text-2xl font-bold">
            {value}{unit}
          </div>
          {trend && (
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              <span>+2.5% from last hour</span>
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex-1 space-y-4 sm:space-y-6 p-4 sm:p-6 pb-20 lg:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {t('dashboard.title')}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {t('dashboard.subtitle')}
          </p>
        </div>
        <Button className="gradient-primary w-full sm:w-auto min-h-[44px]" onClick={() => setAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('devices.addDevice')}
        </Button>
      </div>

      {/* Stats Cards - Responsive Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title={t('dashboard.totalDevices')} 
          value={totalDevices} 
          unit="" 
          icon={Cpu} 
        />
        <StatCard 
          title={t('dashboard.onlineDevices')} 
          value={onlineDevices} 
          unit="" 
          icon={Wifi} 
        />
        <StatCard 
          title={t('dashboard.offlineDevices')} 
          value={totalDevices - onlineDevices} 
          unit="" 
          icon={WifiOff} 
        />
        <StatCard 
          title={t('dashboard.activity')} 
          value={onlineDevices > 0 ? Math.round((onlineDevices / totalDevices) * 100) : 0} 
          unit="%" 
          icon={Activity} 
        />
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t('dashboard.loadingDevices')}</p>
        </div>
      ) : devices.length === 0 ? (
        <Card className="gradient-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12">
            <Cpu className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mb-4" />
            <p className="text-lg sm:text-xl font-semibold mb-2">{t('dashboard.noDevices')}</p>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 text-center px-4">{t('dashboard.noDevicesDescription')}</p>
            <Button onClick={() => setAddDialogOpen(true)} className="gradient-primary min-h-[44px]">
              <Plus className="mr-2 h-4 w-4" />
              {t('devices.addDevice')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {devices.map(device => <DeviceCard key={device.id} device={device} />)}
        </div>
      )}

      <AddDeviceDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} onDeviceAdded={fetchDevices} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('devices.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('devices.deleteConfirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
